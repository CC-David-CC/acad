# Public CAD rejection-cause qualification

Test-only source: `e45d335aa992063f3a1522f6f9e64c9bb0562567`, based on
`0a67877fe`. Product/runtime source:
`aca23b2b3d83935df5a127ad0a1343b39ab22b3c`. The parent integrated the cause
implementation and serial public Error propagation; this lane changes only
this `public/` directory. It changes no product, solver, desktop or Files code.

The fresh combined runtime passes TypeScript and the nine actual-source PM
cause tests. The public suite passes **8 authored workflow rows +12 transport/
lifetime controls**, observing **99 terminated command Workers**. See the exact
source/app/Worker/dependency pins in `pins.json` and raw `evidence/public.json`.

## What actually ran

All geometry and dimensions were created through public Craft commands.
Returned entity IDs and current inspection revisions drive later commands.
There are no native-source setters, private editor actions, custom constraints,
pose seeds, fake solver/status injection, Canvas or substitute viewer.

| Public case | Independent acceptance |
|---|---|
| Point horizontal and vertical dimensions | Measured X=10 mm and Y=5 mm; actual authored undo entries. |
| Conflicting point dimension | Existing `DISTANCE_CONFLICT` and exact message retained; frozen cause `algebraic-contradiction / exact-reduced-row`; exact last-valid source/history/journal/model state retained. |
| Undo/redo both dimensions | Exact original native bytes, then exact dimensioned native bytes. |
| Collapse an ordinary Segment | Existing `INVALID: Degenerate sketch segment.` retained; cause `invalid-domain / domain-check`; prior geometry retained. |
| Rotate a live symmetry axis | Independently measure nonzero axis length and reflected points after a driving X edit. |
| Collapse that live axis | Existing `DISTANCE_CONFLICT` retained, now explicitly `invalid-domain / domain-check`; exact prior state and axis length retained. |
| Incompatible line-relation intent | Existing `LINE_RELATION_CONFLICT` retained; this actual trial fails its direction-domain check, so the cause is `invalid-domain`, not an invented proof of algebraic infeasibility. |
| Native save/reopen | Normal public host-save preparation and fresh ordinary loader preserve every native sketch byte. |

Nine malformed-cause controls intercept **actual negative production Worker
replies**: unknown kind, mismatched basis, extra cause/error keys, null cause,
and cause/nested-kind accessors. They cover both signed and line-relation
transports. All refuse before reaching the public legacy conflict error,
execute zero getters and preserve the accepted workspace. A tenth control
removes the optional cause: the legacy code/message still works without one.

Two lifecycle controls hold a **genuine successful** Worker candidate that
would change free-point geometry. A lifetime guard or host close cancels it;
the exact late reply is subsequently dispatched through the actual listener
and remains inert. Every observed Worker terminates. Live cancellation also
compares the public authored-journal inspector. After deliberate host close,
that inspector correctly refuses with AbortError, so the test instead compares
available read-only sketch bytes/versions, feature history/revision and model
membership/revision, and explicitly checks the inspector refusal. It does not
pretend a closed document still permits live inspection.

## Findings retained rather than hidden

- The first combined TSC run found two private stage-access errors and three
  inferred failure-record errors. The first parent correction reduced these
  to two missing-interface declarations. `482081bc3` plus `aca23b2b3` close the
  interface/type gaps; final TSC exits0. The old compiler logs remain in
  `evidence/tsc-021-before.log` and `tsc-482-before.log`.
- An initial line-conflict oracle expected exact-row contradiction because the
  intended requirements are incompatible. The real trial instead reported a
  failed direction domain. `line-cause-oracle-before.json` preserves this
  counterexample. The final oracle asserts the actual failed check explicitly;
  it does not turn unsuccessful numerical behavior into proof of infeasibility.
- An initial host-close observation tried the live public journal inspector
  after closing its host. Its liveness guard correctly refused. The final
  lifecycle control observes the allowed durable state and separately proves
  closed-inspector refusal, without changing product behavior.

## Boundaries

These results qualify the new optional cause at actual public command errors.
They do not finish all CAD gates, validate a human geometry UI, deploy a site,
re-audit My files, or prove general numerical correctness. Original-residual
and numerical-convergence controls remain in the separate component/Worker
corpus; this public suite does not seed unsupported midpoint/custom schemas to
claim broader coverage. Existing generic code/message text remains unchanged.

A structurally valid kind/basis pair is not cryptographic evidence. Exact
schema capture rejects malformed diagnostics; it cannot authenticate arbitrary
semantically false but structurally valid data from compromised in-page code.
The cause describes the check that failed in this trial, not global design
infeasibility. No AI provider is connected or required.

## Reproduce

The test branch is deliberately tests-only. Check out product source
`aca23b2b3`, then bring in the test-only commit above (or this final proof tip).
On R730 the tested runtime is
`/mnt/data10tb/codi-cad-cause-combined-20261106-r1`, with dependencies linked from
`/mnt/data10tb/codi-worker-sketch-view-20261105-r11/node_modules`. Static native
prerequisites were copied from the separate selected-profile fixture; no
production/default asset was overwritten or promoted.

The build used the real sketch Worker, isolated project Worker
`test/headless-line-relations/webpack.project.cjs`, prism semantic Worker and
normal application entries `test/combined-axis/webpack.app.cjs`. Copied stale
hashed Worker files were removed from the NEW `dist`; the build uses normal
entries and serves no separate private test helper. Removal receipts and final hashes are recorded in the pins. Shared caches,
fixtures and the shared browser were not replaced.

```
JSKETCHER_TEST_URL=http://127.0.0.1:PORT/ \
CODI_TEST_CDP=http://127.0.0.1:19329/ \
PUPPETEER_CORE_PATH=/path/to/puppeteer-core \
CODI_SOURCE=PRODUCT_SOURCE \
CODI_EXPECT_APP_SHA256=APP_SHA \
CODI_EXPECT_WORKER_SHA256=SKETCH_WORKER_SHA \
CODI_RECEIPT=/tmp/public-cause.json \
CODI_FAILURE_RECEIPT=/tmp/public-cause-failure.json \
node test/admission-causes/public/browser.cjs
```

The exact pins are mandatory before execution. A new build needs its own
source/dependency-bound pins; do not label another artifact with this receipt.
Only private loopback port20678 was used. The owned server/tunnel and browser
contexts were closed after proof; source/runtime assets remain on R730 for
reproduction. No public route, DNS, service or deployment changed.
