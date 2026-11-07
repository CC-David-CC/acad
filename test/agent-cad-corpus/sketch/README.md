# P0 sketch fragment for the agent CAD corpus

This fragment uses the existing production sketch client, installed sketch Worker and registered rectangle/diagnostic services. It adds no solver, model framework, fake Viewer/storage/browser or canvas/UI interactions. The canonical parametric model and history remain unchanged. The root corpus owns aggregation and the broader release decision.

The current [fragment](receipts/r2/fragment.json) follows the requested `version/source/cases` schema. It reports **25 pass, 1 fail, 3 unsupported, 3 not-tested**, not an all-pass qualification. [Raw evidence](receipts/r2/receipt.json) includes complete requests before/after, real Worker results/reloads, exact real project/source/history snapshots for the registered rejection, app/Worker/client-wrapper hashes and Worker cleanup counts. The installed runtime is source `4a3d7aba490490c1d87bae11be92cb88b962f3e6`; 41/41 matching sketch Workers terminated and the owned browser context closed. A successful driver exit means the receipt was produced; inspect case statuses.

`browser-worker` cases cover a free3-4-5 line, circle and degenerate domains; anchored dimensioned rectangle; the off-line perpendicular-bisector midpoint counterexample for both PointInMiddle/Symmetry; concentric centers, diameter changes/contradiction and signed X/Y; unsigned zero/negative distance; independently contradictory horizontal/signed-Y relations; admitted expression/unit scope; strict serialization/reload and retained authored constraint metadata. Geometry answers are independent explicit coordinates/radii/lengths, not returned residuals alone. The Worker/client must leave exact caller request bytes unchanged on rejection; this stateless property is not live-document rollback.

The three `subsystem` app cases actually call registered craft create/edit and saved diagnostic services: rectangle100×50→120×60, width0 refusal preserving exact accepted native-project/sketch/history bytes, and diagnostic inspection with no native mutation. They bind an owned host lifetime and use real storage/model transactions; they do not exercise signed desktop agent transport. The invalid dimension edit is a domain refusal, not a contradictory-constraint solve.

The single failing row is known implied redundancy: Horizontal plus SignedDistanceY=0 solves with both admissions `accepted`. It fails the requested redundant-classification coverage. Accepted admission is not itself a claim of mathematical independence, and retaining authored admission intent must not be confused with changing geometry or rewriting it from a numerical rank estimate. No DOF is inferred from equation counts or Jacobian rank. Live contradictory constraint-edit rollback through signed transport, genuine numerical nonconvergence on an independently consistent model, and physical DOF certification remain `not-tested`.

Explicit unsupported scope: arithmetic directly in a legacy constraint field (`W + 5`), free-text unit suffix (`2 cm`), and compound typed sketch-field expression (`D + 1`). Supported contrasts are a named legacy arithmetic definition, a literal external name, and a typed length name whose definition uses `inch(1)`, with radius independently checked as25.4/2 mm. A valid `deg(90)` parameter is refused as a diameter length. Unsupported rows retain actual typed/error responses; they are not silently passed as general expression support.

The first [r1 fragment/receipt](receipts/r1/fragment.json) and [exact r1 input cases](receipts/r1/cases.json) are retained. r1 expected unsupported expression syntax to succeed and its angle-dimension fixture also used invalid suffix syntax; those were fixture scope mistakes, not established product regressions. r2 corrects the fixtures explicitly and adds successful admitted alternatives. No runtime code changed to make the corpus pass.

Reproduce against the root-owned matching loopback fixture (currently20469/CDP19329):

```sh
node node_modules/webpack/bin/webpack.js --config test/agent-cad-corpus/sketch/webpack.client.cjs
CODI_SKETCH_CORPUS_OUTPUT=/tmp/codi-agent-sketch-corpus-result node test/agent-cad-corpus/sketch/browser.test.cjs
node --test test/agent-cad-corpus/sketch/oracles.test.mjs
```

The test-only 11KiB wrapper imports the exact production client and is supplied under a same-origin URL using CDP Fetch. Real Worker/app responses are never replaced. The document enforces self-only script/Worker policy with WASM permission and no JavaScript unsafe-eval/unsafe-inline; permitted inline styles are unrelated. The archived [wrapper](receipts/r2/client.bundle.js) matches the raw receipt pin. Rebuilding uses the existing dependencies; no app/solver rebuild is required. The five oracle source tests check independent negative controls and prevent transport/crash failures from masquerading as domain refusals; they are not additional browser qualification.
