# Retained revolve/sweep READ regressions on the current cohort

SOURCE-READY ONLY. No helper/driver/oracle invocation, build, probe, browser,
Worker/native call or runtime/source change was performed during preparation.
Root alone runs serial complete workflows after its active attachment/consumer
work is terminal. Existing Desktop runners, examples and historical evidence
remain unchanged. These are existing complete flows, not replacement cases.

## Actual delivery prerequisites

Current producing Core b3a7bb227da38524309e8cc0c6c8a8646d00b854, Desktop
78cc1694eca1a88623f33e7ff748673c909a6017, bundle
ed8d72d1975c69318bc297255ff3d38a54624b024e74cb4c0c8f744a8ef89ceb, outer indexSHA
79a29a1f8c13d1536d3ce48c22c2243bb1b748f8f1f5acc082b21ad89fa93113, actual catalog
2318c6c29f533ede112ac769f2ae30afd77784b21ac99a7f1153d3395bb73739.

The stage at
`/mnt/data10tb/codi-acad-typed-signed-pl-stage-20261108-r1-apps/apps.json`
already includes the complete EXACT23-file `static/revolve-profile/` graph,
26-file `static/sweep-profile/` graph and shared
`static/prism-semantic.d8809c51ac0e83bd11bf.js`. None of these50 entries occurs in
the current178 pins `/tmp/codi-acad-typed-signed-pl-pins-20261108-r1.json`.
No normal rebuild, stage/alias change or alternative engine is required.

`b3a7-catalog-records.json` freezes every actual relative path/hash/byte count:
23revolve records36052724B,26sweep36088559B, sharedsemantic2110407B,
total74251690B. Frozen record-file SHA is
a6fc13f65062df3ec1f44d810974bae2b7cba5da0ac03219c259077eadc7cfe6.

| Explicit runtime | JS SHA256 | WASM SHA256 |
| --- | --- | --- |
| Retained revolve | 567419c13c78fff46cbc9cd07e5a993106b652a13cb9f6944831f68ef48729cc | ad9475c81ea2eecadd41c73f0b0860d7d06c53e4292b16047472f03995f3efdd |
| Retained sweep | a9cfa6e53a8bc14f2fb035e33afd1a82d9ae36ace1cf9f66169c739d2de72580 | e105bdfe7c7bcb113eee5398d8202831cb8e8b1608dcc1730fc4461c9f24263d |

Actual staged Worker hashes: revolve
f888a27ea65fa7eefec4c7486789c0c1e8b4fcb9f058e30110f67f314fe7c9fe;
sweep737d576bec074e93824467a3eb04641a23420ab55eeb483424d5f2234f6647c1.
Sharedsemantic SHAa15a165d7c1af614dead8233e8c6490c65058b27be5ff11f5444da9ee9a06c3d.
CatalogMount requires its exact per-cohort module sets and paths. These record
sets include the workers, exact native pairs and complete declared module
closures; no allowlist widening or Native cohort substitution. The revolve
runner hardcodes its pair in measure.mjs; the sweep pair must be supplied exactly.

## Optional root-owned offline pin preparation

The NEW helper is intentionally bound to this tuple and frozen50 records. It
streams actual staged bytes in1MiB chunks against BOTH catalog metadata and
frozen records; preserves ALL old metadata/pins and exclusively creates a NEW
228-entry output. Matching preexisting members of these50 deduplicate. An input
containing the unrelated legacy4 extension is a different subset and is refused;
use the actual178 input below. Old helpers and pins remain untouched.

```sh
python3 test/retained-profile-read-delivery/prepare-current-b3a7-pins.py \
  --pins /mnt/data10tb/codi-acad-typed-signed-pl-pins-20261108-r1.json \
  --stage /mnt/data10tb/codi-acad-typed-signed-pl-stage-20261108-r1-apps \
  --out /mnt/data10tb/codi-acad-retained-profile-read-pins-20261108-r1.json
```

This yields offline staged-byte/pin preparation evidence, NOT a Native/runtime
pass. Root copies/freezes the NEW pins at its normal runner host path below.
Do not run the old4a65 or legacy4 helper on this tuple, or modify old178 evidence.

