# Public selected-profile workflow qualification

Prepared from API candidate `d0d3abc01`. Baseline r1 (`d0d3abc01`, app `cc014e8b`)
passes all six public geometry/native-reopen cases. Corrected data-transport r2
(`61a5ecdbc`, app `2d30b608`) passes the same six cases. Its separate public
retained default OCC and Manifold box/disposal smokes also pass: each measured
24 mm³, expected bounds, zero remaining engine owners/mounts and terminated owned
Workers. Native volume remains explicitly unavailable for those old providers;
their measured tessellation/mesh labels are retained. Source/parameter proof on
the ancestry fix r3 and final namespace-currentness build r4 also passes (see the
source-matched matrix below). Matched exact
source/app/Worker pins are mandatory for every execution. This branch changes
tests only; it does not register/repair product commands or seed geometry.

`browser.cjs` uses actual installed application public Craft APIs to create empty
source planes and append Point/Segment/Circle primitives, discover supported
regions, and request explicit separate OCC extrusions. Cases are rectangle,
disk, annulus, three nested circles, two disjoint rectangles reused from the same
unchanged source, and an offset XZ plane. It checks analytic native volumes,
independent frame-transformed bounds, source retention, exact authored feature
fields, rediscovery after each consumption-free feature, atomic invalid-request
refusals, and normal native save/fresh reopen. Node-side probes independently
inspect actual readonly display buffers for top-cap interior coverage and open
annulus centers. This is bounded preview evidence, not mesh/manufacturing
validity. Native geometry comparisons use explicit numerical tolerances rather
than requiring identical floating tessellation integrals or face partitions;
both raw metric sets remain in the receipt.
The rectangle case separately probes source Point editing and creating another
independent plane after the feature. It records truthful readiness/refusal and
requires refused operations to leave accepted content untouched. This probe runs
after capturing the native save revision, so it cannot silently redefine what
the saved file is expected to reopen. Global post-feature restrictions are
reported as gaps rather than repaired by test-only writes.

Every source geometry comes from public authoring commands. Read-only source,
history and model inspections provide test oracles; no private writer/native
snapshot seed/test helper bundle is injected. The only host setup binds the
document through the public host-lifetime service using an owned AbortController.
Native saves come from `prepareHostSave`; its unchanged envelope is transported
as a genuine Blob to `restoreSnapshotBytesInEmptyWorkspace` in a separate fresh
browser context. That proves the native application path, not signed My files,
cross-account authorization, network sync or a complete desktop host action.

Set the following before execution:

```sh
PUPPETEER_CORE_PATH=/path/to/puppeteer-core \
JSKETCHER_TEST_URL=http://127.0.0.1:PORT/ \
CODI_TEST_CDP=http://127.0.0.1:CDPPORT/ \
CODI_SOURCE_PIN=FULL_COMMIT_HASH \
CODI_EXPECT_APP_SHA=APP_SHA256 \
CODI_EXPECT_SKETCH_SHA=SKETCH_WORKER_SHA256 \
CODI_EXPECT_SEMANTIC_SHA=SEMANTIC_WORKER_SHA256 \
CODI_EXPECT_PROJECT_SHA=PROJECT_WORKER_SHA256 \
CODI_RECEIPT=/owned/path/receipt.json \
  node test/selected-profile-public/browser.cjs
```

Use `CODI_PUBLIC_CASES=rectangle` for the bounded first execution. Each case uses
its own context and a genuinely separate context for native reopen. The driver
streams asset hashing outside the browser and records actual Worker URLs/pins.
It refuses absent/mismatched pins. First counterexamples remain in the receipt;
do not weaken geometry/persistence/currentness assertions to obtain a pass.

`lifecycle.cjs` probes public core timeline
back/forward (reported separately from the unfinished atomic host journal), a
held genuine read-only discovery completion superseded by a public primitive
change, and held genuine native success through host lifetime Close. No
successful fake Worker output or private source mutation is used. A core
timeline failure is retained as PARTIAL, while a stale publication/cancellation
failure is FAIL; neither becomes a fake successful journal result.

`box-smoke.cjs` uses separate fresh contexts and default engine revisions for
retained OCC and Manifold, then calls public project disposal and checks actual
Worker termination/engine-resource accounting. It does not mix profile/default
revisions in one owner or infer native classification from a mesh measurement.

`regeneration.cjs` authors an annulus publicly, drives its outer circle's diameter,
adds an unrelated Point and independent plane/Circle, then asks for an invalid
inner diameter that reverses nesting. It requires last-valid source/history/model
preservation on rejection and normal native save/fresh reopen of the valid edit.
These are additional source/replay gates, not native seeds or private edits.

## Source-matched results

