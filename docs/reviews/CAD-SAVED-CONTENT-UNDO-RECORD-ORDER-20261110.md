# R7 saved-content Undo mismatch — confirmed data and source-only repair

Original whole remains FAIL at
`/mnt/data10tb/codi-acad-saved-content-20261110-r7/whole/receipt.json`.
No whole, reader, test or build was retried for this source repair.
Core ff9ae6badfbf90e1354c7775353a226ba5f9bdb6,
Host64e70e9b548e41006f8334d7b349654f88459732,
acceptance a00d3d69c0e4c9cf92b75a7fd46e05a3871889e6.

Read-only observation of the retained owned R7 frame was written to a NEW
file `/mnt/data10tb/codi-acad-saved-content-20261110-r7-dirty-diagnostic-1.json`.
The document revision before/after read was the same
`a950f758-7715-466d-8616-ba788b1f7af3`. Cache generation2 reported equal=false,
so the observation does not support the missing-baseline hypothesis.

Independent saved-archive decoding and exact current-source comparison found:
- All16 source sketch raw strings are byte-identical to the saved archive.
- The complete JSON-value authored envelope is equal, with source counter16
  unchanged and manufacturing/presentation/drawing absent/null as before.
- Actual pre-save history in the immutable whole receipt has each operation's
  keys in insertion order `type,params`; after Undo all16 have `params,type`.
- Each actual pre-save params record is ordered
  `featureId,orientation,depth,datum`; after Undo it is ordered
  `datum,depth,featureId,orientation`. These are32 observed record-order
  differences; no changed history value was found.

The archive's canonical model entry itself has sorted keys, so comparing only
that entry's key order with current captureModel would not prove the baseline's
original order. The original receipt's before-source provides that evidence.
The private Worker baseline bytes were not extracted directly. The observed
cache result, exact value equality and confirmed original/current order change
match the source comparator's insertion-order sensitivity.

## Repair

Exact comparison now normalizes object RECORD key order in the Worker. Native
Save baseline capture and comparison preparation use that same ordering mode.
Array ordering, field names/presence, exact JSON numeric values and exact string
values remain significant. No geometric tolerance, value rounding, hash-only
equality, revision-as-dirty or ignored document field was introduced.

JSON file encoding continues to preserve the original envelope property order.
It uses a separate temporary ordered stream so comparison canonicalization
cannot change persisted Unicode-fragment placement or rewrite source intent.
This transient Worker buffer must be included in later memory measurement;
no full-scale capacity/peak-RAM claim is made by source review.

The grouped acceptance already requires Undo-to-saved=false and native/JSON
source persistence. Add explicit independent evidence that value equality is
preserved even when record order differs, rather than relaxing that assertion.
Runtime proof still requires one fresh coherent composition and grouped run.
