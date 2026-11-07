// Shallow transport admission only. Domain-specific consumers must still
// validate nested data, identities and mathematical/native evidence.
/** @returns {Record<string, any>} */
export function captureWorkerReplyRecord(value){
 const proto=value&&typeof value==='object'?Object.getPrototypeOf(value):undefined;
 if(!value||typeof value!=='object'||Array.isArray(value)||(proto!==null&&proto!==Object.prototype))throw Error('Worker reply must be a plain record.');
 const keys=Reflect.ownKeys(value);if(keys.length>32)throw Error('Worker reply header exceeds its limit.');
 const out=Object.create(null);
 for(const key of keys){
  if(typeof key!=='string')throw Error('Worker reply fields must be strings.');
  const d=Object.getOwnPropertyDescriptor(value,key);
  if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Worker reply fields must be data.');
  out[key]=d.value;
 }
 return out;
}

// Small JSON metadata only: never pass meshes, buffers or full sketch sources.
export function captureWorkerMetadata(value){
 let nodes=0,characters=0;const ancestors=new Set();
 function visit(v,depth){
  if(++nodes>512||depth>8)throw Error('Worker metadata exceeds its structural limit.');
  if(v===null||typeof v==='boolean')return v;
  if(typeof v==='number'){if(!Number.isFinite(v))throw Error('Worker metadata must be finite.');return v;}
  if(typeof v==='string'){characters+=v.length;if(characters>32768)throw Error('Worker metadata exceeds its text limit.');return v;}
  if(!v||typeof v!=='object'||ancestors.has(v))throw Error('Worker metadata must be acyclic data.');
  ancestors.add(v);let out;
  if(Array.isArray(v)){
   if(v.length>32||Reflect.ownKeys(v).length!==v.length+1)throw Error('Worker metadata arrays must be bounded dense data.');out=[];
   for(let i=0;i<v.length;i++){const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Worker metadata arrays must be data.');out.push(visit(d.value,depth+1));}
  }else{
   out=Object.create(null);const data=captureWorkerReplyRecord(v);
   for(const key of Object.keys(data)){characters+=key.length;if(characters>32768)throw Error('Worker metadata exceeds its text limit.');out[key]=visit(data[key],depth+1);}
  }
  ancestors.delete(v);return out;
 }
 return visit(value,0);
}
