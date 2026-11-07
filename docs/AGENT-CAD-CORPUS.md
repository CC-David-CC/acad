# Agent-driven CAD qualification

One authored parametric document, one sketch solver and one feature history
remain authoritative. Each part's selected kernel evaluates its modeling
sequence. Other kernels are explicit re-evaluations, with independent checks;
there is no automatic fallback or continuous conversion. Face counts and native
identifiers need not match. OpenUSD is optional exchange, not the native format.
Human UI work is deferred. OpenCascade is the current baseline; SMLib remains
experimental and Native Mesh/Manifold remains a distinct selectable backend.

## Pinned case inventory

Run `node test/agent-cad-corpus/report.mjs`. The index selects explicit receipts,
checks their source/runtime pins and evidence paths, and reports failures/open
cases. It does not execute CAD or grant release status. Current4a3 slices contain
110 backend/layer cases:61 pass,2 fail,36 unsupported and11 not-tested. These are
not percentages of CAD1 or the full CAD1–6 backlog; cases repeat per backend.
Historical fixture mistakes and corrections remain separate from selected runs.

The current failures are SMLib edge-contact union's generic error and implied
linear-redundancy labeling. The first has now been isolated to wrapper policy:
the independent raw NVIDIA test returns two material regions that can be
extracted into individually checked bodies. The4a3 application failure remains
in the corpus until an integrated multi-solid binding is qualified.

Matched-app tests also pass create→Boolean→parent edit→reject→shared undo/redo→
native save/fresh replay separately on all3 engines, with independent triangle
volumes500→700mm³. Signed WebOS SMLib host/account/file/close results are in the
desktop repo `tests/jsketcher-solid-signed-20261105.md`. Its signed OCC bracket
family tests3 named configurations using one authored part, public commands and
fresh Files reopen (`test/agent-cad-corpus/parametric/README.md`). Volumes computed
from inspected dimensions there are not independent kernel measurements.

## Ordered gates

| Domain | Next qualification boundary |
| --- | --- |
| Geometry/constraints | Domains, units, midpoint, dimensions, truthful redundancy/conflict diagnostics, exact rejected-state preservation and serialization. Local solutions are not physical/global DOF certificates. |
| Planar regions | Independently identify/select disjoint, nested, intersecting, tangent, duplicate and open profiles. Box tests do not qualify this. |
| Solids | Primitives, extrusion/revolve, empty/single/multi-body Booleans, finite tolerances, topology/region validity and unsupported cases. Compare dimensions, volume, openings and regions, not equal face counts. |
| Parametric reliability | Public agent edit/recompute/repair/undo/redo/native Save/reopen; preserve IDs or report unresolved references explicitly. |
| CAD2 automation | Named parameters and configurations, bounded family evaluation, explicit infeasible candidates and attributable reports through common operations; no private helpers or separate editable variant models. |
| Manufacturing | Native history stays editable source. Core3MF preserves units, parts, regions, materials, placement and revision; public export/rebind uses the same core and My files. STEP needs precise transfer/translator qualification. |
| Kernel selection | Representative correctness, failure, initialization/execution, actual memory and export evidence. Tiny-workload timings or WASM capacity alone do not determine a default. |

Keep representability, constraint satisfiability, planar topology, kernel
validity and meaningful dependencies separate. Every failed candidate preserves
the accepted authored model and saved data. Last-valid displays remain labeled
when the new result is unavailable. Rendering and analysis remain derived.

## Independent NVIDIA source

Full source mirrors: `example.invalid:/srv/data/git/usd-brep.git` and
`r730:/mnt/data10tb/git/usd-brep.git`; official main remains
`3fd5b9548d19aa8c12c29bc9637a96d42a06f8a5` (v1.0.1).
`research/wasm-solid-contact-20261105` contains our direct C++/WASM probe without
the third-party bridge. Edge/point/disjoint results contain2 material regions;
face/overlap contain1. Ordered differences produce750/250mm³. Region extraction
passes the tested native level-0/manifold/volume controls. These bounded checks
do not establish arbitrary multibody fidelity or a kernel defect needing a PR.
Native ownership is destructive; authored input preservation uses copies.
General browser bindings and proposed upstream fixes require separate
regressions. No external issue/PR is published by this investigation.
