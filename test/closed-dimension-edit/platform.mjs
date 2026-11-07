import vm from 'node:vm';import {readFileSync} from 'node:fs';
import {Worker as NativeWorker} from 'node:worker_threads';import {resolve,dirname} from 'node:path';import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
globalThis.self=globalThis;globalThis.importScripts=url=>{const value=new URL(url);if(value.protocol!=='file:')throw Error('Only local code imports');vm.runInThisContext(readFileSync(value,'utf8'),{filename:value.pathname});};vm.runInThisContext(readFileSync(resolve(root,'web/lib/verb.js'),'utf8'),{filename:'actual-verb.js'});
export const lifecycle={started:0,terminated:0},requests=[],pending=[];let hook=null;
export const setReplyHook=fn=>{hook=fn;};
export function installWindow(){globalThis.window={location:{href:'http://fixture.test/',origin:'http://fixture.test'},performance:globalThis.performance,requestAnimationFrame:fn=>setTimeout(()=>fn(performance.now()),16),cancelAnimationFrame:clearTimeout};}
Object.defineProperty(globalThis,'navigator',{configurable:true,value:{locks:{async request(name,{signal},work){if(name!=='codi-sketch-solve-v1')throw Error('Unexpected lock');if(signal.aborted)throw new DOMException('Cancelled','AbortError');return work();}}}});
globalThis.Worker=class{
 constructor(url){if(url!=='http://fixture.test/static/worker.js')throw Error('Unexpected worker URL');this.thread=new NativeWorker(resolve(root,'test/solver-stage-diagnostics/node-worker.cjs'),{workerData:{worker:resolve(root,'.build/closed-dimension-edit/worker/worker.js'),verb:resolve(root,'web/lib/verb.js')}});lifecycle.started++;this.thread.on('message',async value=>{if(hook)await hook(value,this.request);this.onmessage?.({data:value});});this.thread.on('error',error=>this.onerror?.(error));}
 postMessage(request){this.request=structuredClone(request);requests.push(this.request);this.thread.postMessage(request);}
 terminate(){if(this.stopped)return;this.stopped=true;pending.push(this.thread.terminate().then(()=>lifecycle.terminated++));}
};
export async function drain(){await Promise.allSettled(pending);}
