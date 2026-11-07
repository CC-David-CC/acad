import {Worker} from 'node:worker_threads';import fs from 'node:fs';import path from 'node:path';
const [receipt,output]=process.argv.slice(2);if(!receipt||!output||fs.existsSync(output))throw Error('Provide existing native receipt and fresh evidence output');
const worker=new Worker(new URL('./fresh-worker.mjs',import.meta.url),{workerData:{receipt:path.resolve(receipt)}});let result;try{result=await new Promise((resolve,reject)=>{worker.once('message',resolve);worker.once('error',reject);worker.once('exit',code=>{if(code)reject(Error('Witness Worker failed '+code))})});}finally{await worker.terminate()}
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.status,cases:result.results.length,scope:result.scope},null,2));
