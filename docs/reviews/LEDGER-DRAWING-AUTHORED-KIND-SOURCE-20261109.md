# Central ledger/authored drawing identity mapping: source repair

Exact base `7f20b38140eabe0ae393c2def20f952ac3290088`; BEFORE `0948eba93df783b6a7328c19ec707aabb17e0b0c` records Root's actual extent whole 76298 INVALID_OPERAND and the source-only sibling shell/countersink omissions. The first runtime failure/evidence and Root's exact pending SVG write context remain unchanged. This repair does not resolve or claim absence of that submitted file.

## Changed source

- Existing `modules/engine/solid/authoredSolidKinds.mjs` now exports frozen `AUTHORED_SOLID_TYPE_BY_LEDGER_KIND`. Its exact 14 genuine pairs, in prior authored-array order: profile-extents→WORKER_SELECTED_PROFILE_EXTENT_EXTRUDE_V1; profile→WORKER_SELECTED_PROFILE_EXTRUDE_V2; box→WORKER_SOLID_BOX_V1; boolean→WORKER_SOLID_BOOLEAN_V1; edge-treatment→WORKER_SOLID_EDGE_TREATMENT_V1; shell→WORKER_SOLID_SHELL_V1; blind-hole→WORKER_CENTERED_BLIND_HOLE_V1; counterbore→WORKER_CENTERED_COUNTERBORE_V1; countersink→WORKER_CENTERED_COUNTERSINK_V1; through-hole→WORKER_THROUGH_HOLES_V1; linear-hole-pattern→WORKER_LINEAR_HOLE_PATTERN_V1; revolve→WORKER_SELECTED_PROFILE_REVOLVE_V1; sweep→WORKER_SELECTED_PROFILE_SWEEP_V1; loft→WORKER_SELECTED_PROFILE_LOFT_V1.
- The existing frozen AUTHORED_SOLID_KINDS array derives from Object.values of that frozen closed map. All keys are noninteger strings, so declaration order preserves the EXACT old array order and membership. There is no new authored operation or feature admission.
- `solidLedger.mjs::readCandidateWorkerDrawingOrBores` imports that map and removes its partial local object. Both existing public wrapper functions reach this one private comparison. Actual ledger kind must be a string and an OWN key before its mapped authored type can match the captured target; inherited properties/unknown kinds do not provide fallback authority.

## Preserved boundaries

The only ledger changes are one import, removal of the duplicate map declaration, and canonical own-key/type comparison. Every existing owner/observation-only/currentness check, genuine output/model/feature/registry identity, handle/source/datum guard, build/runtime/capability/descriptor check, Native validity/single-solid/replay-metrics proof, actual Native reference/projection call, byte/alias budget, unresolved reason, cleanup and error outcome is untouched. No source/native math, request transport, cohort/default, quotas, ABI, new ports, file route or published schema changes.

A mapped kind is not Native or drawing/bore capability. Extents still need their actual profile extent/source guards and current drawing descriptor; Shell needs its actual cohort/geometry; countersink retains its new exact pair and cannot acquire a cylindrical THRU witness from this identity map. Unknown support remains unresolved/refused at its original geometry/capability layer. No nearest match, generic fallback, fabricated fact or framework was added.

The new ledger import points to an existing pure leaf already used by history/budget/read consumers. No new source module or OCI/bootstrap import is introduced and no hardcoded Native/bootstrap hash is altered. Normal source closure regeneration and the actual composed build remain Root's responsibility; no runtime asset or guessed hash is committed.

Source review/readback only: no tests, parser, probes, build, Native or browser execution. Root must review/cherry-pick the BEFORE then this repair, normally build the coherent candidate and rerun the complete unchanged extent workflow into fresh evidence. Independent artifacts run only after whole success. Countersink/Shell supported observation qualification remains separately scoped; no claim from this source repair alone.
