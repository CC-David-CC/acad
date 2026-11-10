import {materializePatternCaches} from '../generators/patternSource.mjs';
import {materializeOffsetCaches} from '../generators/offsetSource.mjs';
import {HeadlessSketchWorkspace} from './workspace';
import {solveSketch} from './solve';
import {formatSolveTerminations} from '../constr/solverTermination.mjs';
import {AlgNumConstraint,ConstraintDefinitions} from '../constr/ANConstraints';
import {EndPoint} from '../shapes/point';
import {Segment} from '../shapes/segment';
import {Circle} from '../shapes/circle';
import {Arc} from '../shapes/arc';
import {isInstanceOf} from '../actions/matchUtils';
import {assertAllowedSolverGeometry} from './transitionGeometryPolicy.mjs';
import {sameRestoredSketch} from '../historyEquivalence.mjs';
import {captureConnectedGeometryScope,applyCapturedGeometry,assertCapturedGeometryScope,firstCapturedGeometryDifference} from './capturedGeometryScope';
import {evaluateCapturedSketch} from './capturedSketchEvaluation';
import {assertVerifiedReplayGeometry} from './verifiedReplayGeometry';
import {validateConstraintGeometry} from './sketchValidation';
import {causeForSolveStatus,failureCause,withAdmissionCause} from '../constr/admissionCause.mjs';

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
 if(p.x!==intent.x||p.y!==intent.y)throw fail('COORDINATE_NOT_REACHED',('The requested coordinates were not retained exactly. '+intent.id.slice(-128)+': ['+p.x+','+p.y+'] vs ['+intent.x+','+intent.y+']').slice(0,512));
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
 if(!sameRestoredSketch(JSON.stringify(before),JSON.stringify(restored)))throw fail('INTENT_CHANGED',('Existing authored sketch intent changed. First difference: '+firstCapturedGeometryDifference(before,restored)).slice(0,512));
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

function boundedText(value:any){if(typeof value!=='string'||value.length>1048576||new TextEncoder().encode(value).byteLength>1048576)throw fail('LIMIT','Coordinate source exceeds1MiB.');return value;}
function coordinateProofFailure(result:any,phase:string,stops:any[]=[]){const diagnostic=formatSolveTerminations(stops);return{...result,error:{...result.error,message:(phase+': '+result.error.message).slice(0,512-diagnostic.length)+diagnostic}};}
function coldCoordinates(revision:string,sketch:any,bindings:any){let auxiliary:any;const stops=[];const result=solveSketch({revision,sketch:structuredClone(sketch),boundary:structuredClone(sketch.boundary),externalParameters:bindings},undefined,batch=>{auxiliary=batch;},observation=>{if(stops.length<8)stops.push(observation);});return{result,auxiliary,stops};}
function proveCoordinateGeometry(before:any,after:any,evidence:any[],bindings:any,phase:string,stops:any[]=[]){try{assertVerifiedReplayGeometry(before,after,evidence,bindings);}catch(error){const diagnostic=formatSolveTerminations(stops),detail=phase+': '+(error?.message||'Coordinate geometry differs.')+' First difference: '+firstCapturedGeometryDifference(before,after);throw withAdmissionCause(fail(typeof error?.code==='string'?error.code:'CURRENT_GEOMETRY_MISMATCH',detail.slice(0,512-diagnostic.length)+diagnostic),failureCause(error));}}
function resolveTargets(pm:any,index:any,intents:any[]){
 const targets=intents.map(intent=>{const point=index[intent.id];
  if(!isInstanceOf(point,EndPoint)||!point.stage||!pm.stages.includes(point.stage))throw fail('INVALID_TARGET','The target is not an editable point in this sketch.');
  const parent=point.parent,supported=!parent||(isInstanceOf(parent,Segment)&&(point===parent.a||point===parent.b))||(isInstanceOf(parent,Circle)&&point===parent.c)||(isInstanceOf(parent,Arc)&&(point===parent.a||point===parent.b||point===parent.c));
  if(!supported)throw fail('INVALID_TARGET','This point parent is not supported.');if(point.isGenerated)throw fail('GENERATED_TARGET','Edit the authored generator input instead of its generated points.');
  let grouped=false;point.ancestry(o=>{if(o.TYPE==='RigidGroup'||[...o.constraints].some((c:any)=>c.schema.id==='RigidGroup'))grouped=true;});if(grouped)throw fail('RIGID_TARGET','Rigid-group member coordinate edits are not supported.');
  return{intent,point,parent};
 });
 if(targets.some(t=>t.point.stage!==targets[0].point.stage))throw fail('UNSUPPORTED_STAGE','Coordinate batch targets must share one authored stage.');return targets;
}
function captureCoordinateScope(before:any,bindings:any,intents:any[],evidence:any[],auxiliary:any){
 const captured=captureConnectedGeometryScope(before,bindings,evidence,auxiliary,(_w,pm,index)=>{
  const targets=resolveTargets(pm,index,intents),parameters=[];
  const fields=targets.map(({point,parent,intent})=>{parameters.push(point.params.x,point.params.y);const root=parent||point,prefix=!parent?'':point===parent.a?'a.':point===parent.b?'b.':'c.';if(!before.objects.some(row=>row.id===root.id&&index[row.id]===root))throw fail('INVALID_TARGET','The target has no actual authored source root.');return{id:intent.id,rootId:root.id,x:prefix+'x',y:prefix+'y'};});
  return{parameters,value:{stage:targets[0].point.stage.index,targets:fields}};
 },'Coordinate edit');
 for(let i=0;i<intents.length;i++){const selected=captured.selection.targets[i],saved=nativePoint(before,intents[i].id),allowed=captured.fields.get(selected.rootId);for(const axis of['x','y'])if(saved[axis]!==intents[i][axis]&&!allowed?.has(selected[axis]))throw fail('COORDINATE_CONFLICT','The requested coordinates conflict with an exact fixed source point.');}
 return captured;
}