| Build | Exact source | Application SHA256 | Evidence / result |
|---|---|---|---|
| r1 /20679 | `d0d3abc0173d10b592a3b6a0cfb55c2abef1b1b9` | `cc014e8b02a4948b54a5e81df9b6ccd8c84ea66e68e227502ae9c70ac11e8064` | Rectangle plus other five cases PASS; normal native fresh reopen in every case. Post-feature source edit/new-plane restrictions retained. |
| r2 /20680 | `61a5ecdbcc140ab70503a78e2372be1e06644271` | `2d30b60851aff127e1ad45ad3f698db3c081c15ea102cb45102c7ee691ec2ba1` | Same six cases PASS; retained default OCC/Manifold public boxes and disposal PASS. Benign project-save inspection control FAIL retained. |
| r3 /20681 | `15ed6c577f4bef9f56debd533cd8f2299ab152e4` | `056b5ca4d74bf7fcb76ac21b7d6b4b4d11f7b768b63a4a2aa78dc9bae917c78a` | Public dependent regeneration/unrelated creation/invalid edit/native fresh reopen PASS; three core-timeline/lifecycle controls PASS. |
| r4 /20682 | `a0b363bce15e8533be17c9332b46a7e51ddeea5d` | `8ae3ddc83e706829761c66ddc573fae42f9d746171ee09c1ee3b0f0744d98965` | Same focused regeneration/native fresh reopen PASS; all five lifecycle/currentness controls PASS. |

These are distinct installed runtime results, not claims that a later notes-only
head was rebuilt/tested. The later conservative API-description correction does
not change these source pins or qualify additional geometry. `receipt.json`
indexes exact raw receipts/logs and test script versions. All execution used
Chromium155 through owned isolated contexts; contexts are closed by each driver.

Common genuine Worker/native pins across these four installed builds:

- Sketch: `241267a8f24892743ec82beaf5bda00da962538b8bb445c3d02b6559d4583da9`.
- Project validation: `7236c461672b662cf9d860439c99a3962784012f88245c248a771158f7287286`.
- Selected semantic: `b2978247c61a269ff5e8e2143dfdaca04221c3ee6e950e1336099f1bb440d2a3`.
- Selected native Worker: `0f3240cdde9b5faced831ace71ee5ffcfb6fe159dacba5b7265e5a09b0ca9853`.
- Selected native JS/WASM: `cbd49d63d0900f50dda7fc53518d5f06183e85b1dea720522cc2994b0876adc9` /
  `a81af0b78dd585124f3f2d05d09b4a387b276bd1f655f0234002a6ab4646a637`.

## Authoritative source and bounded evidence

Every saved selected-profile feature has exactly nine authored parameters:
`version`, `unit`, `engine`, `engineRevision`, `featureId`, `faceId`, `regionId`,
`depth`, `bodyPolicy`. The test explicitly asserts this key set. No derived
profile, solved-geometry copy, display mesh or native handle is stored in that
feature. The original source namespace supplies the editable native sketch once
per plane. One selected region produces one generic solid, preserving its source
face and all original source region descriptors. Disjoint A then B uses the same
unchanged bytes and retains both discoverable regions; three nested circles
retain immediate-hole membership while each intended region is selected.

The public descriptor limit remains 8192 characters for a supported region ID,
128 regions and a 64 KiB source/response budget. This is the conservative
circle/exact-local-rectangle scope, not general planar arrangement, arbitrary
source formats or typed project-parameter support. Tests check the published
bound identities/source revision, explicit engine revision and separate-body
policy, not fabricated generated-face provenance. No LID/side identity or
downstream face-selected hole/manufacturing capability is inferred.

r3/r4 source replay evidence: original annulus r20/r10 at depth5 measures1500π;
public outer diameter50 changes it to2625π with the same output identity. A
non-boundary Point, new independent plane and unrelated Circle all succeed while
the intended solid stays2625π. Public inner diameter60 reverses nesting and
returns `STALE_REGION`; every accepted source byte/history entry/model reference
remains unchanged. Normal native save/fresh Blob reopen preserves the two source
files and valid authored design, recreating the correct native solid. This is
qualified bounded dependency/recovery behavior, not all parametric editing.

## Before failures and currentness

The r1/r2 rectangle receipts preserve the earlier global ancestry restriction:
source Point append refused with an uncommitted AbortError despite global edit
readiness, and new-plane creation reported unsupported part history. Both were
safe refusals with accepted content untouched. r3/r4 regeneration then proves
the supported source/unrelated creation path; tests did not bypass the guard.

The retained r2 `metadata-save-before` receipt is a genuine public counterexample.
While an actual successful `inspect-selected` Worker reply is held, public
`projectService.save()` changes global storage revision without changing source
bytes or source-key version. r2 incorrectly aborts that source inspection. The
identical test on r4 completes successfully. On r4, a public Point append plus
public primitive-byte undo restores identical source bytes but increments source
versions; the old held inspection still aborts. This distinguishes benign
project metadata writes from a source-version ABA. No private storage writer or
positive fake Worker output is used.

Held successful native500π completion through the public host lifetime Close
fails uncommitted, preserving the accepted source/history/model. Retained-engine
box disposal checks actual owner/mount counters and explicit Worker termination;
these tests do not claim forced-GC, whole-renderer, RSS or physical GPU proof.

## Timeline and remaining journal scope

The legacy public `historyTravel.backward/forward` successfully reconstructs the
selected solid with unchanged source and authored feature IDs. It is recorded
as **core timeline replay only**. It does not qualify a new selected-feature
atomic authored-depth journal, typed host undo/redo wrapper or depth editing.
The source-version ABA control uses the existing primitive byte journal on a
source-only PLANE document before any selected extrusion; it is not evidence
for undoing a selected feature through that new host journal. Those are separate
next gates. Signed My files/account/desktop command authorization also remains
outside these standalone public-app receipts.
