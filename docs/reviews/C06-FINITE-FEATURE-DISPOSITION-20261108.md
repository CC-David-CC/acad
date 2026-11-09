# C06 finite feature disposition

Source/evidence review only, Core **e2a3027fd5fff516cbcda412e8f5f9d9b3531f57**.
Desktop source inspected at **eb84b13dc1a675541fe4a32a9fb7bc7b16a4be59**
(the Offset packet is source-ready, not executed). No product changes, tests,
builds, Native calls or browser execution. This document does not change the
accepted ordinary21, producing receipts, current qualification or Gate1 status.

## Scope and vocabulary

The obligation is `D:docs/CAD-ENGINE-GATE-1.md:437–443`, together with
[GATE1-REMAINING-CONTRACT-MAP](GATE1-REMAINING-CONTRACT-MAP-20261108.md), C06.
Here `A:` means this ACAD repository; `D:` means Desktop. “Where exposed” makes
thread behavior conditional; it does not silently remove the explicitly listed
blind/counterbore/countersink, draft/rib, body mirror/radial pattern, split or
solid offset/thicken obligations. If the owner interprets that qualifier more
broadly, that needs an explicit contract decision, not an implementation label.
No arbitrary advanced variants are added here.

- **Q — qualified finite domain:** actual whole evidence; not universal coverage.
- **U — implemented, unqualified in this domain:** actual source exists, but no
  reviewed complete public lifecycle proves the stated operation.
- **S — missing shared route:** no current protected public/authoring/replay path
  for that intent. Existing construction primitives may suffice underneath.
- **N — missing protected Native primitive:** the owned request/FFI does not expose
  the necessary general operation. This means new ownership/provenance/validation
  binding, **not** that OCCT lacks the mathematical algorithm. A DRAW declaration,
  menu label or legacy global-name call is not an owned Worker capability.

One row may be U in the legacy representation and S/N in the current owned part
representation. Neither classification waives the feature requirement.

## Exact disposition

