# Independent Boolean runtime-selection review

Source reviewed: `32386643ab487de2ca40094549274b109822a6f4`.
Own scope: this new test/notes directory only. No product changes or edits to
the coordinator's `test/selected-profile-boolean/` evidence. Finished planar
edge proof remains unchanged.

## Source conclusions

No new blocker found in the bounded helper/command change.

- `selectSolidOperandBuild` resolves both requested IDs from the coordinator's
  actual `inspect().outputs`, validates each requested engine, registered
  JS/WASM revision and exact mount identity/representation, and requires the
  two resolved revisions to match. It never substitutes the default build.
- The public command still checks operation availability and exact public
  fields. Missing/stale, repeated, wrong-engine, unregistered or mixed-build
  operands reject before feature-ID allocation or submission. The later
  canonical ledger still resolves genuine live models and native operands.
- Public inspection supplies type-checked `MWorkerSolid`/`MWorkerEmpty` rows,
  verifies registry identity and frozen metrics/runtime identity, then rechecks
  services, source inventory, placements and stream revision before returning.
  This is not accepting arbitrary runtime metadata from a public caller.
- Caller intent is detached and revalidated by `captureSolidBoolean`; operation
  history receives the selected registered revision, not an engine token or
  native handle. Candidate replay retains service/stream/lifetime guards and
  atomic preparation/publication.
- The box branch still uses the original default advertised engine entry.
  The new operand resolver runs only for Booleans.
- Using `outputs` rather than only nonempty `bodies` preserves native-empty
  identities and their registered runtime. The existing candidate preparation
  still returns `bodyId:null` for `MWorkerEmpty`; it does not manufacture a shell
  or conflate empty output with an operation failure.
- Catalogue validation still requires the mounted registered build to provide
  all Boolean operations. This helper does not independently establish a new
  kernel capability or promote the selected-profile build as the default.

`data()` verifies own enumerable data properties for every field it actually
reads. It conservatively rejects sparse/malformed inspection entries. It does
not require arbitrary extra fields on trusted inspection rows to be absent;
the public command receives only coordinator-produced rows, and that is the
intended boundary. Unselected runtime fields need not be inspected or used as
a fallback. Native worker code provenance remains part of source-matched app
and Worker asset verification, not a new caller-selected authored field.

## Inherited currentness limit, not introduced by this candidate

`workerSolidCommands.execute` still captures global `storage.revision` and
checks it throughout the candidate. An unrelated project-cache write can
therefore conservatively cancel a held Boolean despite unchanged sketch bytes,
history and accepted models. This guard predates323866; the new helper neither
adds nor relaxes it. It should not be confused with corruption or evidence of
mathematical impossibility. A future change needs its own genuine held-reply
and source/history ABA controls; this review does not broaden that scope.

## Additional independent controls

`runtime-boundary.test.mjs` uses synthetic inspection records honestly:

1. Target identity/engine/measurement accessors reject without execution.
2. Hidden/inherited-only required fields cannot establish an operand build.
3. A selected-profile native-empty inspection preserves the same explicit build
   and leaves its frozen input unchanged.
4. Unselected runtime getters are unused; neither default nor unrelated builds
   become fallback choices.
5. Hash whitespace/newline/case changes cannot select an unregistered build.

Run with Node:

```sh
node --test test/selected-profile-boolean-review/runtime-boundary.test.mjs
```

These five synthetic controls qualify the helper boundary only. The
coordinator's seven operand and twelve ledger controls remain separate.

## Additional actual public checks — scoped PASS

Normal app source323866, runtime
`/mnt/data10tb/codi-cad-selected-profile-boolean-20261106-r1`, strict private
fixture `http://127.0.0.1:20683/`, app SHA256
`a0e2ef4030f29d17e83b5290277480e80414bcb5a0ce10d907f73ed00d65ccc2`.
`public-controls.cjs` uses separate owned browser contexts and public Craft
commands, no raw source seed or fabricated successful reply.

| Actual control | Result |
|---|---|
| Default OCC box10×20×30 retains original advertised build, volume and bounds | PASS |
| Three disjoint Circle regions create actual selected-build solids | PASS |
| Unknown/repeated ID, wrong engine, stale revision, extra caller runtime field | PASS: prior state exact, no Worker dispatch |
| Common of two disjoint solids produces MWorkerEmpty with bodyId:null | PASS |
| Consumed earlier output ID refuses before dispatch | PASS: prior state exact |
| Union(empty,remaining solid) preserves selected build | PASS: valid single solid, native volume500*pi, bounds[50,-10,0]..[70,10,5] |
| Boolean authored history uses its operands' selected revision | PASS |

The actual source contains three publicly appended circles centered at0/30/60mm,
r10, each extruded5mm. Final source bytes remain exact. Empty/nonempty outputs
retain the selected JS/WASM revision; the default box retains its original
default build. Actual app/Worker hashes and state are in `public-receipt.json`;
supplied normal-build pins are in `runtime-pins.json`.

The first run completed those operations but failed an oracle expecting empty
nativeVolume0. Existing provider behavior leaves nativeVolume and
nativeMeasurementQuality null when no measurement is supplied. It reports
volume0, zero triangles, no bounds, solidCount0 and valid native topology with
zero children/solids/shells/faces/edges/vertices. The corrected oracle requires
that exact distinction; it never converts null into measured zero. Positive
final solid volume/bounds checks are unchanged. The original failure remains
in `evidence/native-empty-measurement-assumption-before.*`; a complete fresh
context rerun on the unchanged app passed.

Run the public driver with loopback JSKETCHER_TEST_URL/CDP, mandatory exact
CODI_SOURCE_PIN/CODI_EXPECT_APP_SHA above, a new CODI_RECEIPT and locked
puppeteer-core via PUPPETEER_CORE_PATH. Then run the independent pin check:

```sh
python3 -B test/selected-profile-boolean-review/check-public-receipt.py
```

Only owned contexts close; shared Chromium is disconnected, never terminated.
This lane does not qualify Files, native reopen, global-cache injection,
lifecycle or the whole Boolean corpus. Root's union/subtract/common and native
reopen proof is separate. No product/UI/default/service/deployment changed.
