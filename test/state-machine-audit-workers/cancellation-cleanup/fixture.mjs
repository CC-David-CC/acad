// Synthetic transport/error contract only. No native result or geometry.
import {createWorkerMount} from '../../../modules/engine/mount/worker-controller.mjs';
export const box={op:'solid.box.create',version:1,unit:'millimeter',origin:[0,0,0],dimensions:[2,3,4]};
export const wait=ms=>new Promise(r=>setTimeout(r,ms));
export function fixture({timeoutMs=40,postError,initError}={}){
 const original=globalThis.Worker;let worker;
 globalThis.Worker=class{constructor(){worker=this;this.messages=[];this.terminations=0;}postMessage(m){this.messages.push(m);if(m.kind==='init'){if(initError)throw initError.value;queueMicrotask(()=>this.onmessage?.({data:{kind:'ready'}}));}else if(postError)throw postError.value;}terminate(){this.terminations++;}};
 try{const mount=createWorkerMount({workerUrl:'/error-only.js',jsPath:'/none.js',wasmPath:'/none.wasm',timeoutMs},{engine:'synthetic-error-contract',representation:'occ-brep-worker-owned',mesh:false,profile:false,jsSha256:'a'.repeat(64),wasmSha256:'b'.repeat(64)});return{mount,worker,emitError(code='MEASUREMENT_PRECISION_UNRESOLVED'){const job=worker.messages.find(m=>m.kind==='box');worker.onmessage({data:{kind:'error',seq:job.seq,code,error:'controlled Worker failure; no geometry'}});}};}finally{globalThis.Worker=original;}
}
export function observe(p){const state={settled:false};p.then(()=>{state.settled=true;state.resolved=true;},error=>{state.settled=true;state.error=error;state.code=error?.code;});return state;}
