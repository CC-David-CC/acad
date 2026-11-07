// Research-only file envelope. No shell, face or topology IDs are inferred.
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const keys = (value, expected) => record(value) && Object.keys(value).sort().join(',') === expected.sort().join(',');
const id = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
const label = value => typeof value === 'string' && value.length > 0 && value.length <= 256;
const color = value => typeof value === 'string' && /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(value);
const units = new Set(['millimeter', 'micron', 'centimeter', 'meter', 'inch', 'foot']);
// Temporary experimental cap, not a claim about the desktop's file limits.
export const PREPARE_LIMIT_BYTES = 8 * 1024 * 1024;

// Hash JSON values only. Sorted object keys ignore source formatting while
// arrays retain their authored order. Reject values JSON would silently alter.
function canonical(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + Array.from(value, canonical).join(',') + ']';
  if (record(value) && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)) {
    return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
  }
  throw new Error('Project contains a non-JSON value');
}

async function digest(value) {
  const bytes = new TextEncoder().encode(canonical(value));
  const hash = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return 'sha256-' + Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
}

// Geometry revision excludes manufacturing information and its digest.
export async function geometryRevision(project) {
  if (!record(project) || !record(project.model) || !Array.isArray(project.sketches)) throw new Error('Invalid project bundle');
  return digest({kind:'codi-jsketcher-geometry-v1', project});
}

// Full snapshot includes all authored project and manufacturing fields, but
// contains no digest field of its own; revision is data, not proof of validity.
export async function manufacturingSnapshotDigest(project, metadata) {
  if (!record(project) || !record(project.model) || !Array.isArray(project.sketches)) throw new Error('Invalid project bundle');
  const valid = validateManufacturingMetadata(metadata);
  return digest({kind:'codi-jsketcher-manufacturing-snapshot-v1', project, manufacturing:valid});
}

// Capture before awaiting Web Crypto; refuse changes to either part while
// hashing. Caller must additionally recheck account, frame and file version
// immediately before writing. This initial implementation is intentionally
// capped: JSON serialization and SubtleCrypto each materialize memory.
export async function prepareManufacturingSnapshot(capture, isActive) {
  if (typeof capture !== 'function' || typeof isActive !== 'function' || !isActive()) throw new Error('Project is unavailable');
  const serialized = canonical(capture());
  if (serialized.length > PREPARE_LIMIT_BYTES || new TextEncoder().encode(serialized).byteLength > PREPARE_LIMIT_BYTES) throw new Error('Manufacturing model exceeds the current 8 MiB preparation limit');
  const {project, manufacturing} = JSON.parse(serialized);
  validateManufacturingMetadata(manufacturing);
  const revision = await geometryRevision(project);
  if (manufacturing.revision !== revision) throw new Error('Model changed; review material assignments before saving');
  const snapshotDigest = await manufacturingSnapshotDigest(project, manufacturing);
  if (!isActive() || canonical(capture()) !== serialized) throw new Error('Model changed while preparing the save');
  return {envelope: encodeManufacturingProject(project, manufacturing), geometryRevision: revision, snapshotDigest};
}

export function validateManufacturingMetadata(data) {
  if (!keys(data, ['version', 'unit', 'revision', 'materials', 'appearances', 'bindings', 'objects']) || data.version !== 1 || !units.has(data.unit) ||
      !Array.isArray(data.materials) || !Array.isArray(data.appearances) || !id(data.revision) || !Array.isArray(data.bindings) || !Array.isArray(data.objects) ||
      data.materials.length > 10000 || data.appearances.length > 10000 || data.objects.length > 10000 || data.bindings.length > 10000) throw new Error('Invalid manufacturing metadata');
  const materials = new Set(), appearances = new Set(), targets = new Set();
  for (const item of data.materials) {
    if (!keys(item, ['id', 'name']) || !id(item.id) || !label(item.name) || materials.has(item.id)) throw new Error('Invalid material');
    materials.add(item.id);
  }
  for (const item of data.appearances) {
    if (!keys(item, ['id', 'name', 'color']) || !id(item.id) || !label(item.name) || !color(item.color) || appearances.has(item.id)) throw new Error('Invalid appearance');
    appearances.add(item.id);
  }
  const bindings = new Set();
  for (const binding of data.bindings) {
    const enclosure=['WORKER_ENCLOSURE_V1','WORKER_ENCLOSURE_V2'].includes(binding?.operationType);
    const roles=binding?.operationType==='WORKER_ENCLOSURE_V2'?['BODY','LID','LABEL']:['BODY','LID'];
    if (!keys(binding, enclosure ? ['id', 'featureId', 'operationType', 'outputRole'] : ['id', 'featureId', 'operationType']) ||
        (enclosure && !roles.includes(binding.outputRole)) || !id(binding.id) || bindings.has(binding.id) ||
        !Number.isSafeInteger(binding.featureId) || binding.featureId <= 0 || !id(binding.operationType)) throw new Error('Invalid authored body binding');
    bindings.add(binding.id);
  }
  for (const item of data.objects) {
    if (!keys(item, ['id', 'name', 'regions']) || !id(item.id) || !label(item.name) || targets.has(item.id) || !Array.isArray(item.regions) || !item.regions.length || item.regions.length > 10000) throw new Error('Invalid printable object');
    targets.add(item.id);
    const regionIds = new Set();
    for (const region of item.regions) {
      if (!keys(region, ['id', 'bodyId', 'materialId', 'appearanceId', 'transform']) || !id(region.id) || regionIds.has(region.id) || !bindings.has(region.bodyId) ||
          !(region.materialId === null || materials.has(region.materialId)) || !(region.appearanceId === null || appearances.has(region.appearanceId)) ||
          !Array.isArray(region.transform) || region.transform.length !== 12 || !region.transform.every(Number.isFinite)) throw new Error('Invalid printable region');
      regionIds.add(region.id);
    }
  }
  return JSON.parse(JSON.stringify(data));
}

