import {Worker} from 'node:worker_threads';
const result=await new Promise((resolve,reject)=>{
 const worker=new Worker(new URL('./worker.mjs',import.meta.url));let receipt;
 worker.on('message',value=>{receipt=value;});worker.on('error',reject);
 worker.on('exit',code=>code===0&&receipt?resolve(receipt):reject(Error('Polygon Worker failed: '+code)));
});
console.log(JSON.stringify(result,null,2));
