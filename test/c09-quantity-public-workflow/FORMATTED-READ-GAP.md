# Public formatted quantities: source contract and prior gap

**Source complete, unqualified.** The original63e3857 packet correctly recorded that public area/volume/angle formatting was absent. This follow-up implements that narrow projection in `craftBundle.ts:inspectPhysicalParameters`; no historical source/evidence is relabelled, and nothing is staged or executed by this source task. The whole updated workflow must qualify the composed source before any claim.

## Authoritative public read

The SAME `inspect-physical-parameters` command retains canonical `{name,dimension,value,unit}` exactly. Rows add derived `display`, `displayStatus`, `displayReason`, and the root adds `presentationRevision` (null when no ready typed presentation was captured). Example:

```js
{
  name: 'inchArea', dimension: 'area', value: 645.16,
  unit: 'square-millimeter', displayStatus: 'available', displayReason: null,
  display: {
    canonicalValue: 645.16, canonicalUnit: 'square-millimeter',
    value: 1, unit: 'square-inch', text: '1.00 in²'
  }
}
```

The literal example illustrates fields/units, not a promise of decimal-perfect binary multiplication. Actual canonical and converted numeric fields keep their full available Number values; only the formatter's human text rounds. The source uses the existing current manager's `formatDisplayQuantity(value,dimension)` with its normal2-digit text. Nothing evaluates formula arithmetic again, persists derived displays, creates a quantity table, dispatches geometry or relabels canonical millimeters/radians as inch/degree.

| Dimension/condition | display | displayStatus | displayReason |
| --- | --- | --- | --- |
| length/area/volume/angle, representable | Detached frozen5-field formatter record | available | null |
| scalar/count/boolean | null | not-applicable | NON_DIMENSIONED_QUANTITY |
| Current captured formatter throws | null | unavailable | FORMATTER_REJECTED |
| Formatter absent from captured manager | null | unavailable | FORMATTER_UNAVAILABLE |
| Returned record malformed/wrong canonical/unit/nonfinite/zeroed/oversized | null | unavailable | INVALID_FORMATTER_RESULT |

A formatter throw is not diagnosed by parsing error strings. `FORMATTER_REJECTED` reports the actual owned call outcome without inventing a more specific mathematical cause. Unit-conversion underflow is exercised by the complete workflow: `tinyLength = mm(5e-324)` stays a real nonzero canonical quantity. In mm, numeric display stays nonzero although human text is `0.00 mm`; in inch the real formatter rejects conversion to zero, leaving canonical value/unit intact and display explicitly unavailable. It never substitutes millimeter display as if inch succeeded. Existing absolute1e12 canonical evaluation bounds make conversion overflow unreachable for this fixture; the existing overflow refusal cases remain NUMERIC_DOMAIN, not fabricated positive display tests.

## Custody and concrete work bound

Capture actual manager and `ctx.services.projectManager` authority, formatter/inspection functions, project generation/signal/host state, Craft/storage/expression identities, physical resolver/current-result function identities, thirteen real stream identities/revisions, sketch namespace revision and pending pipeline/epoch state. Recheck constant-size captured facts around quantity resolution and actual formatter calls. Recheck actual PM presentation token/unit metadata before/after each formatter; a reentrant newer edit, unit switch (including switch-away-and-back), manager replacement, source/result change, pipeline or lifetime loss cannot return a stale projection. Keep the existing full authored revision checks at batch boundaries.

For N≤256 definitions and D≤N dimensioned rows, there are at most D formatter calls and2D+3 presentation-token inspections on the normal ready path. Per-row guards compare fixed service/stream/version records; they do not enumerate sketch keys, serialize geometry, hash source, call an optimizer or create Workers. The five-field display capture permits text≤64 UTF-16 units and fixed known unit strings; canonical/converted values are finite Numbers. The added projection is conservatively bounded by1KiB UTF-8 bytes/row plus the single bounded presentation token (≤257KiB total added data). Existing real quantity values≤1e12 make actual formatter text much shorter. This is a structural work/data bound, not a latency or zero-main-work claim.

No new aggregate output/source cap is introduced. Existing256-definition and64KiB accepted-source rules remain unchanged; an otherwise valid existing inspection is not rejected because added fields push a response over an arbitrary new64KiB threshold. Existing transport limits are unchanged. Every row preserves canonical facts even if formatting is unavailable. No private diagnostic result becomes mathematical authority.

## Complete qualification boundary

The ONE updated driver/oracle requires actual public display records for all four dimensioned families in mm and inch,90.00° in both, full non-text-rounded area/volume conversions, all seven canonical kinds, explicit no-display scalar/count/boolean and tiny-value availability behavior. It retains all original invalid cases, exact read/refusal state, units, shared travel, three native Saves/server equality/fresh Opens/reedits. After the whole driver, the independent Fraction/AST/artifact oracle checks the actual formatted reply values and text; it never calls the product formatter. GUI annotation paint, arbitrary units/locale syntax, manufacturing tolerance semantics and wholeGate1 signoff are outside this finite workflow. No new PM/Worker/Native/Files/index/format/journal state is added.
