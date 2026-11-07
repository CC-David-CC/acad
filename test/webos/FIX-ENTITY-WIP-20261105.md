# Whole-entity fix candidate

`Fix Entity` supports a single segment, circle or arc; point and other shapes
are explicitly unsupported by this operation. A segment fixes both ordered
physical endpoints and verifies the derived physical direction and length. A
circle fixes its center and positive radius. An arc fixes ordered start/end
and center, and independently verifies its radius and the renderer's authored
counterclockwise sweep, including its existing coincident-endpoint full-circle
convention. Internal equivalent polar angles are not stored as identities.
All persisted constants are read-only numeric literals; coordinates and
dimensions must be finite and within the feature's explicit 1,000,000-unit
bound. Inconsistent or degenerate inputs are refused.

Fixed entities share the bounded interactive last-valid solver guard, and
native strict preflight and the sketch Worker independently verify their
intent and geometry. Removing the last guarded relation clears its retained
parameter snapshot after a successful rebuild; failed removal retains the
prior snapshot. Fixed-direction/geometry validation currently requires the
existing main-thread precise solve and exact bounded sketch revision snapshot;
worker-first revision and interactive performance remain open. This is not a
rigid-group implementation, which must retain three planar motions.

## Selected-action browser qualification

R730 checkout `f184d0476e14254e05a8cf2209504cc256398bf7` built matching sketch and project-validation workers, app, and test helper with `CODI_EMBED_NUMERIC=1 CODI_EMBED_MANIFOLD=1`. An isolated loopback server supplied the standard fixture CSP and a separate Chromium context for each shape. The selected action, real pointer drag against the fixed point, exact sketch undo/redo, and fresh native workspace snapshot replay passed for segment, circle, and arc. The ID action also passed duplicate, hidden-parameter ABA refusal, and explicit inspection release controls. This is desktop Chromium, not a physical phone or a signed Files test.

The first browser harness run failed because the circle center was placed exactly on the sketch origin, so the pointer selected `ground/ORIGIN` rather than the intended center. The test moved the circle and arc away from the origin and asserted the actual selected point before dragging; no product change was made for that harness error.

SHA-256: sketch worker `474f69afda4098413717b09d8d377a07519e6eec40c7952d07a7d64c108525ef`; project worker `8b533f912bb424e171a51d785b1cbd6af0c6141bf6251bd88221fc6bcdc2bc1d`; index `055574f50e7321f8affd6cb26ae210172dfcf6f216b8e7854320537001b7dfba`; sketcher `e26512e574270617bf141f3867f12abcf9bfb8a25703916f172a0c0713950d9b`; test helper `d0b61f96e546f9983dd0c546f74354ff92df33cd122c0f851fdfdda1368733c8`. App source matches `f184d0476`; the later test-only adjustment avoids the origin collision.
