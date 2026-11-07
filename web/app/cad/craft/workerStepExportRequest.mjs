// Public output selections, never native names, pointers or replacement geometry.
// A shared service must bind these identities to a fresh current-part ledger.
const fail=message=>{throw Object.assign(Error(message),{code:'INVALID_REQUEST'});};
function record(value,keys){
 const p=value&&typeof value==='object'?Object.getPrototypeOf(value):undefined;
 if(!value||typeof value!=='object'||Array.isArray(value)||(p!==null&&Object.getPrototypeOf(p)!==null))fail('STEP intent must be a plain data record.');
 const own=Reflect.ownKeys(value);
 if(own.length!==keys.length||own.some(k=>typeof k!=='string'||!keys.includes(k)))fail('STEP intent has unexpected or missing fields.');
 const out={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('STEP fields must be enumerable own data.');out[key]=d.value;}
 return out;
}
const text=(v,n)=>typeof v==='string'&&v.length>0&&v.length<=n;
export function captureWorkerStepExportRequest(value){
 const a=record(value,['revision','geometryRevision','version','unit','engine','engineRevision','bodies']);
 if(!text(a.revision,256)||!text(a.geometryRevision,256)||a.version!==1||a.unit!=='millimeter'||a.engine!=='occ'||typeof a.engineRevision!=='string'||!/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/.test(a.engineRevision))fail('Select current document and geometry revisions and an explicit millimeter OCC build.');
 const b=a.bodies;if(!Array.isArray(b)||b.length<1||b.length>32||Reflect.ownKeys(b).length!==b.length+1)fail('Select one to32 distinct current outputs.');
 const ids=new Set(),features=new Set();
 a.bodies=Object.freeze(Array.from({length:b.length},(_,i)=>{
  const d=Object.getOwnPropertyDescriptor(b,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('STEP selections must be dense own data.');
  const body=record(d.value,['bodyId','featureId']);
  if(!text(body.bodyId,1024)||!Number.isSafeInteger(body.featureId)||body.featureId<1||ids.has(body.bodyId)||features.has(body.featureId))fail('STEP outputs require distinct current body and producer identities.');
  ids.add(body.bodyId);features.add(body.featureId);return Object.freeze(body);
 }));return Object.freeze(a);
}
