import {captureRectangleArrangementDiagnostic} from './rectangleArrangementDiagnostic.mjs';
import {ANALYTIC_PROFILE_PREPARATION_REFUSALS,isAnalyticProfilePreparationRequest} from './analyticProfilePreparationRefusals.mjs';
import {PROFILE_EXTENT_REFUSALS} from '../mount/ownedProfileExtentPlan.mjs';
import {captureWorkerReplyRecord} from '../mount/workerReplyRecord.mjs';
import {LOFT_PREPARATION_REFUSALS} from '../solid/ownedLoftIntent.mjs';
import {SWEEP_PREPARATION_REFUSALS} from '../solid/ownedSweepIntent.mjs';
const LOCK='codi-prism-semantic-v1', MAX_OUTSTANDING=2;
let outstanding=0;
// A failed termination cannot prove physical Worker release. Fence this module instance.
let failedCleanup:any=null;
const abortError=()=>new DOMException('Prism semantic job cancelled or superseded.','AbortError');
export async function runPrismSemantic(workerPath:string, request:any, options:{signal:AbortSignal;valid:()=>boolean;timeoutMs:number}):Promise<any> {
 if(!options||!options.signal||typeof options.valid!=='function'||!Number.isInteger(options.timeoutMs)||options.timeoutMs<1||options.timeoutMs>30000)throw Error('Invalid semantic job options.');
 if(typeof workerPath!=='string'||!workerPath.startsWith('/')||workerPath.startsWith('//')||/[?#]/.test(workerPath))throw Error('Semantic worker must use a same-origin path.');
 let url:URL;try{url=new URL(workerPath,globalThis.location.origin)}catch{throw Error('Invalid semantic Worker path.');}if(url.origin!==globalThis.location.origin||!['http:','https:'].includes(url.protocol))throw Error('Semantic worker must be same-origin.');
 if(!navigator.locks||typeof navigator.locks.request!=='function')throw Error('Prism semantic jobs require Web Locks.');
 if(failedCleanup)throw failedCleanup;
 if(outstanding>=MAX_OUTSTANDING)throw Error('Too many pending prism semantic jobs.');
 const valid=()=>{try{return !options.signal.aborted&&options.valid()===true&&!options.signal.aborted}catch{return false}};
 if(!valid())throw abortError();outstanding++;
 let cleanupFailure:any=null,operationFailure:any=null;
 const cleanup=(action:()=>void,operationError:any)=>{try{action()}catch(cause){if(!cleanupFailure)cleanupFailure=Object.assign(new Error('Prism semantic Worker cleanup failed; reload this client module before evaluating again.'),{code:'WORKER_CLEANUP_FAILED',cause,operationError:operationError||null});if(!failedCleanup)failedCleanup=cleanupFailure;}};
 const controller=new AbortController(),deadline=performance.now()+options.timeoutMs;
 let reason:Error=null;const stop=(e:Error)=>{if(!reason){reason=e;controller.abort();}},onAbort=()=>stop(abortError());
 const timer=setTimeout(()=>stop(new Error('Prism semantic job timed out.')),options.timeoutMs),poll=setInterval(()=>{if(!valid())onAbort()},100);
 options.signal.addEventListener('abort',onAbort,{once:true});if(!valid())onAbort();
 try{return await navigator.locks.request(LOCK,{mode:'exclusive',signal:controller.signal},async()=>{
   if(failedCleanup)throw failedCleanup;
   if(reason||!valid()||performance.now()>=deadline)throw reason||abortError();
   return await new Promise((resolve,reject)=>{
    const worker=new Worker(workerPath),jobId=crypto.randomUUID();let done=false,analyticPreparation=false,selectedPreparation=false;
    const finish=(error:any,value?:any)=>{if(done)return;done=true;
     cleanup(()=>controller.signal.removeEventListener('abort',onStop),error);
     cleanup(()=>{worker.onmessage=null;worker.onerror=null;worker.onmessageerror=null;},error);
     cleanup(()=>worker.terminate(),error);
     cleanupFailure?reject(cleanupFailure):error?reject(error):resolve(value);
    };
    const onStop=()=>finish(reason||abortError());controller.signal.addEventListener('abort',onStop,{once:true});
    worker.onerror=()=>finish(Error('Prism semantic Worker failed.'));worker.onmessageerror=()=>finish(Error('Prism semantic Worker message failed.'));
    worker.onmessage=event=>{let m;try{m=captureWorkerReplyRecord(event.data);}catch{return finish(Error('Invalid prism semantic Worker reply fields.'));}if(!valid()||performance.now()>=deadline)return finish(reason||abortError());if(!m||m.jobId!==jobId||typeof m.ok!=='boolean')return finish(Error('Invalid prism semantic Worker response.'));if(!m.ok){const allowed=['PROFILE_CONSTRUCTOR_BINDING_MISMATCH','INVALID_REQUEST','UNSUPPORTED_ENGINE','INVALID_FRAME','UNSUPPORTED_FRAME','STALE_SKETCH','INVALID_SKETCH','UNSUPPORTED_SKETCH','UNSUPPORTED_CONSTRAINT','STALE_FRAME','UNSUPPORTED_PROFILE','UNSUPPORTED_REGION_TOPOLOGY','RESOURCE_LIMIT','OPEN_OR_AMBIGUOUS_PROFILE','INVALID_PROFILE','STALE_REGION','STALE_SOURCE','STALE_SEAM','STALE_AXIS','REVOLVE_INVALID_AXIS','REVOLVE_INVALID_ANGLE','PROFILE_BELOW_RESOLUTION','ZERO_LENGTH_EDGE','OVERLAPPING_EDGES','SELF_INTERSECTION','SELF_TOUCHING_BOUNDARY','ZERO_AREA_PROFILE','UNREPRESENTABLE_AREA','PRISM_VALIDATION_FAILED',...SWEEP_PREPARATION_REFUSALS,...LOFT_PREPARATION_REFUSALS,...PROFILE_EXTENT_REFUSALS,...(analyticPreparation?ANALYTIC_PROFILE_PREPARATION_REFUSALS:[])];if(typeof m.error!=='string'||m.error.length>512||!allowed.includes(m.code))return finish(Error('Invalid prism semantic Worker failure.'));const failure=Object.assign(new Error('Prism semantic validation failed: '+m.error),{code:m.code});if(selectedPreparation&&m.code==='UNSUPPORTED_REGION_TOPOLOGY'&&Object.hasOwn(m,'work'))try{Object.defineProperty(failure,'work',{value:captureRectangleArrangementDiagnostic(m.work),enumerable:true});}catch{}return finish(failure);}finish(null,m.value);};
    if(controller.signal.aborted)return onStop();try{const message={...request,jobId};analyticPreparation=isAnalyticProfilePreparationRequest(message);selectedPreparation=['prepare-selected','inspect-selected','prepare-selected-bound'].includes(message.kind);worker.postMessage(message);}catch(error){finish(error)}
   });
  });}catch(error){operationFailure=error;throw cleanupFailure||reason||error;}finally{
   clearTimeout(timer);clearInterval(poll);cleanup(()=>options.signal.removeEventListener('abort',onAbort),reason||operationFailure);outstanding--;
   if(cleanupFailure)throw cleanupFailure;
  }
}
