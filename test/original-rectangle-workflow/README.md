# One original-rectangle integrated workflow

Current qualification: [complete application and artifact PASS](evidence-r1/README.md),
frozen ACAD9afec3f. The source-preparation description below retains its original
status; actual runtime, scope, exported files and reader evidence are in that packet.

SOURCE COMPLETE, UNTESTED. Prepared in a new R730 ACAD checkout from independent fresh main631ca61. No source, type, unit, build or browser checks were executed during implementation. Parent owns composition, exact served pins and whole-workflow qualification. No E17, UI, full Gate1, physical print/slicer or independent external STEP implementation claim.

Existing registered public commands cover this chain; no new product bridge, alternate model, Native API, material provider or persistence format was added. Source ownership is ONLY new test/original-rectangle-workflow/. Native/ledger inset-label work and PM/io ordinary-validation work stay separate.

The complete driver authors one actual constrained100×50 rectangle on its actual XY plane, extrudes20, adds semantic centeredD10 and four cornerD4/offset8 through holes, selects ALL FOUR discovered original connector edges for one R3 fillet feature, then patterns the genuine centered seed count3/spacing20. Original rectangle/source, hole, treatment and seed feature IDs remain actual app-allocated IDs. No parsing of opaque region/edge/body IDs, private authoring helpers, seeded source/history, synthetic replies or display-mesh-as-manufacturing substitute.

Fillet selection uses current advertised plan-v2 metadata: same genuine profile origin, connector role, line geometry, four unique edges, two real source-curve incidences per edge and four unique source incidences total. The source has exactly one four-Segment ordinary rectangle and no other boundary, making all four corner treatments independently checkable. There is no arbitrary first-edge/corner guess or Native ordinal. The analytic removal for all four vertical corner fillets is4*r²*(1−π/4)*depth, not the prior recipe's two-fillet/two-chamfer formula.

Full path in ONE model:

1. Build original plate and all features above; native volume/bounds and authentic material/void/corner/boundary point queries.
2. Pattern creation UndoRedo retains original feature/output IDs/high-water.
3. Resize SAME source150×30, depth25, seedD14 and patterncount4/spacing15. Switch document presentation to inches without rescaling canonical millimeters or adding an authored Undo record.
4. Undo pattern, seed, depth and source resize back to original100×50×20, then Redo all four, retaining inch metadata. Roundtrip millimeter/inch display separately.
5. Normal native Save, browser/server equal SHA, retire owned context, fresh signed Open, verify same authored model and inch presentation, session journal reset.
6. Reedit genuine seedD12 and patterncount3/spacing20; mixed UndoRedo. Overlapping count6/spacing5 and exterior count4/spacing30 refuse with precise PATTERN_OVERLAP/PATTERN_OUTSIDE_PROFILE while preserving accepted model/source/journal/material/counters/association.
7. Publish one explicit printable part Original parametric plate, one region main on the actual current pattern output, material pla/PLA and appearance blue/Blue/#3366ff. Shared manufacturing UndoRedo. No geometry change after this final assignment, so no hidden material rebind.
8. Native Save/resave, actual protected STEP and core3MF commands into My files, equal browser/server file bytes and exact readonly accepted-state preservation (including same-window revision/document tokens). Exports do not mark an editable model saved or change its byte serialization.
9. Fresh native Open with exact material/part/region/presentation identities; repeat Native point query and both exports; unchanged Save SHA must match final-source. Two STEP and two3MF files are independently checked after the complete workflow.

Absolute Native and STEP read volume tolerance1e-6mm³; bounds1e-6mm. Native outputs must be valid single solids with the exact declared build. The shared Native point observer independently reconstructs current source/history and checks actual bores, neighboring material, all four removed corners and retained fillet centers, an outer wall and outside point. These finite actual observations are not a universal geometry certificate. All resources retire after each invocation; zero active owners is not a claim of zero heap/RSS.

