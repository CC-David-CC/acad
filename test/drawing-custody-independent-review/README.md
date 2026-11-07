# Independent drawing custody review

Reviewed Core `1a3988fef` (PM drawing custody `87ddaf9b9`, codec and native-signal repair composed), Desktop `4347211b9`. No product edits, browser, account, Native geometry, deployment or filesystem/security probes. Actual manager functions and genuine validation/hash Workers run on an empty model plus a **synthetic unresolved drawing definition**. This tests data custody and lifetime, not reference resolution or a successful drawing feature.

Two counterexamples remain after the restore-local orphan guard:

1. The caller's initial `valid()` callback reactivates the **actual manager** on the same context. Restore eventually rejects `AbortError`, but generation advances 1→2, both document signals abort, and one validation Worker is allocated. This manager replacement must refuse during preflight, before starting the replacement document lifetime.
2. After genuine V3 validation/Open, reactivating the actual manager makes the current manager's definition null. Calling the retained old manager's `prepareHostSave()` nevertheless returns its old V3 drawing and reports `isCurrent()===true`. A Save capability must belong to the manager activation that owns its private state, not whichever manager happens to be current when an old method is called.

These share the per-activation manager-authority invariant. They are component fault-contract findings, not observed signed-app data loss. Root accepted the findings; the implementation owner fixes production. A current-manager actual Open/Save control passes. Before observations and source pins are immutable evidence.

The test derives the existing manager fixture into `.build` by rewriting relative imports to their original absolute module URLs and exposing only its already-loaded `module.exports.activate(ctx)` as `reactivateManager()`. No product function, source data, registry writer or Native result is replaced. The existing storage/UI/geometry-replay fixture boundaries remain explicit. The generated fixture is outside Git; its exact hash and original fixture hash are pinned.

Unchanged normative assertions for the implementation owner's after run:

```sh
node test/linked-part-drawing-persistence/build-validation.cjs
node --test test/drawing-custody-independent-review/review.test.mjs
```

Optional `CODI_DRAWING_REVIEW_OUTPUT` points to a fresh existing directory for raw outcomes. Default tests do not overwrite the committed before packet. The original full before run is 1 pass / 2 failures. Source review also checked V2 compatibility, immutable definition getter, post-replay-only adoption, document-abort reset/retired-listener behavior, Worker parse/validation entry, material hash exclusion, drawing revision currentness, and Desktop envelope/dirty-state retention. No additional concrete blocker was found in that bounded source review. Full authoring/dimensions/Undo and signed native persistence remain separate Gate 1 work.
