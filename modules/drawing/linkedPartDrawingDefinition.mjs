// Authored metadata only. Admission does not prove source/native membership,
// measured geometry, a staged build, publication, or drawing completeness.
export const LINKED_DRAWING_MAX_BYTES = 65536;
export const LINKED_DRAWING_MAX_DIMENSIONS = 16;
export const LINKED_DRAWING_MAX_ANNOTATIONS = 16;
export const LINKED_DRAWING_MAX_VIEWS = 4;
const orthographicBases = ['top', 'front', 'right'];
const isometricBases = [...orthographicBases, 'isometric'];
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
const cornerSlots = ["MIN_X_MIN_Y","MAX_X_MIN_Y","MAX_X_MAX_Y","MIN_X_MAX_Y"];
function centerHole(value, datum, holes) {
  const r = record(value, ['kind', 'featureId', 'sourceFeatureId', 'faceId', 'regionId', 'slot', 'geometry']);
  if (r.kind !== 'center-hole' || r.slot !== 'center' || r.geometry !== 'cylinder') fail('Unsupported semantic hole reference.');
  feature(r.featureId); feature(r.sourceFeatureId); text(r.faceId, 256); text(r.regionId, 8192);
  sameDatum({featureId: r.sourceFeatureId, faceId: r.faceId, regionId: r.regionId}, datum);
  if (r.featureId === r.sourceFeatureId) fail('Hole and source producer identities must differ.');
  const binding = canonical({featureId:r.featureId,sourceFeatureId:r.sourceFeatureId,faceId:r.faceId,regionId:r.regionId,holeKind:'centered-through',slot:r.slot,geometry:r.geometry}), key = r.featureId+':center', prior = holes.get(key);
  if (prior !== undefined && prior !== binding) fail('One hole cannot contradict its source binding.');
  holes.set(key, binding); return r;
}
function bore(value, datum, holes) {
  const r=record(value,['kind','featureId','sourceFeatureId','faceId','regionId','holeKind','slot','geometry']);
  if(r.kind!=='through-hole'||r.geometry!=='cylinder'||!(r.holeKind==='centered-through'?r.slot==='center':r.holeKind==='four-corner-through'&&cornerSlots.includes(r.slot)))fail('Unsupported semantic bore reference.');
  feature(r.featureId);feature(r.sourceFeatureId);text(r.faceId,256);text(r.regionId,8192);
  sameDatum({featureId:r.sourceFeatureId,faceId:r.faceId,regionId:r.regionId},datum);
  if(r.featureId===r.sourceFeatureId)fail('Bore and source producer identities must differ.');
  const key=r.featureId+':'+r.slot,binding=canonical({featureId:r.featureId,sourceFeatureId:r.sourceFeatureId,faceId:r.faceId,regionId:r.regionId,holeKind:r.holeKind,slot:r.slot,geometry:r.geometry}),prior=holes.get(key);
  if(prior!==undefined&&prior!==binding)fail('One semantic bore cannot contradict its source binding.');
  holes.set(key,binding);return r;
}
function boreGroup(value,datum,holes){
  const rows=list(value,4,4).map(v=>bore(v,datum,holes)),first=rows[0];
  if(rows.some((r,i)=>r.holeKind!=='four-corner-through'||r.slot!==cornerSlots[i]||r.featureId!==first.featureId||r.sourceFeatureId!==first.sourceFeatureId||r.faceId!==first.faceId||r.regionId!==first.regionId))fail('A bore group requires the four actual semantic slots in canonical order from one source-bound feature.');
  return rows;
}
function annotation(value,datum,holes,viewIds,ids,sheet){
 const kind=discriminator(value,'kind'),extra=kind==='bore-center'?['hole','extension']:kind==='baseline'||kind==='ordinate'?['axis','holes','labels']:kind==='hole-callout'?['holes','label']:null;
 if(!extra)fail('Unsupported bore annotation kind.');
 const r=record(value,['annotationId','viewId','kind',...extra]);if(r.kind!==kind)fail('Annotation variant changed during capture.');text(r.annotationId,128);text(r.viewId,128);
 const basis=viewIds.get(r.viewId);if(ids.has(r.annotationId)||basis===undefined)fail('Annotation IDs must be unique and name an admitted view.');ids.add(r.annotationId);
 if(kind==='bore-center'){r.hole=bore(r.hole,datum,holes);number(r.extension,0,100,true);}
 else{r.holes=boreGroup(r.holes,datum,holes);if(kind==='hole-callout'){if(basis!=='top')fail('A bore group callout requires its top view.');r.label=paper(r.label,sheet);}else{axisView(r.axis,basis);r.labels=list(r.labels,4,4).map(p=>paper(p,sheet));}}
 return r;
}
function axisView(axis, basis) {
  if (!['datum-x', 'datum-y'].includes(axis) || !(axis === 'datum-x' ? ['top', 'front'] : ['top', 'right']).includes(basis)) fail('Datum component is not visible in this named view.');
}
export function captureLinkedPartDrawingDefinition(value) {
  const version=discriminator(value,'version');
  const r = record(value, ['version', 'unit', 'drawingId', 'title', 'target', 'datum', 'sheet', 'views', 'dimensions',...(version===3?['annotations']:[])]);
  if(r.version!==version)fail('Drawing version changed during capture.');
  if (![1,2,3].includes(r.version) || r.unit !== 'millimeter') fail('Select drawing definition version1,2 or3 and canonical millimeters.');
  const bases = r.version === 1 ? orthographicBases : isometricBases;
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
  // Version1 retains its original orthographic subsequence. Version2 means
  // exactly the same three bases plus one source-derived isometric view.
  r.views = list(r.views, r.version === 1 ? 1 : r.version===2?4:3, r.version === 1 ? 3 : LINKED_DRAWING_MAX_VIEWS).map(value => {
    const v = record(value, ['viewId', 'basis', 'paperOrigin', 'visibility']), index = bases.indexOf(v.basis);
    text(v.viewId, 128);
    if (viewIds.has(v.viewId) || index <= last || v.visibility !== 'visible-and-hidden') fail('Views require unique IDs and a canonical named-basis subsequence.');
    last = index; v.paperOrigin = paper(v.paperOrigin, r.sheet); viewIds.set(v.viewId, v.basis); return v;
  });
  if(r.version===3&&orthographicBases.some((basis,i)=>r.views[i].basis!==basis))fail('Definition version3 retains top/front/right before optional isometric.');
  const newAnnotationIds=new Set();
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
    if (basis === 'isometric') fail('Physical reference dimensions remain on the orthographic views.');
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
  if(r.version===3)r.annotations=list(r.annotations,0,LINKED_DRAWING_MAX_ANNOTATIONS).map(v=>annotation(v,r.datum,holes,viewIds,newAnnotationIds,r.sheet));
  if (new TextEncoder().encode(canonical(r)).byteLength > LINKED_DRAWING_MAX_BYTES) fail('Drawing definition exceeds64KiB UTF-8.', 'RESOURCE_LIMIT');
  return deepFreeze(r);
}

// Same actual bindings as authored drawings; discovery has no dummy definition.
export function captureLinkedPartBoreQuery(value){
 const q=record(value,['version','unit','target','datum']);if(q.version!==1||q.unit!=='millimeter')fail('Unsupported bore discovery version/unit.');
 q.target=record(q.target,['featureId','operationType','engine','engineRevision','output']);feature(q.target.featureId);text(q.target.operationType,128);
 if(q.target.engine!=='occ'||typeof q.target.engineRevision!=='string'||!/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/.test(q.target.engineRevision)||q.target.output!=='complete-native-result')fail('Select an explicit OCC complete native target.');
 q.datum=record(q.datum,['featureId','faceId','regionId']);feature(q.datum.featureId);text(q.datum.faceId,256);text(q.datum.regionId,8192);return deepFreeze(q);
}
export function captureLinkedPartBoreReference(value,datum){return deepFreeze(bore(value,datum,new Map()));}
