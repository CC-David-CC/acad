# Isolated sketch regeneration core

This is a bounded first slice for dependent sketch regeneration. It uses the existing sketch IO, shapes, constraints, generators and algebraic/numerical solver through `HeadlessSketchWorkspace`, without constructing a `Viewer`, canvas, `ToolManager` or DOM shim. Every client call creates one disposable Worker, so module-global sketch IDs belong to that job and cannot alter the open editor's ID state.

Input is `{revision, sketch, boundary, externalParameters}`. `sketch` is a strict authored sketch-v3 record with its **saved** boundary; `boundary` is the current boundary from the referenced face; `externalParameters` is a map of safe variable names to finite numbers. The caller must resolve stable boundary IDs and types, include every referenced boundary entity, and check source sketch, model revision, face/boundary and parameter revisions again after the response. This worker does not write any authored state or apply its result. A successful response is `{revision,ok:true,sketch,evidence}`; a rejected input, unsupported operation, changed intent, failed solve or excessive residual returns `{revision,ok:false,error:{code,message}}`.

The first implementation accepts one sketch stage, point/segment/circle authored geometry, line boundaries, no authored generators and `PCoincident`, `LockPoint`, `Horizontal`, `Vertical`, `SegmentLength`, `RadiusLength`, `DistancePL`, and `PointOnLine`. It rejects missing/type-changed references, reversed or 90-degree-or-greater ambiguous line-orientation changes, degenerate lines/circles, incoming rejected constraints, changed accepted/redundant hints, invalid parameters and all unqualified entity/constraint/boundary types. Other stages, curved boundaries, splines, and generators are explicitly unsupported. Caller filtering of a boundary is allowed only for entities that the authored sketch does not reference; missing referenced entities fail closed.

The supported `PointOnLine` and `DistancePL` relationships use the solver's existing infinite supporting-line semantics, not a finite-segment inclusion test. Boundary endpoint order determines signed side; changes of 90 degrees or more are conservatively refused. This worker does not assert the resulting point is inside an edge, face, manufacturing region, or solid. Those checks belong to the caller's explicit geometry and feature semantics.

The solver's success flag is not treated as proof. For every internal and authored constraint, the worker evaluates the original unreduced equations at returned parameter values, requires finite results and numerical residuals at most 1e-6 mm for the supported length equations and 1e-8 radians for the supported angle equations. These are numerical thresholds, not fabrication tolerances, domain inequalities, rank diagnostics, proof of global uniqueness, or a general physics guarantee. It also verifies that the solved workspace still has the submitted fixed boundary endpoints, direction and length, and requires unchanged ordered authored constraints, constants, admission hints, dimensions, labels, object IDs/types/stages and metadata. Finite values beyond 1e9 are rejected. Unknown or unsupported cases fail rather than report success.

Build using the checked-out pinned dependencies and `node build/precompile-numeric.cjs`, then:

```
webpack --config build/webpack.headless-sketch-worker.cjs
```

The build refuses to proceed without the generated CSP-safe numeric module. Deploy the resulting `worker.js` as a same-origin asset in the application's `static/` directory; the existing application-local `lib/verb.js` must be available at `../lib/verb.js` relative to that worker. The worker uses the actual verb UMD export to `self`, with no `window=self` assignment. Product packaging must hash, include and verify these assets and use its own manifest; this research branch does not modify a live site.

`runSketchSolve(workerUrl,request,{signal?,valid?,timeoutMs?})` in `headless/client.ts` accepts only same-origin HTTP(S) worker URLs. A dedicated Chromium Web Lock allows one cooperating sketch Worker at a time per origin/storage partition; this lock is distinct from Files. Each client-module instance permits at most two outstanding calls, including preflight and queued calls. This does not bound the number of tabs, other browser profiles, uncooperative code, pre-existing input objects or total browser RAM. Web Locks are required; there is no uncoordinated fallback.

The client validates the request tree in yielding batches before structured cloning (at most 100,000 nodes, 64 depth, 10,000 elements per array, 4 Mi characters). The default and maximum deadline is 30 seconds from call through preflight, lock admission and execution. Queued abort/session invalidation/deadline removes only that waiter; an active job terminates its Worker before releasing its lock. Results arriving after the deadline are rejected. Timer-driven termination depends on the renderer event loop being scheduled; a frozen renderer can delay cleanup. The renderer-crash test establishes that the browser releases the lock, the old dedicated Worker disappears from DevTools targets, and a queued job proceeds; it does not measure OS process memory reclamation. A successful result remains provisional until the caller's source/revision checks pass.

Tests: `headless-sketch-worker.test.cjs` uses an actual Chromium/OCC-authored plate fixture captured at 100×50, filtered to its four referenced lines. With the current 150×30 boundary, four circles constrained 10 mm from the sides regenerate to (10,10), (140,10), (140,20), (10,20), with all eight accepted DistancePL constraints retained and independently checked. A second actual fixture uses two construction diagonals and six accepted coincidence/PointOnLine relations; after the resize its circle remains centered at (75,15), radius 5. The suite tests malformed and unsupported inputs. `headless-sketch-lifecycle.test.cjs` checks worker termination and cancellation using stall/revision fixtures. `headless-sketch-admission.test.cjs` uses two same-origin tabs and an isolated Chromium profile to verify queued cancellation/deadline, per-module bounds, separate Files lock acquisition and recovery after an actual holder renderer crash. `headless-sketch-editor-isolation.test.cjs` runs a Worker alongside a real open editor and compares its unchanged sketch and subsequent ID sequence with a control editor. No public deployment, solid cut, full plate workflow, multi-stage solving, or broad solver qualification is claimed.

Evidence currently identifies each relation by type, state and its ordered position in the returned evidence list; it does not yet carry stable constraint IDs or explicit object references. The caller must not present it as a fully attributable diagnostics report until those identifiers are added and validated. Horizontal and Vertical read-only axis constants are validated as numeric degree orientations equivalent to 0/180 and 90/270 respectively; arbitrary angles are rejected in shared sketch/project validation before restore. Equivalent full turns are normalized only for solving, while authored constants stay unchanged.

### Rectangle draft task

The same disposable worker also accepts the explicit request
`{task:'rectangle', revision, unit:'millimeter', frame:{origin,x,y,z}, origin:[x,y], width, height}`.
Only these fields are accepted. The initial supported plane is an orthonormal
right-handed principal XY basis; `frame.origin` is its world origin. Sketch
origin and dimensions are in millimeters. Width and height must be finite and
between 0.001 and 1,000,000 mm; local coordinates and resulting vertices are
bounded to 100,000,000 mm. The factory validates the frame, uses strict sketch
IO and existing constraints and solver, and returns
`{revision,ok:true,sketch,evidence,serializedSketch}`. The last field is JSON
created inside the worker, and corresponds exactly to the returned sketch.
Failures return the revision and a typed error; unknown explicit tasks are
`UNSUPPORTED`. Requests with no `task` retain the existing solve behavior.
The existing client provides cancellation, same-origin worker and CAD lock;
it validates the common response fields, not the task-specific JSON string.
A caller that consumes `serializedSketch` must check its type and ownership
before publishing. This task prepares data only; it does not create a plane,
publish a sketch, or expose a host command.
