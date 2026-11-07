// Per-evaluation disposable Worker. Native handles stay private.
const WASM = 'f33f19cd0098b610756db70ae0d25ac1dcba315e9af9eb90e387d0668be90daa';

const bad = (code, message) => Object.assign(Error(message), {
  code
});

const fields = (o, keys) => o && typeof o === 'object' && !Array.isArray(o) && Reflect.ownKeys(o).length === keys.length && keys.every(k => {
  const d = Object.getOwnPropertyDescriptor(o, k);
  return d?.enumerable && Object.hasOwn(d, 'value');
});

const vector = v => Array.isArray(v) && v.length === 3 && Reflect.ownKeys(v).length === 4 && [0, 1, 2].every(i => {
  const d = Object.getOwnPropertyDescriptor(v, String(i));
  return d?.enumerable && Object.hasOwn(d, 'value') && Number.isFinite(d.value);
});

export function createRawSmlibMount({
  workerUrl,
  wasmPath,
  timeoutMs = 30000
}) {
  if (![workerUrl, wasmPath].every(p => typeof p === 'string' && p.startsWith('/') && !p.startsWith('//') && !p.includes('?') && !p.includes('#')) || !Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30000) throw bad('INVALID_MOUNT', 'Invalid SMLib assets or timeout.');
  const worker = new Worker(workerUrl),
        mountId = crypto.randomUUID(),
        handles = new WeakMap(),
        live = new Set();
  let state = 'initializing',
      pending = null,
      sequence = 0,
      next = 0,
      resolveReady,
      rejectReady;
  const initDeadline = performance.now() + timeoutMs;
  const descriptor = Object.freeze({
    contractVersion: 1,
    engine: 'smlib-wasm',
    kernelVersion: '1.0.1',
    upstreamRevision: '3fd5b9548d19aa8c12c29bc9637a96d42a06f8a5',
    bindingRevision: 'e854d6ced3886c8533cea06dd5506e2385fdf6c1',
    kernelRevision: '6c99bfcfe6c7b9735a8c617b4207921c64b0555e',
    mountId,
    generation: 1,
    unit: 'millimeter',
    representation: 'smlib-brep-worker-owned',
    bootstrap: 'host-trusted',
    runtimeAssets: Object.freeze({
      workerSha256: 'bbfdfe916d879fcc1ee84f59453f6b3dd67eb08ea92c06614e505aa35b413a65',
      jsSha256: '8e49622c97d839cf94d6c4d5e2de6cbd96d1166075741e08dcbda3b1a223d8fa',
      wasmSha256: WASM,
      verification: 'worker-sha256',
      glue: 'statically-bundled', binding: 'direct-nvidia-research-v1'
    }),
    maxLifetimeNames: 8,
    maxPending: 1,
    operations: Object.freeze(['solid.box.create', 'solid.boolean.common', 'solid.boolean.union', 'solid.boolean.subtract', 'solid.mesh.read', 'solid.dispose'].map(id => Object.freeze({
      id,
      version: 1,
      qualification: 'research'
    })))
  });
  const ready = new Promise((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });
  ready.catch(() => {});

  function shutdown(code = 'MOUNT_CLOSED', message = 'SMLib mount closed.') {
    if (state === 'closed') return;
    const old = state;
    state = 'closed';
    clearTimeout(initTimer);
    worker.terminate();
    live.clear();
    if (old === 'initializing') rejectReady(bad(code, message));

    if (pending) {
      const p = pending;
      pending = null;
      clearTimeout(p.timer);
      p.signal?.removeEventListener('abort', p.abort);
      p.reject(bad(code, message));
    }
  }

  const initTimer = setTimeout(() => shutdown('TIMEOUT', 'SMLib initialization timed out.'), timeoutMs);

  worker.onerror = () => shutdown('ENGINE_FAILURE', 'SMLib Worker failed.');

  worker.onmessageerror = () => shutdown('ENGINE_FAILURE', 'Invalid SMLib Worker message.');

  worker.onmessage = ({
    data: m
  }) => {
    if (state === 'initializing') {
      if (performance.now() > initDeadline) {
        shutdown('TIMEOUT', 'SMLib initialization timed out.');
        return;
      }

      if (m?.kind !== 'ready') {
        shutdown('ENGINE_FAILURE', 'SMLib initialization failed.');
        return;
      }

      state = 'ready';
      clearTimeout(initTimer);
      resolveReady();
      return;
    }

    if (state !== 'ready') return;

    if (!pending || m?.seq !== pending.seq) {
      shutdown('ENGINE_FAILURE', 'Invalid SMLib Worker response.');
      return;
    }

    if (pending.signal?.aborted) {
      shutdown('CANCELLED', 'Engine request cancelled.');
      return;
    }

    if (performance.now() > pending.deadline) {
      shutdown('TIMEOUT', 'SMLib operation timed out.');
      return;
    }

    const p = pending;
    pending = null;
    clearTimeout(p.timer);
    p.signal?.removeEventListener('abort', p.abort);

    if (m.kind === 'error') {
      p.reject(bad(['NON_SOLID_UNSUPPORTED','EMPTY_RESULT_UNSUPPORTED','MULTI_MATERIAL_VOID_UNSUPPORTED'].includes(m.code) ? m.code : 'ENGINE_FAILURE', 'SMLib refused or failed the operation.'));
      shutdown('ENGINE_FAILURE', 'SMLib Worker failed.');
      return;
    }

    if (m.kind !== p.kind) {
      p.reject(bad('ENGINE_FAILURE', 'Invalid SMLib Worker response.'));
      shutdown('ENGINE_FAILURE', 'Invalid SMLib Worker response.');
      return;
    }

    p.resolve(m);
  };

  worker.postMessage({
    kind: 'init',
    wasmPath
  });

  function assertSolidBinding(handle) {
    if (state === 'closed') throw bad('MOUNT_CLOSED', 'SMLib mount closed.');
    if (state !== 'ready') throw bad('MOUNT_NOT_READY', 'SMLib mount is not ready.');
    if (pending) throw bad('BUSY', 'SMLib mount is busy.');
    const record = handles.get(handle);
    if (!record || !live.has(record)) throw bad('INVALID_HANDLE', 'SMLib handle is unavailable.');
    return true;
  }

  function owned(handle) {
    assertSolidBinding(handle);
    return handles.get(handle);
  }

  function optionsCheck(o) {
    if (!fields(o, []) && !fields(o, ['signal'])) throw bad('INVALID_REQUEST', 'Invalid engine options.');
    const signal = Object.getOwnPropertyDescriptor(o, 'signal')?.value;
    if (signal !== undefined) try {
      Object.getOwnPropertyDescriptor(AbortSignal.prototype, 'aborted').get.call(signal);
    } catch {
      throw bad('INVALID_REQUEST', 'Invalid cancellation signal.');
    }
    ;
    if (signal?.aborted) throw bad('CANCELLED', 'Engine request cancelled.');
    return signal;
  }

  async function awaitReady(signal) {
    if (signal) {
      const abort = () => shutdown('CANCELLED', 'Engine request cancelled.');

      signal.addEventListener('abort', abort, {
        once: true
      });

      try {
        if (signal.aborted) abort();
        await ready;
      } finally {
        signal.removeEventListener('abort', abort);
      }
    } else await ready;

    if (state !== 'ready') throw bad('MOUNT_CLOSED', 'SMLib mount closed.');
    if (signal?.aborted) throw bad('CANCELLED', 'Engine request cancelled.');
    if (pending) throw bad('BUSY', 'SMLib mount is busy.');
  }

  function send(msg, kind, signal) {
    return new Promise((resolve, reject) => {
      const seq = ++sequence,
            deadline = performance.now() + timeoutMs,
            abort = () => shutdown('CANCELLED', 'Engine request cancelled.'),
            timer = setTimeout(() => shutdown('TIMEOUT', 'SMLib operation timed out.'), timeoutMs);

      pending = {
        seq,
        kind,
        resolve,
        reject,
        signal,
        abort,
        timer,
        deadline
      };
      signal?.addEventListener('abort', abort, {
        once: true
      });

      if (signal?.aborted) abort();
      if (!pending || state !== 'ready') return;

      try {
        worker.postMessage({ ...msg,
          seq
        });
      } catch {
        shutdown('ENGINE_FAILURE', 'SMLib dispatch failed.');
      }
    });
  }

  function afterResponse(signal) {
    if (signal?.aborted) {
      shutdown('CANCELLED', 'Engine request cancelled.');
      throw bad('CANCELLED', 'Engine request cancelled.');
    }
    if (state !== 'ready') throw bad('MOUNT_CLOSED', 'SMLib mount closed.');
  }

  const reserve = () => {
    if (next >= 8) throw bad('RESOURCE_LIMIT', 'SMLib operation budget exhausted.');
    return String(++next);
  };

  const make = (token, proof) => {
    if (state !== 'ready') throw bad('MOUNT_CLOSED', 'SMLib mount closed.');
    const handle = Object.freeze({
      id: crypto.randomUUID(),
      mountId,
      generation: 1,
      representation: 'smlib-brep-worker-owned'
    }),
          record = Object.freeze({
      token,
      evidence: proof
    });
    handles.set(handle, record);
    live.add(record);
    return handle;
  };

  const checked = e => {
    const keys=['resultKind','materialRegions','voidRegions','validLevel0','validLevel2','manifoldPredicate','volume','volumeQuality','bounds'];
    if(!fields(e,keys) || !['empty','single-material','multi-material'].includes(e.resultKind) || !Number.isSafeInteger(e.materialRegions) || !Number.isSafeInteger(e.voidRegions) || e.materialRegions<0 || e.voidRegions<0 || e.validLevel0!==true || (e.resultKind!=='empty' && e.manifoldPredicate===false ? e.volume!==null : !Number.isFinite(e.volume))) throw Error('Invalid raw SMLib evidence.');
    if(e.resultKind==='empty') {
      if(e.materialRegions!==0 || e.voidRegions!==0 || e.volume!==0 || e.bounds!==null || e.validLevel2!==null || e.manifoldPredicate!==null || e.volumeQuality!=='empty') throw Error('Invalid empty evidence.');
      return Object.freeze({...e});
    }
    if((e.resultKind==='single-material' ? e.materialRegions!==1 : e.materialRegions<2) || e.validLevel2!==true || typeof e.manifoldPredicate!=='boolean' || e.volumeQuality!==(e.manifoldPredicate?'native-relative-0.001':'native-undefined-nonmanifold') || !fields(e.bounds,['min','max']) || !vector(e.bounds.min) || !vector(e.bounds.max) || e.bounds.min.some((v,i)=>v>e.bounds.max[i])) throw Error('Invalid solid evidence.');
    return Object.freeze({...e,bounds:Object.freeze({min:Object.freeze(e.bounds.min.slice()),max:Object.freeze(e.bounds.max.slice())})});
  };

  async function execute(request, options = {}) {
    const signal = optionsCheck(options);
    if (!request || typeof request !== 'object') throw bad('INVALID_REQUEST', 'Invalid engine request.');
    const op = Object.getOwnPropertyDescriptor(request, 'op')?.value;
    if (op === 'solid.mesh.read') return readSolidMesh(request, options);
    if (typeof op === 'string' && !['solid.box.create', 'solid.boolean.common', 'solid.boolean.union', 'solid.boolean.subtract', 'solid.dispose'].includes(op)) throw bad('UNSUPPORTED_OPERATION', 'Operation is not bound by this mount.');
    let message, first, second;
    if (fields(request, ['op', 'version', 'unit', 'origin', 'dimensions']) && op === 'solid.box.create' && request.version === 1 && request.unit === 'millimeter' && vector(request.origin) && vector(request.dimensions) && [0, 1, 2].every(i => Math.abs(request.origin[i]) <= 1e6) && [0, 1, 2].every(i => request.dimensions[i] > 0 && request.dimensions[i] <= 1e6)) message = {
      kind: 'box',
      origin: [request.origin[0], request.origin[1], request.origin[2]],
      dimensions: [request.dimensions[0], request.dimensions[1], request.dimensions[2]]
    };else if (fields(request, ['op', 'version', 'unit', 'a', 'b']) && request.version === 1 && request.unit === 'millimeter' && ['solid.boolean.common', 'solid.boolean.union', 'solid.boolean.subtract'].includes(op)) {
      first = request.a;
      second = request.b;
    } else if (fields(request, ['op', 'version', 'handle']) && op === 'solid.dispose' && request.version === 1) first = request.handle;else throw bad('INVALID_REQUEST', 'Unsupported SMLib request.');
    await awaitReady(signal);
    if (state !== 'ready') throw bad('MOUNT_CLOSED', 'SMLib mount closed.');
    if (signal?.aborted) throw bad('CANCELLED', 'Engine request cancelled.');
    if (pending) throw bad('BUSY', 'SMLib mount is busy.');

    if (op === 'solid.dispose') {
      const record = owned(first);
      await send({
        kind: 'dispose',
        token: record.token
      }, 'disposed', signal);
      afterResponse(signal);
      if (!live.has(record)) throw bad('INVALID_HANDLE', 'SMLib handle is unavailable.');
      live.delete(record);
      return {
        contractVersion: 1,
        op
      };
    }

    if (['solid.boolean.common', 'solid.boolean.union', 'solid.boolean.subtract'].includes(op)) {
      const a = owned(first),
            b = owned(second);
      if (a === b) throw bad('INVALID_REQUEST', 'Boolean operands must differ.');
      message = {
        kind: op.slice('solid.boolean.'.length),
        a: a.token,
        b: b.token
      };
    }

    const token = reserve(),
          response = await send({ ...message,
      token
    }, 'result', signal);
    afterResponse(signal);

    try {
      if (state !== 'ready' || response.token !== token) throw Error();
      const proof = checked(response.evidence);
      return {
        contractVersion: 1,
        op,
        handle: make(token, proof),
        evidence: proof
      };
    } catch {
      shutdown('ENGINE_FAILURE', 'Invalid SMLib evidence.');
      throw bad('ENGINE_FAILURE', 'Invalid SMLib evidence.');
    }
  }

  async function readSolidMesh(request, options = {}) {
    const signal = optionsCheck(options);
    if (!fields(request, ['op', 'version', 'handle']) || request.op !== 'solid.mesh.read' || request.version !== 1) throw bad('INVALID_REQUEST', 'Invalid mesh request.');
    const handle = request.handle;
    await awaitReady(signal);
    if (state !== 'ready') throw bad('MOUNT_CLOSED', 'SMLib mount closed.');
    if (signal?.aborted) throw bad('CANCELLED', 'Engine request cancelled.');
    if (pending) throw bad('BUSY', 'SMLib mount is busy.');
    const record = owned(handle),
          r = await send({
      kind: 'mesh',
      token: record.token
    }, 'mesh', signal);
    afterResponse(signal);

    try {
      const proof = checked(r.evidence),
            near = (a, b) => Math.abs(a - b) <= Math.max(1e-9, Math.max(Math.abs(a), Math.abs(b)) * 1e-12);

      if (state !== 'ready' || !live.has(record) || r.token !== record.token || (proof.volume===null ? record.evidence.volume!==null : record.evidence.volume===null || !near(record.evidence.volume, proof.volume)) || ['resultKind','materialRegions','voidRegions','validLevel0','validLevel2','manifoldPredicate','volumeQuality'].some(k=>record.evidence[k]!==proof[k]) || (proof.resultKind!=='empty' && ![0, 1, 2].every(i => near(record.evidence.bounds.min[i], proof.bounds.min[i]) && near(record.evidence.bounds.max[i], proof.bounds.max[i]))) || !Number.isSafeInteger(r.triangleCount) || r.triangleCount < (proof.resultKind==='empty'?0:1) || (proof.resultKind==='empty' && r.triangleCount!==0) || r.triangleCount > 100000 || !(r.buffer instanceof ArrayBuffer) || r.buffer.byteLength !== r.triangleCount * 9 * 8 || !['available','unavailable'].includes(r.displayStatus) || (proof.materialRegions>1&&proof.voidRegions>0 ? r.displayStatus!=='unavailable'||r.displayReason!=='material-orientation-unqualified' : r.displayReason==='material-orientation-unqualified') || !(r.displayBuffer instanceof ArrayBuffer) || (r.displayStatus==='available' ? r.displayReason!==null || r.displayBuffer.byteLength!==r.triangleCount*36 : !['float32-overflow','float32-collapsed-triangle','material-orientation-unqualified'].includes(r.displayReason) || r.displayBuffer.byteLength!==0)) throw Error();
      return {
        contractVersion: 1,
        op: 'solid.mesh.read',
        unit: 'millimeter',
        quality: 'display-only',
        triangleCount: r.triangleCount,
        buffer: r.buffer.transfer(),
        displayStatus: r.displayStatus,
        displayReason: r.displayReason,
        displayBuffer: r.displayBuffer.transfer(),
        evidence: proof
      };
    } catch {
      shutdown('ENGINE_FAILURE', 'Invalid SMLib mesh.');
      throw bad('ENGINE_FAILURE', 'Invalid SMLib mesh.');
    }
  }

  return Object.freeze({
    descriptor,
    ready,
    execute,
    readSolidMesh,
    assertSolidBinding,
    close: () => shutdown()
  });
}
