# Two-source loft semantic foundation

Source-only E15 checkpoint: `d8155020a` captures saved/evaluation intent; `8fb79ad9c` adds two-source discovery/preparation and narrow production semantic Worker dispatch; `9de354cca` bounds the complete new loft reply envelope. No ledger, operation, Craft, catalog, default, desktop or native change belongs to this lane. Native loft geometry/transport has separate qualified receipts. This source foundation does **not** qualify a public loft workflow, native solid, topology naming, Save/Open, or full E15.

## Saved and evaluation contracts

`captureOwnedLoftFeature` accepts exactly eight own-data fields:

```js
{
  version: 1, unit: 'millimeter', engine: 'occ', engineRevision,
  featureId,
  sections: [
    {faceId, regionId, seam},
    {faceId, regionId, seam}
  ],
  construction: 'ruled-solid', bodyPolicy: 'separate'
}
```

There are exactly two ordered sections with distinct source faces. `regionId` stays opaque. Each seam is exactly `{kind:'vertex',pointId,reversed}` or `{kind:'circle-angle',curveId,angleRadians,reversed}`. Circle radians are finite within ±2π, preserved without normalization; reversal is an explicit boolean. No automatic corner/seam/order, placement, joining or orientation correction exists. Height derives from actual source-plane placement; no depth/height field is saved. Coordinates, hashes, frames, handles and ordinals cannot enter this saved schema.

Exports are `captureOwnedLoftFeature`, `captureLoftSectionReferences`, `captureLoftSeam` and `captureOwnedLoftEvaluation`. All captures detach/freeze data and refuse accessors, extras and sparse arrays. Evaluation is exactly `{version,unit,engine,engineRevision,featureId,loft}`, where `loft` is the existing ephemeral `ownedLoftIntent`. Build registration and current document ownership are separate caller obligations; a syntactically valid engine revision alone does not authenticate a build.

## Semantic request/reply contract

`SOURCE` is exactly `{unit,engine,profileVersion:3,revision,sketchDigest,faceId,frame,sketchJSON}`. Both sources require the same revision/unit/engine/profileVersion, distinct faces and at most 64 KiB UTF-8 **each**. All source fields/seams and both frames are captured before suspension. Actual source hashing and parsing occur once per source, outside candidate loops, in the semantic Worker.

Discovery job:

```js
{jobId, kind:'inspect-loft', loft:{sections:[SOURCE,SOURCE]}}
// value:
{
  sections: [{
    binding:{revision,faceId,sketchDigest},
    regions:[{regionId,support,reason,descriptor,sectionKind,edgeCount,seams}]
  }, /* second section */],
  qualification
}
```

`descriptor` is the existing authoritative local `{outerCurveIds,holeCurveIds}`. `sectionKind` is `'polygon'|'circle'|null`; unsupported rows have `edgeCount:0,seams:[]` and a bounded explicit reason. Polygon choices are `{kind:'vertex',pointId,curveId}`. Circle choices are `{kind:'circle-angle',curveId}`: the caller supplies explicit angle and reversal afterward. Choices never contain native ordinals. Each ordinary polygon corner has two distinct native sketch endpoint identities on its incident Segments; those remain distinct choices, even when geometry is coincident.

Preparation job:

```js
{jobId, kind:'prepare-loft', loft:{
  sections:[{...SOURCE,regionId,seam},{...SOURCE,regionId,seam}],
  construction:'ruled-solid'
}}
// value:
{
  binding:{
    sections:[{revision,faceId,sketchDigest,regionId,seam}, /* second */],
    construction:'ruled-solid'
  },
  request,       // existing ephemeral ownedLoftIntent
  loftBinding    // existing full request SHA + both source/region bindings
}
```

The existing request shape is `{op:'solid.profile.loft',version:1,unit:'millimeter',sections:[{source:{faceId,sourceSha256},frame,region},...2],correspondence:{kind,startA,reverseA,startB,reverseB},construction:'ruled-solid'}`. Transient polygon starts are resolved from actual source endpoints; circle starts preserve explicit radians. Preparation uses the same captured source frames and geometry that are bound by the hashes. It does not read caller frames/seams after hashing. The full request gets one additional SHA inside existing Worker-only `prepareOwnedLoft`.

Every complete discovery/preparation value and the complete loft Worker success envelope must fit 64 KiB UTF-8. Invalid new-job IDs are rejected without an unbounded echo. A valid inventory or prepared echo can exceed that budget even when each source is below 64 KiB: the entire reply then refuses `RESOURCE_LIMIT`, with no partial `value`, truncated IDs or fake empty inventory. Existing qualified primitive-ID/region caps remain unchanged (including the inherited 256-code-unit qualified primitive-ID cap).

## Endpoint provenance and domain

Solved native sketch JSON stores Segment parent IDs and endpoint coordinates, not separate endpoint IDs. The module reuses production `projectRenderSketch`, the exact canonical projection used by public closed-sketch inspection. It projects ordinary Segment/Circle rows **once per source**. No new `:A/:B` grammar, opaque-ID parser, nearest-point search, tolerance welding or source model is introduced. The chosen point must first match an actual projected handle and its actual outer Segment parent; exact incidence on that parent’s already ordered boundary determines the transient start vertex. Native sketch point identity and geometric coincidence are separate facts.

