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
