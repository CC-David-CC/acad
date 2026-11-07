# Multi-material/void preview boundary source controls

```sh
PATH=/tmp/codi-files-move-node/bin:$PATH \
CODI_PREVIEW_REVIEW_ROOT=/tmp/codi-cad-mechanical-candidate-20261105 \
node test/multivoid-preview-review/run.cjs
```

The runner reads a full selected checkout containing the preview contract and legacy fix, never edits it, verifies source hashes remain unchanged during execution, deletes its tiny temporary bundle and records product/test SHA-256. It uses existing dependencies and tsconfig. No app build or running fixture is needed.

The final [receipt](receipt.json) covers 14 actual capture/model/ledger source-method assertions with controlled provider records. No viewer double, real kernel, browser or signed transport is claimed. The initial [model receipt](initial-model-receipt.json) preserves the legacy bypass in exact source 42bda4c5a; its source hashes match that commit. Root's a9dafce6e correction refuses the known counts regardless of omitted resultKind.

For a non-asserting before/after probe against a selected source checkout, set `CODI_PREVIEW_LEGACY_PROBE_ONLY=1` and a separate `CODI_PREVIEW_REVIEW_RECEIPT`. It reports whether real captured legacy evidence yields preview or refusal without requiring the newer contract. These are controlled source records, not native geometry evidence.

[Finding, ownership/manufacturing analysis and bounded runtime scope](../../docs/research/MULTIVOID-PREVIEW-CONTRACT-REVIEW-20261105.md).
