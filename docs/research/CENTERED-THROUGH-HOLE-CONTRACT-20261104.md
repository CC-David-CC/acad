# Dependent centered through-hole: bounded next contract

This is the design and acceptance checklist. The centered-hole candidate is implemented and registered in source; current qualification is recorded below. It is not a released runtime or an assertion that general sketch-on-solid, Boolean, persistent naming, or Native Mesh holes work. The existing `WORKER_RECTANGLE_EXTRUDE_V1` creates a solid from one explicitly selected authored region. Adding an inner loop to that *same initial sketch* would instead change the input profile and is not this acceptance. Here the original rectangle/extrusion remains one authored feature, followed by a separate dependent through-hole feature that must regenerate when its parent changes.

## Existing boundaries and the first useful operation

- The current history replay evaluates privately, owns candidate mounts through `engineEvaluation`, checks document/host lifetime and publishes model/history/registry together. It keeps the last complete accepted result on a failed replay. The current rectangle adapter validates the authored sketch by the real isolated solver, uses a live OCC mount, and projects a validated planar prism. No native pointer or handle belongs in a native project snapshot.
- The current projected prism has structured feature-scoped BASE, LID and SWEEP face roles derived from the full authored region/segment IDs. A response-local face ordinal, geometric sort order, rounded coordinate, kernel address or mount handle is **not** a persistent reference. The source region ID includes the full authored boundary set. Connector and vertex IDs remain transient.
- `cadRegistryBundle.ts` currently rejects any sketch data on worker-owned faces, `assertLegacyOperationInputs` rejects their use by legacy pointer consumers, and the existing `HOLE_TOOL` creates a legacy tool body rather than a qualified cut of this worker-owned prism. Those safeguards must remain until their exact replacement paths are qualified.
- The OCC mount's current Boolean accepts same-mount handles and returns limited summary evidence. It does not return validated cylindrical face/inner-loop topology or cut ancestry. `profile-topology.mjs`, `readPortablePrism`, and `rectanglePrismProjection` are expressly restricted to the six-plane, single-loop prism; applying them to a drilled block would be wrong. The candidate owner now has the private model/source/mount ledger integrated at c55bce60. Its bindings are trusted adapter invariants, not authentication against hostile same-realm code; worker-side source validation remains required.

The smallest candidate is a separate, explicitly versioned history operation, tentatively `WORKER_CENTERED_THROUGH_HOLE_V1`. Its persisted **intent** should contain the new feature ID, the parent extrusion feature/body semantic key, the exact selected LID semantic key including the authored source region ID, diameter (or a safe existing expression resolving to a finite positive millimeter value), and an explicit relation `rectangle-center` plus `through-all`. It contains no stored computed center, process-local token, topology ordinal, URL or cached solid. Resolve and collision-check the keys under the existing native reference limits. The parent and target must agree with the current candidate registry and source feature; a missing, duplicate, replaced, changed-type or ambiguous target is a repairable refusal, never a search for a convenient face.

`rectangle-center` is an authored geometric relationship, not a claim that a circular sketch constraint has been created. For the initial supported slice, derive the center from the **current re-solved source rectangle and its verified LID frame** inside the data-only pipeline, and verify it is equidistant from each pair of opposite supporting lines. Require a unique supported rectangle and face-basis provenance; do not infer intent from coordinates initially placed at the center. The existing v2 profile can preserve tiny unsnapped deviations: before implementation, specify and test the numerical rectangle/centering tolerance and how a unique center is determined; do not silently snap vertices or treat a trapezoid as an ideal rectangle. The circular section must be strictly inside the finite face with a documented clearance greater than numerical tolerances. Zero, nonfinite, too-large/touching, out-of-face, degenerate or ambiguous cases refuse before publication. Preserve original source geometry and constrain the through direction to the proven normal and positive parent extrusion. No partial-depth, inclined/offset hole, pattern, countersink or arbitrary loop is included.