Imports are Worker-safe. Ordinary Segment/Circle projection never calls the transitive spline geometry path or instantiates Shape/Param/PM objects. Tests forbid `Generator.genID()` during source discovery and check that the sketch mutation epoch stays unchanged. Actual production Node and Chrome Workers execute without DOM/canvas shims. A genuine coordinate no-op additionally resolves each discovered endpoint through actual EndPoint/Segment ownership admission and preserves the source bytes exactly.

The initial domain is one generator-free source stage, simple Segment polygons with matching edge counts or a full Circle pair, no holes. Existing authoritative region extraction handles all ordinary loops before selection. A nested annulus is explicitly unsupported while its valid disk remains discoverable; no unsupported curve is silently dropped. Actual kernel section parallelism/separation, correspondence self-intersection and solid validity still require native evaluation. The exact qualification string is `source-membership/domain-only; section placement, correspondence and solid validity require native evaluation`. A per-row `supported` result is individual source membership/domain admission, not paired native feasibility. Matching revision strings and declared hashes alone do not establish one live document generation; the shared coordinator must own/corroborate the genuine solves and lifetime through publication.

Reasons retain their domains: invalid datatypes/schema → `INVALID_REQUEST`; mismatched source revision/unit/engine → `STALE_SOURCE`; digest/frame/region changes → existing `STALE_SKETCH`, `STALE_FRAME`, `STALE_REGION`; absent/wrong outer endpoint or Circle → `STALE_SEAM`; same face or unavailable canonical inspection → `LOFT_UNSUPPORTED_SOURCE`; valid holes or mismatched supported section kinds/counts → `LOFT_UNSUPPORTED_HOLES` / `LOFT_UNSUPPORTED_CORRESPONDENCE`. Existing source topology/primitive refusal codes are preserved. Unsupported geometry is not described as corrupted source or mathematically impossible.

## Evidence and scope

`evidence-r1` retains production build/source hashes, full Worker observations, browser receipt and logs:

- 19 Node groups PASS. Positive sketches were created via real production empty/primitive transitions and inspected by the actual solver Worker. The polygon pair is genuinely nonhomothetic (20×10 and clockwise 10×20); circles have real offset centers and radii 4→2. Prepared bindings, exact public inspection IDs, source preservation, currentness, wrong construction/foreign/coincident unrelated point seams, section order, whole source/reply caps and retained selected/revolve/sweep routes pass.
- Forty-five Node Workers started and terminated. Test-only compiled entry checks no Shape/Param allocation during discovery and unchanged mutation epoch; discovery performs exactly two source hashes/parses. Direct function and production Worker controls have distinct scopes in the receipt.
- Dedicated Chromium PASS: two genuinely authored source pairs, 24 real production Workers, exact source/region/seam/full-request bindings, typed wrong-seam refusals, zero CSP violations, dedicated browser closed. Shared browsers are untouched. No native loft or public app geometry success is fabricated.
- Full TSC passes with an empty log. Builds used own dependency links and copied numeric cache, not a shared writable cache. The producing production semantic/sketch Worker and compiled test-entry hashes are pinned; actual source content is independently bound to `9de354cca` in `source-binding.json`.

The long-ID/many-region and large prepared-echo cases are explicitly hand-authored **component budget fixtures**, not solver-authored source or native/public success. Their only claim is resource refusal. The first test run selected Verb's unsupported Node branch because the platform adapter lacked `importScripts`; its original failed source/log is retained under `evidence/before-harness`. A later extra budget-test syntax error is retained under `evidence/before-budget-harness`; only the test syntax was repaired. The full-envelope boundary control exposed a 65,406-byte value inside a 65,821-byte success reply. That exact before source/response/build is retained under `evidence/before-envelope`; the loft-only Worker repair returns typed RESOURCE_LIMIT without partial value, and its fresh compiled Node/Chrome regressions pass. Other operation wire behavior remains unchanged. No geometry assertion, tolerance or native data was weakened.

## Reproduction

With reviewed dependencies linked into this checkout and an OWN copy of `node_modules/.cache/codi-numeric/precompiled.js`:

```sh
node test/selected-profile-loft/build.cjs
node --test test/selected-profile-loft/feature.test.mjs test/selected-profile-loft/semantic.test.mjs
node test/selected-profile-loft/check.cjs
node node_modules/typescript/bin/tsc --noEmit
```

The browser proof uses task-owned loopback `serve.py ROOT PORT` and `PUPPETEER_CORE_PATH=/tmp/codi-occt-release-control/node_modules/puppeteer-core node test/selected-profile-loft/browser.cjs BASE_URL OUTPUT_JSON`. It launches/closes a dedicated Chromium; do not restart or close shared CDP. Source-only test platform/driver code is committed. Generated Worker JS stays under ignored `.build`; no native binary, account state, normal app package or service deployment is part of this lane.
