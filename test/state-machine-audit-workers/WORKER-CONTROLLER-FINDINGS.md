# Worker/controller lifecycle audit — 2026-11-06

This is component and injected fault-contract evidence, not a public incident or
CAD Gate 1 completion. Root maintains the canonical docs/STATE-MACHINES.md.
E13 authored work remains queued at its separate checkpoint.

## Confirmed repairs

WR02/W02: original bootstrap 182b57fbeb2e621412bc6c0a8fae7499ee6f7f1d2fc0d88e3c08e19e7932cbd3
admitted asynchronous direct-protocol concurrency. Two identical initializers
produced no ready within30s. Two same-token extrusions both produced valid500mm³
results and native count2; disposal left1 unreachable native name. Baseline
raw-worker-r3.json and worker-regressions-before.log preserve this. The normal
controller already refused its second call BUSY, so no ordinary public/controller
reachability is claimed.

Product5636148d42dca3e5c1ada9952882e764f29ff2cf sets Worker state before awaits,
refuses duplicate/concurrent admission without disturbing healthy work, removes
redundant moduleReady/fatalHole, and makes fatal errors terminal. Final bootstrap
4e7072eb07e3dae5be67887dad4b7b40a231c36a019f436253f8e1e179a07048.

WR03/W02: original controller called terminate before promise/timer/handle
finalization. Injected termination failure left readiness/work unsettled after
closed, and repeated close hid the fault. Product7b16d2ee4212c2f41fae50165eb6f57c519287b9
always finalizes, preserves first exact cause in a truthy record (including falsey
values), and surfaces it on explicit/repeated close without termination retries.
Internal error/abort handlers settle work without throwing cleanup failures.
Controller SHA23227ebb5e711a7423803bde9bc643ffa8cce28dd61201f2d3d2f6ebe5551d49.

WR01/W01 resource repair is separately documented in RESOURCE-FINDINGS.md:
3c969bf68 product,92f1ccdef evidence. No ownership bypass/schema changes.

## Coverage

- Final actual Chromium direct Worker: one ready after duplicate init; second
  same-token call BUSY, first owns1 name, dispose leaves0; recoverable typed refusal
  then valid retry; fatal init/native-handle error rejects late work. Six controls
  pass in worker-regressions-final.log against raw-worker-final.json.
- Actual old WASM onRuntimeInitialized callback deliberately requested unsupported
  revolve export: one error, count0, no late ready after retry. PASS in
  fatal-native-init-after.json. This bypasses normal catalog admission deliberately.
- Actual exact-volume helper over/underflow in real NodeWorker plus AST binding
  of exact catch to error→closeWorker→return:2PASS mesh-range-terminal.log. Frozen
  563 already closes this branch; no amendment. Inputs are finite unclosed
  triangles, not native geometry/public range reachability.
- Controller/resource/protocol metadata controls44/44PASS; falsey causes, readiness,
  pending work, one termination attempt, repeated exact fault, pool cleanupFailed
  latch and allocation refusal. controller-resource-after.log.
- Actual Chromium3 injected failures AFTER real termination: initialization,
  pending close/abort. Genuine24mm³ reply held then delivered late. Requests settle,
  repeated close surfaces exact fault, no uncaught errors. controller-fault-browser-after.json.
- Retained new native runtime AFTER BOTH fixes:12 revolve cases,6 refusals/29point
  checks;32 names+33rd refusal;100k budget (17annular/95756triangles), healthy retry;
  held cancellation;4hole/pattern chains+8controls;2five-cut/treatment chains,
  empty/multisolid continuation. retained-controller-after.json.
- Retained old runtime AFTER BOTH fixes: representative hole/pattern chain,
  all8controls, five-cut/treatment and Boolean controls, optional modules absent.
  retained-old-controller-after.json. Native binary hashes/defaults unchanged.
- TypeScript passes. Earlier raw-worker-before/r2 import failures are retained
  fixture mistakes, not product defects: diagnostic wrapper must be beside
  bootstrap for self.location-relative imports. It only reads native owned-count.

## Canonical family mapping / invariants

| Family | States/transitions | Invariant and proof | Remaining scope |
|---|---|---|---|
| W01 | candidate→accepted→detached→closed; candidate→closed | Cleanup releases reservations or latches failure;22resource controls, controller/pool integration | Accepted detached metadata is bounded bookkeeping, not native memory/RSS proof |
| W02 controller | initializing→ready(+pending)→closed | One pending owner; exact replies bound; all terminal paths settle; close once;44metadata+3actual fault controls | Normal controller serial admission distinct from direct Worker |
| W02 Worker | new→initializing→ready↔busy→closed | State before awaits; one init/job; refusal recoverable, error terminal; native count0 after dispose | Direct boundary controls; no whole public incident claim |
| W03 clients | queued WebLock→running→reply/refuse/cancel→settled/disposed | Source/semantic clients bind nonce, lifetime/deadline, remove listeners/terminate on finish | Read-only mapping below; not covered by W02 termination repair |

Controller pending!=null derives busy; do not add a separate independent flag.
Name counter is cumulative work admission, not live native count; disposal does
not reset it. Capability flags are frozen configuration, not lifecycle. Resource
sealed-candidate is a real substate; checking/detaching are reentrancy guards,
not automatically redundant. Cleanup failure is orthogonal terminal evidence.

W03 source files inspected: headless/client.ts (outstanding/lock/stopReason/done),
prismSemanticClient.ts (outstanding/lock/reason/done), physicalWorkerClient.mjs
(outstanding/lock/reason/done), projectionClient.ts (sequence+owner/deadline).
These are independent disposable-client families, not the W02 native controller.
Their finish functions still call terminate before resolve/reject. The actual
imported parameter client was tested with doubled transport (no solver/math
claim): normal termination resolves; injected throwing termination emits an
uncaught exception and remains unsettled after its deadline. Exact probe and
w03-parameter-{normal,before}.json preserve this newly confirmed W03 fault.
No W03 product repair is included; parent ownership coordination is required.
Source/semantic analogous source paths and project/hash families are not newly
qualified. Do not mark all W03 covered from W02 tests.

## Reproduction/custody

Node24 /tmp/codi-files-move-node/bin/node. Set PUPPETEER_CORE_PATH to qualified
puppeteer-core24.35.0. Browser drivers arguments: COMPONENT_ROOT BASE_URL RECEIPT;
they preflight every manifest byte, use strict-CSP loopback, own/close only their
own Chromium. Shared19329 is untouched. Native regression drivers reused unchanged
from test/owned-revolve-worker/{browser,retained-browser}.cjs.

```
CODI_WORKER_OBSERVATION=test/state-machine-audit-workers/raw-worker-final.json node --test test/state-machine-audit-workers/worker-regressions.test.mjs test/state-machine-audit-workers/worker-terminal-controls.test.mjs
node --test test/state-machine-audit-workers/controller-cleanup.test.mjs test/state-machine-audit-workers/resource-regressions.test.mjs test/state-machine-audit-workers/mesh-range-terminal.test.mjs
```

Full raw receipts were archived AFTER original full-array oracles passed and
BEFORE display-only compaction. freeze-evidence.py records raw hashes; only mesh
coordinates become little-endian Float64 count/hash. Compacted receipts are
summaries, not full-array oracle inputs. Native catalogs/plans/point checks remain.
Complete31/29asset final components plus four raw receipts are SHA-verified onR730:
/mnt/data10tb/codi-state-machine-audit-workers-proof-20261106-r1/.
source-and-runtime-pins.json and raw-receipt-pins.json bind bytes. Root owns build
pins/composed-app checks; no deployment/default/native promotion here.
