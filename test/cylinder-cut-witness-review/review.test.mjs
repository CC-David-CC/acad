import test from 'node:test';
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const paths=['../../modules/engine/mount/cylinderCutWitness.mjs','../../modules/engine/mount/ownedBooleanContract.mjs','../../modules/engine/mount/ownedTopologyContract.mjs','../../modules/engine/mount/booleanSelectionClaims.mjs','../cylinder-cut-witness/fresh-evidence-r1/native.json','./worker.mjs','./review.test.mjs'];
const pins=()=>Object.fromEntries(paths.map(path=>[path,createHash('sha256').update(readFileSync(new URL(path,import.meta.url))).digest('hex')])),before=pins(),records=[];
async function run(mode,caseName='plate100'){
 const worker=new Worker(new URL('./worker.mjs',import.meta.url),{workerData:{mode,caseName}});
 try{const result=await new Promise((resolve,reject)=>{worker.once('message',resolve);worker.once('error',reject);worker.once('exit',code=>{if(code)reject(Error('Review Worker exit '+code));});});records.push(result);return result;}
 finally{await worker.terminate();}
}
for(const [name,diameter]of [['plate100',10],['plate150',14],['rotated',10]])test('unchanged genuine '+name+' Native record replays in real Node Worker',async()=>{const r=await run('unchanged-record',name);assert.equal(r.status,'RETURNED');assert.equal(r.witness.diameter,diameter);assert.equal(r.reads,0);assert(Math.abs(Math.hypot(...r.witness.cylinder.axis)-1)<=1e-8);});
test('SYNTHETIC nonidentity valid copy permutation is not applied a second time',async()=>{const r=await run('permuted-copy-certificate');assert.equal(r.status,'RETURNED');assert.equal(r.witness.sourceFace,1);assert.equal(r.witness.resultFace,7);assert.equal(r.witness.diameter,10);});
test('SYNTHETIC finite extent mismatch remains outside cylindrical-support witness',async()=>{const r=await run('different-finite-extent');assert.equal(r.status,'RETURNED');assert.equal(r.witness.diameter,10);assert.equal(r.originalDepth,1);});
test('CONFIRMED synthetic admission gap: nested provenance status accessor executes before refusal',async()=>{const r=await run('construction-status-getter');assert.equal(r.status,'REFUSED');assert.equal(r.error.code,'ENGINE_FAILURE');assert.equal(r.reads,1);});
test('CONFIRMED synthetic admission gap: nested provenance edge accessor mutates input and returns witness',async()=>{const r=await run('construction-edge-getter');assert.equal(r.status,'RETURNED');assert(r.reads>=1);assert.equal(r.originalDepth,22);assert.equal(r.currentDepth,1);assert.equal(r.witness.diameter,10);});
test.after(()=>{const after=pins();assert.deepEqual(after,before);if(process.env.CODI_CYLINDER_REVIEW_EVIDENCE)writeFileSync(process.env.CODI_CYLINDER_REVIEW_EVIDENCE,JSON.stringify({base:'cb4e36dbc',scope:'recorded Native replay and explicitly synthetic contract controls only; no new Native/public/browser success',before,after,records},null,2)+'\n');});
