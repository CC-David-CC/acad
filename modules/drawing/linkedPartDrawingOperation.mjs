import {captureLinkedPartDrawingDefinition} from './linkedPartDrawingDefinition.mjs';

// Pure metadata proposals. The shared document owner must recheck lifetime and
// revision at publication and integrate these records in its existing journal.
export const LINKED_DRAWING_REQUEST_MAX_BYTES = 65536;
export const LINKED_DRAWING_JOURNAL_MAX_CHARGE = 262144;
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
  if (!plainRecord(value)) fail('Expected exact drawing operation data.');
  const actual = Reflect.ownKeys(value);
  if (actual.length !== keys.length || actual.some(k => typeof k !== 'string' || !keys.includes(k))) fail('Unexpected or missing drawing operation fields.');
  const result = Object.create(null);
  for (const key of keys) {
    const d = Object.getOwnPropertyDescriptor(value, key);
    if (!d?.enumerable || !own(d, 'value')) fail('Drawing operation fields must be enumerable own data.');
    result[key] = d.value;
  }
  return result;
}
function text(value, max) {
  if (typeof value !== 'string' || !value.length || value.length > max || /[\u0000-\u001f\u007f]/u.test(value)) fail('Expected a bounded drawing operation identity.');
  return value;
}
function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  return JSON.stringify(value);
}
const freeze = value => {
  if (value && typeof value === 'object') { for (const child of Object.values(value)) freeze(child); Object.freeze(value); }
  return value;
};
export function captureLinkedPartDrawingRequest(value) {
  const descriptor = value && typeof value === 'object' ? Object.getOwnPropertyDescriptor(value, 'op') : null;
  if (!descriptor?.enumerable || !own(descriptor, 'value') || !['drawing.create', 'drawing.replace', 'drawing.remove'].includes(descriptor.value)) fail('Unsupported drawing metadata operation.');
  const op = descriptor.value, base = ['op', 'version', 'unit', 'revision', 'geometryRevision'];
  const r = record(value, [...base, ...(op === 'drawing.create' ? ['definition'] : op === 'drawing.replace' ? ['drawingId', 'definition'] : ['drawingId'])]);
  if (r.op !== op) fail('Drawing operation changed during capture.');
  if (r.version !== 1 || r.unit !== 'millimeter') fail('Select drawing operation version1 and millimeters.');
  text(r.revision, 256); text(r.geometryRevision, 256);
  if (op !== 'drawing.create') text(r.drawingId, 128);
  if (op !== 'drawing.remove') r.definition = captureLinkedPartDrawingDefinition(r.definition);
  if (op === 'drawing.replace' && r.drawingId !== r.definition.drawingId) fail('Drawing identity cannot change during replacement.');
  if (new TextEncoder().encode(canonical(r)).byteLength > LINKED_DRAWING_REQUEST_MAX_BYTES) fail('Drawing request exceeds64KiB UTF-8 including metadata wrapper.', 'RESOURCE_LIMIT');
  return freeze(r);
}
function current(value) {
  const c = record(value, ['revision', 'geometryRevision', 'drawing']);
  text(c.revision, 256); text(c.geometryRevision, 256);
  if (c.drawing !== null) c.drawing = captureLinkedPartDrawingDefinition(c.drawing);
  return freeze(c);
}
function journalBase(key, before, after) {
  const r = Object.assign(Object.create(null), {kind: 'document-metadata', version: 1, domain: 'linked-part-drawing', key, before, after});
  text(key, 128);
  if (before === null && after === null || before !== null && before.drawingId !== key || after !== null && after.drawingId !== key || canonical(before) === canonical(after)) fail('Journal entry must describe one actual drawing definition change.');
  const serialized = canonical(r), byteSize = Math.max(new TextEncoder().encode(serialized).byteLength, 2 * serialized.length);
  if (byteSize > LINKED_DRAWING_JOURNAL_MAX_CHARGE) fail('Drawing edit exceeds its retained journal charge.', 'RESOURCE_LIMIT');
  return {r, byteSize};
}
export function captureLinkedPartDrawingOperationRecord(value) {
  const r = record(value, ['kind', 'version', 'domain', 'key', 'before', 'after', 'byteSize']);
  if (r.kind !== 'document-metadata' || r.version !== 1 || r.domain !== 'linked-part-drawing') fail('Unsupported shared metadata journal domain.');
  const before = r.before === null ? null : captureLinkedPartDrawingDefinition(r.before);
  const after = r.after === null ? null : captureLinkedPartDrawingDefinition(r.after);
  const result = journalBase(r.key, before, after);
  if (r.byteSize !== result.byteSize) fail('Drawing journal charge does not match its admitted contents.');
  return freeze(Object.assign(result.r, {byteSize: result.byteSize}));
}
export function prepareLinkedPartDrawingOperation(value) {
  const args = record(value, ['request', 'current']), request = captureLinkedPartDrawingRequest(args.request), c = current(args.current);
  if (request.revision !== c.revision || request.geometryRevision !== c.geometryRevision) fail('Drawing metadata preparation is stale.', 'STALE_DOCUMENT');
  const before = c.drawing;
  if (request.op === 'drawing.create' && before !== null) fail('The initial single drawing already exists.', 'DRAWING_ALREADY_EXISTS');
  if (request.op !== 'drawing.create' && (before === null || before.drawingId !== request.drawingId)) fail('Drawing identity does not match the current definition.', 'DRAWING_NOT_FOUND');
  const after = request.op === 'drawing.remove' ? null : request.definition;
  const changed = canonical(before) !== canonical(after);
  let journalRecord = null;
  if (changed) {
    const result = journalBase((after || before).drawingId, before, after);
    journalRecord = freeze(Object.assign(result.r, {byteSize: result.byteSize}));
  }
  return freeze({changed, binding: {revision: c.revision, geometryRevision: c.geometryRevision}, before, after, journalRecord});
}
