# Current solid producer discovery: source handoff

SOURCE ONLY / UNRUN, based on exact Root4a6ff8e. BEFORE is retained separately.
Only `web/app/cad/craft/workerSolidCommands.ts` changes product source. No tests,
TSC, parser, probes, build, Native or browser execution occurred. Root owns the
complete unchanged C11 workflow/regression and final qualification.

`inspectWorkerSolids` now adds the same frozen
`producer:{index,featureId,operationType}` to each actual output and its body
entry (where nonempty). Empty outputs carry their actual producer too. Index
is the actual model originatingOperation; it must be a safe nonnegative integer
within the captured history and at or before the accepted pointer. FeatureId
is the actual model own-data safe positive number and must equal the own-data
params.featureId of the actual indexed row. OperationType comes from that row's
own-data type and must belong to canonical AUTHORED_SOLID_KINDS. No body ID,
Native ordinal, selection role or caller flag is parsed into provenance.

The inspection captures modification stream/revision, state/history references,
length and pointer before service/model reads. A separate bounded first pass
captures EVERY retained model producer plus actual row/params identity and field
values before metrics/display callbacks begin. Existing registry identity,
measurement/runtime, placement and display projection checks are retained.
Producer/current-state checks run before and after those getter callbacks and
again after derived budget/capability DTO construction. A same-state in-place
change to a producer index/type/params/featureId, a replaced row/stream/history,
changed pointer/length or replacement service cannot bless stale provenance.
The result uses the final current readiness/revision. Changed currentness aborts;
unsupported/invalid actual producer membership refuses.

No whole history copy/hash, async operation, Native call, geometry computation,
additional saved state, new operation admission, journal or history-control
editing-policy change is introduced. The new pass is linear in the existing
bounded model list, with only retained producer fields captured; all old
inspected engines, budget, metrics, selections, placement and output meanings
remain. The additional canonical vocabulary import already exists as a shared
Main source module, not a new Worker/native emitted resource or API.

Dxf owns the public example/driver/checker update: discover the actual output
through inspect-worker-solids, retain the exact producer tuple, independently
compare its operationType/index/featureId with public accepted operations and
require matching geometry revisions across reads. Readonly captures may then
independently validate against actual saved/native history. Do not broaden
inspect-worker-history-controls to make discovery succeed. Root owns source
custody roster update for this one actual TS file, normal build and unchanged
whole behavior including real union, unresolved references/repair, travel,
native Save/server/freshOpen and SVGs. Producer membership is not a proof of
Native topology, drawing availability or manufactured conformance.
