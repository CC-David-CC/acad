// Research: canonical output fragments, not a capture/immutability mechanism.
// Arrays preserve order; keys are sorted; unsupported values are rejected.
export function* canonicalChunks(value, chunkSize = 4096) {
  if (!Number.isSafeInteger(chunkSize) || chunkSize < 2 || chunkSize > 65536) throw new Error('Invalid chunk size');
  const active = new Set();
  function* string(value) {
    yield '"';
    for (let pos = 0; pos < value.length;) {
      let end = Math.min(pos + chunkSize, value.length);
      const last = value.charCodeAt(end - 1), next = value.charCodeAt(end);
      if (end < value.length && last >= 0xd800 && last <= 0xdbff && next >= 0xdc00 && next <= 0xdfff) end--;
      yield JSON.stringify(value.slice(pos, end)).slice(1, -1);
      pos = end;
    }
    yield '"';
  }
  function* walk(item, depth) {
    if (depth > 256) throw new Error('Project nesting exceeds limit');
    if (typeof item === 'string') { yield* string(item); return; }
    if (item === null || typeof item === 'boolean' || (typeof item === 'number' && Number.isFinite(item))) { yield JSON.stringify(item); return; }
    if (!item || typeof item !== 'object' || active.has(item)) throw new Error('Project contains a non-JSON value');
    if (!Array.isArray(item) && Object.getPrototypeOf(item) !== Object.prototype && Object.getPrototypeOf(item) !== null) throw new Error('Project contains a non-JSON value');
    active.add(item);
    try {
      if (Array.isArray(item)) {
        yield '[';
        for (let i=0;i<item.length;i++) { if (i) yield ','; yield* walk(item[i],depth+1); }
        yield ']';
      } else {
        yield '{';
        let first=true;
        for (const key of Object.keys(item).sort()) { if (!first) yield ','; first=false; yield* string(key); yield ':'; yield* walk(item[key],depth+1); }
        yield '}';
      }
    } finally { active.delete(item); }
  }
  yield* walk(value,0);
}

export async function hashCanonicalIncrementally(value, createHasher, {signal, yieldEvery = 256, yieldControl = () => new Promise(resolve => setTimeout(resolve,0))} = {}) {
  const hash = createHasher(), encoder = new TextEncoder();
  let count = 0;
  for (const fragment of canonicalChunks(value)) {
    if (signal?.aborted) throw new Error('Hash cancelled');
    hash.update(encoder.encode(fragment));
    if (++count % yieldEvery === 0) await yieldControl();
  }
  if (signal?.aborted) throw new Error('Hash cancelled');
  return 'sha256-' + Array.from(hash.digest(), b => b.toString(16).padStart(2,'0')).join('');
}

// Dedicated Worker release is shared by cancellation and its owning finally.
// Weak records do not retain successfully released Workers. A cleanup failure
// fences this module instance; re-opening an app may reuse that same module.
const workerCloses = new WeakMap();
let failedWorkerCleanup = null;
function cleanupError(cause, operationError) {
  const error = Object.assign(new Error('Hash Worker cleanup failed; reload this client module before evaluating again.'),
    {code:'WORKER_CLEANUP_FAILED',cause,operationError});
  if (!failedWorkerCleanup) failedWorkerCleanup = error;
  return error;
}
export function assertCanonicalHashWorkerAvailable(worker = undefined) {
  if (failedWorkerCleanup) throw failedWorkerCleanup;
  if (worker && workerCloses.has(worker)) throw new Error('Hash Worker is already closed.');
}
export function closeCanonicalHashWorker(worker, operationError = null) {
  if (!worker) return;
  let record = workerCloses.get(worker);
  if (!record) {
    record = {failure:null}; workerCloses.set(worker, record);
    try { worker.terminate(); } catch (cause) { record.failure = cleanupError(cause,operationError); }
  }
  if (record.failure) throw record.failure;
}

// One bounded transferable batch in flight at a time. The caller must supply a
// worker built from incrementalHashWorker.mjs, ensure input cannot be changed or
// re-check a reliable change generation after this returns, and terminate this
// dedicated worker after use via closeCanonicalHashWorker. Check availability
// before allocating a Worker. On cancellation release is attempted immediately.
export async function hashCanonicalInWorker(value, worker, signal, getGeneration, maxBytes = Infinity) {
  assertCanonicalHashWorkerAvailable(worker);
  if (!(maxBytes === Infinity || (Number.isSafeInteger(maxBytes) && maxBytes > 0))) throw new Error('Invalid hash size limit');
  if (typeof getGeneration !== 'function') throw new Error('A monotonic change generation is required');
  const generation = getGeneration();
  const exchange = (message, transfers = []) => new Promise((resolve, reject) => {
    let done = false;
    const finish = (error, value, close = false) => {
      if (done) return; done = true;
      let failure = null;
      const clean = action => { try { action(); } catch(cause) { if(!failure)failure=cleanupError(cause,error); } };
      clean(()=>worker.removeEventListener('message',onMessage));
      clean(()=>worker.removeEventListener('error',onError));
      clean(()=>signal?.removeEventListener('abort',onAbort));
      if(close)try { closeCanonicalHashWorker(worker,error); } catch(cause) { failure ||= cause; }
      if(failure)reject(failure);else if(error)reject(error);else resolve(value);
    };
    const onMessage = event => finish(event.data?.type === 'error' ? new Error(event.data.message) : null,event.data);
    const onError = () => finish(new Error('Hash worker failed'));
    const onAbort = () => finish(new Error('Hash cancelled'),undefined,true);
    if (signal?.aborted) { onAbort(); return; }
    worker.addEventListener('message', onMessage); worker.addEventListener('error', onError); signal?.addEventListener('abort', onAbort, {once:true});
    try { worker.postMessage(message, transfers); } catch (error) { finish(error); }
  });
  if ((await exchange({type:'start'})).type !== 'ready') throw new Error('Invalid hash worker response');
  const encoder = new TextEncoder(); let buffer = new Uint8Array(262144), used = 0, total = 0;
  const flush = async () => {
    if (!used) return;
    // Last short batch is copied into a tightly-sized transferable buffer.
    const output = used === buffer.length ? buffer : buffer.slice(0, used);
    if ((await exchange({type:'chunk', bytes:output.buffer}, [output.buffer])).type !== 'ack') throw new Error('Invalid hash worker response');
    buffer = new Uint8Array(262144); used = 0;
  };
  for (const fragment of canonicalChunks(value)) {
    if (signal?.aborted) { const error=new Error('Hash cancelled');closeCanonicalHashWorker(worker,error);throw error; }
    const bytes = encoder.encode(fragment);
    total += bytes.length;
    if (total > maxBytes) throw new Error('Manufacturing model exceeds the current 8 MiB preparation limit');
    if (bytes.length > buffer.length - used) await flush();
    buffer.set(bytes, used); used += bytes.length;
  }
  await flush();
  const result = await exchange({type:'finish'});
  if (getGeneration() !== generation) throw new Error('Project changed while hashing');
  if (result.type !== 'result' || !(result.bytes instanceof ArrayBuffer) || result.bytes.byteLength !== 32) throw new Error('Invalid hash worker response');
  return 'sha256-' + Array.from(new Uint8Array(result.bytes), b => b.toString(16).padStart(2,'0')).join('');
}
