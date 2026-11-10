import {captureArcData} from './authoredArcBranch.mjs';
// Worker-only source membership seam. The caller supplies a real current
// sketch-solver result and owns document lifetime. This does not solve a sketch,
// certify a sweep, choose arc branches, weld endpoints or move either source.
import {captureSweepPathReferences} from '../solid/ownedSweepFeature.mjs';
const fail = (code, message) => {throw Object.assign(Error(message), {code});};
function record(value, names) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(value)) ||
      Reflect.ownKeys(value).length !== names.length || Reflect.ownKeys(value).some(key => typeof key !== 'string' || !names.includes(key))) fail('INVALID_REQUEST', 'Expected exact sweep path source fields.');
  const result = {};
  for (const name of names) {
    const descriptor = Object.getOwnPropertyDescriptor(value, name);
    if (!descriptor?.enumerable || !Object.hasOwn(descriptor, 'value')) fail('INVALID_REQUEST', 'Sweep path fields must be data.');
    result[name] = descriptor.value;
  }
  return result;
}
function vector(value, length) {
  if (!Array.isArray(value) || value.length !== length || Reflect.ownKeys(value).length !== length + 1) fail('INVALID_FRAME', 'Expected a dense finite source vector.');
  return Array.from({length}, (_, index) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (!descriptor?.enumerable || !Object.hasOwn(descriptor, 'value') || typeof descriptor.value !== 'number' || !Number.isFinite(descriptor.value) || Math.abs(descriptor.value) > 1e6) fail('INVALID_FRAME', 'Source vector exceeds the finite adapter domain.');
    return descriptor.value;
  });
}
function frame(value) {
  const result = record(value, ['origin', 'x', 'y', 'z']);
  for (const name of Object.keys(result)) result[name] = vector(result[name], 3);
  const dot = (a, b) => a.reduce((sum, n, i) => sum + n * b[i], 0);
  const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
  if (['x','y','z'].some(name => Math.abs(dot(result[name], result[name])-1) > 1e-12) ||
      [['x','y'],['x','z'],['y','z']].some(([a,b]) => Math.abs(dot(result[a], result[b])) > 1e-12) ||
      Math.hypot(...cross(result.x, result.y).map((n,i) => n-result.z[i])) > 1e-12) fail('INVALID_FRAME', 'A right-handed orthonormal path frame is required.');
  return result;
}
function point(value) {
  const result = record(value, ['x','y']);
  if (![result.x,result.y].every(n => typeof n === 'number' && Number.isFinite(n) && Math.abs(n) <= 1e6)) fail('SWEEP_INVALID_PATH', 'Path coordinates must be finite and bounded.');
  return result;
}
const same = (a,b) => a.x === b.x && a.y === b.y;
function freeze(value) {if (value && typeof value === 'object') {for (const child of Object.values(value)) freeze(child); Object.freeze(value);} return value;}
const sourceContexts=new WeakMap();
export async function captureSolvedSweepPathSource(input) {
  const r = record(input, ['unit','revision','sketchDigest','faceId','frame','sketchJSON']);
  if (r.unit !== 'millimeter' || ![r.revision,r.faceId].every(value => typeof value === 'string' && value.length > 0 && value.length <= 256) ||
      typeof r.sketchDigest !== 'string' || !/^[a-f0-9]{64}$/.test(r.sketchDigest) || typeof r.sketchJSON !== 'string' || r.sketchJSON.length > 65536) fail('INVALID_REQUEST', 'Expected a bounded solved source identity.');
  // Detach all mutable inputs BEFORE the digest suspends. Source text is an
  // immutable, at-most64KiB value; there is no document or file-sized hashing.
  const capturedFrame = frame(r.frame);
  const bytes = new TextEncoder().encode(r.sketchJSON);
  if (bytes.byteLength > 65536) fail('RESOURCE_LIMIT', 'Sweep path source exceeds64KiB UTF-8.');
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), n => n.toString(16).padStart(2,'0')).join('');
  if (digest !== r.sketchDigest) fail('STALE_SKETCH', 'Path source digest changed.');
  let sketch; try {sketch = JSON.parse(r.sketchJSON);} catch {fail('INVALID_SKETCH', 'Expected native path sketch JSON.');}
  if (sketch?.version !== 3 || !Array.isArray(sketch.objects) || sketch.objects.length > 4096 || !Array.isArray(sketch.stages) || sketch.stages.length !== 1 ||
      !Array.isArray(sketch.stages[0]?.constraints) || !Array.isArray(sketch.stages[0]?.generators) || sketch.stages[0].generators.length) fail('UNSUPPORTED_SKETCH', 'One bounded generator-free path stage is required.');
  const sourceFrame = record(sketch.metadata?.boundaryFrame, ['origin','x','y','z']);
  if (Object.keys(capturedFrame).some(name => !Array.isArray(sourceFrame[name]) || sourceFrame[name].length !== 3 || sourceFrame[name].some((n,i) => n !== capturedFrame[name][i]))) fail('STALE_FRAME', 'Path source does not match the captured plane.');
  const inventory = new Map();
  for (const object of sketch.objects) {
    if (!object || typeof object.id !== 'string' || !object.id || object.id.length > 256 || inventory.has(object.id) || object.stage !== 0 || ![null,'construction'].includes(object.role)) fail('INVALID_SKETCH', 'Path source identities must be unique stage-zero objects.');
    inventory.set(object.id, object);
  }
  const context = freeze({binding:{revision:r.revision,sketchDigest:r.sketchDigest,faceId:r.faceId},frame:capturedFrame});
  sourceContexts.set(context,inventory);
  return context;
}
// Private inventories are constructed only by the verified byte capture above.
// Selection/discovery reuse that one parse/hash; the context is GC-owned.
export function selectCapturedSweepPath(context, rawReferences) {
  const inventory=sourceContexts.get(context);
  if(!inventory)fail('INVALID_REQUEST','Expected a captured sweep path context.');
  const references=captureSweepPathReferences(rawReferences);
  let previousEnd;
  const objects = references.map(reference => {
    const object = inventory.get(reference.curveId);
    if (!object) fail('STALE_PATH', 'A selected path source curve is unavailable.');
    if (!['Segment','Arc'].includes(object.type)) fail('SWEEP_UNSUPPORTED_PATH', 'Select actual source Segments or open circular Arcs.');
    const data = record(object.data, object.type === 'Segment' ? ['a','b'] : ['a','b','c','branch']);
    data.a = point(data.a); data.b = point(data.b);
    if(object.type==='Arc'){
      try{captureArcData(data)}catch(error){if(error?.code!=='INVALID_ARC_BRANCH')throw error;fail('SWEEP_INVALID_PATH','The selected Arc has invalid authored branch or endpoint rays.');}
      if(data.branch!=='proper-ccw')fail('SWEEP_UNSUPPORTED_PATH','The selected full Arc requires separate closed-path support.');
    }
    if (same(data.a,data.b)) fail('SWEEP_INVALID_PATH', 'A directed Segment path needs distinct endpoints.');
    if (object.type === 'Arc') {data.c = point(data.c); if (same(data.a,data.c) || same(data.b,data.c)) fail('SWEEP_INVALID_PATH', 'An arc center cannot be its endpoint.');}
    const start = reference.reversed ? data.b : data.a, end = reference.reversed ? data.a : data.b;
    if (previousEnd && !same(previousEnd,start)) fail('SWEEP_DISCONNECTED_PATH', 'Ordered source endpoints must join exactly; no proximity welding.');
    previousEnd = end;
    return {id:object.id,type:object.type,role:object.role,stage:object.stage,data};
  });
  return freeze({binding:{...context.binding,pathCurves:references},frame:context.frame,objects,
    qualification:'source-membership-only; arc interpretation, transport and native result require separate evaluation'});
}