If the desired interaction instead requires an actual user-authored circle sketch on the generated face, that is an additional deliverable: it needs an explicit planar-face sketch/storage transaction, solver-backed circle and centering relations (the existing diagonal `PointOnLine` and radius equations can express this for supported straight boundaries), a current finite-face containment check, and an independently qualified sketch-on-worker-face registry/lifecycle. A computed center property must not be represented as that sketch or as editable sketch constraints. The independent feature above is a useful narrower operation; its UI and programmatic command must call the same validated operation when either is added.

## Worker, topology and publication requirements

1. Add a bounded evaluation-local association from the exact projected candidate body and semantic source binding to its owning mount/handle and captured solved parent profile. It must not use mutable global names or let an accepted body's handle become a candidate input by accident. Each replay creates its own parent prism and hole result within the same candidate owner/mount. Recheck source bytes/digest, expression/history revisions, selected face/region, service/document generation and host/account/window lifetime after every await and immediately before publication. The association is nonpersistent and invalid after abort, worker death, disposal or a different mount/generation. The current three-owner/one-mount-per-owner and eight-publication-check budgets need explicit admission tests; do not silently raise them.
2. Add a versioned worker-owned cylindrical through-cut operation. It must use the captured authored parent relationship and actual current solid, construct a real bounded circular cutter, and execute an OCC subtraction within the same mount. Reset/validate Boolean session state and fresh output; check actual command semantics, return codes and null/empty results, and never accept a previous named result. A logical handle alone is not proof of native cleanup. Keep the earlier accepted owner alive while the candidate runs; terminate a failed/stale candidate and all its temporary objects via its owner. Cancellation must not publish a late success.
3. Add a distinct, bounded portable **drilled-solid** topology/evidence contract and strict worker-side reader. It must describe actual planar support faces with circular inner loops, the cylindrical wall and oriented circle/edge/coedge incidence, including any actual periodic seam representation. Validate finite analytic plane/cylinder/circle data, loop orientation, shared incidence, closedness, bounded tessellation and source ancestry. The present 8/12/6 planar-prism count and reader must not be stretched to fit. Do not fabricate missing twins, substitute a null surface, turn a circle into an undocumented polygon, or label a triangulated approximation an exact BRep validity proof. If the pinned runtime cannot establish a needed analytic value, kernel history, or BRep validity, return an explicit capability/validation failure and record the limit.
4. Establish cut ancestry with actual kernel history plus checked unique matches. Where a parent face survives, bind its semantic role to a uniquely verified descendant; qualify any changed LID/BASE inner loops and define a distinct feature-scoped cylindrical-wall role and circular-rim roles only if unambiguous. Publish no persistent connector/vertex/seam identity until independently qualified. A split/merged/deleted/ambiguous parent face must fail or require repair rather than rebind by ordinal or nearest coordinate. Check body, faces and durable edge IDs for collisions and the native 1,024-character reference limit before registry publication. Geometry, topology and semantic validation remain distinct checks.
5. Assemble the bounded, validated JS model without native pointers on the UI, then commit candidate model/history/registry and its owner atomically using existing craft publication. Later legacy Boolean, fillet, STEP/3MF and sketch consumers remain explicitly gated until individually adapted. Save only authored operations/references and the existing millimeter envelope; reopening or undo/redo must recreate the engine result and resolve the same semantic intent. A failed edit must leave the previous accepted model and history coherent or an explicitly stale failed authored revision with its last-complete solid; it must not show a partial cut as current.

## Independent acceptance oracles

The following are acceptance targets, not currently passed evidence:

