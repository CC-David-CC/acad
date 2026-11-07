# Concentric atomic action candidate — 2026-11-05

Base CAD `699ecf901f895ac481e4750532d961b0a5798dcf` (runtime b2a66ca86).
Owned changes are `concentricOperation.js`, its focused test and this receipt.
No shared transaction/guard/solver, diameter, desktop, service or app-build
changes. This branch is source-only pending root review and combined acceptance.

## Preserved baseline and deliberate contract correction

The original `test/mechanical/concentric.test.mjs` at source699 passes nine
tests, including its last test expecting the public ID action to return
`status:'conflicting'`. It checks unchanged coordinates but leaves the rejected
Concentric row in authored constraint membership. That baseline is preserved in
Git and was independently built/run before editing, with emitted unit-bundle
SHA-256 `7e66abae5462e9db0bd713a56b72106a2981acd0d7b8972008483c67b96c7f05`.
Output is retained privately at
`/tmp/codi-concentric-review-tests-20261105/baseline/concentric.cjs`.

The release requires atomic rejection, so the action-level expectation is now
an exception with identical prior source, geometry, history and backlinks and
no retained new relation. The two low-level subsystem tests that deliberately
retain rejected constraints remain unchanged; they continue checking that a
rejected algebraic relation cannot move geometry. This is an explicit operation
contract change, not disappearance of the old counterexample.

## Candidate operation and controls

Selection UI and ID commands share `admit` → `runSketchTransaction`, with current
circle/arc membership, generated-object domain checks and rejection of either
the new relation or any newly rejected prior satisfied relation. Successful and
redundant Concentric rows remain authored. ID inspection/submission now use the
same exact snapshot + realm-local mutation epoch guard as the other current
mechanical actions, with captured object identities and caller lifetime checks.
No token/hash or model computation is delegated to an unvalidated caller.
The helper remains synchronous UI-thread computation; worker-first snapshots
and full mutation ownership are still open.

Candidate focused suite passes12 tests: prior solver/circle/arc/native IO and
selection controls, current/missing/ambiguous/stale/replaced/foreign IDs,
ID and UI conflict rollback preserving exact state/history/backlinks, later
solver preparation and recovery to a valid edit, redundant success, same-byte
parameter ABA, cancellation, and an injected solver failure with subsequent
successful editing. The real solver/stage manager is used; the action fixture's
history adapter is synthetic. This is not actual UI undo/redo, host Save,
signed account, browser Worker or disposal qualification. The existing real
sketch IO round-trip test remains. Emitted candidate bundle SHA-256 is
`d0a1e59d83d8edead8419b3caae5873cbc53c34fbf7c2800e889b3b052c75361`;
operation source SHA-256 is
`0d405e56f4a4d174ab8679244c745bce6c51323a6b5b899928b0d04cfd6ceb1f`.

The unchanged seven-test diameter suite also passes as an investigation control:
conflict/invalid preservation, redundant removal, named values/undo metadata,
native/headless regeneration and stale/replaced/cancelled IDs. This found no
new diameter corruption counterexample. Its independent manual transaction and
SHA/ref-only guard remain documented inventory exceptions; no diameter source
or test was changed.

## Reproduce and next gate

Use existing repository Node/webpack/Babel dependencies; no full app build.
The sparse review worktree reads the lead's existing node_modules without
writing its generated caches. Configs below already exist in the base.

```sh
node node_modules/webpack/bin/webpack.js --config test/mechanical/webpack.concentric.config.cjs --output-path /tmp/codi-concentric-review-tests-20261105/candidate --no-cache
node --test --test-force-exit /tmp/codi-concentric-review-tests-20261105/candidate/concentric.cjs
node node_modules/webpack/bin/webpack.js --config test/mechanical/webpack.diameter.config.cjs --output-path /tmp/codi-concentric-review-tests-20261105/diameter-control --no-cache
node --test --test-force-exit /tmp/codi-concentric-review-tests-20261105/diameter-control/diameter.cjs
```

