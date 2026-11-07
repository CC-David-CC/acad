# Native transform and mirror investigations

These probes exercise actual C++ kernels compiled to WASM, outside the UI and wrappers. No production provider, default or public deployment changed. Separate LAN-only native branches start at NVIDIA fork761974 (upstream3fd5b954 plus the scoped union correction). No new issue/PR/GitHub push has occurred.

| Case | NVIDIA baseline | OCCT7.6.0 standalone WASM |
| --- | --- | --- |
| Torus translated/rotated by4×4, scale tolerances enabled | All entity tolerances1e-5 →0 despite success | Positive1e-7 preserved |
| Torus uniform scale2 | All entity tolerances →0 | Positive tolerances double |
| Torus identity, placement-overload rotation, or4×4 rotation with tolerance scaling disabled | Tolerances preserved | Matching identity passes |
| Box mirror |12 lines →12 plain B-splines |12 lines remain |
| Cylinder mirror |1 line+2 circles →3 plain B-splines |1 line+2 circles remain |

NVIDIA `receipt.json` records all8 actual baseline runs, not just the first failure. `occ-run.log` contains7 successful OCCT cases with forced geometry copying, validity, volume and retained-input checks. The OCCT probe links the retained7.6.0 libraries used by the application's native build; this is not a public GUI or all-transform qualification. General affine/nonuniform transforms can legitimately change analytic geometry types.

NVIDIA candidate source:

- `research/issue-transform-tolerances-20261105`: de94404 +2eda4fa preserve/scale existing local tolerance by the largest absolute scale factor instead of a transformed-vertex box. Independent review found the first model-size setter still changed shared context indirectly; the correction updates only BRep-owned state. The stronger exact context-size and local-tolerance checks pass. Initial zone-only context proof was insufficient.
- `research/issue-mirror-analytics-20261105`: e72d56b +e1b5da6 carry exact line/ellipse/circle mirror overrides and a nonvirtual NURBS reflection helper. Virtual copies retain subtype/owned NURBS; notifications follow final analytic placement. Warm partial/inside-out circle/ellipse and oblique translated-plane samples pass. Missing notifications were a review concern, not a demonstrated baseline cache-corruption finding.
- `research/transform-mirror-20261105`: private combined qualification branch, not a production promotion. Both issue branches are backed up separately on example.invalid and R730. No GitHub update.

`initial-fixed-receipt.json` records the first candidate's8 cases, before the independent-review corrections. `extended.cpp` now checks oblique translated planes, partial/inside-out circles and ellipses with warm STEP/NURBS samples, exact parameter domains, mirror-twice recovery, native box/cylinder validity and volume, raised local tolerances, shrink/nonuniform/disabled scaling, and exact shared-context model size. Matching final reruns pass both independent issue libraries and the combined library; see final-selected-receipt.json. Modes mirror/tolerance execute only their respective controls, and extended executes both. The test source hash is included in every final row. Native CPU/full upstream suite and alternative tolerance/debug configurations are not claimed.

Reproduce the SMLib probes using Emscripten4.0.10 and Node24:

```sh
emcmake cmake -S test/nvidia-transform-mirror -B /path/to/disposable-build -DSMLIB_SOURCE_ROOT=/path/to/usd-brep
cmake --build /path/to/disposable-build -j4
node test/nvidia-transform-mirror/run.mjs /path/to/disposable-build/probe.mjs 0
node test/nvidia-transform-mirror/run.mjs /path/to/disposable-build/extended.mjs extended
# On the independent issue branches, use mirror or tolerance in place of extended.
```

Modes0–7: translation, rotation, scale2, placement rotation, tolerance-scaling-disabled rotation, identity, box mirror, cylinder mirror. Run each baseline mode in a fresh process. The CMake full-source reproduction recipe is provided, but a fresh full configure/build with this new wrapper has not been run; the equivalent existing native-build recipe and the focused compilation/link/run were executed. This investigation used retained source-matched archives with all affected objects rebuilt. The recipe avoids reliance on that cache when used on another machine. Current investigation used retained source-matched archives and rebuilt affected objects in a private R730 output directory; build outputs/dependencies remain outside Git. The SMLib source's SmBrep.cpp/SmBSplineCurve.cpp were unchanged from upstream3fd5b954 for the baseline.

Private raw build/run artifacts remain on R730 under `/mnt/data10tb/codi-usd-brep-clean-pr-validation-20261105` and `/mnt/data10tb/codi-usd-brep-transform-mirror-build-20261105`. Original baseline libs: smlib `ad629cc33093a45722763c2b15b77a3bb6e9422af64aa2c566e5444d49f84d60`, smapi `494d9bae7596532e978832c76f95c2ab4b19d9513586cc0ea1fd0215391c7bcf`. OCCT source846bea93aebfabb3e18c94672ed4c295ac1c1fa3 reports7.6.0; its transform implementation has no local source diff. Kernel defects, representation conversion, mesh quality and application integration remain separate findings.
