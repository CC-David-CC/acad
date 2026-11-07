# Two-source shared sweep operation — bounded checkpoint

Own product: only NEW
modules/workbenches/modeler/features/workerSelectedSweep/workerSelectedSweep.operation.ts.
Base45e0fc67d plus root ledger/evaluation dependency a9e0c2933 (local cherry5ec21ec83).
No registration, catalog/default, controller, ledger, authored journal, public
command, native kernel, UI, asset pipeline, Save/Open or deployment edits.

Factory: createWorkerSelectedSweepOperation({evaluate,buildPolicy}), where the
real root policy supplies requireBuild(engine,revision) and historyBuild(history).
The operation requires explicit exact OCC sweepVersion1 and one whole-part build.
Saved schema is exactly the existing eleven-field capture: version/unit/engine/
engineRevision/featureId/faceId/regionId/pathFaceId/pathCurves/transport/bodyPolicy.
Path references are ordered actual curveId/reversed pairs. Frames, digests,
coordinates, native handles and result geometry are ephemeral, never history.

The first supported slice uses two distinct current MOpenFaceShell source
planes, strict current isPlaneBased===true, independent empty model boundaries,
and native untyped local source without project/external bindings. It captures
both raw strings/frames/boundaries, namespace+version membership, document
generation, history/epoch, service identities and physical table/stream custody
before any wait. Both sources solve twice in real dedicated sketch Workers;
source/digest/evidence must match. Two real prepare-sweep semantic jobs use one
shared revision and both exact solved digests/frames. The operation corroborates
actual selected Segment/Arc data/order/direction against the genuine solved
path inventory without planning geometry, choosing arc branches, welding,
hashing or constructing native geometry on the main thread. Source membership
and native geometry remain different authorities.

Shared real evaluator call:
{owner,kind:'sweep',request:captureOwnedSweepEvaluation({version,unit,engine,
engineRevision,featureId,sweep:preparedRequest}),sourceBinding:{featureId,faceId,
regionId,pathFaceId,pathCurves},registry,createModel,valid}. Root's ledger owns
native mount/capability/operand custody and checks both source bindings.
Return requires one actual measured valid positive-volume MWorkerSolid on the
recorded backend, consumed:[], retaining both planes. The publication hook
rechecks all source/runtime/measurement predicates. In-flight failures close
only the captured candidate; a replaced newer owner is untouched. Worker
clients terminate their jobs; failed cleanup is explicit. Pre-admission refusals
allocate no operation Worker/native work; outer pipeline retains its scope
cleanup authority. One30sdeadline; source cap64KiB each, semantic response cap
256KiB, bounded tree admission. No arbitrary project-sized main-thread copying.

Tests build actual production sketch/semantic Workers and operation TS. Source
is created using actual production empty/primitive Worker transitions, including
real Circle, Segment and Arc. Region discovery comes from the existing depth-free
semantic inspection; no raw source/model seed or dummy extrusion is supplied.
Actual plane/frame classes are used. Injected build policy is an explicit
routing fixture, not a claim of registered native capability. Injected evaluator
always refuses NATIVE_NOT_RUN or returns an invalid null model for rejection.
No successful native output/model is synthesized, and no native/app acceptance
is claimed. Four real solves and two semantic preparations must reach that
refusal boundary with the exact captured envelope.

Controls cover exact fields/getters, old/mismatched policy/typed refusal, both
planes' initial and pending identity/flag/frame/source, document/history/table/
service loss, cancellation, replaced newer owner, altered real semantic reply
geometry/identity/direction, disagreement between real solves, post-evaluator
source mutation and invalid null result. Publication success/native validity,
real timeout/native resource release, browser/native app Save/Open and E14
remain unqualified until root integrates a qualified actual native build.

First failures retained: TypeScript Object.hasOwn required a newer lib than
this ES2018 application (changed to existing hasOwnProperty.call convention);
first service run tried direct assignment to getter-only defaultSketchId
(test fixture correction via explicit property override, no product relaxation).

Final source/protocol result:13/13 operation groups,59 retained tests, TypeScript
exit0;153 actual Workers started and terminated. The additional real-source
Circle control found a classification defect: a current unsupported primitive
was reported stale. Before TAP/build pins are retained against1b494. Followup
56de distinguishes SWEEP_UNSUPPORTED_PATH for that existing Circle from
STALE_PATH for an absent ID, with unsupported stage/role explicit. No admission
or geometry requirement changed. Final sources and compiled outputs match
recorded hashes. All native-success/publication/app claims remain pending.
