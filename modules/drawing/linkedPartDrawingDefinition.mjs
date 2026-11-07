// Authored metadata only. Admission does not prove source/native membership,
// measured geometry, a staged build, publication, or drawing completeness.
export const LINKED_DRAWING_MAX_BYTES = 65536;
export const LINKED_DRAWING_MAX_DIMENSIONS = 16;
const bases = ['top', 'front', 'right'];
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const fail = (message, code = 'INVALID_REQUEST') => { throw Object.assign(Error(message), {code}); };
// Same-origin host and CAD iframe have distinct Object/Array intrinsics.
// Recognize their actual built-in prototypes without invoking caller getters,
// inherited methods, constructor hooks, toJSON or serialization/reparse.
const functionSource=Function.call.bind(Function.prototype.toString);
function builtinPrototype(value,constructor){
  if(!value||typeof value!=='object')return false;
  const c=Object.getOwnPropertyDescriptor(value,'constructor');
  if(!c||!own(c,'value')||typeof c.value!=='function')return false;
  const p=Object.getOwnPropertyDescriptor(c.value,'prototype');
  return !!p&&own(p,'value')&&p.value===value&&functionSource(c.value)===functionSource(constructor);
}
function plainObjectPrototype(value){return value===null||Object.getPrototypeOf(value)===null&&builtinPrototype(value,Object);}
function plainRecord(value){return !!value&&typeof value==='object'&&!Array.isArray(value)&&plainObjectPrototype(Object.getPrototypeOf(value));}
function record(value, keys) {
  if (!plainRecord(value)) fail('Expected a plain drawing data record.');
  const actual = Reflect.ownKeys(value);
  if (actual.length !== keys.length || actual.some(k => typeof k !== 'string' || !keys.includes(k))) fail('Unexpected or missing drawing fields.');
  const result = Object.create(null);
  for (const key of keys) {
    const d = Object.getOwnPropertyDescriptor(value, key);
    if (!d?.enumerable || !own(d, 'value')) fail('Drawing fields must be enumerable own data.');
    result[key] = d.value;
  }
  return result;
}
function list(value, min, max) {
  if (!Array.isArray(value)) fail('Expected a dense plain drawing array.');
  const prototype=Object.getPrototypeOf(value);
  if(prototype!==null&&!(builtinPrototype(prototype,Array)&&plainObjectPrototype(Object.getPrototypeOf(prototype))))fail('Expected a dense plain drawing array.');
  const length = Object.getOwnPropertyDescriptor(value, 'length')?.value;
  if (!Number.isSafeInteger(length) || length < min || length > max) fail('Drawing array exceeds its bound.', length > max ? 'RESOURCE_LIMIT' : 'INVALID_REQUEST');
  if (Reflect.ownKeys(value).length !== length + 1) fail('Drawing arrays cannot contain holes or extra properties.');
  const result = [];
  for (let i = 0; i < length; i++) {
    const d = Object.getOwnPropertyDescriptor(value, String(i));
    if (!d?.enumerable || !own(d, 'value')) fail('Drawing arrays must contain own data.');
    result.push(d.value);
  }
  return result;
}
function text(value, max, empty = false) {
  if (typeof value !== 'string' || (!empty && !value.length) || value.length > max || /[\u0000-\u001f\u007f]/u.test(value)) fail('Expected a bounded drawing identity or text.');
  return value;
}
function feature(value) {
  if (!Number.isSafeInteger(value) || value < 1) fail('Expected a positive authored feature ID.');
  return value;
}
function number(value, min, max, inclusive = false) {
  if (typeof value !== 'number' || !Number.isFinite(value) || Object.is(value, -0) || (inclusive ? value < min : value <= min) || value > max) fail('Expected bounded physical drawing metadata.');
  return value;
}
function paper(value, sheet) { return list(value, 2, 2).map((n, i) => number(n, 0, i ? sheet.height : sheet.width, true)); }
function discriminator(value, key) {
  if (!value || typeof value !== 'object') fail('Expected a drawing variant.');
  const d = Object.getOwnPropertyDescriptor(value, key);
  if (!d?.enumerable || !own(d, 'value')) fail('Drawing variant must be own data.');
  return d.value;
}
function deepFreeze(value) {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
// Use only detached admitted data. No inherited toJSON hooks, including on
// arrays, are invoked when charging or comparing the metadata.
function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  return JSON.stringify(value);
}
function sameDatum(value, datum) {
  if (value.featureId !== datum.featureId || value.faceId !== datum.faceId || value.regionId !== datum.regionId) fail('Source reference must retain the declared datum binding.');
}
function sourcePoint(value, datum, curves) {
  const r = record(value, ['kind', 'featureId', 'faceId', 'regionId', 'curveId', 'curveType', 'point']);
  if (r.kind !== 'source-point' || !['segment', 'circle'].includes(r.curveType) ||
      !(r.curveType === 'segment' ? ['a', 'b'] : ['center']).includes(r.point)) fail('Unsupported source point reference.');
  feature(r.featureId); text(r.faceId, 256); text(r.regionId, 8192); text(r.curveId, 256); sameDatum(r, datum);
  if (curves.has(r.curveId) && curves.get(r.curveId) !== r.curveType) fail('One source curve cannot contradict its declared type.');
  curves.set(r.curveId, r.curveType);
  return r;
}
function nativeRef(value, type, nativeSeen) {
  const r = record(value, ['kind', 'originFeatureId', 'selectionId', 'geometry']);
  if (r.kind !== 'native-' + type || r.geometry !== (type === 'face' ? 'plane' : 'line')) fail('Unsupported native drawing reference.');
  feature(r.originFeatureId); text(r.selectionId, 16384);
  const binding = r.kind + ':' + r.originFeatureId, prior = nativeSeen.get(r.selectionId);
  if (prior !== undefined && prior !== binding) fail('One selection cannot contradict its kind or origin.');
  nativeSeen.set(r.selectionId, binding); return r;
}
function centerHole(value, datum, holes) {
  const r = record(value, ['kind', 'featureId', 'sourceFeatureId', 'faceId', 'regionId', 'slot', 'geometry']);
  if (r.kind !== 'center-hole' || r.slot !== 'center' || r.geometry !== 'cylinder') fail('Unsupported semantic hole reference.');
  feature(r.featureId); feature(r.sourceFeatureId); text(r.faceId, 256); text(r.regionId, 8192);
  sameDatum({featureId: r.sourceFeatureId, faceId: r.faceId, regionId: r.regionId}, datum);
  if (r.featureId === r.sourceFeatureId) fail('Hole and source producer identities must differ.');
  const binding = canonical(r), prior = holes.get(r.featureId);
  if (prior !== undefined && prior !== binding) fail('One hole cannot contradict its source binding.');
  holes.set(r.featureId, binding); return r;
}
function axisView(axis, basis) {
  if (!['datum-x', 'datum-y'].includes(axis) || !(axis === 'datum-x' ? ['top', 'front'] : ['top', 'right']).includes(basis)) fail('Datum component is not visible in this named view.');
}
export function captureLinkedPartDrawingDefinition(value) {
  const r = record(value, ['version', 'unit', 'drawingId', 'title', 'target', 'datum', 'sheet', 'views', 'dimensions']);
  if (r.version !== 1 || r.unit !== 'millimeter') fail('Select drawing version1 and canonical millimeters.');
  text(r.drawingId, 128); text(r.title, 256, true);
  r.target = record(r.target, ['featureId', 'operationType', 'engine', 'engineRevision', 'output']);
  feature(r.target.featureId); text(r.target.operationType, 128);
  if (r.target.engine !== 'occ' || typeof r.target.engineRevision !== 'string' || !/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/.test(r.target.engineRevision) || r.target.output !== 'complete-native-result') fail('Select an explicit OCC build and complete native result.');
  r.datum = record(r.datum, ['featureId', 'faceId', 'regionId']);
  feature(r.datum.featureId); text(r.datum.faceId, 256); text(r.datum.regionId, 8192);
  r.sheet = record(r.sheet, ['width', 'height', 'scale']);
  number(r.sheet.width, 0, 10000); number(r.sheet.height, 0, 10000);
  r.sheet.scale = record(r.sheet.scale, ['numerator', 'denominator']);
  const {numerator: n, denominator: d} = r.sheet.scale;
  if (![n, d].every(x => Number.isSafeInteger(x) && x >= 1 && x <= 10000)) fail('Expected a bounded rational drawing scale.');
  let a = n, b = d; while (b) [a, b] = [b, a % b];
  if (a !== 1) fail('Scale must use a canonical coprime fraction.');
  const viewIds = new Map(); let last = -1;
  r.views = list(r.views, 1, 3).map(value => {
    const v = record(value, ['viewId', 'basis', 'paperOrigin', 'visibility']), index = bases.indexOf(v.basis);
    text(v.viewId, 128);
    if (viewIds.has(v.viewId) || index <= last || v.visibility !== 'visible-and-hidden') fail('Views require unique IDs and a canonical named-basis subsequence.');
    last = index; v.paperOrigin = paper(v.paperOrigin, r.sheet); viewIds.set(v.viewId, v.basis); return v;
  });
  const dimensionIds = new Set(), nativeSeen = new Map(), holes = new Map(), curves = new Map();
  const fields = {
    'source-distance': ['axis', 'from', 'to'], 'plane-distance': ['axis', 'first', 'second'],
    'edge-length': ['edge'], 'hole-diameter': ['hole'], 'hole-offset': ['axis', 'hole']
  };
  r.dimensions = list(r.dimensions, 0, LINKED_DRAWING_MAX_DIMENSIONS).map(value => {
    const kind = discriminator(value, 'kind');
    if (typeof kind !== 'string' || !own(fields, kind)) fail('Unsupported reference dimension kind.');
    const v = record(value, ['dimensionId', 'viewId', 'kind', ...fields[kind], 'label']);
    if (v.kind !== kind) fail('Drawing dimension variant changed during capture.');
    text(v.dimensionId, 128); text(v.viewId, 128);
    const basis = viewIds.get(v.viewId);
    if (dimensionIds.has(v.dimensionId) || basis === undefined) fail('Dimension IDs must be unique and name an admitted view.');
    dimensionIds.add(v.dimensionId); v.label = paper(v.label, r.sheet);
    if (kind === 'source-distance') {
      axisView(v.axis, basis); v.from = sourcePoint(v.from, r.datum, curves); v.to = sourcePoint(v.to, r.datum, curves);
      if (canonical(v.from) === canonical(v.to)) fail('A datum distance needs distinct references.');
    } else if (kind === 'plane-distance') {
      if (v.axis !== 'datum-normal' || basis === 'top') fail('Datum-normal cap separation requires front or right view.');
      v.first = nativeRef(v.first, 'face', nativeSeen); v.second = nativeRef(v.second, 'face', nativeSeen);
      if (v.first.selectionId === v.second.selectionId) fail('Plane separation needs distinct references.');
    } else if (kind === 'edge-length') v.edge = nativeRef(v.edge, 'edge', nativeSeen);
    else {
      if (kind === 'hole-offset') axisView(v.axis, basis);
      v.hole = centerHole(v.hole, r.datum, holes);
    }
    return v;
  });
  if (new TextEncoder().encode(canonical(r)).byteLength > LINKED_DRAWING_MAX_BYTES) fail('Drawing definition exceeds64KiB UTF-8.', 'RESOURCE_LIMIT');
  return deepFreeze(r);
}