| Finite obligation | Current source and actual domain | Disposition / remaining finite work |
| --- | --- | --- |
| Ordinary selected extrusion and cut | `A:modules/workbenches/modeler/features/workerSelectedProfile/workerSelectedProfile.operation.ts`, `engine/mount/selectedProfilePlan.mjs` (all `engine/` paths below are under `modules/`). Positive depth ≤1e6, current selected source/region, separate body; V3 Segment/full-Circle boundaries and separately admitted V4 circular cells. Cut is actual owned Boolean subtraction, not an extrusion `bodyPolicy` switch. | **Q** original plate and consumed Circle domains; Q owned cut/Boolean domain below. Negative/symmetric extrusion is **S** in this selected-owned schema: positive depth is explicit, no signed/symmetric field. Legacy `features/extrude/extrude.operation.ts` has signed vector plus `doubleSided` (origin −vector, vector ×2); **U** for this additional advertised lifecycle, not proof of current owned parity. Zero-depth refusal is already exercised; do not add duplicate ordinary plate qualification. |
| Through-all engineered holes / placement | `engine/solid/ownedHoleIntent.mjs`, `engine/mount/ownedThroughHolePlan.mjs`; only `centered-through` and `four-corner-through`. Exact current rectangular origin, strict containment/separation, genuine source/producer/build bindings; measured target AABB projected on source normal and bounded tool endpoints beyond it. It is not a saved arbitrary cylinder depth. | **Q** centered/corner, diameter/offset/source/depth propagation and rejected outside/overlap in IC/SHARED evidence. No blind/counterbore/countersink intent is admitted by this parser. Broad nonrectangular placement/automatic drill standards are not inferred. |
| Blind hole | Legacy `features/hole/Hole.operation.ts` exposes normal cutter diameter/depth, but creates a cylinder tool and returns `consumed:[]`; it does not select/subtract a current target or persist blind termination semantics. | Legacy cutter **U**, semantic owned feature **S**. **No new elementary Native cylinder primitive is inherently needed:** existing owned Circle extrusion + subtract can implement a bounded flat-bottom blind hole under one semantic feature. Need target/source/entry-plane/termination validation, intent, replay/J and public lifecycle. Manual two-feature tool recipe does not close this row. |
| Counterbore | Same legacy HOLE_TOOL combines two cylinders then returns the cutter; current owned hole intent has no counterbore dimensions/termination. | Legacy cutter **U**, semantic current route **S**. Existing owned cylindrical tools + Boolean are sufficient construction ingredients, subject to coherent one-feature plan and Native result/provenance checks. Require actual step shoulder, bore/counterbore diameter/depth edits and refusal, not merely two visible cylinders. |
| Countersink | Legacy HOLE_TOOL uses `pcone` and fuse with its bore cutter; diameter/angle form exists. That source is not qualified evidence for a correct countersink in a part. | Legacy cutter **U**, current semantic route **S**. No dedicated owned cone FFI exists. Existing V3 polygon face + owned revolve + subtraction is a potential **reuse**, not an already admitted hole operation; Native revolve permits one-sided axis contact and rejects crossing (`ownedRevolveV1.hpp::oneSided`). Freeze the actual conical/frustum termination formula and qualification before choosing reuse versus a narrow owned cone constructor. Do not copy the legacy cutter arithmetic as truth. |
| Tapped / clearance / thread | No tapped/clearance/thread kind in `ownedHoleIntent`; HOLE_TOOL form has only normal/counterbore/countersink. No shared thread command/owned request found in the reviewed inventory. | **S**, conditional **where exposed**, not falsely Q. Decide finite intended exposure before adding thread standards or helical manufacture; do not count an untyped oversize bore as a clearance specification. This is not a request for an advanced thread library. |
| Ordinary fillet / equal chamfer | `SolidKernel.ts::TreatSolidEdges`, real selection lineage and `solid.edge.treat`; `kind:'fillet'|'chamfer-equal'`, finite positive size. | **Q** actual fillet AND chamfer creation/edit travel, excessive/zero/stale/removed-edge refusal, source/depth replay and three `.cad` cycles (ET). Arbitrary curved-edge sets, variable radii, unequal chamfer and every vanished/merged topology class are not proved. Preserve those precise limits without reopening E11. |
| Ordinary inward shell | `engine/solid/ownedShellFeature.mjs`, `ownedShellWorker.mjs`; current producer, 1–16 distinct opaque removed-face IDs, positive thickness ≤1e6, `direction:'inward'`. Native `ownedShellV1.hpp` uses non-destructive `MakeThickSolidByJoin` with fixed intersection policy and construction tolerance1e−7mm. | **Q** genuine top-open box, exact selected constructor face, thickness/source changes, creation/edit travel, collapse/stale/removed-face refusal (SH), and actual80×50×30 useful enclosure (ENC). Outward/general thickening, every shape/wall/contact case and arbitrary face combinations are not qualified by a parser cap. |
| Draft | No authored draft descriptor/owned request in this inventory. Legacy `OCI.d.ts` advertises DRAW `draft`/`featdprism`; that is not a current shared operation. | **S+N** protected draft operation absent. Need finite neutral-plane/pull-direction/current selected face intent and actual Native draft history/result policy; do not substitute a tapered loft and call it draft. |
| Rib | No authored rib descriptor/owned request; legacy OCI declaration `featlf` names a rib/slot builder. | **S+N** protected semantic rib builder/binding absent. A rectangular extrusion+union alone is not a rib with support/termination intent. Ordinary thin planar rib is the bounded future domain; not arbitrary gusset automation. |
| Body mirror | `features/mirrorBody/mirrorBody.operation.ts` actually copies and `tmirror`s legacy BRep bodies around selected face CSys, using `SameTopologyProductionAnalyzer`. Current sketch Mirror is a different 2D generator. | Legacy implementation **U**; owned shared feature **S+N** (no owned solid transform/copy request). Require semantic plane/current body, handedness/orientation/validity and true lineage across mirror, creation/edit travel/Open. Sketch Mirror and equal coordinates do not prove body mirror. |
| Radial body pattern | `features/patternRadial/patternRadial.operation.ts` copies legacy bodies and applies actual rotation about chosen axis; step/span form, quantity/angle. `span` currently computes angle/qty per copy, so endpoint semantics must be frozen explicitly rather than presumed. | Legacy implementation **U**; owned route **S+N** for protected transformed copies/lineage. No shared radial feature capture/J/command/owned request. Do not relabel a linear hole pattern as radial. Initial ordinary axis/count/step intent suffices; no arbitrary lattice requirement. |
| Linear hole pattern | `engine/solid/ownedLinearHolePatternIntent.mjs` / `ownedLinearHolePatternPlan.mjs`: centered through-hole seed, `source-local-x-positive`, count including seed1..17; count1 explicitly refuses `UNSUPPORTED_IDENTITY_OPERATION`; derived cost2(count−1). Every new copy strictly inside source and separate from old/new bores. | **Q** IC count3→4→3, seed/spacing/source edits, creation/dimensional travel, overlap/outside preservation, Open/reedit and actual seven-bore artifacts. Count cap is schema/resource domain, not witnessed success for17. General body pattern/cut pattern or seed-only identity remains separate; no claim all counts/contacts pass. |
| Split a solid | Legacy OCI declares `bapisplit`, `bsplit`, `splitshape`; surfacing `ops/split` is a surface tool. Current owned Boolean common/subtract create one reported result each; no split feature returning authenticated pieces with one shared source intent. | **S+N** dedicated protected split/result-and-lineage binding absent. Existing common/subtract may be reusable for a finite plane split, but two independent cuts are not an already implemented semantic split. Need piece ownership, exact all-pieces policy and downstream-reference handling; not just equal positions or UUID retention. |
| Solid offset / surface thicken | Legacy shell calls `offsetcompshape`; OCI declares `offsetshape`, `offsetshapesimple`, `thickshell`. Current owned shell requires removed faces/inward solid shell contract; no general open-surface thickener/general solid-offset request. Source-only semantic sketch Offset packet is 2D and unqualified. | **S+N** general protected binding absent, with existing offset kernel implementation a starting point. Do not count top-open inward shell as arbitrary offset/thicken or 2D generator offset as 3D offset. Freeze one ordinary face/surface, side/thickness/self-contact and provenance policy; preserve all source. |
| Ordinary revolve | Owned revolve retains actual source Segment axis and signed nonzero radians abs(angle)≤2π; crossing-axis rejects, real current selected region. | **Q** actual six-Segment stepped full/half source and creation/edit travel (RV), plus separately measured rectangular ±π/refusals. Source step radii/heights/axis are independently checked. Arbitrary curved profiles/all axes/asymmetric contacts are not implied. No new revolve primitive needed for the qualified ordinary domain. |
| Ordinary sweep | `ownedSweepIntent`, `ownedSweepPlan`, actual directed Segment/open Arc path, `corrected-frenet`, separate body. Schema cap128 curves is expressly NOT Native chain capability. Full Arc source heuristic and attachment/normal guards remain explicit. | **Q** disk/annulus straight and asymmetric quarter-Arc forward/reversed, current actual source/path edits and creation travel (SW). Unsupported Circle path/non-normal attachment/build refusal already observed. Cusp/multisegment/guide/twist/general closed-path success is not proved; freeze finite expected refusal/required extension rather than claiming path-array cap supplies it. |
| Ordinary loft | `ownedLoftFeature`: exactly two ordered distinct source planes, explicit vertex or Circle-angle seams/reversed traversal, `ruled-solid`, separate body. Native correspondence receives actual source sections. | **Q** unequal rectangles with genuine creation travel/current `.cad` and independent section integral (LF); actual unequal Circle seam-phase cases separately checked. Zero/coplanar/stale failures are recorded. Arbitrary section count, automatic matching or arbitrary twist/reversed seams remain outside that proof; no missing primitive for the accepted ordinary taper. |
| Combine / Boolean | `solid.boolean.union/common/subtract`, private owned operand custody, explicit strict Join versus raw union result policies. | **Q** E16 finite OCC union/cut/common/Join, empty/multi/cavity, source/creation travel and current archives (BH). Not a split feature or blanket manifold-contact/engine-parity proof. Existing point/edge-contact competency gap remains distinct. |

