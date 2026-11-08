# E22 linked drawing: actual reference repair travel and current .cad/SVG

## Source correction after retained whole R4

The retained R4 reached width150 edit and its Undo/Redo, then correctly refused
the impossible hole with `HOLE_OUTSIDE_PROFILE`. The raw state differed at only
epoch8→9 and five linked inspection revisions. Public `drawing.revision` is
the current document token, not the private drawing-definition counter. See
`docs/reviews/DRAWING-REFUSAL-REVISION-R4-20261108.md` (review61ae816); original
R1–R4 evidence and their producing sources stay unchanged.

This CURRENT full packet independently checks the following in both its driver
and after-whole Python oracle, without importing a production predicate:

* Old drawing revision and malformed scale are pre-candidate refusals: the
  COMPLETE captured state, every token and epoch must remain exact.
* The impossible hole is the sole candidate refusal: require exactly epoch+1,
  nonempty bounded document/geometry tokens, actual host/drawing document-token
  equality and solids/drawing geometry-token equality before AND after, and
  invalidation of both old tokens. The journal must retain its exact source-bound
  generation/revision header and change ONLY its document-token suffix to that
  new document token. No arbitrary new journal revision is permitted.
* Only after those checks may the six precise paths be excluded from the
  remaining exact comparison. Definition/source/history/body/metrics, J travel
  targets, counters, document identity, source versions, material, presentation,
  file/dirty state and settled resources remain exact. Candidate failure is
  uncommitted and subsequent commands obtain current inspections normally.

No geometry or precision criterion changes. Both datum cases, all six `.cad`
Save/Open cycles, twelve SVGs, forty-four Native observations and direct
reference-repair Undo/Redo remain required. No product code changes and no
preparation-time execution accompany this source correction.

**Source-ready; unexecuted.** New finite acceptance packet only. No product,
existing driver/oracle/evidence, status or deployment changes. Root performs the
later single complete public application run, then the independent after-whole
artifact oracle. No component/micro/syntax/typecheck/build/browser execution is
part of preparing this source.

The retained reference is ACAD
`test/linked-drawing-native-binding/evidence-r5/receipt.json`, actual
Core15c0f1fb969e8e87d33868042d7f75dd11c29cd6 /
Desktop0e348d61774762a9c5580f9c3629acdbd53fd1c0:56 rows/two datum cases,
six genuine native-v3 JSON files/eight SVGs. The focused map at
`docs/reviews/PARAMETERS-REFERENCES-EXPORT-DRAWING-EXERCISE-MAP-20261108.md`
identifies its missing observation: that run repaired the hole references and
then traveled drawing removal; it did not Undo/Redo the reference repair itself.
Its title/removal travel and historical source-custody review remain unchanged.

## Exact finite invalidation and repair

This packet retains the ROOT-APPROVED **definition-reference invalidation** case:
all three authored `hole.featureId` references are changed from the actual
returned centered-hole feature to the actual returned **fillet** feature. Every
other definition field is identical. Both feature IDs genuinely exist in the
current public-authored history. No ID is invented, guessed or parsed.

The definition remains schema-valid intent; Native lookup must report exactly
`DRAWING_HOLE_WITNESS_UNAVAILABLE` for those three references. The complete real
body and all three Native views remain intact; width/height/depth facts remain
available. The bore is still visibly present, but the broken references supply
no factual value, quality or anchors. This is **not topology-induced loss**, body
deletion, automatic nearest retarget, a changed driving dimension or a claim that
an actual fillet is a semantic hole. E19's checked parent/deletion repair is a
separate workflow and is not added here.

Explicit repair replaces the SAME reference-bearing definition with the SAME
original actual hole references. The next authored transition is shared Undo of
that exact repair event, restoring the exact unresolved definition/IDs and its
three null hole facts. Redo restores the SAME repaired definition/IDs and six
real facts. Readonly observations and My files SVG output between travel steps
create no authored journal entries. Native source/body/feature IDs, high-water,
geometry, metadata, source versions and resources remain unchanged by the repair.
The actual J target must be `{kind:document-metadata,
domain:linked-part-drawing,key:theActualDrawingId}`; no title or removal event can
stand in for the repair.

## Same genuine part and drawing family

Two fresh signed cases use source rectangle origins **[0,0]** and **[−80,−40]**.
Each actual public constrained100×50 XY rectangle is extruded20mm, gets one
semantic centered D10 through-hole, two opposite R3 vertical fillets and the
other two equal1mm chamfers. Actual discovered connector incidence selects the
opposite pairs; selection IDs are never qualified/constructed or parsed. The
permitted spatial fillet masks, frozen BEFORE execution in LL/LR/UR/UL order,
are `[true,false,true,false]` or `[false,true,false,true]`. The first VALID Native
corner query must match one, then the same selected edges must retain that
geometry through every edit and Open. No oracle is chosen after an invalid result.

