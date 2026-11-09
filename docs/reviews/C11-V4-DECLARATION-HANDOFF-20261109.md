# C11 v4 declaration-only correction handoff

SOURCE ONLY / UNRUN, based on Root leaf composition
`03e24bdd26c56f42d2e018ccb2c1e6a04c7c7f33`. BEFORE is recorded separately in
`C11-POSITION-TARGET-DECLARATION-BEFORE-20261109.md`. No runtime/metadata body,
Root/common graph, Native port/pair/default, geometry tolerance, frozen driver
or evidence was changed. No parser, tests, TSC, build, Native or browser ran.

## Exact changes

1. `linkedPartDrawingDefinition.d.mts` exports
   `CenteredThroughBoreReference` and uses it only for Position. The actual
   schema requires through-hole/centered-through/center; it does not admit
   legacy CenterHole or four-corner Position targets. Legacy centered diameter
   remains valid for the fit nominal dimension. Runtime capture is unchanged.
2. `ownedDrawingReadProtocol.d.mts` declares the four already-existing runtime
   exports: `captureDrawingRequirementReadRequest`,
   `captureDrawingRequirementTargetsRequest`,
   `captureDrawingRequirementTargetsResult` and
   `unresolvedDrawingRequirementTargets`.
3. Exact exported metadata-only discovery type is
   `DrawingRequirementTargetsObservation`, as requested by Root ledger. Actual
   NativeFace selectors/source roles, source frame, existing BoreFact rows and
   available/unresolved plane rows retain their actual field names and quality.
   Overall available requires a frame and available rows; overall unresolved
   permits partial derived rows and the runtime's nullable aggregate reason.
4. `DrawingReferenceObservation` gains optional datum/requirement arrays for
   old1–3 compatibility. New row types use discriminated status/quality/facts
   unions: unresolved has null facts and no ghost nominal/axis value. Position,
   Ra and fit facts have their exact captured numerical/vector/interval fields;
   none has broad any or a conformance flag. A=z/B=x/C=y is explicit for available
   datum facts. Finish planes can retain sourceAxis:null in discovery.
5. `DrawingRequirementDefinition` refines v4 with its mandatory three arrays.
   `DrawingRequirementReadObservation` is a refinement of the SAME existing
   DrawingReferenceObservation, with required v4 arrays. Overloads on the actual
   `captureDrawingReadResult`/`unresolvedDrawingRead` retain the existing broad
   signatures. No new runtime result resolver was invented; Root may continue
   using DrawingReferenceObservation for full/metadata-only facts results.

Existing old annotation and generic data utility declarations remain as before;
this packet does not claim to remove their historical broad types. All NEW
requirement/plane/discovery facts are explicit. Bounds and exact ownership/math
remain runtime checks, not encoded availability grants.

## Integration order and obligations

Apply the BEFORE doc commit if desired, then the single two-declaration/handoff
commit. The original schema78519cd6 and metadata0019894 are already in Root03e;
do not duplicate them. Root SolidKernel can use DrawingRequirementDefinition
for the distinct requirement-read op, or its existing validated v4 intersection,
and import DrawingRequirementTargetsObservation for discovery. No new JS asset,
resource roster, bootstrap hash or runtime flag follows from declaration changes.

Root retains all common Craft/ledger/controller/OCI/SolidKernel/catalog/closed
resource and pin splices described in the original read handoff21904c50. In
particular retain accepted manager-definition binding, actual current source /
Native membership/validity, complete canonical target-kind map, derived-view
v3/v4 guards, exact read-mode/token policy and metadata-only return before HLR.
Only after complete source closure should a cohort advertise
`drawingRequirementVersion:1`. One-per-kind/max3/combined16 and the single
metadata/J/native definition persist unchanged. Real reference/domain loss is
unresolved intent; unknown protocol/resource/currentness/cleanup errors remain
outer failures. Root owns the full public/native/archive/SVG whole qualification.
