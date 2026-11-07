// Replay independent assertions on the complete recorded browser observations;
// this is not a fresh native or Chromium run.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fixtures,filletPairs,chamferPairs} from './cases.mjs';
import {checkPlate,checkControls} from './oracle.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex'),read=p=>readFileSync(new URL(p,import.meta.url));
const proof=JSON.parse(read('./evidence/receipt.json')),raw=read('./evidence/observed.json');assert.equal(raw.length,proof.portableReceipt.bytes);assert.equal(hash(raw),proof.portableReceipt.sha256);
const r=JSON.parse(raw);assert.equal(r.status,'PASS');assert.deepEqual(r.sourcePins,r.sourcePinsAfter);
for(const [p,sha]of Object.entries(r.sourcePins))assert.equal(hash(read(p)),sha,p);
assert.equal(r.pins.componentManifestSHA256,'8271c25a93245326afb617725faa108477d9f21ef07e335492ac3d38b08e7118');
const rows=r.actual.rows.map(row=>({...checkPlate(row,fixtures.find(f=>f.id===row.id),filletPairs,chamferPairs),status:'PASS'}));assert.deepEqual(rows,r.rows);assert.deepEqual(checkControls(r.actual.controls),r.controls);
assert.deepEqual(r.actual.rows[0].originalConnectors,r.actual.rows[1].originalConnectors);assert(r.actual.workers.every(w=>w.terminated));assert.equal(r.liveOwnedWorkerTargets,0);assert.deepEqual(r.actual.csp,[]);
console.log(JSON.stringify({status:'PASS',scope:'Recorded genuine Chromium observations replay',rows,controls:r.controls,workers:r.actual.workers.length}));
