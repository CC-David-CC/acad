# Owned hole authored intent

Base CAD `f53e3ba5ebcda89db716fed021bf5ef7da4c07f4`. New files only: `modules/engine/solid/ownedHoleIntent.mjs`, its `.d.mts`, and this test directory.

`captureOwnedHoleIntent(input)` captures a detached frozen discriminated union. Both kinds retain version/unit/OCC/exact engine revision, new feature, current target/producer, origin selected-extrusion feature, opaque source face/region and diameter. `centered-through` has exactly 12 fields; `four-corner-through` adds offsetX/offsetY. All accepted fields are own enumerable primitive data; no getter executes. All failures carry `INVALID_REQUEST`.

The new feature must differ from producer/source; producer may equal source on the first hole. No chronological identity ordering is inferred. Target must equal `solidBodyId(producerFeatureId)`. The engine revision is exactly 136 characters of lowercase SHA syntax. Source IDs preserve their exact bytes. Diameter/offsets are finite `(0,1e6]` mm. Tiny positive values and offsets that later reverse geometric row order are legal intent data; evaluation must establish its own supported precision and real geometric admissibility.

No geometric planner, Worker, ledger, source-link proof, capability, UI, feature registration, Save consumer or evaluated tool extent was added. Kinds convey through-all; future evaluation derives extent each replay. The original selected source remains the sole authored model. Native/app geometry and full Gate 1 are unqualified by these tests.

Validation: Node 24.22.1 passes 11 data-contract tests; TypeScript 4.7.4 strict NodeNext declaration checks pass (positive discriminant narrowing and required compile errors for mutation/handle/depth/invalid kind). `receipt.json` records source hashes and exact commands.

Reproduce from repository root:

```sh
node --test test/owned-hole-intent/intent.test.mjs
node /path/to/typescript/bin/tsc --noEmit --strict --skipLibCheck --target ES2022 --module NodeNext --moduleResolution NodeNext test/owned-hole-intent/declarations.mts
```
