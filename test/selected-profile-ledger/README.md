# Owned selected-profile solid ledger

Product/test checkpoint: `57d125116`. Base:
`e67f2ea2acf8c76b56dd9c7f72095c3858cc980d`.

Scope: extend the existing generic native solid ledger for one already-prepared
selected region per feature. No public Craft registration, runtime catalog
default, source solving, native save format, history editing, face provenance or
manufacturing export is added by this lane. Existing box/Boolean behavior and
generic `MWorkerSolid` projection contract remain shared.

## Integration contract

`captureSolidProfile(input)` admits exactly this detached ephemeral envelope:

```js
{
  version: 1,
  unit: 'millimeter',
  engine: 'occ',
  engineRevision: 'sha256:<64 lowercase JS hex>:<64 lowercase WASM hex>',
  featureId: positiveSafeInteger,
  profile: capturedCommonSelectedProfileRequest // solid.profile.extrude v2
}
```

It captures through the common selected-profile data contract and freezes the
detached nested request. It does not solve constraints or independently bind the
profile to authored sketch bytes. The caller must prove genuine current Worker
source/region preparation and maintain its own document currentness. This
envelope's full solved geometry is evaluation-private, not saved authored intent.

Call `evaluateWorkerSolid({...existingOptions, kind:'profile', request})`.
`createMount(engine, engineRevision)` and
`validateMount(engine, mount, engineRevision)` receive the exact revision as an
additional argument. Existing JavaScript callbacks may ignore it, but the new
runtime-selecting factory must select the requested checked build. The ledger
still verifies descriptor JS/WASM pins before executing a native job.

One owner ledger accepts one engine **and one exact engine revision**. A later
request for another revision of the same engine refuses with
`ENGINE_REVISION_MISMATCH` before factory/native execution and preserves that
candidate's already-valid outputs. A first request whose persisted build differs
from the created mount also refuses before native execution and closes its failed
owner. No per-feature fallback or implicit conversion is added.

The profile dispatch is the common `solid.profile.extrude` request version 2;
the returned generic solid/mesh envelope is version 1. The result must be one
valid native solid with native volume/bounds present. Empty, multi-solid,
unclassified, native-invalid and malformed results refuse before model
projection. The returned `consumed` list is empty. The caller retains the source
plane; the ledger never mutates source/registry itself. Native handles remain
private in the existing owner ledger and can subsequently participate in a
same-runtime Boolean operation through the existing ownership checks.

The same generic model projection remains responsible for render-buffer custody.
It exposes no generated face/edge/vertex provenance. A valid selected-profile
solid does not acquire rectangle LID/side identities or downstream hole support.

## Native observations remain distinct

`captureSolidMetrics` retains the old OCC `reportedVolume`, `volumeKind`,
`volumeQuality`, `bounds` and `boundsKind` exactly as tessellation observations.
New fields are:

| Field | Meaning |
|---|---|
| `nativeVolume` | Validated provider-native volume in the existing cubic-millimeter unit; `null` if absent. |
| `nativeBounds` | Detached/frozen provider-native bounds in the existing millimeter/model-local space; `null` if absent. |
| `nativeMeasurementQuality` | `provider-native-unqualified` for an admitted pair, otherwise `null`. This does not assert numerical accuracy. |

The pair must be own enumerable data, OCC-only, finite, correctly ordered, dense
three-coordinate bounds. Nonempty native volume must be positive. A genuinely
empty native pair is zero volume/null bounds; profile operations still reject
empty output. Missing fields from old providers remain null; mesh values are
never substituted. The model is identity-placed by its caller when its geometry
already contains the source frame, so that frame must not be applied twice.

## Evidence and limits

- **12/12 protocol controls** use the actual production ledger/resource owner
  with a controlled test mount and test projection. They test strict capture,
  detached suspension, revision ownership, source retention, same-runtime
  Boolean handle ownership, malformed/empty/native-invalid refusal, cancellation,
  currentness and native measurement admission. They are not native math proofs.
- **14/14 unchanged existing pure controls** cover box/Boolean/measurement and
  empty/container behavior. Combined local total: **26/26**.
- R730 runs the same 26 plus the unchanged actual `MWorkerSolid`/`MWorkerEmpty`
  source-model/ledger/inspection control: **27/27**. That last test uses controlled
  provider records and tests real model projection, not actual kernel math.
- The initial R730 model-control run failed because the absolute Node invocation
  left `node` absent from the child process PATH used by esbuild. Its original
  `spawn node ENOENT` log is retained. Setting the reviewed Node directory in
  PATH and rerunning the identical 27 cases passes; no assertion/product change
  addresses that environment failure.
- Actual Chromium 155 + actual OCC WASM Worker + these production ledger modules
  pass four profiles (two independent rectangles, disk, annulus), disjoint
  multi-solid Boolean union, exact bounds/analytic volumes and revision refusal.
  Four profile volumes are 500, 500, 500π and 1500π mm³; union volume is 1000 mm³
  with two native solids. One mount owns the sequence. The native profile and
  Boolean results retain source input and source-plane marker. The **model
  projection in this browser test is test-only**, not an application window.
- A genuine successful native disk reply with volume 500π is held before its
  controller receives it. Aborting the actual evaluation owner rejects with
  `CANCELLED`, publishes no model, and releases all owner/mount reservations.
  Releasing the held real reply does not install a late model. Owner close also
  makes subsequent actual mount calls fail `MOUNT_CLOSED`.
- R730 TypeScript `--noEmit --pretty false` exits zero, empty diagnostic log.

The native test imports the owned review modules through a test-only CDP Fetch
route and uses the existing private component fixture's actual static Worker,
JS and WASM. It does not alter the shared fixture or claim catalog/public
application integration. All native runtime and source hashes are in the raw
receipt. No synthetic positive Worker output is injected. The cancellation test
delays only a real native success event. Ordinary browser UI, source-solving,
history/native-save-reopen, memory/GC and manufacturing remain separate gates.

## Reproduction

```sh
node --test test/selected-profile-ledger/protocol.test.mjs \
  test/smlib-integration/solid-intent.test.mjs \
  test/smlib-integration/solid-ledger.test.mjs \
  test/smlib-integration/solid-metrics.test.mjs \
  test/solid-container-results/metrics.test.mjs \
  test/solid-container-results/model-ledger.test.cjs
node node_modules/typescript/bin/tsc --noEmit --pretty false
PUPPETEER_CORE_PATH=/path/to/puppeteer-core \
JSKETCHER_TEST_URL=http://127.0.0.1:20671/ \
CODI_TEST_CDP=http://127.0.0.1:19329/ \
CODI_RECEIPT=/path/to/native-result.json \
  node test/selected-profile-ledger/native-browser.cjs
```

Use an isolated Chromium context and a fixture serving the pinned selected-profile
component assets. Keep `node` in PATH for the esbuild child. No default app assets,
live service or provider connection are changed by these tests.
