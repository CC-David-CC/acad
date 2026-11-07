# Native-census application qualification

Exact source `1fddd2d1ce89a216d011e304fafcbf284b066278`, privately built on R730 at `/mnt/data10tb/codi-diag-final-census-results-20261105-r1`. App SHA-256 `971e81c8e9a402931bcb8e26c89ba44cbb97aff31e841ee1a16e67e174153d18`; browser helper `7e06ff8e9608d0bc55938b7209c5aa57e0e56d2d5d214d3a8dea8317c7c457a8`. Strict-CSP loopback fixture20473/CDP19329, separate contexts. No deployment.

The lead independently passed:

- `output-history-browser.test.cjs` for OCC and direct SMLib: empty output reuse, upstream empty↔nonempty edits, rejected edit, shared undo/redo, native replay and disjoint/edge-touch unions. Earlier matched0bd source also passed all three engines; see RESULT-0BD.md.
- `test/smlib-integration/metrics-history-browser.test.cjs` for OCC: inspected500→700 mm³ edit versus independent triangle integration, bounds, shared travel and fresh replay. The lead independently repeated all three engines on0bd.
- `test/webos/basic-solid-worker-browser.test.cjs`: authored100×50 mm rectangle,20 mm extrusion, six faces,100000 mm³ mesh volume, invalid depth leaves history/IDs/geometry unchanged, asynchronous native snapshot and fresh replay. The test now awaits the actual asynchronous snapshot API; no product behavior was changed for that correction.

Logs are `/tmp/codi-root-census-{output-history-occ,output-history-smlib,metrics-occ,basic-profile-occ}.log`. All completed with exit0 and closed their contexts. This is real registered-core/browser/Worker evidence, distinct from signed desktop Files tests and arbitrary geometry qualification.

OCC now includes a bounded native topology census. Companion interpreter source `42b626445e11ffb62860c408b03ee935f6564738` is in `example.invalid:/srv/data/git/occt-interpreter-codi.git` and `r730:/mnt/data10tb/git/occt-interpreter-codi.git`, branch `research/occ-topology-census-20261105`. Its `shape-io/TOPOLOGY-CENSUS-V1.md` documents the source/link recipe. Native receipt is R730 `/mnt/data10tb/codi-occ-topology-census-build-20261105/receipt-final.json`; assets are also mirrored on example.invalid under `~/codi-artifacts/occ-topology-census-20261105/`.

Exact original JS `7dfb70d551333756d9936f7a7882d9f8f5482b921c7bee398e95ad03ef979641`, adapted glue `a84b31900e58e61a1d7e3f8d04978408455764ad149923359e7fba19d3d07884`, WASM `07d763a05f35cd257501d339d9087df63c65bcaeb51a4f4f80832e333892e12e`, static Worker `26c2191e2f952d2dfb62768aec971b847ed50165cd767987eb3ab1e4115052f5`. Manifold Worker `35876bd7cd773b5eb243fde935599afb670314c192ba77ec11036dcb12aa79e4`; direct SMLib Worker `5c17193baaabef79fb4cc6ad4e552e56e36bc9d07fd1b0ebf03ea392eac5f45f` and WASM `4d35fd5b3a37e500d79388523329d5e61560fcd80cb963b2824533d6cf0f8f21`.

An OCC empty output requires a non-null empty compound, zero direct children and zero solid/compsolid/shell/face/wire/edge/vertex counts. The new native export separately distinguishes vertices, edges, wires, nested empty compounds and mixed topology; `InspectAnalyticV1` is unchanged. This prevents a no-faces heuristic from declaring arbitrary lower-dimensional topology empty. These tests do not qualify general surface/wire modeling or manufacturing exports.

Reproduce the build with `test/physical-parameters/r730-final-private-build.sh` and its exact native inputs. The earlier third-party SMLib provider is no longer the selected experimental catalog entry; saved engine revisions are explicit and old revisions refuse rather than silently replaying with a new kernel. OCC remains default. No general CAD1 completion, backend equivalence or physical accuracy claim follows.
