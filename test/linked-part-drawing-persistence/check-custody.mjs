import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8'),r=JSON.parse(read('custody-evidence/after-r1/receipt.json'));
assert(r.sourceUnchanged);assert.deepEqual(r.before,r.after);for(const row of r.rows){assert.equal(row.status,0,row.name);assert.equal(row.signal,null);}
for(const [path,hash]of Object.entries(r.before))assert.equal(createHash('sha256').update(readFileSync(path)).digest('hex'),hash,path);
const log=read('custody-evidence/after-r1/tests.log');assert.match(log,/tests 74/);assert.match(log,/pass 74/);assert.match(log,/fail 0/);assert.equal(read('custody-evidence/after-r1/typescript.log').trim(),'');
assert.match(read('custody-evidence/before-r1/manager-retention.log'),/fail 2/);
const initial=read('custody-evidence/initial-custody/test.log');assert.match(initial,/pass 11/);assert.match(initial,/fail 2/);assert.match(initial,/Missing expected rejection/);assert.match(initial,/Cannot assign to read only property/);
const marker="test('manager replacement during pending accepted-state wait";
const before=read('custody-evidence/initial-custody/custody.test.mjs.txt'),after=read('custody.test.mjs');assert(before.includes(marker)&&after.includes(marker));assert.equal(before.slice(before.indexOf(marker)),after.slice(after.indexOf(marker)),'orphan-manager rejection assertion changed');
console.log('PASS: 74 actual component/retained groups; original loss and manager-custody failures retained; normative manager assertion unchanged; TypeScript0/source pins stable.');
