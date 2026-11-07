# Shared authored metadata journal component

Product `fcedb535e`, based on CAD `3eecf395e`. Only existing production file changed: `web/app/cad/craft/authoredEditJournal.mjs`. Tests are synthetic metadata/journal controls, including a real Node Worker for the larger algorithms. They are not native geometry, app publication, public Undo/Redo, Save/Open or drawing measurement proofs.

New exports:

```js
captureDocumentMetadataRecord({kind,version,domain,key,before,after,byteSize})
documentMetadataTarget(entry) // {kind:'document-metadata',domain,key}
recordDocumentMetadataEdit(state,{document,revision,domain,key,before,after})
planDocumentMetadataTravel(state,{document,revision,direction,domain,key,current})
// travel returns {domain,key,before,after,next}; it performs no writes/replay.
```

Domains are exactly `manufacturing` (fixed key `manufacturing`) and `linked-part-drawing` (drawingId key). Null payloads represent creation/removal. Equal before/after and both-null entries refuse; the separate preparation layer returns changed:false for no-op. All snapshots/records/state proposals are detached and frozen. Travel checks exact document/journal revision/direction/entry kind/domain/key/current payload, advances only the proposed cursor/revision and retains the same entries array. Targets contain no invented geometry index or featureId.

Drawing capture directly reuses the integrated strict drawing definition/record modules and its262144 per-entry charge. This does **not** enable drawing publication: that must remain unavailable until a native envelope adapter can save/reopen its definitions. No RAM-only drawing setter is added here.

Manufacturing capture copies plain own-data descriptors, rejects accessors/symbols/sparse arrays/custom prototypes/cycles/non-JSON values, and incrementally charges actual JSON tokens before invoking existing `validateManufacturingMetadata` on the detached data. Its semantic validator/defaults are reused, not duplicated. Exact captured values, including represented transform−0, remain unchanged; the legacy validator's JSON-clone result is not used as normalization. Generic preparation's private128-definition/32-part/256KiB limits are not imposed on existing metadata-v1. Tests preserve10000 definitions,33objects and33regions and existing metadata unit/escaped-label values; later actual publication still enforces the document's own canonical-unit/target policy.

The new record's `byteSize=max(UTF8 bytes,2*serialized code units)` excludes the byteSize field itself and is counted in **both** existing8MiB accumulation and eviction subtraction. Existing64-entry branch/eviction rules remain the one journal. Captured immutable records are weakly memoized for repeat target inspection; this is not a second history owner and does not make transferred/untrusted records authenticated.

Evidence:

- 11new component groups PASS, including mixed geometry/material/drawing LIFO/branch, malformed/currentness/no-op/charge cases, getter hooks not called, Unicode and exact represented values.
- Actual Node Worker confirms exactly8388608-byte charge accepted,8388610 refused, legacy metadata beyond narrower generic request ceilings, exact mixed eviction and retained geometry entries.
- 17retained existing journal modules /113groups PASS; their paths are in `evidence/retained-files.txt`. No old tests/assertions were edited or skipped.

There were no failing component runs in this slice. Source/test/log SHA-256 pins are in `evidence/pins.json`. Reproduce with Node24:

```sh
node --test test/document-metadata-journal/journal.test.mjs
# Run the17existing paths listed in evidence/retained-files.txt with node --test.
```

Large8MiB capture, legacy semantic validation and charging are synchronous pure algorithms and Worker-capable. The Node Worker proof does **not** establish that running them on the UI is acceptable. Actual publication integration must stage heavy validation/charging off-main or reuse an authenticated immutable owner preparation, with that boundary explicitly reviewed. No full application build/typecheck, browser/native success, main-thread performance, native memory or public latency claim is made.

The confirmed existing material-assignment-disables-prior-Undo integration defect remains OPEN until root integrates the joint manager metadata/journal/accepted-tip publication. This component supplies records/plans only. Craft, projectManager, generic preparation, native envelope, common Worker, Desktop and all services remain untouched. Root must first enable manufacturing publication through the shared atomic A/J/T path, keep drawing publication unavailable pending persistence, and retain truthful post-commit notification/lifetime outcomes. No native replay is called by these functions; actual integration must prove the same behavior.
