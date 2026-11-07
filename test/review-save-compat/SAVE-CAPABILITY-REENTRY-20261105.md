# Save capability reentry and actual-browser baseline — 2026-11-05

Production scope: the private craft unconsumed-Save capability and its data-only
expected namespace signature helper. Source base349eb4d60 has no craft/helper
diff from the actual servedcbb148326 source. No storage-service, editor Save,
frame/material validation, Worker/solver, Mirror or hosting change. Root reviews
before building and qualifying the fixed app.

## Actual Chromium defect and bounded before controls

On pinnedcbb app20465/CDP19329, actual guarded editor.save installed circle41
and its exit receipt verified. A real tool/helper then authored circle46 in the
same Viewer. Actual Save-and-Exit refused "The authored sketch changed; reopen
before saving." Stored bytes retained41, the open draft retained41+46, and no
second write occurred. There was no fake Viewer/storage/Worker result. The
entry-time capability still referenced its old source/version/journal after
its own successful commit. `actual-direct-save-before-cbb1.{json,log}` retains
that concrete failure.

The extended actual-app test executes all cases before its final retry assertion:

| Case | Actualcbb result |
|---|---|
| Hold a genuine validated Worker response, author in the same Viewer, release | AbortError without committed marker; exact old bytes retained; no false exit; Worker terminated |
| Duplicate Save while that Worker is held | Refused as already in progress; first Save ownership retained |
| Retry after the pre-commit refusal | Success, followed by real fresh native envelope restore with equal sketches/history |
| Late no-op microtask starts actual PointTool | AbortError, same Viewer/draft retained, exact stored bytes unchanged, zero Worker starts |
| Release the tool and retry the no-op | Success, exact stored bytes retained, real fresh native restore |
| Ordinary storage listener | Actual deferred notification arrives after exit, as designed |
| Actual storage observer with injected immediate100ms flush | Accepted candidate bytes installed; observer authors a new circle; committed:true AbortError keeps the same Viewer/new draft open |
| Retry after that committed reentry | Same stale-capability failure reproduced |
| Foreign source write then same-byte ABA before retry | Refused; store/version unchanged by refused retry; new draft remains in the same Viewer |

`actual-reentry-before-cbb1.{json,log}` records the full run. It intentionally
FAILS its overall desired-success assertion because both legitimate retries
remain broken in the old app. The other bounded controls pass before the fix.
Both contexts closed; no real account, external service or host Save was used.

Storage notifications are deliberately deferred100ms. The observer-in-commit
control changes timer timing only: its actual flush callback runs immediately,
and the native timer is retained for cleanup. It uses actual storage.addListener,
actual published bytes and actual authoring actions. This is explicitly an
injected scheduling control, not a claim that ordinary storage listeners are
currently synchronous. No fake storage, Viewer, successful solver reply or
new production test method is introduced. Tool operations use existing helper
mouse/action APIs; no trusted UI gesture/canvas rendering claim is made.

Pins are recorded in the JSON: appc03443ac…13286, sketch Worker00285f5b…6ff0f,
helperb3b76139…25b2b. The test fetches and validates all full SHA256 values before
operating. Its inputs are the same environment variables as the preceding
actual browser controls, plus CODI_HELPER_SHA256; run:

```sh
node test/review-save-compat/actual-save-reentry-browser.test.cjs
```

## Private baseline correction

The permanent anchors remain: document/lifetime and original services,
history/models/expression identities and revisions, registry/face, evaluation
epoch, material revision and accepted model signature. Existing frame and
boundary checks are unchanged. Mutable state contains only the capability's
accepted sketch source/key version, full sketch-namespace signature, and owned
journal object/revision.

Before installation, Save prepares the exact next empty journal and its stream
revision. The existing namespaceRevision('') all-key counter supplies the next
private write version, including intervening ordinary project-cache allocations.
The exact expected sketch-namespace signature is computed from the previous
accepted signature with this one known key/version replacement. Limits and key
identity remain bounded; no post-observer namespace is captured or blessed.

After map and journal installation, before any observer, the capability verifies
all permanent anchors, its previous accepted full tip, the exact expected
installed source/key version, namespace signature and owned journal pointer/
revision. Only then does it advance the accepted tip/private baseline. Any
verification failure reports committed:true and leaves the capability stale.
Foreign/ABA writes made during notification remain different from this known
baseline and cannot be adopted by a later retry.

## Focused source evidence and required fixed-app run

```sh
node test/review-save-compat/run-save-capability.cjs
node --test test/physical-parameters/unconsumed-sketch-save.test.mjs
```

Eight new controls execute the actual extracted craft registration body with
real volatile workspace versions and real state batch publication. Context
identities are controlled. They cover repeated own commits, intervening project
cache writes, foreign same-byte ABA/membership, actual state observers, refusing
an unexpected installed version with committed:true, and preserved document/
registry/material/models/history/expression/journal/service fences. The11
existing Save controls also pass. These are source controls, not fixed-browser
or Worker acceptance.

`capability-source-before-cbb1.log` preserves the old craft body's failure on the
new direct-retry control. `capability-source-pass.log` records the candidate
pass. The first test harness imported the legacy stream class directly and hit
its existing circular import; `capability-before-library-initialization.log`
is retained. Initializing through the same lstream entry point as the app
corrects that harness ordering without a product change.

The fixed production app has not been built/run by this lane. Required next:
rerun the actual browser script with new exact pins and confirm direct retry,
post-commit observer retry and fresh native persistence now succeed, while held
Save/no-op refusals, foreign ABA, document/metadata guards and ordinary deferred
notification timing remain intact. No fixed-browser pass, signed host Save,
full worker-first performance or release/packaging completion is claimed here.
