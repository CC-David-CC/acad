# Common typed-parameter and sketch composition review

Reviewed exact combined CAD source `b3ccb284b3f6799a90f3ad0c8fe1e4f6aeb8fdf7` (lead receipt `78c476200` is test-only). The build owner's isolated R730 self-only-script fixture supplied app SHA-256 `f25eb80981fc622210365248c0cf6a37ab7cd293b51440b5bba154ada0b08599`, emitted sketch Worker `/static/sketch-solver.70e6d0f3d67d5c344da1.js` SHA-256 `ef5fc3b4009d9a10328868c0aaed94f5974eb5e6ad0cfad1b2feb6dc84c4463b` and test helper SHA-256 `d4a3e1bf1ea77cfd2825248ea06ba821df04f6e7c7bd3b5d8a934b91ef808a81`. All runs used separate Chromium contexts, normal application operations and local disposable projects. They used no live user credentials or account data and closed their own contexts.

- `ui-to-common-browser.test.cjs` takes the real typed four-hole bracket into its original sketch, changes the width annotation from the named `width` to named `height` using the normal UI, exercises sketch undo/redo and Save, replays history, and changes the common `height` definition to 40 mm. Both names remain `height`, the actual regenerated bounds are 40×40×20 mm, and a fresh native workspace retains those bindings.
- `ui-literal-to-common-browser.test.cjs` performs the same normal UI path with width changed to literal `120`. A subsequent common update leaves the width literal and height named, and the regenerated solid measures 120×40×20 mm. A wrong-dimension definition and an unknown named feature binding each refuse while preserving source, sketch bytes, history, metadata and model identity; journal undo/redo targets remain unchanged. Reapplying identical definitions is a no-op and retains source/sketch/history/model identity. Fresh native restore retains the mixed source.
- `bracket-material-composition-browser.test.cjs` creates a four-hole plate and V2 BODY/LID/LABEL enclosure, assigns three independent material/appearance roles, then restores a disposable native snapshot with a custom object name and nonidentity region translation. Shared physical updates regenerate plate and enclosure together; exact material metadata, role identities, operation origins and model placement matrices remain unchanged. Wrong-dimension failure preserves model identities, source, sketch, history, metadata and journal targets. Undo/redo restore the corresponding geometry and exact authored source/sketch/history with metadata preserved. Host save correctly requires review after geometry change; the normal rebind preserves all material/appearance assignments, object names and region transforms, and fresh native restore retains them.

These tests establish the listed cases, not a general proof of every mutation or physical print. They did not exercise a public beta deployment, signed Files account, a physical phone, or worker-authored generic L-profile extrusion. The separate review of typed-editor failures and its fixes is not replaced by these checks. Exact source preparation still includes bounded main-thread sketch/manifest inspection; no phone latency or full worker-only preparation is claimed.

The independent configuration lane reports that its planned versioned source adds base definitions, sparse formula overrides and active ID, while retaining the same guarded publication seams: exact candidate source, history/bindings, relevant sketch bytes, geometry roles/placement and manufacturing revision. Its future `typed-dependent-solve` must use the shared v2-aware evaluator, and old v1-only evaluation must refuse v2 rather than silently treating it as v1. This is an integration requirement, not tested configuration behavior.

With the existing matched loopback fixture and Node 24:

```
PUPPETEER_CORE_PATH=/tmp/codi-occt-release-control/node_modules/puppeteer-core \
JSKETCHER_TEST_URL=http://127.0.0.1:20260/ CODI_TEST_CDP=http://127.0.0.1:20261/ \
node test/review-common-typed/ui-literal-to-common-browser.test.cjs
```

Use the same environment for the other two test files. The fixture belongs to the build owner and was left running. For another run, first prepare the matched source and Worker/app build; the loopback ports above are not permanent services.
