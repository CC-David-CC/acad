import test from 'node:test';
import assert from 'node:assert/strict';
import {createEngineMount} from './contract.mjs';
import {operationSchemasV1, repositoryInventoryV1} from './inventory.mjs';
const provenance = {runtimeSha256: 'a'.repeat(64)};
const req = {op:'solid.box.create', version:1, unit:'millimeter', dimensions:[10,20,30], deflection:0.1};
const rejects = async (p, code) => assert.rejects(p, e => e.code === code);

test('mount ownership, exact request domain and explicit unsupported operations', async () => {
  let disposed = 0;
  const runtime = {Manifold:{cube: () => ({delete(){disposed++;}})}};
  const a = createEngineMount({engine:'manifold-v3', runtime, provenance});
  const b = createEngineMount({engine:'manifold-v3', runtime, provenance});
  assert.notEqual(a.descriptor.mountId, b.descriptor.mountId);
  assert.equal(a.descriptor.operations[0].binding, 'bound');
  const {handle} = await a.execute(req);
  await rejects(b.execute({op:'solid.dispose', version:1, handle}), 'INVALID_HANDLE');
  await rejects(a.execute({...req, dimensions:[10,0,30]}), 'INVALID_REQUEST');
  await rejects(a.execute({...req, unit:'inch'}), 'INVALID_REQUEST');
  await rejects(a.execute({op:'convert.to.occ', version:1}), 'UNSUPPORTED_OPERATION');
  await a.execute({op:'solid.dispose', version:1, handle});
  await rejects(a.execute({op:'solid.dispose', version:1, handle}), 'INVALID_HANDLE');
  a.close(); b.close(); assert.equal(disposed, 1);
  await rejects(a.execute(req), 'MOUNT_CLOSED');
  assert.ok(operationSchemasV1['box-mm-v1']);
  assert.equal(repositoryInventoryV1.engines[0].libraryCoverage, 'not inventoried');
});

test('cancel or close while a runtime is working disposes the late solid', async () => {
  for (const mode of ['abort','close']) {
    let finish, disposed = 0;
    const runtime = {Manifold:{cube: () => new Promise(resolve => {finish = resolve;})}};
    const mount = createEngineMount({engine:'manifold-v3', runtime, provenance});
    const controller = new AbortController(), pending = mount.execute(req, {signal:controller.signal});
    if (mode === 'abort') controller.abort(); else mount.close();
    finish({delete(){disposed++;}});
    await rejects(pending, mode === 'abort' ? 'CANCELLED' : 'MOUNT_CLOSED');
    assert.equal(disposed, 1);
  }
});

test('missing runtime bindings are discoverable and fail closed', async () => {
  const mount = createEngineMount({engine:'occ-spi-v1', runtime:{}, provenance});
  assert.equal(mount.descriptor.operations[0].binding, 'unbound');
  await rejects(mount.execute(req), 'UNBOUND_OPERATION'); mount.close();
});

test('OCC SPI request and private pointer are disposed through the same adapter', async () => {
  let input, disposed;
  const runtime = {spiBoxBound:true, createBox(p) {input = p; return {created:[{ptr:17}]};}, dispose(p) {disposed = p.model;}};
  const mount = createEngineMount({engine:'occ-spi-v1', runtime, provenance});
  const {handle} = await mount.execute(req);
  assert.deepEqual(input, {csys:{origin:[0,0,0], normal:[0,0,1], xDir:[1,0,0]}, dx:10, dy:20, dz:30, deflection:0.1});
  assert.deepEqual(Object.keys(handle).sort(), ['contractVersion', 'generation', 'id', 'mountId', 'representation']);
  await mount.execute({op:'solid.dispose', version:1, handle});
  assert.equal(disposed, 17); mount.close();
});
