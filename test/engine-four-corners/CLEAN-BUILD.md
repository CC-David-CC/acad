# Clean-library four-corner runtime receipt

A fresh isolated `-j4` OCCT source build of native interpreter commit
`846bea93aebfabb3e18c94672ed4c295ac1c1fa3` completed on R730 with the
Emscripten 2.0.30 binary SDK (revision `f782b50a7f8dded7cd0e2c7ee4fed41ab743f5c0`),
SDK Node 24.19.0 and CMake 3.28.3. Its exact `build.sh` SHA-256 is
`9a5f1bbadaef124ab0799e98378cde06ba5356381667ecb653045db41bbf833e`.
The script validates the exact clean Git source, requires at least 15 GiB free,
copies/reactivates the SDK in the new output and compiles the OCCT libraries
from source. R730 output is `/mnt/data10tb/codi-occ-four-corner-clean-20261104`.
The 846 output JS SHA-256 is
`8423f560d5dd6f7d69309a0d2ad28986872daba316996573ef47f606a1e84b31`; WASM is
`f7a1c5a0abf7e07c04a5b4ad1c0f07bbfa0e0225e7d723a7baffdd3cc64e9b27`.

The later line-frame child `8c4f30048fe65d9205c310d164b45d00d3fe77c3`
changes only shape-io files. Both commits' exact OCCT subtree ID is
`03322238bd2c044dcf3fe6cf629c1e7e90b176fa`. The checked
`link-clean-line.sh` (SHA-256
`fdbc43d4bcb8e171e3fa5c840eddc40120f324910369504780a71b1f4aa1bc51`)
checks both Git commits and tree identity before compiling/linking the 8c
shape-io against those freshly built libraries. Its JS SHA-256 is
`81996d394b9fd2fcd7b02a0448bf7968c2decc04969d2be7ace4512cbfc5620a`;
WASM SHA-256 is
`13617eda9a2118edfd1244b5d46523e7d9628a87ec995a0237b2b5cc58d532f2`.
This is one clean OCCT-library build with a checked child-source link, not a
second independent complete build or proof of byte reproducibility.

The exact source archives (including interpreter and OCCT notices) are
`source-846bea93.tar.zst` SHA-256
`7d6352a6885bce703566e91bbdd882961c5e387a07eeb7ae114bfac27469ce99`
and `source-8c4f3004.tar.zst` SHA-256
`06d71be31e137f0fb83d96b46ec8b0ac3c1e87d3f88964e6a21cf16d4736d505`.
Both source archives, build scripts and artifacts are backed up at R730 output
and `/srv/data/codi-occ-four-corner-clean-20261104` on example.invalid. The existing
SDK binary archive is `/srv/data/codi-occt-centered-clean-20261104/emsdk-2.0.30-linux-x86_64.tar.zst`
(SHA-256 `6671f9eb7605981fcafe105ebc246f387de42c2d22440ce42bc1d52b7c2fa609`).
The SDK is a binary toolchain input; host OS and build tools are prerequisites,
and this receipt does not claim a rebuilt toolchain or a recipient source offer.

Run the scripts with exact 846 and 8c clean Git worktrees and fresh R730 output
directories as arguments. `test/engine-four-corners/README.md` documents the
real native probe. Both 846 and 8c clean-library outputs passed actual 100×50×20
and 150×30×35 authored prism→center-hole→four-corner native controls, including
one valid solid, correct volume, all cutter histories, unchanged center,
occupied-name, alias, invalid multi-child parent and no-removal cases. The 8c
control additionally passed native forward/reversed line endpoint evaluation.
Its normal and resized topology output hashes were respectively
`c815d9f493c3ab965744df3490df95c32525b21afc218660d919b85d04b32ee0` and
`97f2671c5a420f1911f8ce662500c4bf9cacc1cb27de772c7ac2e13b3b8930ed`, matching
the corresponding incremental research output.

The actual production Worker candidate `365d722d` was tested in real Chromium
under self-only script CSP with the clean-library 8c WASM: the full normal and
resized operations passed; a test-injected disjoint fourth tool caused a
validator error and Worker target termination without returning a result token.
The real mount, host lifetime, authored feature IDs, publication, saved history,
signed desktop packaging, and a released runtime remain separate review gates.