- [ ] In an actual browser Worker, create an authored XY rectangle at (0,0), 100×50 mm, extrude 20 mm, then add a **separate** 10 mm diameter `rectangle-center`, `through-all` feature. Verify history contains both features and the hole has one explicit center relationship, not only a coincident initial coordinate.
- [ ] Independently measure a center at (50,25), radius 5, unchanged outer bounds and material volume `100×50×20 − π×5²×20 = 100000 − 500π mm³`. Verify an actual through opening across both support planes, one solid, circular analytic boundaries/cylindrical wall and oriented closed incidence. Use rays or sections away from the exact boundary and, where available, an independently checked kernel volume. A faceted tessellation's volume may approximate π: define and report its quality/error separately rather than silently loosening an analytic check.
- [ ] Substantially edit the **original** rectangle to 150×30 mm and parent depth to 35 mm. The same hole intent must regenerate to (75,15), still diameter 10 and through both faces; expected volume is `150×30×35 − π×5²×35 = 157500 − 875π mm³`. Check old off-center positions are filled as appropriate, current center is open, and outer dimensions and source semantic relationships are correct. Also edit diameter and one dimension independently.
- [ ] With diameter too large or touching an edge, zero/nonfinite depth or diameter, missing/duplicate/stale source region, changed/rotated frame without qualified provenance, split face, wrong engine/mount, invalid topology, forced kernel no-op, worker death, timeout, account/window closure, and an intentionally contradictory solve, require typed failure and no silently accepted stale/partial solid. Test last-valid geometry, history, registry, sketch bytes and worker ownership, then repair to valid input and replay.
- [ ] Test undo/redo across both features, parent dimension/depth changes, native save/reopen in a fresh session, and stable supported semantic face references. Verify a new session uses new worker handles and rejects old handles. Test an actual visible operation and the programmatic path through the *same* validated operation once implemented; account-scoped signed My files save/reopen is a separate integration test.
- [ ] Verify supported numerical solver residuals independently and preserve accepted/redundant intent; supporting-line constraints alone do not prove finite-face inclusion, through-depth, solid closure or manufacturing validity. Test ambiguous topology, duplicate IDs, malformed/sparse data, response byte limits and registry collisions separately from solver and kernel failures.

## Minimal implementation packages and engine scope

1. **Ownership and input contract:** private candidate model/handle/source association and narrow feature schema; negative stale/cross-mount/duplicate-key and source-intent tests. Shared craft ownership and history interfaces require lead review.
2. **Worker cut and analytic output:** bounded same-mount cylinder/subtract, fresh-output/session checks, versioned analytic drilled topology, independent geometry and failure tests under the existing restrictive CSP. No UI, history publication or generic kernel abstraction in this package.
3. **Validated projection and replay:** strict reader/provenance for only this solid, semantic IDs and atomic publication integrated with the existing owner and registry; edit, failure/repair, undo and reopen controls.
4. **One shared interaction:** a narrowly scoped visible action and authorized command using the same operation, then real signed parent/My files acceptance. Keep unrelated consumers gated.

OCC is the preferred engine for this slice. Native Mesh/Manifold remains available for its already qualified operations, but its existing mesh Boolean capability does not establish an analytic cylindrical hole, stable BREP references, matching constraints or this result contract. A Native Mesh target and OCC/mesh cross-engine operand must explicitly report unsupported until independently designed and tested; there is no silent conversion or promise of engine parity.

## Current implementation queue

The preceding end-to-end checkboxes remain open. Completed component work does
not satisfy a history, persistence or manufacturing oracle by itself.

| Package | State | Evidence and next handoff |
| --- | --- | --- |
| Candidate-owned source association | Integrated, scoped tests pass | c55bce60: 12 independent unit checks and two actual Chromium/OCC suites under strict CSP; source/profile snapshot, model mutation, owner/mount, abort and accepted-owner refusal. See ASSOCIATION-INTEGRATION-20261104.md. |
| Native cylindrical subtraction and analytic evidence | Active, storage_server | A research query reports a valid one-solid cut with 7 faces, 15 edge groups and 10 vertices. Complete bounded source binding, native analytic frames, ancestry and failure tests before acceptance. |
| Circular-loop and cylindrical model projection | Active, storage_browser | Agree the portable response with the worker owner. Existing polygon-of-start-vertices orientation cannot classify a single-edge full-circle loop; use and test analytic curve orientation. A periodic seam appears twice on the cylindrical face and must not be rejected merely for same-face incidence. |
| Independent cut/response review | Active, storage_review | Review actual geometry, source binding, fresh-result checks, lifetime and evidence limits independently of the implementation lanes. |
| Atomic history/publication and shared operation | Queued, integration lead | Consume the qualified worker/projection contracts; replay both features and then run substantial parent edits, rejection/repair, undo/redo and native/signed My files reopen. |

