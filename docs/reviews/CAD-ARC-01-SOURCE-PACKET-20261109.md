# CAD-ARC-01 authored branch: source packet and integration boundary

2026-11-09. SOURCE ONLY; no parser, import, solver, compiler, Native, browser or
runtime checks were executed for this packet. Approval is8fda31f614244fd829a73594f5c102e6c8e46860,
following BEFOREa9a4001 and its independent review. This is not a qualification
or a claim that the required Native analytic boundary bridge is implemented.

Core product:2c1d979ee03738896d3dce5cd524d7b4c088945e on
fix/authored-arc-branch-20261109, based exact8fda31f. Desktop:
0b02c0318c51675587f94db65819bbc17e502c5d on
fix/authored-arc-branch-host-20261109, based4d555e1a06c6c3f3630dadd570d63d4f36756c9e.
Both are isolated R730 worktrees; Root/common source and frozen proofs are untouched.

## One source contract

Every saved ordinary or analytic boundary Arc has data exactly
`{a:{x,y},b:{x,y},c:{x,y},branch:'proper-ccw'|'full-ccw'}`. Circle remains a
separate entity. Missing/unknown branch on loaded or verified source refuses;
there is no migration/default on IO/Open. Only NEW public primitive authoring
and the new Arc constructor intent may default to proper. The two private
append transports below must require the already captured branch.

| Authored state | Actual finite endpoint condition | Accepted meaning |
| --- | --- | --- |
| proper-ccw | nonzero radial vectors, distinct positive rays | exact endpoint-defined CCW sector; minor/semicircle/major derived |
| proper-ccw | same positive ray or center endpoint | invalid; never silently full |
| full-ccw | nonzero radius and exact a/b coordinate equality | one full CCW turn, with genuine full-only seam equations |
| full-ccw | unequal endpoints | invalid; never proper or approximately closed |
| private AddArcTool draft | zero/unfinished geometry | service preview only; absent from stages/source/J until valid Finish |

The canonical leaf modules/engine/extrusion/authoredArcBranch.mjs implements
bounded exact binary64 dyadic cross/dot/half-plane decisions (<4300-bit fixed
intermediates). It stores no cache/authority. Sketcher shapes/arcBranch.mjs is a
re-export facade. Numeric atan2 chart/sweep and displayability are derived;
unrepresentable proper charts remain explicitly unavailable, not zero/full.
Radius/domain/residual/admission policies retain their existing units and
bounds; exact sector decisions do not assert exact solver equations or global
DOF. No seed setting is added: deterministic current initialization is unchanged.

## Implemented consumers

- shapes/arc.ts owns serialization/copy/Mirror/picking/drawing. Full rendering
  uses a canonical whole-turn chart. An unavailable proper chart emits an
  explicit notice; radius labels use its genuine start endpoint rather than
  inventing a midpoint. Existing root/child/Param identities stay authoritative.
- io.ts and headless/sketchValidation.ts require the enum before adoption;
  generators/boundaryGenerator.js carries it explicitly. Existing NURBS data
  is not subjected globally to the stricter analytic-only boundary policy.
- constr/ANConstraints.ts adds bx-ax/by-ay ONLY for actual full Arc objects
  through the existing fourth collectPolynomials objects argument. The four
  original support equations, registered original-equation validation and
  solver-derived classifications remain. ordinaryEntityDomain,
  registeredConstraintPolicy and verifiedReplayGeometry enforce the declared
  branch; replay compares branch and exact sector before numeric chart bounds.
- fixedEntityDomain compares full/proper CLASS exactly before numeric FixArc
  sweep comparison. A near-full proper cannot match a literal TAU Fix witness.
  curvedBoundaryPolicy compares enum in fixed and retained-source checks.
- primitiveTransition/closedSketchTransitions capture actual new intent;
  independent append reconstruction and original-source/cold/captured proofs
  remain. No task/service/Worker routing is edited here.
- renderSketchProjection/acceptedSketchProjection, cad/sketch/sketchReader and
  sketchModel, io SVG and dxf export consume the same branch. Explicit full
  exports a circle, not a zero-endpoint SVG A command. DXF imported partial
  arcs explicitly create proper. The EllipticalArc policy is unchanged/open.
- Mirror native copying/stageGeneratorPolicy, StraightSlot cap creation,
  fillet-tool new Arc creation, finite tangency and selectedSketchSweepPath
  carry/check actual branch. Full is not accepted as an open sweep path.
- finiteCurveSourceExtraction now authenticates the explicit branch. Current
  raw Arc tag remains proper-only: full refuses without promoting identity to
  Circle. Exact radius incidence, actual Params, original source and two
  independent request extractions remain. finiteCurveFiniteCertificate removes
  only the obsolete1e-6 proximity ambiguity gate; its exact arithmetic/census,
  candidate/error/work/domain policies and lack of source authority remain.

### Actual draft lifecycle

AddArcTool now keeps its own draft only in the existing service drawing layer.
No early coincidence row is authored by a snap. Finish checks actual accepted
source bytes, stage/layer/index/snap identities, then uses the existing
runSketchTransaction recovery boundary to add the genuine Arc/intrinsic and
queued PCoincident rows. Validation checks actual newly owned intrinsic/snap
rows, finite Params, existing registered domains and original polynomial
residual policies. Prior rejected rows retain the existing recovery semantics.
Cancellation checkpoints only accepted geometry and discards this exact preview.
Stale handlers do not publish or reset a replacement tool/document. Refresh is
presentation notification, not another solve; no private Worker success flag or
parallel history was introduced. Literal `full` is explicit tool intent;
coincident/proximate mouse endpoints never select full.

## Required Root splices BEFORE build

