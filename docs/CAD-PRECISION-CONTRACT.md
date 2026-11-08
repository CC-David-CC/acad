# CAD precision requirements and qualification boundaries

User clarification2026-11-07: intended work includes photonic chips and defect
manufacturing with features on the0.x nanometer scale. The user accepted
**0.001nm geometric error** as the target. That is1picometer =1e-9millimeter
=1e-12meter. Overall model extent and absolute coordinate offsets have not yet
been specified. Do not invent them or claim universal accuracy at that target.

## Separate contracts

1. Authored source identity: units, stored numbers/formula spelling, IDs,
   references, material assignments and ordered history survive native Save/Open
   exactly under their declared schemas.
2. Reconstruction stability: the current small-fixture source guard permits at
   most1e-9mm coordinate change between the actual returned candidate and fresh
   reconstruction. Repeatability is not geometric accuracy or physical validity.
3. Geometric accuracy: qualify coordinates/dimensions, intersections, topology,
   BRep construction and exchange against independent expectations at the user's
   0.001nm budget in a declared model-size/coordinate envelope. Agreement between
   two kernels or reproducing one wrong result is insufficient.
4. Derived representations: display/manufacturing/analysis meshes each have
   explicit approximation budgets and provenance. They do not redefine source
   geometry or automatically inherit BRep accuracy.
5. Physical/manufacturing uncertainty: process capability, material models,
   measurement uncertainty and simulated behavior require separate evidence.
   A numerical picometer budget is not a manufacturing/simulation guarantee.

## Present implementation is not nanoscale-qualified

Current mechanical qualification does not establish this accuracy. Selected
polygon profile resolution has a declared1e-4mm floor (100nm); canonical typed
rectangle binding has a1e-3mm lower domain (1000nm). The ordinary source-only
width workflow demonstrates a1e-6mm-wide sketch, but its Native extrusion is
explicitly refused below qualified profile resolution. A valid tiny sketch is
not proof of a qualified solid. Native/material/mesh fixture comparisons also
have separately declared tolerances. The replay guard cannot upgrade them.

No threshold changes here. Existing mechanical evidence retains its actual
units, sizes, build and tolerances. Unsupported domains must not silently weld,
clamp, rescale authored dimensions or claim success.

## Required precision work

- [ ] Declare supported feature sizes, physical extent, coordinate offsets and
      error budgets per operation/backend/representation. The0.001nm target is
      required; remaining operating-envelope parameters are unresolved.
- [ ] Separate numerical conditioning/stopping, geometric classification,
      reconstruction stability and manufacturing tolerances.
- [ ] Eliminate construction/replay inconsistencies before revising bounds.
      Orientation's observed2.3599383780492644e-8mm movement remains a failure.
      That is0.023599383780492644nm, or23.599383780492644pm.
- [ ] Evaluate explicit internal coordinate frames/unit scaling where justified.
      Keep one physical authored model and reversible attributable conversions;
      kernel numeric frames cannot become another editable design document.
- [ ] Derive scale-aware representability/rounding bounds for translated models
      and mixed small/large geometry. Refuse unattainable requests honestly.
      Do not tune tolerances merely to turn a failing fixture green.
- [ ] Qualify independent analytic geometry, interfaces/Boolean topology,
      parameter changes, Save/Open and STEP/core3MF exchange over the declared
      envelope. Report achieved error separately per representation/result.
- [ ] Measure Worker CPU/memory/cancellation at required quality; finer tolerance
      cannot silently remove lifecycle/resource bounds.

This informs existing C05/C09 precision competencies and later CAD work. It does
not claim current mechanical Gate1 proofs satisfy nanoscale accuracy or that all
physical phenomena can use continuum CAD representations.

## Required explanation when the target is not established

User instruction2026-11-07: if picometer geometric accuracy cannot be
established, state why. A success flag, matching kernels or repeated coordinates
cannot substitute for an independent accuracy argument and measured evidence.

For each assessed operation/backend/representation, record:

- Exact target, feature size, overall extent, coordinate offsets, units and build.
- Independent reference and measurement method, error metric and its uncertainty.
- Observed maximum error and cases exercised; do not extrapolate beyond them.
- Outcome: qualified within that envelope; measured target failure; unsupported
  feature scale; or unqualified because evidence/reference coverage is missing.
- Specific limiting cause with evidence: declared admission floor, configured
  kernel/solver tolerance, numerical conditioning/representation, algorithmic
  instability, export approximation or insufficient independent measurement.
- Whether a software/policy change can address the observed limit, or whether
  an inherent limit has actually been demonstrated. Do not claim impossibility
  merely because the current implementation fails or has not been tested.

A100nm profile admission floor establishes lack of current subnanometer feature
support. It does not by itself establish the coordinate accuracy of larger
admitted geometry. Conversely, stable serialization does not establish accurate
geometry. These claims must be reported separately, with honest unresolved cases.

## Per-design precision and mixed-scale clarification — 2026-11-07

The user clarified that large parts are not expected to have the same accuracy
as the smallest photonic/defect designs. A1m model containing0.007nm detail is a
desired mixed-scale case, not a promise of current implementation support.
The0.001nm budget therefore applies to the relevant fine design/region; it is
not a new uniform absolute tolerance for every large part or every display mesh.
Declare budgets and qualified envelopes per design/part/feature/representation,
and check interfaces between differently conditioned regions explicitly.

Representation alone does not rule out the stated example. Binary64 spacing at
1000mm (1m) is2^-43mm=1.1368683772161603e-7nm, substantially below0.007nm.
That is representable spacing, not accumulated computational error. Ill-conditioned
intersections, cancellation, solver stopping and kernel tolerances can lose the
available accuracy. A fixed coordinate type cannot prove end-to-end correctness.

