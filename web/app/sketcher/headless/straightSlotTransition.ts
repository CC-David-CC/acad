import {Segment} from '../shapes/segment';
import {Arc} from '../shapes/arc';
import {EndPoint} from '../shapes/point';
import {AlgNumConstraint,ConstraintDefinitions} from '../constr/ANConstraints';
import {slotFail as fail,slotRecord,captureSlotIntent,captureSlotReceipt,straightSlotGeometry,assertSlotNative} from '../constr/straightSlotRecord.mjs';
import {slotDeclarationRows,validateSlotJunctions} from '../constr/straightSlotSource.mjs';
import {HeadlessSketchWorkspace} from './workspace';
import {capturedParameterOwnership} from './capturedParameterOwnership';
import {solveSketch} from './solve';
import {evaluateCapturedSketch} from './capturedSketchEvaluation';
import {assertVerifiedReplayGeometry} from './verifiedReplayGeometry';
import {sameRestoredSketch} from '../historyEquivalence.mjs';
import {captureSketchFailure,failureCause} from '../constr/admissionCause.mjs';
import type {CapturedAuxiliaryWitnessBatch} from './capturedParameterOwnership';
const MAX=1048576;
function bounded(v:any){if(typeof v!=='string'||v.length>MAX||new TextEncoder().encode(v).byteLength>MAX)fail('LIMIT','Slot source exceeds the existing 1 MiB envelope.');return v;}
function capture(input:any,verify=false){const a:any=slotRecord(input,verify?['revision','sketchJSON','externalParameters','intent','candidateJSON','slot','changed']:['revision','sketchJSON','externalParameters','intent']);if(typeof a.revision!=='string'||!a.revision||a.revision.length>256)fail('INVALID_REQUEST','Invalid Slot revision.');bounded(a.sketchJSON);const raw=a.externalParameters;if(!raw||typeof raw!=='object'||Array.isArray(raw)||Reflect.ownKeys(raw).length>1024)fail('INVALID_REQUEST','Invalid Slot parameter bindings.');const external=Object.create(null);for(const name of Reflect.ownKeys(raw)){const d=Object.getOwnPropertyDescriptor(raw,name);if(typeof name!=='string'||!name||name.length>256||!d?.enumerable||!Object.hasOwn(d,'value')||typeof d.value!=='number'||!Number.isFinite(d.value)||Math.abs(d.value)>1e9)fail('INVALID_REQUEST','Invalid Slot parameter binding.');external[name]=d.value;}if(verify){bounded(a.candidateJSON);captureSlotReceipt(a.slot);if(typeof a.changed!=='boolean')fail('INVALID_RESPONSE','Invalid Slot outcome.');}return{...a,externalParameters:external,intent:captureSlotIntent(a.intent)};}
function failed(revision:string,error:any){const own=k=>{const d=error&&typeof error==='object'?Object.getOwnPropertyDescriptor(error,k):null;return d&&Object.hasOwn(d,'value')?d.value:undefined;},code=own('code'),message=own('message'),cause=failureCause(error);return{revision,ok:false as const,error:captureSketchFailure({code:typeof code==='string'?code.slice(0,64):'SLOT_INVALID',message:(typeof message==='string'?message:'Slot transition failed.').slice(0,512),...(cause?{cause}:{})})};}
function prove(revision:string,source:any,external:any){let auxiliary:CapturedAuxiliaryWitnessBatch|undefined;const cold=solveSketch({revision,sketch:structuredClone(source),boundary:structuredClone(source.boundary),externalParameters:external},undefined,b=>{auxiliary=b;});if(!cold.ok)throw Object.assign(Error(cold.error.message),cold.error);assertVerifiedReplayGeometry(source,cold.sketch,cold.evidence,external);return{cold,actual:evaluateCapturedSketch(source,external,cold.evidence,undefined,auxiliary)};}
function load(source:any,external:any){const w=new HeadlessSketchWorkspace(external);w.io._loadSketch(structuredClone(source),{strict:true});const actual=JSON.parse(w.io.serializeSketch(source.metadata,{strict:true}));actual.boundary=structuredClone(source.boundary);if(!sameRestoredSketch(JSON.stringify(source),JSON.stringify(actual)))fail('CURRENT_GEOMETRY_MISMATCH','Actual native loading changed the captured Slot source.');return w;}
function owned(w:any,source:any,item:any,captured?:any){
 const index=captured?.index||w.createIndex(),ownership=captured?.ownership||capturedParameterOwnership(w),objects=item.row.objects.map(id=>index[id]),stage=w.parametricManager.stages[item.stage];
 for(let i=0;i<5;i++){const root=objects[i],Ctor=i===2||i===4?Arc:Segment;if(!(root instanceof Ctor)||root.parent||root.isGenerated||root.readOnly||root.generators.size||root.stage!==stage||!stage.objects.has(root)||root.children.size!==(Ctor===Arc?3:2))fail('UNSUPPORTED_SLOT_TARGET','Slot requires genuine independent native members.');root.traverse(o=>{if(index[o.id]!==o||o.stage!==stage||o.isGenerated||o.generators.size)fail('INVALID_SLOT_SOURCE','Native Slot descendant custody changed.');o.visitParams(p=>{if(!ownership.geometry.has(p))fail('INVALID_SLOT_SOURCE','Slot parameter lacks actual native ownership.');});});for(const point of [root.a,root.b,...(Ctor===Arc?[root.c]:[])])if(!(point instanceof EndPoint)||point.parent!==root||!root.children.has(point))fail('INVALID_SLOT_SOURCE','Slot endpoint ownership differs from its actual factory.');}
 assertSlotNative(objects,item.radius);if(!captured){validateSlotJunctions(source,index);ownership.unchanged();}return{objects,index,ownership};
}
const receipt=(item:any,objects:any[])=>captureSlotReceipt({slotId:objects[0].id,stage:item.stage,members:objects.map(o=>o.id),a:{x:objects[0].a.x,y:objects[0].a.y},b:{x:objects[0].b.x,y:objects[0].b.y},radius:item.radius});
export function inspectStraightSlotRows(original:any,replayed:any,external:any){
 const items=slotDeclarationRows(replayed);if(!items.length)return[];const w=load(replayed,external),old=new Map(slotDeclarationRows(original).map(r=>[r.row.objects[0],r])),captured={index:w.createIndex(),ownership:capturedParameterOwnership(w)};
 validateSlotJunctions(replayed,captured.index);
 const result=items.map(item=>{const prior:any=old.get(item.row.objects[0]);if(!prior||JSON.stringify(prior.row.objects)!==JSON.stringify(item.row.objects)||prior.radius!==item.radius)fail('INTENT_CHANGED','Slot declaration identity changed in replay.');const bound=owned(w,replayed,item,captured),p=o=>({pointId:o.id,x:o.x,y:o.y}),before=JSON.stringify(bound.objects.map(o=>o.write()));
 const row={...receipt(item,bound.objects),index:item.index,status:item.row.admission.state,axisPointIds:[bound.objects[0].a.id,bound.objects[0].b.id],geometry:bound.objects.map(o=>({id:o.id,type:o.TYPE,a:p(o.a),b:p(o.b),c:o.TYPE==='Arc'?p(o.c):null,radius:o.TYPE==='Arc'?o.r.get():null,angles:o.TYPE==='Arc'?[o.ang1.get(),o.ang2.get()]:null})),canEdit:true,reason:null};
 if(JSON.stringify(bound.objects.map(o=>o.write()))!==before)fail('CURRENT_GEOMETRY_MISMATCH','Native Slot inspection changed actual member geometry.');return row;});
 captured.ownership.unchanged();return result;
}

