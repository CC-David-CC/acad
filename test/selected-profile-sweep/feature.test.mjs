// Authored contract controls only; no synthetic kernel result or app claim.
import test from 'node:test';
import assert from 'node:assert/strict';
import {captureOwnedSweepFeature, MAX_SWEEP_PATH_CURVES} from '../../modules/engine/solid/ownedSweepFeature.mjs';
const fixture = () => ({version: 1, unit: 'millimeter', engine: 'occ',
  engineRevision: 'sha256:' + 'a'.repeat(64) + ':' + 'b'.repeat(64), featureId: 4,
  faceId: 'profile-face', regionId: 'sketch-region:opaque', pathFaceId: 'path-face',
  pathCurves: [{curveId: 'arc', reversed: true}, {curveId: 'line', reversed: false}],
  transport: 'corrected-frenet', bodyPolicy: 'separate'});
test('saved intent preserves order/direction, detaches and freezes without geometry', () => {
  const input = fixture(), result = captureOwnedSweepFeature(input);
  assert.equal(Reflect.ownKeys(result).length, 11);
  assert.deepEqual(result.pathCurves.map(row => [row.curveId, row.reversed]), [['arc', true], ['line', false]]);
  input.pathCurves.reverse(); input.pathCurves[0].curveId = 'changed';
  assert.equal(result.pathCurves[0].curveId, 'arc');
  assert(Object.isFrozen(result) && Object.isFrozen(result.pathCurves) && Object.isFrozen(result.pathCurves[0]));
  assert.equal(JSON.parse(JSON.stringify(result)).pathCurves[0].reversed, true);
});
test('build, units, policy and identity are explicit without defaults', () => {
  for (const [key, values] of Object.entries({version: [0, 2], unit: ['inch'], engine: ['smlib'],
    engineRevision: ['preferred', 'sha256:' + 'A'.repeat(64) + ':' + 'b'.repeat(64)],
    featureId: [0, -1, 0.1, NaN], faceId: ['', 'x'.repeat(257)], pathFaceId: [''], regionId: ['region'],
    transport: [undefined, 'frenet', 'automatic'], bodyPolicy: ['join']}))
    for (const value of values) assert.throws(() => captureOwnedSweepFeature({...fixture(), [key]: value}), {code: 'INVALID_REQUEST'});
});
test('solved geometry, hashes, handles and frames cannot leak into saved parameters', () => {
  for (const key of ['sourceSha256', 'pathSha256', 'frame', 'pathFrame', 'handle', 'nativeResult', 'solvedProfile'])
    assert.throws(() => captureOwnedSweepFeature({...fixture(), [key]: {}}), {code: 'INVALID_REQUEST'});
  const row = fixture(); row.pathCurves[0].a = [0, 0];
  assert.throws(() => captureOwnedSweepFeature(row), {code: 'INVALID_REQUEST'});
});
test('missing fields and duplicate, implicit or unbounded path choices refuse', () => {
  for (const key of Object.keys(fixture())) { const row = fixture(); delete row[key]; assert.throws(() => captureOwnedSweepFeature(row)); }
  for (const pathCurves of [[], [{curveId: 'a'}], [{curveId: 'a', reversed: 1}],
    [{curveId: 'a', reversed: false}, {curveId: 'a', reversed: true}],
    Array.from({length: MAX_SWEEP_PATH_CURVES + 1}, (_, index) => ({curveId: '' + index, reversed: false}))])
    assert.throws(() => captureOwnedSweepFeature({...fixture(), pathCurves}), {code: 'INVALID_REQUEST'});
});
test('accessors, sparse arrays, symbolic data and inherited records never execute user code', () => {
  let reads = 0;
  const root = fixture(); Object.defineProperty(root, 'pathCurves', {enumerable: true, get() {reads++; return [];}});
  const element = fixture(); Object.defineProperty(element.pathCurves, '0', {enumerable: true, get() {reads++; return {};}});
  const field = fixture(); Object.defineProperty(field.pathCurves[0], 'curveId', {enumerable: true, get() {reads++; return 'arc';}});
  const sparse = fixture(); delete sparse.pathCurves[0];
  const symbolic = fixture(); symbolic[Symbol('extra')] = 1;
  const inherited = Object.assign(Object.create({hidden: 1}), fixture());
  for (const row of [root, element, field, sparse, symbolic, inherited]) assert.throws(() => captureOwnedSweepFeature(row), {code: 'INVALID_REQUEST'});
  assert.equal(reads, 0);
});
