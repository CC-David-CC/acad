# Version 2 inset-label research

Integration source checkpoint `19de82fd` carries this worker research alongside
the material groundwork; it does not yet register the V2 authored feature.
Root reviewed versioned input capture, private triple binding and the distinct
common-volume claim, then ran 20 plan/capability/manufacturing/3MF controls in
the integrated checkout. All passed. The two 3MF writer controls use historical
V1 captured meshes; they do not prove V2 label export. Real worker browser runs
remain the agent evidence below; positive contact and full authored replay are
still pending. Source includes both engines without requiring equal topology.

Version 1 remains the unlabeled two-part contract. Version 2 adds centered positive `label.width`, `label.length`, and `label.depth` in millimeters. The label is flush with the lid top and its exact footprint is removed from the lid; it is a separate LABEL result. Invalid dimensions and insufficient lid skin are refused. BODY, LID and LABEL are returned only after all checks succeed and share a private same-mount binding.

The v2 result includes `interfaceEvidence` with `kind: bounded-common-volume`: OCC verifies the actual common shape has no solid and a signed volume within 1e-7 mm³; Manifold verifies its common volume is zero. Manifold may return nonempty degenerate geometry at the nominal common boundary. This check alone does not prove that the parts touch or prove printer fit. The bounded manufacturing mesh validator separately checks each planar surface against the authored part. Export must verify the matching interface and its lifetime; it must not infer contact from bounding boxes or this common-volume result alone.

A strict-CSP real Chromium control, `label-browser.cjs`, exercised both pinned engines for width 100, length 70, height 30, wall 3, clearance 0.3, lid thickness 3, lip depth 2 and label 40 × 20 × 1 mm. Body/lid/label volumes were 47568, 32043.12 and 800 mm³. Manufacturing meshes had 28, 44 and 12 triangles, respectively. OCC WASM was 13617eda9a2118edfd1244b5d46523e7d9628a87ec995a0237b2b5cc58d532f2; Manifold JS cd2031fd75cbbc812b550dd228f95b9fd666ae4da6557f840e3d3ed4cbed268b and WASM 7bb5f8ee10fcafdab78799b1e5dd2cdc7c282ea0bf8e7939c43f3ad34b823e3d. The browser test expects an already running CSP fixture at 19974 and CDP at 19975; use an isolated test browser. Source build and package provenance remain those of the pinned runtime.

This is worker-level research, not published feature/history, manufacturing export, physical fit or printer qualification. Further real-browser negative controls, dimension edits, cancellation and v1 regression must be completed before integration. OCC output sentinel reuse inherits the old runtime owned-name allocation limitation; worker termination is the cleanup boundary.

Additional strict-CSP browser controls `label-edit-browser.cjs` and `label-lifecycle-browser.cjs` pass for both actual engines: increasing the body width to 120 mm moves the label X range to 40–80 mm and gives body/lid volumes 55008 / 38779.12 mm³; a label as deep as the lid is refused, and cross-mount, missing-label and closed-mount binding attempts fail. The same control confirms v1 remains a two-role operation. These geometry cases exercise reconstruction with edited inputs, not authored-history edit or undo. Cancellation/worker-crash and detailed negative manufacturing cases remain outstanding.

`label-cancellation-browser.cjs` also passes both real workers: aborting a deliberately held label manufacturing read returns CANCELLED and closes its mount, while an independent mount retains its valid v2 triple. It does not establish cancellation in every native command or a crash during cut.
