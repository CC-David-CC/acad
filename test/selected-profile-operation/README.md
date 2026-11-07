# Selected-profile operation component qualification

Candidate product/test source: `bbffda3a2`, based on integrator prerequisite
`bd191e7b8` (the latter adds production `prepare-selected` semantic Worker
dispatch). This lane changes only the new operation and this test directory.
It does not register a public command, modify shared Craft/catalog/build defaults,
add a human UI, edit the sketch solver, or qualify history/native save/reopen.

## Registered descriptor contract

Export `createWorkerSelectedProfileOperation(createMount, validateMount)` from
`modules/workbenches/modeler/features/workerSelectedProfile/workerSelectedProfile.operation.ts`.
The returned descriptor ID is `WORKER_SELECTED_PROFILE_EXTRUDE_V2`. Register it
explicitly in the normal operation registry; use the existing revision-aware
`createCatalogMount` / `validateEngineMount` injections. Its exact authored
parameters are:

```js
{
  version: 1, unit: 'millimeter', engine: 'occ', engineRevision,
  featureId, faceId, regionId, depth, bodyPolicy: 'separate'
}
```

`featureId` is a positive safe integer; depth is a positive finite numeric
millimeter value at most 1e6. Named/typed depth, alternate engines, union policy
and multiple-region selection are unavailable. The saved source is referenced
through `faceId` and the canonical descriptor `regionId`; no solved profile,
native token, mesh or duplicate editable sketch enters authored parameters.

The operation requires a current evaluation-private registry, its actual
`MOpenFaceShell` source face and actual current `MSketchRegion`. The source and
solved serialized source must fit 64 KiB in both string units and UTF-8 bytes.
The independent plane's current model boundary must be empty. The first version
requires untyped mode, a blank project expression script, no project/external
parameter values and no expression errors. Native local sketch constants remain
supported through the genuine solver; they are not converted to typed units.

Capture includes source bytes, namespace membership/version stamp, face frame,
descriptor and model identities, epoch/history, service identities, expression
streams/revisions/table identity, document generation and host lifetime. The
combined source/ledger/measurement publication check remains installed through
final candidate publication. A returned operation is not permission to publish
after source/lifetime changes. Source retention must not broaden the separate
unconsumed-sketch fast-save allowlist; source edits stay fail-closed until the
integrator's dependent replay path qualifies them.

## Worker and publication sequence

1. Two fresh genuine `rectangle-extrusion-solve` Workers solve the same exact
   captured original source and empty external table. This existing task is a
   generic solve despite its historical name. Strict bounded success envelopes
   must agree byte-for-byte on serialized source, digest and evidence, excluding
   their fresh request nonces. The source object must serialize to those same
   bytes. No arbitrary metadata is stripped or normalized by the operation.
2. Two fresh genuine semantic Workers execute `prepare-selected` on that same
   verified solved source/frame/selection/depth. Each validates exact binding,
   common v2 request and analytic expected measurements. Their values must agree
   exactly. Dedicated semantic job IDs differ, while the operation source-binding
   nonce is intentionally the same for both preparations. No topology/constraint
   solve, digest computation or region inference runs on the main thread.
3. Shared `evaluateWorkerSolid(kind:'profile')` evaluates the common v2 profile
   using the exact selected runtime, then constructs an actual `MWorkerSolid`.
   Native volume and bounds must match semantic expected measurements. Volume
   tolerance is max(1e-6 mm³, 1e-9 × expected magnitude); coordinate tolerance is
   max(1e-7 mm, 1e-12 × expected magnitude). These are admission thresholds, not
   a manufacturing-accuracy certificate.
4. Register one combined publication check, return `created:[solid], consumed:[]`.
   Source plane and all unselected regions remain current and independently
   reusable. The generic result exposes no fabricated LID, side, edge or vertex
   provenance and grants no downstream rectangle-hole capability.

Overall phase deadline is 30 seconds. Timeout closes the failed candidate owner;
it does not replace an accepted document. The deadline stops applying after this
operation returns, so a subsequent replay feature does not expire an earlier
feature's source check. Native-stage failures close the owner. Each ephemeral
solve/semantic client terminates its own Worker. Public transaction/rejection
semantics and retention of an older accepted model remain the integrator's
shared Craft responsibility.

Private response trees have explicit first-version limits: 8192 nodes, 32 levels,
and 64 KiB serialized data for source/evidence/semantic values. A valid broader
native document can therefore be unsupported by this candidate. Refusal preserves
its source; this is not full native-document or parameter coverage.

## Actual component results

The test uses actual `MOpenFaceShell`, `MSketchRegion`, candidate registry,
`MWorkerSolid`, resource pool, production operation/clients/ledger/catalog, real
constraint math in the sketch Worker, production semantic Worker, and actual OCC
WASM. Its project/storage/expression lifetime adapters and native input fixtures
are controlled test context. There is no canvas, fake browser UI, public command
authoring, complete Craft history transaction, account/file service or save/reopen
proof in this component lane.

