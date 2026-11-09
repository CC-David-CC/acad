# C03 EqualLength and ratio-one/difference-zero: source contract

SOURCE/DOCS ONLY, 2026-11-08. Audited Core snapshot
`6cb0975e65920611dec6557609128bc007cab7ea`. No product changes, tests,
probes, TSC, builds, Native or browser execution. This proposal is not another
qualified family/exercise. Ordinary21/21 acceptance and broader open Gate1 are
unchanged. An actual pending tangency workflow failure takes priority.

## Actual source, physical math and domains

`web/app/sketcher/shapes/segment.ts` saves ordered EndPoints A/B. Private native
angle theta and signed T are numerical parameters, not additional authored data.
`syncGeometry()` derives atan2/positive hypot, but an admitted Polar chart can
represent the same endpoints with negative T and theta shifted by pi. Original
`ANConstraints.Polar` equations are:

```
Bx - Ax - T*cos(theta) = 0
By - Ay - T*sin(theta) = 0
Lendpoint = hypot(Bx-Ax, By-Ay)
EqualLength:     abs(TA) - abs(TB) = 0            [mm]
LengthRelation:  abs(TA) - f*abs(TB) - d = 0      [mm]
```

Physical length equals abs(T) only with original Polar/domain validation.
`ANConstraints.EqualLength` already delegates to `LengthRelationDefinition`
with factor1/offset0. `constr/lengthRelation.ts` uses Math.abs and derivative
Math.sign. Thus TA10/TB-10 correctly satisfy current equality. Replacing this
with TA-TB would incorrectly yield20: a counterexample to a wrong replacement,
**not a current signed-equality bug**. Derivatives are sign(TA), -f*sign(TB)
away from zero. Do not square the offset equation (extra/sign-lost solutions),
freeze sign(currentT), or impose blanket positive T. Existing SegmentLength
retains its signed-T equation and positive scalar domain; meaningful signed
coordinate zero/negative values remain unchanged.

The existing ordinary Segment numerical envelope is length>1e-9mm, not a
mathematical impossibility theorem for smaller lines. f is dimensionless,
finite/nonnegative. d is signedmm; existing registered finite-constant policy
bounds abs(d)<=1e6. No new factor, coordinate, source or positive-offset cap is
proposed. f0 fixes LA=d but retains both ordered source references; B's absent
polynomial term grants no B-motion authority. d<=0 then cannot support a
noncollapsed A, but numerical refusal is still not a global infeasibility proof.
Reversing a nonzero-f ratio needs independently justified `(1/f,-d/f)`; no
rounded reciprocal rewrite/dedup is proposed.

EqualLength is value-free/symmetric. LengthRelation(1,0) has the same physical
restriction but a distinct authored schema/constant record. Equality has no
“edit equality to12” action: drive a genuine length or coordinate in its
component instead. Nonzero ratio/offset evidence does not qualify equality1/0.

## Registered producers, readers and shared routes

