# Independent algebra review — 2026-11-06

Reviewed product `7757cf749f51bc82d79ee0d23b9be35e8305b0c8`, including final
focused test additions at `11d88120bfa78f3a0b3703f024b4a5192817816f`.
Read-only product review; no solver/product edits or broad suite reruns.

No newly introduced normalization blocker was established in the bounded source
review. The following safeguards are present:

- `Polynomial.cancelCommonNonzeroFactors` requires the actual singleton POW1
  function, actual parameter object identity in the certificate Set, exact
  zero constant, common occurrence in every monomial, and no approximation flag.
- Certificates are rebuilt from the current subsystem's active directional
  requirements, with matching `constraint.stage.algNumSystem` ownership.
  Rejected nonredundant constraints supply no certificate; retained redundant
  requirements still enforce their nonzero domain. Removal/rebuild does not
  retain a global certificate cache. Negative t is permitted by absolute-value
  nonzero tests; final endpoint/polar consistency remains separately checked.
- Approximation markers are monotonic on derived rows. Approximate scalar
  eliminations taint dependent rows and parameters. Substituted expressions
  propagate dependent taint to a fixed point; propagation is repeated after
  compaction and once after all substitutions. No algebraic pass follows the
  factor cancellation, avoiding a later approximation invalidating an earlier
  division. No concrete missed-ancestor path was established in this review.
- Headless `solveSketch` regenerates **original** equations and checks original
  residual profiles and geometry domains after solving. Those checks must remain
  authoritative; a normalized residual is not a replacement acceptance oracle.

## Concrete inherited issue: non-unit substitution through nonlinear terms

`Monomial.substitute` at polynomial.ts:268–270 changes the parameter and
multiplies the coefficient by k for every function. For a square, substituting
x=2y must multiply by 4, not 2. This method predates7757 and was not changed by
that patch. The actual-source counterexample is:

```
original: t*x² −4*t =0, authored alias x=2*y, t=10
correct:  4*t*y² −4*t =0  (y=±1)
current:  2*t*y² −4*t =0  (y=±sqrt(2))
```

At the valid original y=1 the current substituted residual is−20. At the wrong
derived root y=sqrt(2), the reduced residual is near zero while the original
residual is40. `usedApproximateReduction` remains false because it specifically
tracks discarded epsilon coefficients/offsets, not every inherited algebraic
correctness defect. Common-factor cancellation itself divides this already
incorrect derived row correctly; this is **not a new division bug** or a proven
public Worker acceptance exploit. Fresh original-residual validation would
reject that wrong result.

This limits any claim that untainted legacy reductions are globally exact.
Keep this as a separate, bounded algebra issue: qualify function-aware non-unit
substitution and original residuals before changing it. Do not disable existing
residual guards, blanket-mark unrelated rows approximate, or bundle a broad
solver rewrite into the AxisSymmetry qualification.

Run `node test/normalization-independent-review/power-alias-counterexample.cjs`
with the project's TypeScript dev dependency installed. An external test closure
can set `CODI_TYPESCRIPT_PATH`. The harness transpiles actual repository source
and loads its real Param, Polynomial, tolerance and math dependencies. It does
not replace the mathematics or simulate a browser. It deliberately proves an
inherited isolated algebra failure; it does not run public admission or assert
that a complete user design is accepted. `receipt.json` records the result.
