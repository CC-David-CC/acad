# Edge-treatment command admission for common selection plan v2

Owned production file: `web/app/cad/craft/workerEdgeTreatmentCommands.ts`. The only existing test change is `test/edge-treatment-commands/fixture.cjs`, adding the real version1 field that its older routing double omitted. All other new tests/evidence are here. No catalog, shared ledger, Worker/native/default/factory, UI, service or public request-schema edits are authored by this lane.

Base root `022f1dca7930875fd83b12cce3aa196639528486`, with approved catalog prerequisite `07a1e515e` (local cherry `d933f144b`; already integrated by root as `ab05fe0fe`). Current qualified source commit `70f8d648f`. Root should integrate only this lane's commits after the catalog prerequisite, not repeat that prerequisite.

The current body's **registered build** chooses selection plan version: explicit `selectionPlanVersion:2` for the new real `OCC_BOOLEAN_HISTORY_BUILD`; legacy mechanical build defaults to1. Plan versions must match exactly. Missing/unknown/mismatched versions refuse as `UNRESOLVED_SELECTION`, without feature allocation or submission. Genuine legacy snapshots already carry version1; the old test-double omission is not preserved as a product format.

V1 continues to require its real top-level region. V2 requires frozen dense source contexts, each exactly `{kind:'sketch-profile',featureId,regionId}` with a distinct positive safe origin ID and nonempty bounded region. It accepts1–32 actual contexts; each frozen advertised edge must have an originFeatureId present in those contexts. Context/edge accessors are rejected without invocation. Frozen containers/rows, dense IDs, uniqueness and existing512-edge/16384-ID/8192-region bounds are enforced. An initial prism's sole origin must match its producer. V2 carries **no top-level regionId**; a fabricated one is explicitly rejected. No region union or origin is synthesized.

Creation requests keep the exact existing fields and infer the producer from the current target model, **not** one of its construction origins. Authored feature IDs/native handles/source-context overrides remain unavailable to callers. Existing immutable snapshot/runtime/history/session bindings, cancellation, candidate replay and committed-outcome behavior remain unchanged.

## Evidence

28 routing/custody tests PASS: the unchanged18 existing tests plus10 new v2 groups using the actual imported registered build/cost/history helpers. They cover discovery without allocation, mixed-origin fillet/chamfer routing, initial contexts, version/context/origin/refusal bounds, immutable metadata/accessors, exact request fields, snapshot replacement, cancellation and committed outcomes. `coordinator.log` retains the complete run.

These are explicitly **routing doubles** for the model, geometry metrics, private selection snapshot and submission owner. They do not fake or qualify real kernel output, genuine Worker execution, native shape creation, source provenance, public browser authoring, history/Save/reopen or an entire CAD gate. Existing actual component qualification remains separately pinned and is not relabeled here.

Full repository TypeScript check passes exit0 (`typescript.log` empty), from a fresh archive of source70f8d648f on R730 with retained code-only dependencies. No native/dependency rebuild or installed service change occurs. The private stage is `/mnt/data10tb/codi-boolean-history-edge-commands-20261106-r1`; its node_modules is a symlink to retained `/mnt/data10tb/codi-worker-sketch-view-20261105-r11/node_modules`.

```sh
node --test test/edge-treatment-commands/coordinator.test.cjs test/boolean-history-edge-commands/coordinator.test.cjs
node node_modules/typescript/bin/tsc --noEmit
```

Use Node24 and the repository's TypeScript dependency. These checks compile/invoke the actual facade with the real engine catalog; only the explicitly labeled boundary doubles replace native/public integration.