The research cut observation is not a qualified runtime, deployed hole command,
persistent ancestry result or completed plate. Preserve the two separate
representations: analytic CAD geometry and derived display triangles. No native
address, result-local ordinal or process handle may become an authored reference.

### Independent planner finding — corrected pure planner

Root exercised the uncommitted centered-hole planner against vertices
`[[0,0,0],[100,0,0],[100,50,0],[4e-7,50,0]]`, positive Z direction, depth 20
and diameter 10. The planner accepts this unsnapped boundary within its current
classification tolerances. Its adjacent-edge-product volume is
98429.2036732051 mm³; the authored polygon area minus the circular area gives
98429.20347320511 mm³, a difference of approximately 0.0002 mm³.
The worker owner and independent reviewer have this exact regression input.
Use translated signed polygon area, preserving actual coordinates and separate
classification/analytic/tessellation tolerances. Do not silently idealize the
profile or widen a volume threshold to conceal the discrepancy. This finding
concerns the unintegrated planner, not the currently deployed Files service or
the already-corrected prism volume path.

Root integrated the pure planner with translated signed polygon area, captured
data-only request fields and a frozen returned center. Four focused tests pass,
including the exact unsnapped regression, substantial dimensions/depth, refusal
cases and unexpected symbol/non-enumerable/accessor fields without getter
execution. The worker-owned parent profile remains a trusted validated input.
This corrects planning arithmetic; actual native subtraction, ancestry, model
publication and history are still separate unfinished qualification.

### Candidate cut handoff and reference capture

The integration branch now includes `centeredHoleIntentFromLid`, which decodes
only a canonical authored LID reference and produces explicit centered,
through-all intent. It does not authenticate a current model or store computed
coordinates. The candidate ledger adds `executeCenteredHole` using the agreed
mount `centeredThroughHole` / `assertCenteredHoleBinding` interface. Handles stay
inside the ledger; the projection adapter receives detached bounded evidence,
immutable parent topology/source intent, and synchronous publication guards.
It refuses overlapping cuts of one parent and closes a failed candidate after
a dispatched native operation. The currently installed mount does not yet
provide this interface, so no new operation is registered or enabled by this
component change.

Root ran 18 focused intent/ledger tests using the real evaluation owner and a
controlled mount test double. They cover serialization, invalid selection,
private handles, publication recursion, post-await source mutation/cancellation,
wrong result binding, overlapping requests and disposal. Independent review
found a guard becoming stale during the final synchronous binding check; a
second guard check and a targeted failing-then-passing regression address it.
These tests do not substitute for the pending actual-worker integration.

Native source checkpoint `16c59dbf` has an independently reproduced nominal
BOX-cut control, but a disjoint tool is a successful generic no-op. The worker
must reject that as a hole and terminate the unpublished candidate. The native
512 KiB serialization limit is not a peak-memory bound. Authored-worker controls
for the initial and changed rectangle are now reported by the worker owner;
complete live mount binding, projection ancestry, history and persistence remain
open before the operation can be enabled.

### History integration preparation and independent geometry checks

The unregistered `createWorkerCenteredHoleOperation` now admits the exact
candidate LID, invokes the checked adapter, registers the synchronous
publication guard itself and consumes the exact parent. Other descriptors keep
the existing legacy representation gate. The integration fixture compiles;
actual cut history is still unqualified. See `test/engine-hole-history/README.md`.

