# CAD-VIEW-01: explicit current-solid fit

Source-only implementation and full-workflow assertions from Core8908fb8 and
Desktop7c2b85f48. No tests, TSC, build, browser, Native execution or probes run.
Historical E15 receipt/artifacts/screenshots/oracle remain unchanged. Root owns
normal composition and the next complete real application workflow.

## Evidence and scope

E15 `test/loft-creation-public-workflow/evidence-r1/receipt.json` row76 reports
available1252/1252 display triangles, Native bounds approximately
[-50,-25,0]→[65,25,35]. Its retained normal screenshot shows a tiny part among
large source planes. Producingb097 and current source share the camera/render
paths: perspective60degrees at[-1000,300,1000]; publication requests rendering
without fitting; source-plane display is minimum750+50mm. No actual camera
matrix was captured there. This is evidence of a missing fit policy, not proof
that source planes automatically sized the camera or that display pixels certify
Native geometry. The existing unused lookAtObject helper is not used or repaired.

## Shared operation

`craft.fitWorkerSolids({revision,bodyIds},{signal?,valid?})` and public command
`fit-worker-solids` accept exactly1–32 dense unique actual current output IDs
from `inspect-worker-solids`. No caller bounds, camera coordinates, mesh or
Native handles. The new existing-Views-menu action `Fit solids` discovers the
same actual displayed outputs and invokes that exact Craft operation.

The service authenticates current MWorkerSolid membership, producer, exact
frozen metrics/display records, model-local Native bounds and actual affine
placement. It checks source/document generation, current model/history/epoch,
manager/viewer identities and external lifetime, then rechecks actual inspection
revision and model/placement records before touching the camera. It only reads
bounded headers and transforms at most256 corners. No mesh sweep/copy, new
Native evaluation, provider/build/default change or alternate geometry model.
Unqualified/unavailable display or absent Native bounds refuses truthfully.

Camera-only changes fit the Native world AABB's bounding sphere with fixed1.15
presentation margin. Perspective uses actual zoom-adjusted FOV and current
viewport aspect. Orthographic uses current viewport/frustum dimensions and
updates zoom. Both preserve mode, view direction and up, center the controls on
the body bounds, retain/expand existing clipping range where necessary, and
request rendering. An active gesture refuses; fitting clears only queued old
control deltas so a later frame cannot undo the requested presentation. Existing
pan/rotate/zoom remains usable. No automatic fit on publication/edit/Open.

Only camera/control/render state changes. No authored bytes/units/frame/IDs,
models, source/history/J/redo, counters, revisions, physical/material/drawing
metadata, dirty baseline, association, file bytes or persistence writes. The
receipt states `authoredChanged:false`, unchanged inspected revision, actual
body IDs and `boundsSource:'accepted-native-bounds'`; it is not a new Native or
dimensional certification.

Typed refusals: INVALID_REQUEST for malformed selection/options; CANCELLED for
explicit cancellation/invalid external lifetime; STALE_DOCUMENT for changed
captured document/revision/model; UNAVAILABLE for busy/restoring/cleanup failure,
nonempty/display/native-bound/viewport/projection limitations;
VIEW_INTERACTION_ACTIVE for an in-progress camera gesture. All precede camera
assignments; no generic/message-based error relabeling.

## One complete E15 acceptance sequence

The CURRENT `loft-creation-public-workflow/desktop-driver.mjs` incorporates the
new `fit-workflow.mjs` into its frozen source inventory and existing full genuine
creation/edit/refusal/travel/three .cad Save/server/freshOpen/reedit sequence.
It does not replace or rerun a source-era packet here.

After real creation UndoRedo, explicitly fit perspective; use the actual existing
camera-mode toolbar control, fit orthographic, and toggle/fit perspective again.
After EACH of the three real fresh .cad Opens, fit once more. All six fit calls
require exact accepted-state/token/resource equality, preserve direction/up,
retain actual available display metadata and project all actual Native bound
corners through the observed real camera matrices. For this ordinary loft the
bounds must occupy at least35% of one viewport dimension without clipping.
Capture actual canvas PNGs; retain the final whole-desktop screenshot after fit.
No fake camera/geometry/seed/source authoring or fixed sleeps/retries are added.

Existing full geometry/source/Native250point/ZIP/.cad oracle and all original
criteria remain mandatory. AFTER the complete application run, `check.py` here
independently projects actual saved camera matrices and Native bounds using
plain Python, verifies six readonly fit snapshots and PNG custody. Its1e-9 NDC
roundoff allowance and1e-12 direction comparison are presentation checks, not
millimeter/50pm geometry certification. Root must inspect the actual screenshots
for people-readable shaded geometry; visible AABB and PNG existence alone are
not a pixel-level surface/material proof. Actual trusted Views-menu fit gesture
may be recorded in the final G10 combined workflow; source registration already
uses the same shared operation, with no human authoring/UI redesign.

Scope remains current displayed Worker solids under existing ready inspection,
maximum32 chosen outputs; empty/unavailable outputs and source-only fitting are
not invented. Final beta/G10 delivery is not claimed by source readiness.
