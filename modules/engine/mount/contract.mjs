// Research interface: no UI, filesystem, credentials, implicit conversion or fallback.
export class EngineContractError extends Error {
  constructor(code, message) { super(message); this.name = 'EngineContractError'; this.code = code; }
}
const fail = (code, message) => { throw new EngineContractError(code, message); };
const record = x => x && typeof x === 'object' && !Array.isArray(x);
const ownKeys = (x, keys) => record(x) && Object.keys(x).every(k => keys.includes(k));

// Capability statements describe this adapter, not everything a library can do.
export const MOUNT_CONTRACT_VERSION = 1;
export function createEngineMount({engine, runtime, provenance}) {
  if (!['occ-spi-v1', 'manifold-v3'].includes(engine)) fail('UNSUPPORTED_ENGINE', 'Unknown engine adapter');
  if (!record(runtime) || !record(provenance) || typeof provenance.runtimeSha256 !== 'string' || !/^[0-9a-f]{64}$/.test(provenance.runtimeSha256) ||
      typeof globalThis.crypto?.randomUUID !== 'function') fail('INVALID_MOUNT', 'A runtime, digest and secure unique mount ID are required');
  const mountId = globalThis.crypto.randomUUID();
  const resources = new Map(); let next = 0, active = true;
  const representation = engine === 'occ-spi-v1' ? 'occ-brep' : 'manifold-mesh';
  // The legacy GenericWASMEngine methods can exist even when the selected
  // interpreter does not export the underlying SPI functions. The trusted
  // runtime loader must establish both exports before declaring this bound.
  const hasBox = engine === 'occ-spi-v1' ? runtime.spiBoxBound === true && typeof runtime.createBox === 'function' && typeof runtime.dispose === 'function' : typeof runtime.Manifold?.cube === 'function';
  const descriptor = Object.freeze({contractVersion: 1, engine, mountId, generation: 1, representation,
    unit: 'millimeter', provenance: Object.freeze({runtimeSha256: provenance.runtimeSha256}),
    operations: Object.freeze([
      Object.freeze({id: 'solid.box.create', version: 1, binding: hasBox ? 'bound' : 'unbound', qualification: 'unqualified',
        input: 'box-mm-v1', output: 'box-result-v1'}),
      Object.freeze({id: 'solid.dispose', version: 1, binding: hasBox ? 'bound' : 'unbound', qualification: 'unqualified',
        input: 'dispose-v1', output: 'empty-v1'})
    ])});
  function current(signal) {
    if (!active) fail('MOUNT_CLOSED', 'Engine mount is closed');
    if (signal?.aborted) fail('CANCELLED', 'Engine request was cancelled');
  }
  function release(resource) {
    if (engine === 'occ-spi-v1') runtime.dispose({model: resource}); else resource.delete();
  }
  function resolve(handle) {
    if (!ownKeys(handle, ['contractVersion', 'mountId', 'generation', 'representation', 'id']) ||
        handle.contractVersion !== 1 || handle.mountId !== mountId || handle.generation !== 1 || handle.representation !== representation ||
        typeof handle.id !== 'string' || !resources.has(handle.id)) fail('INVALID_HANDLE', 'Handle is not owned by this mount');
    return resources.get(handle.id);
  }
  async function execute(request, {signal} = {}) {
    current(signal);
    if (!record(request) || request.version !== 1 || typeof request.op !== 'string') fail('INVALID_REQUEST', 'Expected a version 1 request');
    if (request.op === 'solid.dispose') {
      if (!ownKeys(request, ['op', 'version', 'handle'])) fail('INVALID_REQUEST', 'Unexpected dispose fields');
      const resource = resolve(request.handle); release(resource); resources.delete(request.handle.id);
      return {contractVersion: 1, op: request.op};
    }
    if (request.op !== 'solid.box.create') fail('UNSUPPORTED_OPERATION', 'Operation is not bound by this adapter');
    if (!ownKeys(request, ['op', 'version', 'unit', 'dimensions', 'deflection']) || request.unit !== 'millimeter' ||
        !Array.isArray(request.dimensions) || request.dimensions.length !== 3 || request.dimensions.some(n => typeof n !== 'number' || !Number.isFinite(n) || n <= 0 || n > 1e6) ||
        typeof request.deflection !== 'number' || !Number.isFinite(request.deflection) || request.deflection <= 0 || request.deflection > 1000)
      fail('INVALID_REQUEST', 'Expected three positive bounded millimeter dimensions and positive deflection');
    let resource;
    if (engine === 'occ-spi-v1') {
      if (!hasBox) fail('UNBOUND_OPERATION', 'OCC box or disposal binding is unavailable');
      const [dx, dy, dz] = request.dimensions;
      const result = await runtime.createBox({csys: {origin: [0,0,0], normal: [0,0,1], xDir: [1,0,0]}, dx, dy, dz, deflection: request.deflection});
      if (!result || result.error || !Array.isArray(result.created) || result.created.length !== 1 || !Number.isSafeInteger(result.created[0].ptr) || result.created[0].ptr <= 0) fail('ENGINE_FAILURE', 'OCC did not return one usable solid');
      resource = result.created[0].ptr;
    } else {
      if (typeof runtime.Manifold?.cube !== 'function') fail('UNBOUND_OPERATION', 'Manifold cube binding is unavailable');
      resource = await runtime.Manifold.cube(request.dimensions.slice(), false);
      if (!resource || typeof resource.delete !== 'function') fail('ENGINE_FAILURE', 'Manifold did not return a disposable solid');
    }
    try { current(signal); } catch (error) { release(resource); throw error; }
    const id = String(++next); resources.set(id, resource);
    return {contractVersion: 1, op: request.op, handle: {contractVersion: 1, mountId, generation: 1, representation, id}};
  }
  function close() {
    active = false;
    const errors = [];
    for (const [id, resource] of resources) { try { release(resource); resources.delete(id); } catch (error) { errors.push(error); } }
    if (errors.length) fail('DISPOSAL_FAILED', `${errors.length} engine resources failed to dispose`);
  }
  return Object.freeze({descriptor, execute, close});
}
