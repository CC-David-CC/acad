import {Worker} from 'node:worker_threads';
const result=await new Promise((resolve,reject)=>{const w=new Worker(new URL('./unit-worker.mjs',import.meta.url));let value;w.on('message',r=>value=r);w.on('error',reject);w.on('exit',code=>code===0&&value?resolve(value):reject(Error('Unit Worker exit '+code)));});
console.log(JSON.stringify(result));
