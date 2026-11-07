# Drawing persistence BEFORE checkpoint

Core source `8b8adfc7b39d968e026c2078d971d62cf8cd6d37`.
Only new files in this directory are authored. Production code is unchanged.
See [CONTRACT.md](CONTRACT.md) for the approved format direction and proposed
bounded implementation ownership; persistence/publication is **not implemented**.

11 BEFORE observation groups pass on Node24.22.1 with the actual production
validation Worker compiled by webpack and actual manager TypeScript loaded by
the established explicit storage/UI/pipeline fixture. Four actual validation
Workers across the suite terminate (three direct Worker controls and one manager
control); no geometry/native work is submitted. Synthetic drawing references
intentionally refer to no current part and prove no native membership.

Confirmed boundaries:

- Existing definition capture accepts valid unresolved metadata and rejects
  wrong units. The captured records deliberately have null prototypes.
- v2 encoding without drawings remains exact. Both a drawing-bearing v2 and
  the proposed drawing-bearing v3 currently reject in the codec and actual
  validation Worker. Hiding metadata inside project/model also rejects.
- An additional fourth encoder argument is silently ignored today. This is a
  missing API observation, not authorization to invoke a future encoder or proof
  that the test's arbitrary collection argument is a valid future argument.
- Actual manager byte restore rejects the drawing-bearing input, retires its
  validation Worker and stages no storage/history/counter writes. Existing failed
  restore lifetime revocation may advance generation; no false full-lifetime
  preservation claim is made. No drawing getter/publication exists yet.
- Existing presentation survives the Worker's full `value` reply, while its
  separate storage projection contains only model/sketch data. That reusable
  boundary is observed rather than inferred.

R1 preserved at `evidence-r1/`: 10 pass, 1 harness failure caused by comparing
null-prototype captured records against ordinary-prototype input using strict
deep equality. R2 changes exactly that one assertion to compare serialized data
and explicitly require the null prototype: 11 pass. No production/compiled Worker
hash changes. `check-evidence.mjs` reconstructs the exact R1 source and checks
both receipts and the unchanged source/Worker pins. These passing observations
confirm the missing persistence seam; they do not qualify drawing retention.

Reproduce from this checkout with its normal qualified node_modules:

```sh
/tmp/codi-files-move-node/bin/node test/linked-part-drawing-persistence/build-validation.cjs
/tmp/codi-files-move-node/bin/node --test test/linked-part-drawing-persistence/before.test.mjs
/tmp/codi-files-move-node/bin/node test/linked-part-drawing-persistence/check-evidence.mjs
```

The generated validator stays outside Git at
`.build/display-units/validation/worker.js` to reuse the existing manager fixture.
The build imports the normal production validation webpack config. Source and
generated Worker SHA256s are in both receipts; no generated runtime is committed.
Do not rerun `run.mjs` over frozen evidence directories.

Next product slice, pending separate authorization: codec + validator + manager
capture/restore/retirement, with manufacturing Save reconstruction retention and
strict document currentness. Host v3 admission and atomic shared-journal
publication remain distinct required integration work; actual native Save/fresh
Open and drawing reference realization are still unqualified.