// Ordinary geometry edit, not a persistent dimension or a native-source setter.
// Publish original source plus only the actual authorized warm component delta.
function editCoordinatesTransition(request:any,batch:boolean) {
 let revision='';try{
  const d=request&&typeof request==='object'?Object.getOwnPropertyDescriptor(request,'revision'):null;if(d?.enumerable&&Object.hasOwn(d,'value')&&typeof d.value==='string'&&d.value.length<=256)revision=d.value;
  const args=record(request,['revision','sketchJSON','externalParameters','intent']);if(typeof args.revision!=='string'||!args.revision||args.revision.length>256)throw fail('INVALID','Invalid coordinate revision.');revision=args.revision;
  const intents=batch?capturePoints(record(args.intent,['points']).points):[capturePoint(args.intent)],bindings=external(args.externalParameters),before=JSON.parse(boundedText(args.sketchJSON));if(before.objects.length>1024)throw fail('LIMIT','Too many sketch objects for this command.');
  const original=coldCoordinates(revision,before,bindings);if(!original.result.ok)return coordinateProofFailure(original.result,'Original coordinate source solve',original.stops);
  proveCoordinateGeometry(before,original.result.sketch,original.result.evidence,bindings,'Original coordinate source replay',original.stops);
  const scope=captureCoordinateScope(before,bindings,intents,original.result.evidence,original.auxiliary),receipt=()=>batch?{points:intents.map(p=>({id:p.id,x:p.x,y:p.y}))}:{point:{id:intents[0].id,x:intents[0].x,y:intents[0].y}};
  if(intents.every(intent=>{const saved=nativePoint(before,intent.id);return saved.x===intent.x&&saved.y===intent.y;}))return{revision,ok:true as const,serializedSketch:args.sketchJSON,evidence:original.result.evidence,...receipt()};
  const workspace=new HeadlessSketchWorkspace(bindings);workspace.io._loadSketch(structuredClone(before),{strict:true});const pm=workspace.parametricManager,index=workspace.createIndex(),targets=resolveTargets(pm,index,intents),stage=targets[0].point.stage;
  if(stage.index!==scope.selection.stage)throw fail('INVALID_TARGET','The coordinate stage changed.');
  const temporaries=targets.map(({intent,point})=>{const c=new AlgNumConstraint(ConstraintDefinitions.LockPoint,[point],{x:String(intent.x),y:String(intent.y)});c.validateCandidateConstants(c.constants,v=>pm.constantResolver(v));return c;});
  const validate=stages=>{
   if(temporaries.some(c=>c.stage!==stage||!stage.algNumSystem.allConstraints.includes(c)))throw fail('COORDINATE_CONFLICT','The coordinate driver was not admitted.');
   for(const s of stages){const sys=s.algNumSystem,prior=sys.transactionBefore;for(const c of sys.allConstraints){const wasRejected=prior.conflicting.has(c)&&!prior.redundant.has(c),rejected=sys.conflicting.has(c)&&!sys.redundant.has(c);if((temporaries.includes(c)||!wasRejected)&&rejected)throw withAdmissionCause(fail('COORDINATE_CONFLICT','The requested coordinates conflict with existing constraints.'),sys.getAdmissionCause(c));}}
   if(targets.some(({point,intent})=>point.x!==intent.x||point.y!==intent.y))throw fail('COORDINATE_NOT_REACHED','The requested coordinates were not reached exactly.');
  };
  pm.startTransaction();try{for(const {point,intent}of targets)point.setXY(intent.x,intent.y);for(const parent of new Set(targets.map(t=>t.parent).filter(Boolean)))parent.syncGeometry();for(const c of temporaries)pm._add(c);pm.finishTransaction(validate,false);}catch(error){if(pm.inTransaction)try{pm.finishTransaction(()=>{throw error},false)}catch{}throw error;}
  for(const currentStage of pm.stages){const sys=currentStage.solverSystem;sys.prepare();currentStage.solve(false);if(!sys.solveStatus.success||!Number.isFinite(sys.solveStatus.error))throw withAdmissionCause(fail('SOLVE_FAILED','Coordinate admission did not establish a finite solution.'),causeForSolveStatus(sys.solveStatus));for(const c of sys.allConstraints){if(sys.conflicting.has(c)&&!sys.redundant.has(c))throw withAdmissionCause(fail('COORDINATE_CONFLICT','Coordinate admission rejected an original equation.'),sys.getAdmissionCause(c));validateConstraintGeometry(c);}}
  const authored=stage.algNumSystem.allConstraints.filter(c=>!c.internal),drivers=temporaries.map((c,i)=>({index:authored.indexOf(c),intent:intents[i],status:stage.algNumSystem.redundant.has(c)?'redundant':'accepted'}));if(drivers.some(d=>d.index<0))throw fail('INTENT_CHANGED','The temporary driver disappeared.');
  const warm=JSON.parse(workspace.io.serializeSketch(before.metadata,{strict:true}));warm.boundary=structuredClone(before.boundary);removeTemporaryIntents(before,warm,stage.index,drivers);intents.forEach(intent=>verifyTarget(warm,intent));
  const candidate=structuredClone(before);candidate.objects=applyCapturedGeometry(before,warm,scope.fields,true,'Coordinate edit');materializeOffsetCaches(candidate,name=>bindings[name]);materializePatternCaches(candidate);assertCapturedGeometryScope(before,candidate,scope.fields,'Coordinate edit');intents.forEach(intent=>verifyTarget(candidate,intent));
  const proof=coldCoordinates(revision,candidate,bindings);if(!proof.result.ok)return coordinateProofFailure(proof.result,'First coordinate cold proof',proof.stops);
  proveCoordinateGeometry(candidate,proof.result.sketch,proof.result.evidence,bindings,'First coordinate cold proof',proof.stops);
  const second=coldCoordinates(revision,proof.result.sketch,bindings);if(!second.result.ok)return coordinateProofFailure(second.result,'Independent coordinate cold replay',second.stops);
  proveCoordinateGeometry(proof.result.sketch,second.result.sketch,second.result.evidence,bindings,'Independent coordinate cold replay',second.stops);proveCoordinateGeometry(candidate,second.result.sketch,second.result.evidence,bindings,'Original coordinate candidate bound',second.stops);
  if(proof.result.evidence.length!==second.result.evidence.length||proof.result.evidence.some((row,i)=>row.typeId!==second.result.evidence[i].typeId||row.state!==second.result.evidence[i].state))throw fail('ADMISSION_CHANGED','Coordinate cold classifications differ.');
  const checked=evaluateCapturedSketch(candidate,bindings,proof.result.evidence,undefined,proof.auxiliary);intents.forEach(intent=>verifyTarget(candidate,intent));
  return{revision,ok:true as const,serializedSketch:boundedText(JSON.stringify(candidate)),evidence:checked.evidence,...receipt()};
 }catch(error){const cause=failureCause(error);return{revision,ok:false as const,error:{code:typeof error?.code==='string'?error.code.slice(0,64):'INVALID',message:typeof error?.message==='string'?error.message.slice(0,512):'Coordinate transition failed.',...(cause?{cause}:{})}};}
}

// Preserve the existing single-point wire and metadata exactly.
export function editPointCoordinatesTransition(request:any){return editCoordinatesTransition(request,false);}
export function editPointsCoordinatesTransition(request:any){return editCoordinatesTransition(request,true);}
