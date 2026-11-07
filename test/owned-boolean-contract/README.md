# Owned Boolean result contract: actual main export and bounded admission

Base CAD `46668a3dd729b44803bb264063095694162ab02c`. Root delegated the new `modules/engine/mount/ownedBooleanContract.mjs` after this lane's read-only review found concrete admission gaps. This lane adds that product module and this new test directory only. No Worker/controller/native/registry/UI/services or network changes are included.

## Actual runtime source

`native-main-receipt.json` is the unchanged genuine main-WASM export receipt from the producing native lane:30 successful results and16 typed refusals. It pins portable JS `dd666902fe926d69cc3c8843f5568c2a3e569f38ff49291baa2f248165b5ea99`, WASM `8d5e537e0d7f9e12b8ae0eaf239c0be1080934ed12a24bf6e7f849c9135ed5a2`, source `e93c8dfd`, runner and probe hashes. The complete measured source/result catalogs, copy certificates, ancestry, ownership counters and point controls are retained. This lane replays the real data in a Node Worker; it does not fabricate successful geometry or execute a new kernel/browser/app run.

All30 real successful records pass the final contract, including empty operands/results, multi-solid outputs and the real cylinder cut. All16 recorded typed native refusals remain recognized, retain no result and do not increase owned-name count. A refusal envelope is not accepted as a successful measured result.

## Findings and fix

The first source inspection caught the empty-copy spelling `TopoDS_Shape::EmptyCopied`; root corrected it to the actual native `TopoDS_Shape.EmptyCopied` before the measured baseline. `baseline-source-hash.json` preserves that initial static finding; it is not an executed baseline claim. `baseline-source.txt`/`baseline-receipt.json` pin the later4261-byte corrected-spelling baseline, SHA `891012293c4f34f369a8c014c046d71a12b4c6dc3d7db08730d70e911fcf10f4`.

The original baseline accepted sparse/extra-property bounds and copy arrays, accepted a custom non-array source-list map function, threw an untyped error for sparse sources and executed measurement/copy accessors. Extended controls additionally confirmed positive volume with collapsed bounds and source/options accessors. Those original failures remain in baseline/extended-baseline logs and receipts. No failing assertion was relaxed.

The new module seals exact plain own enumerable data records before following fields. Source lists, bounds and copy mappings require dense own-data arrays; options are sealed before destructuring could invoke a getter. Result/source topology and copy metadata are detached under a separate bounded geometry capture before the existing topology validator reads nested fields. Positive-volume results require positive finite bounding extents. Native volume is never replaced with a mesh estimate or inferred from tessellation.

Geometry capture uses a4MiB encoded budget per captured topology/copy object,262144 nodes, depth24,4096 per array and16384 text units; current topology/copy member caps remain1024/512/256 with existing wire/use limits. This envelope is above the current useful catalog/copy sizes; it is not a supported native geometry expansion or an OS memory guarantee.

**History is not charged into that geometry capture.** Exact history envelopes/header/counts are checked through own data descriptors; nested rows are captured/validated by the existing one-source reconciliation. Its typed resource refusal reports naming unavailable (`SELECTION_RESOURCE_LIMIT`) rather than invalidating the already-validated geometry. The other available history is still validated independently. Valid native unavailable-history reasons remain explicit; an unavailable/resource-limited first history cannot hide a malformed second history. The resource-stress control is an intentionally oversized history clone over unchanged genuine geometry, not a claimed successful large native history.

## Current proof and scope

The final Node Worker run passes all68 groups:30 real results, one group covering16 real refusals, and37 targeted malformed/availability/resource/empty-method controls. It checks unchanged actual inputs, finite/positive/empty measurements, exact copy bijections, native v2 completeness/membership, sparse/extra fields, getter non-invocation and naming refusal separation. `candidate-r2.log` and `receipt.json` bind final module SHA `162f98b213e5b1948a8400dbc3ddf97b05f31543b417ece1a770f8994b1846e8`,7705 bytes. The source module and both imported dependencies are hashed before/after each run; changing any during execution makes the receipt stale. Older receipts retain their exact original source pins.

```sh
node test/owned-boolean-contract/run.mjs
```

Use Node24. To review another isolated candidate, `CODI_BOOLEAN_CONTRACT_MODULE` may select its actual module file, and `CODI_RECEIPT` selects a new receipt path; imports are unchanged. These test controls do not qualify the production browser integration, ownership ledger/public selection metadata, authored hole/through-all semantics, history, Save/reopen or an entire CAD gate. Root's prepared actual Chromium harness is the next independent step.
