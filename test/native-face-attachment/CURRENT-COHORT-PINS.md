# Exact b3/78cc native-attachment pin extension

Source/metadata preparation only. No helper execution, artifact streaming,
build, test, browser, runtime or driver change was performed for this packet.

The unchanged complete native-face-attachment workflow requires the original
explicit Shell Native pair, not an adaptive or circular substitute. The current
178-pin input already contains that pair and 44 Shell assets. The actual current
Shell emission list and staged apps catalog contain two additional attachment
modules. Their hashes and byte lengths agree with the staged Shell component
manifest; the exact tuple and provenance paths are frozen in
[current-b3-78cc-pin-contract.json](current-b3-78cc-pin-contract.json).

The helper verifies the exact original pin-file SHA256, Core/Desktop and both
app tuples, streams the actual CAD/Files entries and every original selected
asset (including four host modules), then streams both additional Shell modules.
Catalog hashes and byte lengths must match. It deep-copies existing metadata,
adds exactly two files and exclusively creates a NEW output. It changes no
cohort prefix metadata, original hashes, app records, source identity or runtime.
It refuses any pre-existing output. Existing 178-pin files and running receipts
remain unchanged. This is fixture-byte verification, not native/CAD success.

Root may later execute ON R730, after the current serial workflow:

```sh
python3 /mnt/data10tb/codi-acad-original-rectangle-20261107-r1/test/native-face-attachment/extend-current-pins.py \
  --base-pins /mnt/data10tb/codi-acad-typed-signed-pl-pins-20261108-r1.json \
  --apps /mnt/data10tb/codi-acad-typed-signed-pl-stage-20261108-r1-apps \
  --desktop-source /mnt/data10tb/codi-acad-typed-signed-pl-desktop-20261108-r1 \
  --output /mnt/data10tb/codi-native-attachment-b3-78cc-pins-20261108-r1.json
```

Copy the new metadata to the driver's host without changing it; bind it through
CODI_SIGNED_PINS. The helper prints its SHA256 and expected 180-file count. The
new root proof must retain that exact metadata. No need to restage Native or
alter the retained attachment driver/oracle.

Current Core b3a7bb227da38524309e8cc0c6c8a8646d00b854 and Desktop
78cc1694eca1a88623f33e7ff748673c909a6017 remain the runtime tuple even though this
test-only helper commit has a later source HEAD. Original R2 source, equations,
refusals, 50pm source / 1e-9mm derived-cache / 1e-6 Native budgets and all four
.cad cycles remain frozen. A fresh complete whole run and its independent
after-whole artifact oracle are still necessary for current qualification.
