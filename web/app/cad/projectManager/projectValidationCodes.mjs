import {SOURCE_PROJECTION_CODES} from '../../../../modules/engine/source/sourceProjectionIntent.mjs';
import {COUNTERSINK_GEOMETRY_CODES} from '../../../../modules/engine/solid/ownedCountersinkIntent.mjs';
import {COUNTERBORE_GEOMETRY_CODES} from '../../../../modules/engine/solid/ownedCounterboreIntent.mjs';
import {BLIND_HOLE_GEOMETRY_CODES} from '../../../../modules/engine/solid/ownedBlindHoleIntent.mjs';
// One transport contract for the validation Worker and its document owner.
// Unknown codes stay generic; messages do not grant a code or adoption authority.
const known = Object.freeze([
  ...SOURCE_PROJECTION_CODES,
  'OFFSET_INVALID','OFFSET_LIMIT','OFFSET_OWNER','OFFSET_CACHE_CHANGED','OFFSET_DOMAIN','OFFSET_DISTANCE','OFFSET_SIDE','OFFSET_COLLAPSE',
  ...BLIND_HOLE_GEOMETRY_CODES,...COUNTERBORE_GEOMETRY_CODES,...COUNTERSINK_GEOMETRY_CODES,
  // Actual bounded authored-feature capture, never message-based inference.
  'INVALID_REQUEST', 'RESOURCE_LIMIT',
  'INVALID_FEATURE_ID', 'DUPLICATE_FEATURE_ID',
  'INVALID_SKETCH_ENTITY_DOMAIN', 'INVALID_HISTORY_STATE',
  'INVALID_SOURCE_FRAME', 'INVALID_FRAME_DEPENDENCY', 'STALE_FRAME',
  'UNRESOLVED_SOURCE', 'UNSUPPORTED_FRAME_PARENT'
]);

export function projectValidationFailureCode(value) {
  return typeof value === 'string' && known.includes(value) ? value : null;
}
