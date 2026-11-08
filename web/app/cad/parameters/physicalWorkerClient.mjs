import {verifyPhysicalBindings,capturePhysicalManifest} from './verifyPhysicalBindings.mjs';
// A private, same-origin, disposable evaluation Worker. The source is the
// only structured-cloned input; expression parsing/evaluation stays off-thread.
const LOCK='codi-physical-parameters-v1';let outstanding=0;
// A failed termination cannot prove physical Worker release. Fence this module instance.
let failedCleanup=null;
export async function evaluatePhysicalInWorker(workerUrl,source,{signal,valid,timeoutMs=30000,manifest=undefined,sketches=undefined}={}){
 const cancelled=()=>new DOMException('Parameter evaluation cancelled.','AbortError');
 if(typeof source!=='string'||source.length>131072||typeof valid!=='function'||!Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>30000)throw Error('Invalid parameter evaluation request.');
 const capturedManifest=manifest===undefined?undefined:capturePhysicalManifest(manifest);
 let capturedSketches;if(sketches!==undefined){if(capturedManifest===undefined||!Array.isArray(sketches)||sketches.length>64||Reflect.ownKeys(sketches).length!==sketches.length+1)throw Error('Invalid sketch inventory.');const seen=new Set();let total=0;capturedSketches=[];for(let i=0;i<sketches.length;i++){const entry=Object.getOwnPropertyDescriptor(sketches,String(i)),row=entry?.value;if(!entry?.enumerable||!Object.hasOwn(entry,'value')||!row||typeof row!=='object'||Array.isArray(row)||Reflect.ownKeys(row).sort().join(',')!=='id,source')throw Error('Invalid sketch inventory.');const id=Object.getOwnPropertyDescriptor(row,'id'),text=Object.getOwnPropertyDescriptor(row,'source');if(!id?.enumerable||!Object.hasOwn(id,'value')||!text?.enumerable||!Object.hasOwn(text,'value')||typeof id.value!=='string'||!id.value||id.value.length>1024||seen.has(id.value)||typeof text.value!=='string'||text.value.length>1048576||(total+=text.value.length)>4194304)throw Error('Invalid sketch inventory.');seen.add(id.value);capturedSketches.push(Object.freeze({id:id.value,source:text.value}));}Object.freeze(capturedSketches);}

 if(capturedManifest?.targets.some(row=>row.kind==='selected-rectangle')&&capturedSketches===undefined)throw Error('Selected rectangle bindings require the captured source inventory.');
 if(signal!==undefined)try{Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(signal)}catch{throw Error('Invalid cancellation signal.')}
 const current=()=>{try{return !signal?.aborted&&valid()===true}catch{return false}};if(!current())throw cancelled();
 const url=new URL(workerUrl,location.href);if(url.origin!==location.origin||!['http:','https:'].includes(url.protocol))throw Error('Parameter worker must be same-origin.');
 if(!navigator.locks?.request)throw Error('Parameter evaluation requires browser Web Locks.');if(failedCleanup)throw failedCleanup;if(outstanding>=2)throw Error('Too many pending parameter evaluations.');outstanding++;
 let cleanupFailure=null,operationFailure=null;
 const cleanup=(action,operationError)=>{try{action()}catch(cause){if(!cleanupFailure)cleanupFailure=Object.assign(Error('Parameter Worker cleanup failed; reload this client module before evaluating again.'),{code:'WORKER_CLEANUP_FAILED',cause,operationError:operationError||null});if(!failedCleanup)failedCleanup=cleanupFailure;}};
 const revision=crypto.randomUUID(),aborter=new AbortController();let reason=null;
 const stop=error=>{if(!reason){reason=error;aborter.abort()}};const onAbort=()=>stop(cancelled()),timer=setTimeout(()=>stop(Error('Parameter evaluation timed out.')),timeoutMs),poll=setInterval(()=>{if(!current())onAbort()},100);
 try{signal?.addEventListener('abort',onAbort,{once:true});if(!current())onAbort();return await navigator.locks.request(LOCK,{mode:'exclusive',signal:aborter.signal},async()=>{
  if(failedCleanup)throw failedCleanup;if(reason||!current())throw reason||cancelled();return await new Promise((resolve,reject)=>{let worker;try{worker=new Worker(url.href)}catch{reject(Error('Parameter worker could not start.'));return}let done=false;
   const finish=(error,value)=>{if(done)return;done=true;
    cleanup(()=>aborter.signal.removeEventListener('abort',onStop),error);
    cleanup(()=>{worker.onmessage=null;worker.onerror=null;worker.onmessageerror=null;},error);
    cleanup(()=>worker.terminate(),error);
    if(cleanupFailure)reject(cleanupFailure);else if(error)reject(error);else resolve(value);
   };const onStop=()=>finish(reason||cancelled());aborter.signal.addEventListener('abort',onStop,{once:true});
   worker.onerror=()=>finish(Error('Parameter worker failed.'));worker.onmessageerror=()=>finish(Error('Parameter worker returned invalid data.'));worker.onmessage=event=>{if(reason||!current())return finish(reason||cancelled());const response=event.data;if(!response||response.revision!==revision||typeof response.ok!=='boolean'||response.ok&&(!response.result||response.result.version!==1||!Array.isArray(response.result.values)||response.result.values.length>256)||response.ok&&capturedManifest!==undefined&&(!response.bindings||response.bindings.version!==1||!Array.isArray(response.bindings.targets)||response.bindings.targets.length!==capturedManifest.targets.length)||!response.ok&&(!response.error||typeof response.error.code!=='string'||typeof response.error.message!=='string'))return finish(Error('Invalid parameter worker response.'));if(response.ok&&capturedManifest!==undefined)try{verifyPhysicalBindings(capturedManifest,response.bindings)}catch{return finish(Error('Invalid parameter binding response.'));}if(response.ok&&capturedSketches!==undefined){const rows=response.sketchConsumers,ids=new Set(capturedSketches.map(x=>x.id)),seen=new Set();if(!Array.isArray(rows)||rows.length>capturedSketches.length)return finish(Error('Invalid sketch inventory response.'));for(const row of rows){if(!row||Reflect.ownKeys(row).sort().join(',')!=='faceId,names'||typeof row.faceId!=='string'||!ids.has(row.faceId)||seen.has(row.faceId)||!Array.isArray(row.names)||!row.names.length||row.names.length>128||row.names.some(n=>typeof n!=='string'||!/^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/.test(n))||new Set(row.names).size!==row.names.length)return finish(Error('Invalid sketch inventory response.'));seen.add(row.faceId);}}finish(null,response)};
   try{if(reason||!current())finish(reason||cancelled());else worker.postMessage({version:1,revision,source,...(capturedManifest===undefined?{}:{manifest:capturedManifest}),...(capturedSketches===undefined?{}:{sketches:capturedSketches})})}catch{finish(Error('Parameter request could not be sent.'))}
  });
 });}catch(error){operationFailure=error;throw cleanupFailure||reason||error}finally{
  clearTimeout(timer);clearInterval(poll);cleanup(()=>signal?.removeEventListener('abort',onAbort),reason||operationFailure);outstanding--;
  if(cleanupFailure)throw cleanupFailure;
 }
}
