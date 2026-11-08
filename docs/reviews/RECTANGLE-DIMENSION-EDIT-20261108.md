# Explicit declared rectangle dimension edit

Source-only coherent repair. No tests, probes, TSC, build or browser execution were run for this packet. Root owns the single solveWorker dispatch splice and normal combined build/full workflow. No Native, Desktop, ledger, ordinary extrusion, read, Open or global replay path is changed.

## Actual failure / bounded conclusion

Complete C07 R1 on Core32ae failed after25 rows with no native saves. Public edit-rectangle-dimensions requested8x5 from the retained100x50 source. The originating hole feature4/index3 returned UNSUPPORTED_PROFILE, `The source must be exactly axis-aligned in its own sketch frame.`, instead of the frozen expected HOLE_OUTSIDE_PROFILE. The separate D200 hole edit correctly returned HOLE_OUTSIDE_PROFILE. Original receipt/source and first failure remain unchanged.

Source confirms that rectangleEditing changed two driving constants while retaining old geometry, then sent that draft to generic rectangle-extrusion-solve. The generic task optimizes source, while the hole domain requires exact axis alignment. The failed candidate coordinates were not recorded: this packet asserts no numerical delta, exact optimizer cause or later replay distortion. The existing independent canonical constructor is the appropriate edit seam, not a relaxed axis guard.

## Private task / ownership

`rectangle-dimensions-edit` carries exact own data:

```
{
 task, revision,
 originalSketchJSON, draftSketchJSON,
 travelTargetSketchJSON: string|null,
 boundary, externalParameters,
 edit: {
   width, height,
   widthRow: {stage:0,index},
   heightRow: {stage:0,index}
 }
}
```

Main captures the actual current source and services/revisions as before. It supplies current source geometry with only the two requested literals changed in the draft. Row locators come from the existing private captured dimension targets; they are transient source-equation positions, never public input or persisted identity. Worker decodes the original source into real registered objects, checks actual SegmentLength schema/constraint/Segment/Param ownership, original numeric-literal values and distinct target rows, and verifies the entire draft differs only at those requested literals. It does not parse IDs to infer a row.

Ordinary edit sends null historical target. Private journal travel sends the existing exact historical target separately. The historical target must retain complete other authored intent and unrelated geometry; only the four real rectangle roots' coordinate fields and the same two dimension literals may differ. Its dimensions must equal requested travel values. Its actual captured coordinates receive independent cold/original-equation proof before those exact bytes can be returned and published. The draft is always derived from CURRENT source, not substituted with target geometry.

Every source retains the existing65536 JavaScript-character limit; no new65536UTF8-byte cap is added. Hashing actual serialized UTF-8 bytes remains Worker-only. Existing aggregate client tree/deadline/lock/abort/disposal policies apply to this one disposable job. The helper's retained1MiB internal envelope cannot narrow a65536-character source via UTF-8 byte length. Limits are not account-file policy changes.

## Canonical versus legacy generic path

The existing registered4 Segment/11 authored-row declaration derives its cycle, anchor, axes and dimensions from actual decoder/factory identities. A narrow private export now exposes its real width/height source-row bindings. It opts this EDIT into the canonical path only when current coordinates exactly match declared corners. Existing typed callers and eligibility/current-mismatch behavior are unchanged. No closest-coordinate match or implicit healing flag is added.

For an eligible canonical original, its actual row bindings must equal the independently checked private requested locators. The existing helper verifies original current source with update:false. It constructs the requested candidate with update:true, then performs its two fresh cold proofs, original edited equations at constructed coordinates, actual ownership and admission checks. A recognized proof failure remains a failure. No optimizer output is pasted over a failed source.

Null eligibility retains generic solve of the strictly verified draft. Generic original/current source is independently replay-bounded and evaluated against its original equations first. This preserves the legacy noncanonical/additional-independent-Point route without giving it an automatic canonical constructor. Main still checks evidence, complete intent/object identity, unrelated geometry and dimensions before guarded publication. Candidate output is not written before the whole pipeline succeeds.

Travel additionally independently proves its actual historical target, including noncanonical targets via captured-coordinate validation. It publishes exact target bytes, not canonical or optimized replacement bytes. Literal spelling from an old target may be preserved when it resolves to the same requested numeric dimensions. No new journal state/type or creation-Undo model is added.

## Root-owned dispatch splice

Inside solveWorker.ts's explicit-task block, before the generic task fallthrough:

```ts
if(request.task==='rectangle-dimensions-edit') {
  const {prepareRectangleDimensionEdit}=require('./rectangleDimensionEdit');
  const {task,...payload}=request;
  self.postMessage(await prepareRectangleDimensionEdit(payload));return;
}
```

This branch alone invokes the new helper. Existing rectangle-extrusion-solve, typed tasks, normal extrusion/source discovery/read/Open all retain their old dispatch. Root owns this splice to avoid collision with C08.

Success uses the unchanged full solve envelope `{revision,ok:true,sketch,evidence,serializedSketch,sketchDigest}`. Client admits this exact task envelope with the legacy character limit. Main receives bounded own-data failures including original admission cause. New failures have actual phase/code/message/cause only; JSON syntax errors do not echo raw source. The existing constructor's actual first endpoint-difference diagnostic remains available if proof fails. No unmeasured candidate delta is fabricated.

## Remaining whole-pipeline qualification

Run the unchanged complete C07 workflow on a fresh composed runtime. Expected HOLE_OUTSIDE_PROFILE and originating feature4/index3 stay frozen; before/after accepted source/history/journal/resources must stay unchanged on the refused8x5 edit. Retain valid edits, mixed travel, Save/sync/freshOpen and other existing cases. No expected-error/axis/residual/precision tolerance changes are proposed.

Selected-profile replay still independently calls the ordinary generic solve. Edit construction alone is not proof that every later generic reconstruction preserves exact axes. If that same full workflow still fails there, preserve bounded actual candidate/source endpoints and the actual phase/digest before inferring a numerical delta or proposing another source policy. Do not add a global read/replay healing path to conceal it.
