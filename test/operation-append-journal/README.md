Operation-append journal: edge treatment only
===========================================

Base `53c6203fb0abf37904b695300b81fe445a51b83c`. Product ownership is only
`web/app/cad/craft/authoredEditJournal.mjs`; all new tests/evidence are in this
directory. No Craft, model, UI, native, kernel, source-write or counter changes.

Three new pure exports extend the existing journal:

- `captureOperationAppend(request)` captures exact own-data `{type,params}`,
  with only `WORKER_SOLID_EDGE_TREATMENT_V1` supported. It reuses
  `captureSolidEdgeTreatmentParameters`; no numeric strings, string feature IDs,
  extra metadata, native handles or solved geometry are accepted. The returned
  request, params and ordered edge-ID array are detached and frozen.
- `recordOperationAppend(state,{document,revision,index,operation,previousFeatureId})`
  appends one proposed `operation-append` entry. It stores exactly kind,
  index, featureId, previousFeatureId, operation and byteSize. Index is 0..9999;
  previousFeatureId is null exactly at index 0 and otherwise a positive safe
  integer, distinct from the appended feature. Existing scalar-edit index
  bounds are unchanged; no full-project input is narrowed by this helper.
- `planOperationAppendTravel(state,{document,revision,direction,index,featureId,currentLength,currentOperation,previousFeatureId})`
  returns frozen `{index,featureId,operation,next}`. Undo requires exact current
  length index+1 and the full canonical current operation, compared field by
  field and by ordered edge IDs. Redo requires length index and literal null
  currentOperation. Both require the recorded previous tip ID. Neither path
  serializes the operation for comparison or copies retained entry storage.

Record/travel option objects are also exact own data, with no accessor
evaluation. Journal state remains trusted internal state under the existing
contract. These checks do not prove the prefix graph, complete history,
accepted-owner state, journal-head reference, source currentness or safe
feature-ID reuse. Root's live pipeline must supply those checks and install
the proposed state only with successful atomic publication. Redo reuses this
same immutable operation; the helper allocates no new IDs.

Chronology and limits are shared with existing size, depth, sketch and physical
transaction entries. Recording after Undo truncates the redo suffix; the
existing 64-entry and 8 MiB eviction rules include the new byteSize. No prefix,
history snapshot, signature, model or second authored design is retained.

Byte size is `256 + max(2*serialized UTF16 units, serialized UTF8 bytes)` for
the one canonical request. The fixed allowance covers entry metadata. This
matches existing journal data accounting, not a browser heap-size guarantee.
Accounting walks fixed fields and edge IDs in fragments of at most 1024 input
UTF16 units, preserving surrogate pairs at boundaries. JSON escaping and UTF8
encoding each stay below 16 KiB per fragment; there is no full-ID, full-request
or joined-history serialization. All sixteen maximum 16384-unit opaque IDs
remain accepted, and one maximum record fits the existing 8 MiB journal cap.

Validation covers 16 new groups and 37 retained groups (edge-treatment,
mechanical and through-hole journals): full edgecreate→sizeedit→Undoedit→
Undocreate→Redocreate→Redoedit through the real helpers; wrong parameters,
runtime/source edge keys, stale revisions, tip lengths and previous IDs;
branching, mixed chronology, 64-entry and 8 MiB trimming; own-data/getter
guards; Unicode/escaping/surrogate accounting; and bounded actual encoding
and serialization calls. Test inputs are authored data examples, not geometry.
`harness-before.json` records an initial overly strict test-spy failure: the
existing canonical body-ID helper serializes a tiny two-element array. The
spy now permits that array while still rejecting large request serialization.
No product correction was made for that harness assumption.

Run from the checkout:

```sh
/tmp/codi-files-move-node/bin/node test/operation-append-journal/verify.mjs
```

The receipt binds source/test hashes, commands and the final TAP proof. No
browser, native execution, app Undo/Redo, persistence or full Gate 1 pass is
claimed by this pure helper lane.
