# R2 Native Read contract source review and seam-order repair

Source review after the actual whole R2 refusal, without executing Native,
validators, tests, a build, probes or a browser. The public error only identified
`inspectOwnedCircularSource`'s terminal wrapper; its inner cause was not serialized.
No claim about R2's actual rejected field or numerical magnitude follows.
Native source read at `183ab32cd5261e9f30059cea9546dd74c71f96a9` is the reviewed
820 header plus exact portable adapter; `observationJSON`'s top-level fields,
sourceCount, relation enums, events/owners, span fields/ends, fragment coefficients
and original intervals/orientation, cell mask/area/bounds and wire use fields
agree structurally with `captureNativeCircularObservation`. Native publish calls
the existing JSON-parsing exchange. No JSON field-name mismatch was found.

## Confirmed allowed-wire-order counterexample

The frozen `ownedCircularWorker.mjs:21–22` rotated the semantic cycle to its
canonical start BEFORE collapsing the repeated first/last semantic span.
Consider an allowed Native wire with directed use order:

```
(A, fragment0, FORWARD), (B, fragment0, FORWARD), (A, fragment1, FORWARD)
```

A is one genuine source interval split across the periodic seam; its two Native
fragments remain separately indexed and correctly traversed around B. Both A
uses have the same exact owners/range/orientation. No nearest geometry matching
or approximation is involved.

Consecutive compression initially leaves `[A,B,A]`. Canonical cycle rotation
then produces `[A,A,B]` when A sorts first, or `[B,A,A]` when B sorts first. The
following first-versus-last check sees different entries and does not merge the
cyclic repetition. The valid semantic boundary `[A,B]` is falsely refused as
`Actual Native cell coverage/wire semantics changed`. The frozen Native schema
explicitly permits different fragment indices on a single semantic span and
does not privilege the wire start. This is a source-confirmed invariant violation,
not proof that R2 produced this exact order.

The narrow source repair constructs semantic uses in actual Native wire order,
compresses only consecutive identical semantic records, merges identical
last/first semantic records, THEN applies canonical rotation. It aligns
corroboration with the existing `circularPrismSelectionIndex.semanticLoop` order.
It changes no Native fragment array, use index, source ownership, interval,
orientation, numeric bound, fragment coverage sum, source equation, expected cell
semantics, resource/currentness rule or Native source/pair. No new coalescing by
proximity, phase, TShape ordinal or numerical tolerance is introduced.

## Unresolved actual failure / diagnostics

The coverage accumulator sums every Native fragment length. Native `sameFragment`
uses exact coefficients and original parameters across independently constructed
neighboring BReps. Different periodic parameterizations of one semantic interval
could contribute overlapping ranges. This remains a hypothesis, not a confirmed
actual R2 diagnosis; no coverage check is dropped/widened and no approximate
deduplication is added.

Root separately froze bounded inner-cause message propagation in b7d6590 and is
running the unchanged whole workflow for authoritative diagnosis. That patch is
not duplicated here. A full provenance graph, coordinates, Native slots or giant
JSON need not cross the public boundary. This repair's source logic is complete;
actual qualification remains root's composed build/whole-run responsibility.
