# Actual finite-curve portable loader candidate

Preparation only; unmounted, unexecuted, unqualified. Root reviewed/approved
source transformation2168e9f, then actual session59192 completed PASS0.
The adapter is build/adapt-finite-curve-portable.py (composedf7d1130), SHA256
d6e06ed93276306ddf1ebc8eb747d6c1416d00d660d9b38072de18168441b659.
It applies the same exact single full legacy receiver replacement as the prior
reviewed mechanical wrapper, guards actual frozen input bytes, writes exclusive
new JS and confirms output/readback/input/script custody. No JS/WASM module or
Native function was evaluated or invoked. No ports, defaults, capabilities,
factory/graph/controller/ledger/Host or C11 producer82866bf changed.

Actual Native source d3b2afa; raw build and all49 static exports are retained in
../native-build-r1. Actual R730 raw directory:
/mnt/data10tb/codi-occ-finite-curve-native-build-20261109-r1.
Actual portable directory:
/mnt/data10tb/codi-occ-finite-curve-native-portable-20261109-r1.
Metadata/logs:
/mnt/data10tb/codi-occ-finite-curve-portable-evidence-20261109-r1.

| File | Bytes | SHA256 |
| --- | ---: | --- |
| raw main.js |316580|5f1730c347eb3edeb8b6d5e06eeeedcdf04b2348aac0c92b04001bd5edd5b7de|
| actual occ-portable.js |316530|479f0620b6dfe131dac05131a3798fc533e05a2bd11e8074ef240284f61bbe86|
| unchanged main.wasm |36216184|746da919c8457e98daa821fae98c62c0a6c9ad1acafd1c3d5412e0207d6b6325|

WASM copied via exclusive new file in1MiB blocks. Both original raw files and
the script were rehashed unchanged after transformation/copy; the complete
copied WASM hash equals the original. portable-result.json and adapter.stdout /
stderr retain actual first execution and results. No working runtime binaries
are committed before functional qualification; they remain on R730.

Reproduce only to a NEW output path, never overwrite this candidate:

    python3 build/adapt-finite-curve-portable.py RAW/main.js NEW/occ-portable.js

Then stream RAW/main.wasm to exclusive NEW/main.wasm and verify its exact
original byte count/SHA before and after. This is a data-preparation command,
not permission to register or use a different pair as the existing old cohort.

Next: actual new-pair ABI/closed Worker admission, protected shape-free source
query ownership, independent original-source semantic extraction, finite-event
certification and full shared trim/extend/history/native persistence acceptance.
The private adapter10dcb60 remains source-only/unmounted; independent source
review found no confirmed blocker, which is not functional growth/cleanup proof.
Raw IntAna2d flags and point samples are not certified finite contacts/absence.
