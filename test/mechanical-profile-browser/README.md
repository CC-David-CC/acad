# Mechanical-profile Chromium component corpus

The actual fresh Chromium component corpus passed on the frozen graph recorded in `evidence-r1/`. The product mount, controller, Worker, and ancestry module are owned by the parent/other lane and are not changed by this directory. The graph was supplied with root's explicit uncommitted-source freeze: its exact module hashes are authoritative for this observation; no complete git-source-match claim is made.

This runs the real `createMechanicalProfileOccMount`, real Worker, and pinned main OCCT WASM. Explicit solved V3 profile requests carry stable source IDs. These are component fixtures, not public sketch authoring, saved native documents, or a second editable model. Selection IDs come exclusively from `solid.prism.selections.read`; the tests do not substitute native catalogs or ancestry JSON.

The principal chain is rectangle 100 x 50 x 20, two opposite vertical connector fillets R3, then the other two connector chamfers of equal distance 1. Independent expected native volumes are `W*H*D - 2*D*R^2*(1-pi/4)` and that quantity minus `D`. Actual material/void/boundary classifications, bounds, cylindrical radii/locations and planar faces supplement volume. The initial real source binding and prism ancestry are independently checked against native catalog coordinates by the retained polygon oracle. Surviving connector identities, generated blend-face attribution, and explicit unresolved treated edges are checked without treating kernel deletion reports as identity authority. Input catalog, selection and actual mesh coordinates must remain exact through downstream operations.

The same chain is regenerated independently at 150 x 30 x 12 using the same captured source IDs and component feature IDs; this checks reproducible component identity construction, not document recomputation, undo, save, or replay.

Scoped controls cover excessive size, duplicate/unknown selections, producer mismatch, stale/foreign handle, actual circle-edge refusal, actual split-collinear tangent-contour expansion refusal, a held genuine successful treatment reply cancelled before delivery, and 32 lifetime native results followed by a pre-submission limit refusal. The budget control disposes each intermediate result but does not claim an OS-memory bound or exhaust the separate 100,000-triangle policy. Disposal acknowledgements and Worker termination are checked; Chrome remains running.

## Run after the parent freezes assets

Use a fresh R730 output directory and the root-approved `component.json` SHA, never silently relabel a previous runtime. The frozen graph must include constructor/controller static imports, Worker bootstrap and its dynamic topology/prism/ancestry modules, all of their imports, and exact b3d91 JS/28e8 WASM. The retained `test/polygon-profile-v3-browser/serve.py` serves only manifest-declared files with CSP, plus its inert component page.

```sh
node test/mechanical-profile-browser/pins.mjs /path/to/frozen/component.json REVIEWED_SHA http://127.0.0.1:PORT/ /tmp/mechanical-pins.json
CODI_COMPONENT_PINS=/tmp/mechanical-pins.json CODI_TEST_CDP=http://127.0.0.1:19329 PUPPETEER_CORE_PATH=/path/to/puppeteer-core CODI_RECEIPT=/tmp/mechanical-receipt.json node test/mechanical-profile-browser/browser.cjs
```

The driver streams and verifies every staged asset hash/size before creating its own browser context. It records Chromium, test source hashes, exact runtime/module pins, actual requests/results/catalogs, input snapshots and transparent Worker post counts. It uses no fake DOM or native success output. Only the one cancellation control intercepts a reply, holding the unchanged genuine successful event and delivering it after cancellation. No Files, filesystem-race/security, deployment, UI, history, or manufacturing export coverage is implied.

## Actual R1 result

Source `75366b86e` ran with frozen component manifest `8d20bdc2381b8afbcde7ebcf4913cfbdce209ef21a99b21a4fd4bce000e2fff1`, embedded Worker `cc5434dc3267ce8bc6cb565bbae98b51af2ba8daa78cbef60ab07a1cdb4a3270`, bootstrap `75f08f14dd907084f86c4b0f8b4fe0d7a404ab978266e7bb0be315fa42907133`, exact b3d91 JS/28e8 WASM. Twenty manifest-declared assets were streamed/verified, plus the separately pinned component manifest. Chrome 155.0.8059.79 ran in a new private process on 19430; shared 19329 was untouched. Its own context closed/disconnected; all nine created Workers terminated and no fixture Worker target remained. CSP produced zero violations.