`A:modules/engine/solid/SolidKernel.ts` and `solidLedger.mjs` provide the bounded
owned request/dispatch census. `A:web/app/cad/craft/authoredEditJournal.mjs`
scalar family table names the existing selected extrusion, through holes,
revolve, sweep, loft, treatments, shell and linear-hole pattern records; it does
not supply the absent feature intents above. `A:modules/workbenches/modeler/index.ts`
actually advertises HOLE_TOOL/MIRROR_BODY/PATTERN_RADIAL/SHELL_TOOL in the legacy
toolbar. `workerGeometry.ts::requireLegacyPointer/assertLegacyGeometry` refuses
Worker representations: do not assume those legacy implementations can consume
current owned solids or silently convert them.

Native source was also read, without executing it, from the authorized LAN
repository `occt-interpreter-codi.git`, branch `feature/owned-shell-v1-20261107`
(the retained shell cohort, commit2f10f1e1ee04bd0a81ad828404511287f590fdec):
`shape-io/main.cpp`, `ownedRevolveV1.hpp` and `ownedShellV1.hpp`.
Those establish the actual retained owned builders, not an assertion that later
Native source has no additional internals. The **current Core** request/mount/
controller/ledger census independently determines which protected operations
are exposed now. `OCI.d.ts` declarations at draft/featlf/tmirror/bsplit/offset/
thickshell establish potential legacy kernel reuse only, not runtime tests or
qualified owned bindings. A new protected operation still needs explicit build
admission, source/provenance and Native input/name-preservation/resource proof.

