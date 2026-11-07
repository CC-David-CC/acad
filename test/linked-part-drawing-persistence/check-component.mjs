import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8'),receipt=JSON.parse(read('component-evidence/receipt.json'));
assert(receipt.sourceUnchanged);assert.deepEqual(receipt.before,receipt.after);
for(const [path,sha] of Object.entries(receipt.before))assert.equal(createHash('sha256').update(readFileSync(path)).digest('hex'),sha,path+' source pin changed');
for(const row of receipt.results){assert.equal(row.status,row.expectedStatus,row.name);assert.equal(row.signal,null);}
const component=read('component-evidence/component-and-retained.log'),guard=read('component-evidence/manager-integration-blocker.log');
assert.match(component,/tests 32/);assert.match(component,/pass 32/);assert.match(component,/fail 0/);
assert.match(guard,/tests 2/);assert.match(guard,/pass 0/);assert.match(guard,/fail 2/);assert.equal((guard.match(/manager must not silently downgrade\/discard drawing/g)||[]).length,2);
assert.equal(read('component-evidence/typescript.log').trim(),'');
assert.match(read('component-evidence/build.log'),/webpack compiled/);
console.log('PASS: 32 component/retained groups; TypeScript0; production pins stable; 2 manager-retention blockers remain RED.');
