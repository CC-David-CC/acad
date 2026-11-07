# WR03 / W03 disposable-client cleanup recurrence

This is the same WR03 finish-order family as the W02 controller fault, not three
new unrelated bug counts. Production modules are actual imports/bundles, never
extracted closures or global helper shims. No mathematical/source protocol,
document/history format, native build, default engine, or deployment changes.

## Before and after

All three production clients set their local done flag, then called terminate
before resolve/reject. An injected termination throw left the promise unsettled;
the deadline could not finish a done job. Its outer finally never ran, retaining
one polling interval and one abort listener. Parameter/semantic cases also emitted
uncaught errors; sketch's existing broad callback catch hid that exception while
leaving the promise hung. Actual source hashes and bundled code hash are in
before.json, frozen before production edits at3110be0a5 (both LANs).

The original48-cell matrix passed21 normal controls and failed27 cleanup controls
(Error plus null/undefined/0/false/empty-string, original error, abort and timeout).
All27 hung and retained intervals;21 emitted uncaught errors. before-tests.log
retains the failing normative assertions, without skips or weakened expectations.

Product1c39f4ff2 changes only physicalWorkerClient.mjs, headless/client.ts and
prismSemanticClient.ts. Finish now marks done once, removes reply/abort handlers,
attempts termination once, and settles even when cleanup throws. Finally clears
timers/listeners and outstanding counts. WORKER_CLEANUP_FAILED rejects instead of
reporting success; cause preserves the exact first thrown cleanup value, including
falsey values, and operationError preserves the original operation error when one
exists. Abort/timeout catch paths cannot overwrite cleanup failure with their
ordinary stop reason. Normal protocol replies and ordinary failures are unchanged.

A per-module-instance latch rejects later work before allocation, including jobs
already queued before the fault. No blind termination retry. An uncertain physical
termination is not reported as released; bookkeeping settlement does not establish
OS/process/native memory reclamation. The fence lasts for that imported module
instance. Reopening an app window may share the module and is NOT promised to reset
it. A genuinely fresh module/realm can have a separate fence; this is not a global
cross-module resource authority. Failure before physical termination could leave
the Worker running; handlers are detached and no more Workers are allocated by the
failed client module. This remaining physical-termination limit is explicit.

## Qualification

Final51/51 controls pass: the original48 cases plus3 already-queued-job controls.
Every job settles exactly once, including a captured late handler invoked after
settlement, removes timers/intervals/abort listeners, and terminates once. Every
cleanup-fault case refuses its next request with zero new posts/terminations;
queued controls likewise allocate only the initial Worker. Transport and WebLock
doubles are explicit, and synthetic values are not claimed as solved geometry.

Actual Chromium adds9 controls with genuine retained production CPU Workers:
normal computation, injected failure AFTER real termination, and genuine successful
reply held through abort then delivered late, for each client. Every fault rejects
truthfully and refuses subsequent allocation. There are no uncaught browser errors.
The parameter Worker computes mm(4)=4; the actual sketch Worker builds a10×5
rectangle; semantic preparation uses that genuinely generated source. Worker assets
are the exact retained224f3302d build, whose individual bytes are checked against
the original runtime pins. Candidate clients are newly bundled from the repaired
source; this is a mixed, explicitly pinned component test, NOT a new full app build.
No native kernel, public account, saved file, or full E13 claim is made.

browser-r1 preserves a fixture failure: the initial fixture omitted the solver's
/lib/verb.js dependency. physical rows passed first, then sketch failed loading
that real dependency. The corrected fixture serves and hashes the retained actual
verb.js; browser-r2 passes all9 without product changes or assertion relaxation.
An initial queued-probe edit had an unmatched object brace and failed to parse
before any client invocation; correcting that test syntax produced the final51.

TypeScript passes; retained evaluation-resource tests15/15 pass. Source/runtime,
driver, and test bundle pins are in pins.json. Earlier after.json is the bounded
settlement repair before adding the approved module fence; after-fence.json and
final.json retain their exact respective driver/source hashes. Do not retag those
intermediate observations as final source/test evidence.

## Canonical state-machine handoff

| Family | States/transitions | Invariants and evidence |
|---|---|---|
| W03 source/sketch | admission→pre-dispatch validation→queued lock→running→settled | done allows one settlement; nonce/revision/currentness guards unchanged; polling/deadline removed; failed module cannot allocate |
| W03 semantic | admission→queued lock→running→settled | jobId and typed response admission unchanged; stop reason retained separately from cleanup cause |
| W03 parameters | admission→queued lock→running→settled | revision/material binding checks unchanged; actual response passed normal parser |
| W03 cleanup fence | healthy→cleanup-failed, terminal for module instance | first exact cause retained; later and already-queued jobs refuse before Worker construction |

The done flag is derived only from whether this job has settled; outstanding is
bounded admission across queued/running jobs. Neither substitutes for the separate
cleanup-failed fence, which describes uncertain physical ownership after a fault.
ProjectionClient delegates the repaired sketch client; it has no production edit.
Project validation/hash source paths have similar terminate-before-settlement
patterns but remain mapping-only, not reproduced/repaired by this checkpoint.
Root owns the canonical docs/STATE-MACHINES.md and composed-app integration.
Queued E13 semantic additions must rebase onto this repair.

## Reproduction

Use Node24 and the existing reviewed node_modules. No account/hosting/network
changes. Browser driver launches and closes only its own Chromium and loopback
server; shared19329 remains untouched.

```
node node_modules/webpack/bin/webpack.js --config test/state-machine-audit-disposable-clients/webpack.cjs
node test/state-machine-audit-disposable-clients/run.cjs /tmp/new-client-observations.json
CODI_DISPOSABLE_OBSERVATION=/tmp/new-client-observations.json node --test test/state-machine-audit-disposable-clients/observations.test.mjs test/state-machine-audit-disposable-clients/queued.test.mjs
node node_modules/webpack/bin/webpack.js --config test/state-machine-audit-disposable-clients/webpack.browser.cjs
PUPPETEER_CORE_PATH=/path/to/qualified/puppeteer-core node test/state-machine-audit-disposable-clients/browser.cjs /path/to/retained/app-artifact /tmp/new-browser-receipt.json
```

For the exact baseline use3110be0a5 and its original probe/test versions. The final
tests additionally require the approved fence and cannot be substituted for the
frozen baseline driver. No public live service was accessed for these controls.