| Control | Observed result |
|---|---|
| Disk r10, depth5 | Native 500π mm³, exact expected bounds, actual `MWorkerSolid`. |
| Annulus r20-r10, depth5 | Native 1500π mm³, hole/source region membership retained. |
| Rectangle10×10, depth5 | Native500 mm³ and expected bounds. |
| Two disjoint rectangles in one source | Two distinct output IDs/handles, 500 mm³ each; one mount, original source plus both source regions remain. |
| Native local constant `R = 10` driving RadiusLength | Stored radius seed5 remains unchanged; genuine solve produces r10 and native500π. Exact source constants, metadata note and annotations are preserved. |
| RadiusLength10 and20 | `SOLVE_FAILED`, no native mount; source unchanged. |
| Typed/project external parameters, string depth, union policy, multibyte overcap | Explicit refusal before Worker creation; source unchanged. |
| Extra field on genuine solve success | `INVALID_RESPONSE` before semantic/native evaluation. |
| Changed geometry/serialized source on first genuine solve success | Second genuine solve detects mismatch; no native mount. |
| Changed analytic expected volume on first genuine semantic success | Second genuine preparation detects mismatch; no native mount. |
| Held genuine solve success + changed source | Abort, changed current source retained, no output. |
| Held genuine semantic success + lost lifetime | Abort, source retained, no output. |
| Held genuine native500π success + Close | `CANCELLED`, no new model installed. |
| Source changed after operation return, before owner publication | `AbortError` from installed final source check; new source is not rolled back. |

Final browser run: all controls pass, **46 actual Worker instances terminate**.
No positive fake Worker result is injected: fault controls modify or delay an
actual successful result and require refusal. The first three complete candidate
operations each create five Workers: two solve, two semantic, one native.
Observed elapsed times are about 1.09–1.13 seconds in this run. The additional
verification solve Worker lives about289–300 ms and the additional semantic
Worker about45–46 ms. These are observed wall lifetimes including startup/loading,
not CPU, memory, general latency or production capacity measurements.

R730 builds the private component bundle and passes TypeScript `--noEmit` with
empty diagnostics. The final browser uses Chromium155 and strict same-origin CSP
without unsafe-eval/blob Worker relaxation; no CSP violations are observed.
Exact source, bundle, sketch/semantic/native Worker, JS/WASM and library pins are
retained in the receipts/manifest.

## Retained failures and bounded follow-up

Original failures are kept under `evidence/`, with their scope distinguished:
Raw console logs retain their exact bytes, including upstream trailing spaces;
the local attributes exclude those logs from whitespace diagnostics only.

- The first private esbuild bundle used raw Numeric.js instead of the normal
  application's existing CSP-safe precompiled numeric alias, producing an
  unsafe-eval startup refusal. Correcting the **test build** to use the same
  reviewed cache as normal builds fixes it. No product solver shim/CSP exception
  or fabricated success was added.
- The initial minimal component fixture lacked `/lib/verb.js`, which the genuine
  sketch Worker imports. The owned fixture now serves the actual tracked library
  at that normal path. Shared fixture and production assets were unchanged.
- The first manually constructed radius-constraint fixture supplied
  `annotations:[]`. The actual `RadiusLengthAnnotation.save()` format contains
  `[{angle: ...}]`; the fixture now follows that real format. The bad array is
  still refused with `SOLVE_ERROR`, but the existing loader's message is the
  generic "reading angle" error because it attempts `load(undefined)`. This is
  an existing malformed-native admission/diagnostic follow-up, not a reason to
  remove annotation data or change the solver in this lane.
- Initial new TypeScript source used Object.hasOwn beyond the configured target
  library and relied on insufficient key narrowing. These local compile errors
  are corrected using existing-target APIs; the original diagnostic is retained.

Next integration gates belong to the integrator: registry/public discovery and
commands; current revision rejection in the normal app; actual history replay,
undo/redo and fresh native save/reopen; signed user/account/Files workflow; source
edit/depth-edit dependency behavior. Nothing here promotes the default runtime,
third-party import, generated-face operations, typed parameters or manufacturing.

## Reproduction

Build `build-component.cjs` with reviewed Node/dependencies and the existing
`node_modules/.cache/codi-numeric/precompiled.js`; set `CODI_OPERATION_BUNDLE` to
an owned temporary path. Run `browser.cjs` with that bundle path,
`CODI_OPERATION_SKETCH_WORKER` pointing to the pinned genuine Worker,
`PUPPETEER_CORE_PATH`, loopback `JSKETCHER_TEST_URL` / `CODI_TEST_CDP`, and optional
`CODI_RECEIPT`. The loopback fixture must serve the pinned native static assets,
production semantic Worker and actual `/lib/verb.js`. CDP supplies only the
private component/Worker/library source routes; it does not replace math or
produce positive Worker output. This helper bundle is never a public app entry.
