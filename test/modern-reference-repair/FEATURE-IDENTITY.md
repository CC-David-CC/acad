# Imported authored producer identity

Source-only followup from Core `a71465deb`. No per-step tests, syntax/type checks,
builds or browser runs were launched. Retained earlier native Open receipts are
unchanged and are not evidence for this new malformed-file control.

## Confirmed source admission gap

The live `submitModification` path in Craft checked duplicate IDs using numeric
equality, but imported histories do not enter through that append path.
`projectValidationCore.preflight` and the envelope validator bounded the history
array without checking its producer roster. `capturePipelineHistory` captured
bounded plain JSON without checking duplicate producer IDs. The restore path
therefore had no global unique producer invariant before operation replay.

Each standard PLANE individually accepted the same canonical ID as either a
number or decimal string and derived `source-plane:1:[id,"body"]`. Two producers
with equal IDs could consequently reach the same constructed source identity.
Operation-local native ownership, the UI allocator and later edit classifiers
cannot establish uniqueness of an imported complete history. This finding comes
from the actual source/delegates; no before browser incident is asserted.

## One admission contract, no renaming

`authoredFeatureIdentity.mjs` defines one canonical identity domain: positive
safe integer numbers and their exact canonical decimal strings. Numeric `1` and
string `"1"` claim the same ID. Zero, negative/fractional/nonfinite numbers,
unsafe integers, missing/accessor IDs, and strings such as `"01"`, `"1.0"`,
`"1e0"` or expressions refuse as `INVALID_FEATURE_ID`. Duplicate claims across
**all** authored kinds refuse as `DUPLICATE_FEATURE_ID`, including consumed and
future/redo history entries. The helper does not rewrite the serialized value.

The existing native validation Worker checks the complete roster before
expressions, sketch preparation or replay. The full cooperative pipeline
capture independently claims each completed detached root entry (or verified
snapshot in currentness comparisons), reusing its existing bounded yielding
traversal. No second JSON/hash pass, compatibility remapping, document flag,
geometry algorithm or journal is added. Standard PLANE uses the same canonical
conversion while retaining its own enumerable raw-data requirement, raw versus
materialized equality and stable source prefix. The ordinary command allocator
and duplicate check remain in place.

Only `INVALID_FEATURE_ID` and `DUPLICATE_FEATURE_ID` are propagated from the
validation Worker through the existing PM validation rejection. Other errors
retain their existing message behavior. This is a narrow typed refusal boundary,
not acceptance of arbitrary Worker-provided diagnostic codes.

## Complete native Open extension

The existing `native-open-integrity-driver.mjs` retains its genuine public
rectangle/normal Save, unmatched-source negative copy and healthy normal
Open/discovered width edit/Undo/Redo. One additional own malformed native file
appends a clone of its actual saved PLANE operation with the equal ID expressed
in the opposite numeric/string representation. Removing that one added record
must reproduce the genuine saved document exactly. It is an expected-refusal
fixture, never source for successful CAD authoring or a geometry claim.

The complete workflow must receive `DUPLICATE_FEATURE_ID` before accepted Open
publication, preserve the exact accepted/host/document/source/history/journal/
counters/net-resource snapshot, and preserve hashes of the original and both
negative files. It then opens the untouched genuine file and performs the
original positive edit/travel sequence. No retries, file races, interruptions,
other-account probes, native geometry seeds or new service are involved. Root
will execute this only after the full normal application is composed.
