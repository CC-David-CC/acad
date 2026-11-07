import {captureOwnedSweepIntent} from './ownedSweepIntent.mjs';
// Authored intent only. Re-solve both sketches from one captured document state.
// Coordinates, hashes, frames and kernel handles are transient, never saved here.
const keys = ['version', 'unit', 'engine', 'engineRevision', 'featureId',
  'faceId', 'regionId', 'pathFaceId', 'pathCurves', 'transport', 'bodyPolicy'];
export {MAX_SWEEP_PATH_CURVES} from './sweepLimits.mjs';
import {MAX_SWEEP_PATH_CURVES} from './sweepLimits.mjs';
const fail = message => { throw Object.assign(Error(message), {code: 'INVALID_REQUEST'}); };
function record(value, names) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(value))) fail('Expected plain sweep feature data.');
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.length !== names.length || ownKeys.some(key => typeof key !== 'string' || !names.includes(key))) fail('Expected exact sweep feature fields.');
  const result = Object.create(null);
  for (const name of names) {
    const descriptor = Object.getOwnPropertyDescriptor(value, name);
    if (!descriptor?.enumerable || !Object.hasOwn(descriptor, 'value')) fail('Sweep fields must be own data.');
    result[name] = descriptor.value;
  }
  return result;
}
function identity(value, max = 256) {
  if (typeof value !== 'string' || !value || value.length > max) fail('Expected a bounded authored identity.');
  return value;
}
export function captureSweepPathReferences(curves) {
  if (!Array.isArray(curves) || !curves.length || curves.length > MAX_SWEEP_PATH_CURVES ||
      Reflect.ownKeys(curves).length !== curves.length + 1) fail('Expected a bounded dense directed source path.');
  const seen = new Set();
  return Object.freeze(Array.from({length: curves.length}, (_, index) => {
    const descriptor = Object.getOwnPropertyDescriptor(curves, String(index));
    if (!descriptor?.enumerable || !Object.hasOwn(descriptor, 'value')) fail('Path entries must be dense own data.');
    const curve = record(descriptor.value, ['curveId', 'reversed']);
    curve.curveId = identity(curve.curveId);
    if (typeof curve.reversed !== 'boolean' || seen.has(curve.curveId)) fail('Path direction must be explicit and source identities unique.');
    seen.add(curve.curveId);
    return Object.freeze(curve);
  }));
}
export function captureOwnedSweepFeature(input) {
  const result = record(input, keys);
  if (result.version !== 1 || result.unit !== 'millimeter' || result.engine !== 'occ' ||
      typeof result.engineRevision !== 'string' || !/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/.test(result.engineRevision) ||
      !Number.isSafeInteger(result.featureId) || result.featureId <= 0) fail('Expected an explicit OCC sweep feature and immutable build revision.');
  result.faceId = identity(result.faceId);
  result.regionId = identity(result.regionId, 8192);
  result.pathFaceId = identity(result.pathFaceId);
  if (!result.regionId.startsWith('sketch-region:') || result.transport !== 'corrected-frenet' || result.bodyPolicy !== 'separate') fail('Expected a selected region, explicit transport and separate-body policy.');
  result.pathCurves = captureSweepPathReferences(result.pathCurves);
  return Object.freeze(result);
}

// Private evaluator envelope; only captureOwnedSweepFeature belongs in history.
export function captureOwnedSweepEvaluation(input) {
  const r = record(input, ['version','unit','engine','engineRevision','featureId','sweep']);
  if (r.version !== 1 || r.unit !== 'millimeter' || r.engine !== 'occ' || typeof r.engineRevision !== 'string' || !/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/.test(r.engineRevision) || !Number.isSafeInteger(r.featureId) || r.featureId <= 0) fail('Expected an explicit owned sweep evaluation.');
  r.sweep = captureOwnedSweepIntent(r.sweep);
  return Object.freeze(r);
}