The exact retained MFG Native family is:

- JS `32eec74e3019d9e2d767c9016f05aa3daa49441c6102423a269d67b9c7f02a08`
- WASM `abbf2aa02a6f2101c600aa1eedd20fa80ab2db206e677ca860d9c5103cdfbfcc`

Actual runtime pins and advertised source/build/selection APIs must match. No
Native/default/library change or alternative easier backend is introduced.
`example.mjs` exports `createDrawingReferenceRepairExample(agent, build)`, where
`agent.execute` and `agent.inspect` use only registered public command operations.
The actual edge feature/index comes from `inspect-edge-treatment-history`; its
operation schema tag comes from public `inspect.operations[index]` with explicit
nontruncation/current feature/build/parent checks. The declared tag is
`WORKER_SOLID_EDGE_TREATMENT_V1`, not a guessed opaque identity. The recipe has no
private capture requirement. It authors the part, discovers the genuine references
and supplies drawing/source/depth/hole operations; it owns no model,
cache, journal or successful private author.

The same definition has a420×297mm sheet, scale1:1, top/front/right principal
views, and six stable authored reference dimensions:

| ID | Genuine reference and value |
| --- | --- |
| width / height | Actual source Segment endpoint distances on declared datum axes |
| depth | Actual inspected inherited first/last planar cap selection IDs |
| hole-diameter | Actual semantic centered-through feature + Native finite-cylinder lineage |
| hole-offset-x / hole-offset-y | Distances to the authentic source DATUM axes, not rectangle minimum |

DATUM origin is the real source frame origin **[0,0,0]**. Scalars are nonnegative
distances; ephemeral anchors retain signed coordinates. In the negative case,
source edits therefore produce e.g. width150/height30 center[−5,−25] and offsets
5/25mm. No persisted origin, synchronized measurement, absolute driving parameter
or caller-supplied Native face ordinal is added. Authored definitions store
references, sheet/view/label intent; solved values/anchors/curves remain derived.

## Whole frozen flow, per datum case

1. Normal login/public New, actual `.cad` advertisement and exact mounted
   core/outer/Native hash verification. Author and discover the actual source,
   body, curve, region and Native face identities; create the3-view/6-dimension
   definition through the registered drawing command. Actual drawing creation
   Undo/Redo and exact replacement no-op preserve geometry/source/identity.
2. Edit original width100→150, real shared Undo/Redo, and refuse a genuinely
   formerly-current drawing revision. Invalid authored scale0 must refuse
   `INVALID_REQUEST`; an impossible actual centered-hole diameter must refuse
   `HOLE_OUTSIDE_PROFILE` without replacing accepted source/drawing/J. Then edit
   height50→30, depth20→25, diameter10→14 with real hole edit Undo/Redo. Three-view
   geometry and all six dimensions must propagate; SVG output is actual My files.
3. First normal `.cad` Save/browser acknowledgement/own server SHA equality,
   fresh signed Open, same editable part/drawing and reset session J. Reedit the
   actual semantic hole D14→D12; read real geometry/facts. Publish the exact
   fillet-ID invalidation above, observe unresolved facts and real views, export
   truthful unresolved SVG, then Save/sync/fresh Open the unresolved `.cad`.
4. Explicitly repair those SAME references. Observe the actual repair metadata J
   target and Native read; **immediate shared Undo** restores EXACT unresolved
   prior definition/IDs, actual null hole facts and unresolved SVG. **Redo**
   restores EXACT same repaired definition/IDs, six Native/source facts and SVG.
   Compare actual accepted source/body/Native metrics/counters/ownership across
   all four repair states. This is the new required G6 observation.
5. Retain genuine drawing removal Undo/Redo/restoration as a distinct operation,
   never as repair evidence. Reedit original source140×40, depth22 and D10 with
   hole edit Undo/Redo. Third normal `.cad` Save/server/fresh Open retains the
   repaired definition and actual part; final SVG, Native observation and normal
   Desktop screenshot are actual viewable outputs.

Both cases are in ONE script and each completes three `.cad` cycles. Expected
artifacts: six `.cad` archives and twelve SVGs (original, edited, unresolved,
repair-Undo-unresolved, repair-Redo, final-repaired per case). Every public
mutation uses registered shared operations; `__CAD_APP` access is readonly actual
Native drawing service/state observation, as in the qualified family. No fake
Canvas/UI, private source/model write, geometry seed, fake positive reply,
account impersonation or filesystem race is used.

## Frozen independent truth and budgets

For actual source widthW, heightH, depthT, diameterD and unchanged twoR3/two1mm
outer treatments:

