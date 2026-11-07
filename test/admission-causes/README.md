# ARC28 — ephemeral, attributable sketch rejection causes

Source: `ae816711ebb865a4c38a3b7ced1e9615799eec58` plus the finite-row
qualification `c00f1746daa813735589401aeec41a37f3b767e6`, based on
`282c0f5ec`. This is a bounded diagnostic change. The optimizer, equations,
admission decisions, tolerances, last-valid policy, and native format are unchanged.

## Actual call chain and lost information

1. `AlgNumSystem.evaluatePolynomials` can find a nonzero constant row after
   reduction, marking a complete constraint rejected.
2. `admitOne` and ordered `rebuildAdmission` can reject a numerical trial and
   restore the prior parameter values. Their later accepted-only preparation
   or solve replaces the failed trial's `solveStatus`.
3. The shared signed-distance/line-relation admission validator throws an
   existing generic conflict error. `ParametricManager.finishTransaction`
   rolls back before its caller catches that error.
4. The headless transition catch previously emitted only `code/message`.
   Exact response-envelope validators and `transitionClient` also accepted
   only those two error fields.
5. Independently, `solveSketch` freshly collects ORIGINAL equations and checks
   their dimensional residuals and domains. Numerical `success:true` is not
   sufficient for a returned solution. This authority is retained unchanged.

The subsystem now retains an object-keyed cause for a rejected current
constraint. Trial diagnoses are captured before restore/preparation, cleared
on successful/redundant readmission or removal, and included in rollback
snapshots. A same-ID replacement or different stage owner gets no certificate.
These fields are never serialized into an authored/native document.

The headless admission callback captures the cause before PM rollback, preserving
its original exception. Public Worker failures retain the existing exact
`code/message`, optionally adding the bounded plain-data record
`cause: {kind, basis}`. The allowlisted pair is captured without getters and
copied/frozen. Unknown keys, unknown pairs, inherited fields and accessors refuse.
A failure without this optional field still passes the legacy contract.

## Meaning and limits

| kind | basis | Established fact; never a global infeasibility claim |
|---|---|---|
| `algebraic-contradiction` | `exact-reduced-row` | A finite nonzero constant row was found in this trial with no recorded approximate-reduction ancestor. This concerns the current reduced equations/fixed dependencies, not a formal arbitrary-precision proof or all possible branches. |
| `approximate-reduction-rejection` | `approximate-reduced-row` | The rejecting row has an approximate reduction ancestor. It cannot certify exact contradiction in the original equations. |
| `original-residual-failure` | `original-equations` | A fresh original-equation or explicit independent geometric residual failed its existing numerical tolerance. |
| `invalid-domain` | `domain-check` | An explicit existing geometry/relation domain guard failed. |
| `numerical-convergence-failure` | `solver-status` | The numerical run reported failure; another method/initial condition is not ruled out. Inherited `*_SOLVE_FAILED` pseudo-domain statuses map here. |
| `nonfinite-result` | `finite-check` | A reduced constant/result is nonfinite. A nonfinite constant must not be classified as algebraic contradiction. |
| `resource-limit` | `resource-check` | The inherited bounded directional resource check failed. |
| `retained-validation-failure` | `retained-validation` | The inherited rigid validator collapses residual and domain checks. Its missing distinction is preserved honestly. |
| `unclassified-rejection` | `admission-membership` | A current rejected constraint has no more specific retained diagnosis. |

No classification substitutes for the fresh original residual guard. No
additional solve, fallback, pose seed, tolerance relaxation or success override
was added. Failed candidates still preserve the prior native model.

## Evidence and acceptance scope

- Nine focused actual-source tests use the real nonvisual workspace/PM,
  polynomial code, native persistence and headless transitions. They cover
  exact/approximate row causes; object/stage ownership; removal, retry,
  revalidation and rollback; native metadata omission; a genuine finite custom
  nonlinear numerical failure; nonfinite constant classification; registered
  original-residual refusal; and strict failure-envelope capture.
- The custom high-frequency smooth-function control actually invokes the
  existing numerical solver; it has no fake solver/status injection. It is a
  component test, not a supported public Worker schema. Resource/rigid-collapsed
  status mappings have classifier controls, not a new end-to-end solver proof.
- The registered midpoint/distance diagnostic preserves the existing numerical
  compromise: internally `success:true` with nonzero original residuals. The
  independent original-equation guard rejects it, and an actual PM transaction
  restores exact native bytes. `fixtures.json` preserves the numerical status
  and original residuals; the optimization defect is not fixed or waived.
- Eight actual app-referenced production Worker jobs compare the same fixtures
  before/after. Valid solve/replay and a valid signed transition remain valid;
  original residual, exact-row, explicit-domain, signed-admission and replay
  refusals retain their original codes, now with distinct causes. Every Worker
  terminates and every original input remains unchanged.
- The claimed-accepted contradiction is an intentionally inconsistent negative
  request. Existing policy rejects saved `rejected` hints before solving; this
  fixture does not pretend such a source is an accepted regenerable design.
- Existing focused normalization, full mechanical corpus and real public
  Axis/Collinear/signed-distance regressions are run separately, with their
  original oracles and cancellation/rollback controls.

**Public Craft/signed-host boundary remains parent-owned:**
`closedSketchTransitions.ts:99` recreates a thrown Error with only code/message.
This branch does not edit it. Root must copy the validated cause and qualify
actual public-command failures on the combined source. These receipts establish
component and production Worker behavior; they do not claim that public Craft
callers already receive the new property, a signed host is updated, or ARC28 is
universally complete. No desktop/UI, Files, material or generic extrusion code
was changed; no public service was deployed.

## Reproduction

Use the repository's existing dependencies and Node. Heavy builds run on R730.
The focused actual-source build is:

```
node_modules/.bin/webpack --config test/admission-causes/webpack.cjs
CODI_CAUSE_WORKER_FIXTURE=/tmp/admission-fixtures.json node .build/admission-causes/system.cjs
```

`midpoint-fixture.json` is retained unchanged from the qualified function-aware
substitution diagnostic. `fixtures.json` includes it and real PM-generated
negative controls. To run the actual production Worker proof, first build the
headless Worker, isolated project validator, prism semantic Worker and actual
application (the existing `test/headless-line-relations/webpack.app.cjs` resource
alias), then serve the resulting `dist` on a private loopback fixture port:

```
JSKETCHER_TEST_URL=http://127.0.0.1:PORT/ \
CODI_TEST_CDP=http://127.0.0.1:19329/ \
PUPPETEER_CORE_PATH=/path/to/puppeteer-core \
CODI_SOURCE=SOURCE CODI_RECEIPT=/tmp/admission-worker.json \
node test/admission-causes/worker.cjs
```

`CODI_EXPECT_BASELINE=1` verifies unchanged failure codes and ABSENCE of causes
against the same pre-change production app, rather than accepting the new
behavior on an old build. Both runs record app/Worker/fixture SHA256 values.
See `pins.json`, `observed.json`, `evidence/` and `SHA256SUMS` for exact receipts.
