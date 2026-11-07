import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8'),r=JSON.parse(read('custody-evidence/after-r2/receipt.json'));
assert(r.sourceUnchanged);assert.deepEqual(r.before,r.after);for(const row of r.rows){assert.equal(row.status,0,row.name);assert.equal(row.signal,null);}
for(const [path,hash]of Object.entries(r.before))assert.equal(createHash('sha256').update(readFileSync(path)).digest('hex'),hash,path);
const log=read('custody-evidence/after-r2/tests.log');assert.match(log,/tests 83/);assert.match(log,/pass 83/);assert.match(log,/fail 0/);assert.equal(read('custody-evidence/after-r2/typescript.log').trim(),'');
assert.match(read('custody-evidence/before-r1/manager-retention.log'),/fail 2/);assert.match(read('custody-evidence/initial-custody/independent-before.log'),/fail 2/);
const restore=JSON.parse(read('custody-evidence/after-r2/restore-reentrancy.json')),save=JSON.parse(read('custody-evidence/after-r2/save-reentrancy.json'));assert.equal(restore.error.name,'AbortError');assert.equal(restore.beforeGeneration,restore.afterGeneration);assert.equal(restore.oldSignalAborted,false);assert.equal(restore.currentSignalAborted,false);assert.equal(restore.validationWorkers,0);assert.equal(save.error.name,'AbortError');assert.equal(save.currentDrawing,null);
console.log('PASS: 83 component/retained groups; independent activation assertions unchanged; initial reentry no mutation/allocation; TypeScript0/source pins stable.');
