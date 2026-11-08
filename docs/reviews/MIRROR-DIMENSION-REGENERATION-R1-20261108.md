# Mirror R1: existing driving dimension edit/remove lifecycle repair

Source-only fix from bf8f096 (frozen actual R1); runtime8a4bc6c/Desktop9bdb3a512.
No tests/probes/TSC/build/browser or new PASS in this packet. Frozen public
Mirror driver/oracle/cases stay unchanged, including the actual diameter6 edit.

## Actual failure and source-confirmed cause

R1 completed initial real8-source Mirror, native .cad Save/server equality,
creation UndoRedo and original Point edit/regeneration. Then the registered
edit-closed-sketch-dimension requested the actual Circle's driving D4→D6.
It refused UNSUPPORTED: Invalid or unsupported stage/generator graph,
committed=false/possiblyCommitted=false. Parent preserved the exact receipt/log.
The failed candidate's numeric cache values were not captured, so this note
does not claim measured post-edit radius coordinates or an optimizer defect.

changeDrivingDimension updated/removed the ACTUAL native constraint and called
ParametricManager.finishTransaction(...,false). That finishes each raw
AlgNumSystem transaction/admission; it does NOT invoke SolveStage.solve and
therefore does NOT regenerate Mirror. The function serialized that warm draft
immediately. solveSketch checks the stage/generator graph BEFORE its own stage
solve, correctly refusing edited source with stale generated geometry.
Original equation D6 requires r3; the stale-cache transition path, not a radius
setter or relaxed graph policy, must be repaired.

## Narrow coherent source change

Only drivingDimensionTransition.ts gains a private ordered completion pass,
conditional on ACTUAL stage generators. No-generator behavior is unchanged.
Inside the existing PM transaction validation callback, before serialization:
invoke each real stage's prepare + SolveStage.solve(false) in original stage
order, allowing the native stage to regenerate its actual existing outputs.
This is one defined candidate construction phase, not retry/polish iteration.
Later stages see earlier stages' regenerated objects. Completed earlier-stage
parameter snapshots cannot be changed by later stages. Native generator
instance/source/output/index/stage pointers, order and serialized records are
captured and rechecked; no replacement generated IDs, weakened ownership,
declared cache flags, hidden re-generation model or authoring source bypass.

After all regenerations, require actual finite solve status and validate ALL
original retained/intrinsic equations, current domains and true admission.
Resolve their actual constants through the captured original resolver before
residual checks. Actual numerical/admission causes remain attached; resource
and ownership failures do not become mathematical infeasibility. Work is
bounded using the existing100000 Worker envelope.

The callback remains inside ordinary PM transaction rollback/cleanup ownership.
All workspaces are detached; neither the old accepted source nor its journal
can be published before normal independent candidate verification. Candidate
construction still passes existing geometry/expected-dimension-delta checks,
full solve/cold validation, actual dimension measurement, original-request
verification and existing Source/J/lifetime fences. No equation, tolerance,
classification, target semantics, formula guard, raw radius route, scalar
scanner or Native/Files/PM source code is changed. Both edit and remove use the
same corrected generator lifecycle. Gate's pending RadiusLength target/consumer
semantics must be preserved on root composition.

The PM's initial algebraic admission is still an earlier draft. Existing raw
preparation may itself refuse other more complex domain transitions before this
completion callback; this packet does not claim every multistage direction/
generator combination is qualified or modify global PM behavior. The complete
unchanged real workflow is the required acceptance; any further actual failure
must remain recorded rather than weakening the positive diameter6 case.
