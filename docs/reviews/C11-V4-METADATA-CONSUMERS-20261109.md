# C11 v4 metadata consumer source inventory

Source-only continuation of pure schema78519cd, from Rootaab4c2e. No parser,
test, probe, build, Native or browser execution. Complete backend/render closure
is still required; these metadata changes do not enable Native requirements.

## This lane's exact seams

- `manufacturingPublicationWorker.mjs` retains old summaries for v1/v2 and the
  old bore annotationCount for v3. V4 reports COMBINED annotationCount plus
  datumFeatureCount, requirementCount and literal
  requirementRole=`authored-manufacturing-requirement`; remove reports zeros,
  not a missing-array fallback. Definition remains one existing preparation
  payload, not a second synchronized set of counts/state.
- `manufacturingPublicationClient.mjs` captures the exact conditional v4
  summary shape/bounds, then independently recomputes counts from the actual
  admitted after/travel/no-op definition before issuing the private preparation.
  Missing arrays cannot become empty success. Existing before/after, IDs,
  byte-size, J, currentness/cancellation and cleanup behavior is unchanged.
- PM `inspectLinkedPartDrawing` advertises v4 SCHEMA admission and a detached
  requirementSchema describing3 symbols/3 kinds/max3 records/one-per-kind/
  combined16 and authored role. Existing limits stay unchanged. Its existing
  quality remains `authored-definition-only`; it makes no Native capability,
  reference resolution or manufacturing-conformance assertion.
- `projectEnvelope.mjs` already calls the authoritative definition capture on
  encode AND decode. Its outer drawing-bearing envelope remains version3 with
  exactly ONE captured definition; v4 here is the INNER definition, not a new
  archive/envelope format. No envelope source edit is needed or proposed.
- `nativeArchiveCodec.worker.ts` encode/decode both call that same envelope,
  normal model preflight and manufacturing checks; drawings are the existing
  single `authored/drawings.json` role. The metadata/source bridge serializes
  the whole captured definition, not a v3 field projection. No archive owner,
  ZIP/lease/CAS/Files or Native Open-adoption body is modified.
- Existing `authoredEditJournal.mjs` metadata-domain capture calls the shared
  complete definition/operation record and retains its bounded UTF8/UTF16 charge.
  New arrays/units/refs therefore travel in one existing event without a new
  kind, source edit, resource owner, counter or second history. No J source
  change is needed.

## Owned by Gate / Root, not silently handled here

| Owner | Concrete version/transport splice to reconcile |
| --- | --- |
| Gate | `drawingReferenceFacts.mjs` v3-only annotation mapping and final observation must retain bore annotations in v4 AND add exact current datum/requirement facts. `ownedDrawingReadProtocol.mjs` v3-only exact keys, bore capture, aggregate completeness and unresolved construction must extend coherently. New ordered read arrays require real typed resolution, never `||[]`. |
| Gate | `ownedDrawingDerivedProtocol.mjs` currently requires definition.version===3, so v4 with its already-supported section/detail roles otherwise fails. Widen this EXACT definition-role condition to include4 while keeping every frame/parent/view and resource guard. Current shared read command also has v3-only bore/read guards. |
| Root | `solidLedger.mjs:readCandidateWorkerDrawingOrBores` has v3-only bore capability admission. Preserve that guard for4 and require actual new requirement read capability for4 as appropriate; do not label metadata admission a measured result. Add actual bounded requirement-target discovery route and exact owner/target/result checks. |
| Root | Controller/OCI/SolidKernel/catalog need the agreed protected read/discovery DTOs and actual new feature admission. Existing ports/pairs/defaults are sufficient ingredients, not automatic activation. No arbitrary digest or caller trust flag is proposed. |
| Root | New Gate Worker modules must enter ALL affected real closed source lists, with common bootstrap consumers repinned together after coherent composition. Current references include manufacturing/shell/circular entries+preparations, catalogMount and ownedMechanicalNativeResources. This lane makes no complete emitted-graph claim. |
| Dxf | Actual Host schema/read adapter/example/whole/oracle must use pure78519cd + final Gate DTO and the eventual exact SVG grammar. One-per-kind/max3/combined16 and unrelated OWN source controls are finite domain/refusal cases; no16-position-row promise or cross-account probe. |

Renderer is deliberately pending the agreed protected fact DTO. Its current
v3-only annotationFacts metadata emission must retain those facts in4 and add
new authored-requirement/geometry-binding roles explicitly. New visible datum,
position/Ra/declared-fit forms must consume actual resolved anchors and keep
all current geometry/caption/warning/read-only/settlement criteria. Source
admission alone is not a complete or qualified v4 feature.
