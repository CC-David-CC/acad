E22 linked manufacturing drawing: source audit and implementation proposal

This is a read-only plan at CAD45000c06d4d8d2376b29cf17da2aa5a2e38ce324. No projection was built/run, no native success is claimed, and no browser, account, service, product, catalog or default was changed. CONTRACT.md proposes the smallest shared end-to-end stage; ACCEPTANCE.md lists its outstanding proof. It is not E22 completion.

The first stage should be one linked, source-bound plate with a genuine through hole, three orthographic views, overall/source-datum width and height, thickness, hole diameter and center location. The same linked contract should then handle a qualified bracket. Drawing commands are shared product commands; an eventual human surface calls those commands. Detail/section views, GD&T, assemblies and general arbitrary-edge dimensioning are later capabilities. A render-only screenshot or detached DXF cannot satisfy this stage.

Verified application seams

| Current source | Observation and consequence |
|---|---|
| web/app/cad/projectManager/projectEnvelope.mjs | Current native envelope is `codi-jsketcher-project`, version2, mm. Root/model keys are allowlisted. It saves authored history, expressions, sketches, optional surfacing/manufacturing/presentation. There is no drawing field; arbitrary extra keys cannot be used as persistence. |
| web/app/cad/projectManager/projectManagerBundle.ts:347–418 | Snapshot captures real project/sketch definitions, not accepted meshes/handles. Manufacturing save guards document, history, source/storage and presentation through async work. A drawing extension must use the same capture/currentness and normal native Save/Open path. |
| web/app/cad/projectManager/displayUnits.mjs | Inches are presentation metadata; lengths/areas/volumes remain canonical mm-based values. Drawing page scale and text units must not resize part geometry. |
| web/app/cad/craft/authoredEditJournal.mjs | Bounded shared journal, document/revision custody, explicit entry kinds and full replay/publication. Drawing edits need an explicit coordinated kind, not a separate agent-only history. Current journal is runtime undo state, not a saved drawing schema. |
| web/app/cad/craft/workerSolidPointCommands.ts | Captures exact current producer/build/history, all bounded sketch bytes and frames, then calls a private shared evaluator. Initial support is exact sweep build/current authored tip/native-local constants/unplaced single solid. Reuse its ownership pattern; do not pretend its current capability set is already generic. |
| web/app/cad/craft/craftBundle.ts:1071–1213 | evaluatePipeline reconstructs actual features in candidate-owned resources. Exclusive point observation uses pipelineTail, restores MObjectIdGenerator context and closes resources before returning. Extend that private observer seam; do not copy a feature executor or borrow accepted handles. |
| modules/engine/solid/solidLedger.mjs | Owned mounts/handles and selection snapshots belong to an evaluation owner. Native read must occur before that candidate closes. Source-binding/currentness and measured metrics are separate from display. |
| web/app/cad/model/mworkerSolid.ts | Accepted output has transferred Float32 display custody and verified measurements; `quality:'display-only'`, `editableTopology:false`. It is not the exact drawing source. |
| modules/engine/mount/prismSelectionIndex.mjs; selectionLineageIndex.mjs; SolidKernel.ts | Authored keys resolve privately to current native ordinals. Same/modified must yield a unique descendant; splits, merges and deletion become explicit unresolved rows with first-failure identity. Region/context IDs are opaque. Generated/unclaimed entities do not acquire persistent IDs automatically. |
| modules/engine/solid/ownedHoleIntent.mjs; ownedLinearHolePatternIntent.mjs | Hole/pattern definitions retain semantic source/target/seed parameters, not solved tools. Existing generated hole rims/walls remain unclaimed in inherited selection plans. Source contexts alone are not a causal native dimension witness. |

No owned hidden-line/drawing operation appears in SolidKernel or the inspected main FFI. Existing `modules/engine/projection/*` files assemble product display/model results; they are not a manufacturing hidden-line export. Existing sketch Canvas/Worker view surfaces are also a different capability.

Verified native readiness, not execution

The retained OCCT tree is `/mnt/data10tb/codi-occ-four-corner-source-20261104/occt/src`; Standard/Standard_Version.hxx identifies7.6.0. The build include files are short forwarding includes into that source tree, not the implementation headers themselves. Actual paths:

- HLRBRep/HLRBRep_Algo.hxx:82/87 Add; its documentation specifies Projector→Add→Update→Hide and distinguishes shape-based exact HLR from polygonal PolyAlgo.
- HLRBRep/HLRBRep_InternalAlgo.hxx:49/55/112 Projector, Update, Hide.
- HLRAlgo/HLRAlgo_Projector.hxx:59 `HLRAlgo_Projector(const gp_Ax2&)` is orthographic/axonometric; the focus overload is perspective and is outside this first stage.
- HLRBRep/HLRBRep_HLRToShape.hxx:74–132 exposes visible/hidden sharp, smooth, seam and outline compounds and per-shape extraction. Results are new projected edges, not source shape members/persistent IDs.
- HLRBRep/HLRBRep_HLRToShape.cxx:62–101 shows per-source-shape filtering through actual native EdgeMap/FaceMap. This is a candidate provenance seam to qualify, not evidence that every split/silhouette has a durable source identity.
- `/mnt/data10tb/codi-occ-four-corner-clean-20261104/build/lin32/clang/lib/libTKHLR.a` exists (2,618,554bytes). The inspected native `scripts/build-selected-profile-v2.sh` already lists `-lTKHLR`; this does not prove new HLR symbols survive linking or a browser export works.

Native source cautions matter: HLR warns that superimposed lines are not eliminated, points are not treated, and exact HLR can be expensive. "Exact" here distinguishes BRep-analytic computation from mesh projection; it does not mean arbitrary-precision or a tolerance-free visibility certificate. Never dimension from a mesh/silhouette sample or silently deduplicate unrelated coincident lines.

Read-only native pin observations

| Input | SHA256 |
|---|---|
| Standard/Standard_Version.hxx |5bed2553cadb26534cce1549f998e8be91682a541005e65f871ba3f3bcaba187 |
| HLRBRep/HLRBRep_Algo.hxx |3c27092f0a28f0fe8da9c74588a72448f15fc5ad680050ae394ef4c46d949aac |
| HLRBRep/HLRBRep_InternalAlgo.hxx |e2a943952655b1c1c814befcee8f44ec80c96b210170d9cd0df4cad7fb94e7db |
| HLRBRep/HLRBRep_HLRToShape.hxx |e6e8f0497842289201e7b3f8cfec3be726da763e96f11708cc4fde8055178f5f |
| HLRBRep/HLRBRep_HLRToShape.cxx |f33c50599e52e5bc1897a064bb67edef5431253c643710efdc6ad53802727c5c |
| HLRAlgo/HLRAlgo_Projector.hxx |53bb6255144173dd10f45556b9e9729cb7bb8d6da2d47374dde9a426c5508cad |
| libTKHLR.a |62e25a7f3f48057daa8d1cca1abe32493fab9a669bd1071bdd46b58967474bb5 |

These are inspected retained inputs only. No native build/runtime hash is minted by this audit. The native source worktree inspected for existing exports was e031f5378a35f32f0355bec7e3e526764b8dfb8c; newer experimental source branches must be selected explicitly for implementation, with their own exact build pins.
