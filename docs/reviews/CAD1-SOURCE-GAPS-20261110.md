# CAD 1 source-gap reconciliation — 2026-11-10

Source/document review at ACAD `53955790` and Desktop
`ad652be65f67e4078b2c46920eba841ebe6c67f9`. This record adds no scope,
qualification, test result, runtime change or deployment. It supplements the
operational front door `docs/handoffs/CAD1-CURRENT-GOALS.md`; later actual
receipts supersede the runtime-status observations here.

## Contract and evidence rules

The canonical Desktop `docs/CAD-ENGINE-GATE-1.md` retains the 21 ordinary
exercises, eleven in-scope competencies, original-rectangle chain, shared
human/agent authority, resources and final composed delivery. Its competency
matrix and numbered dimensions/features/validation requirements are the scope
authority; `docs/evidence/CAD-GATE1-BASELINE-20261106.md` is the canonical status
ledger. E17/C10 assemblies remain Gate 2. Historical qualified examples do not
prove the newest composition, and an older missing label cannot override later
implemented code or a later scoped pass. The Core finite remaining map
`docs/reviews/GATE1-REMAINING-CONTRACT-MAP-20261108.md` is a dated requirement
index, not a new authoritative status matrix.

## Concrete remaining source seams

| Seam | Actual current evidence | Bounded next action and acceptance |
|---|---|---|
| ARC23 dirty/source costs on Main | Desktop `apps/system/jsketcher/index.mjs` `snapshot`/`unchanged`/`state.hasChanges` serialize complete project envelopes. Its inspection constructs `savedModel` by JSON clone and parses sketches; native Save captures another `snapshot`. These costs are explicitly disclosed in that source and Core `web/app/cad/projectManager/projectManagerBundle.ts` beside `prepareHostNativeArchive`. `test/native-cad-container/evidence-r6/README.md` qualifies small-file functionality while leaving large capacity/peak memory/main-thread costs open. | Replace repeated complete dirty serialization with authoritative document/revision tracking and bounded Worker comparison where byte equivalence is required. Preserve saved-baseline identity, undo-to-saved semantics, document replacement, currentness and actual save settlement. Then one representative-size Save/change/Open/export workflow must measure main-thread gaps, live/peak ownership, unchanged-content reuse and cleanup. Existing codec-Worker retirement is not physical peak-RAM proof. |
| C04 ArcLength and broader measurement roles | `web/app/sketcher/actions/lengthMeasurementPreparation.js` discovers `Segment` and `SegmentLength` and constructs `LinearDimension`; its target validation explicitly chooses a Segment/ruler. `web/app/sketcher/headless/lengthMeasurementTransition.ts` and `lengthMeasurementIntent.mjs` preserve that bounded route. The current source review found no public ArcLength schema/measurement transition. Radius-times-sweep derived evidence does not establish a driving ArcLength dimension. Canonical dimensions requirements name arc distances and driving/reference roles; the remaining-map C04 row identifies this precise distinction. | Define a finite authored ArcLength contract: current Arc/branch ownership, units, selected interval, driving versus reference behavior, typed dependencies and domain/failure semantics. Use the same transactions/history/Worker pipeline. Add equations/derivatives appropriate to the chosen unknowns; do not persist a synchronized measured-value flag as a driver. Qualify creation/edit/removal or role conversion, contradiction/refusal, both history directions and native Save/Open through public operations. General angular/circular/projected role conversion is also not implied by the existing Segment route. |
| C06 named features versus current owned routes | `modules/engine/solid/solidLedger.mjs` `evaluateWorkerSolid` has an explicit capture dispatch for box, Boolean, profiles/extents, revolve, sweep, loft, edge treatment, shell, countersink/counterbore/blind/through holes and linear-hole pattern. That dispatch has no draft, rib, body-mirror, radial-pattern, split or offset/thicken kind. Canonical feature requirements and remaining-map C06 name those operations. Legacy action/menu implementations are not automatically shared owned operations; this review does not establish that every alternative route is absent. | Owner first reconciles each named operation against actual registered alternative routes and unconditional versus conditional/where-exposed scope. Implement the smallest genuinely required missing semantic route through existing ownership/history APIs, with meaningful ordinary geometry and edit/refusal/travel/Open evidence. Do not add all advanced variants, and do not silently turn an unconditional success requirement into an unsupported PASS. |

