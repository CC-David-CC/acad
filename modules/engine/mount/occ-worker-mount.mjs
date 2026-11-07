// Research-only one-solid-per-worker adapter for the OCI box probe.
// Whole-worker termination is the only currently proven disposal boundary.
import {EngineContractError} from './contract.mjs';
const failure = (code, message) => new EngineContractError(code, message);

export function createOciBoxMount({workerUrl, runtimeSha256}) {
  if (typeof workerUrl !== 'string' || !/^[0-9a-f]{64}$/.test(runtimeSha256) || typeof crypto?.randomUUID !== 'function')
    throw failure('INVALID_MOUNT', 'Expected worker URL and attested runtime digest');
  const id = crypto.randomUUID(), slots = new Map(); let closed = false, sequence = 0;
  const descriptor = Object.freeze({contractVersion:1, engine:'occ-oci-worker-box-research', mountId:id, generation:1,
    representation:'occ-brep-worker-owned', unit:'millimeter', runtimeSha256, digestStatus:'caller-attested',
    operation:'solid.box.create', qualification:'research-only', maxLiveAndPending:1});
  function createBox(request, {signal, timeoutMs = 30000} = {}) {
    if (closed) return Promise.reject(failure('MOUNT_CLOSED', 'Engine mount is closed'));
    if (!request || Object.keys(request).some(k => !['op','version','unit','dimensions'].includes(k)) ||
        request.op !== 'solid.box.create' || request.version !== 1 || request.unit !== 'millimeter' ||
        !Array.isArray(request.dimensions) || request.dimensions.length !== 3 ||
        request.dimensions.some(n => typeof n !== 'number' || !Number.isFinite(n) || n <= 0 || n > 1e6) ||
        !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30000)
      return Promise.reject(failure('INVALID_REQUEST', 'Invalid bounded millimeter box request'));
    if (signal?.aborted) return Promise.reject(failure('CANCELLED', 'Engine request was cancelled'));
    if (slots.size) return Promise.reject(failure('BUSY', 'This research mount permits one live or pending solid'));
    const token = String(++sequence), dimensions = request.dimensions.slice(), deadline = Date.now() + timeoutMs;
    return new Promise((resolve, reject) => {
      let worker, done = false, timer;
      const finish = error => {
        if (done) return; done = true; clearTimeout(timer); signal?.removeEventListener('abort', abort);
        if (error) { slots.delete(token); worker?.terminate(); reject(error); }
      };
      const abort = () => finish(failure('CANCELLED', 'Engine request was cancelled'));
      try {
        worker = new Worker(workerUrl); slots.set(token, {worker, ready:false, cancel:() => finish(failure('MOUNT_CLOSED', 'Engine mount was closed'))});
        timer = setTimeout(() => finish(failure('TIMEOUT', 'Engine request timed out')), timeoutMs);
        signal?.addEventListener('abort', abort, {once:true});
        worker.onerror = () => finish(failure('ENGINE_FAILURE', 'OCC worker failed'));
        worker.onmessageerror = () => finish(failure('ENGINE_FAILURE', 'OCC worker message failed'));
        worker.onmessage = event => {
          if (Date.now() >= deadline) { finish(failure('TIMEOUT', 'Engine request timed out')); return; }
          const v = event.data, bounds = v?.bounds;
          if (!v?.ok || v.windowType !== 'undefined' || v.faceCount !== 6 || v.triangles !== 12 ||
              !Array.isArray(bounds?.min) || !Array.isArray(bounds?.max) || bounds.min.length !== 3 || bounds.max.length !== 3 ||
              bounds.min.some(x => !Number.isFinite(x)) || bounds.max.some(x => !Number.isFinite(x)) ||
              bounds.min.some(x => Math.abs(x) > 1e-7) || bounds.max.some((x,i) => Math.abs(x-dimensions[i]) > 1e-7)) {
            finish(failure('ENGINE_FAILURE', 'OCC returned invalid box evidence')); return;
          }
          if (done || closed || signal?.aborted) { finish(failure('CANCELLED', 'Engine request was cancelled')); return; }
          done = true; clearTimeout(timer); signal?.removeEventListener('abort', abort);
          slots.get(token).ready = true;
          resolve({contractVersion:1, handle:{mountId:id, generation:1, representation:'occ-brep-worker-owned', id:token},
            evidence:{faceCount:v.faceCount, triangles:v.triangles, bounds}});
        };
        worker.postMessage({dimensions});
      } catch (error) { finish(failure('ENGINE_FAILURE', String(error))); }
    });
  }
  function dispose(handle) {
    if (closed) throw failure('MOUNT_CLOSED', 'Engine mount is closed');
    if (!handle || Object.keys(handle).sort().join(',') !== 'generation,id,mountId,representation' ||
        handle.mountId !== id || handle.generation !== 1 || handle.representation !== 'occ-brep-worker-owned' || !slots.get(handle.id)?.ready)
      throw failure('INVALID_HANDLE', 'Handle is not owned by this mount');
    const slot = slots.get(handle.id); slots.delete(handle.id); slot.worker.terminate();
  }
  function close() {
    if (closed) return; closed = true;
    for (const slot of slots.values()) { slot.cancel(); slot.worker.terminate(); }
    slots.clear();
  }
  return Object.freeze({descriptor, createBox, dispose, close});
}
