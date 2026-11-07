# Frozen Boolean-claim helper against genuine native v2 records

Tests/evidence only under this new directory, based on CAD `6e1cd8c89ccdc96b11d6edc47fbb5a9f3a6ae304`. The helper and all shared product/native/UI/Worker/controller files remain unchanged. No new native build, browser, Files, live-server access or network change is performed by this lane.

## Actual producer and complete payloads

The records are genuine direct C++→WASM native observations from source `7d6fb5ab99e257eac3e6dbb7c11ece9f319d5a03`, header SHA `852e592a5cfe654668e4207dbbab3259235e11442248975fa92480da1dec82b8`. They are not output from a fabricated topology/geometry engine. The producing lane executed them earlier; this lane independently replays the recorded observations through the frozen pure helper in a real Node Worker.

- `matrix-r3/observations.jsonl`: all61 original records, SHA `a1a333fa692a9ab83c38a9f6ed2b7b6a52dee4b01fd8bd3baf25f4877e5b63b9`.
- `plate-r1/observations.jsonl`: all40 original records, SHA `ab6d33f646a8b7ad2f89fc2aaf435efc7e001dae90ddef6268a68243bbb4c3af`.
- `native-source-pins.json`: read-only R730 source/header/raw/JS/WASM hashes verified for this follow-up.
- `native-producer-pins.json`: producing lane's exact code/toolchain/flags/runtime pins, including matrix/plate CPP source hashes. The plate producer captures one real `prism.Generated(sourceVertex)` edge for each initial corner label before destroying the builder; later lineage follows native history without geometric reselection.
- `native-receipt.json`: producer's scoped result, preserved separately from this follow-up's own `receipt.json`.

Original before/after catalogs, tolerance arrays, both complete sourceCopy certificates, both complete raw ancestry-v2 maps, and full result catalogs/metrics remain in the original payloads. The follow-up receipt also hashes each source catalog, copy certificate, ancestry map and result catalog. Native serialized-BRep equality is reported by the original probe with byte counts; raw BRep strings are not provided here, so this replay does not independently reserialize them.

## Copy and identity semantics

The native operation uses verified detached copies. `sourceCopyA/B` describe ORIGINAL→WORKING bijections independently of Boolean history. The replay checks every original member's mapping and complete working membership, source counts and copy flags. `BRepBuilderAPI_Copy` uses true/true geometry/mesh flags. Only a genuinely empty source uses `TopoDS_Shape.EmptyCopied`, false/false and zero counts/maps. The tests do not assume copy target ordinal equals original ordinal.

Raw ancestry source indices are **already composed back to original input indices** by the native exporter; no second ordinal remap is applied here. Every raw SAME set is empty in these records, as expected for detached geometry. Meaningful ancestry is recorded via the verified copy→Boolean composition into MODIFIED. Neither helper nor tests relabel that as `IsSame(original)`.

All matrix IDs are explicit **arithmetic fixture-local labels** over native source catalog members. They are not authored persistent IDs, recovered public selections, or a public binding proof. The same-handle fixture uses a shared local namespace because the pinned native producer passes the same source shape twice; independently constructed identical boxes retain distinct fixture namespaces. Mixed vertex/edge/face claims are simultaneous and never conflated by ordinal.

The four plate corner labels are native-only initial construction labels, supported by actual Generated(sourceVertex) provenance in the pinned producer. Their initial coordinates are checked as an independent fixture sanity control. Later cuts follow the native maps only, never coordinates/nearest matching. The labels are not public CAD feature IDs or save data.

## Results

All69 successful native Boolean observations replay through the frozen helper:

- 59 matrix successes,2 recorded typed refusals preserved without inventing a result.
- 19 genuine empty results and9 multi-solid results, preserving their measured catalogs and lost/unclaimed selections.
- 1178 resolved matrix claims,1164 `NO_DESCENDANT`,388 `MERGED_DESCENDANT` under the complete two-input claim sets.
- 48 actual same-kind split relations. With all source members claimed, each split overlaps another ID and correctly uses merge precedence. A separate subset-claim control on unchanged `overlap-ab-0`, source A edge9→[5,13], verifies `MULTIPLE_DESCENDANTS`, no resolver and no arbitrary target choice.
- 40 generated vertex links preserved by private generated readers:20 from seam edges and20 from faces across the10 plate cuts. Generated vertices remain separate from inherited claims.
-All40 outer-corner bindings survive the10 recorded fixed-cylinder cuts across100×50 and150×30 plates, including actual native renumbering at the first cut. The current body snapshots are checked exactly between cuts. This is not authored/public through-all hole, save/reopen, or post-treatment public naming qualification.

Every complete source row and generated target set is read/checked, including unclaimed rows. Captured inputs remain exact after helper calls; native input catalogs/tolerance snapshots compare exactly. Result data-only observations contain no native indices; ordinal lookups remain private functions. The helper/catalog/test/source/raw/oracle hashes are captured in this directory's receipt.

`oracle.py` independently joins the native relation tables in Python and produces expected matrix bindings/refusals. It does not call the product helper, synthesize native histories or manufacture geometry. All recorded metrics are retained; this lane adds ancestry reconciliation qualification, not a new general geometry correctness certificate.

## Retained first failures

`first-run.log` records an initial test-runner relative import path error (one parent-directory level too many), corrected within this new test directory only. `first-complete-run.log`/`first-complete-receipt.json` retain the first complete replay's aggregate assumption that an all-members claim set must yield isolated MULTIPLE descendants. All actual records already passed; the aggregate failed because real overlapping splits have MERGED precedence. The unchanged native edge9→[5,13] subset control separately proves isolated-split behavior. No helper, native observation or reconciliation rule was changed for green.

```sh
python3 test/boolean-selection-claims/actual-native/oracle.py
node test/boolean-selection-claims/actual-native/run.mjs
```

This passes with Node24. The source helper is the frozen implementation integrated by root as `b70dc922c`. Native builds are Node-targeted WASM probes, not native-CPU execution or the main public app/Worker runtime. Public contexts, ownership-ledger integration, public hole semantics and durable authored selections remain separate work.