Exact formula, from actual saved intent/source independently checked by oracle.mjs and mesh-oracle.py:

`V = width*height*depth − π*depth*(count*centerDiameter²/4 + cornerDiameter²) − 4*depth*filletRadius²*(1−π/4)`

Four corner bores and the seed/count centers come from the actual source dimensions, stored offsets and semantic pattern definitions. Corners lie at(8,8),(width−8,8),(width−8,height−8),(8,height−8); copies are(width/2+i*spacing,height/2). No persistent circle tools or derived Boolean features are allowed in native intent. Saved history is exactly one PLANE, one selected extrusion, two semantic hole features, one all4-edge fillet and one semantic pattern; the only authored source remains the original four Segments/eleven constraints.

mesh-oracle.py is an independent Python ZIP/XML/triangle implementation. It checks exact material and body/producer bindings, separate part/region/mesh component structure, millimeter units, manifold edge/vertex links, connected boundary and Euler2−2*7 for seven through holes, analytic boundary sample coordinates and signed winding material/void probes. Curved manufacturing volume is compared with the exact analytic volume using the explicitly bounded fixture allowance `(analytic perimeter*0.01 + π*(holes+1)*0.01²)*depth`, based on the current protected Native controlled-tessellation0.01mm/0.1rad route. This allowance is not an arbitrary relative tolerance or universal ideal-geometry certification. Readonly exports never use the display projection. Reopened canonical triangle sets must match. Source-vertex and Native geometry oracles remain stricter and separate.

step-reader.cpp uses the real STEPControl_Reader in a separate same-OCCT build, not the exporter or a different STEP implementation. It reads the TWO real exported files, checks mm transfer, valid one-solid/one-shell geometry, independently recomputes volume/bounds and checks all bore/material/corner/boundary points. External independent reader qualification remains pending. It adds no app STEP import. The existing test/owned-step-worker/build-reader.sh accepts this file as its fifth argument; parent builds it with the qualified pinned Native SDK/headers/archives, then freezes actual JS/WASM hashes before running read-step.cjs. No compilation was run in this source lane.

Run only after parent provides composed fixture/pins, in owned contexts:

```sh
CODI_DESKTOP_SOURCE_ROOT=/absolute/current-desktop-source \
CODI_SIGNED_PINS=/absolute/runtime-pins.json \
CODI_EXPECT_SOURCE=exact-composed-ACAD-source CODI_EXPECT_DESKTOP=exact-host-source \
CODI_ORIGINAL_PLATE_ENGINE_REVISION=sha256:exact-js:exact-wasm \
CODI_TEST_URL=http://127.0.0.1:PORT/ CODI_TEST_CDP=http://127.0.0.1:19329 \
PUPPETEER_CORE_PATH=/absolute/puppeteer-core CODI_EVIDENCE=/tmp/fresh-original-rectangle-proof \
node test/original-rectangle-workflow/driver.mjs
python3 test/original-rectangle-workflow/mesh-oracle.py /tmp/fresh-original-rectangle-proof
node test/original-rectangle-workflow/read-step.cjs /absolute/frozen-reader-output /tmp/fresh-original-rectangle-proof /absolute/reader-pins.json
```

Driver PASS means only its actual public command/source/Native/save/export observations passed; complete workflow acceptance additionally requires both independent artifact readers. Preserve first failures and original pins. Same-window readonly operations compare every field/token. Evaluated refusal may advance only recorded opaque solid/journal/host inspection revisions; geometry/source/material/counters/baseline stay exact. Display change legitimately refreshes the opaque journal inspection token while all journal content/targets stay exact. Fresh Open/replay may rebind the material-surface token and session journal; authored native contents stay exact.

Parent owns services and shared browser. Durable Save/export/sync must settle before context retirement; no deadline deliberately closes a context during a submitted write. No deployment, filesystem-race test, account switching/impersonation, private account/key copy, E17 or missing-workflow substitution.
