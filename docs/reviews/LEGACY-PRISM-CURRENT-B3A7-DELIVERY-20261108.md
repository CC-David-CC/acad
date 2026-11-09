# Legacy pins: separate current b3a7bb2 tuple

Source-only followup; no invocation, test, build, browser, Worker/native call or
fixture mutation. Original015b060 workflow and old16ca599 helper stay unchanged.

Current reviewed producing tuple:

* Core b3a7bb227da38524309e8cc0c6c8a8646d00b854.
* Desktop78cc1694eca1a88623f33e7ff748673c909a6017.
* Bundle ed8d72d1975c69318bc297255ff3d38a54624b024e74cb4c0c8f744a8ef89ceb.
* Same outer index79a29a1f8c13d1536d3ce48c22c2243bb1b748f8f1f5acc082b21ad89fa93113.
* Actual catalog SHA2318c6c29f533ede112ac769f2ae30afd77784b21ac99a7f1153d3395bb73739.

Read-only metadata at
`/mnt/data10tb/codi-acad-typed-signed-pl-stage-20261108-r1-apps/apps.json`
contains the SAME four legacy paths/hashes/lengths documented in
LEGACY-PRISM-STAGE-DELIVERY-20261108.md. The current signed178 pins file is
`/tmp/codi-acad-typed-signed-pl-pins-20261108-r1.json` on root host, mirrored at
the corresponding `/mnt/data10tb/` path by root's fixture preparation. Root owns
copy/selection of that actual input for its R730 invocation.

NEW `test/legacy-runtime-delivery/prepare-current-b3a7-pins.py` is a separate
explicit-tuple helper, not a relaxation of old prepare-pins.py. It requires this
exact input/catalog/source/Desktop/outer identity; streams the four existing
files with1MiB chunks; checks hashes and byte counts against BOTH fixed reviewed
records and actual catalog; preserves ALL old pins/metadata; and exclusively
creates a NEW182-entry output (matching preexisting four entries deduplicate).
No guessed backend, source flags, runtime/driver/example changes or new API.

Root may invoke only after review, under its own fixture custody:

```sh
python3 test/legacy-runtime-delivery/prepare-current-b3a7-pins.py \
  --pins /mnt/data10tb/codi-acad-typed-signed-pl-pins-20261108-r1.json \
  --stage /mnt/data10tb/codi-acad-typed-signed-pl-stage-20261108-r1-apps \
  --out /mnt/data10tb/codi-acad-legacy-physical-writer-pins-20261108-r1.json
```

The prepared receipt is metadata/staged-byte verification, NOT a runtime pass.
Root retains the old178 pins and old4a65 helper/evidence, copies/freezes the NEW
pins to its normal runner host, and later runs the complete015 workflow serially.
No pending PL workflow source or producing runtime is changed by this packet.
