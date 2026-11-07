import {HeadlessSketchWorkspace} from './workspace';
import {replaySketchTransition} from './sketchTransition';
import {solveSketch} from './solve';
import {AlgNumConstraint,ConstraintDefinitions} from '../constr/ANConstraints';
import {EndPoint} from '../shapes/point';
import {Segment} from '../shapes/segment';
import {Circle} from '../shapes/circle';
import {Arc} from '../shapes/arc';
import {isInstanceOf} from '../actions/matchUtils';
import {assertAllowedSolverGeometry} from './transitionGeometryPolicy.mjs';
import {sameRestoredSketch} from '../historyEquivalence.mjs';

const fail=(code:string,message:string)=>Object.assign(new Error(message),{code});
function record(value:any,keys:string[]) {
 if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==keys.length)throw fail('INVALID','Invalid coordinate transition record.');
 const out:any={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw fail('INVALID','Coordinate fields must be data.');out[key]=d.value;}return out;
}
function external(value:any) {
 if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))throw fail('INVALID','External parameters must be a plain numeric record.');
 const keys=Reflect.ownKeys(value),out=Object.create(null);if(keys.length>1024)throw fail('LIMIT','Too many external parameters.');
 for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(typeof key!=='string'||!key||key.length>256||!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value')||typeof d.value!=='number'||!Number.isFinite(d.value)||Math.abs(d.value)>1e9)throw fail('INVALID','Invalid external parameter.');out[key]=d.value;}return out;
}
function nativePoint(sketch:any,id:string) {
 const found=[];
 for(const o of sketch.objects){if(o.type==='Point'&&o.id===id)found.push(o.data);else if(o.type==='Segment'||o.type==='Arc'){if(o.id+':A'===id)found.push(o.data.a);if(o.id+':B'===id)found.push(o.data.b);if(o.type==='Arc'&&o.id+':C'===id)found.push(o.data.c);}else if(o.type==='Circle'&&o.id+':C'===id)found.push(o.data.c);}
 if(found.length!==1)throw fail('INVALID_TARGET','Select one native Point, Segment endpoint, Circle center or Arc endpoint/center.');return found[0];
}
function verifyTarget(sketch:any,intent:any) {
 const p=nativePoint(sketch,intent.id);
 // This command never reports a relaxed target as success. Equality is numeric
 // equality (native JSON canonicalizes -0 to 0), not a scaled solver tolerance.
 if(p.x!==intent.x||p.y!==intent.y)throw fail('COORDINATE_NOT_REACHED','The requested coordinates were not retained exactly.');
}
function removeTemporaryIntents(before:any,after:any,stage:number,drivers:any[]) {
 if(before.objects.length!==after.objects.length||before.stages.length!==after.stages.length)throw fail('INTENT_CHANGED','Sketch structure changed.');
 after.objects.forEach((o,i)=>{if(o.type!==before.objects[i]?.type)throw fail('INTENT_CHANGED','Sketch object type changed.');assertAllowedSolverGeometry(o.type,before.objects[i].data,o.data);});
 for(const {index,intent,status} of [...drivers].sort((a,b)=>b.index-a.index)){
  const row=after.stages[stage]?.constraints[index];
  if(row?.typeId!=='LockPoint'||row.stage!==stage||row.objects?.length!==1||row.objects[0]!==intent.id||JSON.stringify(row.constants)!==JSON.stringify({x:String(intent.x),y:String(intent.y)})||row.admission?.version!==1||row.admission.state!==status)throw fail('INTENT_CHANGED','Temporary driving identity changed.');
  after.stages[stage].constraints.splice(index,1);
 }
 const restored={...after,objects:after.objects.map((o,i)=>({...o,data:before.objects[i].data}))};
 if(!sameRestoredSketch(JSON.stringify(before),JSON.stringify(restored)))throw fail('INTENT_CHANGED','Existing authored sketch intent changed.');
}

