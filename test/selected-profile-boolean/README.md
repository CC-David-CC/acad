# Public selected-profile Boolean runtime binding

The actual ordinary r4 app (`a0b363bce`, app8ae3ddc83) reproduces a command
layer defect: two valid selected-profile OCC operands use one explicit newer
build, but `createWorkerSolidBoolean` stamps the default older revision into
the new history request. Native evaluation refuses `ENGINE_REVISION_MISMATCH`.
`evidence/baseline.json` and its log preserve the real public authoring,
unmodified sources/history/models and exact failure. This is not a kernel
Boolean defect or an implicit engine-conversion requirement.

The candidate resolves both current output IDs against the coordinator's
read-only inspection, checks their registered engine/runtime identities,
requires one identical revision, and persists that revision. It does not retry
with another build, change the native code, convert geometry, or change box
creation's default selection. Empty native outputs still retain runtime
identity. Seven focused operand tests plus12 existing ledger controls pass.
The first helper revision incorrectly rejected arrays while reading the
inspection's own dense indices; the original five failures are retained in
`evidence/array-admission-before.log`, corrected without changing the tests.

Actual source32386643a/appa0e2ef40 now passes all three public operations and fresh native replay. Each run creates two radius10 mm disks, centers10 mm apart, depth5 mm. Independent expected volumes are union2527.4078042854144, subtraction956.611477490518 and intersection614.1848493043784 mm³. Native values agree within the recorded tolerances; bounds, one-solid validity, unchanged source and exact authored engine revision also agree. `evidence/pinned-candidate.json` verifies the served app, three Workers, native Worker/glue/WASM before authoring and fresh replay against `runtime-pins.json`. The first successful run is retained separately as candidate.json. No signed My files, deployment or complete CAD gate is claimed.

The browser driver creates two radius10 mm disks, centers10 mm apart, each
5 mm deep, using actual public empty-plane/primitive/discovery/extrusion calls.
It requests union, subtraction and intersection in separate fresh contexts.
Independent circular-lens formulas supply volumes; independent extrema supply
expected bounds. Native validity, stable saved source/part history, pinned
runtime and fresh ordinary native replay must agree. No native-file seed,
private geometry writer or fake successful Worker result is used.

Run with private `JSKETCHER_TEST_URL`, `CODI_TEST_CDP`, `PUPPETEER_CORE_PATH`,
mandatory `CODI_SOURCE_PIN`, `CODI_EXPECT_APP_SHA` and source-matched
`CODI_RUNTIME_PINS` JSON file, and an owned
`CODI_RECEIPT` path. Baseline-only `CODI_EXPECT_FAILURE=ENGINE_REVISION_MISMATCH`
records the known refusal; leave it unset for positive qualification.
`CODI_BOOLEAN_CASES=union` can isolate the first case without relabeling that
as all three operations. Use separate contexts and disconnect from shared
Chromium; never terminate another lane's browser or replace its fixture.
