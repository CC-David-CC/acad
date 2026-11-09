# C11 v4 visible requirement forms: frozen source grammar

Source-only implementation against pure78519cd and Gate's exact protected read
contract `b031e057e739dea13adb1b35c64265df0a952021`. Root's complete backend/
controller/ledger/catalog/closed-graph composition is a prerequisite, not
implemented or advertised by this renderer. No parser/tests/probes/build/Native/
browser execution or runtime assets. Native/source/paper tolerances are unchanged.

`linkedPartDrawingSvg.mjs` statically imports NEW
`linkedPartDrawingRequirementForms.mjs` in the actual encoder Worker bundle.
For v1–v3 the new helper returns empty presentation, retaining current SVG
geometry/annotations/captions/warnings. V4 strictly requires all authored/read
datumFeatures and requirements arrays in exact order; no missing-array fallback.
The existing protected `captureDrawingReadResult` must validate Gate's complete
DTO before this helper. It is a presentation consumer, not a Native authority.

## Facts consumed

- Datum rows: exact annotationId/symbol/status, quality native-brep-analytic,
  support/anchor/sourceAxis facts. The leader uses the actual finite boundary
  anchor; it does not derive a selector/plane from its symbol or paper position.
- Requirement rows: exact annotationId/kind and
  requirementRole authored-manufacturing-requirement; available quality
  native-bound-requirement-reference. Position uses actual bore/A-plane anchor;
  finish actual finite surface anchor; fit actual finite bore anchor and
  nominalDiameter/holeLimits/declaredShaftLimits/clearance. Authored values are
  separately taken from the captured definition. No manufactured position/Ra/
  fit measurement or pass/fail is emitted.
- Unresolved rows require null quality/facts and bounded actual reason. They
  have no successful form/leader/text; one full visible derived warning is
  emitted through the existing warning policy with the same annotationId and
  datum-feature/requirement kind. A view/projection unavailable at presentation
  also cannot advertise a successful form. Outer protocol/resource/currentness/
  cleanup failures are not converted to these rows by this helper.

## Exact visible grammar

Existing root/groups/fonts/white paper/geometry paths and all v3 metadata remain.
Every AVAILABLE new form path/text has:

    data-annotation-id=<actual ID>
    data-annotation-kind=datum-feature|position-tolerance|surface-finish|clearance-fit
    data-requirement-role=authored-manufacturing-requirement
    data-geometry-binding=resolved

Path attributes additionally are ONLY `data-presentation`, `d`, `stroke="#357"`.
Presentation is requirement-leader (actual projected anchor to frame boundary),
requirement-frame (five explicit M/L points closing a rectangle without Z), or
requirement-cell (position separator segment). Stroke inherits existing .25mm.
These are annotation paths, not part-outline/Native geometry. No cover fill,
opacity, transform, clipping, hidden geometry, external content or canvas exists.

Text additionally has ONLY x,y,data-requirement-text,font-family=monospace,
font-size=3,textLength,lengthAdjust=spacing,fill=#124. Full visible plain text,
no nested spans/hidden alternate content for available forms. Fixed1.8mm
declared advance,6mm line height,baseline4mm below frame top,1mm side padding.
Values use full `String(number)` precision; non-scientific forms pad zeros to
the stated minimum decimals and never round or truncate. Scientific notation
is retained when that is the complete represented value. No font/glyph shrinking.

`label` is the authored form's first-line paper baseline; frame min is
`[label.x−1,label.y−4]`. Internal cells/rows have deterministic offsets from
that authored anchor, never auto-layout movement of it:

| Kind | Visible content and geometry |
| --- | --- |
| datum-feature |8×6mm frame. One `datum-symbol` text with exact A/B/C, baseline `[label.x+2,label.y]`. Actual finite boundary-anchor leader to the frame. |
| position-tolerance |6mm-high five-cell feature-control frame. Text roles kind=`POS REQ`, zone=`Ø<zone with minimum2 decimals> mm`, datum-A=`A`, datum-B=`B`, datum-C=`C`, in that exact order. Width of each cell=max(6,textLength+2), four full-height separators. Example visible zone0.20 is authored tolerance, not a measured positional error. |
| surface-finish |One6mm frame, role roughness=`REQ Ra ≤<full raw maximum> µm`. Actual surface-anchor leader. Canonical maximumMillimeters is retained in protected facts/metadata, not shown as a measured roughness. |
| clearance-fit |One6-row frame with roles nominal, hole-deviations, hole-limits, declared-shaft-deviations, declared-shaft-limits, clearance. Visible prefixes are `REQ FIT nominal Ø`, `HOLE deviations`, `HOLE limits`, `DECLARED SHAFT deviations`, `DECLARED SHAFT limits`, `REQUIRED CLEARANCE`. Quantities and intervals have explicit mm, minimum3 decimals, signed positive deviations. Height36mm; width=max full line textLength+2. Native nominal and derived intervals come from actual protected facts; raw deviations remain visible authored values. |

New v4 metadata fields are exactly `datumFeatureFacts:o.datumFeatures`,
`requirementFacts:o.requirements`,
`manufacturingRequirementRole:'authored-manufacturing-requirement'`,
`measurementScope:'nominal-cad-reference-only'`. Existing annotationFacts and
its roles are retained in v4. This metadata does not substitute for actual
visible forms or independent target/support and source proof.

## Bounded layout and refusal

Forms are evaluated AFTER the existing qualified captions; no old caption,
successful authored label, dimension anchor, definition or view is moved.
All complete new frames must fit8mm side and16mm title/footer margins. They
clear actual analytic/cap/aperture view envelopes and existing annotation
strokes by .125mm half-stroke+2mm physical gutter, declared old text/caption
boxes and preceding new frames by2mm. Input obstacle census≤512 and new forms≤6
from the authoritative schema. New leaders cannot cross declared old text/
caption or other new-form boxes (strict segment/box checks with .125mm stroke).
Straight leaders may cross geometry/other leaders; general routing is not claimed.
Crowded/outside/unsupported complete form placement throws prewrite RESOURCE_LIMIT.
No clipping, erasure, omission, font reduction or hidden successful fallback.

All new frame/leader bounds join the existing obstacle arrays before unified
warning placement, so diagnostic boxes also clear these actual new forms.
This remains a declared paper-box policy, not arbitrary installed-font ink or
standards typography certification. Actual whole/FIRST oracle/render review
is required. No Native/source50pm budget or .02mm conic chord bound is changed.

## Composition and complete acceptance obligations

Root must include this new leaf in the real exporter Worker build and in every
current producer roster that already pins linkedPartDrawingSvg/caption/warning
helpers. Exact affected current source rosters: section-detail coreNames and
oracle_lifecycle CORE; four-bore/isometric/current-compat/E22 path rosters;
counterbore producer-roster.json; blind and extent origins plus exact checker
sets; future countersink/drawing-requirement producer rosters. These are
additive source-custody changes; old frozen producing evidence is unchanged.
No Native resource roster is changed by this static export-only leaf.

Dxf owns the NEW complete public requirement workflow/oracle: it must check
actual frame/cell/row/leader geometry and all complete visible strings against
accepted authored data and independently established live supports/axis/nominal/
Fraction arithmetic, not trust metadata or the renderer's layout. Use exact
transitive Git producer/helper snapshots, real writes/settlement, mixed J,
source edits, genuine OWN-reference unresolved/repair travel, three normal
.cad cycles and actual SVG artifacts. Preserve every relevant old geometry/
caption/warning/resource/currentness/refusal/material/dirty/source condition.
Declaration, not manufacture/standards conformance or an observed second shaft,
must remain explicit in public results and visible artifacts.
