# Pure point-coordinate edit transition

Base `1c3f5dc3f7b73cd991439e403e7b4981adc8c06e`. Product scope is one new
`web/app/sketcher/headless/coordinateTransition.ts`; no dispatch, client, IO,
ParametricManager, editor, journal, public coordinator or native-source setter
was added or changed.

```
editPointCoordinatesTransition({revision, sketchJSON, externalParameters,
  intent: {id, x, y}})
// success: {revision, ok:true, serializedSketch, evidence, point:{id,x,y}}
// refusal: {revision, ok:false, error:{code,message}}
```

One target is a genuine native Point ID, Segment endpoint :A/:B, or Circle center
:C. Identity is resolved against actual constructed objects, not accepted from an
arbitrary suffix. Coordinates are finite numbers in existing sketch-local
millimetres, bounded to ±1e8. Input/output native text is bounded to 1MiB UTF-8,
external bindings to 1024 finite numeric fields, and this initial command to
1024 stored objects. Arc/ellipse/B-spline/Bezier/rigid children, ground/foreign
IDs and generated targets are outside this operation. There is no unit
conversion or coordinate-expression-string feature.

The complete saved source first passes genuine strict replay. Target ownership,
parent and non-generated/non-rigid status are checked. An already-equal target
returns **exact original sketchJSON bytes** plus genuine replay evidence. Numeric
coordinate equality is exact, not a tolerant whole-sketch no-op comparison;
native JSON's -0/0 numeric equivalence is retained.

For a change, the actual disposable PM transaction snapshots first, then seeds
target coordinates and calls genuine parent.syncGeometry. This synchronizes
Segment intrinsic angle/length while preserving all authored dimension/lock
constants. A temporary real LockPoint enforces px=x and py=y using existing
admission. Any new conflict with existing accepted/redundant relations refuses.
The ordinary per-stage prepare/solve/generator pass runs while that driver still
exists, so generator outputs travel with an edited authored input. Its exact
stage/index/type/point/constants/admission identity is checked, then only that
temporary row is removed from the detached serialized candidate. It never
becomes a persistent dimension. A fresh real solve verifies all prior authored
intent and native geometry; the final requested coordinates must still be
numerically equal to the requested values, or no success bytes are returned.

All prior types/IDs/roles/stages, constraints/constants/admissions/annotations,
generators, dimensions/labels, metadata and non-solver authored shape data stay
strict. The existing per-shape geometry policy permits geometry changes required
by relationships; it does not erase spline/rigid authored data. Existing strict
legacy/admission replay rules are unchanged. Refusals publish nothing and contain
no candidate bytes; caller request/source remain unchanged. COORDINATE_CONFLICT
is the existing numerical admission refusal, not a global unsatisfiability proof.
No DOF/rank/exact algebraic independence is claimed.

## Actual Worker evidence

`observed.json`: all61 disposable real Chromium Workers pass and terminate:
14 canonical native-IO fixture jobs, 18 successful edits/no-ops, one accepted
native replay and28 refusals. Realm checks report no window/document/Canvas.
The worker uses genuine HeadlessSketchWorkspace, PM, IO and existing solver;
there is no fake viewer/window/canvas solver installed by the test.

Exact final pins:

- module SHA256 `3f0069089f5d0965f6202ac455d48c245548c81444ea7726d3afcee9886dc8f0`;
- test-only Worker SHA256 `454633fe9fbd36ddca4dc19ef37650f7242378946f3eb2f0dc730309ee91d782`;
- actual verb asset SHA256 `55f13091a656c635d1ebe3931a9b52236c65023549b7b69bc8278362f87686f3`.

The Worker bytes are read once, hashed and served from the same immutable Buffer
using same-origin CDP Fetch. The retained 20488 page supplies only the origin,
self-only Worker CSP and unchanged verb asset; no app/editor action participates.
No blob Worker or unsafe-eval is enabled. Browser target and exact CSP are in the
receipt. All owned pages/context close; no fixture server is modified.

Independent assertions cover:

- standalone Point, both Segment endpoints and Circle center; exact target
  coordinates, positive noncollapsed geometry and preserved unrelated data;
- free Segment A=(1,2) preserves original B=(10,0), and free B=(20,5) preserves
  original A=(0,0); Horizontal+Length10 A=(5,7) genuinely requires B=(15,7);
- original radius5 and authored DiameterLength10 remain; signed-X allows y
  movement but refuses changed x; existing lock and anchored length/horizontal
  conflicts refuse, including a requested 1e-10 locked change;
- a free 1e-10 point change actually persists instead of becoming a false no-op;
  equal targets preserve exact canonical and pretty/whitespace source bytes;
- requested zero-length and degenerate source Segment/Circle refuse; wrong
  parent/object/ground IDs, generated targets (including equal-target no-op),
  rigid members and spline children refuse;
- Mirror generated target refuses, unrelated generator persists, and editing
  authored seed center (-12,3) regenerates copy center (12,3) with unchanged
  generator identity; unrelated spline knots/control metadata persist exactly;
- multistage source, external numeric expression bindings and saved
  TangentLC.inverted branch persist; changed saved admission refuses;
- NaN/Infinity/out-of-domain/string coordinates, extra fields, accessor intent
  (zero getter reads), Map bindings, invalid JSON and UTF-8 overflow refuse.

Observed per-job wall time171.5–262.7ms includes startup, compilation/import and
worker work in an already-running Chrome session, with cache state unspecified.
These small cases do not measure pure solver time, memory, cold browser startup,
large-drawing responsiveness or whole-app performance. Each job has a10s host
termination deadline, explicitly distinct from a solver verdict; none timed out.
Full repository TypeScript noEmit passes.

## Preserved investigation evidence

`before-seeding-source.txt` + `before-seeding-observed.json` pin the unintegrated
initial candidate. A temporary lock without first syncing intrinsic Segment
geometry met the target but avoidably moved the free opposite endpoint:
A=(1,2) produced B≈(10.4000596792,0.0406588075). Genuine target seeding and
syncGeometry removes that drift; final assertions require the free endpoint stay
exact. This is an implementation correction, not a desirable edit semantic.

`intermediate-unprepared-ground.json` retains a compact failed candidate control:
calling pm.solve directly after IO attempted an unprepared ground cache and
refused with an undefined-forEach error. The final code reuses solveSketch's
existing per-stage prepare/solve order and then independently verifies output.
The initial fixture also used UI label Diameter instead of registered
DiameterLength; correcting the fixture schema was not a product change.

## Reproduce

Use Node24 and installed dependencies; precompile the existing numeric dependency
if absent. This builds only the small test Worker, not a full app:

```
node build/precompile-numeric.cjs
CODI_COORDINATE_OUTPUT=/tmp/unique-coordinate-worker node node_modules/webpack/bin/webpack.js --config test/headless-coordinate-transition/webpack.cjs
CODI_COORDINATE_WORKER=/tmp/unique-coordinate-worker/worker.js node test/headless-coordinate-transition/browser.cjs
node node_modules/typescript/bin/tsc --noEmit --pretty false
```

The runner uses its own context on CDP19329. JSKETCHER_TEST_URL can select another
loopback fixture with the same pinned verb/CSP. This checkpoint is pure core and
actual headless Worker evidence; production transport, live publication, undo/
redo, full native project save/reopen, Files/account lifetime and UI are parent
integration work and are not qualified here.