## Primary evidence addresses (preserve producing scope)

These are actual retained complete receipts and oracle artifacts, not new runs.
Primary receipt rows were read for IC/SH/ET/LF and Desktop RV/SW; executing source
and referenced qualifications locate the remaining exact policy assertions.

| Key | Producing evidence and precise observation |
| --- | --- |
| IC | `A:test/original-rectangle-workflow/evidence-r1/{receipt.json,mesh-oracle.json,step-reader-summary.json,README.md}`; Core90e3419092d44857a654a7b5a36e4851b593c8a8 / Desktopfa1ca19f34d1edfc5de82a00633a1031ceb62230;50rows/four native JSON saves. Pattern creation UndoRedo, width/depth/seed/count travel and overlap/outside preservation are named rows. Actual7bores/fourfillets are checked in exported geometry. |
| ET | `A:test/fillet-chamfer-public-workflow/evidence-r1/receipt.json`, `QUALIFICATION.md` and independent oracle there; actuald7900110d3bc8e9ef0a0da5e871ea7d93a4015e5 /3ce2fec559b42cd1f56321bed0acd3edd914dbed.52records/975 Native classes/three `.cad`; direct creationTravel entries for both treatment kinds. This supersedes the earlier review's missing fillet-creation observation, not its historical receipt. |
| SH / ENC | `A:test/owned-shell-shared/acad-evidence-r1/receipt.json`:61rows, native JSON, b053638/ec98dcce9, explicit57b74074/60dc956b Native.100×50×20,t2→20512; t3→29688; source120×60×25, reopenedt2.5. Actual creation Undo/Redo/mixed rows and collapse/stale refusal preserved. `D:test/agent-cad-corpus/source-bound-enclosure/evidence-r1` supplies actual80×50×30,t2 body22112 plus separate printable lid/inset label and independent3MF/source checks. |
| RV | `D:test/agent-cad-corpus/revolve/stepped-evidence-r1/{receipt.json,oracle.json}`, `STEPPED.md`, plus `stepped-read-evidence-r1`; historical73c888/36b8a681 step14rows/four JSON files, genuine creation Undo/Redo and stepped radial height-band oracle. Retained current READ b3a7bb2/78cc pins its actual historical backend; not evidence every save was `.cad`. |
| SW | `D:test/agent-cad-corpus/sweep/{signed-point-evidence-r1,read-point-evidence-r1}/{receipt.json,oracle.json}` and signed-cases/source checker; fourcases/113rows/12JSON files/77actual classes. Read regression b3a7bb2/78cc, explicita9cfa6e5/e105bdfe. Root `A:docs/reviews/ORDINARY-E14-SIGNOFF-20261108.md` binds original successful creation/source/attachment lifecycle; old README “unqualified” headers are source-era, not current reversals. |
| LF | `A:test/loft-creation-public-workflow/evidence-r1/{receipt.json,independent-oracle.json}`, `QUALIFICATION.md`: actualb09718518965f1c47a0ca9a169f91316505cb594 /00e12613a55ab4ce4df919d1ae0a63a0066625c0,77records/three `.cad`/250Native classes, explicit adaptiveed06b634/bc8895ce. Creation to zero bodies, same-ID Redo, width/plane edits and coplanar refusal directly recorded; section-integral oracle independently87500baseline. |
| BH | `A:test/occ-boolean-public-workflow/evidence-r4`, proof7680027; root's ordinary E16 acceptance5100922. Genuine cut/common/union/Join and empty/multi/cavity, three `.cad`, actual Native material/void and operand/creation travel. Do not substitute old display-ray-only Boolean packets for these native observations. |

