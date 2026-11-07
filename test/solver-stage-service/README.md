Normal diagnostic service stage-local integration
================================================

Base `40018895d54d5a90eea332b9d24af845420c119c`; product checkpoint
`7cf6a2a093069b58454370d32cf81c1ee876bf8b`. Product ownership is exactly
`web/app/cad/sketch/sketchDiagnosticService.ts` and
`web/app/sketcher/headless/solveWorker.ts`. No Craft, journal, native/controller,
desktop command, SDK, renderer or application build-graph files were changed.

The actual existing desktop `inspect-sketch-diagnostics`/`analyze-sketch`
registrar was exercised against the normal core service. Before integration,
it discovered the saved two-stage source, then rejected analysis with
UNSUPPORTED before any Worker dispatch (`before-service.json`). The adapter
already forwards normal reports without narrowing their shape, so it needs
no new command, scope argument, provider or agent-specific path.

The normal service now inspects the captured source stage count. One-stage
requests keep their existing Worker options, admission rows and result shape.
Multi-stage sources request the existing production per-stage option. Their
source admission inventory includes explicit stage/index pairs; the result
uses the same normal service envelope with `status:'stage-local'` and the
qualified nested stage report. There is no aggregate rank/DOF; physicalDof
remains null. The existing single-stage saved/active inspection targets and
normal command schema are unchanged.

The typed-dependent diagnostics Worker task already prepares supported named
SegmentLength/DiameterLength bindings with real dimension checks across the
source stages. It now selects the same per-stage flag internally for actual
multi-stage sources. Its five wire fields are unchanged. Single-stage typed
diagnostics and non-diagnostic typed-dependent-solve retain their prior
contracts. Unsupported dimensions or unannotated fields still return an
honest unavailable admission snapshot, without a local rank claim; no named
length is coerced into an untyped scalar consumer.

The multi-stage validator checks the exact scope, physicalDof:null, stage
count/order, source constraint/group/row ownership, original residuals using
their individual tolerances, rank/nullity consistency, zero/near-zero gradient
and threshold-band states, dependent-row indices, ordered contributions and
shared 128-variable/equation budgets. Diagnostic tree/string limits apply to
the whole response. Unavailable stages remain explicit. Existing document,
source/key-version, history signature, frame, active mutation epoch, expression
table/physical-result and account/window lifetime guards remain authoritative.
No diagnostic publishes geometry, history, source or a new model.

Qualification scope
-------------------

The tests run the actual existing desktop command registrar, actual service,
actual CAD source-plane/solver constructors and actual production sketch
Worker. The test host/session, streams and storage are explicit context
doubles. Active capture uses real HeadlessSketchWorkspace objects and their
current source serialization. The service's existing transport-injection seam
is bound to real Node worker_threads loading the production solveWorker entry
and unchanged Verb; it performs no replacement math or geometry. This tests
the normal calling logic, not a signed live desktop/browser session. Browser
Web Locks/URL delivery, renderer behavior and final combined app validation
remain separate qualifications. No canvas, browser UI, alternate authored
model or private application state is supplied.

Thirteen service groups cover saved/active multi-stage sources; unchanged
single-stage shapes/options; supported named typed lengths in saved/active
sources; unchanged typed solve and single-stage diagnostics; typed refusal;
singular and unavailable-stage reports; source/history/table/document/active
parameter/physical-result/window/account guards; nine malformed protocol
reports; and unchanged command argument/revision/frame refusal. Thirty-one
real Worker jobs terminate. Malformed-report cases alter a completed real
Worker response only to test protocol refusal, never to claim geometry.
The retained production Worker/local-Jacobian suite adds nineteen groups and
twenty-seven Worker jobs against the new typed-wrapper artifact.

An initial Node test host omitted importScripts, so unchanged Verb selected
its optional Node webworker-threads branch; the host now provides a local-code
Worker-compatible loader with no window/DOM shim. The initial cleanup assertion
also assumed a scoped command abort awaited Node's asynchronous termination.
The real command correctly settles cancellation promptly. The harness now
drains its owned transport jobs before checking cleanup;
`cleanup-harness-before.json/.tap` retain the failure. No product change was
made for these test-host assumptions.

Evidence records exact code inputs, tracked-source build fingerprints, Worker
and service byte hashes, actual command/service transcripts and retained
failures. Runtime artifacts stay outside Git under `.build/`. Worker SHA256:
`630ec03b4348c99ca509dc20ecf894f7aa20c3b41dbddbf9982b57402bc1d984`.
No native asset, kernel selection or public deployment changed.

Reproduce with qualified dependencies available:

```sh
/tmp/codi-files-move-node/bin/node test/solver-stage-diagnostics/build.cjs
/tmp/codi-files-move-node/bin/node test/solver-stage-service/build-service.cjs
/tmp/codi-files-move-node/bin/node test/solver-stage-service/verify.mjs
```

`CAD_DIAGNOSTIC_BRIDGE` can select the real desktop checkout's
`apps/system/jsketcher/diagnostic-commands.mjs`; the default is the active shared
desktop worktree. `SOLVER_STAGE_WORKER` can select another retained production
Worker. No Files, filesystem-race, networking or security tests are run. This
closes the normal diagnostic calling seam, not all remaining Gate 1 exercises.
