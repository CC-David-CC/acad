# Public primitive authoring checkpoint — 2026-11-05

This is a bounded agent-authoring extension, not completion of CAD1/CAD2 or the original release objective. Source `997df3dbb` is the final readiness candidate; it includes the integrated Point/construction projection and the shared immutable-history foundation. No public deployment, kernel-default change or source packaging.

## Contract

`inspectPrimitiveCreation()` reports readiness, revision, millimeter units and `planes:["XY","XZ","ZY"]`. `createEmptySketchPlane({revision,unit,plane,depth},options)` creates a real PLANE plus strict empty native sketch bytes in one existing prepared publication. Frame comes from the actual evaluated MOpenFaceShell. No closed profile is expected; its profile-availability diagnostic is distinct from sketch validity.

`inspectSketchTransitions()` discovers supported closed source faces. `inspectClosedSketch({revision,faceId},options)` returns bounded entity/constraint IDs, stageCount and frame, without opening a visual sketch editor. `appendClosedSketchPrimitive({revision,faceId,kind,role,stage,data},options)` supports Point, Segment, Circle and Arc. Role is explicit null/construction; append targets the existing last stage. The coordinator owns new UUIDs and detached bounded intent before awaiting. Callers cannot supply IDs, native source or publication callbacks. Worker reconstruction/admission precedes private full-history replay. Candidate source frame, history, source versions, expression/material/lifetime guards and the existing atomic workspace/model/sketch-byte journal publication apply. Normal host Save remains separate.

Point has a one-vertex THREE.Points projection, stable model ID and explicit disposal. It is display-only, without an invented curve/collider. All supported construction curve types remain visible references outside contours/regions. The narrow rectangle planner accepts reference Points/construction alongside its four ordinary edges. An additional ordinary curve is not silently dropped or turned into an automatic hole.

Creation refuses unsupported ancestry using the existing strict classifier, without expanding implicit consumers. It reserves room for one new plane (current history <256) and sketch (inventory <64), and rechecks during preparation. An actual 1b2 box→empty-plane run exposed the prior misleading readiness: plane creation succeeded but append discovery returned no candidate. The correction refuses creation before writing. Typed parameters, nonempty referenced boundaries and unknown feature ancestry remain outside this new path.

## Exact private builds

- Initial integrated source `1b2f08eee`, R730 `/mnt/data10tb/codi-public-primitive-transition-20261105-r1`, direct20487. App SHA `8df21a6346b742aeba9891c518d3b00b8243949acdc10ba463c5b662ac4fffcb`.
- Readiness candidate `997df3dbb`, R730 `/mnt/data10tb/codi-public-primitive-transition-20261105-r2`, direct20488. App SHA `9993b01af9f49ca29aa2eceaa1701489aef01c992ee3a3b38a1a0799f87a9c28`.
- Identical helper SHA `3e57f2e250425e88686e44a1cbbad78061c8607a398f94664002e9bf3ffff041` (test only); sketch Worker `static/sketch-solver.d9991d9167715129b639.js` SHA `3211e4c5f5b51dc6b19dbce0e29c4cd1dbdb15ce7bbc89c075d5973b3bf7bc87`; project Worker `static/project-validator.3ae7f2bbbaedf25e54c3.js` SHA `424c892e73e8427a84b9f2c974b756ed26a59296b8c5c0fa85bf2475c040f806`.

Both builds use the strict self-only script/Worker fixture and the previously pinned native assets. Build current package Workers, then `node node_modules/webpack/bin/webpack.js --config test/closed-sketch/webpack.app.cjs`. The private test helper is not a public asset. Node24 and pinned dependencies/native prerequisites are as recorded in preceding closed-sketch receipts. R1 reused the prior copied output; its initial build hit a read-only generated raw-provider.wasm destination. Only that generated file in the new copied build was removed before regenerating it; prior runtime/native inputs were untouched. R2 recompiles the application only; Workers are byte-identical.

## Evidence and remaining work

- Root actual 1b2 multi-plane source-frame/dependent edit/exact travel passes with53/53 Workers terminated; five-hole edit/refusal/cancel/undo/redo/Save/native reopen passes; plate/enclosure composition and reopen passes with13/13 terminated. Logs in observations/.
- Planner13 tests pass, including reference geometry preserving the selected rectangle and an ordinary inner Circle refusing. Synthetic coordinator tests exercise detached inputs, stage/ID rejection and shared journal staging; empty creator controls include unsupported ancestry/capacity and expected no-profile semantics. These are not substitutes for full-app proofs.
- Candidate reader/model/rendering module tests pass12 actual WebGL controls and exact existing curve ID/tessellation comparisons; baseline failures are retained in `test/sketch-reader-fidelity/`. Full app and signed final-runtime observations are recorded separately when completed.
- Desktop actual signed1b2 public primitive/closed-relation/bracket-family/manufacturing runs pass, including My files Save/sync/fresh-login reopen and separate-account denial. See desktop primitive corpus receipt for exact bundles and server/export hashes. Final997 signed primitive run also passes on20382: bundle SHA `9f8cbec2eb8f67a8032552c4e28b4e6d9cc98f0edbb9bc74de4e41da26f6505a`, catalog `cd8887c7698ba44ffe7eaf215c8f2c09cc021dd4150f4088c091e13414abbdf5`, server file `6301cde9acd338c74e7b1d2942d07a9357cf6d9c4b4aedc61a3034d698ccd3ce`. Independent final readiness/projection controls are separate.

Open: active2D editor hydration/legacy processing and dense responsiveness; general entity edit/delete and profile selection; full basic/parametric corpus and references; final combined delivery and managed beta. Files remains accepted within its recorded scope. No blanket arbitrary-object/currentness, general physics/manufacturing or hard heap/latency claim.