## Precise eventual whole invocations after serial release

Use the existing Node/PUPPETEER_CORE_PATH24.35.0 environment from the root's
current complete-run harness. All paths below are prospective NEW output names,
not assertions that these runs or output pins already exist. The exact source/
Desktop values describe producing runtime, not later docs/acceptance Git HEAD.

Common environment on the runner host:

```sh
export CODI_SIGNED_PINS=/tmp/codi-acad-retained-profile-read-pins-20261108-r1.json
export CODI_EXPECT_SOURCE=b3a7bb227da38524309e8cc0c6c8a8646d00b854
export CODI_EXPECT_DESKTOP=78cc1694eca1a88623f33e7ff748673c909a6017
export CODI_TEST_URL=http://127.0.0.1:21030/
export CODI_TEST_CDP=http://127.0.0.1:19329
```

First complete stepped revolve (its BUILD is immutable, no engine environment
override). Desktop source root below currently retains the exact relevant
helper/adapter/driver sources of the producing78cc runtime:

```sh
CODI_EVIDENCE=/tmp/codi-acad-read-stepped-revolve-20261108-r1 \
  node /tmp/codi-desktop-mechanical-candidate-20261105/test/agent-cad-corpus/revolve/stepped-signed.test.mjs
```

Only AFTER terminal whole exit0/receipt PASS, require its FOUR actual saved
checkpoints and run the existing independent saved-source checker:

```sh
node /tmp/codi-desktop-mechanical-candidate-20261105/test/agent-cad-corpus/revolve/check-saved.mjs \
  /tmp/codi-acad-read-stepped-revolve-20261108-r1
```

Then complete four-case signed-point sweep; explicitly UNSET case filtering:

```sh
env -u CODI_SWEEP_CASE \
  CODI_SWEEP_ENGINE_REVISION=sha256:a9cfa6e53a8bc14f2fb035e33afd1a82d9ae36ace1cf9f66169c739d2de72580:e105bdfe7c7bcb113eee5398d8202831cb8e8b1608dcc1730fc4461c9f24263d \
  CODI_EVIDENCE=/tmp/codi-acad-read-sweep-point-20261108-r1 \
  node /tmp/codi-desktop-mechanical-candidate-20261105/test/agent-cad-corpus/sweep/signed-point.test.mjs
```

Only AFTER terminal whole PASS, require all four case statuses (straight-disk,
straight-annulus,quarter-forward,quarter-reversed),12 saved checkpoints and
13 actual queries/77points, then invoke the existing after-whole checker:

```sh
node /tmp/codi-desktop-mechanical-candidate-20261105/test/agent-cad-corpus/sweep/signed-point-check.mjs \
  /tmp/codi-acad-read-sweep-point-20261108-r1/receipt.json
```

The retained revolve checker validates supplied saved rows, not whole terminal
status or temporal lifetime by itself. The sweep checker independently validates
each actual saved-source/query but the runner permits an optional case filter;
neither must accidentally turn a partial run into the full requested regression.
Current malformed-vector bridge remains Error/code:null with exact message
`Expected bounded dense point data.`, matching the frozen sweep control. No
source-confirmed mismatch requiring driver changes was found in these seams.

## Honest persistence and precision scope

Both unchanged flows explicitly Save/Open `.jsketcher.json`, parse JSON and
require the historical v2 `codi-jsketcher-project` envelope. Current Desktop
native-project-file.mjs STILL advertises both extensions and dispatches an
explicit historical path to the existing JSON preparation/restore route. Thus
the old whole/oracles can run on the current `.cad`-CAPABLE runtime unchanged;
they do NOT produce/parse `.cad` archives or establish a new `.cad` regression.
Do not rename those paths or use a different oracle silently. Current composed
`.cad` proofs remain separately identified in the acceptance matrix.

Retain historical tolerances exactly: revolve driver volume1e-6mm³ and bounds
1e-7mm (saved-source checker1e-6mm); sweep1e-6mm³/1e-6mm with exact categorical
Native classifications and exact source/currentness/resource comparisons where
declared. These runs do not retroactively certify50pm topology/branch behavior,
general transport, arbitrary axis shapes, all Native lifetimes or full Gate1.
