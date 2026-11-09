# Legacy prism: staged delivery and bounded pin extension

Read-only delivery/source audit, not execution. Packet015b060 remains unchanged.
No build, browser, Worker/Native call, probe, backend substitution, product or
fixture change. The helper below is prepared source only; root owns its later
metadata/byte-verification invocation and any new signed-pins output.

## Actual stage and tuple

R730 manifest:
`/mnt/data10tb/codi-acad-authored-stale-e16-stage-20261108-r1-apps/apps.json`.
Observed manifest bytes116489; SHA256
`930d7ce1b99a4189a02d79e5927f18e334a8ea440d9f40f6747594df6f5621b9`.
It is `codi-public-apps/2`, hostAPI2. The jsketcher app has471 file records:
469 Core assets under `node_modules/jsketcher-build/`, plus outer index.mjs/css.

Producing Core `4a65a67d104d9866580d3bd1681ae960476343c2`, Desktop
`78cc1694eca1a88623f33e7ff748673c909a6017`. Outer bundle
`fc268f4051e8284ded0ad9c9ae8f830c35cb7a63425f6a8cfaf250898f3ac258`, indexSHA
`79a29a1f8c13d1536d3ce48c22c2243bb1b748f8f1f5acc082b21ad89fa93113`.
The manifest's app path is
`assets/desktop/apps/jsketcher/<that-bundle>/index.mjs`.

Current `/tmp/codi-acad-authored-stale-e16-pins-20261108-r1.json` has178 entries
and that exact producing/outer tuple. NONE of the following four is included.
They ARE present in the actual stage catalog; no alias/backend change is needed.

All relative paths below resolve inside the iframe's current Core directory,
`node_modules/jsketcher-build/`. Their manifest keys prepend that directory.

| Core-relative path | Manifest SHA256 | Bytes |
| --- | --- | ---: |
| static/occ-portable.js | a84b31900e58e61a1d7e3f8d04978408455764ad149923359e7fba19d3d07884 | 307709 |
| static/07d763a05f35cd257501.wasm | 07d763a05f35cd257501d339d9087df63c65bcaeb51a4f4f80832e333892e12e | 34989243 |
| static/oci-verified-worker.js | 789b9c98cc2eb0922b2520b85f2eff7fa3f7673202b2f6d7c488768ec0a80731 | 429078 |
| static/prism-semantic.d8809c51ac0e83bd11bf.js | a15a165d7c1af614dead8233e8c6490c65058b27be5ff11f5444da9ee9a06c3d | 2110407 |

These four sum to37836437 bytes. Actual staged on-disk paths prepend:
`/mnt/data10tb/codi-acad-authored-stale-e16-stage-20261108-r1-apps/apps/jsketcher/<that-bundle>/node_modules/jsketcher-build/`.
Table values here are catalog metadata. This audit did not invoke the prepared
stream verifier or claim a new served-byte/runtime qualification.

## Producer/import provenance

`modules/workbenches/modeler/features/workerRectangleExtrude/workerRectangleExtrude.operation.ts`
imports `codi-oci-verified-worker`, `codi-occ-portable`, `codi-occ-wasm` and
`codi-prism-semantic-worker`. The legacy centered/corner adapters reuse the same
candidate prism mount/semantic pipeline; they do not request a modern catalog
build. `oci-verified-mount.mjs` fixes exact a84b3190/07d763a0 runtime identity.

At the producing Core source, webpack aliases select `.build/prism-assets/`
oci-verified-worker.js, occ-portable.js and occ.wasm. The semantic alias selects
`.build/prism-semantic-worker/worker.js`. `prepare-prism-assets.cjs` verifies the
07d763a0 cached WASM, builds the reviewed portable loader and embeds the exact
common bootstrap/loader into the legacy OCI worker. This is source provenance,
not evidence that this review executed those builders.

Actual staged `static/index.bundle.js` text confirms webpack resource modules
for `./.build/prism-assets/occ-portable.js` and oci-verified-worker.js export the
same-named files relative to its public static directory. The EXACT
`./.build/prism-assets/occ.wasm` module exports
`07d763a05f35cd257501.wasm`; this is the existing generic WASM file-loader name,
not a missing occ.wasm or a changed pair. The semantic resource module exports
`prism-semantic.d8809c51ac0e83bd11bf.js`. Do not add a new WASM exclusion merely
to rename this valid legacy path.

The flat legacy pure-module graph remains actual staged source. The producer's
ten profile/centered/corner/arranged-region resource roots have17 static module
dependencies including authoredRegions, polygon/profile plans, topology,
bounded boundary and exact contact helpers. They remain colocated static assets
in the SAME content-addressed app catalog. A four-entry extension does not
pretend to enumerate/requalify every one of those individual module hashes.
The full app catalog and bundle tuple remain the existing delivery authority;
the complete workflow still checks real successful source/Native operations.

## Recommendation and source-only helper

Keep the existing stage, engine/default, bundle, source/Desktop tuple and178 pins
unchanged. Create a NEW pins document extending only these four exact records
(182 entries for the observed input; matching preexisting entries deduplicate).
This gives frozen015 its actual old pair plus actual worker/semantic source
pins. Do not replace a84b3190/07d763a0 with an easier modern runtime or mutate the
old signed pins file.

NEW `test/legacy-runtime-delivery/prepare-pins.py` is an optional root-owned
preparation helper, NOT executed here. It requires this precise source/Desktop/
outer/catalog tuple, checks the four metadata hashes/lengths, streams the four
actual staged files against BOTH that catalog and the fixed table, retains every
old entry/metadata field unchanged and writes exclusively to a NEW output path.
It emits a bounded receipt with manifest/input/output hashes and new count.
No browser/native functionality is invoked or inferred by it.

Root can supply old pins to R730 under its ordinary fixture custody and invoke:
`python3 test/legacy-runtime-delivery/prepare-pins.py --pins OLD --stage STAGE_ROOT --out NEW`.
Use the stage root containing apps.json/apps, not the Core directory. Then freeze
NEW before the single complete015 workflow. Native/application qualification
still requires that whole run and independent after-whole artifact/source oracle.
