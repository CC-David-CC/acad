# Worker edge-treatment commands

Base85575f06cc71dbcc8b55bcde1468d3387f3a1272. Ownership is only the new
web/app/cad/craft/workerEdgeTreatmentCommands.ts and this new test directory.
Factory/default, CraftBundle, registry, desktop and journal hooks stay root-owned.

Construct createWorkerEdgeTreatmentCommands(ctx,submit,cancelEpoch). Public methods
are inspectWorkerEdgeTreatments, createWorkerEdgeTreatment,
inspectWorkerEdgeTreatmentHistory and editWorkerEdgeTreatment.

Discovery reuses inspectWorkerSolids and returns ready/reason/revision, unit/kinds/
limits, eligible targets and explicit unsupported rows. Targets contain bodyId,
actual featureId, exact engineRevision, immutable selections, edgeIds, budget,
canCreate/reason. No model or native handle is exposed. Admission requires an
actual current MWorkerSolid, measured valid single-solid evidence, matching ledger
snapshot/producer, advertised source edges and registered edgeTreatmentVersion1.
History and every current output retain one exact backend. Old builds, unknown
history and exhausted32-name quotas refuse explicitly.

Create accepts exactly revision/version/unit/engine/engineRevision/bodyId/kind/
edgeIds/size. Kind is fillet or chamfer-equal, size is literal finite(0,1e6]mm,
and1–16 distinct currently advertised IDs are allowed. Runtime SHA revision is
opaque and exact; no caller feature/producer ID, handle or native index is accepted.
All checks precede allocation/submission. captureSolidEdgeTreatment validates
detached data using an unused admission placeholder; only the generated project
counter ID is submitted, with producerFeatureId inferred from the current body.
Saved params are exactly the existing WORKER_SOLID_EDGE_TREATMENT_V1 contract.

Shared prepared publication owns evaluation. Document/service/stream/history/
storage/model/snapshot/unit/epoch currentness survives awaits; expected candidate
busy state is not resampled as stale. The prepared result must consume its source
and be one measured valid native single solid in the same build. Receipts contain
normal output/feature IDs, sourceBodyId, runtime descriptor/hashes, kind/size/edges
and volatile-workspace persistence. No automatic Save occurs. Cancellation targets
only the owned epoch; IDs/listeners/timers are released and committed markers kept.

History uses captureSolidEdgeTreatment, not unfinished journal imports. It returns
captured parameters plus index/canEdit/reason. Numeric edit accepts only revision,
index, featureId and size, then delegates frozen data/options to root's
authoredSolidEdgeTreatmentOperation after currentness checks. It creates no second
history/model representation and exposes unsupported hook/runtime status explicitly.

**PASS:18 routing/custody tests and TypeScript --noEmit** (source-checks.log,
typescript.log). Tests use explicit model/transport doubles only, no real geometry,
Worker, canvas or native seed. Covered: inferred producer/routing, own busy commit,
old/missing capability, strict data/membership, whole-part quota, detached inputs,
pending currentness changes/cancellation, invalid result/source consumption,
ID release/committed outcomes and numeric history delegation.

```sh
node --test test/edge-treatment-commands/coordinator.test.cjs
node node_modules/typescript/bin/tsc --noEmit
```

Actual native geometry, signed public app, size edit/Undo/Redo and Save/fresh reopen
remain **UNTESTED** until root integrates factory/default/public/journal hooks.
Then use genuine public mechanical-profile creation, advertised connector IDs,
independent native measurements, wrong/stale-edge refusals and exact runtime pins.
No public deployment, Files audit, filesystem-race or full Gate1 pass is claimed.
