import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const r=JSON.parse(readFileSync(process.env.CODI_WORKER_OBSERVATION));assert.equal(r.status,'OBSERVED');assert(r.ownedBrowserClosed);
test('duplicate initialization preserves one healthy initializer',()=>{
 const a=r.actual.duplicateInit;assert.equal(a.readyCount,1);assert.equal(a.error,undefined);assert.equal(a.messages.filter(m=>m.kind==='error').length,0);assert.equal(a.messages.filter(m=>m.kind==='refused'&&m.code==='BUSY').length,1);assert.equal(a.messages.find(m=>m.kind==='ready').diagnosticOwnedNames,0);
});
test('concurrent same-token native work cannot overwrite ownership',()=>{
 const messages=r.actual.concurrentSameToken.messages,results=messages.filter(m=>m.kind==='result'),refused=messages.filter(m=>m.kind==='refused');assert.equal(results.length,1);assert.equal(results[0].seq,1);assert.equal(refused.length,1);assert.equal(refused[0].seq,2);assert.equal(refused[0].code,'BUSY');assert(results[0].evidence.nativeValidity.valid);assert(Math.abs(results[0].evidence.nativeVolume-500)<1e-7);assert.equal(results[0].diagnosticOwnedNames,1);const disposed=messages.find(m=>m.kind==='disposed');assert.equal(disposed.seq,3);assert.equal(disposed.released,true);assert.equal(disposed.diagnosticOwnedNames,0);
});
test('normal controller still serializes native calls',()=>{assert.equal(r.actual.controllerSerial.second.code,'BUSY');assert(Math.abs(r.actual.controllerSerial.nativeVolume-24)<1e-7);});
