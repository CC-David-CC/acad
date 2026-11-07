# Revolve through the shared owned Worker

Product checkpoint `2c444c8bf657a589355abc961a7e464e28b8c004` is based on
`fe5f882b4`. It adds one optional revolve operation to the existing controller
and `oci-verified-worker.js`, using the genuine native export qualified at
native `ff239fc0` / evidence `60877dac`. No second Worker, temporary prism,
alternate geometry algorithm, Craft/history/ledger edit, public command,
registered catalog change, default promotion, or deployment is included.

The component constructor is `createRevolveProfileOccMount` in
`modules/engine/mount/occ-revolve-profile-mount.mjs`. It advertises
`solid.profile.revolve` version1, and retains the existing V3 profile, native
Boolean history, edge-treatment, through-hole, and linear-pattern operations.
The old constructors retain their old flags and exact native hashes. The new
Boolean-history runtime admission permits only this explicit new pinned pair
when the revolve flag is enabled; it does not admit arbitrary new builds.

The exact depth-free request is:

```js
{
  op: 'solid.profile.revolve', version: 1, unit: 'millimeter',
  source: {faceId, sourceSha256},
  frame: {origin, x, y, z},
  region: {id, outer, holes},
  axis: {kind: 'source-segment', id, a: [u0, v0], b: [u1, v1]},
  angleRadians
}
```

`outer` and `holes` use the existing bounded V3 selected-region curves and
identities. The source-local axis can be a construction segment outside the
selected boundary. The Worker derives its world origin/direction through the
same captured orthonormal frame, with no projection or geometry clamp. Native
validation still checks the axis and signed angle. New depth-free helpers live
in the existing planner modules; V3 extrusion calls the same extracted face
preparation and preserves its existing depth/volume/bounds logic. V2 behavior
and module dependencies remain unchanged.

`ownedRevolveIntent.mjs` captures an immutable, detached **component request**,
not saved authored history. Its source hash and IDs do not independently prove
that a caller supplied real solved sketch geometry. The later shared feature
operation must establish that from genuine solved source and an actual source
axis. The descriptor explicitly says `requires-solved-source-binding`.
The controller and Worker independently hash the canonical complete captured
request. The small reply binding includes that digest plus source, region,
axis ID, units, and signed angle. This binds returned metadata to the exact
input without copying a large profile back. It does not certify geometry by
hash or establish persistent topology.

Results use the existing owned handle and generic native/display evidence.
Native volume, native bounds, validity, and the exact oriented display integral
remain separate. Revolve supplies no fake prism construction provenance or
authored selection keys: selection reads return explicit unavailable
`NO_AUTHORED_SOURCE_SELECTIONS`.

## Actual qualification

`evidence-r1/summary.json` records the scoped results:

- Actual Chromium classic Workers, strict CSP without `unsafe-eval`: 12 real
  revolve cases and 29 native material/void/boundary point classifications.
  Concave stepped profiles, full/partial/reverse angle, circular and annular
  torus, oblique frame, cone pole, and changed source/axis/angle all pass
  independent analytic native volume and bounds checks. Display arrays are
  finite and oriented; they do not establish native correctness.
- Six domain/resource refusals, extra-field refusal, unchanged caller source,
  immediate caller mutation during asynchronous digest preparation, exact
  retained native/mesh observations, disposal and stale handles pass.
  The axis is source-local by construction; off-plane raw native axis controls
  remain in the earlier native probe, rather than faking an off-plane component
  request here.
- 32 real results followed by a no-post 33rd refusal pass. A separate actual
  aggregate-triangle run accepts17 annular-torus outputs, charging95,756
  triangles including a retained box, then refuses the next output. Native
  refusal cleanup preserves the retained box exactly, and a smaller valid
  revolve still succeeds within remaining capacity. This is the existing
  bounded work/transfer policy, not a WASM-used-memory or RSS guarantee.
- A genuine successful native Worker result is held at delivery, the request
  is aborted, and delivery released afterward. The controller returns
  `CANCELLED`, terminates its candidate Worker, and refuses reuse as closed.
  No successful geometry reply is manufactured. This is not mid-OCCT abort or
  whole-application last-valid-model qualification.
