# Concentric browser and signed acceptance plan — not executed

Prepared after source candidate `3a181017e`, for root's later combined build
with reviewed diameter/typed/diagnostic changes. This document runs no build,
browser, fixture, account, network or deployment action. The13 focused Node
controls do not substitute for the gates below.

## Bind the actual combined runtime

Root selects the final source and owns the private R730 build and fixture.
Record exact source, emitted app, sketch/project/parameter Workers, test helper,
desktop catalog/bundle, gateway/SDK and response CSP hashes before testing.
Use fresh owned browser contexts/disposable signed accounts only. Preserve the
production CAD-frame self-only script/worker policy and wasm-unsafe-eval limit;
no blanket interception or policy relaxation. Primitive setup may use a clearly
labeled test helper; actual concentric edits use selected UI or registered
commands. Observing internals is an oracle, not a private authoring route.

## Direct real-browser gate

1. Carry the existing `test/webos/concentric-browser.test.cjs` on the matching
   app/helper. It exercises actual Concentric toolbar selection, circle radii/
   centers, undo/redo, sketch IO restore, replaced-object stale refusal, caller
   cancellation and a successful ID command. Use desktop and390px emulation;
   re-resolve objects by ID after undo/load rather than reading detached refs.
2. Add the changed rejection oracle: two circles with distinct locked centers,
   plus a circle/arc variant. Capture strict authored sketch, membership,
   admission statuses, constants/cache, backlinks and real history metadata.
   Apply through actual selected UI, then separately the inspected ID action.
   Require error/refusal, no new Concentric row and identical prior state.
   Prepare/solve again to prove no rejected equation reappears. On source699,
   this oracle must fail specifically because a rejected row is retained.
3. Undo one conflicting fix through the real editor, inspect again and apply
   successfully; verify centers agree and radii/sweeps remain intended. Repeat
   a redundant operation, actual undo/redo and native project save/reopen.
   Keep success/redundancy distinct from rejected authored mutation.
4. Cover stale serialized edits, same-byte parameter ABA, replaced objects,
   active tool/recovery refusal, expired caller and the final true lifetime
   callback mutating geometry. Inspection must refuse the latter; it must not
   restore a caller's unrelated mutation. A fresh inspection must succeed.
5. Inject one solver exception and one postcommit refresh exception in separate
   cases. The first restores exact prior state and permits recovery; the second
   reports an already committed edit rather than pretending rollback occurred.
   Preserve a failing context/log and classify harness failures separately.

Existing browser-test invocation (not run here):

```sh
JSKETCHER_TEST_URL=http://127.0.0.1:<owned-app-port>/ CODI_TEST_CDP=http://127.0.0.1:<owned-cdp-port>/ node test/webos/concentric-browser.test.cjs
```

Use the fixture's actual puppeteer-core dependency resolution; that existing
script imports it directly. The prepared
`test/mechanical/concentric-ui-refusal-browser.test.cjs` now covers the actual
rendered contextual-button refusal, visible toast and unchanged source/history/
model oracle. It is syntax-checked only, not executed. The other new
currentness/exception controls still need matching committed browser coverage;
the older script does not already cover them. Root reviews before execution.

## Signed desktop gate

Use the established signed fixture procedures and My files contract. Prepare
a test beside the existing b3 sketch/role workflows; do not add a new file stack.

1. AccountA opens an actual CAD desktop window and a supported sketch with
   seeded circles/arc. Through public `sketch-circular-objects` and
   `sketch-fix-entity-targets` / `sketch-fix-entity`, establish the conflict.
   Inspect again after each mutation. `sketch-concentric` must reject with
   exact source/history/backlinks and previously satisfied relations preserved.
2. Use real sketch Undo to remove the latest conflicting fix, then public
   inspect/Concentric succeeds. Real undo/redo and stale-token reuse checks
   follow. The setup helper does not qualify public primitive creation.
3. Finish/save the sketch through its normal UI and host `save` with inspected
   revision. Observe normal sync and independently compare server bytes, without
   private sync calls or mutation retries. A failed edit followed by Save must
   never serialize the rejected row. Save/reopen with deliberate accepted and
   redundant relations must preserve IDs, centers/radii and authored status.
4. Close and reopen through Files in a fresh signed session. AccountB must first
   successfully save/read its own same path, then be denied A's bytes. Validate
   native geometry/relations independently after reopen.
5. Inspect then close/replace the CAD frame or change account before submission;
   the old target must be unavailable and another window remain unaffected.
   Synchronous Concentric calculation has no cancellable in-flight Worker:
   holding a returned Promise after commit cannot prove “nothing committed.”
   Preserve truthful unavailable/possibly committed outcomes and inspect state.

Record exact commands/test source, positive/refusal/rollback/lifetime assertions,
attempts, server digests, account/file ownership and scoped cleanup in a receipt.
Do not claim a physical-device test, arbitrary profiles, every constraint type,
generic CAD failure atomicity or a release merely from these bounded passes.

The full worker-first snapshot goal stays open: latest representative1MiB five
edits14–17ms still has about403ms undo and461ms heartbeat gap. This plan does not
qualify128MiB CAD performance or authorize packaging/deployment.
