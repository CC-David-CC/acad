# Public selected-owned32 budget — scoped PASS

This lane owns only this new test directory. Product/shared tests and retained
fixtures remain unchanged. Authoring uses a genuine Circle, public discovery
and32 sequential createSelectedProfileExtrusion calls; no fake history/source
or successful Worker replies.

Final source `6f01a09fea5c75beba9297772edd50ff37b1b2a4`, strict loopback20688,
app85d91870c836e4bd918e3b39593bdc7d31466ba6840235d97dfe8d581f70adab.
All assertions below passed on actual normal-app public operations. Original
failure remains separate; no old receipt was retagged as a pass.

| Final actual acceptance | Result |
|---|---|
| Real Circle source and32 separate extrusions with distinct returned IDs | PASS |
| Progressive planned1..32/remaining31..0, frozen policy and accurate readiness | PASS |
| Profile33, selected-build Boolean33 and BOX33 | RESOURCE_LIMIT before new Worker/message/ID allocation; prior state exact |
| Readonly region inspection at capacity | PASS; source/history/counters/models unchanged |
| Depth5→7.5, undo5, redo7.5 at32 | PASS; measured geometry and IDs preserved |
| Normal native save/fresh-context load32 | PASS; source/history/IDs/geometry preserved |
| Further depth8 and undo7.5 after reopen | PASS |
| Actual owned evaluation observation |32 result replies, maximum5632 triangles; none exceeded bounds |
| Actual app/observed Worker hashes vs final build pins | PASS |

Each owned evaluation has its own32-name lifetime. A series of creates/replays
can legitimately perform more than32 native operations in total; that does not
raise the per-evaluation/authored-history budget. A Boolean needs another native
result even if it reduces live-output count. The public canCreate flag reflects
name preflight; native triangle bounds remain separately enforced, and this
simple-circle test does not exhaust them.

## First normal-app blocker — retained failure

Exact source `b322e02c2d9a3ea26a12ea863e6371ce15e3dba4`, strict fixture20687,
app99d007ac94391f1966c47be03b33a2cd8ebc1fd719349270d64ba85abda2fd91.
First8 public creations pass. The ninth native result succeeds, then the app
refuses "Invalid, duplicate or excessive engine publication check."
evaluationResources.mjs still limits publicationChecks to8. This differs from
the native selected-owned32 policy: the last native trace contains9 results,
1584 triangles. Eight accepted outputs remain; pipelineFailure is null.

evidence/publication-cap8-* preserves the exact initial driver, failed receipt,
raw log and runtime pins. This is an application publication gap, not a native32
failure or a public32 pass. The coordinator's r2 raises only the bounded
application publication-check metadata allowance to256; native32/100000 limits
remain unchanged. Final acceptance uses that new source/app and fresh context
state; the20687/r1 artifact stays unchanged.

## Acceptance contract

- Frozen budget scope selected-owned-evaluation-v1, maxLifetimeNames32 and
  maxCumulativeResultTriangles100000, with accurate current planned names.
- At32 ready stays true for inspection, canCreate false, creationReason
  RESOURCE_LIMIT, withinLimit true/canAppend false/remaining0.
- Creation33, selected-build Boolean33 and BOX33 refuse before Workers/messages,
  feature-ID allocation or source/history/counter/model changes. A transparent
  spy forwards the real allocator unchanged; it never invents IDs.
- Region inspection works at capacity without state mutation.
- Depth edit/undo/redo preserve identities and measured geometry at32.
- Native save/fresh-context normal loader preserves32, with further depth
  continuation and undo after reopen.

Source Circle r10mm, initial depth5 gives500*pi volume per separate solid.
Depth7.5 gives750*pi, depth8 gives800*pi. Repeating one valid region deliberately
exercises distinct authored names; it is not a union/printability test.
Tracing observes real request-sequenced native results, excluding mesh replies
from name counts. The observed triangle total must stay within the bound;
this does not exhaust that cap or prove a heap/RSS ceiling. Legacy default8
policy is outside this selected-owned test.

## Reproduce only with matched final artifacts

Use the coordinator's private fixture and full CODI_SOURCE_PIN /
CODI_EXPECT_APP_SHA. Set loopback JSKETCHER_TEST_URL, matching CODI_EXPECT_PORT,
CODI_TEST_CDP=http://127.0.0.1:19329/, locked puppeteer-core through
PUPPETEER_CORE_PATH, and a new CODI_RECEIPT. Run browser.cjs. The driver closes
only its own contexts and disconnects; it never restarts shared Chromium.
Actual observed Worker pins must match the normal-build manifest before final
qualification. No signed Files re-audit, UI/product change, source packaging,
default-engine promotion or public deployment is included.

## Final evidence and retained paths

public-receipt.json, evidence/public-final.log, runtime-pins.json and pins.json
bind final execution. check-final.py independently checks real native counts,
all three zero-work/zero-ID refusals, source/native history, circle volume/bounds,
capacity edits/travel and matching observed Worker hashes. check-initial-gap.py
separately verifies the retained original failure.

Final runtime: `/mnt/data10tb/codi-cad-selected-profile-capacity-combined-20261106-r2`.
Root build pins: .build/capacity-combined-pins.json. Root's supplied normal build
and TSC passed; this lane did not rebuild or edit product inputs. Portable notes,
source and receipts are backed to both LAN Git refs and
`/mnt/data10tb/codi-selected-profile-public-budget-evidence-20261106`.

```sh
python3 -B test/selected-profile-public-budget/check-initial-gap.py
python3 -B test/selected-profile-public-budget/check-final.py
```

Final execution used loopback20688, the exact source/app pins above and CDP19329.
Only owned contexts closed. Unused legacy/default assets present in the build
manifest are not claimed as exercised. This is a bounded capacity milestone,
not a full CAD1/2 qualification or memory/performance guarantee.