Root inspected immutable authored-worker fixtures at projection `5175ce16`:
100×50×20 and 150×30×35 at origin [10000,20000,7] pass outer bounds, moved rim
centers, both support-plane openings, analytic volume and oriented incidence.
`inspectCutControl(topology,{width,height,depth,origin})` is the reusable oracle.
An initial probe found one case in the agent's mutable temporary results file;
the repeatable inspection instead uses the committed two-case fixture.
Oversized input is recorded as `refused`, not a native execution error.
These checks do not establish ancestry or live publication.

Independent Chromium/OCC regression on `0465f861` passed all 14 projected-model
mutation refusals and real prism ownership. The first fixture used the wrong
blob-import worker under strict CSP and failed closed; the documented pinned
embedded-worker rerun passed. This qualifies the parent ledger regression,
not the new hole. Native parent-index correspondence and cutter wall/rim
history are being qualified before persistent hole references are assigned.

### Connected candidate source — e346c012

The worker/mount checkpoint is integrated as `ddd95ed3`; the checked projection
adapter and immutable geometry invariants are integrated through `d331fb9a`.
The modeler now registers the shared centered-hole history factory at `e346c012`.
Earlier entries saying it is unregistered describe their original checkpoints.
This is source registration, not a deployment or completed history acceptance.
The default packaged native runtime still lacks the cut capability and refuses
it; actual-app tests use an explicitly pinned research runtime while the clean
native build runs independently on R730.

Twenty-four focused intent, ledger, role and section checks pass on the combined
source. The new section oracle traces rays through the retained authored meshes:
the current center is open through both support planes; adjacent material has
two intersections; a transverse ray has four wall intersections; and the old
center lies in material after the resized model. A deliberately inserted closing
triangle fails even though native-volume metadata is unchanged. This is mesh
geometry evidence for two fixtures, not a claim of history-driven regeneration.

Independent review also passed the eight worker plan/topology checks and three
actual strict-CSP worker suites on `bf1f0914`, with its pinned incremental runtime.
The actual-app parent edit/reject/repair/undo/reopen test is now the next serial
integration gate. Signed My files, visible selection and broader plate features
remain separate acceptance requirements.

### Integrated actual-app evidence — 4ad0e4cd

- [x] Source history registration and actual app parent rectangle/depth edits,
  undo/redo and native reopen: c2555432 and HISTORY-EVIDENCE.md.
- [x] Existing diameter10→8 edit, independent mesh section rays and fresh native
  reopen; touching/oversized rejection preserves the deliberately rewound
  parent state and repairs by replay: d6583175. This does not claim the drilled
  tip stays displayed during the history-edit rewind.
- [x] Host abort after real cut dispatch terminates the observed Worker, drains
  processing, preserves prior history/model and publishes no hole: 4ad0e4cd.
  Not proof of interrupting inside native execution or a window-manager close.
- [x] Independent real-browser review of prism/drilled metadata replacement
  fixes integrated at cb7c43bb. These are internal consistency invariants.
- [x] Signed My files save, browser/server byte agreement, fresh authenticated
  reopen, bounds/rims/history and second-account denial: desktop e6ba5a829,
  docs/evidence/cad-centered-hole-signed-20261104.json. Research runtime only.
- [ ] Fix actual viewport/sketch observers calling unsupported generic surface
  inference on the analytic cylinder. Signed test exposed this defect despite
  successful file persistence. Do not claim complete display integration.
- [ ] Rebuild full app with precompiled Manifold flag as well as numeric flag;
  its omission caused strict-CSP secondary-engine initialization refusal.
- [ ] Qualify clean-built native artifact and complete runtime closure, then
  repeat changed integration paths and package/deploy through managed tooling.

The broader acceptance targets above stay open where they combine unqualified
conditions. No completed full plate, arbitrary profiles or engine parity claim.
