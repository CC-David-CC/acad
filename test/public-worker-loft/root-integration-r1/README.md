# Root integration repeat — 2026-11-07

Product66514c2be / factory evidencebf1019a34 / normal compile evidence3ce89aa35
are integrated on the candidate branch. No native/source changes were needed
for this repeat. Root ran the frozen independent checker PASS (11 coordinator,
53 genuine source Workers,4 unavailable-runtime,4 staging,2 genuine native
factory geometries and2 normal app compile receipts). These native/compile
receipts remain the original agent builds, not a new root browser run.

Root freshly built `test/public-worker-loft/build.cjs`, then ran the actual
service.test.mjs:11 groups PASS,53 real solver/semantic Workers started and
terminated. Captured observations and current source hashes are adjacent.
Full TypeScript `--noEmit` exits0. The initial shell shorthand for tsc could
not locate node; rerun used the explicit Node binary. No source changed.

The first availability-test invocation lacked its required generated factory
and failed MODULE_NOT_FOUND before running cases. Root built the factory with
`build-factory.cjs`; unchanged availability.test.cjs then passes4 cases. This
was a local test-preparation failure, not an engine/product repair. No app,
Save/Open, phone, performance, live deployment or full E15 signoff is claimed.
