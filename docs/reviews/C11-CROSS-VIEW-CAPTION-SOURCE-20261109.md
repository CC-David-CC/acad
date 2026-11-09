# C11 cross-view derived caption repair — source contract

Source only, following frozen BEFORE4fe566d. No tests/parser/probes/TSC/build,
Native/browser calls or historical evidence changes. No Native/OCI/feature/
controller/catalog/metadata/source/J/PM/host code changes.

The Worker renderer collects all actual observed envelopes before placement:
line endpoints; conservative complete projected conic envelopes (containing all
finite trims); actual section cap-patch vertices; actual detail aperture.
It preserves every authored view origin and all geometry/path coordinates,
annotations/leaders, nominal measurements, references, definition and document.
Unavailable placeholders and available-empty detail text are also derived
captions, not authored labels; their values/status remain exact while placement
may change. Available views always have the complete census before placement.

NEW linkedPartDrawingCaptionLayout.mjs is Worker-only pure presentation math.
Each caption retains full ASCII role text;3mm monospace is fixed,1.8mm advance
is explicit through SVG textLength/lengthAdjust=spacing (never glyph scaling or
font shrinking). One-mm side padding and6mm declared paper line box use baseline
4mm below the top,2mm below it. All caption boxes fit8mm side margins, stay below
the16mm title band and above the16mm footer band and actual warning legend band.
Own geometry clears the ENTIRE line box by at least5mm; the extra.25mm gutter is
physical presentation spacing, not a geometric tolerance or a source rewrite.
Other actual view envelopes and prior caption boxes are padded2mm. No caption
is truncated, clipped, scaled or silently omitted. Title/footer/warning content
and their existing physical presentation remain unchanged.

For at most6 actual view envelopes and12 derived captions, deterministic search
uses obstruction-edge candidate coordinates plus the preferred own-view x and
sheet edges, ordered by lowest supported y then nearest preferred x. At most
2048 positions/caption are admitted (the current input bound gives at most
37×36 candidates). This is a finite supported policy, not an assertion that no
other general page arrangement could exist. If the supported placement cannot
fit fixed legible captions, RESOURCE_LIMIT is thrown before SVG output/file
submission. No retries, font shrinking, mesh/nominal bound fallback or stale
success. Existing200000 segments,65536 conic segments and16MiB SVG limits stay.

Only intentional derived caption positions and attributes change. New caption
attributes bind actual viewId, view/empty role and layout version, fixed physical
font/advance; no declared bounding box is trusted as geometry. The independent
AFTER-WHOLE oracle reconstructs actual view bounds from independently qualified
analytic/cap/aperture data and caption boxes from actual SVG coordinates and
fixed typography. It must assert box clearances/paper/reserved areas/pairwise
separation, NOT reconstruct this search or require its exact chosen positions.
All old geometry/Native/crop/chord/scale/translated/J/refusal/quota/.cad criteria
remain. Current whole must rerun once under root custody and FIRST independent
oracle/actual rendered review follows it; no qualification claimed here.

General authored dimension/annotation/leader sheet layout remains OPEN under
C11-REFERENCE-LABEL-LAYOUT-01. These authored positions and crossing leaders are
neither moved nor called collision-free. Likewise arbitrary out-of-sheet view
origins/geometry are not auto-fit or clipped by this caption-only operation.
The new helper is an ordinary static import inside the already dedicated SVG
Worker bundle, requiring normal rebuild of that closed bundle; no Native closed
module list, allowance or runtime pair changes.

Adjacent acceptance consumer seam found during source review:
current test/centered-counterbore-workflow/svg_oracle.py46–47 expects old caption
attributes/positions exactly. It requires an intentional derived-caption-only
current oracle migration before that workflow runs on this renderer; its
geometry and every old frozen artifact remain authoritative and untouched.
Root owns that integration decision; this packet changes only the complete C11
acceptance/oracle, not a currently executing counterbore packet.

## Exact changed caption families and text-box scope

The same renderer serves definition versions1/2/3. Derived view caption families
are top/front/right, isometric, bore-center-section and detail with its unchanged
2:1 role label. Unavailable views retain the exact `basis: unresolved` value/red
status; available-empty detail retains its exact separate message. These are
the only moved text families. Authored dimensions, annotations, leaders, title,
footer and warning content/coordinates retain their original contracts. Every
caption now has data-view-caption-id/data-caption-role/data-caption-layout,
monospace font-family, font-size3, textLength and lengthAdjust=spacing, plus the
existing red fill only for unresolved. Coordinates are derived choices, not
persisted definition fields or caller-provided layout flags.

The padded paper box is an explicit physical presentation contract, NOT a
universal ink-bound proof for arbitrary installed fonts. Fixed3mm type and
spacing-only advance avoid shrinking/truncation, but actual browser font glyph
ink and legibility must still be reviewed in all genuine final SVG renders.
The independent oracle does not read a claimed renderer box; it derives the
box from actual XML coordinates/physical typography and authentic observed
geometry, keeping existing1e-6 paper serialization and.02mm chord budgets.
No current product or artifact is qualified by source review alone.
