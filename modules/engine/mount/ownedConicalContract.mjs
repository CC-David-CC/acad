// UNREGISTERED Worker-only port DTOs. Capturing data grants no Native authority.
// Future dispatch must bind both responses to one actual owned invocation/build.
import {validateOwnedTopology} from './ownedTopologyContract.mjs';

export const CONICAL_LIMITS=Object.freeze({responseBytes:524288,constructionBytes:4096,vertices:1024,edges:512,faces:256,uses:4096});
export const CONICAL_NATIVE_CODES=Object.freeze(['CONICAL_INVALID_REQUEST','CONICAL_UNSUPPORTED_DOMAIN','CONICAL_INVALID_SHAPE','CONICAL_CONSTRUCTION_FAILED','CONICAL_PROVENANCE_UNRESOLVED','CONICAL_RESOURCE_LIMIT','CONICAL_INPUT_CHANGED','CONICAL_INSPECTION_FAILED','CONICAL_PUBLICATION_FAILED','MEASUREMENT_PRECISION_UNRESOLVED','ENGINE_CLEANUP_FAILED']);
const fail=message=>{throw Object.assign(Error(message),{code:'ENGINE_FAILURE'});};
export function conicalFields(value,keys){
 const p=value&&typeof value==='object'?Object.getPrototypeOf(value):undefined;
 if(!value||typeof value!=='object'||Array.isArray(value)||(p!==null&&Object.getPrototypeOf(p)!==null)||Reflect.ownKeys(value).length!==keys.length)fail('Expected exact private conical data.');
 const out={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('Conical fields must be own data.');out[key]=d.value;}return out;
}
export function captureConicalData(value,maxBytes=CONICAL_LIMITS.responseBytes){
 if(!Number.isSafeInteger(maxBytes)||maxBytes<1||maxBytes>CONICAL_LIMITS.responseBytes)fail('Invalid private conical capture limit.');
 const seen=new Set(),encoder=new TextEncoder();let nodes=0,bytes=0;
 const charge=n=>{bytes+=n;if(bytes>maxBytes)fail('Conical response exceeds its aggregate byte bound.');};
 function visit(v,depth){
  if(++nodes>65536||depth>20)fail('Conical response exceeds its capture work bound.');
  if(v===null||typeof v==='boolean'){charge(v===null?4:v?4:5);return v;}
  if(typeof v==='number'){if(!Number.isFinite(v))fail('Nonfinite conical value.');charge(JSON.stringify(v).length);return v;}
  if(typeof v==='string'){if(v.length>256)fail('Conical text exceeds its bound.');charge(encoder.encode(JSON.stringify(v)).byteLength);return v;}
  if(!v||typeof v!=='object'||seen.has(v))fail('Conical response must be a tree of own data.');seen.add(v);
  const array=Array.isArray(v),p=Object.getPrototypeOf(v),keys=Reflect.ownKeys(v),length=array?Object.getOwnPropertyDescriptor(v,'length')?.value:null;
  if(array?(!Number.isSafeInteger(length)||length>4096||keys.length!==length+1):(p!==null&&Object.getPrototypeOf(p)!==null)||keys.length>32)fail('Invalid conical container.');
  const names=array?Array.from({length},(_,i)=>String(i)):keys,out=array?[]:{};charge(2+Math.max(0,names.length-1));
  for(const key of names){if(typeof key!=='string'||!array&&(key==='__proto__'||key.length>64))fail('Invalid conical key.');const d=Object.getOwnPropertyDescriptor(v,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('Conical members must be own data.');if(!array)charge(encoder.encode(JSON.stringify(key)).byteLength+1);out[key]=visit(d.value,depth+1);}return Object.freeze(out);
 }
 return visit(value,0);
}
const finite=(n,max=4e6)=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=max;
const dot=(a,b)=>a.reduce((s,n,i)=>s+n*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function vector(v){if(!Array.isArray(v)||v.length!==3||v.some(n=>!finite(n)))fail('Invalid conical support vector.');return v;}
function basis(row){
 for(const key of ['axis','x','y'])if(Math.abs(dot(vector(row[key]),row[key])-1)>1e-12)fail('Conical basis is not unit.');
 if(Math.abs(dot(row.x,row.y))>1e-12||Math.abs(dot(row.x,row.axis))>1e-12||Math.abs(dot(row.y,row.axis))>1e-12||typeof row.direct!=='boolean'||Math.hypot(...cross(row.x,row.y).map((n,i)=>n-(row.direct?1:-1)*row.axis[i]))>1e-12)fail('Invalid conical handed basis.');
}
export function captureOwnedConeObservation(value){
 const r=conicalFields(captureConicalData(value),['version','scope','persistentIds','topology','coneFaces']);
 if(r.version!==1||r.scope!=='response-local'||r.persistentIds!==false)fail('Invalid coupled cone observation identity.');validateOwnedTopology(r.topology);
 const expected=r.topology.faces.filter(f=>f.type==='cone').map(f=>f.index);
 if(!Array.isArray(r.coneFaces)||r.coneFaces.length!==expected.length)fail('Coupled cone face census differs from its actual V1 catalog.');
 for(let i=0;i<r.coneFaces.length;i++){
  const c=conicalFields(r.coneFaces[i],['face','origin','axis','x','y','referenceRadius','semiAngle','direct']);
  if(c.face!==expected[i]||!finite(c.referenceRadius)||c.referenceRadius<0||!finite(c.semiAngle,Math.PI/2)||c.semiAngle===0||Math.abs(c.semiAngle)>=Math.PI/2)fail('Invalid actual cone membership/support.');vector(c.origin);basis(c);
 }
 return Object.freeze(r);
}
export function assertCoupledConeCatalog(observation,topology){
 const captured=captureConicalData(topology);validateOwnedTopology(captured);
 if(JSON.stringify(observation.topology)!==JSON.stringify(captured))fail('Coupled cone observation differs from the actual same-invocation Boolean catalog.');
 return observation;
}
export function captureConicalConstruction(value,request,observation){
 const r=conicalFields(captureConicalData(value,CONICAL_LIMITS.constructionBytes),['version','valid','solidCount','nativeVolume','nativeBounds','constructionProvenance']);
 if(r.version!==1||r.valid!==true||r.solidCount!==1||!finite(r.nativeVolume,Number.MAX_VALUE)||r.nativeVolume<=0||observation.topology.solidCount!==1)fail('Invalid actual conical constructor metrics.');
 const bounds=conicalFields(r.nativeBounds,['min','max']);vector(bounds.min);vector(bounds.max);if(bounds.min.some((n,i)=>n>=bounds.max[i]))fail('Invalid conical constructor bounds.');
 const p=conicalFields(r.constructionProvenance,['version','scope','persistentIds','source','request','resultCounts','faces','edges']);
 if(p.version!==1||p.scope!=='response-local'||p.persistentIds!==false||p.source!=='BRepPrimAPI_MakeCone')fail('Unknown conical builder provenance.');
 const actual=conicalFields(p.request,['frame','bottomRadius','topRadius','height']),expected=conicalFields(request,['frame','bottomRadius','topRadius','height']);
 if(!Array.isArray(actual.frame)||actual.frame.length!==12||!Array.isArray(expected.frame)||expected.frame.length!==12||actual.frame.some((n,i)=>!finite(n)||!Object.is(n,expected.frame[i]))||['bottomRadius','topRadius','height'].some(k=>!Object.is(actual[k],expected[k])))fail('Actual conical builder request differs from its captured numeric invocation.');
 const x=actual.frame.slice(3,6),y=actual.frame.slice(6,9),z=actual.frame.slice(9,12);
 if([x,y,z].some(v=>Math.abs(dot(v,v)-1)>1e-12)||Math.abs(dot(x,y))>1e-12||Math.abs(dot(x,z))>1e-12||Math.abs(dot(y,z))>1e-12||Math.hypot(...cross(x,y).map((n,i)=>n-z[i]))>1e-12||!['bottomRadius','topRadius','height'].every(k=>finite(actual[k],1e6)&&actual[k]>0)||!(actual.bottomRadius<actual.topRadius))fail('Invalid conical constructor numeric request domain.');
 const counts=conicalFields(p.resultCounts,['vertices','edges','faces']);for(const key of ['vertices','edges','faces'])if(counts[key]!==observation.topology[key].length)fail('Conical role counts differ from the SAME actual catalog.');
 const faces=conicalFields(p.faces,['wall','bottomCap','topCap']),edges=conicalFields(p.edges,['bottomRim','topRim']);
 if(new Set(Object.values(faces)).size!==3||Object.values(faces).some(n=>!Number.isSafeInteger(n)||n<1||n>observation.topology.faces.length)||observation.topology.faces.length!==3||new Set(Object.values(edges)).size!==2||Object.values(edges).some(n=>!Number.isSafeInteger(n)||n<1||n>observation.topology.edges.length)||observation.coneFaces.length!==1||observation.coneFaces[0].face!==faces.wall)fail('Conical builder roles do not close over the actual three distinct faces and two rims.');
 return Object.freeze(r);
}
export function captureConicalNativeFailure(value){const r=conicalFields(captureConicalData(value,512),['version','error']);if(r.version!==1||!CONICAL_NATIVE_CODES.includes(r.error))fail('Malformed conical Native failure.');return Object.freeze(r);}
export function decodeOwnedConeObservation(buffer){
 let length;try{length=Object.getOwnPropertyDescriptor(ArrayBuffer.prototype,'byteLength').get.call(buffer);new DataView(buffer);}catch{fail('Expected attached private Native cone bytes.');}
 if(length<1||length>CONICAL_LIMITS.responseBytes)fail('Native coupled cone bytes exceed512KiB.');
 let value;try{value=JSON.parse(new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(buffer));}catch{fail('Malformed Native coupled cone UTF-8/JSON.');}return captureOwnedConeObservation(value);
}
