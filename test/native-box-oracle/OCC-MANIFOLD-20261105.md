# Same 48 expressions: current OCC and Manifold Workers

Actual Chrome `155.0.8059.79`: **OCC 42 pass / 0 fail / 6 not-tested; Manifold 42 pass / 0 fail / 6 not-tested.** [Raw receipt](occ-manifold-receipt.json), [same-expression summary](same48-summary.json), [OCC fragment](occ-fragment.json), [Manifold fragment](manifold-fragment.json).

The exact 48 expression records and original oracle-source SHA values match the preceding experimental SMLib run. New [bounds helper](bounds.mjs) derives occupied-cell bounds from the same independent partition and midpoint truth; it does not alter the original oracle or its historical hash manifest. [Known bounds controls](bounds.test.mjs) cover cavity/compound, translation, permutation, overlap and empty cases. All oracle computation and native orchestration run off the UI thread.

Both engines' exposed volumes and bounds match the independent integer-cell result within the declared bounded-box tolerances (volume `max(1e-7, |V|*1e-9)`, coordinates `1e-7` mm). OCC additionally reports actual `nativeValidity:{method:'occ-inspect-analytic-v1',valid:true}`; Manifold reports actual `nativeStatus:'NoError'`. These are each kernel's own facts, not equivalent general validity certificates. OCC's exposed measurement is explicitly `tessellation-signed-integral`; Manifold's is `mesh-kernel-volume`. The test adds no raw triangle-winding volume oracle or geometry fallback.

Kernel topology counts are recorded without equating them to the oracle's material/void interior floods:

| Case | Oracle material / void interiors | OCC native solidCount | Manifold meshComponents | Volume |
| --- | --- | --- | --- | --- |
| Partial cavity fill | 1 / 1 | 1 | 2 | 892 |
| Island inside cavity | 2 / 1 | 2 | 3 | 792 |
| Filled compound | 2 / 0 | 2 | 2 | 2000 within floating-point drift |

No assertion treats a Manifold mesh component or a TopoDS partition as a universal physical-material identity. The earlier experimental SMLib6c99 run retains two forward partial-fill validity failures, while both current production kernels pass these bounded partial-fill cases. The SMLib receipt initially scored native volume/census/validity, not an independent bounds assertion; this is evidence about the listed controls, not full cross-kernel parity or a default-selection benchmark.

Six boundary-only face/edge/vertex touching intersections remain explicitly not-tested for physical boundary topology. Raw kernel outputs/refusals are preserved in the receipt; zero volumetric oracle volume does not force a fabricated empty result. The true disjoint/identical-subtraction volumetric-empty cases are scored, with null bounds and zero measured volume.

The test uses [unchanged production Workers](occ-manifold-browser.cjs) copied from R730 build `147814d8400de9d14d3718980f3e17b85241bcde`, `/mnt/data10tb/codi-diag-final-arc-redundancy-20261105-r1/.build/prism-assets`. No build or production source change was needed. Each case gets an off-main oracle/orchestration Worker and a fresh real kernel child Worker. The raw protocols require distinct operand tokens; for `A−A` the evaluator creates a second genuine identical box as the right operand. This preserves the expression's mathematical geometry without bypassing the protocol's same-handle guard or fabricating a native copy result.

All completed source handles are reread through actual `solid-mesh` requests and their exposed evidence matches the creation response. No display geometry is used as the independent oracle. Maximum native names created was six in either engine, below the ordinary eight-name limit. Fixed budgets: 48 cases per engine, eight created names per case, 10 seconds per case and 180 seconds across case processing. Runs are sequential with at most the orchestration Worker and its kernel child active for a case. All owned Workers, pages, context and ephemeral loopback servers close after the run.

Immutable pins:

| Engine | Production Worker SHA-256 | WASM SHA-256 |
| --- | --- | --- |
| OCC | `26c2191e2f952d2dfb62768aec971b847ed50165cd767987eb3ab1e4115052f5` | `07d763a05f35cd257501d339d9087df63c65bcaeb51a4f4f80832e333892e12e` |
| Manifold | `35876bd7cd773b5eb243fde935599afb670314c192ba77ec11036dcb12aa79e4` | `7bb5f8ee10fcafdab78799b1e5dd2cdc7c282ea0bf8e7939c43f3ad34b823e3d` |

Embedded glue identities, test-source SHA values and strict CSP are also recorded in the receipt. The server snapshots and verifies asset bytes before serving; the actual Worker verifies its WASM digest. No inline script, JavaScript eval or Blob Worker permission is used.

Replay after restoring each engine's `worker.js` and `kernel.wasm` below `CODI_ENGINE_BOX_ASSETS/occ` or `/manifold`:

```sh
PATH=/tmp/codi-files-move-node/bin:$PATH node test/native-box-oracle/bounds.test.mjs
PATH=/tmp/codi-files-move-node/bin:$PATH \
CODI_TEST_CDP=http://127.0.0.1:19329 \
CODI_ENGINE_BOX_ASSETS=/tmp/codi-occ-manifold-box-assets-20261105 \
CODI_RECEIPT=/tmp/occ-manifold-box-result.json \
node test/native-box-oracle/occ-manifold-browser.cjs
```

This qualifies the listed raw Worker/kernel paths on the bounded box corpus. It does not qualify registered-agent transport, app transaction/history/save/undo, manufacturing exports, arbitrary curved BReps, mixed-engine history or full operation parity. Recorded `nativeMs` excludes initialization and includes expression construction/native evidence in this harness; fresh Worker contexts still share the browser process and unspecified compiled-WASM caches. It is not a controlled cold/warm performance comparison or an engine-default decision.