For the baseline, run the first two commands from an isolated source699 checkout
with `baseline` instead of `candidate`. Each focused build took about7 seconds
locally. Node-target React animation-frame warnings are not browser test output.
`git diff --check` passes. Root should review this bounded source change before
combining, then qualify current UI/ID accept/refuse/undo/native/Save and affected
regressions on the matching combined app/Workers. No new deployment, packaging,
full worker-first, total-memory or128MiB CAD performance claim is made.

## Inspector publication follow-up

Root review identified that the inspector's final caller-validity callback can
mutate geometry while returning true. It now verifies its captured common
revision after that callback and before publishing the inspection result. The
new focused control changes the second circle center in that final callback,
requires inspection to refuse, preserves the callback's own geometry change,
and permits a fresh current inspection. All preceding12 tests remain and the
suite now passes13. This is a synchronous real-solver unit/action control, not
new browser or signed evidence. Reproduce the first two commands above using
`inspection-followup` as the private output directory. Updated operation source
SHA-256 is `80931a0d03d4387f0a0f3006102d7775f3934fd9bce94b0c3cce0125ba38f4f6`;
unit bundle is `eeaf368a59cb79ce2fa7cc0cd595d1a47f3ccbde041487160aad2074914ab060`.

## UI refusal notification follow-up

Only `Concentric.invoke` in `constraintActions.js` now catches model refusal
and uses the existing themed toast path, matching Diameter/Line actions. The
pure operation and inspected ID/agent action still throw on refusal. All13
focused controls pass after this hook change. No full app build was run.

Prepared `concentric-ui-refusal-browser.test.cjs` uses helper-created circles
and real fix operations only for setup, then clicks the actual rendered
Concentric contextual button. It requires a visible refusal toast, no uncaught
page error, and unchanged strict source, real history, coordinates, constraint
membership and backlinks. It retains its own failed context for inspection.
`node --check` passes; the browser test is **not executed** and is not evidence
of user-visible behavior until run on root's matching combined app/helper.

```sh
JSKETCHER_TEST_URL=http://127.0.0.1:<owned-app-port>/ CODI_TEST_CDP=http://127.0.0.1:<owned-cdp-port>/ PUPPETEER_CORE_PATH=<existing-puppeteer-core> node test/mechanical/concentric-ui-refusal-browser.test.cjs
```

## Exact combined browser and signed follow-up — PASS

The pending browser state above is superseded only within this follow-up's
scope. On final combined CAD `0b9e38394ffbbf6478c69ed8a78b8f555a915053`,
direct20461/CDP19329, both the actual contextual-button refusal/toast test and
the existing Concentric success/undo/redo/native/stale/cancelled-ID browser test
passed their first attempts in separate owned contexts. App SHA-256 was
`1f59e25daf4dbe877163308249762aa6e0289ccaa8ba2e68900dc581cada9ff0`, matching
helper `4ef42ca4f7edecf7a8c0f7d288daf4173af40a28819275dc4a631b505820e1fe`.
The rendered refusal preserves exact source/history/model/backlinks and shows
the visible toast without uncaught UI error. The older success test invokes
the real toolbar action programmatically; it is not a physical-click claim.

The same runtime passed a fresh registered public-command Concentric test on
the browser owner's signed20352 fixture, desktop runtime57cfc5b17. Public
fix/Concentric refusal, correction through actual keyboard Undo, successful
relation, keyboard undo/redo, same-byte radius ABA refusal, normal Save/sync,
fresh Files Open/native geometry and two-account denial plus own-same-path
positive control all pass. Helpers seed circles/open the sketch and dispatch
normal Finish-sketch; they do not author the tested constraints. All owned
contexts closed; fixture/account cleanup remains with its browser owner.

Desktop source/receipt commit `0fedc7aaa9029bd09888f52fde23b96716f77669` contains
`tests/jsketcher-concentric-signed.test.mjs` and
`tests/jsketcher-concentric-combined-20261105.md`, with full app/Worker/catalog/
helper pins, exact commands, accounts/file hashes, log hashes and limitations.
Signed test SHA-256 is
`1587e3145c291fad88c9fc7fa821def2cf0e9bc5319abcd2da41348dbdb057fb`.
No product change or duplicate app/fixture build was needed in this lane.
This closes the stated Concentric browser/signed boundary, not every acceptance
plan case, the full worker-first goal, physical phones or128MiB CAD performance.
