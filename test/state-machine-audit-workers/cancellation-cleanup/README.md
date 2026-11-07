# W02 cancellation-hook settlement

Synthetic transport/error-only API contract tests, not a native geometry or production-incident claim. No successful native result is supplied.

Before source407bbb2d52402d75a4d292cb889b2121bf94bb32 has SHA256 recorded in before.json. Both duck signals and true AbortSignals with overridden instance methods reproduce: response removal throws after pending/timer are cleared, leaving the caller unresolved even after deadline and close; registration throws before posting but leaves BUSY; opaque postMessage errors are coerced, masking the original cause and leaving BUSY. Run before-probe.mjs only against that frozen source.

The repair keeps existing signal admission (including cross-realm native signals), guards offered callback methods, preserves original known Worker failures, and retires uncertain mounts. Cleanup must not post after synchronous cancellation/close or strand readiness. Exact falsey failures remain observable; no error-object coercion is needed.

Followup outside ownership: sourcePlaneDepthCommands validates the native signal brand but invokes instance event methods. Its setup/cleanup must also be checked for true-signal overrides. This controller fix makes no claim to repair that command.

## Frozen repair and qualification

Product5471a2f6e (after before-only d090885a6) changes only worker-controller.mjs. Cancellation listener cleanup is attempted once and retains pending custody while invoking external code. A reentrant cancellation/close settles the same request; a failed removal retires the mount without replacing an already known Worker failure/refusal. Registration and init/request transport failures settle immediately with a constant EngineContractError message and the exact opaque/falsey cause. Registration rechecks cancellation and custody before posting. No signal-domain restriction or native geometry behavior is introduced.

`settlement.test.mjs` has42 new error-only controls; together with the unchanged ten controller-cleanup controls,52 pass. Covered: true/duck signals; ordinary and already-aborted native cancellation; synchronous registration abort/close; aborted state changes; reentrant removal; timeout; exact falsey/opaque causes; setup+cleanup double failure; known adaptive/numeric/unsupported errors; healthy transport retry after unsupported completion. Existing termination/owner cleanup behavior remains covered.

`browser.mjs` runs the real source module over an owned transient loopback static server, one owned Chrome context, and a distinct same-origin iframe realm. Six actual native signal controls pass: ordinary abort and overridden add/remove in both realms. Worker transport produces only initialization/error/refusal messages; no positive native evidence, canvas or CAD model is fabricated. Context and static server close; shared Chrome remains running. This is synthetic service-contract qualification, not proof of a production incident, native geometry, full app or all cancellation callers.

One browser-harness setup attempt served the root document as404 because its root-path check ran before the root handler. Dynamic import consequently resolved against chrome-error://chromewebdata and failed before controller controls ran. Moving the existing root handler first fixed this harness-only error. No product assertion changed. Subsequent six controls pass; after-browser.json binds exact final controller bytes.

Reproduce with qualified Node24:

```
node --test test/state-machine-audit-workers/cancellation-cleanup/settlement.test.mjs test/state-machine-audit-workers/controller-cleanup.test.mjs
node test/state-machine-audit-workers/cancellation-cleanup/browser.mjs /tmp/controller-browser.json
```

The browser script defaults to existing CDP19329 and owns only its new context. It never closes the shared browser. No source-cache32/four-case, native positive, Files/race or public deployment run was needed for this focused correction.

## Source-plane followup (not repaired here)

Read-only ec29c053e1708cffa4d30c250a0363d454e5a3c7, web/app/cad/craft/sourcePlaneDepthCommands.ts:41 registers project/caller signal instance methods before its try. A true signal with overridden add passes native brand validation and can throw after the earlier project subscription. Finally at:51 invokes remove before workspace.discard; a throw can skip remaining cleanup and replace a committed receipt/error. This is a source-supported control-flow risk requiring its own actual service regression and bounded repair, not a claimed public reproduction or part of this fix.
