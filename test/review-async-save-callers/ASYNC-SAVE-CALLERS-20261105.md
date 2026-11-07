# Historical async sketch Save callers — 2026-11-05

Test-only migration based on CAD `c265662a7` (root candidate after the no-op
clock comparisons and legacy expression action repair). No production source,
shared helper, physical-parameter/no-op focused tests, build or service change.
This checkpoint requires the server lane's actual asynchronous Save core and
`test/coreTests/subjects/modellerTPI.js` change: `commitSketch` must return the
original `actionService.run('sketchSaveAndExit')` Promise. There is no fake
synchronous wrapper.

## Inventory and changes

`callers.json` records every migrated call's file/line, expression, awaited
status, owning async function and whether that function was previously async.
The repository-wide historical test search found 49 files calling the
`commitSketch` helper: 47 migrated here and two Cypress command/usage files
whose queued semantics were already appropriate. Beyond the helper, direct
Save/action callers bring this lane to **120 calls in53 test files**:

| Call | Calls | Files (overlap possible) |
|---|---:|---:|
| `commitSketch()` | 109 | 47 |
| `inPlaceEditor.save()` | 2 | 2 |
| `actionService.run('sketchSaveAndExit')` | 9 | 6 |

| Historical scope | Changed files |
|---|---:|
| `test/webos` | 38 |
| `test/coreTests/testCases` and `utils/scripts.js` | 7 |
| `test/constraint-edit` | 2 |
| engine four-corner/history and hole-projection/history | 2 |
| `test/review-common-typed` | 2 |
| `test/review-rigid` | 1 |
| `test/typed-configurations` | 1 |

All120 calls explicitly await completion. Previously synchronous browser
callbacks in18 files are async and propagate the Promise through the awaited
Puppeteer evaluate call. In particular the two constraint-editor controls await
Save before exit/native snapshot; history disposal reads await Save-and-Exit
before inspecting released snapshots; wizard/selection/replay and native-save
steps follow the resolved save. Existing waits and test assertions are retained.
The core test functions already returned Promises; `defineCypress.js` consumes
them with `.then(onDone).catch(reject)`.

Ownership exclusions: server owns `modellerTPI.js`, `test/physical-parameters/*`
and focused Save/no-op controls. Their historical baseline contains four further
Save/action calls for that lane. Cypress's `cy.commitSketch()` remains queued;
its command returns `cy.getModellerTPI().then(tpi => tpi.commitSketch())`, so the
server helper Promise propagates through the existing command. No Cypress async
callback conversion was made. The type-only `Chainable<void>` declaration stays
valid. Surfacing/project-service `.save()` methods are different APIs and are
outside this sketch-editor migration.

## Verification and limits

Node24.22.1 syntax checks pass for all53 migrated files. The static audit parses
those source files, requires each inventoried Save call to be an AwaitExpression
inside an async function, checks the exact inventory, compiles all53 through
Babel preset-env (Chrome49 target, CommonJS), and compiles that output as Node
scripts. Result: **53 syntax passes,53 Babel compilation passes,120 awaited
calls, zero in-scope unawaited calls**. `git diff --check` passes.

Run from the repository root with normal development dependencies installed:

```sh
node test/review-async-save-callers/check-callers.cjs
```

The isolated sparse worktree used the already installed candidate dependencies
through NODE_PATH. This is a source/compilation audit, not module-resolution,
webpack bundle or browser runtime qualification. No full app, helper or Worker
build and no browser tests were run by this lane. All changed historical scopes
remain unrun on the combined asynchronous runtime. Matching direct and signed
functional checks belong to the combined qualification after root review;
earlier synchronous-runtime receipts do not prove this migration's runtime
behavior, performance or release acceptance.
