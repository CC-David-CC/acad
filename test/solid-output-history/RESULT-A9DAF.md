# Whole native multi-material results with voids

Runtime source `a9dafce6e33c442c9ff16d0124c44236711eb5fc`, exact-source R730 build `/mnt/data10tb/codi-diag-final-whole-cavity-reviewed-20261105-r1`. App SHA-256 `41764cb64ae096277673eeb0acddb424642ee977be33e45dcfe0b831d14b6af1`. Strict-CSP app fixture20478 uses separate contexts on shared Chrome CDP19329. No deployment or default-engine change.

The experimental adapter's blanket multi-material-with-void rejection is removed. One complete native BRep stays owned by its evaluation Worker. Native census, validity, bounds and supported volume remain separate from display geometry. These results supply zero Float32 bytes and explicit `material-orientation-unqualified` unavailable preview. Native results remain usable by subsequent Booleans, history and saving. Raw Float64 triangles remain display-only. No region decomposition or independent editable identity is invented.

The lead's actual `multivoid-container-browser.test.cjs` passed:

- D=(outer10³−inner6³)∪far10³ gives1784mm³,2 material regions/1 void; fresh native replay preserves the output and unavailable-preview status.
- D∪a fresh inner6³ and the separately authored reverse order each give2000mm³,2 material regions/no void, with available preview.
- A2³ material island inside the cavity gives792mm³ with unavailable preview. Upstream outer-height edit10→12 gives992mm³, preserving output ID, authored-edit undo/redo and fresh native replay.
- Authored snapshots exclude ephemeral handles and derived display/volume fields. Receipt: `multivoid-a9daf-receipt.json`; log `/tmp/codi-root-a9daf-multivoid-container.log`.

The existing `output-history-browser.test.cjs` also passes against this final SMLib runtime: true empty output reuse, upstream empty↔nonempty edits, rejected parameter edits, authored-edit travel, fresh replay and disjoint/edge-touch unions. Edge-touch native volume remains explicitly unavailable. Log `/tmp/codi-root-a9daf-output-history.log`.

The independently repeated provider test also passes actual pinned strict-CSP Workers: native input evidence and Float64 mesh hashes stay unchanged, both fill orders return2000, and native-invalid partial fill refuses. The island raw triangle integral remains776 while native and independent cell oracle give792. Preview unavailability does not repair tessellation. Receipt: `test/raw-smlib-whole-void/root-independent-receipt.json`. The first root attempt had no listening fixture; `/tmp/codi-root-whole-void-provider.log` records a connection failure, not a native failure.

The signed desktop test separately passes public commands, D1784 Save/fresh Files reopen, fill2000, upstream edit2200, stable identity with undo/redo and a second Save/reopen, island792/no preview, partial-fill ENGINE_FAILURE captured inside the browser, and account denial. Receipt sourcee3315cebb is in the desktop repository.

Native kernel6c99/WASMf33 remain unchanged from3bd. New Worker SHA-256 `bbfdfe916d879fcc1ee84f59453f6b3dd67eb08ea92c06614e505aa35b413a65`, mount source `1f9993a3d5fc0ed4ad2d467080a390e1b579bc1f4db962517ca455b7ccc037cd`. Other app helper/solver/project/physical/manufacturing and OCC/Manifold Worker pins match3bd. Exact raw/native pins and recipe: `test/raw-smlib-whole-void/README.md`.

Common source controls pass11 cases and TypeScript passes. Independent review found a legacy known2-material/1-void record lacking a result kind could take the old Float64 preview path. Sourcea9daf fences known counts regardless of missing kind in both ledger/model; that contradictory legacy route refuses. Classified hidden outputs retain the authenticated private handle. Source controls and actual kernel/browser evidence remain distinct.

Reproduce with `NODE_PATH=/path/to/puppeteer-core-parent JSKETCHER_TEST_URL=http://127.0.0.1:20478 CODI_TEST_CDP=http://127.0.0.1:19329 CODI_APP_SHA256=41764cb64ae096277673eeb0acddb424642ee977be33e45dcfe0b831d14b6af1 CODI_RECEIPT=/tmp/multivoid.json node test/solid-output-history/multivoid-container-browser.test.cjs`. Broader Boolean semantics, curved geometry, oriented manufacturing tessellation, STEP and full CAD1 remain open. Native validation is not proof of universal semantic correctness. No automatic operand reversal, engine fallback or conversion is used.
