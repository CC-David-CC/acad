// One transport contract for the validation Worker and its document owner.
// Unknown codes stay generic; messages do not grant a code or adoption authority.
const known = Object.freeze([
  'OFFSET_INVALID','OFFSET_LIMIT','OFFSET_OWNER','OFFSET_CACHE_CHANGED','OFFSET_DOMAIN','OFFSET_DISTANCE','OFFSET_SIDE','OFFSET_COLLAPSE',
  'INVALID_FEATURE_ID', 'DUPLICATE_FEATURE_ID',
  'INVALID_SKETCH_ENTITY_DOMAIN', 'INVALID_HISTORY_STATE',
  'INVALID_SOURCE_FRAME', 'INVALID_FRAME_DEPENDENCY', 'STALE_FRAME',
  'UNRESOLVED_SOURCE', 'UNSUPPORTED_FRAME_PARENT'
]);

export function projectValidationFailureCode(value) {
  return typeof value === 'string' && known.includes(value) ? value : null;
}
