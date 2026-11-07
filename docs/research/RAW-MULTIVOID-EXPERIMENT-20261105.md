# Whole native BRep experiment — 2026-11-05

**Finding:** the existing JavaScript multi-material-plus-void refusal blocks a valid initial result, but removing it alone exposes a downstream native/binding-level census and volume inconsistency. Keep the production guard while investigating the underlying cause. This is a bounded counterexample, not a permanent unsupported classification or a proposed healing/extraction workaround.

Source base: CAD `1fddd2d1ce89a216d011e304fafcbf284b066278`. NVIDIA upstream source: `3fd5b9548d19aa8c12c29bc9637a96d42a06f8a5`; direct binding fork: `e854d6ced3886c8533cea06dd5506e2385fdf6c1`. Chrome `155.0.8059.79`; actual same-origin Worker under `script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'`. No UI/canvas, fake success response, region extraction, healing or geometry substitution.

Inputs in millimeters:

- `A`: origin `[0,0,0]`, dimensions `[10,10,10]`.
- `I`: origin `[2,2,2]`, dimensions `[6,6,6]`.
- `C`: origin `[20,0,0]`, dimensions `[10,10,10]`.
- `H = A − I`: volume `1000 − 216 = 784`.
- `D = H ∪ C`: volume `1784`, two material regions and one void.

The experiment alters only two generated JavaScript fixture clauses, retaining the whole native container and all other validation. The tracked production source has no changes.

| Actual operation | Native/binding observation | Independent mesh and analytic oracle | Result |
| --- | --- | --- | --- |
| Baseline `H ∪ C` | `MULTI_MATERIAL_VOID_UNSUPPORTED` | Existing wrapper refusal preserved | Baseline control passes |
| Experimental `H ∪ C`, `C ∪ H` | Both validity levels true; manifold true; 2 material, 1 void; volume 1784 | 36 triangles, 3 closed oriented surfaces: +1000, −216, +1000 | Pass |
| `D − C`, `D ∩ A` | 1 material, 1 void; volume 784 | Closed mesh volume 784 | Pass |
| `D ∪ I` | Both validity levels true; manifold true; **1 material, 1 void; volume 1000** | 24 triangles, two closed oriented +1000 surfaces; volume ≈2000, bounds `[0,0,0]..[30,10,10]` | **Fail** |
| `I ∪ D` | 2 material, 0 void; volume 2000 | Same analytic volume and closed mesh | Pass |
| Baseline/direct `H ∪ I` | Native inspection `NON_SOLID_UNSUPPORTED` | Direct native tessellation is a closed 12-triangle box with volume ≈1000 | **Fail** |
| Baseline/direct `I ∪ H` | 1 material, 0 void; volume 1000 | Closed mesh volume ≈1000 | Pass |
| Direct `(H ∪ I) ∪ C` | Both validity levels true; manifold true; **1 material, 1 void; volume 1000** | Closed mesh volume ≈2000 | **Fail** |
| Reference `A ∪ C` | 2 material, 0 void; volume 2000 | Closed mesh volume ≈2000 | Pass |

Every completed mounted downstream case preserves the original A/I/C/H evidence and Float64 triangle-buffer SHA-256, and preserves D after the downstream operation. Mesh checks use independent scalar triple-product integration, exact triangle-edge pairing with opposite orientation, nondegenerate triangle checks, bounds, and surface adjacency. All reported direct native tessellations have zero unmatched/misoriented edges and zero degenerate triangles. These planar box fixtures support an independent volume check; tessellation is not promoted into a general analytic BRep truth oracle.

The test-only direct Worker calls `_binding_init`, `_binding_box`, `_binding_boolean`, `_binding_inspect`, and `_binding_tessellate` from the pinned WASM. It reproduces the bad census/volume without `rawMount` or `rawWorker` classification. This localizes the discrepancy below those JavaScript gates; attribution between the binding and NVIDIA implementation remains under investigation. Do not claim an upstream root cause solely from this evidence.

Binding source `research/wasm-solid-contact-20261105/provider.cpp:49` copies both inputs before `SmApiBoolean`; lines 56–65 independently call manifold, material census, bounds, native volume, and validity. A zero-solid census produces the inspection refusal at line 62. The API ownership contract `source/SM_API/inc/SmApiBrep.h:50` specifies success aliases the first operand and deletes the second. The binding's copy ownership matches that contract; this review found no concrete success-path copy leak.

Pinned assets:

| Asset | SHA-256 |
| --- | --- |
| Native WASM, unchanged | `4d35fd5b3a37e500d79388523329d5e61560fcd80cb963b2824533d6cf0f8f21` |
| Glue, unchanged | `8e49622c97d839cf94d6c4d5e2de6cbd96d1166075741e08dcbda3b1a223d8fa` |
| Baseline Worker | `5c17193baaabef79fb4cc6ad4e552e56e36bc9d07fd1b0ebf03ea392eac5f45f` |
| Experimental generated Worker | `4c86d804cfd4f15399225c2ddd6bfd10cd20860467dc110275f98c973665ad60` |
| Direct diagnostic Worker | `9939bc33fef4033d875def8fdf4463ed071cf9fff206e130b22efbaf053f76f3` |

[Reproducer and scope](../../test/raw-multivoid-experiment/README.md); [final machine-readable receipt](../../test/raw-multivoid-experiment/receipt-r7-final.json), including raw native triangles, before/after hashes, exact test-source hashes and pass/fail checks. The overall result intentionally remains `fail` and the runner exits 1. The first direct harness omitted initialization and is retained separately as an invalid geometry experiment. No engine-default decision, mixed-engine history claim or manufacturing-export claim follows from this work.

Next useful fix belongs in the isolated native fork: explain the order-dependent region state/census/volume, preserve the counterexample, then rerun both operand orders/groupings with native validity and the independent mesh checks. Support for whole-container multi-material-plus-void results can be reviewed after that evidence, without changing the one-model architecture.