function capturePoint(value:any){
 const intent=record(value,['id','x','y']);
 if(typeof intent.id!=='string'||!intent.id||intent.id.length>256)throw fail('INVALID_TARGET','A stable native point ID is required.');
 if(![intent.x,intent.y].every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e8))throw fail('COORDINATE_DOMAIN','Coordinates must be finite sketch millimetres within ±100,000,000.');
 return intent;
}
function capturePoints(value:any){
 if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype||value.length<1||value.length>32||Reflect.ownKeys(value).length!==value.length+1)throw fail('INVALID_TARGET','Choose one to32 unique native points.');
 const points=[];for(let i=0;i<value.length;i++){const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw fail('INVALID','Coordinate points must be dense data.');points.push(capturePoint(d.value));}
 if(new Set(points.map(p=>p.id)).size!==points.length)throw fail('INVALID_TARGET','Choose distinct native point IDs.');return points;
}

// Ordinary geometry edit, not a persistent dimension or a native-source setter.
// Disposable Worker only; no live editor/cache/history/publication is supplied.
function editCoordinatesTransition(request:any,batch:boolean) {
 let revision='';
 try {
  const d=request&&typeof request==='object'?Object.getOwnPropertyDescriptor(request,'revision'):null;
  if(d?.enumerable&&Object.prototype.hasOwnProperty.call(d,'value')&&typeof d.value==='string'&&d.value.length<=256)revision=d.value;
  const args=record(request,['revision','sketchJSON','externalParameters','intent']);
  if(typeof args.revision!=='string'||!args.revision||args.revision.length>256)throw fail('INVALID','Invalid coordinate revision.');revision=args.revision;
  const intents=batch?capturePoints(record(args.intent,['points']).points):[capturePoint(args.intent)];
  const bindings=external(args.externalParameters),captured=replaySketchTransition({revision,sketchJSON:args.sketchJSON,externalParameters:bindings});
  if(!captured.ok||!('serializedSketch' in captured))return captured;
  const before=JSON.parse(captured.serializedSketch);if(before.objects.length>1024)throw fail('LIMIT','Too many sketch objects for this command.');
  intents.forEach(intent=>nativePoint(before,intent.id));
  const workspace=new HeadlessSketchWorkspace(bindings);workspace.io._loadSketch(before,{strict:true});
  const pm=workspace.parametricManager,index=workspace.createIndex(),targets=intents.map(intent=>{
   const point=index[intent.id];
   if(!isInstanceOf(point,EndPoint)||!point.stage||!pm.stages.includes(point.stage))throw fail('INVALID_TARGET','The target is not an editable point in this sketch.');
   const parent=point.parent,supported=!parent||(isInstanceOf(parent,Segment)&&(point===parent.a||point===parent.b))||(isInstanceOf(parent,Circle)&&point===parent.c)||(isInstanceOf(parent,Arc)&&(point===parent.a||point===parent.b||point===parent.c));
   if(!supported)throw fail('INVALID_TARGET','This point parent is not supported.');
   if(point.isGenerated)throw fail('GENERATED_TARGET','Edit the authored generator input instead of its generated points.');
   let grouped=false;point.ancestry(o=>{if(o.TYPE==='RigidGroup'||[...o.constraints].some((c:any)=>c.schema.id==='RigidGroup'))grouped=true;});
   if(grouped)throw fail('RIGID_TARGET','Rigid-group member coordinate edits are not supported.');
   return {intent,point,parent};
  });
  const stage=targets[0].point.stage;if(targets.some(t=>t.point.stage!==stage))throw fail('UNSUPPORTED_STAGE','Coordinate batch targets must share one authored stage.');
  const receipt=()=>batch?{points:intents.map(p=>({id:p.id,x:p.x,y:p.y}))}:{point:{id:intents[0].id,x:intents[0].x,y:intents[0].y}};
  if(targets.every(({intent,point})=>{const saved=nativePoint(before,intent.id);return saved.x===intent.x&&saved.y===intent.y&&point.x===intent.x&&point.y===intent.y;}))return {revision,ok:true as const,serializedSketch:args.sketchJSON,evidence:captured.evidence,...receipt()};
  const temporaries=targets.map(({intent,point})=>{const c=new AlgNumConstraint(ConstraintDefinitions.LockPoint,[point],{x:String(intent.x),y:String(intent.y)});c.validateCandidateConstants(c.constants,v=>pm.constantResolver(v));return c;});
  const validate=stages=>{
   if(temporaries.some(c=>c.stage!==stage||!stage.algNumSystem.allConstraints.includes(c)))throw fail('COORDINATE_CONFLICT','The coordinate driver was not admitted.');
   for(const s of stages){const sys=s.algNumSystem,prior=sys.transactionBefore;
    for(const c of sys.allConstraints){const wasRejected=prior.conflicting.has(c)&&!prior.redundant.has(c),rejected=sys.conflicting.has(c)&&!sys.redundant.has(c);if((temporaries.includes(c)||!wasRejected)&&rejected)throw fail('COORDINATE_CONFLICT','The requested coordinates conflict with existing constraints.');}
   }
   if(targets.some(({point,intent})=>point.x!==intent.x||point.y!==intent.y))throw fail('COORDINATE_NOT_REACHED','The requested coordinates were not reached exactly.');
  };
  pm.startTransaction();try{
   // Seed the requested drag geometry before admission so unconstrained
   // intrinsic Segment angle/length parameters describe the new endpoints.
   // Authored dimension/lock constants are deliberately never updated.
   for(const {point,intent} of targets)point.setXY(intent.x,intent.y);
   for(const parent of new Set(targets.map(t=>t.parent).filter(Boolean)))parent.syncGeometry();
   for(const temporary of temporaries)pm._add(temporary);pm.finishTransaction(validate,false);
  }catch(error){if(pm.inTransaction)try{pm.finishTransaction(()=>{throw error},false)}catch(_){}throw error;}
  // Run the ordinary stage solve/generator pass while the temporary driver
  // still enforces the target; dependent generated geometry must travel too.
  for(const currentStage of pm.stages){currentStage.solverSystem.prepare();currentStage.solve(false);}
  const authored=stage.algNumSystem.allConstraints.filter(c=>!c.internal),drivers=temporaries.map((c,i)=>({index:authored.indexOf(c),intent:intents[i],status:stage.algNumSystem.redundant.has(c)?'redundant':'accepted'}));
  if(drivers.some(d=>d.index<0))throw fail('INTENT_CHANGED','The temporary driver disappeared.');
  const candidate=JSON.parse(workspace.io.serializeSketch(before.metadata,{strict:true}));candidate.boundary=before.boundary;
  removeTemporaryIntents(before,candidate,stage.index,drivers);intents.forEach(intent=>verifyTarget(candidate,intent));
  const solved=solveSketch({revision,sketch:candidate,boundary:structuredClone(candidate.boundary),externalParameters:bindings});if(!solved.ok)return solved;
  intents.forEach(intent=>verifyTarget(solved.sketch,intent));
  const serializedSketch=JSON.stringify(solved.sketch);
  if(serializedSketch.length>1048576||new TextEncoder().encode(serializedSketch).byteLength>1048576)throw fail('LIMIT','The resulting sketch exceeds its limit.');
  if(!sameRestoredSketch(JSON.stringify(candidate),serializedSketch))throw fail('CURRENT_GEOMETRY_MISMATCH','Verification changed the candidate geometry or authored intent.');
  const rows=solved.sketch.stages.flatMap(s=>s.constraints);
  if(rows.length!==solved.evidence.length||rows.some((c,i)=>c.typeId!==solved.evidence[i].typeId||c.admission?.version!==1||c.admission.state!==solved.evidence[i].state))throw fail('ADMISSION_CHANGED','Existing admission changed.');
  return {revision,ok:true as const,serializedSketch,evidence:solved.evidence,...receipt()};
 }catch(error){return {revision,ok:false as const,error:{code:typeof error?.code==='string'?error.code:'INVALID',message:typeof error?.message==='string'?error.message:'Coordinate transition failed.'}};}
}

// Preserve the existing single-point wire and metadata exactly.
export function editPointCoordinatesTransition(request:any){return editCoordinatesTransition(request,false);}
export function editPointsCoordinatesTransition(request:any){return editCoordinatesTransition(request,true);}
