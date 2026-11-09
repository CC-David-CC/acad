# CAD-DRAWING-ERROR-LAYOUT-01: BEFORE finding and bounded proposal

Status: proposed, awaiting root review before implementation. This note changes
no product, packet, evidence, drawing definition or acceptance status. Source,
retained SVG text and one retained PNG were read; no parser, tests, probes,
build, Native or browser execution was performed.

## Exact source and observed incident

Baseline `bd6be7d9d193679560c3e8dbb673f229443b73b1`; qualified C11 evidence
`3e8b881d9ade9d9bb2d746c4a8e2dd9fa62f17a9`.

| Input | Exact identity |
| --- | --- |
| `web/app/cad/export/linkedPartDrawingSvg.mjs` | Git blob `78abbb11add58e118ef31ec2b63452c462577253` |
| `web/app/cad/export/linkedPartDrawingCaptionLayout.mjs` | Git blob `37f2c57bd57e684793a1f44fdec638ce5a820b97` |
| `modules/drawing/linkedPartDrawingDefinition.mjs` | Git blob `a7b735535cb985409c6f118030dbffce6a90cfd8` |
| `test/section-detail-drawing-public-workflow/evidence-r5/whole/original-actual-roof.svg` | SHA256 `d11f40ce60ebc169a13bb3e818107c441f836871b14346d3285b0661d02cfa82` |
| same directory, `translated-negative-actual-roof.svg` | SHA256 `a596cf02ff0699b79604d39da9c80f571244c939bebbe3532a9dca35c401f062` |

Both actual SVGs contain red `UNRESOLVED: depth` at `(150,200)` and
`UNRESOLVED: section-depth` at `(210,320)`. These are the definition's label
coordinates, not independently laid-out error locations. The original PNG
shows the former against the front outline and the latter on/against the
section outline/hatching. The retained individual visual review records the
same limitation for both cases in `evidence-r5/visual-review.json`, while
separately accepting the geometry and cross-view captions. The actual unavailable
four-hole THRU callout remains explicitly unresolved too; no missing depth value
is inferred or repaired by this proposal.

The confirmed source path is the dimension unavailable branch in
`linkedPartDrawingSvg.mjs`: `text(dimension.label,'UNRESOLVED: '+dimensionId)`.
Unavailable annotations similarly use an authored callout label or first group
label, except `bore-center`, which has no authored label and already uses a
derived sheet legend. That existing legend reserves a footer band but does not
check it against all actual geometry. None of these warning branches gives the
derived diagnostic text its own collision-aware placement.

## Which positions are authored

| Item | Existing authority; proposed treatment |
| --- | --- |
| View `paperOrigin`, sheet size/scale, detail aperture/scale | Authored definition. Preserve exactly, including all physical projection/section/detail transforms. |
| Dimension `label`, callout `label`, baseline/ordinate `labels[]` | Authored paper locations. Preserve all values. Available numeric text and its physical measurement/leader anchors stay at those locations. Do not move a successful dimension or reroute its leaders. |
| Unavailable dimension/annotation message | Derived diagnostic, with no available measured value or anchors to draw. Currently borrows an authored label location; propose explicitly separate derived placement while retaining the underlying authored location for future successful regeneration. No new leader or invented physical anchor is added. |
| View captions, available-empty caption, unavailable-view caption | Already derived and separately qualified. Retain their current helper, fixed physical sizing, own-view clearance and all-view/caption collision criteria. Do not reinterpret their positions as authored. |
| Existing `bore-center` warning legend | Already derived. Bring it into the same bounded warning placement rather than leave a second unqualified error-placement policy. Preserve its exact identity/reason membership. |
| Title/footer | Existing derived fixed presentation bands. Preserve their content/positions and reserve those bands from warnings. |

This is an intentional change to SVG diagnostic positions/attributes only. An
unavailable measurement does not acquire an authored new label, a valid number,
a replacement reference, a cached repair or a model edit.

## Smallest proposed implementation

Own `linkedPartDrawingSvg.mjs` and one new pure, Worker-only warning-layout leaf
imported by that exporter, plus current acceptance oracles/producer rosters.
Leave the caption helper and authoring/schema/service/Native/Files paths alone.
The helper enters the real `controlledMesh3mf.worker.mjs` bundle through the
existing exporter import; no separate worker, state, cache, flag or public API.

1. Collect one diagnostic for each unavailable dimension or annotation in
   definition order. Identity is `(role, authored ID, viewId)` so equal IDs in
   different schema namespaces cannot collapse. Keep the full existing message,
   reason where already present, and exact membership; at most 16+16 records.
   Unavailable-view messages remain the existing view-caption family.