export async function captureSolvedSweepPath(input) {
  const r=record(input,['unit','revision','sketchDigest','faceId','frame','sketchJSON','pathCurves']);
  // References must be detached before source hashing can suspend.
  const references=captureSweepPathReferences(r.pathCurves);
  const context=await captureSolvedSweepPathSource({unit:r.unit,revision:r.revision,sketchDigest:r.sketchDigest,faceId:r.faceId,frame:r.frame,sketchJSON:r.sketchJSON});
  return selectCapturedSweepPath(context,references);
}
export function inspectCapturedSweepPath(context) {
  const inventory=sourceContexts.get(context);
  if(!inventory)fail('INVALID_REQUEST','Expected a captured sweep path context.');
  const rows=[];
  for(const object of inventory.values()) {
    if(typeof object.type!=='string'||!object.type||object.type.length>64)fail('INVALID_SKETCH','Path source type metadata must be bounded.');
    const base={curveId:object.id,type:object.type,role:object.role,stage:object.stage};
    try {
      const selected=selectCapturedSweepPath(context,[{curveId:object.id,reversed:false}]),data=selected.objects[0].data;
      rows.push({...base,supported:true,reason:null,a:[data.a.x,data.a.y],b:[data.b.x,data.b.y],...(object.type==='Arc'?{c:[data.c.x,data.c.y]}:{})});
    } catch(error) {
      if(!['INVALID_REQUEST','SWEEP_INVALID_PATH','SWEEP_UNSUPPORTED_PATH'].includes(error?.code))throw error;
      rows.push({...base,supported:false,reason:{code:error.code,message:String(error.message).slice(0,512)}});
    }
  }
  return freeze(rows);
}
