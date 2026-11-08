import {solveSketch} from './solve';
import {HeadlessSketchWorkspace} from './workspace';
import {prepareLengthRelation} from '../actions/lengthRelationAdmission';
import {sameRestoredSketch} from '../historyEquivalence.mjs';
import {assertVerifiedReplayGeometry} from './verifiedReplayGeometry';
import {assertAllowedSolverGeometry} from './transitionGeometryPolicy.mjs';

const MAX_SKETCH_BYTES=1024*1024;
const encoder=new TextEncoder();
const fail=(code:string,message:string)=>Object.assign(new Error(message),{code});
function exactRecord(value:any,keys:string[]) {
  if(!value||typeof value!=='object'||Array.isArray(value)||Reflect.ownKeys(value).length!==keys.length)return false;
  return keys.every(key=>{const d=Object.getOwnPropertyDescriptor(value,key);return !!d&&d.enumerable&&Object.prototype.hasOwnProperty.call(d,'value')});
}
function capturedRevision(value:any) {
  if(!value||typeof value!=='object')return '';
  const d=Object.getOwnPropertyDescriptor(value,'revision');
  return d?.enumerable&&Object.prototype.hasOwnProperty.call(d,'value')&&typeof d.value==='string'&&d.value.length>0&&d.value.length<=256?d.value:'';
}
function capturedExternal(value:any) {
  if(!value||typeof value!=='object'||Array.isArray(value))throw fail('INVALID','External parameters must be a plain numeric record.');
  const proto=Object.getPrototypeOf(value);
  if(proto!==null&&proto!==Object.prototype)throw fail('INVALID','External parameters must be a plain numeric record.');
  const keys=Reflect.ownKeys(value);if(keys.length>1024)throw fail('LIMIT','Too many external parameters.');
  const result=Object.create(null);
  for(const key of keys){
    if(typeof key!=='string')throw fail('INVALID','Invalid external parameter.');
    const d=Object.getOwnPropertyDescriptor(value,key);
    if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value')||typeof d.value!=='number'||!Number.isFinite(d.value)||Math.abs(d.value)>1e9)throw fail('INVALID','Invalid external parameter.');
    result[key]=d.value;
  }
  return result;
}
function boundedText(value:any) {
  return typeof value==='string'&&value.length<=MAX_SKETCH_BYTES&&encoder.encode(value).byteLength<=MAX_SKETCH_BYTES;
}

// This data-only operation does not publish into a live editor. The caller must
// bind its result to the captured editor revision and perform its own guarded
// publication. Run in a disposable Worker: solver model IDs are realm-local.
export function replaySketchTransition(request:any) {
  let revision='';
  try {
    revision=capturedRevision(request);
    if(!exactRecord(request,['revision','sketchJSON','externalParameters'])||typeof request.revision!=='string'||!request.revision||request.revision.length>256||!boundedText(request.sketchJSON))throw fail('INVALID','Invalid sketch transition request.');
    revision=request.revision;
    const external=capturedExternal(request.externalParameters);
    const sketch=JSON.parse(request.sketchJSON);
    if(!sketch||typeof sketch!=='object'||Array.isArray(sketch)||!sketch.boundary)throw fail('INVALID','A complete native sketch is required.');
    const solved=solveSketch({revision,sketch,boundary:structuredClone(sketch.boundary),externalParameters:external});
    if(!solved.ok)return solved;
    const authored=sketch.stages.flatMap(stage=>stage.constraints);
    if(authored.length!==solved.evidence.length||authored.some((constraint,index)=>{const hint=constraint.admission;return constraint.typeId!==solved.evidence[index].typeId||(hint!==undefined && (!hint||hint.version!==1||hint.state!==solved.evidence[index].state))}))throw fail('ADMISSION_CHANGED','The reconstructed admission differs from the saved classification.');
    const serializedSketch=JSON.stringify(solved.sketch);
    if(!boundedText(serializedSketch))throw fail('LIMIT','The solved sketch exceeds the transition limit.');
    // Keep exact authored state, constrained numerical geometry within the existing
    // save bound and exact unrelated geometry. Return the genuine full solved
    // output; inspection does not write it back into the captured document.
    assertVerifiedReplayGeometry(sketch,solved.sketch,solved.evidence,external);
    return {revision,ok:true as const,serializedSketch,evidence:solved.evidence};
  } catch(error) {
    return {revision,ok:false as const,error:{code:typeof error?.code==='string'?error.code:'INVALID',message:typeof error?.message==='string'?error.message:'Sketch transition failed.'}};
  }
}

