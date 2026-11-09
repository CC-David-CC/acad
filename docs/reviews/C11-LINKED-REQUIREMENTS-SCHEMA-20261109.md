# C11 v4 pure schema freeze

Source only, from exact Root `aab4c2e0a574c589cf408869291a1a9645659373`
and its approved root contract. No tests/parser/probes/build/Native/browser
execution. This commit is pure admission/types, not reference resolution or
an advertised/staged capability. Root/Gate own backend/closed-graph composition.

Authoritative capture remains `captureLinkedPartDrawingDefinition` in
`modules/drawing/linkedPartDrawingDefinition.mjs`; exact declarations are in
its `.d.mts`. No new metadata dependency leaf is imported. Existing valid v1–v3
records retain exact field sets, stored values, views/annotation meaning and
capture ordering. V4 has exactly the v3 top-level fields plus
`datumFeatures` and `requirements`, both REQUIRED arrays (possibly empty).
Its view family/order, source datum and dimensions retain v3 behavior.

All new records have `annotationId`, `viewId`, `label` (an authored paper point).
IDs are unique across `annotations`, `datumFeatures` and `requirements`; new
records initially name ordinary top/front/right views, not isometric/section/
detail. This is an explicit finite new-role presentation domain, with no change
to old bore/dimension view domains. New records never contain solved planes,
frames, measured values, Native indices, readiness or conformance flags.

## Exact authored variants

`datumFeatures`: length0..3, symbols unique, array order retained.

    {annotationId, symbol:'A'|'B'|'C', viewId, label, reference:NativeFace}

`NativeFace` is the UNCHANGED exact existing type:

    {kind:'native-face', originFeatureId, selectionId, geometry:'plane'}

`requirements`: length0..3; one record per supported kind; array order retained.

    {annotationId, kind:'position-tolerance', viewId, label,
     target:BoreReference,
     zone:{kind:'diameter', value, unit:'millimeter'},
     datumSymbols:['A','B','C']}

Position requires a genuine semantic centered-through reference (slot center);
the usual source feature/face/region binding is captured, not inferred. All
three datum symbols must exist. Zone value is finite positive≤1e6mm. Eligibility,
actual orthogonality/axis/support and currentness are Worker proof, not schema.

    {annotationId, kind:'surface-finish', viewId, label, target:NativeFace,
     parameter:'Ra', maximum:{value, unit:'micrometer'}}

Ra maximum is one raw positive finite value≤1e6µm. A quantity that underflows to
zero during the explicit `/1000` canonical conversion refuses; no clamp or
rounding. Nothing here measures finish. Store neither a duplicate mm value nor
expression source/converted display cache.

    {annotationId, kind:'clearance-fit', viewId, label, nominalDimensionId,
     hole:{lowerDeviation,upperDeviation},
     declaredShaft:{lowerDeviation,upperDeviation}, unit:'millimeter'}

`nominalDimensionId` MUST name an actual `hole-diameter` dimension in this SAME
definition on a centered hole. Both existing CenterHole and centered-through
BoreReference representations are admitted; neither corner bore nor source
distance is a nominal proxy. Deviations are finite[-1e6,1e6], reject -0, retain
all precision and ordered lower≤upper. Initial domain is positive clearance:
`hole.lowerDeviation-declaredShaft.upperDeviation>0` and ordered finite maximum
`hole.upperDeviation-declaredShaft.lowerDeviation`. This does not authenticate
the actual nominal or size intervals; Worker must derive/check them against the
real live dimension. Declared shaft is not a measured second body.

## Limits, source and unresolved policy

Combined old bore annotations + datumFeatures + requirements≤16; dimensions≤16,
views≤6, definition/request64KiB and existing J256KiB remain. No quantity string
or expression coercion is supported by these literal metadata roles. Unsupported
kind/unit/field, wrong view, duplicate ID/symbol/kind, missing A/B/C, wrong nominal
dimension and raw quantity/order domain errors originate as `INVALID_REQUEST`;
combined/array/byte budget errors are `RESOURCE_LIMIT`. Stale publication keeps
the actual shared operation's `STALE_DOCUMENT` behavior. No new Native reason
or archive machine code is invented by this schema slice.

Structurally admitted references remain INTENT. Existing SourcePoint/NativeFace/
BoreReference validators are reused; schema capture does not certify membership,
orientation, axes, geometry or support. A NativeFace outside the current OWN
model can remain explicit unresolved intent on protected read; a contradictory
source-datum BoreReference fails the existing schema predicate. No account or
external-file authority is added.

## DTO coordination before renderer

Gate owns the protected read facts/protocol and actual Native budgets; Root
requires the existing1e-7mm/1e-8 read-domain policy, not the tighter option in
the BEFORE proposal. Renderer must wait for that exact frozen DTO and consume
its actual resolved geometry/facts, with authored requirement numbers separately
identified. Suggested ordered read arrays are `datumFeatures` and `requirements`
only in v4, matching annotationId/symbol or kind in exact definition order, each
with available/unresolved, reason/quality and null facts on unresolved. No code
in this pure packet issues such facts. Discovery planes use the exact NativeFace
reference above and bores the existing BoreReference; no ordinal is public.

Existing old annotations must be retained through every v4 summary/read/export/
envelope consumer. This schema freeze does not itself update or advertise those
dependent services; the remaining source lane and Root/Gate composition own
them. Current renderer, capability and Native execution remain unqualified until
complete implementation and Root's normal build/whole/FIRST artifact sequence.
