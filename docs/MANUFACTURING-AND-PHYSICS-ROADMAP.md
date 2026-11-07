# Model 3MF first; physical-system studies later

Current file-scope clarification (2026-11-05): only our own native editable
project saves need to open/import in this milestone. DXF and core model3MF
are export-only handoffs. STEP/third-party importers are not acceptance
requirements here. Native source persistence, export accuracy and lifecycle
remain required; existing pure DXF parser code is not a supported WebOS import.


## Qualified combined slices — 2026-11-05

Runtime CAD `b2a66ca86` / desktop `82bef8323` passes scoped actual-editor atomic
rejection, stale-dialog refusal/retry, valid edits, undo/redo and native restore.
The earlier bfc existing-dimension counterexample is fixed within this path.
Actual close faults release history, editor/context streams, subscriptions and
picking; reentry during exit is refused and clean reopen/resize work. Signed
explicit centered-hole parent repair, configurations, material review,
Save/fresh Files reopen, account isolation, held-Worker close and independently
checked core3MF pass. Thirteen affected carried browser/engine controls pass;
thin-intersection results still differ between OCC and Native Mesh, so no
engine-equivalence claim is made.

Exact source/runtime pins, commands, failure controls and limits are in desktop
`tests/jsketcher-combined-core-b2a-20261105.md`,
`tests/jsketcher-parent-repair-signed-20261105.md` and
`tests/jsketcher-b2-carried-regressions-20261105.md`. Earlier b3/configuration
receipts retain their scope; no new deployment is claimed.

Near-1MiB history passes, with relation invocations 14.7–17.3ms, but undo still
produces a 403ms task/461ms heartbeat. Full worker-first capture and complete
mutation coverage remain open. Audit identifies Concentric retaining a rejected
row and Diameter's separate transaction/hash guard as the next bounded checks.
Truthful readonly local solver diagnostics remain research. General rejected-edit
preservation, arbitrary reference repair, complete CAD1, physics and final beta
are not established. Packaging stays deferred until functional gates qualify.

## Earlier enclosure checkpoint (retained scope)

Combined `15a7e2a5` passed the signed enclosure/material/native-save/fresh-reopen
and initial/edited core-3MF workflow: two print objects and three regions,
including a rectangular inset grouped with the lid. Independent checks cover
units, grouping, material/appearance, closed meshes, dimensions and volumes;
see `test/enclosure-v2-functional/README.md`. This does not qualify arbitrary
geometry, lettering or physical printing. Files is the accepted foundation;
current work is CAD replay/Save reliability and the remaining functional gates.
Physics and inverse design remain later work. Source packaging follows the
functional gates, per the user's explicit priority.

This roadmap records the requested vertical milestone for the browser WebOS. jSketcher is a candidate geometry-authoring component, not the sole owner of every physical-system concept. The first target is a **dependable core model 3MF**, not a Bambu Studio project, printer/filament/process configuration, slicing, or a physical print. The CAD changes under `research/mechanical-constraints-audit` remain experimental and are not a prerequisite claim of solver correctness.

## First acceptance workflow

Create a parameterized design with at least two distinct printable parts or regions. Give each a stable identity, useful name, material reference, independent display appearance, and placement. Save the native project to My files, synchronize it, change a parameter, and reopen it in a fresh account session. Verify the intended assignments and placements survive. Export the selected parts as a core 3MF to My files with an explicit unit and user-selected model tessellation tolerance. Reopen/parse the package independently and confirm the exact object/component structure, names, transforms, physical dimensions, base-material references and color/appearance representation. Validate watertight, consistently oriented manifold geometry and report unverified interference or defects truthfully. Test at least one invalid or missing part, stale/ambiguous reference, malformed geometry, and interrupted save without replacing a good existing output. Exercise undo, reload and two-account isolation. A separate independent 3MF validator or consumer may be used; Bambu Studio is optional and no printer is required.

A color is not a material identity: two differently colored regions may share a material, and visually identical regions may have different material assignments. Core 3MF base-material resources contain names and display colors; their representation and reader behavior must be verified rather than claiming a complete physical material-property library. Do not encode stiffness or constitutive laws as a prerequisite. A model 3MF is distinct from a Bambu project 3MF containing slicer-specific settings.

## Design boundaries

