# Missing public formatted quantities: bounded follow-up contract

Source observation only, not a reproduced rendering incident. `web/app/cad/craft/craftBundle.ts:inspectPhysicalParameters` currently returns canonical quantities with `{name,dimension,value,unit}`. Its returned rows do not carry formatted text. `web/app/cad/projectManager/projectManagerBundle.ts` already exposes document-scoped `formatDisplayQuantity(value,dimension,digits?)`, implemented by `displayUnits.mjs`; it supports length, area, volume and angle with actual inch powers and degree presentation. Only the normal closed-sketch measurement reader currently projects that formatter into a public quantity-like receipt, for length.

Consequently the prepared current-supported workflow proves real public length output, all canonical quantities, saved authored definitions and Native replay. It **does not** prove public formatted area/volume/angle, painted annotations, an authoring UI, general physical-property providers, mass/density or locale parsing. The independent oracle must retain those three missing requirements even if every supported row passes.

## Smallest proposed product seam — not implemented here

Extend the SAME `inspectPhysicalParameters` rows with an optional immutable `display` projection for dimensioned length/area/volume/angle, using the SAME current manager formatter. Example shape:

```js
{
  name: 'inchArea', dimension: 'area', value: 645.16,
  unit: 'square-millimeter',
  display: {
    canonicalValue: 645.16, canonicalUnit: 'square-millimeter',
    value: 1, unit: 'square-inch', text: '1.00 in²'
  }
}
```

Use only the already accepted quantity table; do not re-evaluate expressions, persist formatted values, build another quantity table or relabel a canonical number as inch/degree. Capture and recheck actual manager/service identity, its formatter/inspect function identity, document/presentation revision and physical-result/source/history currentness around formatting, including a post-call reentrancy check. Return the current presentation revision so callers can detect a stale formatted read. Formatting may fail explicitly if its existing representability/metadata bounds are exceeded; do not round away a domain failure. Enforce the existing64KiB public metadata ceiling before returning.

For scalar/count/boolean, retain their exact canonical types/units; either omit `display` or define an explicit separate truthful textual contract. Do not call the dimensioned formatter with an invented unit. No new flag may turn a boolean into1, a length into count, or a count into length.

Then version/freeze an addition to the WHOLE workflow before observations: require real `quantities[].display` for the four dimensioned families in mm and inch. Check `1.00 in²`, `1.00 in³`, `90.00°` and correct metric counterparts from actual command replies, with independent canonical/display arithmetic, same-window exact read-only state, presentation-only invariance and final Save/Open retention. No private manager call or driver-generated summary counts as that missing public evidence. The current driver, fixture, frozen evidence and independent oracle must not be retroactively relabelled full C09 PASS.

Ownership proposal for later root review: narrow Craft inspector projection and its public type only; Desktop adapter already returns the same structured normal read result, so no second command/provider should be necessary. Existing document manager/formatter, geometry Worker, physical evaluator, saved format and authoritative journal need no new state for this read-only projection. Root must approve the actual source boundary and compose it before any qualification claim.
