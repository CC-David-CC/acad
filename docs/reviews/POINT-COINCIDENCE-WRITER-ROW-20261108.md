# Confirmed actual zero-constant serializer-row repair

Complete Coincidence R3 process93486, actual Core7afb2c4 / Desktop8eac41c9e,
reached first apply and failed INTENT_CHANGED:`Coincidence differs from its
original point-only request.` Root preserves R3. No tests, probes, build,
type/syntax check or browser execution accompanies this source correction.

The real AlgNumConstraint constructor leaves optional constants undefined for
the existing zero-constant PCoincident schema. Raw`constraint.write()` therefore
has an own`constants:undefined`; the actual IO JSON serializer omits that field.
The old transition both rejected missing constants and attempted to insert a
structuredClone of the raw JavaScript row. Merely removing the rejection would
still produce different field membership from the actual serialized warm source.

After genuine mutable admission and actual stage/row membership verification,
serialize through the existing real IO writer. Select the appended row from
`warm.stages[stage].constraints[at]`. Require its actual PCoincident type, stage,
original ordered point IDs and absence of authored constants: omitted constants
or an actual empty JSON data record, with no values, are allowed. Copy THIS row
verbatim into the original-source candidate, retaining annotations and actual
admission. Never manufacture an empty object or alter the global native writer,
parser, schema, format or previous saved rows.

The existing comparison against the actual serialized warm source now compares
consistent JSON membership. Original equation/owned-scope/cold proofs and the
second unchanged-original-request Worker still bind the entire source and actual
receipt. Mathematical domains, residuals, replay budgets, metadata, dataset and
whole driver remain unchanged in this product repair.

Source audit additionally found the frozen driver's later geometry assertion
requires`row.constants` to equal`{}`. That does not match the genuine zero-constant
writer contract and will require a separately approved narrow oracle correction
before the next complete execution. The independent Python oracle already uses
absence-as-empty for checking no authored constants and requires no change.
No runtime success or newer qualification is claimed here.
