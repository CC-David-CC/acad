# Shared one/two-source native selection reconciliation

Base `41e6e82a37b782f365e43fc6d56d17b17a868f03`. Production change is confined to `modules/engine/mount/booleanSelectionClaims.mjs`; all new tests/evidence are here. No public metadata/context/Worker/native/registry/model/history/UI/service changes are included.

`reconcileNativeSelectionClaims(input)` accepts exactly **one or two genuine source snapshots**. `reconcileBooleanSelectionClaims(input)` retains its exact **two-source** admission and existing error for one source. Both thin exports call one private implementation, which captures the actual supplied input once and loops over its actual source count. No dummy source, synthetic empty history, second capture or separate reconciliation implementation is introduced. The existing claim/schema/UTF-8 resource validation, collision/split/deletion/generated rules, metadata and private ordinal resolvers remain shared and unchanged.

`readGenerated(inputIndex,kind,sourceIndex)` now validates against the actual history count. For one source, index0 is valid and index1 is explicitly `INVALID_SELECTION`; for two sources the old0/1 behavior remains. `resolveVertex` and returned observation shapes are unchanged. Existing Boolean-specific diagnostic strings remain unchanged inside the shared core; the new one-source arity diagnostic is the only added admission message.

## Current proof

The new real Node Worker corpus has10 groups:

- Four replay genuine recorded one-input fillet/chamfer/sequential/radius-edit ancestry-v1 records with **one source only**. They preserve raw-deleted survivors, generated evidence, lost connectors, result types, input bytes and a single input0 evidence row. IDs are explicit fixture-local arithmetic labels over actual catalog members, not public authored identities. No new native execution is claimed.
- Five clearly synthetic one-input v2/data-admission groups test vertex/edge/face claims, generated cross-kind targets, dedup/split/merge behavior, old Boolean one-input refusal, zero/three/sparse/malformed input rejection, getter refusal, detachment/freeze and exact UTF-8 resource boundaries.
- One group compares both APIs' data-only observations, private bindings and every generated reader over all69 genuine recorded two-input Boolean successes. There is no semantic difference for these two-input records.

The one-source capture accepts exactly524288 encoded input bytes and refuses one byte more; returned observation is509461 bytes for that fixture. A multibyte-overcap case refuses by bytes while its character count remains below the limit. This is synthetic bounded metadata, not invented native geometry or a promise that every maximal count combination fits.

The new runner also executes the **unchanged existing18 Boolean groups** and the **unchanged actual-native69-success/two-refusal/ten-cut replay** directly as Workers. It does not invoke their file-writing runners. SHA checks before/after prove their old pinned receipts/logs remain exact; current source/proof hashes and all current outcomes are written only into this directory's `receipt.json`. The retained actual-native suite still checks genuine source-copy certificates, raw v2 vertex relations, empty/multi-solid outputs, merge precedence/isolated native split, and40 corner bindings across fixed native cuts. Their earlier runtime qualifications are not relabeled as fresh native or app execution.

All three current Worker corpora PASS; no skipped cases or old test expectation changes. `first-run.log` retains the initial passing run; `run.log` is the final source-matched run after removing an unnecessary test-expression condition. Product reconciliation rules did not change between those runs.

```sh
node test/native-selection-claims/run.mjs
```

Use Node24. This is pure/source/recorded-data qualification only. No public app, real-time native operation, ownership-ledger integration, persistent authored selection, public hole, save/reopen or service qualification is asserted.
