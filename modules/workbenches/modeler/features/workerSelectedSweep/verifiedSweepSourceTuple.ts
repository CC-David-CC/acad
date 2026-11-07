// Private candidate-only reuse of already independently verified source data.
// No Worker envelope/revision rewriting, geometry, hash or source mutation.
const SCOPE = Symbol('verified-sweep-source-tuples'), META = Symbol('verified-sweep-source-accounting');
const get = Function.call.bind(Map.prototype.get), set = Function.call.bind(Map.prototype.set), drop = Function.call.bind(Map.prototype.delete), entries = Function.call.bind(Map.prototype.entries);
const MAX_ENTRIES=32, MAX_BYTES=8*1024*1024;
export type SweepSourceTupleKey = {identities:readonly any[];values:readonly any[]};
const abort=()=>new DOMException('Sweep source proof was retired or superseded.','AbortError');
// Existing operation checks remain the authority. Reacquiring the candidate Map
// also rejects sealed owners whose ordinary publication guard remains usable.
export function requireSweepSourceProofCurrent(owner:any,current:()=>void){current();if(typeof owner.getCandidateSourceProofCache==='function'){owner.getCandidateSourceProofCache();current();owner.getCandidateSourceProofCache();}else current();}
function same(a:SweepSourceTupleKey,b:SweepSourceTupleKey){return a.identities.length===b.identities.length&&a.values.length===b.values.length&&a.identities.every((v,i)=>Object.is(v,b.identities[i]))&&a.values.every((v,i)=>Object.is(v,b.values[i]));}
function keyCopy(key:SweepSourceTupleKey){if(!key||!Array.isArray(key.identities)||!Array.isArray(key.values)||key.identities.length>64||key.values.length>64)return null;let bytes=64+key.identities.length*16;for(const v of key.values){if(typeof v==='string')bytes+=4*v.length+32;else if(v===null||v===undefined||typeof v==='boolean'||typeof v==='number'&&Number.isFinite(v))bytes+=16;else return null;if(bytes>MAX_BYTES)return null;}return{key:Object.freeze({identities:Object.freeze([...key.identities]),values:Object.freeze([...key.values])}),bytes};}
// Structural admission/accounting of bounded data previously admitted by the
// real solve client. Failure only disables optional reuse, never new geometry
// admission. No JSON stringify/hash or mathematical evaluation is performed.
function frozenProof(value:any){
 let bytes=0,nodes=0;const seen=new Set(),objects:any[]=[];
 function inspect(v:any,depth:number){
  if(++nodes>32768||depth>32)throw 0;
  if(typeof v==='string')bytes+=32+4*v.length;
  else if(typeof v==='number'){if(!Number.isFinite(v))throw 0;bytes+=16;}
  else if(v===null||typeof v==='boolean')bytes+=8;
  else if(v&&typeof v==='object'){
   if(seen.has(v))throw 0;seen.add(v);const array=Array.isArray(v),proto=Object.getPrototypeOf(v);
   if(!array&&proto!==null&&proto!==Object.prototype)throw 0;
   const keys=Reflect.ownKeys(v);if(keys.length>16385||array&&(v.length>16384||keys.length!==v.length+1))throw 0;bytes+=32;
   for(const k of keys){
    if(array&&k==='length')continue;
    if(typeof k!=='string'||array&&(!/^(?:0|[1-9][0-9]*)$/.test(k)||Number(k)>=v.length))throw 0;
    const d=Object.getOwnPropertyDescriptor(v,k);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw 0;
    bytes+=4*k.length+16;if(bytes>MAX_BYTES)throw 0;inspect(d.value,depth+1);
   }
   seen.delete(v);objects.push(v);
  }else throw 0;
  if(bytes>MAX_BYTES)throw 0;
 }
 try{
  inspect(value,0);
  // The callback returns a private already-admitted Worker-data record, never
  // live source/model objects. Retain it immutably without a second deep clone.
  // Finish bounded validation/accounting before changing its descriptors.
  for(const object of objects)Object.freeze(object);
  return{value,bytes};
 }catch{return null;}
}
export async function verifiedSweepSourceTuple(owner:any,key:SweepSourceTupleKey,current:()=>void,compute:()=>Promise<any>){
 requireSweepSourceProofCurrent(owner,current);
 // Optimization is optional for legacy isolated operation fixtures/owners.
 if(typeof owner.getCandidateSourceProofCache!=='function'){const value=await compute();current();return value;}
 const cache=owner.getCandidateSourceProofCache(),active=()=>{current();if(owner.getCandidateSourceProofCache()!==cache)throw abort();current();if(owner.getCandidateSourceProofCache()!==cache)throw abort();};active();
 const copied=keyCopy(key);if(!copied){const value=await compute();active();return value;}
 let meta=get(cache,META);if(!meta){meta={scope:SCOPE,count:0,bytes:0};set(cache,META,meta);}
 for(const [,entry]of entries(cache)){if(entry?.scope===SCOPE&&entry!==meta&&same(entry.key,copied.key)){const value=entry.state==='ready'?entry.value:await entry.promise;active();if(entry.state==='uncached'&&!entry.shareable){const separate=await compute();active();return separate;}return value;}}
 if(meta.count>=MAX_ENTRIES||meta.bytes+copied.bytes>MAX_BYTES){const value=await compute();active();return value;}
 const id=Symbol('verified-sweep-source-tuple'),entry:any={scope:SCOPE,key:copied.key,bytes:copied.bytes,state:'pending',promise:null};meta.count++;meta.bytes+=entry.bytes;set(cache,id,entry);
 const remove=()=>{if(get(cache,id)===entry){drop(cache,id);meta.count--;meta.bytes-=entry.bytes;}};
 entry.promise=Promise.resolve().then(async()=>{active();const value=await compute();active();const frozen=frozenProof(value);active();if(get(cache,id)!==entry)throw abort();if(!frozen||meta.bytes+frozen.bytes>MAX_BYTES){remove();entry.state='uncached';entry.shareable=!!frozen;return frozen?frozen.value:value;}entry.bytes+=frozen.bytes;meta.bytes+=frozen.bytes;entry.value=frozen.value;entry.state='ready';return entry.value;}).catch(error=>{remove();throw error;});
 const value=await entry.promise;active();return value;
}
