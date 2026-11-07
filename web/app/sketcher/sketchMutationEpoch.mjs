// Realm-local monotonic invalidation. Worker realms have their own
// instance; unrelated sketch mutations conservatively invalidate captures.
// This supplements, but does not yet replace, the exact serialized guard.
let current = 0;
export function sketchMutationEpoch() { return current; }
export function noteSketchMutation() {
  // Fail closed rather than wrap and accidentally validate an ancient token.
  if (current >= Number.MAX_SAFE_INTEGER) throw Error('Sketch mutation epoch exhausted.');
  current++;
}
