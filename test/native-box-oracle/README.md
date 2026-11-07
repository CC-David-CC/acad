# Fixed-seed native box Boolean cell oracle

This test compares two real native WASM builds against a separate exact oracle for a bounded corpus of integer axis-aligned boxes. The oracle never reads native answers and the native evaluator never consumes oracle results. Both compute in real Workers; no tessellation, UI/canvas, healing or region extraction is involved.

Separate current [OCC/Manifold production Worker qualification](OCC-MANIFOLD-20261105.md) now exercises exactly the same 48 expressions with independent occupied-cell bounds as well as volume: each passes 42 volumetric cases, with the same six boundary-only exclusions. Kernel partition/component counts stay separate facts. The original SMLib receipt and source hashes below are preserved.

Current [receipt](receipt.json): **6 corrected, 34 both-pass, 2 unchanged baseline failures, 6 boundary-only exclusions, 0 new regressions**. Candidate: 40 pass / 2 fail / 6 not-tested. Overall native correctness remains `fail`, because forward partial cavity fill and its translation retain native level-0/2 validity failures. The runner's exit 0 means the experiment completed with no new regression or changed existing failure; it is not an all-cases correctness pass. New regressions or changed existing failures exit 1. [Candidate corpus fragment](fragment.json).

```sh
PATH=/tmp/codi-files-move-node/bin:$PATH node test/native-box-oracle/oracle.test.mjs
PATH=/tmp/codi-files-move-node/bin:$PATH \
CODI_TEST_CDP=http://127.0.0.1:19329 \
CODI_BOX_ORACLE_ASSETS=/tmp/codi-native-box-oracle-assets-20261105 \
CODI_RECEIPT=/tmp/native-box-oracle-result.json \
node test/native-box-oracle/browser.cjs
```

Asset layout is `baseline/raw-provider.{mjs,wasm}` and `candidate/raw-provider.{mjs,wasm}` below `CODI_BOX_ORACLE_ASSETS`. The runner verifies all asset hashes before serving immutable in-memory copies from its own ephemeral loopback servers. Baseline inputs are at R730 `/mnt/data10tb/codi-raw-provider-display-20261105`; candidate inputs at `/mnt/data10tb/codi-union-provider-6c99-research-20261105`, also mirrored to example.invalid by the native owner. No binary is checked into this path and no build is needed to replay existing artifacts. All contexts/servers close after the run.

The fixed seed is `0x5eedc0de` (1592639710), with 48 expressions per build: nested exact/enclosing/partial fill, island, disjoint containers, subsequent Booleans, overlapping boxes, face/edge/vertex contacts in both orders, translations, cyclic axis permutation and seven seeded three-box expressions. This is a fixed corpus, not an unbounded fuzzer.

The oracle partitions space at every leaf box coordinate plane plus an outer margin. Expression truth is constant in every open cell; a midpoint determines occupancy and the integer cell products sum exact volume within the explicit coordinate budget. Six-neighbor floods count positive-volume face-connected material interiors and enclosed void interiors; exterior void reaches the margin. These counts use this stated regularized volumetric convention, not topological connectedness through a lone edge/point. Touching-only intersections are detected with coordinate-stratum samples and marked not-tested for boundary topology. Zero-volume boundary geometry is not silently declared empty.

Budget: 48 cases per build, at most six distinct box definitions, 4096 oracle cells and 20 native operations per case; bounded integer origins/dimensions; 6 seconds per Worker and 120 seconds for case processing across both builds. The final run used at most 343 cells and six native operations per expression. Each case gets a fresh Worker; it calls actual `_binding_init`, `_binding_box`, `_binding_boolean`, `_binding_inspect` and `_binding_close`. Intermediate sources are inspected before and after later operations to check exposed native-state preservation. Native copy ownership remains in the unchanged binding.

Defined native volume is compared against the integer oracle. Nonmanifold undefined volume is skipped and labeled; edge-contact unions take this path. Native validity and native material/void counts remain separate assertions. The receipt preserves baseline and candidate facts, individual failed checks and comparison categories. A failure that remains a failure but gains a new failed assertion is classified as a new regression; a differently changed existing failure is flagged for review.

Pins: glue `8e49622c97d839cf94d6c4d5e2de6cbd96d1166075741e08dcbda3b1a223d8fa` for both; baseline WASM `4d35fd5b3a37e500d79388523329d5e61560fcd80cb963b2824533d6cf0f8f21`; candidate WASM `f33f19cd0098b610756db70ae0d25ac1dcba315e9af9eb90e387d0668be90daa`. The direct provider source is unchanged `e854d6ced3886c8533cea06dd5506e2385fdf6c1`; candidate links the exact `6c99bfcfe6c7b9735a8c617b4207921c64b0555e` source-built native libraries. The native owner built this private artifact on R730; no application catalog or provider pins changed. Receipt includes exact test-source hashes and browser version.

No curved-BRep, arbitrary Boolean, physical boundary topology, custom-attribute, manufacturing, history/save/undo or engine-default conclusion follows. Native timing fields include construction and intermediate inspections in the diagnostic path; they are not isolated Boolean performance measurements.
