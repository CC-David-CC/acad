import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sha256} from '@noble/hashes/sha256';
import {canonicalChunks, hashCanonicalIncrementally} from '../../web/app/cad/projectManager/incrementalCanonical.mjs';
import {geometryRevision} from '../../web/app/cad/projectManager/manufacturingMetadata.mjs';

test('incremental hash matches Web Crypto, including escapes, Unicode and boundary surrogates', async () => {
 for(const suffix of ['plain','é', '🐈', '\ud800', '\udc00', '\n"\\', 'a'.repeat(4095)+'🐈'+'b'.repeat(5000)]) {
  const project={sketches:[],model:{history:[{z:suffix,a:'\u0000'}],expressions:suffix}};
  const wrapped={kind:'codi-jsketcher-geometry-v1',project};
  assert.equal(await hashCanonicalIncrementally(wrapped, () => sha256.create()),await geometryRevision(project));
 }
});
test('invalid JSON inputs and cycles are refused, cancellation is observed', async () => {
 for(const bad of [undefined, Infinity, [undefined], new Array(1), {x:undefined}]) assert.throws(()=>Array.from(canonicalChunks(bad)));
 const cycle={};cycle.self=cycle;assert.throws(()=>Array.from(canonicalChunks(cycle)));
 const ctrl=new AbortController(), promise=hashCanonicalIncrementally({x:'a'.repeat(100000)},()=>sha256.create(),{signal:ctrl.signal,yieldEvery:2});
 ctrl.abort();await assert.rejects(promise,/cancelled/);
});
