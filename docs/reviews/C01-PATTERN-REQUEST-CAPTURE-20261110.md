# Pattern request capture — BEFORE source review

Reviewed Core `4a1e589ffd5460b888d5717a14c2ac5c3d637c9b` and Host `8a26756d1`. No execution or runtime incident is claimed.

`closedSketchTransitions.ts:changeSketchPattern` takes an own-data top-level copy. `patternStep` and `patternSelection` produce detached frozen nested values, but their initial results are discarded. The function awaits `inspectSketchPatterns`, then reads the caller-owned `a.step` and `a.sourceIds` again to construct its original Worker request. An ordinary direct Core caller that changes its request objects after invocation can therefore change the admitted intent after the command began. The Host adapter already detaches and freezes these nested values, so its existing path does not share that exposure.

The bounded repair must retain the detached nested captures before the first await and use them for every subsequent inspection, identity allocation and original-request reconstruction. It must preserve existing limits, typed refusal, second Worker, source/currentness, journal and cleanup guards.

Grouped acceptance must exercise genuine direct Core create and edit operations: call the actual current registered public Craft method with a mutable own-data request; immediately mutate only the caller request source array/step; await its genuine operation; require returned and discovered generator source/vector/count to equal the original call-time captures. Require actual source outputs, one journal event, unchanged unrelated source/identities and normal creation/edit Undo/Redo and Save/Open alongside the protected Host path. Do not substitute a fake method, timing hook, callback, model write or private successful setter. This is preparation for one eventual whole workflow, not a standalone probe.

Remaining review found no additional confirmed blocker in actual source/generator membership, latest source-stage/order, retained generated identity prefixes, shrink/removal dependency checks, canonical writer rows, original-request second Worker, exact travel reconstruction or bounded Host registration. Numeric-only typed eligibility remains explicit. Qualification remains pending.

## Source disposition

The own-data request copy now retains `patternStep`/`patternSelection` captures synchronously before discovery. Scalar captures remain unchanged. No Host/product domains, Worker evidence, journal or cleanup behavior was changed. The new `test/sketch-pattern-request-capture/grouped-fragment.mjs` calls genuine public Core create/edit then changes only caller-owned nested inputs before awaiting; it checks actual receipts and real inspection, including retained output IDs. The complete outer runner must still bind actual Craft identity/source custody, full source/J/state, travel and .cad cycles; this fragment is not independently qualified or a standalone run. No code was imported or executed.