1. In headless/transitionClient.ts import captureArcData from
   ../shapes/arcBranch.mjs. BOTH existing primitive data captures must replace
   their Arc ['a','b','c'] stripping with mandatory captureArcData(p.data) or
   captureArcData(primitive.data), retaining their existing bounded coordinate
   point checks. Exact result fields are a,b,c,branch. Do NOT use
   captureNewArcData in either private verification/transport capture. Root has
   reserved these two additive edits alongside its finite-query task changes.
2. For actual public branch discovery, headless/closedSketchInspection.ts may
   add branch ONLY to Arc object rows from the verified sketch's actual data;
   other object rows remain id/type/role/stage. inspectionClient.ts must choose
   exact Arc keys id/type/role/stage/branch after inspecting the own-data type,
   captureArcBranch, freeze the row, retain current reply/count limits. No
   caller branch proof or new editable cached field; this is read-only metadata.
3. Retain the canonical engine leaf and facade in source snapshots/producer
   rosters. The sketch solver/renderer bundles and semantic sweep Worker now
   transitively depend on them. Current selectedSketchSweepPath is a bundled
   semantic-worker dependency, not a Native owned runtime root: do not invent
   a requirement to copy the sketcher app graph into every Native graph. If a
   verbatim resource list retains either importing source, it must include the
   actual relative canonical leaf (preserve its path or rewrite both imports).
   Rebuild the real bundles/closures and compute actual resulting digests;
   this packet changes no catalog/native/bootstrap pin or pair/default.
   The shape-free raw query NativeCalls→ReadProtocol closure stays exactly
   those two leaves; the certificate is separate pure semantic work.
4. Compose the thin Desktop primitive capture commit once. No index change or
   new command registration is needed. Preserve registry description/schema
   byte limits; no limit increase or runtime sizing claim is made here.

These are explicit integration obligations; producer source alone is not
shipping capability. Root's source-only df6d8ad task routes and76df950/0c0321e
catalog/build changes must survive additive composition.

## Genuine Native analytic boundary bridge remains required OPEN

Legacy cad/sketch/sketchBoundaries.js had only generic NURBS samples,
derivatives/findArcRadius and proximity closure, with no private owned trim
receipt. Per explicit Root approval, this packet removes unsupported Circle/Arc
promotion and preserves the actual transformed serialized NURBS and exact edge
reference. Lines remain lines. No real curve is dropped or replaced by an
inferred analytic shape. Strict analytic consumers can truthfully refuse this
unqualified provenance; this is not a positive Arc-boundary bridge claim.

Root-owned future async handoff must bind the actual current owned result,
opaque indexed face/edge selection, source frame and source/geometry revision;
read genuine analytic support basis/radius, actual edge trim/range/orientation,
vertices, wire/cap incidence and full/proper topology from the SAME owned
Native context; then supply protected boundary data to the synchronous
getSketchBoundaries/BoundaryGenerator path. ownedTopology/selection data may
supply ingredients but no existing protected edge-trim packet is known.
nativePlanarAttachment is plane/frame only. Parameter range or sampled closure
alone is insufficient. Unknown read/currentness/cleanup outcomes stay outer
failures. Do not synthesize a public flag or a fake analytic receipt.

Ordinary selected-profile Arc boundaries (ARC-PROFILE-01), full-Arc raw query,
that positive native boundary handoff and EllipticalArc branch semantics remain
explicit required work. This packet does not relabel them unsupported forever
or close the full Gate1 contract.

## Frozen complete qualification requirements

Root must prepare/run one complete public authoring/edit/Finish-Cancel/travel/
.cad/server/fresh Open/export workflow after coherent source review. Preserve
first whole failures and affected prior positive/refusal families. Source-owned
expectations are frozen before execution:

- Ordinary radius10 quarter, tiny radius1e-7 quarter, semicircle,
  seam-crossing minor, major/near-full, distinguishable near-zero, explicit
  full Arc and a genuine Circle; keep unrelated accepted geometry exact.
  Tiny sketch representability is not tiny Native solid qualification.
- Actual enums/IDs/roles/stages/endpoint membership/source equations and local
  admissions survive radius/coordinate edits, Mirror, Fix/remove, creation
  Undo/Redo, mixed travel and three normal .cad save/browser/server equality/
  fresh signed Open/reedit cycles. Raw names in typed bindings remain names.
- A valid full seam edit may move coupled A/B through real equations; do not
  assert an impossible unilateral endpoint lock. Test genuine contradictory
  off-seam intent with actual retained locks, plus invalid full creation with
  unequal endpoints. Zero proper/same-ray, unknown/missing branch, stale and
  conflict controls must preserve last-good source/J/body/material/ownership.
- Real tool gestures prove zero private preview cannot enter accepted source;
  actual Finish adds one shape/its real rows atomically, actual Cancel adds none,
  and stale document/tool handlers cannot affect their replacements.
- Independent artifacts verify finite sector endpoints/cardinal inclusion and
  major/minor/full classification, visible SVG/DXF geometry, projected/picked
  sectors and proper unavailable notices; a count/label/fullCircle flag alone
  is not geometric proof. Preserve source50pm separately from declared
  Native/BRep/mesh/chord budgets; no global epsilon replacement.
- Malformed current .cad negatives must have correct CRC/SHA/design and
  domain-separated manufacturing revision before branch/schema rejection.
  Use the proven own-write settlement/readback custody. Literal-empty physical
  presentation revision remains null; typed-ready presentation is separately
  bound. No fake positive source seeds, parsed opaque IDs or substituted body.

No full acceptance driver or runtime evidence is claimed by these source
commits. Affected old evidence remains immutable; Root owns preparation and
whole qualification, including the still-missing positive Native bridge.
