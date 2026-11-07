// Postcondition over already-authenticated private ledger observations. Calling
// this with arbitrary JSON is not native proof. No physical assignments change.
import {requireCadEngineBuild} from '../mount/engineCatalog.mjs';
const fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
const malformed=()=>fail('ENGINE_FAILURE','Malformed Join result observations.');
function object(value,max=64){
 if(!value||typeof value!=='object'||Array.isArray(value))malformed();
 const keys=Reflect.ownKeys(value);if(keys.length>max||keys.some(k=>typeof k!=='string'))malformed();
 const copy=Object.create(null);for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))malformed();copy[key]=d.value;}return copy;
}
function exact(value,keys){const copy=object(value,keys.length);if(Object.keys(copy).length!==keys.length||keys.some(k=>!Object.hasOwn(copy,k)))malformed();return copy;}
const count=n=>Number.isSafeInteger(n)&&n>=0;
const unqualified=message=>fail('JOIN_UNQUALIFIED',message);
function topology(value){
 const t=exact(value,['version','method','shapeType','directChildren','counts']),names=['compounds','compsolids','solids','shells','faces','wires','edges','vertices'],counts=exact(t.counts,names);
 if(t.version!==1||t.method!=='occ-topology-census-v1'||!Number.isSafeInteger(t.shapeType)||t.shapeType<0||t.shapeType>8||!count(t.directChildren)||names.some(k=>!count(counts[k])))malformed();return {...t,counts};
}
function bounds(value){const b=exact(value,['min','max']),copy=[];for(const key of ['min','max']){const a=b[key];if(!Array.isArray(a)||a.length!==3||Reflect.ownKeys(a).length!==4)malformed();const out=[];for(let i=0;i<3;i++){const d=Object.getOwnPropertyDescriptor(a,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value')||!Number.isFinite(d.value))malformed();out.push(d.value);}copy.push(out);}if(copy[0].some((n,i)=>n>copy[1][i]))malformed();}
export function requireSingleGeometricSolid(input){
 const {engine,engineRevision,metrics}=exact(input,['engine','engineRevision','metrics']),build=requireCadEngineBuild(engine,engineRevision),m=object(metrics),runtime=object(m.runtime,5);
 if(runtime.mountEngine!==build.mountEngine||runtime.representation!==build.representation||runtime.jsSha256!==build.runtimeAssets.jsSha256||runtime.wasmSha256!==build.runtimeAssets.wasmSha256||Object.keys(runtime).some(k=>!['mountEngine','representation','jsSha256','wasmSha256','workerSha256'].includes(k))||runtime.workerSha256!==undefined&&(typeof runtime.workerSha256!=='string'||!/^[a-f0-9]{64}$/.test(runtime.workerSha256)))fail('ENGINE_BINDING_MISMATCH','Join observations belong to another engine build.');
 if(m.unit!=='millimeter'||m.version!==1)malformed();
 if(m.resultKind==='empty')fail('JOIN_EMPTY','Join requires a nonempty connected geometric solid.');
 let proof;
 if(engine==='occ'){
  if(m.nativeValidity===null||m.nativeValidity===undefined||m.nativeTopology===null||m.nativeTopology===undefined)unqualified('This OpenCascade build does not provide the native proof required for Join.');
  const v=exact(m.nativeValidity,['method','valid']);if(!['occ-inspect-analytic-v1','occ-owned-solid-v2'].includes(v.method)||typeof v.valid!=='boolean')malformed();
  if(!v.valid)fail('JOIN_INVALID_TOPOLOGY','The native Join result is not a valid B-rep.');
  const t=topology(m.nativeTopology),c=t.counts;if(!count(m.solidCount)||c.solids!==m.solidCount)malformed();
  if(c.solids===0)fail('JOIN_NON_SOLID','The native Join result has no geometric solid.');
  if(c.solids>1)fail('JOIN_MULTIPLE_SOLIDS','Join produced multiple geometric solids; use explicit separate-result intent.');
  // A valid direct solid accounts for all result topology; direct children
  // must be its shells, including cavity shells. A sole-solid wrapper must
  // have precisely ONE accounted child, with no extra/nested wrapper claim.
  const direct=t.shapeType===2&&c.compounds===0&&c.compsolids===0&&t.directChildren===c.shells;
  const compound=t.shapeType===0&&c.compounds===1&&c.compsolids===0&&t.directChildren===1;
  const compsolid=t.shapeType===1&&c.compounds===0&&c.compsolids===1&&t.directChildren===1;
  if(c.shells<1||c.faces<1||!(direct||compound||compsolid))unqualified('The native census does not establish a fully accounted sole-solid Join result.');
  if(m.resultKind!=='single-solid'||typeof m.nativeVolume!=='number'||!Number.isFinite(m.nativeVolume)||m.nativeVolume<=0||m.nativeBounds===null||m.nativeBounds===undefined)unqualified('Join needs current nonempty native solid measurements.');bounds(m.nativeBounds);
  proof='occ-native-solid-census-v1';
 }else if(engine==='smlib'){
  if(m.validLevel0===false||m.validLevel2===false)fail('JOIN_INVALID_TOPOLOGY','The native Join result failed B-rep validation.');
  if(m.manifoldPredicate===false)fail('JOIN_NONMANIFOLD','The native Join result is not manifold.');
  if(m.validLevel0!==true||m.validLevel2!==true||m.manifoldPredicate!==true||!count(m.materialRegions)||!count(m.voidRegions))unqualified('This SMLib result lacks the native geometric-domain proof required for Join.');
  if(m.materialRegions===0)fail('JOIN_NON_SOLID','The native Join result has no geometric material domain.');
  if(m.materialRegions>1)fail('JOIN_MULTIPLE_SOLIDS','Join produced multiple native geometric domains; use explicit separate-result intent.');
  if(m.resultKind!=='single-material'||m.volumeAvailable!==true||m.volumeQuality!=='native-relative-0.001'||typeof m.reportedVolume!=='number'||!Number.isFinite(m.reportedVolume)||m.reportedVolume<=0)unqualified('Join needs a nonempty measured SMLib geometric domain.');
  // NVIDIA's geometric material/void census is NOT an authored physical
  // material assignment. Voids are allowed; assignments are never merged.
  proof='smlib-native-unpartitioned-domain-v1';
 }else unqualified('Manifold mesh status and boundary-component counts do not yet establish the connected-solid Join postcondition.');
 return Object.freeze({version:1,policy:'single-connected-geometric-solid',engine,engineRevision,proof});
}
