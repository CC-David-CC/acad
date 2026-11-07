// Worker-only structural validation of an authenticated native shell response.
import {validateOwnedTopology} from './ownedTopologyContract.mjs';
import {reconcileNativeSelectionClaims} from './booleanSelectionClaims.mjs';
const kinds=['vertices','edges','faces'],caps={vertices:1024,edges:512,faces:256},fail=message=>{throw Object.assign(Error(message),{code:'ENGINE_FAILURE'});};
const shellData=(v,keys)=>{if(!v||typeof v!=='object'||Array.isArray(v)||![null,Object.prototype].includes(Object.getPrototypeOf(v))||Reflect.ownKeys(v).length!==keys.length)fail('Expected exact native shell data');const r={};for(const k of keys){const d=Object.getOwnPropertyDescriptor(v,k);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('Native shell records must contain data');r[k]=d.value;}return r;};
function captureNative(value){
 const active=new Set(),encoder=new TextEncoder();let nodes=0,bytes=0;
 const charge=n=>{bytes+=n;if(bytes>4194304)fail('Native shell metadata exceeds4MiB');};
 function visit(v,depth){
  if(++nodes>262144||depth>24)fail('Native shell metadata exceeds its structural bound');
  if(v===null||typeof v==='boolean'){charge(v===null?4:v?4:5);return v;}
  if(typeof v==='number'){if(!Number.isFinite(v))fail('Expected finite native shell numbers');charge(JSON.stringify(v).length);return v;}
  if(typeof v==='string'){if(v.length>16384)fail('Native shell text exceeds its bound');charge(encoder.encode(JSON.stringify(v)).byteLength);return v;}
  if(!v||typeof v!=='object'||active.has(v))fail('Expected acyclic native shell data');const list=Array.isArray(v),keys=Reflect.ownKeys(v);
  if(list?(v.length>4096||keys.length!==v.length+1):(![null,Object.prototype].includes(Object.getPrototypeOf(v))||keys.length>32))fail('Invalid native shell metadata shape');
  active.add(v);const names=list?Array.from({length:v.length},(_,i)=>String(i)):keys,r=list?[]:{};charge(2+Math.max(0,names.length-1));
  for(const key of names){if(typeof key!=='string'||!list&&(key.length>64||key==='__proto__'))fail('Invalid native shell data key');const d=Object.getOwnPropertyDescriptor(v,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('Native shell fields must contain data');if(!list)charge(encoder.encode(JSON.stringify(key)).byteLength+1);r[key]=visit(d.value,depth+1);}active.delete(v);return r;
 }
 return visit(value,0);
}
const array=(v,length)=>{if(!Array.isArray(v)||v.length!==length||Reflect.ownKeys(v).length!==length+1)fail('Invalid shell native census');for(let i=0;i<length;i++){const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('Native shell census must be data');}return v;};
export function validateOwnedShellResult(value,{sourceTopology,topology,indices,thickness}){
 const v=captureNative(value),r=shellData(v,['version','valid','empty','solidCount','nativeVolume','nativeBounds','ancestry','sourceCopy','shell']);
 const source=validateOwnedTopology(sourceTopology),result=validateOwnedTopology(topology);
 if(r.version!==1||r.valid!==true||r.empty!==false||r.solidCount!==1||result.solidCount!==1||typeof r.nativeVolume!=='number'||!Number.isFinite(r.nativeVolume)||r.nativeVolume<=0)fail('Invalid positive shell measurements');
 const bounds=shellData(r.nativeBounds,['min','max']);array(bounds.min,3);array(bounds.max,3);if([...bounds.min,...bounds.max].some(x=>typeof x!=='number'||!Number.isFinite(x))||bounds.min.some((x,i)=>x>=bounds.max[i]))fail('Invalid shell bounds');
 const p=shellData(r.shell,['version','direction','thickness','removedFaces','constructionToleranceMm','join','intersection','selfIntersections']);
 if(p.version!==1||p.direction!=='inward'||p.thickness!==thickness||p.constructionToleranceMm!==1e-7||p.join!=='intersection'||p.intersection!==false||p.selfIntersections!==false||array(p.removedFaces,indices.length).some((x,i)=>x!==indices[i]))fail('Native shell input binding differs');
 const c=shellData(r.sourceCopy,['version','scope','persistentIds','kind','method','copyGeometry','copyMesh','sourceCounts','workingCounts',...kinds]);
 if(c.version!==1||c.scope!=='response-local'||c.persistentIds!==false||c.kind!=='verified-detached-native-copy'||c.method!=='BRepBuilderAPI_Copy'||c.copyGeometry!==true||c.copyMesh!==true)fail('Missing actual detached-copy certificate');
 for(const name of ['sourceCounts','workingCounts']){shellData(c[name],kinds);for(const kind of kinds)if(c[name][kind]!==source[kind].length)fail('Copy differs from original source census');}
 for(const kind of kinds){const count=source[kind].length;if(count>caps[kind])fail('Shell copy census exceeds native bounds');const seen=new Set();array(c[kind],count).forEach((row,i)=>{const x=shellData(row,['source','target']);if(x.source!==i+1||!Number.isSafeInteger(x.target)||x.target<1||x.target>count||seen.has(x.target))fail('Copy membership is not bijective');seen.add(x.target);});}
 const status=Object.getOwnPropertyDescriptor(r.ancestry??{},'status');if(!status?.enumerable||!Object.hasOwn(status,'value'))fail('Missing shell ancestry status');
 if(status.value==='unavailable'){const h=shellData(r.ancestry,['status','reason']);if(!['BOOLEAN_HISTORY_UNSUPPORTED','BOOLEAN_HISTORY_RESOURCE_LIMIT','BOOLEAN_HISTORY_FAILED'].includes(h.reason))fail('Unknown shell ancestry refusal');return {reason:h.reason};}
 const h=shellData(r.ancestry,['status','data']),data=shellData(h.data,['version','scope','persistentIds','sourceCounts','resultCounts',...kinds]);
 if(h.status!=='available'||data.version!==2||data.scope!=='response-local'||data.persistentIds!==false)fail('Expected truthful shell ancestry v2');
 for(const name of ['sourceCounts','resultCounts']){shellData(data[name],kinds);for(const kind of kinds)if(data[name][kind]!==(name==='sourceCounts'?source:result)[kind].length)fail('Shell history does not bind actual original/result');}
 try{reconcileNativeSelectionClaims({sources:[{claims:[],ancestry:data}],topology:result});}catch(error){if(error?.code==='SELECTION_RESOURCE_LIMIT')return {reason:error.code};throw error;}
 return {reason:null};
}
