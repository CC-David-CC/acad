# Existing driving dimensions

The approved nine-file source slice adds editing/removing discovered SegmentLength.length and DiameterLength.diameter through the existing closed-sketch coordinator, real parametric transaction, production Worker, prepared source replay and sketch-bytes authored journal. [API.md](API.md) specifies the normal public/service boundary. No persistent constraint ID/native schema, solver math, Craft implementation/journal, selected-region descriptor, native library or renderer changes are involved.

Tests compile the actual production solveWorker and actual coordinator/client service. They use real model plane/frame constructors and the real journal helper. Node messaging, storage, publication, host lifetime and Web Locks are explicit protocol adapters. These adapters do not synthesize native solid geometry or establish signed UI/app acceptance. Generated runtime stays outside Git under `.build/closed-dimension-edit/`.

Coverage includes actual Circle/Arc diameter replacement, Segment length replacement/removal, an underconstrained remainder, redundant reactivation, contradiction preservation and healthy retry, strict identities/fields/domain/no-op, exact source Undo/Redo, multi-stage fixed geometry, typed quantities and named rectangle lengths, wrong-dimension/stale-source/result/quantity/lifetime fences, malformed Worker replies and known committed outcomes. Original residual profiles retain 1e-6 mm length and 1e-8 radian angle tolerances. Legacy named local expression definitions restore exactly through Undo; no evaluator was added.

The initial sixteen controls exposed no contradiction/Undo failure, but root review found an independent candidate-proof gap: validity plus structural delta allowed an unrelated free loop to move. `verifier-before.json` and its two failing negative controls retain actual acceptance of a 7 mm displacement by the old verifier, pinned in `verifier-before-pins.json`. The correction independently reproduces the entire edit/removal and compares complete native state. Typed journal travel proves at least one forward direction of the complete pair, permitting genuine Undo of underconstrained nonlinear motion without assuming inverse numerical solves are reversible. Additional positives cover typed underconstrained Arc Undo and legitimate dependent second-circle motion. No geometry equivalence epsilon was introduced.

```sh
/tmp/codi-files-move-node/bin/node test/closed-dimension-edit/build.cjs
/tmp/codi-files-move-node/bin/node --test --test-reporter=tap test/closed-dimension-edit/dimension.test.mjs test/closed-dimension-edit/verification-regression.test.mjs
/tmp/codi-files-move-node/bin/node /tmp/codi-typed-common-transaction-20261105/node_modules/typescript/bin/tsc --noEmit --project tsconfig.json
```

`verified.tap`, `actual.json`, `verification-regression.json` and `receipt.json` provide the frozen result and Worker cleanup counts. Nine product source hashes are captured before/after builds and checked against the frozen checkout after execution. Node24 and qualified TypeScript4.7.4 are used.

Initial harness failures are preserved in `harness-before.json` and development TAP logs: missing Node platform origin/performance, actual Verb initialization and storage namespace enumeration. Large raw minified-source context remains outside Git. Initial TypeScript inference failures were corrected with capture return declarations. `development/legacy-field-expression-before.tap` records an invalid test assumption that a direct legacy field expression L*2 already worked; the corrected control uses the existing supported local definition K=L*2 and raw field name K. The parser/evaluator was not widened to conceal that failure.

Only the two declared driving schemas on actual authored objects are supported. Other rows are explicit unsupported targets. Typed local constants, generators, labels and separate reference-dimension records stay excluded by the typed wrapper; other typed mutation families keep their guards. Persisted rejected/invalid sources remain unsupported by strict replay. The parent still owns normal desktop registration, actual signed downstream solid replay, native Save/server sync/fresh Open and paint qualification. This is not full Gate 1 acceptance.

Recorded TAP files normalize trailing line whitespace only; their original raw logs remain under `.build/closed-dimension-edit/failures/`. JSON observations and artifact pins are unchanged.
