# Function-aware algebraic substitution — qualified bounded correction

Product: `75a2b053c850fb7fcdba6f1779c190acc8345fde`, based on
`11d88120bfa78f3a0b3703f024b4a5192817816f` (normalization product7757).
Only `polynomial.ts` and the necessary `AlgNumSystem.ts` reduction path change.
The independent inherited-issue review remains at58004ce2637bd8e64903a9ec86af03bc5560acaf.
No generic extrusion, scene, desktop, file format or original residual guard is
changed. No public deployment or new signed-host qualification is claimed.

## Corrected behavior

The inherited zero-offset alias path multiplied a term's coefficient by k
regardless of its function. For x=2y this turned x² into2y² instead of4y²;
it could also mishandle trigonometric arguments and repeated factors.
`evidence/original-residual40.json` preserves that exact baseline counterexample.
The corrected expression retains residual40 at the former false root.

Both zero-offset and affine reductions now use one transactional function-aware
path. Every affected row is prepared before any row or substitution pivot is
committed. Unsupported composition retains the original equations for numerical
solving. There is no coefficient*k fallback, pose seed or automatic solver retry.

- Identity renaming keeps the actual function singleton, including opaque
  functions. This preserves identity-based domain certificates.
- k=0 evaluates a finite function constant; invalid evaluation refuses the
  optimization without a partial rewrite.
- Nonnegative integral powers use binomial expansion with k^n scaling. The
  optional optimization is bounded to degree32 and1024 expanded monomials;
  exceeding it keeps the original numerical equation, rather than rejecting
  the user's input or inventing a truncated expression.
- Sine/cosine and their composed functions compose the argument and preserve the
  chain-rule derivative. Custom functions can supply an explicit valid
  polynomial composition. Missing/declined compositions return null safely.
- Repeated factors expand as products from captured terms, avoiding stale
  in-place array indices. The original Polynomial row object remains the origin
  map key; its authored constraint is unchanged.
- Approximation provenance marks touched descendants only. Nonzero multiply
  underflow is tainted, nonfinite transformations refuse, and a nonzero alias
  ratio/offset that underflows is retained rather than becoming an exact zero.
  Approximation tracking is not a claim of exact real arithmetic for arbitrary
  legacy numerical calculations.

## Before / after evidence

The registered native fixture is a horizontal segment from(0,0) to(10,0), its
midpoint(5,0), a locked origin, and a5 mm origin-to-midpoint distance. It is a
legitimate linked linear/quadratic system, with an independently known solution.

| Control | Before7757/11d | Corrected75a2 |
|---|---|---|
| Actual PM fixture original DistancePP residual |−12.49999999997; invalid original equation | Valid midpoint5 and segment end10 |
| Actual production Worker receives same valid native fixture | Refuses `RESIDUAL` | Accepts and replays the exact native result |
| Deliberately contradictory distance fixture | Refuses `RESIDUAL` | Refuses `RESIDUAL`; input unchanged |
| Opaque unsupported function + alias | Wrongly removes alias through coefficient heuristic | Keeps all original subsystem equations |

The before/after production Worker tests use the **same fixture SHA256**
`7d2b76cd19fb15c34077dc37e43122fc2639f654137042aeae93aaf45bd06038`.
These are diagnostic native inputs, not a claim of authoring those constraints
through a new public desktop command. The actual public regressions below are
separate and use their existing normal command paths.

| Qualification | Result |
|---|---|
| Actual-source algebra matrix |12/12; k=0,±1,2,.5, offsets, mixed/repeated powers, trig/custom behavior, derivatives, chains, origins, taint, atomic refusal, negative physical-length branches |
| Real nonvisual PM / native replay |2/2; supported original equations, unsupported composition retains pivot/earlier row, save/reopen, raw-residual refusal and exact rollback |
| Existing fourth-power test |PASS |
| Domain-certified normalization |9/9, unchanged original oracles |
| Mechanical corpus with reviewed harness5a9f22423 |228/228 |
| Reviewed harness AST/fault controls |5/5 |
| Actual public AxisSymmetry |150 Workers +17 fault/lifetime controls; consumed datum edit/native reopen |
| Actual public Collinear |92 Workers +15 controls |
| Actual public signed distances |74 Workers +14 controls |

