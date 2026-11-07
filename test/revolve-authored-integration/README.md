# Shared authored revolve integration

Based on CAD0e83a02536776fd15397e22c072f47ba19718a90 plus timeline's explicit
experimental catalog source a9ff4ba24 (cherry-picked164760690). This bounded
slice wires existing real source/semantic adapters and common ledger into the
same normal authored history. **No full E13 qualification or native/public
app Save/Open pass is claimed by these component tests.**

Owned product files are exactly modeler/index.ts; selectedProfileBuildSelection
and selectedProfileBudget; CraftBundle, authoredEditJournal,
unconsumedSketchSave and workerRevolveCommands. Root owns SolidKernel/ledger
and desktop facade. Timeline owns catalog/factory/assets/build scripts.

Creation registers the existing selected-revolve descriptor with the actual
common evaluateWorkerSolid and checked catalog factory. Five normal core
methods are inspectWorkerRevolves, inspectWorkerRevolveRegions,
createWorkerRevolve, inspectWorkerRevolveHistory and editWorkerRevolve. Explicit
OCC_REVOLVE_PROFILE_BUILD is required; preferred/default and saved old builds
remain unchanged. The generic whole-part build includes consumed/nonvisible
revolve operations and charges one native result. Unrelated-sketch admission
retains the actual source dependency through descendants, without inventing
prism selection or hole-constructor provenance.

Saved WORKER_SELECTED_PROFILE_REVOLVE_V1.params is exactly:
`{version:1,unit:'millimeter',engine:'occ',engineRevision,featureId,faceId,
regionId,axisSegmentId,angleRadians,bodyPolicy:'separate'}`.
The region remains opaque to commands. Axis identity is an actual source
Segment discovered from the same solved source face; endpoints/frame/digests
are reconstructed in real Workers and never saved as extra authored fields.
Signed angle is a finite literal nonzero radian value with magnitude<=2pi.
Initial scope remains independent retained source plane, untyped/local-constant
source, separate measured valid native solid. Typed/project bindings and
revolve selection naming explicitly remain unsupported.

Creation uses existing operation-append chronology and atomic prepared
publication. Angle editing delegates to the same authoredFeatureOperation and
replays the complete candidate suffix, changing only angleRadians. Its other
nine fields remain immutable. Creation/discovery revisions and authored
journal/history revisions are explicitly distinct. Normal Undo/Redo retains
original feature/output IDs; existing monotonic counter high-water applies.
No alternate journal, history snapshots, native handle casts or prism substitute.

Tests: contracts.test.mjs exercises intent/identity/build/cost/source dependency
and the shared create/edit/Undo/Redo chronology, cap/branch/stale rejection.
The retained journal suites verify existing kinds remain unchanged. build.cjs
builds actual sketch and semantic production Workers plus the normal command
factory. service.test.mjs constructs source through production empty/primitive
Worker transitions, then uses genuine double-Worker discovery. Its submit
callback deliberately rejects NATIVE_NOT_RUN and its edit callback is an
explicit routing double: no accepted native output/model is synthesized.
The fixture uses actual model plane/frame classes and records those scope
limits. All owned Workers are terminated. Generated runtime stays in .build,
outside Git.

First failures are preserved: the test primitive fixture initially used an
invalid prefix, a pure assertion initially compared null-prototype capture to
an ordinary object, and actual command discovery exposed mutable returned axis
arrays/endpoints. The latter was fixed in the owned command file; no geometry
or admission was weakened. Final evidence records exact source/build hashes.

Native persistence trace: projectValidationCore.preflight validates the normal
envelope and native sketches without a feature-type allowlist. Project envelope
capture retains raw history. On restore, materializeParams uses the registered
ten-field descriptor and its real run/evaluator, so the same build/source/axis
checks apply. No format/schema migration or validation exception was added.
This source trace must still be qualified through genuine Save/Open.

Next actual combined app qualification, after root supplies frozen runtime:
publicly author radial rectangle [2,4]mm by axial [0,5]mm with actual source
Segment at x=0. Full-angle volume60*pi mm^3; half/negative-half volume30*pi
mm^3 with independently expected angular support. Use volume tolerance1e-6
mm^3/bounds1e-7mm for this small analytic fixture; retain declared provider
measurement quality. Exercise creation/angle/source-axis/source-profile replay,
normal mixed Undo/Redo and original IDs; old-build/invalid-angle/stale/lifetime
refusal preservation; one transaction/candidate ownership and cancellation;
normal Save/server sync/fresh Open/reedit with exact ten-field intent and raw
source. Compatible children keep unchanged intent/IDs; incompatible children
must reject atomically. No silent retargeting, fallback or full E13 claim.