| Source | Current behavior / boundary |
| --- | --- |
| `sketcher/actions/constraintActions.js` EqualLength | Genuine human action creates actual EqualLength rows over consecutive selected Segment pairs in one group. Not a closed-source command or observed human-gesture proof. |
| Same file LengthRelation; `actions/lengthRelationAdmission.js`, `lengthRelationOperation.js` | Genuine numeric dialog/actual-ID operation, actual objects/stage/Params, original equations and PM transaction. New same-target-stage generated members are refused; retain meaningful human multistage/carry/prior-rejected recovery. |
| `lengthRelationOperation.js` inspection | Actual endpoint physical lengths and actual LengthRelation rows, bounded currentness. Does not discover EqualLength rows or implement row edit/removal. |
| `cad/craft/closedSketchTransitions.ts`; Desktop `apps/system/jsketcher/closed-sketch-commands.mjs` | Existing `applySketchLengthRelation` / `apply-closed-sketch-length-relation` creates actual LengthRelation from revision, faceId, ids, factor, offset. No dedicated closed EqualLength create/remove or ratio-row edit/remove route. |
| `headless/lengthRelationTransition.ts`, `lengthRelationAffectedGeometry.ts`, `capturedGeometryScope.ts` | Original-source capture; real warm admission; original source plus actual row; authenticated original-polynomial/generator affected scope; original/cold/second-cold and captured-equation/private-auxiliary proof. Second Worker reconstructs complete original request, not merely candidate validity. |
| `headless/drivingDimensionTarget.mjs` | EqualLength/LengthRelation are unsupported scalar driving targets. No borrowed length/diameter field or fabricated locator may edit/remove them. |
| Typed policy/coordinator | Numeric records can carry/read where existing typed domain qualifies; named factor/offset and unrestricted typed relation creation are not advertised. No current generic typed EqualLength/LengthRelation travel branch. Never erase expressions to make a request eligible. |
| Native IO, SolveStage, AlgNumConstraint | Original registered schema, raw object/constant records, actual stage ownership and replay. No saved equal/status flag or second relation graph. |
| `actions/lengthMeasurementPreparation.js`, `lengthMeasurementRoles.js`, `headless/lengthMeasurementTransition.ts` | Existing LinearDimension keeps actual endpoint IDs/offset; physical value and reference/driving role are derived. Reuse this model and existing actual driver editing/presentation; create no competing equality ruler/value cache. |

An old CAD wrapper's `parametricManager.entityEquality` name is not evidence of
an active modern route; no reachable defect is claimed from that old reference.
Ordinary untyped sketch-byte travel can replay real inserted relation rows; this
is not proof that independent row editing/removal or typed mutation is present.

## Source-confirmed certification gap; separate unexecuted concerns

`lengthRelation.ts` supplies only four FreeFunction arguments for primitive
Math.abs. `constr/polynomial.ts` defaults certifiesExactFixedValue to false when
the optional fifth callback is absent. Fixed elimination therefore marks even a
finite primitive abs evaluation approximate. `AlgNumSystem.prepareRaw` credits
constant zero as exact redundant only when usedApproximateReduction is false;
other constant rows enter deferred original validation. The special existing
impliedByLockedEndpoints path is for SegmentLength, not EqualLength.

Concrete reduction case: actual prior registered rows fix TA=10 and TB=10
exactly; substituting those values into coefficients1/-1/0 loses the exact
redundancy certificate solely at primitive abs. A validated deferred row can
remain accepted-nonredundant. This is a source-derived certification gap, not an
observed public EqualLength failure, geometry drift or claim all equal rows
misclassify. Proposed minimal repair, **not implemented/approved here**: certify
primitive Math.abs for finite represented binary64. Do not certify the composed
abs(k*x+b) closure merely because the result is finite; multiplication/addition
may round and need independent proof. Preserve approximate provenance and all
original domain/residual checks.

That repair alone does not establish free transitive AB+BC=>AC redundancy.
Current abs function atoms are nonlinear to this reducer, not ordinary affine
elimination terms. This remains a required qualification question, not a
reproduced defect. If a complete flow exposes it, review a bounded certificate
over actual original |T| function atoms/owned Params and exact coefficient
operations/retained rows. Never infer dependence from one small residual, local
Jacobian/current sign, a fake classification flag or length squaring. No global
rank/reduction rewrite or arithmetic-exactness claim is proposed.

## Smallest shared operation proposal, pending review

Reuse real EqualLength/LengthRelation schemas and the common measurement,
affected-scope/captured-equation pipeline. No arbitrary schema execution API.
Before code, root chooses final command names; sufficient request shapes are:

* Value-free equality creation `{revision,faceId,ids:[actualSegmentA,actualSegmentB]}`.
* Equality removal `{revision,faceId,target:actualInspectedRelationLocator}`.
  Locator is discovery-local to exact source revision, not a persisted index or
  caller-owned equation/geometry.
