// Supply the explicitly selected source-built JS/WASM pair; do not substitute npm WASM.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {createEngineMount} from './contract.mjs';

test('mounted source-built Manifold creates and disposes a measured box', async () => {
  const js = process.env.CODI_MANIFOLD_JS, binary = process.env.CODI_MANIFOLD_WASM;
  assert.ok(js && binary, 'supply absolute CODI_MANIFOLD_JS and CODI_MANIFOLD_WASM');
  const digest = async p => createHash('sha256').update(await readFile(p)).digest('hex');
  assert.equal(await digest(js), 'cd2031fd75cbbc812b550dd228f95b9fd666ae4da6557f840e3d3ed4cbed268b');
  const wasmDigest = await digest(binary);
  assert.equal(wasmDigest, '7bb5f8ee10fcafdab78799b1e5dd2cdc7c282ea0bf8e7939c43f3ad34b823e3d');
  const init = (await import(pathToFileURL(js).href)).default;
  const wasm = await init({locateFile: () => binary}); wasm.setup();
  let volume, bounds, released = 0;
  const runtime = {Manifold:{cube(size, center) {
    const solid = wasm.Manifold.cube(size, center);
    volume = solid.volume(); bounds = solid.boundingBox();
    return {delete() { released++; solid.delete(); }};
  }}};
  const mount = createEngineMount({engine:'manifold-v3', runtime, provenance:{runtimeSha256:wasmDigest}});
  const result = await mount.execute({op:'solid.box.create', version:1, unit:'millimeter', dimensions:[10,20,30], deflection:0.1});
  assert.equal(volume, 6000); assert.deepEqual(bounds, {min:[0,0,0], max:[10,20,30]});
  await mount.execute({op:'solid.dispose', version:1, handle:result.handle});
  assert.equal(released, 1); mount.close();
});