```
V = W*H*T - pi*(D/2)^2*T - 18*(1-pi/4)*T - T
```

There is one valid Native solid/shell,11 faces,27 edges and18 vertices; bounds
are `[originX,originY,0]..[originX+W,originY+H,T]`. Budgets retain the qualified
family's **1e−6mm dimensions,1e−6mm Native bounds,1e−6mm³ volume** and **.02mm
paper chord error**. The source/equation corroboration is the current stricter
50pm =5e−8mm physical-coordinate budget; it does not loosen the prior drawing
fixture's1e−6 source checks. Frame/direction/parameter semantics stay separate.
Labels round to three decimals only for human text; actual measurements and
source values remain full precision.

The frozen sequence has44 actual Native drawing reads and44 public point
queries (440 classifications),26 shared travel events and two exact drawing
no-ops across the two cases. Each drawing observation queries ten genuine Native points: the
bore/adjacent material, all four fillet/chamfer discrimination corners, outer
boundary and material/outside controls. Same-window raw source/history/J/dirty/
baseline/path/document token/inspection revisions/source key versions/epoch/
material/resources must remain EXACT around Native reads and SVG exports.
Repair metadata may advance its document/J revisions; its physical comparison
excludes only the document-bound opaque material inspection token and solid
inspection token, not source, body metrics or actual metadata. Refusals normalize
only four opaque inspection tokens, plus the impossible-hole candidate's
separately recorded monotonic diagnostic epoch. No source geometry or failed
allocation counter is silently discarded.

The actual owner-bound Native drawing read retains its real response-local
analytic projection buffers with byte hashes, metadata and values, not just a
successful status. The Python after-whole oracle independently decodes the
12-double/4-byte curve records, checks named frames, trim/endpoint equations and
projected extents, and matches every real SVG geometry fragment/visibility/
parameter interval to the actual Native packet at the declared paper error.
Independent saved source, Decimal volume, Native material classes, full bore
circle/hidden walls and six reference anchors supplement that consumer check.
Agreement with Native packet data is not claimed as a second Native kernel or
universal geometry-equivalence certificate. Buffers are derived observations,
not persistent references or authority for authoring.

The checker imports no production solver/planner/renderer/codec and never runs
Native or browser code. It reuses only the existing independent archive reader
`test/native-cad-container/archive_oracle.py` to inspect ZIP/CRC/SHA/manifest/
designRevision and exact drawing-bearing v3 custody. It independently checks
resolved and unresolved references in actual archives, Native dimension status/
quality/anchors, real repair-J targets/sides, three fresh Opens per case and
readonly SVG publication. Historic JSON receipts are not retagged as `.cad`.

## Later root invocation, after source freeze

The following instructions were NOT executed during preparation. Use a fresh
nonexistent evidence directory, actual qualified Desktop source/harness path and
root's exact normal staged app pins. Root owns build/service/shared Chrome.

```
CODI_DESKTOP_SOURCE_ROOT=/absolute/desktop-source \
CODI_EVIDENCE=/absolute/new-drawing-repair-evidence-r1 \
CODI_SIGNED_PINS=/absolute/exact-runtime-pins.json \
CODI_EXPECT_SOURCE=ACTUAL_COMPILED_CORE_COMMIT \
CODI_EXPECT_DESKTOP=ACTUAL_FROZEN_DESKTOP_COMMIT \
CODI_TEST_URL=http://127.0.0.1:PORT/ \
CODI_TEST_CDP=http://127.0.0.1:19329 \
PUPPETEER_CORE_PATH=/absolute/puppeteer-core \
node test/drawing-reference-repair-public-workflow/desktop-driver.mjs
```

Only AFTER the complete application workflow is terminal:

```
python3 test/drawing-reference-repair-public-workflow/check.py \
  /absolute/new-drawing-repair-evidence-r1 \
  > /absolute/new-drawing-repair-evidence-r1/independent-oracle.json
```

The original source checkpoint f7c1c361 is retained in Git. This follow-up removes
its authoring-only use of private `h.capture` for the operation tag; private state
captures remain ONLY readonly regression observations. No workflow, geometric
criteria, tolerances, Native class count, oracle or persistence expectation is
changed by that public-boundary correction.

All executing acceptance/helper/independent-reader bytes and mounted assets are
pinned. Raw replies precede assertions; first failures remain failures. Every
submitted native Save/SVG write and own server sync must settle before normal
owned-context retirement. If any submitted durable outcome remains unknown, the
owned context is explicitly retained for root readback; it is never force-closed
or falsely called retired. No account/session/key material is archived. No
scope/count/signoff follows from source readiness alone; topology-induced loss,
general annotation/GD&T/views/frames, typed drawing families, arbitrary materials,
human editing UI, external readers/slicers/printing and full Gate1 are unclaimed.
