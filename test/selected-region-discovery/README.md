# Worker-side selected-region support discovery — scoped PASS

Product source `cda4558ca` adds `inspectSolvedSelectedRegions` beside existing
`prepareSolvedSelectedRegion`. Source capture, frame/digest validation, exact
loop/region extraction and final native request planning are shared. Existing
preparation checks, qualified geometry and failure semantics remain unchanged.
No solver, document/history writer, native CAD allocation or public UI is added.

| Evidence | Result |
|---|---|
| Existing pure source preparation controls |7/7 PASS unchanged |
| Independent existing adversarial source review |17/17 PASS unchanged, including 64 traversal permutations |
| New discovery controls |11/11 PASS |
| Actual Chromium module Workers |9/9 PASS, one actual digest for admitted sources, frozen result inside Worker, unchanged source, explicit Worker termination |

These are explicit native-v3 geometry fixtures with empty or deliberately
unadmitted constraint data. They are **not** proof of successful sketch solve,
constraint admission, public authoring, native solid construction, signed
persistence or the whole CAD1 gate. Root-owned semantic/public wiring must bind
the exact source to genuine successful/current sketch-Worker results and retain
ownership through publication. The new helper makes no solver-status claim.

## Contract

```js
inspectSolvedSelectedRegions({
  unit, engine, revision, sketchDigest, faceId, frame, depth, sketchJSON
}) // Promise<{ binding, regions }>
```

Only the currently qualified OCC millimeter path is accepted. `binding` is
`{revision, sketchDigest, faceId}`. Each region is data-only:
`{regionId, support: 'supported' | 'unsupported', reason: null | {code,message}}`.
The complete returned tree is detached and frozen before transport. Structured
clone does not itself preserve freeze attributes in a receiving realm; a later
public adapter must apply its own validated capture/freeze policy.

Source UTF-8 encoding/digest and geometry extraction run once, then each region
uses the **same** final request planner as execution. Supported rows have no
reason. Qualified-ID, hole-count, selected-curve-count and region-identity caps
produce an unsupported row without dropping other discovered rows. Every new
pure row is cross-checked against actual execution preparation, including exact
refusal code/message. Independent analytic geometry/expected memberships remain
the separate positive oracle, rather than relying on that agreement alone.

Global input/frame/digest/source failures retain explicit refusals. An Arc,
gap, crossing/touching layout, unqualified loop or unresolved topology has no
invented region IDs; existing global codes remain unchanged. In particular,
full native Arc is not silently rewritten to Circle. No proximity welding,
normalization, alternate topology algorithm or native fallback was introduced.

## Identity/resource boundaries

The existing common global curve-ID limit is still 256 characters **after**
`faceId + '/' + objectId`. An unselected loop exceeding that limit prevents
the entire source preparation/discovery; another row is not falsely promised
executable. This existing limitation is distinct from mathematical geometry
invalidity. A future reversible identity/localization change is separate work;
never truncate IDs, split them heuristically or silently discard a boundary.

Unsupported region IDs may exceed 8192 characters. They remain complete opaque
identities so unsupported outer rows do not hide valid children. Supported IDs
obey the existing 8192-character execution cap. A transport/public API can apply
its own explicit total-response resource cap and report that cap honestly;
it must not invent an empty result, invalid geometry or truncated identity.

Current pure source bounds remain 1MiB UTF-8, 4096 objects, 512 ordinary segments,
128 contours and existing coordinate/depth/frame/native-planner caps. No
unbounded topology or latency guarantee is claimed. Discovery's extra work is
bounded per-region preparation after one shared extraction. It adds no global
cache retaining source or validity facts across regeneration.

## Test coverage and retained failure

New controls cover disjoint rectangles, three nested circles, mixed islands,
nine-hole outer refusal with all child disks available, selected-curve/long-ID
caps, regeneration and canonical membership, one genuine SHA suspension with
caller mutation, UTF-8 exact limits, escaped/multibyte IDs, accessors/sparse
frames, explicit global source/topology refusals and 128 qualified loops.

The first new gap test used `structuredClone` on a fixture with shared JS point
references. Moving one endpoint also moved its neighbor, yielding a closed
skewed contour rather than a gap. Its original failure is retained in
`evidence/discovery-before-gap-fixture-fix.log`. The fixture was changed to a
JSON-native independent-record copy; the expected exact-gap refusal and product
code were not changed or relaxed.

The Chromium harness runs the real module in dedicated module Workers. The
native fixture creation, JSON hashing and discovery are inside those Workers;
the page only dispatches case labels and receives bounded results. It records
served source hashes, Worker realm, real digest count and frozen output inside
the Worker. No native WASM resource is loaded. This is an explicit Worker
protocol harness, not a fake CAD canvas or an application integration claim.

## Reproduction and custody

R730 source: `/mnt/data10tb/codi-selected-region-discovery-20261106`.
Evidence: `/mnt/data10tb/codi-selected-region-discovery-evidence-20261106`.
Actual private loopback Worker fixture: `http://127.0.0.1:20649/`.
Use retained Node `/mnt/data10tb/codi-3mf-qualification-SrUmue/node/bin/node`:

```sh
node --test test/selected-profile-kernel/source-region.test.mjs
CODI_SELECTED_PROFILE_CANDIDATE="$PWD/modules/engine/extrusion/selectedSketchProfile.mjs" node --test test/selected-profile-source-review/adversarial.test.mjs
node --test test/selected-region-discovery/discovery.test.mjs
python3 -B test/selected-region-discovery/serve.py --root . --port 20649
```

The server binds loopback and exposes only the exact fixture/source files.
Run `browser.cjs` with private `JSKETCHER_TEST_URL`, `CODI_TEST_CDP`,
`CODI_SOURCE`, optional `PUPPETEER_CORE_PATH` and `CODI_RECEIPT`. Only the owned
browser context is closed; shared CDP is disconnected, never terminated.
`pins.json`, the Worker receipt and raw logs bind source/tests/results.
No account/key data, dependencies, binaries, source package or public deployment
is included. Source and evidence are separate commits backed on both LANs.
