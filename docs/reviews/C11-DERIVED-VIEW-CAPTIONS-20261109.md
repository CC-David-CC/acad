# Derived view captions clear actual projected geometry

Source-only repair of confirmed artifact issue CAD-DRAWING-VIEW-CAPTION-LAYOUT-01.
Root reviewed all16 actual rendered SVGs from complete workflow61449 and its
independent oracle40502. Captions formerly used paperOrigin+[0,5], which can lie
inside a translated projection or isometric outline. Example retained artifact:
`/tmp/codi-acad-foundation-next-section-20261109-r2/renders/translated-negative-edited.png`.
Frozen evidence is unchanged; it does not become evidence for this repair.

Own source branch starts at f282da31504301dbd84958ee5653de199d86e728, whose
renderer is the same d321917a section/detail implementation used by the current
725-compatible candidate. No probe, parser check, test, TSC, build, Native call
or browser execution accompanies this source change.

## One derived placement policy

For each available view, compute a conservative bounding rectangle of the
actual projected geometry in physical paper millimeters, using the actual
current view frame and existing sheet/detail scale. Put its caption baseline at
`[minimumPaperX, maximumPaperY + 5mm]`. Existing font, text and styles remain.
The baseline clears the view's own geometry; no origin minimum is inferred from
nominal dimensions, model AABB, display mesh, screen pixels or old view state.

| View kind | Actual current authority for the bound |
|---|---|
| top/front/right/isometric | Already admitted Native analytic projection packet. Lines use their actual rendered endpoints. Each finite trigonometric conic is conservatively enclosed by center[j] ± hypot(a[j],b[j]) in each projected axis. This full ellipse envelope contains the actual finite trim without root tolerances, sampling, rounding or unbounded extrema search. |
| bore-center-section | Every start/end in the actual admitted cap-set patch packet, including internal patch boundaries. Finite straight polygon extrema occur at these vertices; no nominal hole rectangle or HLR substitute. |
| detail2:1 | Its actual rectangle aperture under its absolute2:1 paper scale. Authentic clipped parent curves have already been validated against that aperture. Caption placement does not change any trim or scale and also works for an available-empty detail. |

Unresolved view placeholders keep the existing explicit origin and reason;
there is no current geometry bound to invent or an old bound to reuse. An
available ordinary projection with no curves retains its old caption position
because it has no finite extent; this is not a positive geometry witness. The
existing explicit detail available-empty notice is unchanged.

All work occurs in the existing export Worker, in the same walk of already
captured bounded projection/section data. Added work is constant per analytic
fragment/section edge; there is no new read, mesh, buffer protocol, capability,
Native pair, persisted coordinate/flag, journal event or second model. New
caption coordinates retain the existing finite1e9 paper-coordinate bound.
The same total segment/SVG-byte limits remain. No performance result is claimed.

## Whole oracle and preserved contracts

The existing complete `test/section-detail-drawing-public-workflow` driver is
unchanged. Its independent oracle derives the conservative bounds from its own
already validated line/conic facts, complete finite cap patches or actual
aperture, applies its independent physical paper map, and checks the exact
caption's position and baseline≥maximumPaperY+5mm at the existing1e-6mm paper
comparison bound. No production renderer/helper is imported as an expectation.
Every existing finite-path/chord/section-area/detail-interval/projection,
dimension/leader, source/currentness, unresolved/repair, travel, resource,
Native observation, .cad/server/freshOpen and artifact criterion remains.
No physical geometry or tolerance is changed to obtain a different picture.

The pending counterbore c968 closed SVG scaffold needs no expectation change in
its fixed origin0 ordinary family: its actual top/front/right bounds begin at
local[0,0], so the same new rule still equals its existing paperOrigin+[0,5].
The current C11 negative-datum/isometric/section/detail expectations genuinely
change because their actual projected bounds differ from the authored origin.
Prior isometric/bore/C11 evidence folders are left untouched.

## Deliberate presentation limits

This is not professional sheet auto-layout. Authored labels and leaders remain
exact and can still cross geometry or each other. Captions can collide with
another view or an authored annotation. Conservative partial-conic envelopes
may leave extra whitespace. No sheet clamping, rescaling, rearrangement or
font-metric solver is introduced: a view placed off the sheet can still have
an off-sheet caption. Existing finite-coordinate refusal remains explicit;
source/frame/definition positions are never silently changed to fit.

Root must review/compose and perform one normal build plus the complete affected
whole workflow, after-whole independent oracle and rendered review. This packet
is source-ready only and grants no new C11/Gate1 signoff or runtime layout claim.
