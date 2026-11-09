# Typed feature field dimensions — countersink prerequisite, source only

Base24ad11cbf24b771ff54da2a0df78e84c38a6b601. This is a bounded preparation
seam for approved designc2c8b21, not countersink implementation, discovery,
Native capability or qualification. No tests, probes, TSC, builds, Native or
browser execution. No existing .cad/Native format, runtime pair/default, journal,
PM, Craft, File route, solver or source geometry is changed.

## Source-confirmed assumption and one authoritative role

`web/app/cad/parameters/physicalBindings.mjs` previously resolved every feature
field as LENGTH and returned every `dimensions[field]` as `length`.
`verifyPhysicalBindings.mjs` independently required every returned role to be
`length`; changing the Worker alone would leave a real response mismatch.
`physicalBindingFields.mjs` was a name-only allowlist shared by manifest capture,
Craft discovery/change admission and enclosure consumers.

The active `physicalBindingFieldRoles` now owns the canonical dimension of each
existing authored field. Existing `physicalBindingFields` arrays are derived
from exactly those objects in the same field/type order. They are frozen, as
are each role record. Worker resolution and response verification consume the
same record; no separate dimension table, synchronized model flag or caller
claim is introduced. Every existing active role is still LENGTH and every old
active type/field name is unchanged.

The single future declaration `centeredCountersinkBindingFieldRoles` contains:

| Authored field | Canonical dimension/unit |
|---|---|
| throughDiameter | length / millimeter |
| entryDiameter | length / millimeter |
| includedAngleRadians | angle / radian, FULL included angle |

It is deliberately NOT inserted into the active role map. Consequently this
packet does not make the private manifest accept a new target type, does not
make Craft advertise countersink fields, and does not bypass the actual modern
history allowlist. Future coherent countersink composition inserts this same
record once under its real feature type after all native/consumer closure is
ready; it must not duplicate/retype its fields elsewhere. There is no generic
registration/plug-in framework or allowUnknown toggle.

## Value resolution and unchanged domains

The existing bounded evaluated quantity response already carries its actual
seven-dimensional `name/dimension/value` rows. The Worker continues to use that
captured result from `evaluatePhysicalSource`, not an arbitrary new evaluator or
main-thread value map. Named resolution now asks for the actual field dimension
rather than hardcoding LENGTH. Wrong dimensions retain DIMENSION_MISMATCH and
the actual name; missing names retain UNKNOWN_PARAMETER; numeric-text handling,
128-character limit and original manifest/raw binding preservation are unchanged.

All old LENGTH policies remain exactly where they were: positive >0 lengths;
existing max1e6 (enclosure1e5); existing rectangle minimum.001; the original
coupled enclosure validation. There is no broadening of `isAuthoredLength`.
Extents ownership is separate: future signed-nonzero distance, positive total
and nonnegative side LENGTH modes must retain their actual variant/domain
capture and install their narrow active-field splice. Dimension equality is not
a sign/domain certificate. This packet imports no queued extent helper.

The only prepared ANGLE consumer is the expressly named `includedAngleRadians`
field: finite canonical radians strictly between0 andpi. This is not a policy
for all future angles (signed orientation, for example, has another domain).
The compatibility name list and role table grant no coupled radius/depth/native
viability proof. Actual countersink must still establish d<D, finite positive
frustum math, h<T, genuine entry/finite cone/cylinder provenance and cleanup.

NEW `modules/engine/solid/authoredIncludedAngleBinding.mjs` provides
`isAuthoredIncludedAngleRadians(value)` and
`resolveAuthoredIncludedAngleRadians(value,expressions)`. It admits only a
finite0<value<pi numeric literal or the existing bounded named-quantity grammar.
Named values require actual current typed source and call the authoritative
`expressions.resolveQuantity(name,'angle')`; its original errors propagate.
Resolved values undergo the same full-included-radian domain. No angle default,
degree/half-angle reinterpretation, formula parsing or formula-to-literal save.
The helper returns a numeric materialization; the future authored feature must
retain its original name/raw intent just as existing authored LENGTH consumers.
No existing consumer imports it in this prerequisite packet.

## Ownership / source splice handoff

Changed production files are ONLY physicalBindingFields.mjs,
physicalBindings.mjs, verifyPhysicalBindings.mjs and the NEW included-angle
helper. Root/extent owner was notified before shared edits. Extent foundation
08d0d2e235053d6fb43413d6185d218033a5b523 has no physical-file edit and remains
separate; its owner will apply exact active-variant/domain splices after this
checkpoint. Existing through-hole conditional field filtering is retained.

Future countersink closure still must include its real authored intent/capture,
field binding/travel/typed literal consumers, modern history and source relation,
validation and runtime/Native availability. Its exact new Native pair follows
review/compilation of the actual conical foundation; existing MFG32e/abb cannot
claim those ports. When the new helper becomes an actual imported Worker graph
leaf, add it to that cohort's real stage/emission/catalog closure and recompute
any affected source hashes. This packet changes no hardcoded bootstrap/OCI hash
and advertises no resource/module that has not been staged.

## Qualification still required

Root must review serial composition, then build the complete feature and run its
ONE whole public workflow before the independent source/.cad/STEP/3MF artifact
oracle. That future workflow must demonstrate actual typed rad/deg evaluation,
raw angle-name persistence, LENGTH-versus-ANGLE refusals, full included-angle
domain and coupled interior checks, stale/failure rollback, shared creation/edit
travel and normal Save/server/freshOpen/reedit. An unused role declaration or
helper is not a successful geometry claim. Current qualified old consumers and
frozen first failures remain their original evidence, not newly tested here.