Historical JSON and current `.cad` remain separate evidence roles. None of the
above turns the new e2a3027 known-defect composition into a qualified release.
Source50pm (5e−8mm), actual Native metric/shape budgets and mesh approximation
bounds remain distinct; this review changes none.

## Recommended next smallest complete ordinary part

**Semantic flat-bottom blind hole on the existing genuine rectangular plate.**
It closes the smallest unconditional missing feature rather than requalifying
through-all or inventing a proxy. Reuse the accepted owned profile/tool/Boolean
pipeline, one authored feature/J and current exact engine. Initial finite domain:
source-derived top entry, source-local center or explicit offsets, diameter4,
axial depth6 in a100×50×20 plate. Independent removed volume24πmm³,
result100000−24π; actual material below the floor and void above it distinguish
blind from through-all. Entry placement/axis is actual source/Native-bound, not
parsed topology ID, nearest face or a caller-supplied solved frame.

One future complete public flow should discover authentic target/entry/source,
create, immediately Undo/Redo the SAME feature, edit depth6→8 and diameter4→6,
edit parent thickness20→25, verify unchanged depth-from-entry intent and actual
floor/material locations, mixed travel, and refuse nonpositive dimensions,
excess depth/collapse, outside placement, stale/foreign source/build and lost
parent without mutating accepted source/J/resources. Save actual `.cad`, verify
browser/server bytes, fresh Open/reedit/resave/second Open; independent archive
source/semantic fields, analytic volume/bounds and real Native material/void
queries. No manual cutter seed, fake successful Native response or second graph.
A future explicit hole feature may then add counterbore and countersink with
separate real shoulder/conical floor assertions; those rows stay open until then.

Before product authorization, freeze whether positive blind depth may equal
thickness (recommended initial refusal, through-all remains a separate kind),
entry termination semantics, stable support ancestry and finite error codes.
This is a bounded implementation proposal, not a product change or qualification.
Signed/symmetric owned extrusion and the S/N rows above remain required work;
choosing blind first does not waive them. Only conditional thread exposure needs
a scope decision; the other missing rows are not erased as “unsupported.”