* Existing ratio creation unchanged. Ratio edit/removal, if approved to complete
  its lifecycle, binds the actual row/schema and both constants. No silent
  migration to EqualLength or generic dimension mutation.
* Discovery reports actual schema/source references/raw constants/fresh status
  and cause/physical-mm measurements/mutation support and reason. No persisted
  equivalence class, branch, measured value or status cache.

For new closed equality only, the same/reversed pair can be a validated no-op
when exactly one current qualified EqualLength row exists. Recheck actual source,
row, ownership/admission/currentness and preserve redo; ambiguous duplicates are
not silently selected. This does not change human fresh-row/recovery behavior.
Actual EqualLength versus LengthRelation(1,0) is distinct intent and a real
redundancy case, not a cross-schema no-op. AC transitivity is also a genuine new
redundant-row case. Removal/reinsertion are real journal operations each.
Existing monotonic allocator reservation policy stays explicit on refusal;
never drop all counters or reset allocation to hide a gap. Bound identifiers
and typed unsupported fields must not be replaced numerically.

## Lifecycle/invariants and numerical interpretation

| Transition / state | Required contract |
| --- | --- |
| Absent -> prepared | Capture original source, revision/generation/frame/definitions/services/owner before awaits; authenticate actual Segment/Params/stage, not caller geometry or a solved candidate. |
| Prepared -> accepted | Original equations/domain hold; a genuinely independent restriction reduces actual component freedom. Derive admission freshly, never n-minus-row-count. |
| Prepared -> redundant | Existing retained equations prove dependence in actual domain. Current equality/residual alone is insufficient; new redundant row differs from validated no-op. |
| Prepared -> rejected | Preserve original domain/residual/resource/currentness cause. Solver failure is not an infeasibility theorem. Keep prior accepted source/history/body/J/resources under exact allocator policy. |
| Under/full | Include unrelated Point freedom. Full is an actual original-equation rank/geometry assertion, not a UI row-count label. |
| Other length edit / reverse / rotate | Preserve physical relation/raw constants/original Polar/ordered requested endpoints and untouched source. Private charts may differ; save no chart flag. |
| Remove / UndoRedo | Operate only on actual row; exact historical bytes/IDs return with independent proof. No optimizer-output copyback into an invalid candidate. |
| Save / fresh Open | Validate actual registered source/ownership/domain before adoption. Preserve stages/IDs/raw literals/definitions; refusal retains prior document. |
| Stale / cancel / failure | Existing source/lifetime fences and own candidate cleanup; no foreign/accepted owner cleanup, no uncertain write blind retry. Stored source and replay inspection are separate observations. |

Ordinary nonzero lengths avoid the abs cusp; numerical/conditioned local failure
still reports the actual cause. A tiny nonzero row is not an exact identity.
Current relevant physical-coordinate budget is50pm=0.05nm=5e-8mm. Existing
registered length residual allowance1e-6mm is a different criterion, not achieved
geometry accuracy. Exact IDs/intent/constants/archived bytes/dependency proofs
are not approximate comparisons. Preserve full computation precision and existing
policy thresholds; no early cuts/new limits. No universal nanoscale/BRep claim.

## One complete public lifecycle and independent truth plan

Prepare one coherent registered-command driver after source review, not isolated
helpers. Author a real anchored rectangle/extrusion plus actual free ordinary
Segments A/B/C and unrelated Point Q in the captured source. Use actual inspected
IDs only. Keep the native suffix fixed during relation-only controls; that does
not claim equality-to-BRep support.

1. Publicly lock Segment starts/directions while retaining three scalar length
   freedoms and Q's two coordinates. Establish independent rank from original
   equations. Apply actual EqualLength AB from unequal lengths, then BC. Require
   equal physical lengths, intended affected source, unchanged unrelated source
   and actual Native volume/bounds/material/void points.
2. Drive A with a genuine existing length/dimension; B/C follow. Retain starts
   and directions. Free Q still contributes two freedoms; fix Q through the
   actual public command before a full assertion. Create/read the existing
   native ruler, which follows endpoints without an extra equality value.
