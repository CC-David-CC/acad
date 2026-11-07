// SMLib's native integer IDs never leave this disposable Worker.
import createSmlib from 'codi-smlib-glue';
const WASM = 'a48a3283760c21337881c5e2d5c973dbc62cf95cae46d1c012effd75389eb1ae';
let kernel = null,
    created = 0;
const objects = new Map(),
      boxes = new Map();

const fail = () => {
  throw Error('SMLib operation failed');
};

const call = (name, ...args) => {
  const value = kernel[name](args),
        error = kernel.lastError([]);
  if (error !== undefined) throw Error(String(error));
  return value;
};

const shape = id => {
  const handle = objects.get(id);
  if (!handle) fail();
  return handle;
};

function evidence(id) {
  const volume = call('volume', id),
        b = call('bbox', id);
  if (!Number.isFinite(volume) || volume <= 0 || !b || b.length !== 6 || ![...b].every(Number.isFinite) || [0, 1, 2].some(i => b[i] > b[i + 3])) fail();
  return {
    volume,
    bounds: {
      min: [...b.slice(0, 3)],
      max: [...b.slice(3, 6)]
    }
  };
}

async function load(path) {
  const u = new URL(path, self.location.origin);
  if (u.origin !== self.location.origin || u.search || u.hash) fail();
  const response = await fetch(u, {
    credentials: 'omit',
    redirect: 'error',
    cache: 'no-store'
  });
  if (!response.ok || !response.body) fail();
  const reader = response.body.getReader(),
        parts = [];
  let n = 0;

  try {
    for (;;) {
      const r = await reader.read();
      if (r.done) break;
      n += r.value.byteLength;
      if (n > 16 * 1024 * 1024) fail();
      parts.push(r.value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(n);
  let off = 0;

  for (const part of parts) {
    bytes.set(part, off);
    off += part.length;
  }

  const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(x => x.toString(16).padStart(2, '0')).join('');
  if (digest !== WASM) fail();
  kernel = await createSmlib({
    wasmBinary: bytes
  });
  call('init');
}

self.onmessage = async ({
  data: m
}) => {
  try {
    if (!kernel) {
      if (m?.kind !== 'init' || typeof m.wasmPath !== 'string') fail();
      await load(m.wasmPath);
      self.postMessage({
        kind: 'ready'
      });
      return;
    }

    if (m.kind === 'dispose') {
      const h = shape(m.token);
      call('free', h);
      objects.delete(m.token);
      boxes.delete(m.token);
      self.postMessage({
        kind: 'disposed',
        seq: m.seq
      });
      return;
    }

    if (m.kind === 'mesh') {
      const h = shape(m.token),
            mesh = call('tessellate', h, 0.05, 8),
            p = mesh?.positions,
            t = mesh?.indices;
      if (!(p instanceof Float32Array) || !(t instanceof Uint32Array) || p.length % 3 || !t.length || t.length % 3 || t.length > 300000 || p.length > 600000) fail();
      const buffer = new ArrayBuffer(t.length * 3 * 8),
            out = new Float64Array(buffer);

      for (let i = 0; i < t.length; i++) {
        const q = t[i] * 3;
        if (q + 2 >= p.length) fail();

        for (let k = 0; k < 3; k++) {
          const v = p[q + k];
          if (!Number.isFinite(v)) fail();
          out[i * 3 + k] = v;
        }
      }

      self.postMessage({
        kind: 'mesh',
        seq: m.seq,
        token: m.token,
        triangleCount: t.length / 3,
        buffer,
        evidence: evidence(h)
      }, [buffer]);
      return;
    }

    if (!['box', 'union', 'subtract', 'common'].includes(m.kind) || ++created > 8 || objects.has(m.token)) fail();
    let h;

    if (m.kind === 'box') {
      h = call('box', ...m.dimensions);
      call('translate', h, ...m.origin);
    } else {
      const a = shape(m.a),
            b = shape(m.b);
      if (a === b) fail();
      const ba = boxes.get(m.a),
            bb = boxes.get(m.b);
      if (m.kind === 'common' && ba && bb && [0, 1, 2].some(i => ba[i] + ba[i + 3] <= bb[i] || bb[i] + bb[i + 3] <= ba[i]) || m.kind === 'subtract' && ba && bb && ba.every((n, i) => n === bb[i])) throw Object.assign(Error('Empty result unsupported'), {
        code: 'EMPTY_OR_NON_SOLID_UNSUPPORTED'
      });
      h = call('copy', a);
      const tool = call('copy', b);
      call('boolean', m.kind === 'union' ? 1 : m.kind === 'common' ? 2 : 3, h, tool);
    }

    const e = evidence(h);

    if (m.kind === 'box') {
      const expected = m.dimensions[0] * m.dimensions[1] * m.dimensions[2],
            tol = Math.max(1e-7, Math.abs(expected) * 1e-6);
      if (!Number.isFinite(expected) || Math.abs(e.volume - expected) > tol || [0, 1, 2].some(i => Math.abs(e.bounds.min[i] - m.origin[i]) > 1e-6 || Math.abs(e.bounds.max[i] - (m.origin[i] + m.dimensions[i])) > 1e-6)) fail();
    }

    objects.set(m.token, h);
    if (m.kind === 'box') boxes.set(m.token, [...m.origin, ...m.dimensions]);
    self.postMessage({
      kind: 'result',
      seq: m.seq,
      token: m.token,
      evidence: e
    });
  } catch (error) {
    self.postMessage({
      kind: 'error',
      seq: m?.seq,
      code: error?.code === 'EMPTY_OR_NON_SOLID_UNSUPPORTED' ? error.code : 'ENGINE_FAILURE',
      error: 'SMLib refused or failed the operation'
    });
    self.close();
  }
};