function nativeMembers(intent:any,ids:string[]){const geometry=straightSlotGeometry(intent.a,intent.b,intent.radius);return geometry.map((g,i)=>{const o:any=i===2||i===4?new Arc(g.a.x,g.a.y,g.b.x,g.b.y,g.c.x,g.c.y,ids[i],g.branch):new Segment(g.a.x,g.a.y,g.b.x,g.b.y,ids[i]);o.role=i===0?'construction':null;return o;});}
export function changeStraightSlot(request:any){let revision='';try{
 const a=capture(request);revision=a.revision;const intent=a.intent,before=JSON.parse(a.sketchJSON),external=a.externalParameters,original=prove(revision,before,external),w=load(before,external);let item:any,ids:string[],stage:number;
 if(intent.action==='edit'){item=slotDeclarationRows(before).find(r=>r.row.objects[0]===intent.slotId);if(!item)fail('INVALID_TARGET','Choose an actual inspected Slot axis.');const bound=owned(w,before,item);ids=item.row.objects.slice();stage=item.stage;if(bound.objects[0].a.x===intent.a.x&&bound.objects[0].a.y===intent.a.y&&bound.objects[0].b.x===intent.b.x&&bound.objects[0].b.y===intent.b.y&&item.radius===intent.radius)return{revision,ok:true as const,changed:false,serializedSketch:a.sketchJSON,evidence:original.actual.evidence,slot:receipt(item,bound.objects)};}
 else{ids=[...intent.members];stage=intent.stage;if(stage!==before.stages.length-1)fail('UNSUPPORTED_SLOT_TARGET','Create a Slot only in the current last authored stage.');}
 const shapes=nativeMembers(intent,ids),candidate=structuredClone(before);
 if(intent.action==='create'){
  const names=new Set<string>();for(const shape of shapes)shape.traverse(o=>names.add(o.id));let work=0;const todo=[before];while(todo.length){const value=todo.pop();if(++work>100000)fail('LIMIT','Slot identity inventory exceeds its bound.');if(typeof value==='string'&&names.has(value))fail('IDENTITY_COLLISION','New Slot identity is already referenced.');if(value&&typeof value==='object')todo.push(...Object.values(value));}
  for(const shape of shapes)candidate.objects.push({id:shape.id,type:shape.TYPE,role:shape.role,stage,data:shape.write()});
  const relation=new AlgNumConstraint(ConstraintDefinitions.StraightSlot,shapes,{radius:String(intent.radius)} as any);const write=c=>({...c.write(),stage,admission:{version:1,state:'accepted'}});
  candidate.stages[stage].constraints.push(write(relation));
  for(const [x,y] of [[shapes[1].b,shapes[2].a],[shapes[2].b,shapes[3].a],[shapes[3].b,shapes[4].a],[shapes[4].b,shapes[1].a]])candidate.stages[stage].constraints.push(write(new AlgNumConstraint(ConstraintDefinitions.PCoincident,[x,y])));
 }else{for(const shape of shapes){const row=candidate.objects.find(o=>o.id===shape.id);row.data=shape.write();}candidate.stages[stage].constraints[item.index].constants={radius:item.radius===intent.radius?before.stages[stage].constraints[item.index].constants.radius:String(intent.radius)};}
 // One true solve establishes new rows' actual classifications; it is proof,
 // never a source-coordinate replacement. Retained rows may not reclassify.
 const cold=solveSketch({revision,sketch:structuredClone(candidate),boundary:structuredClone(candidate.boundary),externalParameters:external});if(!cold.ok)return cold;
 for(let s=0;s<candidate.stages.length;s++)for(let i=0;i<candidate.stages[s].constraints.length;i++){const row=candidate.stages[s].constraints[i],actual=cold.sketch.stages[s].constraints[i];if(i<before.stages[s].constraints.length){if(actual.admission.state!==row.admission.state)fail('ADMISSION_CHANGED','Slot edit changed retained constraint classification.');}else row.admission=structuredClone(actual.admission);}
 assertVerifiedReplayGeometry(candidate,cold.sketch,cold.evidence,external);
 const checked=prove(revision,candidate,external),second=prove(revision,checked.cold.sketch,external);assertVerifiedReplayGeometry(candidate,second.cold.sketch,second.cold.evidence,external);
 const verify=load(candidate,external),current=slotDeclarationRows(candidate).find(r=>r.row.objects[0]===intent.slotId),bound=owned(verify,candidate,current);
 return{revision,ok:true as const,changed:true,serializedSketch:bounded(JSON.stringify(candidate)),evidence:checked.actual.evidence,slot:receipt(current,bound.objects)};
 }catch(error){return failed(revision,error);}}
export function verifyStraightSlot(request:any){let revision='';try{const a=capture(request,true);revision=a.revision;const expected=changeStraightSlot({revision,sketchJSON:a.sketchJSON,externalParameters:a.externalParameters,intent:a.intent});if(!expected.ok)return expected;if(expected.serializedSketch!==a.candidateJSON||expected.changed!==a.changed||JSON.stringify(expected.slot)!==JSON.stringify(captureSlotReceipt(a.slot)))fail('CANDIDATE_MISMATCH','Slot candidate differs from the complete independently reconstructed original request.');return{revision,ok:true as const,verified:true};}catch(error){return failed(revision,error);}}
