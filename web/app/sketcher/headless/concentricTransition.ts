import {HeadlessSketchWorkspace} from './workspace';
import {replaySketchTransition} from './sketchTransition';
import {solveSketch} from './solve';
import {prepareConcentric} from '../actions/concentricAdmission';
import {Circle} from '../shapes/circle';
import {Arc} from '../shapes/arc';
import {isInstanceOf} from '../actions/matchUtils';
import {assertAllowedSolverGeometry} from './transitionGeometryPolicy.mjs';
import {sameRestoredSketch} from '../historyEquivalence.mjs';

const fail=(code:string,message:string)=>Object.assign(new Error(message),{code});
function record(value:any,keys:string[]) {
  if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==keys.length)throw fail('INVALID','Invalid concentric transition request.');
  const out:any={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw fail('INVALID','Concentric fields must be data.');out[key]=d.value;}return out;
}
function external(value:any) {
  if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))throw fail('INVALID','External parameters must be a plain numeric record.');
  const keys=Reflect.ownKeys(value),out=Object.create(null);if(keys.length>1024)throw fail('LIMIT','Too many external parameters.');
  for(const key of keys){if(typeof key!=='string'||!key||key.length>256)throw fail('INVALID','Invalid external parameter.');const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value')||typeof d.value!=='number'||!Number.isFinite(d.value)||Math.abs(d.value)>1e9)throw fail('INVALID','Invalid external parameter.');out[key]=d.value;}return out;
}
function intent(value:any) {
  const a=record(value,['ids']),ids=a.ids;
  if(!Array.isArray(ids)||Object.getPrototypeOf(ids)!==Array.prototype||ids.length!==2||Reflect.ownKeys(ids).length!==3)throw fail('INVALID','Provide two distinct circular object IDs.');
  const captured=[0,1].map(i=>{const d=Object.getOwnPropertyDescriptor(ids,String(i));if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value')||typeof d.value!=='string'||!d.value||d.value.length>256)throw fail('INVALID','Invalid circular object ID.');return d.value;});
  if(captured[0]===captured[1])throw fail('INVALID','Provide two distinct circular object IDs.');return captured;
}

function verifyIntent(before:any,after:any,ids:string[],stage:number,status:string) {
  if(before.objects.length!==after.objects.length||before.stages.length!==after.stages.length)throw fail('INTENT_CHANGED','Sketch structure changed.');
  after.objects.forEach((object,i)=>{if(object.type!==before.objects[i]?.type)throw fail('INTENT_CHANGED','Sketch object type changed.');assertAllowedSolverGeometry(object.type,before.objects[i].data,object.data);});
  const restored={...after,objects:after.objects.map((o,i)=>({...o,data:before.objects[i].data})),stages:after.stages.map(s=>({...s,constraints:[...s.constraints]}))};
  const prior=before.stages[stage]?.constraints,next=restored.stages[stage]?.constraints;
  if(!Array.isArray(prior)||!Array.isArray(next)||next.length!==prior.length+1)throw fail('INTENT_CHANGED','Exactly one concentric constraint is required.');
  let index=0;while(index<prior.length&&JSON.stringify(prior[index])===JSON.stringify(next[index]))index++;
  const added=next[index];
  if(added?.typeId!=='Concentric'||added.stage!==stage||added.objects?.length!==2||added.objects.some((id,i)=>id!==ids[i])||Object.keys(added.constants||{}).length||added.admission?.version!==1||added.admission.state!==status)throw fail('INTENT_CHANGED','The requested concentric identity or admission changed.');
  next.splice(index,1);
  if(!sameRestoredSketch(JSON.stringify(before),JSON.stringify(restored)))throw fail('INTENT_CHANGED','Existing authored sketch intent changed.');
  return index;
}

// Pure data-only edit. Run once in a disposable real Worker: no editor/history
// cache or publication authority is supplied by this function. Stage/index is
// the native row identity at this revision, not an invented persistent UUID.
export function addConcentricTransition(request:any) {
  let revision='';
  try {
    const d=request&&typeof request==='object'?Object.getOwnPropertyDescriptor(request,'revision'):null;
    if(d?.enumerable&&Object.prototype.hasOwnProperty.call(d,'value')&&typeof d.value==='string'&&d.value.length<=256)revision=d.value;
    const args=record(request,['revision','sketchJSON','externalParameters','intent']);
    if(typeof args.revision!=='string'||!args.revision||args.revision.length>256)throw fail('INVALID','Invalid concentric revision.');revision=args.revision;
    const ids=intent(args.intent),bindings=external(args.externalParameters);
    const captured=replaySketchTransition({revision,sketchJSON:args.sketchJSON,externalParameters:bindings});
    if(!captured.ok||!('serializedSketch' in captured))return captured;
    const before=JSON.parse(captured.serializedSketch),workspace=new HeadlessSketchWorkspace(bindings);workspace.io._loadSketch(before,{strict:true});
    const pm=workspace.parametricManager,index=workspace.createIndex(),circular=Object.values(index).filter(o=>isInstanceOf(o,Circle)||isInstanceOf(o,Arc));
    if(circular.length>1024)throw fail('LIMIT','Too many sketch objects for this command.');
    if(circular.some((o:any)=>typeof o.id!=='string'||!o.id||o.id.length>256)||new Set(circular.map((o:any)=>o.id)).size!==circular.length)throw fail('INVALID_TARGET','Circular object IDs are invalid or ambiguous.');
    const objects=ids.map(id=>index[id]);if(objects.some(o=>!circular.includes(o)))throw fail('INVALID_TARGET','Choose two existing circles or arcs.');
    const {constraint,stage,validate}=prepareConcentric(pm,objects);
    pm.startTransaction();
    try {pm._add(constraint);pm.finishTransaction(validate,false);}
    catch(error){if(pm.inTransaction)try{pm.finishTransaction(()=>{throw error},false);}catch(_){}throw error;}
    const status=stage.algNumSystem.redundant.has(constraint)?'redundant':'accepted';
    const candidate=JSON.parse(workspace.io.serializeSketch(before.metadata,{strict:true}));candidate.boundary=before.boundary;
    const constraintIndex=verifyIntent(before,candidate,ids,stage.index,status);
    const solved=solveSketch({revision,sketch:candidate,boundary:structuredClone(candidate.boundary),externalParameters:bindings});if(!solved.ok)return solved;
    const serializedSketch=JSON.stringify(solved.sketch);
    if(serializedSketch.length>1048576||new TextEncoder().encode(serializedSketch).byteLength>1048576)throw fail('LIMIT','The resulting sketch exceeds its limit.');
    if(!sameRestoredSketch(JSON.stringify(candidate),serializedSketch))throw fail('CURRENT_GEOMETRY_MISMATCH','Concentric verification changed the solved geometry.');
    const authored=solved.sketch.stages.flatMap(s=>s.constraints);
    if(authored.length!==solved.evidence.length||authored.some((c,i)=>c.typeId!==solved.evidence[i].typeId||c.admission?.version!==1||c.admission.state!==solved.evidence[i].state))throw fail('ADMISSION_CHANGED','Candidate admission changed during verification.');
    return {revision,ok:true as const,serializedSketch,evidence:solved.evidence,relation:{typeId:'Concentric',objects:[...ids],stage:stage.index,index:constraintIndex,status}};
  } catch(error) {
    return {revision,ok:false as const,error:{code:typeof error?.code==='string'?error.code:'INVALID',message:typeof error?.message==='string'?error.message:'Concentric transition failed.'}};
  }
}
