# Shared manufacturing publication component

The manager owns assignments A; Craft owns the existing authored journal J and accepted full-tip material token T. Assignment, reassignment, reviewed rebind and metadata Undo/Redo now use one Worker-prepared publication. First observers see all A/J/T installed. No-op preserves revisions and redo. Metadata travel does not evaluate Native geometry, solve, hash or publish models. Geometry entries keep their existing replay route. Drawing publication remains unavailable.

Large validation, detached capture, equality and incremental shared 8 MiB charging execute in the dedicated preparation Worker. Main uses bounded headers and private capabilities; received structured clones are privately owned, **not deep-frozen**. No caller `trusted` flag or byte count authenticates publication. Normal detached getters/save capture retain their existing behavior. Existing bounded source/model metadata hydration and structured-clone transport remain; this component does not measure browser long tasks or large-payload transfer cost.

The joint commit prepares journal batch, manager revisions/fingerprints, receipt and accepted-tip adoption before writing. No callback occurs between first write and complete A/J/T. Observers run afterward. A swallowed observer exception preserves existing emitter behavior; escaping notification failure or lost caller lifetime reports `committed:true`, with accepted state undoable. No rollback overwrites a newer observer-started operation. Worker cleanup failure preserves exact cause, rejects success and fences subsequent allocation for that client module's lifetime; reopening a window does not necessarily reload the shared module.

Run with Node 24 and reviewed workspace dependencies:

```sh
node test/manufacturing-publication/run-proof.mjs .build/manufacturing-publication-proof
```

The runner builds actual preparation, canonical hash/admission and validation code, executes 27 focused groups, retained geometry/metadata/display tests, six unchanged readonly assignment groups and TypeScript. It writes fresh receipts only. Relocated copies change import/receipt destinations, never assertions. One retained edge-Craft source assertion already fails on base `444c0e59c` because it hardcodes an older operation-kind list; the runner preserves and reproduces that baseline failure rather than changing it.

The service harness invokes actual PM functions and five actual Craft declarations with real lstream/batch code and genuine Node Workers. Accepted geometry/model/tip state and geometry replay are protocol fixtures; the replay delegate refuses instead of returning fake Native geometry. Generic custody tests use existing class/measurement admission doubles. Native-envelope Save/validation/Open is actual manager/Worker code into a new empty fixture; rebuilding accepted geometry after Open is explicitly a protocol transition. This is **not** signed My files/server sync, Native replay, UI, or full Gate 1 qualification. Root owns that later source-matched app test.

The diagnostic reply wrapper adds access-trapping proxies after a genuine Worker result solely to prove no main nested metadata-array traversal at publication. Falsy termination/listener errors are injected transport faults, not observed browser/kernel incidents. The 10,000-definition no-op/edit-budget control constructs and processes synthetic metadata inside Workers, not on UI.

Preserved development evidence:

- `before-first-worker`: harness incorrectly assumed `self.onmessage`; actual Worker registers `addEventListener`. Fixed only the new Node bridge.
- `before-empty-open`: test attempted restore into a populated fixture; the actual empty-workspace guard correctly refused. Corrected fixture setup without product bypass.
- `before-initial-reentrancy`: two candidate implementation failures let an initial lifetime callback move revision before request binding. Final source rechecks enclosure/generic request revision after that callback. These are unpublished candidate gaps, not live incidents.

Original four actual A/J/T BEFORE failures remain in the earlier manufacturing transaction proof. No Native/catalog/default/schema/codec/Desktop/deployment/network/FS-race changes are included. The Craft pipeline purpose option is a separately requested root observation-owner dependency; its pool implementation stays root-owned (original source commit `8011b2631`, composed here as `e87d1703f`).
