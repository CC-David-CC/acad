// Private OCI-Worker-only fixed C ABI adapter. No generic native callback,
// caller trust flag, token publication, capability/pair admission or fallback.
import {captureConicalNativeFailure,captureOwnedConeObservation,conicalFields} from './ownedConicalContract.mjs';
import {validateOwnedTopology} from './ownedTopologyContract.mjs';
import {BOOLEAN_REFUSAL_CODES} from './ownedBooleanContract.mjs';
import {measureExactSignedMeshVolume} from './exactMeshVolume.mjs';
const callFailures=new WeakMap();
function failure(code,message,{cause,invoked=false,terminal=true}={}){const e=Object.assign(Error(message),{code,cause});callFailures.set(e,Object.freeze({invoked,terminal}));return e;}
export const countersinkCallFailure=value=>callFailures.get(value)||null;
// Strict post-return decoders are part of this actual invocation. Preserve
// their original exception while retaining terminal transport classification.
function decodedFailure(cause){
 if(countersinkCallFailure(cause))return cause;
 if(cause!==null&&(typeof cause==='object'||typeof cause==='function')){callFailures.set(cause,Object.freeze({invoked:true,terminal:true}));return cause;}
 return failure('ENGINE_FAILURE','Native response decoding failed.',{cause,invoked:true});
}
const required=['_CreateSelectedProfileV3','_ApplyOwnedBooleanHistoryV1','_CreateOwnedConicalFrustumV1','_ReadOwnedConeTopologyV1','_ReadOwnedTopologyV1','_InspectOwnedSolidV2','_InspectTopologyCensusV1','_ReadOwnedMeshV2','_ClassifyOwnedPointV2','_ReleaseOwnedShapeV2','_OwnedShapeNamesV2'];
const limits=Object.freeze({topology:524288,cone:524288,profile:16384,boolean:4194304,metrics:4096,census:4096,mesh:33554432});
const own=(v,k)=>Object.prototype.hasOwnProperty.call(v,k);
const ordinary=(code,message)=>failure(code,message,{terminal:false,invoked:true});
function nativeError(value,version,codes){
 try{
 if(!value||!own(value,'error'))return;
 const r=conicalFields(value,['version','error']);if(r.version!==version||typeof r.error!=='string'||r.error.length<1||r.error.length>128)throw failure('ENGINE_FAILURE','Malformed Native failure.',{invoked:true});
 if(r.error==='MEASUREMENT_PRECISION_UNRESOLVED')throw failure(r.error,r.error,{invoked:true});
 if(!codes.includes(r.error))throw failure('ENGINE_FAILURE','Unqualified Native failure: '+r.error,{invoked:true});throw ordinary(r.error,r.error);
 }catch(cause){throw decodedFailure(cause);}
}
function metrics(value){
 try{
 nativeError(value,2,['PROFILE_INSPECTION_FAILED']);const r=conicalFields(value,['version','valid','solidCount','nativeVolume','nativeBounds']);
 const b=conicalFields(r.nativeBounds,['min','max']);
 if(r.version!==2||r.valid!==true||r.solidCount!==1||typeof r.nativeVolume!=='number'||!Number.isFinite(r.nativeVolume)||r.nativeVolume<=0||['min','max'].some(k=>!Array.isArray(b[k])||b[k].length!==3||b[k].some(n=>typeof n!=='number'||!Number.isFinite(n)||Math.abs(n)>4e6))||b.min.some((n,i)=>n>=b.max[i]))throw failure('ENGINE_FAILURE','Invalid actual Native solid metrics.',{invoked:true});return r;
 }catch(cause){throw decodedFailure(cause);}
}
export function createCountersinkNativeCalls(context){
 const {Module,malloc,free,requireCurrent}=context;
 if(!Module||Module!==globalThis.Module||typeof malloc!=='function'||typeof free!=='function'||typeof requireCurrent!=='function'||required.some(k=>typeof Module[k]!=='function'))throw failure('ENGINE_CAPABILITY_UNAVAILABLE','The private current Native instance lacks a required countersink ingredient.');
 let active=false,scratch=null;
 const heap=()=>{const v=Module.HEAP8;if(!(v instanceof Int8Array)||v.byteLength===0)throw failure('ENGINE_FAILURE','Current Native heap is unavailable.');return v.buffer;};
 function invoke(method,build,{exchanges=1,maxBytes=4096}={}){
  if(active)throw failure('ENGINE_FAILURE','Reentrant private Native call.');active=true;
  const allocations=[];let calls=0,raw=null,invalid=false,invoked=false,thrown=false,operationError,returnValue,cleanupError=null,exchangeDescriptor,collector;
  const alloc=(bytes,floats=null)=>{
   let p;try{p=malloc(bytes);}catch(cause){throw failure('ENGINE_CLEANUP_FAILED','Native scratch allocation outcome is uncertain.',{cause});}
   if(!p)throw failure('RESOURCE_LIMIT','Native scratch allocation failed.',{terminal:false});
   const record={pointer:p,bytes,floats};allocations.push(record);
   if(!Number.isSafeInteger(p)||p<=0||!Number.isSafeInteger(bytes)||bytes<=0||p>heap().byteLength-bytes||floats&&p%8)throw failure('ENGINE_CLEANUP_FAILED','Native scratch pointer is unqualified.');return p;
  };
  const name=text=>{
   if(typeof text!=='string'||!text||text.length>64||text.includes('\0'))throw failure('ENGINE_FAILURE','Invalid private Native name.');const bytes=new TextEncoder().encode(text+'\0');if(bytes.length>65)throw failure('ENGINE_FAILURE','Private Native name exceeds its byte bound.');
   const p=alloc(bytes.length);new Uint8Array(heap(),p,bytes.length).set(bytes);allocations.at(-1).input=bytes;return p;
  };
  const doubles=values=>{
   if(!Array.isArray(values)||values.length<1||values.length>4096||values.some(n=>typeof n!=='number'||!Number.isFinite(n)))throw failure('ENGINE_FAILURE','Invalid private Native numeric payload.');
   const copy=[...values],p=alloc(copy.length*8,copy);new Float64Array(heap(),p,copy.length).set(copy);return p;
  };
  try{
   requireCurrent();const args=build({name,doubles});requireCurrent();
   exchangeDescriptor=Object.getOwnPropertyDescriptor(globalThis,'__OCI_EXCHANGE');
   if(!exchangeDescriptor||!own(exchangeDescriptor,'value')||typeof exchangeDescriptor.value!=='function'||exchangeDescriptor.writable!==true)throw failure('ENGINE_FAILURE','Private Native exchange receiver is unavailable.');
   // Never parse, forward or run another hook inside a Native publication.
   collector=value=>{calls++;if(calls!==1||typeof value!=='string'||value.length>maxBytes){raw=null;invalid=true;return;}raw=value;};
   Object.defineProperty(globalThis,'__OCI_EXCHANGE',{...exchangeDescriptor,value:collector});globalThis.__OCI_EXCHANGE_VAL=null;
   invoked=true;returnValue=Module[method](...args);
  }catch(cause){thrown=true;operationError=cause;raw=null;}
  finally{
   if(collector){
    const current=Object.getOwnPropertyDescriptor(globalThis,'__OCI_EXCHANGE');
    if(!current||!own(current,'value')||current.value!==collector||current.writable!==exchangeDescriptor.writable||current.enumerable!==exchangeDescriptor.enumerable||current.configurable!==exchangeDescriptor.configurable)cleanupError=failure('ENGINE_CLEANUP_FAILED','Native exchange receiver ownership changed.',{invoked,cause:operationError});
    else try{Object.defineProperty(globalThis,'__OCI_EXCHANGE',exchangeDescriptor);const after=Object.getOwnPropertyDescriptor(globalThis,'__OCI_EXCHANGE');if(!after||after.value!==exchangeDescriptor.value||after.writable!==exchangeDescriptor.writable||after.enumerable!==exchangeDescriptor.enumerable||after.configurable!==exchangeDescriptor.configurable)throw Error('Receiver restore differed');}catch(cause){cleanupError=failure('ENGINE_CLEANUP_FAILED','Native exchange restoration is unconfirmed.',{invoked,cause});}
   }
   try{globalThis.__OCI_EXCHANGE_VAL=null;}catch(cause){cleanupError ||= failure('ENGINE_CLEANUP_FAILED','Native exchange scratch reset failed.',{invoked,cause});}
   for(const record of allocations){
    try{if(record.pointer>heap().byteLength-record.bytes)throw Error('Scratch left current heap');if(record.input&&record.input.some((n,i)=>n!==new Uint8Array(heap(),record.pointer,record.bytes)[i])||record.floats&&record.floats.some((n,i)=>!Object.is(n,new Float64Array(heap(),record.pointer,record.floats.length)[i])))throw Error('Native input bytes changed');}catch(cause){cleanupError ||= failure('ENGINE_CLEANUP_FAILED','Native input scratch preservation is unqualified.',{invoked,cause});}
    // Once only. A throwing free may already have completed and is not retried.
    try{if(!Number.isSafeInteger(record.pointer)||record.pointer<=0||record.pointer>heap().byteLength-record.bytes)throw Error('Unknown scratch pointer');free(record.pointer);}catch(cause){cleanupError ||= failure('ENGINE_CLEANUP_FAILED','Native scratch release is unconfirmed.',{invoked,cause});}
   }
   active=false;
  }
  if(cleanupError)throw Object.assign(cleanupError,{operationFailed:thrown,operationError});
  if(thrown){const info=countersinkCallFailure(operationError);if(!invoked&&info&&!info.terminal)throw operationError;throw failure('ENGINE_FAILURE','Native invocation or its exclusive owner failed; every exchange is revoked.',{invoked,cause:operationError});}
  try{requireCurrent();}catch(cause){raw=null;throw failure('ENGINE_FAILURE','The captured Native owner is no longer current.',{invoked,cause});}
  if(invalid||calls!==exchanges)throw failure('ENGINE_FAILURE','Native invocation did not produce its exact bounded exchange count.',{invoked});
  if(exchanges===0)return returnValue;
  try{if(new TextEncoder().encode(raw).byteLength>maxBytes)throw Error('UTF-8 byte bound');return JSON.parse(raw);}catch(cause){throw failure('ENGINE_FAILURE','Malformed or oversized Native exchange.',{invoked,cause});}
 }
 function query(method,name,maxBytes){return invoke(method,p=>[p.name(name)],{maxBytes});}
 function readMetrics(name){return metrics(query('_InspectOwnedSolidV2',name,limits.metrics));}
 function readTopology(name){const value=query('_ReadOwnedTopologyV1',name,limits.topology);try{nativeError(value,1,[]);return validateOwnedTopology(value);}catch(cause){throw decodedFailure(cause);}}
 function readCone(name){const value=query('_ReadOwnedConeTopologyV1',name,limits.cone);try{if(value?.error){const r=captureConicalNativeFailure(value);throw failure(r.error,r.error,{invoked:true});}return captureOwnedConeObservation(value);}catch(cause){throw decodedFailure(cause);}}
 function evidence(name){
  try{
  const before=readMetrics(name),topology=readTopology(name),mesh=query('_ReadOwnedMeshV2',name,limits.mesh);if(mesh?.error)throw failure('ENGINE_FAILURE','Actual Native result mesh is unavailable.',{invoked:true});const root=conicalFields(mesh,['faces']);
  if(!Array.isArray(root.faces)||root.faces.length<1||root.faces.length>1000)throw failure('ENGINE_FAILURE','Native mesh face count is invalid.',{invoked:true});if(!scratch)scratch=new Float64Array(900000);let offset=0,triangles=0;const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  for(const value of root.faces){const face=conicalFields(value,['inverted','tess']);if(typeof face.inverted!=='boolean'||!Array.isArray(face.tess))throw failure('ENGINE_FAILURE','Native mesh face data is malformed.',{invoked:true});for(const item of face.tess){if(!Array.isArray(item)||item.length!==1||!Array.isArray(item[0])||item[0].length!==3||++triangles>100000)throw failure('ENGINE_FAILURE','Native result mesh exceeds its triangle domain.',{invoked:true});const tri=item[0];for(let j=0;j<3;j++){const point=tri[face.inverted&&j!==0?3-j:j];if(!Array.isArray(point)||point.length!==3||point.some(n=>typeof n!=='number'||!Number.isFinite(n)||Math.abs(n)>4e6))throw failure('ENGINE_FAILURE','Native mesh coordinate is unqualified.',{invoked:true});for(let k=0;k<3;k++){scratch[offset++]=point[k];min[k]=Math.min(min[k],point[k]);max[k]=Math.max(max[k],point[k]);}}}}
  if(!triangles)throw failure('ENGINE_FAILURE','The actual result mesh is empty.',{invoked:true});
  const after=readMetrics(name);if(JSON.stringify(before)!==JSON.stringify(after)||JSON.stringify(readTopology(name))!==JSON.stringify(topology))throw failure('ENGINE_FAILURE','New-result meshing changed actual geometry metrics/catalog.',{invoked:true});
  const census=query('_InspectTopologyCensusV1',name,limits.census),c=conicalFields(census,['version','scope','isNull','shapeType','directChildren','counts']),keys=['compounds','compsolids','solids','shells','faces','wires','edges','vertices'],counts=conicalFields(c.counts,keys);
  if(c.version!==1||c.scope!=='response-local'||c.isNull!==false||!Number.isSafeInteger(c.shapeType)||c.shapeType<0||c.shapeType>8||!Number.isSafeInteger(c.directChildren)||c.directChildren<0||c.directChildren>100000||keys.some(k=>!Number.isSafeInteger(counts[k])||counts[k]<0||counts[k]>100000)||counts.solids!==1||counts.faces!==root.faces.length)throw failure('ENGINE_FAILURE','Actual Native solid census is unqualified.',{invoked:true});
  return {nativeVolume:after.nativeVolume,nativeBounds:after.nativeBounds,faces:root.faces.length,triangles,bounds:{min,max},signedVolume:measureExactSignedMeshVolume(scratch.subarray(0,offset)).signedVolume,empty:false,resultKind:'single-solid',solidCount:1,nativeValidity:{method:'occ-owned-solid-v2',valid:after.valid},nativeTopology:{version:1,method:'occ-topology-census-v1',shapeType:c.shapeType,directChildren:c.directChildren,counts},materialRegions:null,voidRegions:null,validLevel0:null,validLevel2:null,manifoldPredicate:null,volumeQuality:'tessellation-signed-integral'};
  }catch(cause){throw decodedFailure(cause);}
 }
 return Object.freeze({
  census(){const n=invoke('_OwnedShapeNamesV2',()=>[],{exchanges:0});if(!Number.isSafeInteger(n)||n<0||n>32)throw failure('ENGINE_CLEANUP_FAILED','Native owned-name census is unqualified.',{invoked:true});return n;},
  profile(name,prepared){const value=invoke('_CreateSelectedProfileV3',p=>[p.name(name),p.doubles(prepared.nativeValues),prepared.nativeValues.length],{maxBytes:limits.profile});nativeError(value,3,['PROFILE_CONSTRUCTION_FAILED']);return value;},
  subtract(a,b,name){const value=invoke('_ApplyOwnedBooleanHistoryV1',p=>[p.name(a),p.name(b),p.name(name),1],{maxBytes:limits.boolean});nativeError(value,1,BOOLEAN_REFUSAL_CODES);return value;},
  frustum(name,request){const value=invoke('_CreateOwnedConicalFrustumV1',p=>[p.name(name),p.doubles(request.frame),request.bottomRadius,request.topRadius,request.height],{maxBytes:4096});try{if(value?.error){const r=captureConicalNativeFailure(value),terminal=['CONICAL_INPUT_CHANGED','CONICAL_PUBLICATION_FAILED','ENGINE_CLEANUP_FAILED','MEASUREMENT_PRECISION_UNRESOLVED','CONICAL_INSPECTION_FAILED'].includes(r.error);throw failure(r.error,r.error,{invoked:true,terminal});}return value;}catch(cause){throw decodedFailure(cause);}},
  classify(name,point){if(!Array.isArray(point)||point.length!==3||point.some(n=>typeof n!=='number'||!Number.isFinite(n)||Math.abs(n)>4e6))throw failure('ENGINE_FAILURE','Invalid actual Native query point.');const n=invoke('_ClassifyOwnedPointV2',p=>[p.name(name),...point],{exchanges:0});if(!Number.isInteger(n)||n<0||n>3)throw failure('ENGINE_FAILURE','Native point classification failed.',{invoked:true});return ['inside','outside','boundary','unknown'][n];},
  release(name){const n=invoke('_ReleaseOwnedShapeV2',p=>[p.name(name)],{exchanges:0});if(n!==1)throw failure('ENGINE_CLEANUP_FAILED','Native exact-name release was not acknowledged.',{invoked:true});},
  topology:readTopology,metrics:readMetrics,cone:readCone,evidence
 });
}
