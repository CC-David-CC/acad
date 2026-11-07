# Enclosure authored integration boundary

Next implementation contract; not a completed feature.

## Integration checkpoint — 2026-11-04

The integration branch now includes the OCC enclosure construction contract,
bounded preview-mesh reads (168ff539), and visual-only BODY/LID model classes.
Root review reran the three mesh/capability tests successfully. The mesh reader
checks finite coordinates, triangle count, winding/volume and bounds, retains
private handle associations, and returns detached copies. This is display
geometry, not a qualified manufacturing tessellation. Authored operation,
history, and normal My files acceptance below remain unfinished; the existence
of engine and display components does not check off those workflows.

The diameter feature is integrated separately through 02afdd70. Root rebuilt
and reran all seven mechanical/headless diameter tests successfully. Its
Chromium evidence is recorded in test/mechanical/DIAMETER-EVIDENCE.md; desktop
command bridging and a newly deployed application are not claimed.

Use one versioned authored operation with millimeter width, length, height,
wall, clearance, lid thickness and lip depth. Save inputs and stable feature ID,
never native handles. Both engines expose their supported capabilities honestly.

The two outputs have explicit roles `body` and `lid`. Identity derives from
feature ID plus role, never array order, native shape name or dimensions. The
locating lip belongs to the lid. A later inset label is a separate material
region grouped with the lid print object, not another independently arranged
print object.

Create both parts in a candidate mount. Validate native solid status and
model-derived expected bounds/volume before returning either. A valid empty or
no-op Boolean is not a successful enclosure. Publish both atomically through
existing craft model/history/registry ownership. Reject/cancel disposes the
candidate and preserves the accepted model. No separate document store.

Reuse manufacturing metadata and the core 3MF writer. Current
`resolveManufacturingAssignments` now requires an explicit `outputRole` for
`WORKER_ENCLOSURE_V1` bindings and checks the complete BODY/LID pair, authored
feature ID, originating operation and stable model IDs. Missing/duplicate
roles reject; it never chooses the first body. The source and native-envelope
tests pass for reordered output arrays, reviewed rebinding after a width edit,
wrong/duplicate/missing IDs and roles. These use model records rather than a
real regenerated enclosure; the corresponding end-to-end gate remains open.
The resolver identifies assignments, not native validity or authorization.
Candidate ownership must validate actual geometry independently. Existing Native Mesh exporters are
restricted to older operations and need a qualified worker-owned adapter.
Export tessellation must come from the current checked model, not its display.

Root export review found and reproduced a physical-size bug in the research
manufacturing adapter: direct callers could relabel millimeter model geometry
with another 3MF unit. The new regression failed before the fix; the adapter
now rejects mismatched units, consistent with the native project envelope.
All 19 export/envelope controls pass afterward. The low-level core3MF writer
still supports other units for callers whose coordinates actually use them;
this is not a geometry-conversion implementation or enclosure export proof.

The bounded legacy manufacturing snapshot helper still materializes JSON and
hash buffers. This change does not promote it into the interactive save path;
the final host integration must use the existing worker-based snapshot pipeline.

UI and agents invoke the same operation. Reopening regenerates output roles
from authored history, not serialized native IDs. Keep current revision and
owner checks at each asynchronous publication boundary.

## Acceptance queue

Integration `7fde2965` registers the authored OCC operation and candidate-owned
adapter in the app. Root TypeScript validation passed after resolving duplicate
worker module aliases while retaining both engines' declarations. The agent's
actual OCC browser fixture passed creation, width editing, undo/redo, native
replay, invalid-wall rejection at a rewound history position and held-worker
abort. See `test/enclosure-history/README.md` for exact tested assets and scope.
This is not yet a normal signed Files workflow. The adapter is currently OCC
only; Manifold engine-level support does not imply that the app offers it.
Material role tests still need to run against the regenerated real models.

- [ ] Invalid dimensions reject before publishing either output.
- [ ] Width/wall edits regenerate both outputs while retaining role identity.
- [ ] Reordered output array retains assignments; missing/duplicate roles reject.
- [ ] Failure after body creation leaves no partial lid/body publication and
      preserves accepted history and ownership.
- [ ] Cancellation during native work/projection releases candidate resources.
- [ ] Undo/redo/native reload reproduce inputs, relationships and output roles.
- [ ] Normal My files save/close/fresh-login/open without internal sync calls.
- [ ] Inset label export independently verifies two print objects and three
      material regions through the existing core 3MF pipeline.

This does not prove general Boolean naming, arbitrary shell operations,
manufacturing fit or physics validity.
