// Independent geometric expectations over actual captured native/model output.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = name => JSON.parse(fs.readFileSync(new URL(name, import.meta.url)));
const baseline = read('baseline.json'), fixed = read('fixed.json');
assert.equal(baseline.result, 'FAIL');
assert.deepEqual(baseline.rows.filter(r => !r.matchesExpected).map(r => r.name).sort(),
  ['nearby-construction-before-circle', 'nearby-point-before-circle', 'tiny-unrepaired-gap']);
assert.equal(fixed.result, 'PASS');
assert.equal(fixed.rows.length, 15);
assert.ok(fixed.rows.every(r => r.matchesExpected && !r.coordinateChanges.length));
assert.equal(fixed.nativeReopen, true);
const row = name => { const found = fixed.rows.find(r => r.name === name); assert.ok(found); return found; };
const radius = (r, ids) => {
  assert.equal(ids.length, 1);
  const native = r.nativeGeometry.find(o => r.faceId + '/' + o.id === ids[0]);
  assert.equal(native?.type, 'Circle');
  return native.data.r;
};
const nested = row('three-nested-circles');
assert.deepEqual(nested.descriptors.map(d => [radius(nested, d.outer), d.holes.map(h => radius(nested, h))])
  .sort((a, b) => b[0] - a[0]), [[30, [20]], [20, [10]], [10, []]]);
const mixed = row('rectangle-with-circle');
assert.equal(mixed.descriptors.filter(d => d.outer.length === 4).length, 1);
assert.deepEqual(mixed.descriptors.find(d => d.outer.length === 4).holes.map(h => radius(mixed, h)), [10]);
assert.equal(radius(mixed, mixed.descriptors.find(d => d.outer.length === 1).outer), 10);
const rectangle = row('solved-PCoincident-rectangle-edited');
const native = JSON.parse(rectangle.source);
assert.equal(native.stages.flatMap(s => s.constraints).filter(c => c.typeId === 'PCoincident').length, 4);
const points = rectangle.nativeGeometry.filter(o => o.type === 'Segment').flatMap(o => [o.data.a, o.data.b]);
const width = Math.max(...points.map(p => p.x)) - Math.min(...points.map(p => p.x));
const height = Math.max(...points.map(p => p.y)) - Math.min(...points.map(p => p.y));
assert.ok(Math.abs(width - 150.7654321) < 1e-9);
assert.ok(Math.abs(height - 30.1234567) < 1e-9);
assert.equal(row('tiny-unrepaired-gap').descriptors.length, 0);
console.log('PASS independent captured region hierarchy, explicit coincidence/dimension and baseline counterexamples');