All three public regressions use app SHA256
`95deb6ad4ea50d44753d0e64e56e24c38509bb0dd5e68c25e10c8455d9eef231`.
The actual sketch Worker SHA256 is
`3aeb3ea7b47d319e0788da4068d31188d3058ea52936c82b65ed266eb776b514`.
The unchanged before-runtime is app0964d5254a1bc34abad66db9ba142b45f759f23ea4b84c7c62e57689a3ab7d53,
Worker ea7a8febee7242c25d8a7a60fbf492678114a4fcba0d16f1af35489de2b8856d.
Receipts bind actual bytes, rather than treating a checkout label as runtime proof.

## Preserved separate solver limitation

`evidence/nonlinear-compromise.json` records a deliberate inconsistent linked
system before the existing fresh-residual validator rejects it. The numerical
solver reports `success:true` with error12.970588235294118 and violated original
DistancePP equations. This correction does **not** repair that status taxonomy.
The fresh original-residual validator rejects the result and the PM transaction
restores exact prior native bytes. The production Worker likewise returns
`RESIDUAL`, preserves input and publishes no successful solved model.

Do not remove/relax original residual guards or interpret numerical success as
constraint satisfiability. A separate bounded solver-status/classification task
is needed. This finding is not bundled into a solver redesign here.

## Reproduction and source closure

Build machine R730, Node24.19.0; source runtime directory:
`/mnt/data10tb/codi-function-aware-substitution-20261106-r1`.
Dependency closure is the existing symlink to
`/mnt/data10tb/codi-signed-distance-20261105-r2/node_modules`.
Source code is exact75a2. The broad run additionally uses the reviewed test-only
harness5a9f22423 (two mechanical fixture repairs plus its loader/config); it does
not change product source or weaken those test oracles.

```
node --test test/function-aware-substitution/algebra.test.cjs
webpack --config test/function-aware-substitution/webpack.cjs
CODI_ALIAS_FIXTURE_OUT=/tmp/midpoint.json \
CODI_ALIAS_FAILURE_OUT=/tmp/nonlinear-status.json \
node .build/function-aware-substitution/system.cjs
webpack --config test/headless-axis-symmetry/webpack.normalization.cjs
CODI_AXIS_FIXTURE=test/headless-axis-symmetry/fixtures/consumed-axis-zero-x-before.json \
node .build/axis-domain-normalization/test.cjs
webpack --config test/mechanical-corpus-harness/webpack.broad.cjs
node .build/mechanical-corpus-harness/broad/test.cjs
```

The app uses the existing separate headless-sketch, isolated line-relation
project, prism-semantic and app fixture build configurations. Native prerequisites
and dist were copied into this isolated stage with plain copies, never hardlinks.
No shared dependency-cache Worker output was overwritten. Committed text logs normalize trailing whitespace only; raw numerical values
and complete raw logs remain on R730. Full build logs remain
on R730 as `/mnt/data10tb/codi-function-alias-*-20261106-r1.log`.

The private fixture was loopback20710 through an SSH local forward. Actual
browser tests own their contexts and disconnect without closing shared Chromium.
For `worker.cjs`, set `JSKETCHER_TEST_URL`, `CODI_TEST_CDP`,
`PUPPETEER_CORE_PATH`, `CODI_SOURCE` and `CODI_RECEIPT`; set
`CODI_EXPECT_BASELINE=1` only for the unchanged before-runtime. Public regression
commands are the existing headless-axis-symmetry, headless-line-relations and
headless-signed-distance browser scripts with the same fixture variables.

An initial test request accidentally shared object references, violating the
existing tree-only input contract. The corrected fixture gives each request a
separate serialized native tree. No product guard was changed to accommodate the
harness. No signed Files, human drawing UI, whole-CAD gate or new physics claim
follows from these bounded algebra and Worker checks.
