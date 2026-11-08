# Confirmed whole-workflow cross-realm capture repair

The first complete public Coincidence R1 (root process77247), actual Core53469d6
and Desktop8eac41c9e, passed real rectangle Native/Point diagnostics then failed
at its FIRST apply with`Choose exactly two dense point identities.` Root retains
that original whole failure. No new probe, test, build, type/syntax check or
browser execution is performed for this source repair.

## Confirmed source cause and repair

The host adapter captures and freezes its actual argument array in the outer
app realm. The real Craft coordinator receives that array across the CAD iframe
boundary and wraps it in a local intent record without converting the nested
array's realm. `pointCoincidenceEnvelope.pair` compared its prototype with the
iframe's`Array.prototype`, rejecting a genuine dense array solely for its realm.

Remove that prototype identity comparison. `Array.isArray` remains mandatory;
length remains EXACTLY2, `Reflect.ownKeys` EXACTLY3, and each0/1 slot must remain
an enumerable OWN DATA descriptor containing a nonempty string no longer than256.
The IDs must remain distinct. The local output is still a detached frozen pair.
No iterator, foreign map method, inherited value or accessor supplies an ID.
Sparse arrays, extra/symbol fields, getters, wrong types and alias IDs still
fail the same structural checks. No source/currentness/geometry/intent proof or
mathematical tolerance is relaxed.

`coincidenceRecord` had the analogous strict local`Object.prototype` equality.
It now uses the existing public coordinator/host convention: allow a null
prototype or an ordinary realm-root prototype whose parent is null, then require
the exact own-key count and exact enumerable own-data named descriptors. Capture
still builds a local null-prototype record. No inherited fields are read.

## Boundary audit

- Desktop`coincidence-commands.mjs` already uses that realm-root record check,
  `Array.isArray`, exact length/key count and own data slot capture; it allocates
  and freezes a local pair before invoking the genuine Core service. No adapter
  product edit is needed.
- `closedSketchTransitions.record` already accepts ordinary foreign records
  through the same realm-root convention. Its public coincidence method captures
  the nested pair using the repaired shared envelope before yielding.
- `transitionClient` receives a fresh local request from the coordinator and the
  shared envelope now captures/freezes the pair before queueing. Reply objects
  arrive via real Worker structured clone. Its unrelated generic plain-record
  checks are not broadened.
- Worker transition/reconstruction request bodies arrive by structured clone;
  their shared envelope continues to enforce exact own-data capture. The second
  Worker still repeats the original request and binds actual row order, candidate,
  status/stage/index and no-op semantics.

Frozen whole driver, independent oracle, original assertions, geometry/residual
budgets and historical R1 remain unchanged. Root must rebuild and rerun that
UNCHANGED complete workflow; this source correction is not qualification.
