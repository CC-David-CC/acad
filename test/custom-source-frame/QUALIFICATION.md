# C08 Phase A qualification log

## R1 — 2026-11-08: FAIL, request transport before first source

Actual composed source: Core `df70adfb6d2eca0dabef393db0e2758174e80bf0`,
Desktop `9fd652f1b9a0d4b3a30a9b47c8e04f146ee1e177`.
Normal complete Worker/Native/main build and app fixture construction succeeded
on R730. Logs are `source-frame-df70adf-build.log` and
`source-frame-df70adf-fixture.log` in
`/mnt/data10tb/codi-acad-build-20261107-r2/.build/`.

Signed outer CAD bundle:
`3bfb178688d0aeb84a00c98a9d8d8694a23cd0522f5e885fa98cbde57b031fea`.
All 97 selected runtime pins matched. Files bundle remains unchanged.
Private loopback fixture20987 uses fresh real-disk state
`/tmp/codi-acad-fixture-state-20261108-r5` on R730; no account state was copied,
no public deployment or external relay enabled.

The complete workflow stopped on its first registered `create-source-frame`
request (null parent, identity basis): `Sketch solve request must be a tree.`
No source-creation checkpoint or native Save completed. The recorded public
transport omits the original inner stack and task, so the precise repeated
reference is not established by this receipt. Source tracing is in progress;
do not attribute the failure to a geometry kernel or claim a committed model.

`evidence-r1/receipt.json` and frozen execution source are retained unchanged.
Owned browser context closed; no owned targets remain; shared browser retained;
all recorded source hashes unchanged. Driver session14472 is terminal exit1.
No independent artifact oracle was run because the complete workflow failed
before it produced saved artifacts. No test expectation or guard was relaxed.

Next: repair the actual request construction while retaining tree validation,
perform a normal build, then repeat the complete workflow in a new evidence
directory. Phase B native-solid-face attachment remains required and open.

### Source-confirmed cause and repair candidate

The actual source producer `sourceFrame.operation.ts` checks saved local intent
during candidate evaluation with a reframe request. It supplied the same derived
`f` object as both `beforeFrame` and `afterFrame`. The shared request tree guard
therefore correctly rejected this internally constructed alias. Initial command
placement/derive/empty requests were not the offending construction.

The repair captures only `afterFrame` through existing `captureSourceFrame`,
creating four independent bounded vectors with identical numeric values. No
tree guard, geometry tolerance, currentness proof, solver result or test
expectation changes. The existing complete workflow remains its regression;
source correction is not a qualification pass until that workflow succeeds.

## R2 — 2026-11-08: FAIL, final negative fixture encoding

Actual runtime Core `a9022cebebbab50c451bed48c2be49eae49ea8b6`, same Desktop
`9fd652f1b`. Full normal build and fixture construction passed; private20988
uses fresh R730 state `/tmp/codi-acad-fixture-state-20261108-r6`.
The unchanged complete driver reached47 checkpoints,13 Native observations,
four real `.cad` saves/server equality checks and fresh Open/reedit cycles.
Creation/travel, transforms, principal depth propagation and stale-cache Open
refusal passed up to the recorded checkpoint. No complete qualification follows.

The final invalid-parent Open returned `CAD_ARCHIVE_INVALID` with message
`Authored native metadata is not canonically encoded.`, instead of the expected
`INVALID_FRAME_DEPENDENCY`. The own-file generator's shared `rewrite_row`
serialized both raw sketches and model metadata without sorting keys. Sketch
bytes may retain authored order, but native model metadata must be canonical.
The archive guard correctly rejected that earlier encoding defect. This is a
negative fixture construction error, not evidence that dependency validation
or a geometry engine failed. Keep the precise expected dependency code.

Frozen `evidence-r2` includes all four actual saved files, both own negative
files, the terminal failure, exact source/runtime pins and successful context
cleanup. No artifact oracle pass is claimed for the failed complete workflow.
Next: canonicalize only the mutated model metadata in the independent generator
and repeat the entire unchanged-domain workflow in a fresh evidence directory.