| Component case | Actual result | Preservation / independent evidence |
|---|---|---|
| 100 x 50 x 20 chain | PASS; final volume 99902.74333882309 | Source IDs, 13 native point checks, analytic cylinder/plane checks, true source ancestry, original and fillet inputs exact |
| 150 x 30 x 12 regenerated chain | PASS; final volume 53941.64600329385 | Same discovered source-derived edge IDs where valid, 13 native points, analytic geometry, exact inputs |
| Excessive radius | `EDGE_TREATMENT_FAILED` | Source remains exact and mount usable; numerical/kernel failure is not infeasibility proof |
| Duplicate selection | `INVALID_REQUEST`, zero Worker posts | Exact source and request preserved |
| Unknown edge identity | `UNRESOLVED_SELECTION` | Exact source preserved |
| Wrong producing feature | `INVALID_SELECTION_BINDING` | Exact source preserved |
| Disposed stale handle | `INVALID_HANDLE`, zero posts | No new job |
| Other mount's handle | `INVALID_HANDLE`, zero posts | The target mount's own model remains exact |
| Actual circle edge | `EDGE_TREATMENT_UNSUPPORTED` | Genuine circle input remains exact |
| Actual split-collinear contour | `EDGE_TREATMENT_UNSUPPORTED` | Genuine native tangent propagation refuses extra edges and preserves input |
| Held genuine successful treatment | `CANCELLED` | Positive native volume captured before hold, late unchanged event inert, retry `MOUNT_CLOSED` |
| Lifetime resource budget | 32 real results accepted; next `RESOURCE_LIMIT`, zero posts | Result disposal does not reset lifetime allowance; existing source remains inspectable and exact |

The full raw receipt includes actual catalogs, all native results, source bindings, discovered plans, before/after input snapshots, classification requests/results and transparent Worker dispatch counts. `summary.json` and `pins.json` provide compact pointers. The principal geometry oracle runs in Node independently of the browser operations and checks native analytic measurements rather than treating display meshes as exact curved geometry.

This establishes the selected Worker component path. It does not establish document-level downstream recomputation, native persistence, public command registration, or complete Gate1/E11 acceptance. The independent regenerated component uses new mounts and explicit requests; it is not an edit of a persisted feature tree. No B-rep index is saved as an authored identity.

## R2 retained V3 corpus on the new runtime

`retained-v3.cjs` is an exact test-only retarget of the existing polygon V3 browser driver. `retarget-check.mjs` proves the only changes are the constructor name, relative import/source-hash paths and receipt label; all mathematical, ancestry, mesh and refusal assertions remain unchanged. Its cases and independent oracle are imported directly from the retained directory, without editing those files.

The same frozen 21-file R1 mechanical component passed all eight original cases: triangle, reversed triangle, rotated rectangle, concave L, mixed polygon/circle holes, axis-permuted mixed holes, annulus and 45-degree frame triangle. All 29 native point classifications, source binding/ancestry checks, native validity/volume/bounds and independent display mesh checks passed. The retained five invalid requests preserve source topology/mesh; foreign-handle preservation and a held genuine positive extrusion cancelled before delivery also passed. All 12 Workers terminated and no owned Worker target remained.

Exact observations, unchanged component pins and source-transform proof are under `evidence-r2-retained-v3/`; the original R1 treatment evidence was not changed. The full receipt hash is `bcf8475ac19c6db1a28741a6eadaa7190a0e0d1d7a2f338cb81618879f122b65`. No new native build or product edit was needed.

```sh
node test/mechanical-profile-browser/retarget-check.mjs /tmp/retarget-source-check.json
CODI_COMPONENT_PINS=/path/to/same-pins.json CODI_TEST_CDP=http://127.0.0.1:PRIVATE_CHROME_PORT PUPPETEER_CORE_PATH=/path/to/puppeteer-core CODI_RECEIPT=/tmp/retained-v3.json node test/mechanical-profile-browser/retained-v3.cjs
```

After both component runs, only the private Chrome19430 and server32885 were closed and their generated browser profile removed. Shared Chrome19329 remained running. `cleanup.json` records this ordinary fixture cleanup. The frozen native/component assets remain available for reproduction; no public service/default was selected by this lane.

## Committed source mapping and retained code assets

The original run honestly captured an uncommitted frozen product graph. A later
independent `git show` comparison now maps every captured module and bootstrap
byte to product commit `f5103e959`; see `product-source-mapping.json`. This does
not retag the original run or qualify the app/history hooks added afterward.
Native source/evidence is on the LAN `occt-interpreter-codi.git` branch
`feature/cad-gate1-kernel-20261106`, including main-export proof `07098de9`.
The frozen component's20 declared code assets are hash-verified on both LANs at
`example.invalid:/srv/data/codi-cad-mechanical-component-20261106-r1` and
`r730:/mnt/data10tb/codi-cad-component-assets-20261106/codi-mechanical-profile-component-20261106-r1`.
They contain no account state, dependency tree or user file data and remain
outside Git. Root's app factory build `5e9bbd219` succeeds separately on R730;
its nine emitted mechanical assets match the frozen component hashes. Shared
app creation/edit/history/Save/Open is still the next qualification boundary.
