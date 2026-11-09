// Private shape-free OCI Worker call only. No mount, source authority or events.
import {encodeFiniteCurveReadInput,captureFiniteCurveReadResult,captureFiniteCurveReadError,FINITE_CURVE_READ_LIMITS} from './finiteCurveReadProtocol.mjs';
const failures=new WeakMap(),own=(value,key)=>Object.prototype.hasOwnProperty.call(value,key);
const memoryBuffer=Function.call.bind(Object.getOwnPropertyDescriptor(WebAssembly.Memory.prototype,'buffer').get);
const arrayBufferBytes=Function.call.bind(Object.getOwnPropertyDescriptor(ArrayBuffer.prototype,'byteLength').get);
const typedArrayPrototype=Object.getPrototypeOf(Int8Array.prototype);
const typedBuffer=Function.call.bind(Object.getOwnPropertyDescriptor(typedArrayPrototype,'buffer').get);
const typedOffset=Function.call.bind(Object.getOwnPropertyDescriptor(typedArrayPrototype,'byteOffset').get);
const typedBytes=Function.call.bind(Object.getOwnPropertyDescriptor(typedArrayPrototype,'byteLength').get);
const typedName=Function.call.bind(Object.getOwnPropertyDescriptor(typedArrayPrototype,Symbol.toStringTag).get);
const descriptorKeys=['value','writable','get','set','enumerable','configurable'];
function sameDescriptor(a,b){return a===undefined||b===undefined?a===b:descriptorKeys.every(key=>own(a,key)===own(b,key)&&(!own(a,key)||Object.is(a[key],b[key])));}
function failure(code,message,{cause,invoked=false,terminal=true}={}){const error=Object.assign(Error(message),{code,...(cause===undefined?{}:{cause})});failures.set(error,Object.freeze({invoked,terminal}));return error;}
export function finiteCurveCallFailure(value){return value!==null&&(typeof value==='object'||typeof value==='function')?failures.get(value)||null:null;}
function data(value,key){const d=value&&typeof value==='object'?Object.getOwnPropertyDescriptor(value,key):null;if(!d||!own(d,'value'))throw Error('Expected actual own-data Native binding: '+key);return d.value;}
function captureContext(context){const keys=['Module','malloc','free','owner','requireCurrent'];if(!context||typeof context!=='object'||Array.isArray(context)||Reflect.ownKeys(context).length!==keys.length||Reflect.ownKeys(context).some(key=>typeof key!=='string'||!keys.includes(key)))throw Error('Expected exact private finite-curve call context');return Object.fromEntries(keys.map(key=>[key,data(context,key)]));}
// This bounded preparse check preserves duplicate-key information before JSON
// decoding. Geometry and the actual result shape are still the frozen codec's job.
function parseNativeText(raw){
 if(typeof raw!=='string'||raw.length>FINITE_CURVE_READ_LIMITS.responseBytes||new TextEncoder().encode(raw).byteLength>FINITE_CURVE_READ_LIMITS.responseBytes)throw Error('Native finite-curve text exceeds64KiB');
 const stack=[];let i=0;
 while(i<raw.length){
  const c=raw[i];
  if(c==='"'){
   const start=i++;let ended=false;
   while(i<raw.length){const n=raw[i++];if(n==='\\'){if(i>=raw.length)throw Error('Unterminated Native JSON escape');i++;}else if(n==='"'){ended=true;break;}}
   if(!ended)throw Error('Unterminated Native JSON string');
   let next=i;while(next<raw.length&&/[\x20\x09\x0a\x0d]/.test(raw[next]))next++;
   if(raw[next]===':'){const current=stack[stack.length-1];if(!current||current.kind!=='object')throw Error('Native JSON member outside object');const key=JSON.parse(raw.slice(start,i));if(current.keys.has(key))throw Error('Duplicate Native JSON member');current.keys.add(key);}
   continue;
  }
  if(c==='{'||c==='['){if(stack.length>=16)throw Error('Native JSON nesting exceeds finite wire');stack.push({kind:c==='{'?'object':'array',keys:new Set()});}
  else if(c==='}'||c===']'){const current=stack.pop();if(!current||current.kind!==(c==='}'?'object':'array'))throw Error('Unbalanced Native JSON');}
  i++;
 }
 if(stack.length)throw Error('Unterminated Native JSON container');return JSON.parse(raw);
}
export function createFiniteCurveNativeCalls(context){
 let captured,Module,malloc,free,owner,requireCurrent,asm,memory,method,asmMethod,asmMalloc,asmFree,lastHeapBytes=0,active=false,poisoned=false;
 function identities(){
  const current=captureContext(context);
  if(current.Module!==Module||current.malloc!==malloc||current.free!==free||current.owner!==owner||current.requireCurrent!==requireCurrent||data(globalThis,'Module')!==Module||data(Module,'asm')!==asm||data(asm,'memory')!==memory||data(Module,'_ReadFiniteCurveIntersectionsV1')!==method||data(Module,'_malloc')!==malloc||data(Module,'_free')!==free||data(asm,'ReadFiniteCurveIntersectionsV1')!==asmMethod||data(asm,'malloc')!==asmMalloc||data(asm,'free')!==asmFree)throw Error('Actual finite-curve Module/owner/ABI binding changed');
 }
 function heap(){
  // Grow may detach the old buffer/view; only the SAME exported memory can
  // establish a replacement. Never trust a view supplied by the caller.
  const buffer=memoryBuffer(memory),bytes=arrayBufferBytes(buffer),view=data(Module,'HEAP8');
  if(!Number.isSafeInteger(bytes)||bytes<=0||bytes<lastHeapBytes||typedName(view)!=='Int8Array'||typedBuffer(view)!==buffer||typedOffset(view)!==0||typedBytes(view)!==bytes||memoryBuffer(memory)!==buffer)throw Error('Actual Native HEAP8 is inconsistent with its captured memory');
  lastHeapBytes=bytes;return{buffer,bytes};
 }
 function current(){
  if(poisoned)throw Error('Finite-curve adapter requires realm retirement');identities();heap();
  const result=Reflect.apply(requireCurrent,owner,[]);
  if(result!==undefined)throw Error('Native currentness guard must be synchronous and throwing');
  if(poisoned)throw Error('Finite-curve adapter was revoked');identities();heap();
 }
 try{
  captured=captureContext(context);({Module,malloc,free,owner,requireCurrent}=captured);
  if(!Module||typeof Module!=='object'||!owner||typeof owner!=='object'||Array.isArray(owner)||typeof malloc!=='function'||typeof free!=='function'||typeof requireCurrent!=='function')throw Error('Actual private finite-curve owner/allocator is unavailable');
  asm=data(Module,'asm');memory=data(asm,'memory');method=data(Module,'_ReadFiniteCurveIntersectionsV1');asmMethod=data(asm,'ReadFiniteCurveIntersectionsV1');asmMalloc=data(asm,'malloc');asmFree=data(asm,'free');
  if([method,asmMethod,asmMalloc,asmFree].some(value=>typeof value!=='function'))throw Error('Actual finite-curve Native ABI is unavailable');current();
 }catch(cause){throw failure('ENGINE_CAPABILITY_UNAVAILABLE','The current private Native instance cannot bind finite-curve calls.',{cause});}
 function read(curves){
  if(active||poisoned){poisoned=true;throw failure('ENGINE_FAILURE','Reentrant or retired finite-curve Native adapter.');}
  active=true;let invoked=false;
  try{
   current();const input=encodeFiniteCurveReadInput(curves),count=input.values.length;
   if(count<12||count>FINITE_CURVE_READ_LIMITS.actualValues)throw Error('Encoded finite-curve input length differs from the frozen wire');
   const expected=new Uint8Array(count*8),encodedView=new DataView(expected.buffer);for(let i=0;i<count;i++)encodedView.setFloat64(i*8,input.values[i],true);
   let scratch=null,receiverBefore,valueBefore,receiverCaptured=false,installationAttempted=false,installed=false,collector,installedDescriptor,calls=0,raw=null,invalid=false,returnValue,operationFailed=false,operationError;
   const cleanupErrors=[];
   const noteCleanup=(code,message,cause)=>cleanupErrors.push(failure(code,message,{cause,invoked}));
   const exchangePreserved=()=>receiverCaptured&&sameDescriptor(Object.getOwnPropertyDescriptor(globalThis,'__OCI_EXCHANGE'),receiverBefore)&&sameDescriptor(Object.getOwnPropertyDescriptor(globalThis,'__OCI_EXCHANGE_VAL'),valueBefore);
   try{
    receiverBefore=Object.getOwnPropertyDescriptor(globalThis,'__OCI_EXCHANGE');valueBefore=Object.getOwnPropertyDescriptor(globalThis,'__OCI_EXCHANGE_VAL');receiverCaptured=true;
    if(!receiverBefore||!own(receiverBefore,'value')||typeof receiverBefore.value!=='function'||receiverBefore.writable!==true)throw Error('Actual Native exchange receiver is unavailable');
    current();
    let pointer;try{pointer=Reflect.apply(malloc,Module,[expected.byteLength]);}catch(cause){throw failure('ENGINE_CLEANUP_FAILED','Native scratch allocation outcome is uncertain.',{cause,invoked});}
    if(pointer===0)throw failure('RESOURCE_LIMIT','Native scratch allocation returned no storage.',{invoked});
    // Qualify before any pointer write/free. Unknown allocation addresses must
    // be settled by realm retirement, never a guessed or repeated free.
    identities();const allocatedHeap=heap();
    if(!Number.isSafeInteger(pointer)||pointer<=0||pointer%8||pointer>allocatedHeap.bytes-expected.byteLength)throw failure('ENGINE_CLEANUP_FAILED','Native scratch pointer is unqualified.',{invoked});
    scratch={pointer,bytes:expected.byteLength,freeAttempted:false};
    new Uint8Array(allocatedHeap.buffer,pointer,scratch.bytes).set(expected);current();
    const initial=new Uint8Array(heap().buffer,pointer,scratch.bytes);if(initial.some((n,i)=>n!==expected[i]))throw Error('Native input copy differs from original F64 bits');
    if(!exchangePreserved())throw Error('Native exchange state changed before query dispatch');
    // No parsing, forwarding, other callback or ancillary value-slot write in
    // the receiver. It only retains one immutable bounded string.
    collector=value=>{calls++;if(calls!==1||typeof value!=='string'||value.length>FINITE_CURVE_READ_LIMITS.responseBytes){raw=null;invalid=true;return;}raw=value;};
    installedDescriptor={...receiverBefore,value:collector};installationAttempted=true;Object.defineProperty(globalThis,'__OCI_EXCHANGE',installedDescriptor);installed=true;
    if(!sameDescriptor(Object.getOwnPropertyDescriptor(globalThis,'__OCI_EXCHANGE'),installedDescriptor))throw Error('Native exchange installation is unconfirmed');
    current();if(!sameDescriptor(Object.getOwnPropertyDescriptor(globalThis,'__OCI_EXCHANGE'),installedDescriptor)||!sameDescriptor(Object.getOwnPropertyDescriptor(globalThis,'__OCI_EXCHANGE_VAL'),valueBefore))throw Error('Native exchange custody changed before invocation');
    invoked=true;returnValue=Reflect.apply(method,Module,[pointer,count]);
    current();if(returnValue!==undefined)throw Error('Finite-curve void Native ABI returned an unexpected value');
   }catch(cause){operationFailed=true;operationError=cause;raw=null;}
   finally{
    if(installationAttempted){
     try{
      const actual=Object.getOwnPropertyDescriptor(globalThis,'__OCI_EXCHANGE');
      if(sameDescriptor(actual,installedDescriptor)){
       Object.defineProperty(globalThis,'__OCI_EXCHANGE',receiverBefore);
       if(!sameDescriptor(Object.getOwnPropertyDescriptor(globalThis,'__OCI_EXCHANGE'),receiverBefore))throw Error('Native exchange restoration differs');
      }else if(installed||!sameDescriptor(actual,receiverBefore))throw Error('Native exchange receiver ownership changed');
     }catch(cause){noteCleanup('ENGINE_CLEANUP_FAILED','Native exchange restoration is unconfirmed.',cause);}
    }
    if(scratch){
     try{identities();const actualHeap=heap();if(scratch.pointer>actualHeap.bytes-scratch.bytes)throw Error('Native input left actual memory');const bytes=new Uint8Array(actualHeap.buffer,scratch.pointer,scratch.bytes);if(bytes.some((n,i)=>n!==expected[i]))throw Error('Original Native F64 input bytes changed');}
     catch(cause){noteCleanup('CURVE_QUERY_INPUT_CHANGED','Native input preservation is unqualified.',cause);}
     try{
      // Cleanup does not require a still-live source job, but it DOES require
      // this same allocator/Module/memory. A stale job cannot authorize output.
      identities();const actualHeap=heap();if(scratch.freeAttempted||scratch.pointer>actualHeap.bytes-scratch.bytes)throw Error('Actual scratch retirement cannot be owned');scratch.freeAttempted=true;
      const result=Reflect.apply(free,Module,[scratch.pointer]);if(result!==undefined)throw Error('Native free acknowledgement differs');identities();heap();
     }catch(cause){noteCleanup('ENGINE_CLEANUP_FAILED','Native scratch retirement is unconfirmed and will not be retried.',cause);}
    }
    if(receiverCaptured&&!exchangePreserved())noteCleanup('ENGINE_CLEANUP_FAILED','Native receiver or untouched ancillary exchange state differs.');
   }
   if(cleanupErrors.length){const error=failure('ENGINE_CLEANUP_FAILED','Finite-curve Native settlement failed; every exchange is revoked.',{cause:cleanupErrors[0],invoked});Object.defineProperties(error,{cleanupErrors:{value:Object.freeze(cleanupErrors.slice()),enumerable:true},operationFailed:{value:operationFailed,enumerable:true},...(operationFailed?{operationError:{value:operationError,enumerable:true}}:{})});throw error;}
   if(operationFailed){if(finiteCurveCallFailure(operationError))throw operationError;throw failure('ENGINE_FAILURE','Native query or its exclusive owner failed; every exchange is revoked.',{cause:operationError,invoked});}
   current();if(!exchangePreserved())throw failure('ENGINE_CLEANUP_FAILED','Native exchange state changed after settlement.',{invoked});
   if(invalid||calls!==1||typeof raw!=='string')throw failure('ENGINE_FAILURE','Native query did not deliver exactly one bounded exchange.',{invoked});
   let observation,errorPacket;
   try{const value=parseNativeText(raw);if(value&&typeof value==='object'&&own(value,'error'))errorPacket=captureFiniteCurveReadError(value);else observation=captureFiniteCurveReadResult(value,input);}
   catch(cause){throw failure('FINITE_CURVE_READ_PROTOCOL','Native finite-curve response is malformed or unbound.',{cause,invoked});}
   current();if(!exchangePreserved())throw failure('ENGINE_CLEANUP_FAILED','Native exchange state changed before returning facts.',{invoked});
   if(errorPacket){const ordinary=['CURVE_QUERY_INVALID_REQUEST','CURVE_QUERY_UNCERTAIN','CURVE_QUERY_RESOURCE_LIMIT'].includes(errorPacket.error);throw failure(errorPacket.error,errorPacket.error,{invoked,terminal:!ordinary});}
   return observation;
  }catch(cause){const info=finiteCurveCallFailure(cause);if(info){if(info.terminal)poisoned=true;throw cause;}poisoned=true;throw failure('ENGINE_FAILURE','Private finite-curve preparation or owner failed.',{cause,invoked});}
  finally{active=false;}
 }
 return Object.freeze({read});
}
