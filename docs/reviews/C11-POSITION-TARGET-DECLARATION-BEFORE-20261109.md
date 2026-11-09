# C11 v4 Position target declaration: BEFORE and current-root compatibility

SOURCE ONLY / UNRUN. Initial request Root `01d31d5409450e3d7a8d42264f43d3a7c442d4e3`; actual leaf composition
and correction basis `03e24bdd26c56f42d2e018ccb2c1e6a04c7c7f33`,
following qualified finite extent proof `d68ecb2`. This note changes no product,
criteria, source/Native geometry, shared graph, Root tree or frozen evidence.
No parser, tests, probes, builds, Native/library/browser execution occurred.

## Exact original packets

- Pure schema: `78519cd6c1cdee5f00e400d69fa3cb7460747b9c`.
- Metadata: `0019894da96da89baef4b045b449270f19f5b295`.
- Prior peer review: `7c5aa6f716139b0a4333ada148e5c38b25c139c2`.
- Protected requirement facts/read: `21904c50a998e857fb0835c5609a0008de4649f9`.
- Approved Root contract: `aab4c2e0a574c589cf408869291a1a9645659373`,
  `docs/reviews/C11-LINKED-REQUIREMENTS-ROOT-CONTRACT-20261109.md`.

The current Root schema `.mjs`/`.d.mts` and publication client/Worker blobs match
those original packets exactly. No schema or metadata re-cherry is required.
The current declaration still contains the reviewed mismatch below.

## Confirmed type-only mismatch and precise vocabulary

`linkedPartDrawingDefinition.d.mts` declares Position `target:BoreReference`.
That union includes four-corner-through slots. Runtime `requirement()` instead
first calls `bore(target,datum,holes)`, which requires `kind:'through-hole'`,
then `centeredBore`, which restricts it to `holeKind:'centered-through'` and
`slot:'center'`. Thus a typed four-corner Position target is rejected by real
schema capture. The mismatch is admission fidelity, not admitted wrong geometry
or a runtime incident.

The shared `centeredBore()` helper also recognizes legacy `kind:'center-hole'`,
but that does NOT make Position accept it: `bore()` has already rejected that
record before the helper runs. Legacy CenterHole remains a supported *dimension*
reference and therefore a fit nominal through the same-definition centered
hole-diameter dimension. Read-side legacy-center-hole handling serves that
existing vocabulary; it is not authority to broaden Position's authored schema.

Approved narrow correction: export a `CenteredThroughBoreReference` type as the
existing BoreReference intersected with the exact centered-through/center
literals; use that type for Position only. Preserve BoreReference, CenterHole,
dimensions, fit, annotations, runtime capture and all unknown/unresolved states.
No runtime predicate, migration, new geometry proof or extra persisted field is
needed. This packet will not claim manufactured position/Ra/fit conformance.

## Metadata compatibility and Root splice obligations

The current client/Worker metadata leaves retain actual after/no-op/travel
counts, and zero counts on remove. V4 combined annotationCount includes actual
bore+datum+requirement lengths; datumFeatureCount/requirementCount remain actual
bounded counts and the role remains authored-manufacturing-requirement. The
same complete definition/J/native persistence path is retained. No metadata
source correction is justified by the type mismatch.

Root should apply only the follow-up declaration commit, with this BEFORE note
optional for documentation custody; do not reapply original78519cd6/0019894.
No build/hash/roster update is needed for a declaration-only change.

The independently pending full v4 composition remains the exact read handoff,
not solved by a narrower TypeScript target:

1. Craft registration/types/query mux for the two existing protected requirement
   methods, preserving exact accepted-definition and currentness guards.
2. Ledger same-owner dispatch for requirement targets/facts, correct v4 bore and
   drawingRequirementVersion gates, canonical target-kind map, actual Native
   validity/source/result bindings; metadata-only results before HLR loops.
3. SolidKernel/controller/OCI exact operation registration, token/read-mode and
   private resolver context, strict reply capture and terminal failure semantics.
4. Actual catalog capability plus complete transitive emitted-resource union,
   exact new bootstrap/OCI pins after coherent composition. Existing pairs,
   defaults, caps and all current counter/extent/blind/derived paths remain.
5. Host registration/schema/readers, the new SVG forms leaf in actual Worker and
   acceptance source custody, then the complete public v4 workflow and independent
   artifact/render qualification. Missing/unresolved refs retain authored intent;
   unknown protocol/resource/currentness/cleanup failures remain outer failures.

At reviewed Root the metadata and protected leaf work may already be composed,
but the ledger still has its older `def.version===3` bore gate and no complete
requirement dispatch. Root owns those common splices; this isolated correction
edits none of them. Definition admission alone is not a runnable v4 capability.

## Additional granted declaration seam

After Root composed leaf packet03e24bd, Root also granted only
`modules/engine/mount/ownedDrawingReadProtocol.d.mts`. Its actual `.mjs` already
exports `captureDrawingRequirementReadRequest`,
`captureDrawingRequirementTargetsRequest`,
`captureDrawingRequirementTargetsResult` and
`unresolvedDrawingRequirementTargets`, while the declaration file contains
none. Its existing DrawingReferenceObservation omits v4 datum/requirement rows.
This is a confirmed incomplete declaration surface, not missing runtime logic.

The follow-up will type those exact exports and the already-shared full/metadata
facts result: plane support/anchor/sourceAxis, datum identity, position finite
axis/frame/coordinates, finish converted maximum, fit nominal/declared limits
and clearance, each with explicit available versus unresolved-null states.
Discovery uses genuine NativeFace and existing BoreFact types. Old declarations
remain compatible; new facts contain no broad any, capability flag or conformance
claim. No runtime export, resolver, metadata summary, graph or Root common splice
is added by this declaration seam.