export function resolveManufacturingAssignments(data, history, bodies, currentRevision) {
  const validated = validateManufacturingMetadata(data);
  if (currentRevision !== validated.revision) throw new Error('Project revision changed; review body assignments');
  if (!Array.isArray(history) || !Array.isArray(bodies)) throw new Error('Live model is unavailable');
  const bindings = new Map(validated.bindings.map(binding => [binding.id, binding]));
  return validated.objects.map(object => ({...object, regions: object.regions.map(region => {
    const binding = bindings.get(region.bodyId);
    const indices = history.map((operation, index) => operation && Number(operation.params?.featureId) === binding.featureId ? index : -1).filter(index => index !== -1);
    if (indices.length !== 1 || history[indices[0]].type !== binding.operationType) throw new Error('Missing or ambiguous authored operation: ' + region.bodyId);
    const candidates = bodies.filter(body => body && body.originatingOperation === indices[0]);
    if(['WORKER_ENCLOSURE_V1','WORKER_ENCLOSURE_V2'].includes(binding.operationType)) {
      const version=binding.operationType==='WORKER_ENCLOSURE_V2'?2:1, expected=version===2?['BODY','LID','LABEL']:['BODY','LID'];
      // One authored operation deliberately produces two parts. Neither array
      // order nor kernel numbering is a material assignment selector.
      const roles=new Map();
      for(const body of candidates){
        const role=body.outputRole;
        if(!expected.includes(role)||roles.has(role)||body.featureId!==binding.featureId||
            body.id!=='worker-enclosure:'+version+':'+JSON.stringify([binding.featureId,role]))
          throw new Error('Missing or ambiguous enclosure output: '+region.bodyId);
        roles.set(role,body);
      }
      if(roles.size!==expected.length)throw new Error('Missing or ambiguous enclosure output: '+region.bodyId);
      return {...region,body:roles.get(binding.outputRole)};
    }
    if (candidates.length !== 1) throw new Error('Missing or ambiguous authored body: ' + region.bodyId);
    return {...region, body: candidates[0]};
  })}));
}

// This only prepares a user-reviewable proposal. It is not automatic proof
// of geometric equivalence and must not mutate persisted assignments.
export function proposeManufacturingRebind(data, history, bodies, newRevision) {
  if (!id(newRevision)) throw new Error('Invalid project revision');
  const original = validateManufacturingMetadata(data);
  const proposed = {...original, revision: newRevision};
  const objects = resolveManufacturingAssignments(proposed, history, bodies, newRevision);
  return {fromRevision: original.revision, toRevision: newRevision, objects,
    warning: 'Review every material assignment after changing the model.'};
}

// The wrapper intentionally omits legacy top-level model/sketches. This makes
// guarded old host readers reject it, but does NOT make old standalone import
// safe: those readers can clear state before detecting an unsupported file.
export function encodeManufacturingProject(bundle, metadata) {
  if (!record(bundle) || !record(bundle.model) || !Array.isArray(bundle.sketches)) throw new Error('Invalid project bundle');
  return {format: 'codi-jsketcher-manufacturing', version: 1, project: JSON.parse(JSON.stringify(bundle)), manufacturing: validateManufacturingMetadata(metadata)};
}

export function decodeManufacturingProject(value) {
  if (!record(value)) throw new Error('Invalid project');
  if (!Object.prototype.hasOwnProperty.call(value, 'format')) {
    if (!record(value.model) || !Array.isArray(value.sketches)) throw new Error('Invalid legacy project');
    return {project: JSON.parse(JSON.stringify(value)), manufacturing: null};
  }
  if (!keys(value, ['format', 'version', 'project', 'manufacturing']) || value.format !== 'codi-jsketcher-manufacturing' || value.version !== 1 ||
      !record(value.project) || !record(value.project.model) || !Array.isArray(value.project.sketches)) throw new Error('Unsupported manufacturing project');
  return {project: JSON.parse(JSON.stringify(value.project)), manufacturing: validateManufacturingMetadata(value.manufacturing)};
}
