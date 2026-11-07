# Combined R10 actual-browser qualification

Runtime source `a3760b172cc712f1f3376bdc216ab17df3d5ad76`, isolated R730 fixture at direct20600. Root ran existing production browser suites against the same app and Workers. No public deployment or whole CAD1/CAD2 gate is claimed.

| Test | Receipt | Result |
| --- | --- | --- |
| `test/legacy-expression-refresh/browser.test.cjs` | `legacy-expression.json` | Pass: formulas/local shadowing, refusals, stale/cancel/malformed results, exact no-op, Script draft/Reload, undo/reopen |
| `test/native-arc-rebuild/browser.cjs` | `native-arc.json` | Pass: six native Arc rebuild/DXF/reopen cases |
| `test/point-diameter-full-app/browser.cjs` | `point-diameter.json` | Pass: public IDs/point edits/Diameter/refusals/history/native reopen and held genuine replies |
| `test/dxf-production/browser.cjs` | `dxf-production.json` | Pass: saved native primitives, genuine unsaved face outline, unchanged intent, stale/lifetime cancellation and cleanup |

Pins:

- App: `fa1ba70a9c6a38744706e7f5557d794b743ca8288b1ed034f9f34e40d679132e`
- Sketch Worker: `6cda1dc90bdfa3312cea28dbcef2f855eb1923449bc4492fc4b7b1e602a3bd31` (`sketch-solver.0d881b445e625030cb80.js`)
- Project validator: `134e945d13e0ae5416f00e6521af4be026e4133c545de961417b1add3ac94462` (`project-validator.4139afa9eed975359c26.js`)

Independent signed20393 host qualification is in the desktop repository at `test/agent-cad-corpus/numeric-expressions/signed-r10-receipt.json`. It includes actual Save/sync, another-account denial, fresh Files reopen, visible Open/Close cancellation and eleven native Arc regressions. Initial named formula bindings are explicitly native-seeded fixtures, not public initial-binding authoring proof.

Legacy active-editor/tools, general regions/entity editing, broader constraint/reference coverage and dense scene responsiveness remain partial. Timeline allocation/disposal improvements reduce a measured isolated software-GPU sibling gap to approximately293ms, not a general latency guarantee. No kernel-default change.
