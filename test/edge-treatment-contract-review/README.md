# Bounded E11 contract review and selection-index controls

`CONTRACT.md` is the concrete code handoff supplement to the existing broad
E11 plan. It records the agreed native apply signature, Worker/private-ledger
selection boundary, proposed typed feature fields, exact small analytic cases
and the serial Boolean-ancestry dependency. It contains no feature implementation.

One concrete pure-index defect was found: valid generated keys could exceed
the resolver's maximum length. The original direct observation is retained in
`selection-key-before.json`, explicitly transcribed with its missing source hash
acknowledged. It is not falsely presented as a new source-pinned execution.

The fixed-source unit runs import the actual frozen helper, use genuine R2
catalog/provenance, and label synthetic region metadata/native renumbering
explicitly. R3 and final R4 each pass four controls: ordinary keys resolve,
the8190-backslash label refuses SELECTION_RESOURCE_LIMIT before advertising
unusable keys, a bijective synthetic native renumbering preserves the complete
authored plan while remapping private resolver targets, and a different producer
identity creates a distinct namespace. R3 and R4 source hashes remain separate.

```sh
CODI_SELECTION_INDEX_MODULE=/tmp/frozen-r4/modules/engine/mount/prismSelectionIndex.mjs \
node test/edge-treatment-contract-review/selection-index.test.mjs /tmp/index-check.json
```

These are pure identity-unit tests, not native geometry, public app, CAD save
or security evidence. Actual R4 Chromium Worker selection-read evidence is
separately documented in `test/prism-selection-read/`.