Source references: ECMAScript Number uses IEEE754 binary64:
https://tc39.es/ecma262/#sec-ecmascript-language-types-number-type
GNU MPFR provides arbitrary-precision correctly rounded arithmetic:
https://www.mpfr.org/mpfr-current/mpfr.html

Higher precision is an available engineering option where necessary, with its
actual cost measured in Workers. It must be used by the relevant calculations,
not rounded immediately back into a double-only kernel under a misleading
precision label. Use local conditioning/explicit frames and reliable predicates
where appropriate; increased bit counts do not fix incorrect geometry semantics
or an unqualified tolerance policy. Each operation still needs independent
accuracy/validity evidence, explicit limits and truthful failure reporting.

## Preserve precision throughout authoritative computation — 2026-11-07

User directive: each geometry algorithm must preserve full available accuracy
until the end; there is no authorization to deliberately cut it early.

- Keep authored quantities/units/formulas exact under their source contract.
- Do not deliberately round coordinates, narrow numeric types, quantize geometry
  or discard small coefficients/intersections inside authoritative computations
  merely for display or convenience. Formatting belongs at an explicit output
  boundary and must not feed back into the design graph or geometric truth.
- Derive numerical stopping/classification budgets from the required result and
  declared conditioning/scale. A coarse hardcoded intermediate threshold cannot
  silently consume the fine design's entire error budget.
- Preserve source attribution and error/approximation provenance across each
  conversion. Derived display/manufacturing/analysis representations have their
  own explicit budgets and cannot overwrite the exact authored representation.
- Audit every advertised operation/backend for premature rounding/casts, fixed
  epsilon term dropping, early convergence and approximate intermediate geometry.
  Qualify the resulting whole operation with an independent reference; retaining
  a double type alone does not prove retained accuracy.
- Floating-point operations round during arithmetic. Do not promise mathematically
  exact real arithmetic until final output. Use better conditioning, reliable
  predicates, extra precision or exact arithmetic where justified by evidence.
  Report achieved error and limitations rather than equating bit width with proof.
- Keep expensive precision work in Workers with measured resource/cancellation
  behavior. Performance optimization must respect the declared accuracy contract.

This directive does not silently change existing qualified algorithms or their
thresholds. Identified premature-loss defects require coherent source repairs,
complete workflow regression and documented before/after evidence.

## Bounded authoritative early-loss repair queue

These are implementation requirements, not additional claimed qualification.
Keep them separate from display formatting and final declared approximation.

| Item | Current state | Required repair / complete-workflow proof |
| --- | --- | --- |
| Default constant two-decimal conversion | Source repaired1eaaed4; genuine UI/default workflow pending | Untouched noninteger Diameter default, actual commit, edit/travel/Save/Open; exact literal and independent radius relation. |
| `Polynomial.compact()` nonzero coefficient removal under fixed epsilon | Confirmed source behavior; unrepaired | Combine like terms without deliberately dropping nonzero represented coefficients. Preserve explicit finite/overflow/underflow handling and bounded expansion. Whole ordinary/small-coefficient dimensional constraints must remain attributable to their original equations; no threshold reduction as a substitute. |
| Two-term affine substitution replacing a small nonzero constant with zero | Confirmed source behavior; unrepaired | Preserve the represented nonzero offset through division or retain the original equation if substitution is not safely representable. Never introduce an exact-zero alias merely because the input falls under epsilon. Qualify positive/negative small offsets, real locks/aliases, contradictions, reedit/travel/native persistence. |
| Constant-row redundancy near zero | Existing approximate classification with provenance | Keep satisfiability uncertainty, units/scaling and original residual checks explicit. Do not call a nonzero constant an exact algebraic identity. Derive any final acceptance from the declared physical-error policy; do not rewrite the authored equation. |
| Repeated optimization of disconnected accepted geometry during append | Actual R6 difference~0.00196pm; unchanged guard rejects | Solve the genuinely new disconnected component and independently prove retained original equations/admission/ownership at exact captured coordinates, plus fresh whole-candidate replay bounds. No coordinate overwrite, quantization or relaxed exact preservation. |

A repair to reduction affects every supported constraint family and therefore
requires a coherent source composition followed by affected complete application
workflows. It must not be slipped into a default-dialog or singular-initializer
patch, whose narrower evidence could not qualify the shared change. The design
remains one authoritative physical source; no rounded secondary truth is added.

## Scoped source/coefficient accuracy qualified — 2026-11-08

`test/small-polynomial-terms-workflow/evidence-r1` freezes a complete70-row,
three-setup/six-native-save/open PASS on actual84fe435/Desktop640279b9f.
Independent Fraction/source analysis checks26 observations against the frozen
1e-9mm=0.001nm=1pm geometry budget; maximum measured error is0mm in this corpus.
Tiny2^-43mm signed offsets/aliases and named edits persist; factor2^-40 times
1,000,000/500,000/750,000mm preserves the independently derived subnanometer
short Segment. Exact-zero redundancy differs from accepted nonzero residual;
out-of-policy constants retain actual original-equation refusal causes.

This qualifies these source arithmetic/persistence cases, not nanoscale Native/
BRep/topology/intersection/mesh geometry, all coordinate envelopes, nonlinear
convergence, underflow/high-power cases or physical accuracy. The existing
1e-6mm residual policy is separate from the stricter geometry-budget check.
The broader nanoscale limitations above remain open.
