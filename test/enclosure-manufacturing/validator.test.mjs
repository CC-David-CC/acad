import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { qualifyEnclosureManufacturingMesh as qualify } from '../../modules/engine/mount/enclosureManufacturingMesh.mjs';
const fixture = JSON.parse(readFileSync(new URL('./actual-preview-fixture.json', import.meta.url), 'utf8'));

for (const engine of ['occ', 'manifold']) for (const key of ['body', 'lid']) test(engine + ' actual ' + key + ' qualifies independently', () => {
  const f = fixture[engine],
        x = f[key],
        buffer = Float64Array.from(x.triangles).buffer,
        r = qualify(buffer, x.triangles.length / 9, f.plan, x.role, engine, .001);
  assert.equal(r.evidence.surfaceCount, 11);
  assert.equal(r.evidence.triangleCount, 28);
  assert.equal(r.vertices.length / 3, r.evidence.vertexCount);
  assert.equal(r.triangles.length / 3, 28);
});

for (const engine of ['occ', 'manifold']) for (const key of ['body', 'lid']) test(engine + ' ' + key + ' rejects displaced cavity or lip even with unchanged bounds and volume', async () => {
  const {
    validateEnclosureMesh
  } = await import('../../modules/engine/mount/enclosureMesh.mjs'),
        f = fixture[engine],
        x = f[key],
        points = Float64Array.from(x.triangles),
        xs = [...new Set(x.triangles.filter((_, i) => i % 3 === 0))].sort((a, b) => a - b),
        low = xs[1],
        high = xs[2];

  for (let i = 0; i < points.length; i += 3) if (points[i] === low || points[i] === high) points[i] += 1;

  const expected = { ...x.evidence,
    precision: engine === 'manifold' ? 'float32' : 'float64'
  };
  assert.equal(validateEnclosureMesh(points.buffer, points.length / 9, expected), true, 'control must preserve preview bounds and volume');
  assert.throws(() => qualify(points.buffer, points.length / 9, f.plan, x.role, engine, .001), {
    code: 'INVALID_MANUFACTURING_MESH'
  });
});

test('missing, duplicate, reversed, degenerate and insufficient precision reject', () => {
  const f = fixture.occ,
        x = f.body,
        original = Float64Array.from(x.triangles),
        n = original.length / 9;
  assert.throws(() => qualify(original.buffer.slice(0, -72), n - 1, f.plan, x.role, 'occ', .001));
  const duplicate = new Float64Array(original.length + 9);
  duplicate.set(original);
  duplicate.set(original.slice(0, 9), original.length);
  assert.throws(() => qualify(duplicate.buffer, n + 1, f.plan, x.role, 'occ', .001));
  const reversed = Float64Array.from(original);

  for (let i = 0; i < reversed.length; i += 9) for (let k = 0; k < 3; k++) {
    const q = reversed[i + 3 + k];
    reversed[i + 3 + k] = reversed[i + 6 + k];
    reversed[i + 6 + k] = q;
  }

  assert.throws(() => qualify(reversed.buffer, n, f.plan, x.role, 'occ', .001));
  const bad = Float64Array.from(original);
  bad[0] = NaN;
  assert.throws(() => qualify(bad.buffer, n, f.plan, x.role, 'occ', .001));
  assert.throws(() => qualify(original.buffer, n, f.plan, x.role, 'occ', 1e-9), {
    code: 'UNSUPPORTED_PRECISION'
  });
});

for (const engine of ['occ', 'manifold']) for (const key of ['body', 'lid']) test(engine + ' ' + key + ' rejects reversed winding, open seams and internal extra faces', () => {
  const f = fixture[engine],
        x = f[key],
        original = Float64Array.from(x.triangles),
        n = original.length / 9,
        reversed = Float64Array.from(original);

  for (let i = 0; i < reversed.length; i += 9) for (let k = 0; k < 3; k++) {
    const q = reversed[i + 3 + k];
    reversed[i + 3 + k] = reversed[i + 6 + k];
    reversed[i + 6 + k] = q;
  }

  assert.throws(() => qualify(reversed.buffer, n, f.plan, x.role, engine, .001));
  const seam = Float64Array.from(original);
  seam[0] += 0.0001;
  assert.throws(() => qualify(seam.buffer, n, f.plan, x.role, engine, .001));
  const extra = new Float64Array(original.length + 9);
  extra.set(original);
  extra.set([10, 10, 10, 11, 10, 10, 10, 11, 10], original.length);
  assert.throws(() => qualify(extra.buffer, n + 1, f.plan, x.role, engine, .001));
});

test('bounded buffers, axial clearance and exact seam requirements fail closed', () => {
  const f = fixture.occ,
        x = f.body;
  assert.throws(() => qualify(new ArrayBuffer(129 * 72), 129, f.plan, x.role, 'occ', .001));
  assert.throws(() => qualify(Float64Array.from(x.triangles).buffer, 28, { ...f.plan,
    lipDepth: 26.999
  }, x.role, 'occ', .001), {
    code: 'UNSUPPORTED_PRECISION'
  });
  const seam = Float64Array.from(x.triangles);
  seam[0] = Number.MIN_VALUE;
  assert.throws(() => qualify(seam.buffer, 28, f.plan, x.role, 'occ', .001), {
    code: 'INVALID_MANUFACTURING_MESH'
  });
});
