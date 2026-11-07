import {Worker} from 'node:worker_threads';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const paths=['../../modules/engine/mount/ownedThroughHolePlan.mjs','../../modules/engine/solid/ownedHoleIntent.mjs','../../modules/engine/solid/solidIntent.mjs','../../modules/engine/mount/polygonProfilePlan.mjs','../../modules/engine/mount/selectedProfilePlan.mjs','../../modules/engine/extrusion/simplePolygon.mjs','./fixtures.mjs','./worker.mjs','./run.mjs'];
const sources=Object.fromEntries(paths.map(p=>[p,createHash('sha256').update(readFileSync(new URL(p,import.meta.url))).digest('hex')]));
try{
 const result=await new Promise((resolve,reject)=>{const w=new Worker(new URL('./worker.mjs',import.meta.url));let receipt;w.on('message',r=>receipt=r);w.on('error',reject);w.on('exit',n=>n===0&&receipt?resolve(receipt):reject(Error('Layout Worker failed '+n)));});
 const out={node:process.version,sources,...result};if(process.argv[2])writeFileSync(process.argv[2],JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out,null,2));if(out.status!=='PASS')process.exitCode=1;
}catch(e){const out={status:'FAIL',sources,error:{message:e.message,stack:e.stack}};if(process.argv[2])writeFileSync(process.argv[2],JSON.stringify(out,null,2)+'\n');console.error(e.stack);process.exitCode=1;}
