# ArcLength Core equation seam — source only

Implements item 1 of the BEFORE contract, not the complete public measurement
lifecycle. No tests, compilation, browser execution or geometry qualification
has been performed. This packet must not add a menu capability or PASS row.

## Actual source changes

- `constr/arcLengthDomain.mjs` derives one positive finite length from actual
  authored endpoint/center data and explicit branch via `requireArcInterval`.
  It reads neither solver-angle auxiliaries nor cached measured lengths.
- `constr/arcLengthSchema.ts` defines one typed positive length constant and
  constructs the actual polynomial equation. Full arcs use `2πr-L`; proper
  arcs derive a temporary integer angle chart and use `r*(end-start+2πk)-L`.
  The existing polynomial engine supplies product derivatives. No winding
  constant, branch flag or observed length is added to the document.
- `ANConstraints.ts` registers the Core equation; `sketchValidation.ts` admits
  only a real Arc target for this schema.
- `registeredConstraintPolicy.mjs` validates its ordinary circular domain and
  independently checks `actualRadius*authoredSweep-L` in millimeters against
  the existing length residual tolerance. This catches a wrong solver chart
  even if that polynomial itself converged. Existing ArcConsistency checks
  still apply; no source or solver tolerance is widened.

## Source-review boundaries and remaining work

The schema intentionally has no annotation until an Arc-specific native ruler
exists. Existing `LinearDimension` serializes two Point references and measures
straight-line distance. Reusing it would persist/display the endpoint chord,
which is mathematically wrong for arc length and especially wrong for a full
arc whose endpoints coincide.

`lengthMeasurementPreparation.js` and `lengthMeasurementIntent.mjs` expose
Segment/ruler ownership and strict `segmentId` metadata; their Worker transition
also explicitly binds SegmentLength and LinearDimension archive records.
Public Arc targets need their own strict shape discriminator and authenticated
ruler membership. Existing driving discovery, delta/travel proof and typed
length edit must admit ArcLength together; changing the schema alone supplies
none of those shared lifecycle operations.

The remaining coherent packet therefore includes: native Arc ruler class,
strict serialized record and IO/role presentation; ordinary human and agent
create/convert/remove operations; Worker capture/producer/verifier; original
source/history reconstruction; existing driving edit/remove discovery; actual
Host registration/source-roster/build closure. No raw caller geometry, trusted
proof flag or synchronized measured value may be used as a shortcut.

Before integration, independently review angle-chart collection during warm and
cold solve, original residual checks, full-arc seam semantics and scalar units.
After the entire lifecycle is implemented, run the grouped acceptance from the
BEFORE contract, including actual typed binding and native Save/fresh Open.
Do not infer a pass from this source packet or from previous Segment tests.
