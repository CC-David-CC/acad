import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const r=JSON.parse(readFileSync(process.env.CODI_WORKER_OBSERVATION));assert.equal(r.status,'OBSERVED');assert(r.ownedBrowserClosed);
test('recoverable typed refusal returns to ready without native-name loss',()=>{const a=r.actual.recoverableRetry.messages,bad=a.find(m=>m.seq===10),good=a.find(m=>m.seq===11),disposed=a.find(m=>m.seq===12);assert.equal(bad.kind,'refused');assert.equal(bad.code,'ZERO_LENGTH_EDGE');assert.equal(bad.diagnosticOwnedNames,0);assert.equal(good.kind,'result');assert.equal(good.diagnosticOwnedNames,1);assert(good.evidence.nativeValidity.valid);assert(Math.abs(good.evidence.nativeVolume-500)<1e-7);assert.equal(disposed.diagnosticOwnedNames,0);});
test('fatal initialization cannot be retried in the same Worker',()=>{const a=r.actual.fatalInit.messages;assert.equal(a.length,1);assert.equal(a[0].kind,'error');assert.match(a[0].error,/Unsupported revolution version/);});
test('fatal native-handle integrity failure cannot accept late native work',()=>{const a=r.actual.fatalIntegrity.messages;assert.equal(a.length,2);assert.equal(a[0].kind,'ready');assert.equal(a[1].kind,'error');assert.equal(a[1].seq,20);assert.match(a[1].error,/Unknown or disposed handle/);assert.equal(a[1].diagnosticOwnedNames,0);assert(!a.some(m=>m.seq===21));});
