import {fillUpMissingFields} from './schema/initializeBySchema';

// New authored operations must have a detached, JSON-representable request.
// This mirrors the field-fill used by project replay before the first run,
// so replay cannot silently change an accepted operation's default arguments.
// Existing saved files are not rewritten by this function.
function copyJSON(value, state, depth = 0) {
  if (++state.nodes > 20000 || depth > 64) throw new Error('Operation request exceeds validation limits.');
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Operation request contains a non-finite number.');
    return value;
  }
  if (typeof value === 'string') {
    state.characters += value.length;
    if (state.characters > 1048576) throw new Error('Operation request exceeds validation limits.');
    return value;
  }
  if (typeof value !== 'object') throw new Error('Operation request contains a non-serializable value.');
  if (state.active.has(value)) throw new Error('Operation request contains a cycle.');
  const array = Array.isArray(value);
  if (!array && Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) throw new Error('Operation request contains a non-plain object.');
  if (Object.getOwnPropertySymbols(value).length) throw new Error('Operation request contains a symbol field.');
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (array && value.length > 20000) throw new Error('Operation request exceeds validation limits.');
  if (array) for (let i = 0; i < value.length; i++) if (!Object.prototype.hasOwnProperty.call(value, i)) throw new Error('Operation request contains a sparse array.');
  const output: any = array ? [] : {};
  state.active.add(value);
  try {
    for (const key of Object.keys(descriptors)) {
      if (array && key === 'length') continue;
      if (array && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= value.length)) throw new Error('Operation request contains an unsupported array field.');
      const descriptor = descriptors[key];
      if (!descriptor.enumerable) continue;
      if (!Object.prototype.hasOwnProperty.call(descriptor, 'value')) throw new Error('Operation request contains an accessor.');
      if (descriptor.value === undefined && !array) continue;
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') throw new Error('Operation request contains an unsupported field.');
      output[key] = copyJSON(descriptor.value, state, depth + 1);
    }
    if (array && output.length !== value.length) throw new Error('Operation request contains a sparse array.');
  } finally { state.active.delete(value); }
  return output;
}

export function normalizeNewOperationRequest(request, operation, context) {
  if (!request || typeof request !== 'object' || typeof request.type !== 'string' || !request.params || typeof request.params !== 'object' || Array.isArray(request.params)) {
    throw new Error('Invalid operation request.');
  }
  const copy = copyJSON(request, {nodes: 0, characters: 0, active: new Set()});
  // Capture the verified source-side relationships when the wizard or command
  // first creates this operation; replay must use the saved values unchanged.
  if (copy.type === 'WORKER_FOUR_CORNER_THROUGH_HOLES_V1' && copy.params.sideIds === undefined) {
    const face = context.cadRegistry.findFace(copy.params.face);
    const sides = face?.root?.ext?.fourCornerSideIds;
    if (!face || context.cadRegistry.findFace(face.id) !== face || !sides) throw new Error('The centered plate source sides are unavailable.');
    copy.params.sideIds = copyJSON(sides, {nodes: 0, characters: 0, active: new Set()});
  }
  const schema = operation.schema;
  const boolean = schema && schema.boolean;
  const kinds = boolean?.schema?.kind?.enum;
  const isBooleanModifier = boolean?.type === 'object' && boolean.optional === true && Array.isArray(kinds) &&
    kinds.length === 4 && ['NONE', 'UNION', 'SUBTRACT', 'INTERSECT'].every(kind => kinds.includes(kind)) &&
    boolean.schema.simplify?.type === 'boolean' && boolean.schema.targets?.type === 'array' && boolean.schema.targets?.items?.type === 'entity';
  if (isBooleanModifier) {
    if (copy.params.boolean === undefined || copy.params.boolean === null) {
      copy.params.boolean = {kind: 'NONE', simplify: boolean.schema.simplify.defaultValue, targets: []};
    } else {
      const value = copy.params.boolean;
      if (!value || typeof value !== 'object' || Array.isArray(value) ||
          !kinds.includes(value.kind) || Object.keys(value).some(key => !['kind', 'simplify', 'targets'].includes(key)) ||
          (value.simplify !== undefined && typeof value.simplify !== 'boolean') ||
          (value.targets !== undefined && (!Array.isArray(value.targets) || value.targets.some(target => typeof target !== 'string')))) {
        throw new Error('Invalid boolean modifier.');
      }
    }
  }
  fillUpMissingFields(copy.params, schema, context);
  return copy;
}