2. Preserve the actual view envelopes already obtained while decoding admitted
   analytic curves, cap patches and detail apertures. Reuse their conservative
   conic envelopes; do not derive geometry from nominal part dimensions, mesh,
   display, SVG parsing or opaque IDs. Include actual visible annotation/leader
   segments and successful label obstacles derived during this same render.
   Do not retain per-tessellation-chord obstacles: bounded per-view envelopes
   and definition-bounded annotation segments suffice.
3. Finish the existing caption placement first, then treat those declared boxes
   as immutable obstacles. Keep current caption behavior and clearance intact.
   Replace the old separately rendered bore-center legend with the unified
   warning block; if a sheet previously had that legend, preserve its existing
   caption band reservation before allocating the warning block. Do not move a
   placed caption merely to make a warning fit.
4. Lay out one bounded diagnostic legend using fixed 3mm monospace, 1.8mm
   declared advance, 6mm declared line boxes with 1mm side padding, and complete
   wrapping into at most 120 code points per line and 256 lines total. Explicit
   `textLength` adjusts spacing only; no glyph/font shrinking, ellipsis,
   truncation, missing records, clip paths, hidden text or white erasure patch.
   The full original message remains in `aria-label`; concatenated line content
   must reproduce it exactly. Include explicit warning role/ID/view attributes,
   a versioned derived-layout attribute and fixed font attributes. These are
   SVG presentation metadata, never persisted authored layout.
5. Keep the full warning block inside 8mm side margins, below the 16mm title
   band and above the existing 16mm footer exclusion. Reject intersection with
   every actual view envelope expanded for the 0.25mm stroke and a 2mm physical
   gutter, annotation/leader stroke envelopes, declared successful text boxes,
   placed caption boxes and other warning lines. Use only deterministic
   obstruction-edge candidate coordinates with a fixed bounded candidate work
   limit (proposed 4096), not a pixel grid, retries or font-size search. A
   conservative envelope may refuse a crowded sheet; it must never emit a
   collision as a successful supported placement.
6. If a full legible placement or bounded text/obstacle description cannot be
   established, throw `RESOURCE_LIMIT` with a presentation-specific message.
   The current encoder already transports that code before any SVG file write.
   No partial successful SVG, omitted warning or substituted geometry is returned.

Declared text boxes are a paper-layout policy, not a proof of arbitrary
installed-font ink extents, Unicode shaping or all professional typography.
Existing successful label strings/attributes are preserved; warning clearance
from them uses a documented conservative declared text envelope. A real Chrome
review of the completed rendered sheets remains required. None of these paper
gutters changes the source 50pm budget, Native geometric qualifications or
the existing .02mm SVG chord bound.

## Read-only and currentness boundaries

The existing `workerLinkedDrawingSvg.ts` captures the accepted definition,
revision and geometryRevision, obtains actual current drawing reads, transfers
bounded buffers, checks currentness/cancellation before dispatch and on reply,
and terminates the one-shot encoder. Keep those checks and the file-write
settlement contract unchanged. Placement consumes only that captured packet,
runs synchronously in the rendering Worker, and returns the same bound result
shape/status/revisions. It must not write source, definitions, material review,
journal/history, resources, dirty state, saved baseline or physical anchors.

## Complete eventual acceptance, not a microtest

Update the current complete C11 workflow/oracle, preserving all two-datum/six-view,
section material/area/boundary/hatch, detail crop/conic/scale, Native observations,
repair/travel/refusal/quota, .cad and source/settlement criteria. Preserve old
evidence byte-for-byte. In the actual roof exports for both original and
translated-negative cases, independently bind accepted definitions and issued
revisions, require the exact warning roster/text/reasons and absence of ghost
numeric labels/anchors, then check all final warning boxes against independently
reconstructed actual view/stroke envelopes, captions, available labels, each
other and sheet bands. Do not copy the placement search or require its chosen
coordinates. Successful authored labels/anchors and already-qualified caption
inequalities remain unchanged. Retain normal available, unresolved, repaired,
Save/Open/reedit and export read-only invariants and inspect every actual SVG
render after the whole workflow and first independent oracle.

Current exact-position consumers requiring explicit migration are
`test/section-detail-drawing-public-workflow/oracle_svg.py` (unavailable dimension
and hole-callout positions) and `test/four-bore-drawing-public-workflow/check.py`
(old derived bore-center legend and authored error-label assertions). Inspect
the current counterbore, blind, extent and linked-reference consumers for shared
strict SVG vocabulary/roster effects before composition; do not edit frozen
receipts or remove strict hidden-text/geometry checks. Snapshot the new layout
leaf and any new independent oracle helper in each affected current producer
roster, with exact transitive Git-object associations before and after the run.

The larger placement of successful authored dimensions, crossing leaders,
leader routing and professional sheet layout stays explicitly open. Fixing
derived diagnostics does not close those independent obligations.