// Verify that only the requested constraint was authored. Solved geometry may
// change, but existing identity, metadata, constraints and generators may not.
function verifyLengthIntent(before:any,after:any,intent:any,status:string) {
  if(!Array.isArray(before.objects)||!Array.isArray(after.objects)||before.objects.length!==after.objects.length||!Array.isArray(before.stages)||!Array.isArray(after.stages)||before.stages.length!==after.stages.length)throw fail('INTENT_CHANGED','Sketch structure changed.');
  after.objects.forEach((object,i)=>{if(before.objects[i]?.type!==object?.type)throw fail('INTENT_CHANGED','Sketch object type changed.');assertAllowedSolverGeometry(object.type,before.objects[i].data,object.data);});
  const restored={...after,objects:after.objects.map((object,i)=>({...object,data:before.objects[i].data})),stages:after.stages.map(stage=>({...stage,constraints:[...stage.constraints]}))};
  let added=false;
  for(let i=0;i<before.stages.length;i++){
    const prior=before.stages[i].constraints,next=restored.stages[i].constraints;
    if(!Array.isArray(prior)||!Array.isArray(next))throw fail('INTENT_CHANGED','Sketch constraints changed.');
    if(next.length===prior.length)continue;
    if(added||next.length!==prior.length+1)throw fail('INTENT_CHANGED','Unexpected constraint changes.');
    let index=0;while(index<prior.length&&JSON.stringify(prior[index])===JSON.stringify(next[index]))index++;
    const c=next[index];
    if(!c||c.typeId!=='LengthRelation'||JSON.stringify(c.objects)!==JSON.stringify(intent.ids)||c.constants?.factor!==String(intent.factor)||c.constants?.offset!==String(intent.offset)||c.admission?.state!==status)throw fail('INTENT_CHANGED','The requested relation was not retained.');
    next.splice(index,1);added=true;
  }
  if(!added||!sameRestoredSketch(JSON.stringify(before),JSON.stringify(restored)))throw fail('INTENT_CHANGED','Existing authored sketch intent changed.');
}

// The same admission helper used by the live LengthRelation action operates
// on a disposable, real headless workspace. Only plain data crosses this seam.
export function addLengthRelationTransition(request:any) {
  let revision='';
  try {
    revision=capturedRevision(request);
    if(!exactRecord(request,['revision','sketchJSON','externalParameters','intent'])||typeof request.revision!=='string'||!request.revision||request.revision.length>256||!boundedText(request.sketchJSON))throw fail('INVALID','Invalid sketch transition request.');
    revision=request.revision;
    const intent=request.intent;
    if(!exactRecord(intent,['ids','factor','offset'])||!Array.isArray(intent.ids)||intent.ids.length!==2||Reflect.ownKeys(intent.ids).length!==3||[0,1].some(i=>{const d=Object.getOwnPropertyDescriptor(intent.ids,String(i));return !d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value')||typeof d.value!=='string'||!d.value||d.value.length>256})||intent.ids[0]===intent.ids[1]||typeof intent.factor!=='number'||!Number.isFinite(intent.factor)||intent.factor<0||typeof intent.offset!=='number'||!Number.isFinite(intent.offset))throw fail('INVALID','Invalid length relation intent.');
    const external=capturedExternal(request.externalParameters);
    const captured=replaySketchTransition({revision,sketchJSON:request.sketchJSON,externalParameters:external});
    if(!captured.ok||!('serializedSketch' in captured))return captured;
    const sketch=JSON.parse(captured.serializedSketch),workspace=new HeadlessSketchWorkspace(external);
    workspace.io._loadSketch(sketch,{strict:true});
    const pm=workspace.parametricManager,index=workspace.createIndex(),objects=intent.ids.map(id=>index[id]);
    const {constraint,stage,validate}=prepareLengthRelation(pm,objects,{factor:String(intent.factor),offset:String(intent.offset)});
    pm.startTransaction();
    try {pm._add(constraint);pm.finishTransaction(validate,false)}
    catch(error){if(pm.inTransaction)try{pm.finishTransaction(()=>{throw error},false)}catch(_){}throw error;}
    const status=stage.algNumSystem.redundant.has(constraint)?'redundant':'accepted';
    const candidate=JSON.parse(workspace.io.serializeSketch(sketch.metadata,{strict:true}));candidate.boundary=sketch.boundary;
    verifyLengthIntent(sketch,candidate,intent,status);
    const solved=solveSketch({revision,sketch:candidate,boundary:structuredClone(candidate.boundary),externalParameters:external});
    if(!solved.ok)return solved;
    const serializedSketch=JSON.stringify(solved.sketch);
    if(!boundedText(serializedSketch))throw fail('LIMIT','The solved sketch exceeds the transition limit.');
    if(!sameRestoredSketch(JSON.stringify(candidate),serializedSketch))throw fail('CURRENT_GEOMETRY_MISMATCH','Candidate verification changed the solved geometry.');
    const authored=solved.sketch.stages.flatMap(s=>s.constraints);
    if(authored.length!==solved.evidence.length||authored.some((c,i)=>c.typeId!==solved.evidence[i].typeId||(c.admission!==undefined&&c.admission.state!==solved.evidence[i].state)))throw fail('ADMISSION_CHANGED','Candidate admission changed during verification.');
    return {revision,ok:true as const,serializedSketch,evidence:solved.evidence,relation:{objects:[...intent.ids],status}};
  } catch(error) {
    return {revision,ok:false as const,error:{code:typeof error?.code==='string'?error.code:'INVALID',message:typeof error?.message==='string'?error.message:'Sketch transition failed.'}};
  }
}
