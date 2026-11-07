import {Worker as NodeWorker} from 'node:worker_threads';import {readFileSync} from 'node:fs';import vm from 'node:vm';import {resolve,dirname} from 'node:path';import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
globalThis.self=globalThis;globalThis.importScripts=url=>{const u=new URL(url);if(u.protocol!=='file:')throw Error('Only local code imports');vm.runInThisContext(readFileSync(u,'utf8'),{filename:u.pathname});};vm.runInThisContext(readFileSync(resolve(root,'web/lib/verb.js'),'utf8'),{filename:'actual-verb.js'});
export const lifecycle={started:0,terminated:0},requests=[],responses=[],pending=[];let hook=null;
export const setReplyHook=fn=>{hook=fn;};
export function installWindow(){globalThis.location={href:'http://fixture.test/',origin:'http://fixture.test'};globalThis.window={location:globalThis.location,performance,requestAnimationFrame:fn=>setTimeout(()=>fn(performance.now()),16),cancelAnimationFrame:clearTimeout};}
Object.defineProperty(globalThis,'navigator',{configurable:true,value:{locks:{async request(name,{signal},work){if(!['codi-sketch-solve-v1','codi-prism-semantic-v1'].includes(name))throw Error('Unexpected lock');if(signal.aborted)throw new DOMException('Cancelled','AbortError');return work();}}}});
globalThis.Worker=class{
 constructor(url){const path=new URL(url,'http://fixture.test/').pathname,kind=path==='/static/sketch.js'?'sketch':path==='/static/semantic.js'?'semantic':null;if(!kind)throw Error('Unexpected Worker URL');this.kind=kind;this.thread=new NodeWorker(resolve(root,'test/solver-stage-diagnostics/node-worker.cjs'),{workerData:{worker:resolve(root,'.build/source-plane-depth/'+kind+'/worker.js'),verb:resolve(root,'web/lib/verb.js')}});lifecycle.started++;this.thread.on('message',async value=>{responses.push({kind,request:this.request,value:structuredClone(value)});if(hook)await hook(value,this.request,kind);this.onmessage?.({data:value});});this.thread.on('error',error=>this.onerror?.(error));}
 postMessage(value){this.request=structuredClone(value);requests.push({kind:this.kind,value:this.request});this.thread.postMessage(value);}
 terminate(){if(this.stopped)return;this.stopped=true;pending.push(this.thread.terminate().then(()=>lifecycle.terminated++));}
};
export async function drain(){await Promise.allSettled(pending);}
