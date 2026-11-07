// Worker-only checks; neither copy indices nor ancestry are document IDs.
import {validateOwnedTopology} from './ownedTopologyContract.mjs';
import {reconcileNativeSelectionClaims} from './booleanSelectionClaims.mjs';
const fail=message=>{throw Object.assign(Error(message),{code:'ENGINE_FAILURE'});};
const plain=v=>v&&typeof v==='object'&&!Array.isArray(v)&&[null,Object.prototype].includes(Object.getPrototypeOf(v));
const exact=(v,keys)=>{
 if(!plain(v)||Reflect.ownKeys(v).length!==keys.length)fail('Invalid native Boolean record.');
 const out={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(v,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('Native Boolean fields must be own data.');out[key]=d.value;}return out;
};
const list=(v,max,length)=>{
 if(!Array.isArray(v)||v.length>max||length!==undefined&&v.length!==length||Reflect.ownKeys(v).length!==v.length+1)fail('Invalid dense native Boolean array.');
 const out=[];for(let i=0;i<v.length;i++){const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('Native Boolean arrays must contain own data.');out.push(d.value);}return out;
};
const kinds=['vertices','edges','faces'],limits={vertices:1024,edges:512,faces:256};
const bounded=(n,max,min=0)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
// Current catalog/copy contracts bound all useful arrays at4096 members and
// topology at1024/512/256. This separate4MiB/262144-node envelope is deliberately
// above their normal encoded size. Histories are NOT walked/charged here:
// their own reconciliation resource refusal must only disable naming.
function captureGeometry(value){
 const active=new Set(),encoder=new TextEncoder();let nodes=0,bytes=0;
 const charge=n=>{bytes+=n;if(bytes>4194304)fail('Native Boolean geometry metadata exceeds its bound.');};
 function visit(v,depth){
  if(depth>24||++nodes>262144)fail('Native Boolean geometry metadata exceeds its work bound.');
  if(v===null||typeof v==='boolean'){charge(v===null?4:v?4:5);return v;}
  if(typeof v==='number'){if(!Number.isFinite(v))fail('Native Boolean geometry metadata must be finite.');charge(JSON.stringify(v).length);return v;}
  if(typeof v==='string'){if(v.length>16384)fail('Native Boolean geometry text exceeds its bound.');charge(encoder.encode(JSON.stringify(v)).byteLength);return v;}
  if(!v||typeof v!=='object'||active.has(v))fail('Native Boolean geometry metadata must be acyclic data.');
  const array=Array.isArray(v);if(!array&&!plain(v))fail('Native Boolean geometry metadata must be plain data.');
  if(array&&v.length>4096)fail('Native Boolean geometry array exceeds its bound.');
  const keys=Reflect.ownKeys(v);if(array&&keys.length!==v.length+1||!array&&keys.length>32)fail('Invalid native Boolean geometry fields.');
  active.add(v);charge(2+Math.max(0,(array?v.length:keys.length)-1));const out=array?[]:{},members=array?Array.from({length:v.length},(_,i)=>String(i)):keys;
  for(const key of members){if(typeof key!=='string'||!array&&(key.length>64||key==='__proto__'))fail('Invalid native Boolean geometry key.');const d=Object.getOwnPropertyDescriptor(v,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('Native Boolean geometry fields must contain data.');if(!array)charge(encoder.encode(JSON.stringify(key)).byteLength+1);out[key]=visit(d.value,depth+1);}
  active.delete(v);return out;
 }
 return visit(value,0);
}
export const BOOLEAN_REFUSAL_CODES=Object.freeze(['BOOLEAN_INVALID_REQUEST','BOOLEAN_INVALID_INPUT','BOOLEAN_NON_SOLID_INPUT','BOOLEAN_NON_SOLID_RESULT','BOOLEAN_FAILED','BOOLEAN_INVALID_RESULT','BOOLEAN_RESOURCE_LIMIT','BOOLEAN_COPY_FAILED']);
export const BOOLEAN_NAMING_REASONS=Object.freeze(['BOOLEAN_HISTORY_UNSUPPORTED','BOOLEAN_HISTORY_RESOURCE_LIMIT','BOOLEAN_HISTORY_FAILED','SELECTION_RESOURCE_LIMIT','SELECTION_UNAVAILABLE','NO_AUTHORED_SOURCE_SELECTIONS']);
export function validateOwnedBooleanResult(value,options){
 const v=exact(value,['version','valid','empty','solidCount','nativeVolume','nativeBounds','ancestryA','ancestryB','sourceCopyA','sourceCopyB']),binding=exact(options,['sourceTopologies','topology']);
 const sourceValues=list(binding.sourceTopologies,2,2),result=validateOwnedTopology(captureGeometry(binding.topology)),sources=sourceValues.map(source=>validateOwnedTopology(captureGeometry(source)));
 if(v.version!==1||v.valid!==true||typeof v.empty!=='boolean'||!bounded(v.solidCount,256)||result.solidCount!==v.solidCount||typeof v.nativeVolume!=='number'||!Number.isFinite(v.nativeVolume))fail('Invalid native Boolean measurements.');
 if(v.empty){if(v.solidCount!==0||v.nativeVolume!==0||v.nativeBounds!==null||kinds.some(k=>result[k].length))fail('Invalid empty Boolean result.');}
 else{
  const box=exact(v.nativeBounds,['min','max']),min=list(box.min,3,3),max=list(box.max,3,3);
  if(v.solidCount<1||v.nativeVolume<=0||!result.faces.length||[...min,...max].some(n=>typeof n!=='number'||!Number.isFinite(n))||min.some((n,i)=>n>=max[i]))fail('Invalid nonempty Boolean result.');
 }
 let reason=null;
 for(let i=0;i<2;i++){
  const copy=exact(captureGeometry(v[i?'sourceCopyB':'sourceCopyA']),['version','scope','persistentIds','kind','method','copyGeometry','copyMesh','sourceCounts','workingCounts',...kinds]),source=sources[i];
  const empty=kinds.every(k=>source[k].length===0)&&source.solidCount===0;
  if(copy.version!==1||copy.scope!=='response-local'||copy.persistentIds!==false||copy.kind!=='verified-detached-native-copy'||copy.method!==(empty?'TopoDS_Shape.EmptyCopied':'BRepBuilderAPI_Copy')||copy.copyGeometry!==!empty||copy.copyMesh!==!empty)fail('Invalid native detached-copy certificate.');
  for(const name of ['sourceCounts','workingCounts']){exact(copy[name],kinds);for(const kind of kinds)if(copy[name][kind]!==source[kind].length)fail('Native copy differs from actual source membership.');}
  for(const kind of kinds){
   const count=source[kind].length,rows=list(copy[kind],limits[kind],count),seen=new Set();
   rows.forEach((row,j)=>{const r=exact(row,['source','target']);if(r.source!==j+1||!bounded(r.target,count,1)||seen.has(r.target))fail('Detached-copy membership is not a bijection.');seen.add(r.target);});
  }
  const rawObservation=v[i?'ancestryB':'ancestryA'],status=Object.getOwnPropertyDescriptor(rawObservation??{},'status');
  if(!status?.enumerable||!Object.hasOwn(status,'value'))fail('Native Boolean history status must be data.');
  if(status.value==='unavailable'){
   const observation=exact(rawObservation,['status','reason']);if(!BOOLEAN_NAMING_REASONS.slice(0,3).includes(observation.reason))fail('Invalid native Boolean history refusal.');reason??=observation.reason;
  }else{
   const observation=exact(rawObservation,['status','data']);if(observation.status!=='available')fail('Missing native Boolean history.');
   const data=exact(observation.data,['version','scope','persistentIds','sourceCounts','resultCounts',...kinds]),sourceCounts=exact(data.sourceCounts,kinds),resultCounts=exact(data.resultCounts,kinds);
   if(data.version!==2||data.scope!=='response-local'||data.persistentIds!==false)fail('Missing native Boolean history.');
   for(const kind of kinds)if(sourceCounts[kind]!==source[kind].length||resultCounts[kind]!==result[kind].length)fail('Boolean history differs from the actual original input or result.');
   // Reconciliation captures/validates every nested row without invoking
   // accessors. Oversized genuine history loses naming, not valid geometry;
   // the other source history is still independently checked below.
   try{reconcileNativeSelectionClaims({sources:[{claims:[],ancestry:data}],topology:result});}
   catch(e){if(e?.code!=='SELECTION_RESOURCE_LIMIT')throw e;reason??=e.code;}
  }
 }
 return{reason};
}
