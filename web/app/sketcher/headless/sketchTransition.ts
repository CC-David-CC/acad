import {solveSketch} from './solve';
import {assertVerifiedReplayGeometry} from './verifiedReplayGeometry';

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

// Existing callers retain this export; construction and original-request
// verification now share the bounded operation-specific module.
export {changeLengthRelation as addLengthRelationTransition} from './lengthRelationTransition';