The first two are observed implementation limitations. The third is a confirmed
gap in the inspected owned dispatch and a required capability-disposition task;
it is not a claim that the whole repository lacks every listed legacy tool.
No global DOF, arbitrary-scale or universal numerical-validity theorem is added.

## Older missing labels already superseded

| Older label | Current source/evidence disposition |
|---|---|
| EqualLength/ratio editing/removal missing | `test/equal-length-public-workflow/evidence-r3/README.md` records the finite qualified shared lifecycle, whole and FIRST on its exact Core/Host pins. Preserve failed R1/R2 evidence. Broader typed/named relations and the current composition are separate obligations. |
| Semantic Segment/Circle offsets missing | `test/semantic-offset-public-workflow/evidence-r1/README.md` records source-owned side/distance/source edits, dependencies, native persistence and FIRST PASS. Arc/chain/loop offsets and solid consumption are not inferred. |
| Center-center distance/true parallel offset missing | `test/center-distance-parallel-offset-workflow/evidence-r1/README.md` records actual Circle center distance and whole parallel Segment support offset with independent equations and native persistence. Do not replace this proof with the older absence row. |
| Drawing datums/position/finish/fit absent | Current `modules/drawing/linkedPartDrawingDefinition.mjs` parses baseline/ordinate/callout forms and position-tolerance/surface-finish/clearance-fit requirements. These are implemented schemas/consumers; old claims that only three orthographic bases and simple dimensions exist are stale. Root must map actual later drawing receipts to each finite requirement. Schema existence alone does not qualify the current assembled output or all standards. |
| Sketch patterns absent | Current source generator and shared commands exist. `test/sketch-pattern-reference-workflow/evidence-r3/README.md` records whole plus independent FIRST for the numeric pattern/ruler/dependency lifecycle. Generated-profile B-rep, typed patterns and arbitrary generator combinations remain outside that scoped proof. |
| Rectangle arrangement/shared-edge contact absent | Historical `test/rectangle-arrangement-public/evidence-r2` and `test/finite-planar-contact-workflow/evidence-r1` contain scoped proofs. R5 is a separate current native-archive whole; its actual terminal receipt determines that result. Do not overwrite older evidence or infer current PASS from historical JSON. |

## Source-complete packets ready for grouped qualification

1. **Associative source projection.** Current Core/Host operation, replay closure,
   public example and complete workflow are integrated. See
   `test/associative-source-projection-workflow/{README.md,CONTRACT.md,SOURCE.md}`
   and `docs/reviews/ASSOCIATIVE-SOURCE-PROJECTION-CLOSURE-20261110.md`.
   The frozen packet requires 41 observations, real edit/refusal/history paths,
   three native Save/server/fresh-Open cycles and three DXF artifacts, followed
   by its independent source/archive/equation/DXF checks. Its bounded reference
   projection does not claim consumed projected solid profiles, arbitrary B-rep
   projection, Arc/ellipse projections or projection chains. Source readiness
   is not a current whole-flow PASS.
2. **Aligned drawing dimensions.** The Worker-owned layout/index/router packet
   is integrated; see `docs/reviews/DRAWING-ALIGNED-DIMENSIONS-SOURCE-20261109.md`
   and the later entries in the current-goals handoff. It preserves authored
   values/references and reports derived layout uncertainty when bounded clear
   placement is not established. Fixed source labels are not silently moved,
   shrunk or hidden. Current drawing workflow artifacts and visual/independent
   checks must demonstrate the composed packet; an old drawing regression
   does not certify this changed planner. Existing uncertainty/resource bounds
   are explicit limitations, not proof that no valid layout exists.

R5 rectangle completion and the twice-failed analytic FIRST reader are owned by
Root's separate retained workflows and stop rules. This record does not request
their restart. Group related implementation first, then run complete affected
workflows; no per-edit test campaign, filesystem race or cross-account probe.

## Queue disposition

Finish already assembled grouped workflows and preserve their actual outcomes.
Use their independent artifacts to close only the requirements they exercise.
Then prioritize the Main-thread source seam and explicit measurement/feature
dispositions above, reusing mature library algorithms where they fit. Reconcile
the canonical competency ledger against current evidence before final resource,
combined beta, agent-example, handoff and backup qualification. This document
neither enlarges Gate 1 nor narrows it to the currently passing examples.
