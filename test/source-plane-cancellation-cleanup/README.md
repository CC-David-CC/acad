# Source-plane cancellation cleanup

Before e55f03573 (plane source ec29c053e), true AbortSignals with own method overrides pass native-brand validation. Actual service fixture confirms setup can leak the earlier project subscription; cleanup can replace a genuine no-op receipt or ordinary/committed-marked submit error, and can skip prepared workspace discard.

before.json binds exact service source. Six actual production sketch Workers prepare a real plane/Circle source and two independently verified plane edits; all six terminate. Submit only returns controlled NATIVE_NOT_RUN errors, including one committed-marked protocol error. No native geometry success/publication or public incident is claimed. Source comes only from actual empty/primitive Worker transitions, not raw seeds. Existing original fixtures/test sources are unmodified.

## Repair and bounded results

Product46a725732 moves registration inside the existing try and records each subscription before calling its method, covering register-then-throw. Finally attempts every removal and the prepared workspace discard. A throwing instance remover falls back to the captured native EventTarget remover; existing native-brand admission is retained. Unrecoverable intrinsic removal or workspace discard gets a guarded console diagnostic with the exact cause and an explicit release-unconfirmed message. Logger failure cannot replace the original outcome. No new engine poison flag, journal, authoritative lifecycle or saved geometry is added.

35 Node groups pass:26 focused controls plus9 unchanged production service controls. Focused controls use Error/undefined/null/zero/false/empty setup and removal failures, native listener census, register-then-throw, ordinary cancellation/lifetime loss, malformed signal rejection, no-op receipt preservation, original ordinary/committed-marked errors, and workspace discard. Every actual source Worker physically terminates. Full TypeScript checking and source diff checks pass.

intrinsic-fault.mjs deliberately supplies an irrecoverable captured-remover fault before importing the production module, scoped to its own two native signals. It also faults workspace discard and optionally the diagnostic logger. Both scenarios preserve the exact primary committed-marked NATIVE_NOT_RUN error, attempt every cleanup and record exact opaque/null/zero causes as release-unconfirmed. Six actual production Workers start/terminate in that separate process. Test teardown removes its remaining native listeners via the retained genuine intrinsic. This is a controlled contract test, not evidence that a genuine native remover ordinarily fails.

The committed:true case is an injected error-only submit marker, not successful native publication. A genuine committed success receipt/native Save/Open on repaired composed code is not qualified here; the existing signed plane proof remains frozen on its prior runtime. No browser/services/accounts/native models were changed for this correction.

## Additional source-only followup

workerSolidPointCommands.ts at source commit ef984b3392e607ff69f11ac1a487c6e5c08fee30 has the same family: native caller-signal brand check at:17, instance add calls before try at:37, and unguarded instance removals at:51. A throwing add can strand an earlier project subscription; removal can replace a read-only outcome. This is a source control-flow observation only, not a reproduced point-service incident or a repair here. Root owns its followup and STEP integration; no changes to that file.

## Reproduce

Use qualified Node24 and existing isolated build dependencies. Generated runtime remains ignored under .build/source-plane-depth, outside Git.

```
node test/source-plane-cancellation-cleanup/build.cjs
node --test test/source-plane-cancellation-cleanup/settlement.test.mjs test/source-plane-depth/service.test.mjs
node test/source-plane-cancellation-cleanup/intrinsic-fault.mjs /tmp/plane-intrinsic.json
node node_modules/typescript/bin/tsc --noEmit --pretty false
```

before-probe.mjs intentionally asserts the old failures and should only be run against before60ef3ccc0. It is not a current passing regression. Existing source-plane tests/fixtures, Worker and native sources, controller and signed Desktop drivers are unmodified.