3. Add actual AC as transitive redundant. Separately add LengthRelation(1,0) to
   an equal pair and require actual cross-schema dependence/raw1/0 identity.
   Include fixed10/10 dependence for primitive abs certification. If fresh
   admission cannot produce the required state, preserve the full-run failure,
   not a duplicate-only substitute or source-derived success claim.
4. Request genuine contradictory B length against fixed A10/equality. Preserve
   truthful refusal and exact prior state. Remove only the actual inspected row,
   independently edit a length, then mixed UndoRedo across create/removal/edit.
   Check no-op with redo, stale/unknown targets and positive-length zero/negative
   refusal without disallowing legitimate signed-coordinate zero/negative edits.
5. Live reversal uses genuine signed endpoint-dimension edit10 -> -10 with
   retained actual raw axis rows/start/Y, counterpart physical length10. Do not
   force hidden T or seed source. Validate actual chart if genuine evidence
   exposes it; if negative warm T occurs, original/cold physical equality must
   remain correct. Rotate/move a free equal component with actual operations;
   do not lock every endpoint and substitute unrelated locks for equality.
6. Three normal `.cad` Save/server-byte-sync/fresh Open cycles: initial equality
   plus1/0; after length/reversal/removal/recreation; then reopened reedit/mixed
   travel. Retain actual archive bytes, raw rows/definitions/IDs, source/driver
   and runtime pins. Unknown write settlement remains unresolved until actual
   commit observation, not a generic refusal followed by retry/forced cleanup.

After the complete workflow, an independent archive/source oracle uses
Fraction/Decimal arithmetic and actual public observed endpoints. Check original
signed-coordinate restrictions, physical length equality, original unsquared
ratio/difference (high-precision sqrt for nonzero d), raw actual schema/constants,
unchanged stages/IDs/source, exact historical bytes and fixture original-equation
rank. Squared lengths are an independent equivalent equality check for
nonnegative lengths, never replacement authored math. Stored source and cold
inspection each meet the frozen50pm physical coordinate bound where the fixture
determines coordinates; replay agreement alone proves no accuracy. Native suffix,
archive/byte equality, measurement role and solver classification remain separate
claims. No production math/provider expected geometry computes oracle truth.

## Existing evidence inventory: no scope inflation

* `test/line-orientation-public-workflow/evidence-r12` is actual orientation
  proof; its LengthRelation factor0 fixes lengths, not explicit equality1/0.
* `test/length-relation-cold-candidate/{README.md,desktop-driver.mjs,oracle.mjs}`
  is prepared source-only ratio2/offset5 lifecycle. No whole receipt there proves
  explicit equality1/0. Historical1e-9mm wording is not current policy.
* `test/current-solver-report-workflow/evidence-r2` actually proves its report
  ranks/states, with duplicate SegmentLength redundancy, not EqualLength.
* Desktop `test/length-measurement-public-workflow/evidence-r3` proves actual
  ordinary roles (Core33b8aa35.../Desktop4c4862b7...,59rows/3native JSON files).
  Reuse that model; it does not prove equality, all human gestures, arbitrary
  typed scalar relations or this proposed `.cad` equality lifecycle.
* Older `test/webos/equal-length-worker-browser.test.cjs`, mechanical component
  and held-reply transport fixtures retain their original versions/scopes. Names
  or synthetic hooks are not new complete public lifecycle receipts; none ran
  during this audit. Existing Radius/EqualRadius/PL/projected/coincidence and
  ordinary exercise proofs remain qualified in their own scopes.

Pending decision: approve minimal genuine shared equality lifecycle/primitive
exact-abs certificate and whether ratio edit/remove/typed scope belongs in this
packet. Review transitive original-function dependence before larger algebra
changes. Freeze coherent source/driver/oracle, then root alone composes a normal
build and runs the complete workflow. Preserve the first actual failure; do not
narrow a required ordinary state out of the family to claim completion.
