# Initial authored box selection origin

This tests-only investigation uses genuine Chromium box creation and actual owned native catalogs. It is not a product naming implementation. The prototype accepts only captured initial box-construction source and that construction's native result. Never apply it to a later fillet, Boolean, split, imported solid, or a shape that merely resembles a box.

## Recommendation

Initial axis-aligned boxes can receive source face roles `X_MIN`, `X_MAX`, `Y_MIN`, `Y_MAX`, `Z_MIN`, `Z_MAX`. Each edge is the unordered pair of its actual adjacent authored face roles. Keys contain the original authored box feature ID and role/pair; native indices and coordinates are absent. Capture source numbers once from the genuine constructor request, never from a later selection request.

Prototype feature ID501 is an explicit prospective test-side label, not a feature ID assigned by today's public history. The actual current API exposes no box selection plan; this tests a future initial binding over genuine constructor output.

The construction-only proof uses **exact equality**, with no nearest test or epsilon:

- Eight unique native vertices cover all binary64 `origin`/`origin+dimensions` corner tuples.
- Twelve unique nondegenerate analytic axis lines connect the corresponding corner pairs; actual line-interval endpoints must equal those corners.
- Six unique four-edge planar faces cover the corresponding four corners, with exact support planes and outward axis orientations.
- Every vertex has three edges and three faces; each edge has two distinct adjacent faces of the correct source roles. All native topology is covered, without seams, duplicate incidence, or unclaimed members.
- Native single-solid validity is required. Missing uniqueness, representation or coverage yields explicit unsupported/unresolved, never an approximate fallback.

Subsequent identity MUST follow real native same/modified/generated ancestry and unique membership. Never reclassify a descendant from coordinates or its bounding box. Unknown/Boolean/split results lacking qualified ancestry stay unavailable. The prototype's `responseLocalBindings` only audits this catalog; those indices are not authored IDs or save data.

Prefer plan-v2 with discriminated `sourceContext` and explicit `regionId:null` for a box. The prototype illustrates:

```js
{
  version: 2, featureId: currentProducerFeatureId, regionId: null,
  sourceContext: {kind: 'box', featureId: originalBoxFeatureId},
  scope: 'authored-source', source: 'box-construction-proof',
  edges: [{id, role: 'intersection', incidentFaceRoles: ['X_MIN','Z_MIN'], geometry: 'line'}],
  faces: [{id, role: 'X_MIN', geometry: 'plane'}], unresolved: []
}
```

Actual sketch-region context must carry its real originating feature/region identity. Preserve existing prism key grammar and saved intent exactly. Add an explicit common `solid.selections.read` verb, retaining or deliberately deprecating the prism-named alias. Today that old verb truthfully returns `NOT_A_PRISM_RESULT` for boxes. Context is ephemeral source metadata, not another document or a physical-material region assignment. Allow a future explicit local working frame/placement boundary; never silently recenter nominal geometry.

Bounded future ownership: new private/pure `boxSelectionIndex.mjs`; plan-v2 context and `incidentFaceRoles` support in `selectionAncestryIndex.mjs`; common read admission in the controller; Worker capture/cache/release of known box source and one-time initial index. A source capture must originate in genuine successful box creation, not arbitrary later catalogs. Current handle/producer binding remains mandatory. This observed initial path requires no native rebuild. No product edits are included here.

## Actual observations

Exact frozen b3d91 JS/28e8 WASM, unchanged 21-file component graph. Seven valid native boxes establish all eighteen unique initial keys. IDs are identical for the same originating feature across these different initial sources; native indices are not identity authority.

| Case | Source/native result | Initial identity |
|---|---|---|
| 100 x50 x20 at origin | Valid single solid | Exact unique coverage |
| 11 x17 x23 at (-13,7,2) | Valid single solid | Exact unique coverage |
| Dyadic fractional origin/size | Valid single solid | Exact unique coverage |
| Decimal fractional origin/size | Valid single solid | Exact unique coverage |
| Near-million origin, size100 x200 x0.125 | Valid single solid | Exact unique coverage |
| Size1e-6 x2e-6 x3e-6 at origin | Valid single solid | Exact unique coverage |
| Same tiny size at (1e6,1e6,1e6) | Valid single solid; dimensional drift | Exact binary64 coverage; no physical accuracy certificate |
| Size1e-9 x2e-9 x3e-9 | Controller admits; native `ENGINE_FAILURE` message `8042504` | Unproved, no catalog |
| Minimum-subnormal dimensions at1e6 | Source extents collapse; native generic failure | Explicit captured `SOURCE_EXTENTS_COLLAPSED`; no keys |
| Zero, negative, >1e6 dimension | `INVALID_REQUEST`, zero job posts | Invalid source, no keys |

## Open P0 diagnostics and measurement findings

Naming is separate from representability and measurable physical accuracy. The tiny-at-large-origin case has effective binary64 spans approximately `[1.00000761449337e-6,2.00001522898674e-6,3.00002284348011e-6]`. Native volume matches those spans, `6.000137061924313e-18`, versus requested product `6e-18` (relative drift about2.284e-5). The display signed integral is `-2.6667257770895962e-6`, a global-coordinate cancellation error. Use native volume/validity as correctness evidence; the display integral is not an exact measure. An identity proof does not waive dimensional accuracy, numerical-domain policy, or display precision requirements.

Both below-tolerance and collapsed-extent requests fail generically after one Worker post. Record these as open typed domain/kernel diagnostics, not algebraic contradiction or mathematical impossibility. No global epsilon, snapping, or silent recentering is proposed. Future local-working-frame handling must preserve explicit authored placement and measurable physical size.

Every constructor request remains exact; the captured origin/dimensions were copied before asynchronous execution. Each case owns its own fresh mount, which is closed afterward. No existing body was passed to these constructors, so this investigation does not claim prior-body preservation through generic failure, a last-valid document transaction, or save/reload recovery. Those require their own public-model tests.

## Reproduce

Use the exact frozen mechanical manifest, retained CSP server and `test/mechanical-profile-browser/pins.mjs` to bind a fresh loopback URL. The driver hashes every asset before its own Chromium context. No native catalog/result is fabricated.

```sh
CODI_COMPONENT_PINS=/path/to/pins.json CODI_TEST_CDP=http://127.0.0.1:PRIVATE_PORT PUPPETEER_CORE_PATH=/path/to/puppeteer-core CODI_RECEIPT=/tmp/box-origin.json node test/box-selection-origin/browser.cjs
node test/box-selection-origin/check.mjs /tmp/box-origin.json /tmp/box-origin-check.json
```

The small prototype allocates no geometry and is not another authored model. No UI, Files, filesystem-race/security, manufacturing, persistence, or general topology naming qualification is claimed.
