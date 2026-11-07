import assert from 'node:assert/strict';
import {Worker as NodeWorker} from 'node:worker_threads';
import {fileURLToPath} from 'node:url';
const entry=fileURLToPath(new URL('../../.build/manufacturing-publication-worker/worker.js',import.meta.url)),bootstrap=fileURLToPath(new URL('./node-worker.cjs',import.meta.url));
export function transport(){
 const threads=new Set(),terminations=[],usage={created:0,terminated:0,posts:0,errors:[]};let hold=false,held=null,arrived,replyMap=null;
 class Adapter extends EventTarget{
  constructor(url){super();assert.equal(url,'publication');usage.created++;this.thread=new NodeWorker(bootstrap,{workerData:{entry,module:false}});threads.add(this.thread);
   this.thread.on('message',data=>{const send=()=>this.dispatchEvent(new MessageEvent('message',{data:replyMap?replyMap(data):data}));if(hold&&data.kind==='manufacturing-prepared'){held=send;arrived?.();}else send();});
   this.thread.on('error',error=>{usage.errors.push(String(error.stack||error));this.dispatchEvent(new Event('error'));});
  }
  postMessage(value,transfers){usage.posts++;this.thread.postMessage(value,transfers);}
  terminate(){usage.terminated++;const thread=this.thread,p=thread.terminate().finally(()=>threads.delete(thread));terminations.push(p);return undefined;}
 }
 return{Adapter,usage,setReplyMap(fn){replyMap=fn;},hold(){hold=true;return new Promise(resolve=>{arrived=resolve;});},release(){const send=held;held=null;hold=false;send?.();},async close(){await Promise.allSettled(terminations);await Promise.allSettled([...threads].map(t=>t.terminate()));threads.clear();},async drain(){await Promise.allSettled(terminations);}};
}