- Persist authored part/region identity, name, explicit unit, material reference, appearance, placement and provenance in the native design model; do not make tessellation or a generated ZIP the source of truth. Verify any identity survives actual regeneration rather than treating a UUID on an unstable face as a guarantee.
- Export from selected model geometry and transforms, not the current camera/view/display mesh. Generate a derived mesh at explicit tolerance; preserve hierarchy and repeated instances where supported. Reject or clearly report missing bodies, open boundaries, degenerate/invalid triangles, inconsistent winding, unsupported geometry, ambiguous references and intersections that cannot be reliably resolved. Never claim a successful watertight/interference check if it was not run.
- Follow the [3MF Core Specification](https://github.com/3MFConsortium/spec_core/blob/master/3MF%20Core%20Specification.md), including package relationships, object and component references, units, base materials, transforms and the manifold/orientation requirements for model meshes. Treat imported files as untrusted and bound work and memory. Test with an implementation independent from the writer.
- Keep My files as the normal open/save destination; importing from a computer is a separately labeled action. Prevent stale-account access and stale overwrites using the existing file/version contract. Window close and cancellation must release workers, native/WASM resources and temporary URLs. Phone controls should remain usable without hiding advanced desktop precision.
- Expose one set of validated, authorized document operations for people and future agents: inspect and change a parameter, assign a material, export, and inspect success/failure. An agent must not use a separate representation or bypass checks. A remote-agent transport is not implied by an in-page command API.

## Later physical-system layer

| Component | Responsibility |
| --- | --- |
| Geometry authoring | Sketches, dimensions, features, bodies and persistent references. |
| Physical-system document | Regions, material properties and orientation, interfaces, sources and conditions. |
| Study | Physics, operating cases, outputs and accuracy requirements. |
| Solver integration | Convert a supported authored study into a numerical problem and return attributable results. |
| Design search | Generate and evaluate candidate revisions and compare feasible results. |
| Results and provenance | Preserve inputs, model revision, mesh, data sources, settings, solver versions, warnings and failures. |

Attach assignments to meaningful regions/boundaries, then derive and tag the numerical mesh. Investigate Gmsh, Elmer and GetDP as shared system tools only where a runnable, appropriately licensed browser or authorized backend integration actually exists; menu entries or a package download alone are not a working solver. Each study must say what was simulated, which assumptions and approximations were used, and whether convergence and verification were established. Engineering simulation is not validation against physical hardware.

## Validation sequence

1. Establish present model/part/reference and units behavior in real source and browser tests; specify what survives parameter changes and where ambiguity is reported.
2. Implement the native metadata and My files lifecycle, preserving existing projects and material/color distinction.
3. Implement bounded, cancellable model-derived tessellation and core 3MF output; qualify mesh validation and unsupported cases, then verify with an independent reader.
4. Exercise a two-part benchmark through edit, undo, save/sync, fresh reopen and export; confirm scale, placement and material references against known geometry. Fix any issues discovered before claiming dependable output.
5. Only after this foundation, qualify reusable study documents, meshing and selected physics solvers with explicit provenance and comparison to known benchmarks. Agent actions use the same authorized operations as the UI.

## Initial source audit

At the audited candidate baseline, `web/app/cad/exportBundle.js` exports ASCII STL using `cadRegistry.shells` display face views and a browser download; no integrated core 3MF exporter was found. `projectBundle.ts` and `projectManager/projectManagerBundle.ts` persist history, expressions and sketches, but not a qualified explicit unit/material/appearance assignment model. `attributes/attributesService.ts` provides transient display labels/colors, not persistent material identities. Shell/face IDs and mesh buffers exist, but neither stable identity across topology changes nor watertight manufacturing quality follows from their existence. Unsupported surfacing geometry must not be silently omitted.

A candidate exporter must first verify the existing project snapshot guard: no open sketch, unfinished operation, failed/stale feature pipeline or uncommitted history, and its model revision must still match after asynchronous tessellation. A missing or ambiguous body reference is an explicit error requiring repair. Legacy models without a unit need a visible, deliberate default/choice; do not silently claim a physical size. The current WebOS host supports conflict-aware native open/save but has no qualified model-3MF export bridge. Material names, appearance and core property IDs need round-trip tests with at least one independent implementation; color alone is not the persisted material identity.

Gmsh has a [browser WASM candidate](https://loumalouomega.github.io/GMSH-JS/guide/browser/) that needs its own compatibility, license, memory and lifecycle qualification. An official [Elmer FEM source repository](https://github.com/ElmerCSC/elmerfem) exists, but no verified browser-ready Elmer or GetDP runtime was established in this audit. Do not label any of these tools runnable in the WebOS merely because a package or source repository exists.
