# C11-VIEW-CAPTION-PLACEMENT-01 — frozen BEFORE

Source/evidence review only. No parser, tests, probes, TSC/build, Native/browser
calls or evidence edits. Basis: current root97adb2e, separate own branch
fix/drawing-caption-collision-20261109. Native/OCI/feature/controller/catalog,
root's frozen whole and all historical SVG/render/evidence files are untouched.

Actual retained evidence address:
`test/section-detail-drawing-public-workflow/evidence-r3/visual-review.json`,
`observedRemainingLayout[0]`. It identifies isometric caption intersection with
independently positioned right-view geometry in `renders/original-edited.png`
and `renders/original-actual-roof.png`; the corresponding SVGs are
`whole/original-edited.svg` (SHA25625620bc3782a0045747c289763d735cfa21cdb0ac66dbef36cc12bae075bb85e)
and `whole/original-actual-roof.svg`
(SHA25673610f4de22f4fea7b3a2bb6dde502082cc2a8de34a1c0a6a721127b403e7c6e).
This report does not rerun the render or invent a new measured collision.

The current Worker renderer's per-view caption closure in
web/app/cad/export/linkedPartDrawingSvg.mjs emits
`[ownBounds.minX,ownBounds.maxY+5]` immediately. It observes only that view's
analytic projection, section cap patches or detail aperture. It has neither a
full-sheet obstacle census nor any caption-width/height contract. Clearing own
geometry does not imply clearing a different view. Fixed title/footer/warnings,
other captions and paper extent are also not checked by that closure.

Current oracle_svg.py reconstructs the SAME exact placement and checks that
baseline>=own maxY+5. It establishes the prior bounded own-view claim, not a
cross-view/physical-caption-box claim. The new after-whole oracle must check
independent geometric inequalities, not reproduce a new search algorithm.

Approved correction is Worker-only derived caption presentation. Collect ALL
actual conservative view envelopes before layout; keep authored origins,
labels, leaders, references, source, geometry, dimensions, scales and resource
ceilings unchanged. Fixed legible3mm typography/physical advance/padded boxes,
8mm paper margins, title/footer/warning reserved areas, cross-view geometry and
other derived caption boxes constrain placement. Maintain own-view clearance
at least5mm; do not shrink/truncate/clip a caption. Bound deterministic search
and refuse RESOURCE_LIMIT when no supported placement is available.

General authored dimension/annotation/leader layout stays OPEN as separately
recorded C11-REFERENCE-LABEL-LAYOUT-01. This correction is not a promise to move
or untangle authored labels/leaders or fit arbitrary authored view geometry to
paper. Existing complete C11 genuine original/translated, partial-conic/detail
scale, Native/source/J/travel/refusal/quota/.cad criteria must remain intact.
