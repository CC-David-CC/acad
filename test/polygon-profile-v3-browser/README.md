# Independent V3 Chromium Worker corpus

Only this new test directory belongs to this lane. Product source, catalog,
controller and native build remain owner-controlled. Inputs are explicit
component profile fixtures, **not** solved sketches or public authored designs.
The frozen R1 run establishes only the component scope described below.

The component driver invokes the actual
`createPolygonProfileOccMount(options)` and its V3 execute/topology/classify
verbs. Exact source-pinned assets are required; neither the older V2 build nor
the earlier Node-only native experiment is relabeled as this result.

## Actual R1 result

First actual Chromium run: **PASS**, Chrome155.0.8059.79, Node24.22.1 and
Puppeteer24.35.0. No failed assertion was changed to obtain this result.
`browser-r1-receipt.json` records all19 frozen asset hashes verified before
creating the browser context, exact test source hashes, eight native shape/
ancestry results,29 inside/outside/boundary observations and lifecycle controls.
Source was frozen as the staged module graph while the owner's product
checkpoint was pending; the pins state this rather than claiming the older
test-branch base contained the new product.

| Input | Analytic native volume mm³ | Authored polygon connectors | Native circle seams |
|---|---:|---:|---:|
| Triangle | 500 | 3 | 0 |
| Reversed triangle | 500 | 3 | 0 |
| Rotated rectangle | 1400 | 4 | 0 |
| Concave L | 2500 | 6 | 0 |
| Mixed holes | (1750−9π)×7 | 9 | 1 |
| Mixed holes, permuted frame | (1750−9π)×7 | 9 | 1 |
| Annulus | 637π | 0 | 2 |
| Triangle, true45° angled frame | 500 | 3 | 0 |

All cap/sweep/connector positions, circle dimensions, wire incidence and local
catalog counts/unique ancestry pass. Reversed-triangle slots bind correctly
back to captured curve IDs/directions. Un-authored circle seams stay separate.
Five input refusals preserve caller JSON and exact previous topology/display;
cross-mount observation refuses INVALID_HANDLE without changing the owning
result. A genuinely successful native reply was held, cancelled and then
delivered: the caller receives CANCELLED and later operations MOUNT_CLOSED.
All12 owned Workers terminated, zero owned Worker targets remained, and no CSP
violation occurred. The owned context and loopback server were closed; shared
Chrome remains alive.

Diagnostic precedence is retained: the duplicate consecutive vertex at index1
returns SELF_TOUCHING_BOUNDARY because an earlier edge-pair check detects that
contact before the zero-length edge iteration. This proves refusal/preservation,
**not** exact ZERO_LENGTH_EDGE diagnosis for every position. The other observed
codes are SELF_INTERSECTION, UNSUPPORTED_REGION_TOPOLOGY, INVALID_REQUEST and
INVALID_FRAME.

R1 bootstrap SHA9a73eaabe5f8590d9ea8f48166d32b735cec65e51a1eb6c9961621712467b50a;
native JS5414a24c96eff09b77f7d3fe758287c9696e63127c91e73011f6f2939de2a8eb;
WASM534ffdd2d88632a7878d654742f2df72c16691f3c814085e4f525efc74961e19.
`component-r1-manifest.json` and `component-r1-pins.json` preserve the complete
module closure. Per-case init times218.6–242.3ms and operation times169–398.2ms
are one run, not a benchmark, used-memory measurement or latency guarantee.

## R2 diagnostic correction and unchanged controls

The owner added a complete zero-edge prepass. The frozen R2 closure differs
from R1 in exactly one component file, `simplePolygon.mjs`, now SHA
`4a022a7dd18073804ca2042a65692e2ddad2ba7a9f31355bc3652e5fdfc196df`.
Native JS, WASM, Worker, controller and all other component files are exact R1
bytes. R2's manifest and pins preserve this independently checked delta.

With owner authorization, the unchanged original full eight-case driver ran
again on R2 and **passed**:29 classifications, complete ancestry/source binding,
five refusals preserving the accepted result, foreign-handle refusal and held
native-result cancellation;12 Workers terminated, zero owned targets, no CSP
violations. `check-r2.mjs` additionally verifies the R1/R2 test-source hashes
are identical and explicitly asserts that the affected refusal changed from
SELF_TOUCHING_BOUNDARY to **ZERO_LENGTH_EDGE**, preserving caller source and
the prior exact topology/display. Original R1 evidence remains unchanged.

```sh
node test/polygon-profile-v3-browser/check-r2.mjs
```

`browser-r2-receipt.json` is a new source-matched component run, not a relabel
of R1 or of a public application. No identity stability is assumed between
native catalogs from different responses. R2's owned context/server were also
closed while shared Chrome remained alive; see `cleanup-r2.json`.

Controls exercised:

- Eight analytic cases: triangle and reversed traversal, rotated rectangle, concave L, concave mixed
  circle/polygon holes, that mixed profile in a permuted frame, annulus and a
  genuinely angled 45° triangle.
- Reversed traversal must bind native normalized slots back to the original
  captured curve IDs/directions and actual incident vertex relationships.
  The oracle reads `constructionProvenance.sourceBinding` scoped to the
  captured region, reconstructs normalized geometry from those exact curve
  IDs/directions and then checks native topology against that geometry. It
  does not assume a native slot number is an original curve number.
- Exact native volume/bounds/validity and independent inside/outside/boundary
  points. Display triangles are measured independently; circles remain an
  explicitly approximate display check rather than manufacturing accuracy.
- Response-local catalog indices only. Every source edge maps to two cap
  edges and one swept face; each actual polygon vertex maps to two cap
  vertices and its connector. Geometry, cap/side wire incidence, counts and
  uniqueness are checked. Circle seams are accounted for as native seams,
  without inventing authored vertices or persistent topology identities.
- Invalid crossing/zero edge/outside hole/depth/frame requests refuse and
  preserve an earlier result's topology/display bytes and the caller input.
- Result disposal/stale handle, Worker closure, actual CSP violations and an
  actual successful native result held until cancellation.

No account, Files, filesystem race/security test, public sketch writer,
history/save/reopen or default promotion is part of this component lane.

```sh
node test/polygon-profile-v3-browser/fixture-check.mjs
CODI_COMPONENT_PINS=/tmp/final-component-pins.json \
CODI_TEST_CDP=http://127.0.0.1:19329/ \
PUPPETEER_CORE_PATH=/absolute/qualified/puppeteer-core \
CODI_RECEIPT=/tmp/v3-component-receipt.json \
node test/polygon-profile-v3-browser/browser.cjs
```

The required pins file contains the final `baseURL`, `pagePath`,
`constructorPath`, `mountOptions`, exact asset path→`{sha256,bytes}` map and
source/build provenance. Asset hashes are streamed and verified before a
browser context is created. The driver uses its own context and disconnects;
it never closes or restarts the shared Chrome instance.

Recreate the read-only fixture with `serve.py --root` against the owner's
reproduced frozen component tree, then set pins.baseURL to its printed loopback
port. It exposes only the manifest closure plus a synthetic index, with self
scripts/Workers and WASM allowed but no general unsafe-eval. It does not mutate
the frozen tree or host configuration. Public solved-source authoring, shared
history/save/reopen, manufacturing, default adoption and full Gate1 acceptance
remain unqualified by this run.
