// Intentionally failing contract assertions on8b8adfc7b. Do not weaken these
// expectations to make the BEFORE run green. Fixtures are metadata-only.
import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,snapshot,assign,roles} from './harness.mjs';
async function use(fn){const f=setup();try{await fn(f);}finally{await f.cleanup();}}
test('required assignment commit installs A/J/T jointly and remains Undoable',()=>use(async f=>{
 const before=snapshot(f);await assign(f);const after=snapshot(f);
 assert.equal(after.J.revision,before.J.revision+1,'accepted assignment must append to the SAME journal');assert.equal(after.T,after.material);assert.equal(after.authored.canUndo,true);assert.equal(after.authored.undoTarget.kind,'document-metadata');
}));
test('required canonical no-op preserves full revision and journal',()=>use(async f=>{
 await assign(f);const before=snapshot(f);await assign(f);const after=snapshot(f);
 assert.equal(after.revision,before.revision,'equal role values must not manufacture another document edit');assert.deepEqual(after.J,before.J);
}));
test('required explicit confirmed rebind is also one shared-journal transaction',()=>use(async f=>{
 await assign(f);f.history[0].params.width=150;const before=snapshot(f),p=await f.manager.proposeHostManufacturingRebind();f.manager.confirmHostManufacturingRebind(p.token);const after=snapshot(f);
 assert.equal(after.J.revision,before.J.revision+1,'rebind must not bypass the shared journal');assert.equal(after.T,after.material);assert.equal(after.authored.canUndo,true);
}));
test('required metadata notification follows complete installation',()=>use(async f=>{
 await assign(f);assert.ok(f.notifications.length>0,'current writer has no journal/update publication; observer fault cases cannot run yet');const after=snapshot(f);assert.equal(after.T,after.material);
}));
