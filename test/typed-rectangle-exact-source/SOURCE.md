# Exact declared typed-rectangle source reconstruction

Source-only follow-up to the complete native `.cad` workflow R3. No tests, probes, TSC, build or browser have run for this patch. Root retains the original failed receipt and artifacts unchanged at `test/native-cad-container/evidence-r3` (source commit015f354). The observed R3 failure was `UNSUPPORTED_PROFILE`: the downstream through-hole planner required an exactly axis-aligned current source. The receipt preserves exact pre-edit100×50 source but not the rejected120×60 vertices; it does **not** prove the size or cause of that rejected-coordinate difference.

## Concrete production seam

`physicalSharedOperation` uses `typed-rectangle-bind` for a modern rectangle parameter change, followed by ordinary full-history prepared replay. Before this patch, that Worker task changed the two actual binding constants, ran the generic numerical solver and published its raw `solved.sketch`. `typed-selected-profile-solve` ran another numerical solve and likewise used that output as the profile source. In contrast, `ownedThroughHolePlan` requires exact four-line local-axis equality. There was no exact declared rectangle source construction between the authenticated parameter declaration and those consumers. This patch changes no planner tolerance, topology relation, Native pair, feature intent or project persistence format.

## Finite actual declaration

The new Worker-only `typedRectangleReconstruction.ts` recognizes the actual decoded registered model, not a template-ID spelling or a saved permission flag:

* Four real nongenerated root Segment instances in one actual stage, empty referenced boundary and no stage generator.
* Four actual PCoincident equations joining each Segment B to the next Segment A, forming one complete directed cycle with each source Segment used once.
* One actual LockPoint at the first Segment A; its raw numeric x/y literals define the source-local origin. The origin is never inferred from a bounding-box minimum.
* Four actual registered directed axis equations: Horizontal0, Vertical90, Horizontal180, Vertical270, one per successive Segment. Literal values and actual schema factory/parameter ownership are checked. Exact full-turn-equivalent integer axis literals follow the existing registered modulo360 semantics; their raw spellings remain unchanged.
* Exactly two actual registered SegmentLength rows, on the first and second Segments, resolved through the same Worker-evaluated typed length table and original field domain. All11 original authored rows and regenerated internal constraints remain.

Existing prior geometry must occupy that same exact anchored directed axis branch. There is no proximity matching, vertex welding, tolerance snap or hidden repair. Actual prior non-axis geometry is refused with a bounded diagnostic containing the first actual failing edge and its declared endpoint coordinates. Noncanonical generic dependent sources return to the existing generic path; the already restricted typed-rectangle bind/selected-profile tasks explicitly require this complete declaration. General curved, touching, extra-constraint or arbitrary constrained quadrilateral support is not inferred.

## Geometry and proof

Coordinate construction uses only the authentic LockPoint origin and resolved width/height, at full ordinary JS numeric precision: `(x,y)`, `(x+width,y)`, `(x+width,y+height)`, `(x,y+height)`. Unsupported/nonrepresentable extents refuse explicitly. No decimal rounding or threshold is added. Exact H/V/corner equality follows from this construction rather than overwriting an optimizer result.

The original detached source is copied and only the proven four Segment endpoint coordinates change. All other object fields, IDs, ordered constraint rows/constants/bindings/annotations/admission intent, labels, ruler records, source frame and metadata remain. Nothing is copied over a failed solve. Two fresh full production cold solves must each succeed and satisfy the existing replay geometry/branch limit of1e-9mm; the actual registered equations, original residual/domain policy, classification and parameter ownership are then validated at the exact declared candidate coordinates through `evaluateCapturedSketch`. Cold outputs provide evidence only and never become the published geometry. Independent pre-existing operation/semantic Worker verification is not removed or weakened.

Read/replay mode requires the current source to already equal its declared typed coordinates; it cannot mutate accepted source to repair a stale file. Update mode is private to the existing parameter source transaction and derives the changed rectangle from that captured source's authenticated declaration. An unrelated free sketch cannot acquire this geometry authorization from a caller flag. The same existing document/history/source/parameter currentness and atomic publication remain in Craft; no Craft/PM/journal edits are included here.

For a proof failure, the diagnostic names the first actual field with full finite declared/cold numeric values, bounded to the existing512-character failure message. Cause-less errors use `withAdmissionCause` rather than attaching an own undefined diagnostic. Numeric failure stays numeric; it is never renamed a contradiction.

## Owned source / composition

Only NEW `web/app/sketcher/headless/typedRectangleReconstruction.ts`, the existing typed branches/import in `headless/solveWorker.ts`, and this source note change. There are no coordinate/commonScope/IO/captured-validator/AlgNum/Native/PM/metadata/history/default edits. The four Worker branches are typed rectangle bind, typed selected-profile replay, typed sketch transaction, and ordinary typed dependent solve. Local rank/diagnostic requests keep their existing actual solver report path. The normal sketch Worker bundle will change when root builds; no fabricated or manually reused runtime hash is claimed. No static Native bootstrap or module-emission pin needs editing for this bundled helper.

Root must compose this narrow Worker splice with dxf's independent coordinate repair, then execute the unchanged complete native `.cad` source/material/drawing/export/SaveOpen workflow. Initial/unchanged saves and exports from R3 retain their original passing scope; the failed width edit, later lifecycle assertions and repair remain unqualified until that full run succeeds. Do not edit the driver expectations or reinterpret the unsupported-profile failure as a pass.
