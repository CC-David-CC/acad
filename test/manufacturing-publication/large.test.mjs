import test from 'node:test';
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
test('real preparation Worker accepts large legacy no-op without charging a nonexistent edit, refuses overbudget change',async()=>{
 const worker=new Worker(new URL('./large-worker.mjs',import.meta.url));let timer;
 try{const result=await new Promise((resolve,reject)=>{timer=setTimeout(()=>reject(Error('Large metadata Worker timed out')),90000);worker.once('message',resolve);worker.once('error',reject);worker.once('exit',code=>{if(code)reject(Error('Large metadata Worker exit '+code));});});assert.equal(result.noop,true);assert.equal(result.pairOverBudgetRefused,true);assert.equal(result.healthyRetry,true);assert.equal(result.materialCount,10000);}finally{clearTimeout(timer);await worker.terminate();}
});
