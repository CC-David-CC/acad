# Owned wizard draft Cancel qualification log

## R1 — 2026-11-08: setup FAIL before wizard cycles

Actual compiled Core `4f5b2ca02e697ef1c425a597ec848078f565d25f`,
Desktop `9d8f51061feb86d1915c5b76e8bc27264ec547d3`.
Normal complete build and actual CAD/Files fixture construction passed on R730;
logs `wizard-4f5b2ca-build.log` / `wizard-4f5b2ca-fixture.log` under
`/mnt/data10tb/codi-acad-build-20261107-r2/.build/`.
Private20990 uses fresh direct state `/tmp/codi-acad-fixture-state-20261108-r8`.

The root-supplied test build was the manufacturing cohort
`sha256:32eec74e3019d9e2d767c9016f05aa3daa49441c6102423a269d67b9c7f02a08:abbf2aa02a6f2101c600aa1eedd20fa80ab2db206e677ca860d9c5103cdfbfcc`.
The unchanged driver stopped at `Explicit staged modern box build`, after
matching all selected runtime pins. No draft cycles, Native observations or
saves completed. It did not record the returned build description. Context
cleanup succeeded, shared browser remained, frozen source hashes are unchanged;
driver42685 is terminal exit1. No Cancel behavior or kernel failure follows.

Source inspection at the actual compiled revision shows
`listAvailableBoxBuilds` advertises preferred engine builds and the explicitly
staged shell cohort. `requireAvailableBoxBuild` additionally permits selected
profile continuations; the manufacturing cohort supplied by root is not in that
advertised box list. This is an input/cohort-discovery mismatch for this run,
not evidence that the Cancel repair failed. Do not infer an undefined complete
catalog-enumeration contract or change a production catalog to satisfy this test.

Next run uses the staged, advertised owned-box shell cohort
`sha256:57b74074e0a249b917ac68357fbd003c37d1ab61897206886b575088e6995858:60dc956b08e01f43d08a48035a384e478e63bb34fb55f21a152c8cd12e8b8947`.
Its declared capabilities include actual box construction, point observation,
selected-profileV3 and modern history. The full driver, availability assertion,
Native validity/volume/bounds/points and all chronology checks remain unchanged.
R1 is retained; no independent artifact oracle ran without a whole PASS.

## R2 — 2026-11-08: FAIL at accepted-prefix metadata read

Same actual Core4f5b2ca/Desktop9d8f51061 fixture, unchanged driver, advertised
owned-box shell cohort. Runtime pins, actual box creation and first full-tip
Native observation passed. After the registered prefix operation, `state()`
failed on wrapper `inspect`: `Finish the current sketch, operation or history
edit before inspecting.` No draft cycle or Cancel gesture completed; no saves.
Returned post-prefix state was not captured. Terminal driver82635 is exit1,
owned context closed/shared browser retained, frozen source hashes unchanged.

Source at Desktop9d8f51061 confirms `index.mjs`'s metadata inspection rejects
`isEditingHistory` or any wizard request, then obtains its revision through
the save-readiness gate. This blocks read-only accepted-definition observation
even for an intentional settled prefix. It is distinct from mutation readiness.
Next repair separates that read from save permission and explicitly excludes
unapplied drafts from its metadata meaning. Processing/file-busy/editor guards
and all save/mutation checks remain. Preserve the driver and all expectations.
This is not yet runtime proof of Cancel or full C12 integration.

## R3 — 2026-11-08: scoped browser and independent oracle PASS

Actual compiled Core remains `4f5b2ca02e697ef1c425a597ec848078f565d25f`;
Desktop is `18c621383dbecaad24d58b9b3a3475b29985a7b5`, which separates
accepted-definition inspection from save readiness. Core binaries, frozen full
driver, assertions, geometric tolerances and advertised shell cohort are unchanged.
Normal host app construction/pinning passed; log
`wizard-4f5b2ca-host18c621-fixture.log` under the R730 build checkout's `.build`.
Private20991 uses fresh direct state `/tmp/codi-acad-fixture-state-20261108-r9`.
All97 selected runtime pins match; Files bundle remains unchanged.

`evidence-r3/receipt.json` PASS:25 checkpoints, two genuine PLANE wheel/draft/
Cancel cycles (changed and exact round-trip no-op),14 Native observation sets/
42 actual inside/outside/boundary classifications, two normal `.cad` saves with
server-byte equality and fresh Open/reedit/travel. Competing registered history
actions refuse exact UNAVAILABLE while each real draft remains intact. Cancel
reissues the pristine SAME accepted prefix without source/model/counter/J
mutation; ordinary registered Undo/Redo then preserves actual entry/cursor
chronology. Width edits10→12→14, their shared travel and both reopens pass.
Owned context closes/shared browser remains; source hashes unchanged;
driver70332 is terminal exit0. No private authoring or simulated UI events.

After-whole `independent-oracle-r1.json` / `independent-check.json` PASS verifies
raw rejected-state retention, accepted prefix/J/source identity, actual applied
position entry/cursor transitions,14 read-only Native observations and analytic
box geometry/42 classifications, two ZIP/CRC/SHA/source/history artifacts and
fresh-session Undo reset. UI draft/Cancel comparison normalizes only the three
documented UI-dependent read tokens and separate wizard fields; raw evidence
is retained. It does not parse opaque revision strings or import production
geometry/codec implementations.

Qualified finite scope: real no-op/changed draft versus accepted prefix, owned
same-prefix Cancel, competing history refusal, shared travel, read-only wrapper
inspection and subsequent ordinary box edits/native persistence on this cohort.
No all-legacy/insertion/stale-handler gesture claim, source Apply, raw timeline
migration, prefix UI Undo enablement, allC12 or fullGate1 signoff follows.
Those remaining shared workflows are explicit work, not waived requirements.
R1/R2 failures remain unchanged; no public deployment or external relay enabled.