- On the new native build, all four prior source-bound hole/pattern chains and
  eight original controls pass, including disposed seed geometry, source and
  seed dimension variants, oblique source, native point classifications,
  retained selections, input snapshots, and cleanup. Both five-cut Boolean
  chains plus edge treatments, empty/multi-solid/continuation controls also
  pass their original mathematical oracles.
- The old `dd666902` / `8d5e537e` constructor is separately staged and executed
  with the new common source. Its unchanged29-file module graph contains no
  new revolve imports. One complete source-bound hole/pattern chain plus all
  eight controls and one five-cut Boolean/edge chain plus all Boolean controls
  pass. It advertises no revolve and refuses it as `UNSUPPORTED_OPERATION`.
- 15 retained planner/NodeWorker tests, seven new actual NodeWorker groups,
  12 explicitly doubled protocol tests, and TypeScript pass. Protocol tests
  replay a recorded genuine evidence payload only to test malformed
  digest/source/axis/angle/envelope/measurement refusal before handle
  publication; they are not fresh geometry tests.

The first browser harness run used Fetch's `ok` property as a method and
failed before launching a browser. Its source, log, and failed receipt remain.
The single property correction changes no CAD assertion. BrowserR2 passes the
original corpus; R3 separately adds actual aggregate-budget controls without
retagging R2. The retained component drivers are copied only to change the
constructor import alias; their source/adapted hashes and exact one-change
mapping are in `retained-source-map.json`. Their existing independent oracles
remain unchanged. The old-build run uses the original unmodified drivers.

## Pins, staging, and remaining integration

The new immutable component is `/tmp/codi-owned-revolve-component-20261106-r1`:

- common bootstrap `182b57fbeb2e621412bc6c0a8fae7499ee6f7f1d2fc0d88e3c08e19e7932cbd3`
- static Worker `ee26ebfa5a86d10f2854037a31ac96493f3bf7bfaccb49965625b25f435ac3b1`
- portable JS `567419c13c78fff46cbc9cd07e5a993106b652a13cb9f6944831f68ef48729cc`
- WASM `ad9475c81ea2eecadd41c73f0b0860d7d06c53e4292b16047472f03995f3efdd`

`component.json` pins all31 staged assets/modules. A second fresh default
staging plus the new `revolve-profile-assets-entry.cjs` verifies exactly the
same file/source maps. The shared stager is reused without changes. The old
stager still produces29 files and excludes the optional new imports.

The root-owned legacy embedded builder intentionally still expects bootstrap
`e8c29f8b3313fd1cf87aae058b80d46701d85e78f4234a77b0b9af33313ea08f`.
Its hash admission will refuse this new common source until root reviews and
updates that one pin. This lane does not claim that old embedded pipeline has
been regenerated. Root also retains catalog/catalogMount, shared model and
history integration, and public command registration. E13 edits, Undo/Redo,
native save/reopen and public application acceptance remain unqualified.

Reproduce with Node24 and the actual qualified native input directory:

```sh
node build/prepare-revolve-profile-assets.cjs "$NATIVE_INPUT" "$NEW_STATIC_ROOT"
# Add a minimal index.html; run the owned strict-CSP loopback server.
python3 -B test/owned-revolve-worker/serve.py "$NEW_STATIC_ROOT" "$PORT"
PUPPETEER_CORE_PATH="$PUPPETEER_24_35" node test/owned-revolve-worker/browser.cjs \
  "$NEW_STATIC_ROOT" "http://127.0.0.1:$PORT/" "$NEW_RECEIPT"
node --test test/owned-revolve-worker/unit.test.mjs \
  test/owned-revolve-worker/protocol.test.mjs
```

`browser.cjs` verifies the entire staged closure before launching its own
Chromium. The test servers are stopped after use; the shared19329 browser is
never connected to, restarted, or closed. Raw observed display coordinates
remain outside Git with whole-receipt hashes/paths in `raw-receipts.json`.
Committed receipts replace those display arrays with counts and hashes only
after the original full-array oracles pass. Native measurements, point
classifications, topology catalogs, ancestry plans, and assertions remain in
the committed receipts. No binary, account, credential, or private state is
included.
