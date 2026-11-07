import {Worker} from 'node:worker_threads';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const paths=['../../modules/engine/mount/selectionLineageIndex.mjs','../../modules/engine/mount/booleanSelectionClaims.mjs','../../modules/engine/mount/prismSelectionIndex.mjs','../../modules/engine/mount/ownedTopologyContract.mjs','../../modules/engine/mount/polygonProfilePlan.mjs','../../modules/engine/mount/selectedProfilePlan.mjs','../../modules/engine/extrusion/simplePolygon.mjs','./run.mjs','./worker.mjs','./fixtures.mjs','./extract-main-fixture.py','./native-main-fixture.json','../selection-ancestry/native-first-receipt.json'];
const sources=Object.fromEntries(paths.map(p=>[p,createHash('sha256').update(readFileSync(new URL(p,import.meta.url))).digest('hex')]));
try{
 const result=await new Promise((resolve,reject)=>{const worker=new Worker(new URL('./worker.mjs',import.meta.url));let receipt;worker.on('message',r=>receipt=r);worker.on('error',reject);worker.on('exit',n=>n===0&&receipt?resolve(receipt):reject(Error('Lineage Worker failed '+n)));});
 const out={node:process.version,sources,...result};if(process.argv[2])writeFileSync(process.argv[2],JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out,null,2));if(out.status!=='PASS')process.exitCode=1;
}catch(e){const out={status:'FAIL',sources,error:{message:e.message,stack:e.stack}};if(process.argv[2])writeFileSync(process.argv[2],JSON.stringify(out,null,2)+'\n');console.error(e.stack);process.exitCode=1;}
