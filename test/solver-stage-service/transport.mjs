// Real production Worker transport. All modeled geometry/Jacobians stay in the
// unchanged production entry; this adapter adds Node messaging/cancellation.
import {Worker} from 'node:worker_threads';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
export function transport(){
 const requests=[],jobs=[],counts={started:0,terminated:0},pending=new Set();let hook=null;
 const execute=async(_url,request,options={})=>{
  if(options.signal?.aborted||options.valid&&options.valid()!==true)throw new DOMException('Transport cancelled','AbortError');
  requests.push(structuredClone(request));const worker=new Worker(resolve(root,'test/solver-stage-diagnostics/node-worker.cjs'),{workerData:{worker:process.env.SOLVER_STAGE_WORKER||resolve(root,'.build/solver-report-worker/static/worker.js'),verb:resolve(root,'web/lib/verb.js')}});counts.started++;jobs.push(worker);
  try{
   const response=await new Promise((resolve,reject)=>{let timer;const finish=(error,value)=>{clearTimeout(timer);options.signal?.removeEventListener('abort',abort);error?reject(error):resolve(value);},abort=()=>finish(new DOMException('Transport cancelled','AbortError'));options.signal?.addEventListener('abort',abort,{once:true});worker.once('error',e=>finish(e));worker.once('message',r=>finish(null,r));timer=setTimeout(()=>finish(Error('Actual Worker deadline')),30000);worker.postMessage(request);});
   if(hook)await hook(response,request);return response;
  }finally{await worker.terminate();counts.terminated++;}
 };
 const run=(...args)=>{const promise=execute(...args);pending.add(promise);promise.then(()=>pending.delete(promise),()=>pending.delete(promise));return promise;};
 return{run,requests,counts,setHook:fn=>{hook=fn;},drain:async()=>{await Promise.allSettled([...pending]);}};
}
