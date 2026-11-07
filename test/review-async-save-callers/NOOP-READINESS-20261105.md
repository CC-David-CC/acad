# No-op async Save readiness — 2026-11-05

Based on root `471ace618`; production scope is two additions inside
`InPlaceSketcher.save`. Shared frame/lineage helper and craft preflight remain
owned by the server lane.

The unchanged-byte branch bypassed readiness. A tool started in a microtask
before the save-and-exit continuation could be disposed by a byte-identical
no-op Save. Save now checks readiness at entry, after the recovery guard, and
the no-op receipt checks readiness after its serialization/epoch checks. Newly
active tools, manager/stage transactions and rejected relations refuse while
preserving source bytes and the open editor. Existing changed-save Worker,
duplicate-save and replacement/exit receipt guards remain intact. Genuine
no-ops still skip Worker validation and storage writes.

Six controls execute the actual extracted async Save method with actual
save-and-exit/receipt/readiness/frame/byte-comparison helpers. Viewer,
serialization, boundary callbacks and versioned store are synthetic; the data
fixture is the captured first-save rectangle. These are source-method controls,
not browser UI, real solver, Worker dispatch or signed-host proof.

```sh
node --test test/review-async-save-callers/noop-readiness.test.mjs
```

Six pass: initial tool/transaction/conflict refusal, tool/transaction changes
before both async exit checks, serialization callback tool mutation, stable
no-write/no-Worker success, duplicate Save, stale receipt/replacement refusal.
All retain exact original stored text. Negative control:

```sh
git show 471ace618:web/app/cad/sketch/inPlaceSketcher.js > /tmp/noop-save-before.js
CODI_NOOP_SAVE_SOURCE=/tmp/noop-save-before.js node --test test/review-async-save-callers/noop-readiness.test.mjs
```

Retained `noop-readiness-before-471.log`:2 pass/4 fail from missing expected
refusals. Stable success and duplicate-save controls pass. No root/shared edit,
build, service or browser action. Combined browser qualification must still
verify actual readiness refusals/themed reporting and ordinary no-edit
Save/Exit with unchanged native bytes/clean host, plus real changed-save Worker
acceptance/refusal.
