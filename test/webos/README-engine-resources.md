# Craft evaluation resource ownership

`evaluationResources.mjs` supplies a private, nonpersistent ownership boundary
for each complete craft evaluation. A displayed revision, retained last-valid
history tip and one candidate may coexist: at most three owners per document,
with one mounted engine per owner by default. An explicit `maxMounts:2` admits
two feature mounts in an owner while `maxTotalMounts` retains a pool-wide ceiling
of at most three live or allocating mounts. Reservations count before factory
execution and remain charged during reentrant cancellation until disposal.
`usage.mounts` reports this count. This is a per-document count bound, not a
measured byte limit or an origin-wide memory budget.

The two-mount option is not enabled in the app yet: real worker memory and
full replay tests must qualify it first. Two retained two-mount revisions may
exhaust the current ceiling; the implementation must report that honestly,
not evict accepted geometry or silently increase memory. A later execution
strategy may reuse/rebuild workers instead of retaining every feature runtime.
This capability does not imply automatic cross-engine geometry conversion.

Root validation on 2026-11-04 passed 15 resource ownership tests and 13 candidate
prism ledger tests. The new cases cover two feature workers, pool admission,
factory failure, and cancellation during allocation. These use closable mount
fixtures; they do not measure real WASM memory or prove browser integration.

`operationContext.engineEvaluation` exposes `signal`, `requireCurrent()` and
`getOrCreateMount(key, synchronousFactory)` to an operation. The factory returns
a closable mount before awaiting readiness. Resource allocation stops after the
candidate is sealed. Publication preflights freshness, installs the accepted
model/history/registry and resource owner without an asynchronous or observer
gap, then notifies observers and retires unused old owners. A rejected command
keeps the accepted model and its owner; failed authored replay may show the
last-complete history tip with explicit stale status. Reset aborts all owners.
Cleanup failure blocks further allocation, including already-admitted candidates.
Engine handles must not be serialized into the authored document.

Build the app and test helper as described in
`docs/WEBOS-REPRODUCIBLE-BUILD.md`, then run:

```sh
node --test test/coreTests/evaluation-resources.test.mjs
python3 test/webos/run-engine-resource-check.py \
  --node /path/to/node --puppeteer /path/to/puppeteer-core \
  --chromium /path/to/chromium --profile-parent /browser-writable/directory \
  --occ-js /path/to/pinned/main.js --occ-wasm /path/to/pinned/main.wasm \
  --result-dir .build/unique-owned-resource-test
```

The runner uses a disposable loopback site, the freshly built app and the exact
existing pinned runtime. It preserves the JavaScript no-`unsafe-eval` policy and
closes its own browser. Its injected real OCC box operation exercises ownership
inside actual PLANE replay; it does not pretend to publish the worker prism.
The six browser tests cover rollback, rejection, stale candidate cancellation,
setup failure, observer-triggered reset, worker termination, existing atomic
rectangle creation/undo/reopen, both-engine registry IDs and document lifetime.
`--tests` selects a named subset when a test-harness correction does not require
repeating previously completed checks.

See `craft-engine-resources-evidence-20261104.json` for source `531cc24d`, bundle
hashes, nine focused unit passes, six browser passes and the retained initial
hash-variable harness failure. The owner API is integrated, but normal legacy
operations do not yet use it. The worker-prism model projection and consumer
capability gates must be connected before a worker-solid edit/save/reopen claim.
