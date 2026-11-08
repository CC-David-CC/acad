# Preserving represented small equations: coherent source checkpoint

Source only. No build, typecheck, solver probe, focused test or browser run was executed in this lane. Root must compose the normal app and run the prepared complete public workflow before any after-fix qualification claim.

## Source contract

`Polynomial.compact` removes only represented exact zero coefficients. Every finite represented nonzero coefficient remains, including subnormals. Optional like-term/constant sums that overflow remain separate terms; no epsilon is used to redefine an equation. Ordinary binary64 arithmetic still rounds, and this patch is not an arbitrary precision or compensated-polynomial implementation.

Two-term elimination retains the complete represented constant offset. A nonzero ratio/offset or known power/product that underflows cannot silently become an exact zero rewrite. Optional affine and one-term reductions stage all affected polynomial copies before publication; unsupported/nonfinite/underflow/expansion cases retain the original equation for the existing solver. Actual mandatory external-stage fixed values cannot be left as free variables: an unrepresentable fixed substitution explicitly refuses `UNSUPPORTED_NUMERIC_REDUCTION` before row mutation. No source literal is changed, solver threshold lowered or alternate solver introduced.

A reduced row with no remaining variables earns exact redundancy only when its represented value is zero and it has no approximate ancestor. A nonzero row is retained privately with source ownership, then the complete original constraint is reevaluated after elimination and alias back-substitution. A row accepted under the unchanged registered final residual policy is accepted/nonredundant, never falsely exact/redundant. Failure stores actual original values, normalized residuals/units/tolerances and typed cause. Source schema identity and supported policy are checked; unknown policies refuse, without inventing physical units. Budgets are 65,536 original rows and 100,000 parameter/term/evaluation work units per validation pass; resource refusal is not geometry invalidity or infeasibility.

The registered residual/domain implementation moved unchanged to `constr/registeredConstraintPolicy.mjs`; the original headless path re-exports it. Existing length residual tolerance remains 1e-6 mm = 1 nm; angle tolerance remains 1e-8 rad. These are final acceptance policies, not permission to erase coefficients and not a claim of 1 pm geometric accuracy. `hasRegisteredResidualPolicy` explicitly bounds deferred admission to existing registered schemas; generic defaults do not authorize unknown schemas.

A private module Symbol carries validated original-residual/domain/nonfinite causes on an owned failed solve status. It cannot arrive as a public JSON trust flag or turn a failure into success. The same strict cause vocabulary is retained. Enumerable private metadata survives existing owned snapshot spreads; reset/solve clear it, derived snapshots/rollback retain it, and projected-domain status replacement preserves the actual original failure. The new deferred map is part of every derived transaction/reclassification snapshot.

## Preserved boundaries and limitations

The canonical intrinsic-first order, authored admission priority, DistancePP initialization, original domain equations, numerical stopping, optimizer tolerances and original validation remain unchanged. No `solve.ts`, `io.ts`, primitive transition, Native, build/catalog/default or document format changes occur here. Rough preview is not final admission: deferred original checking is on the fine solve path used by human and Worker admission. Existing readmission still excludes rejected constraints until its ordinary retry transition.

Full-precision arithmetic cannot be established from this source repair. Floating-point summation/conditioning and the unchanged final tolerances remain separate limits. Public APIs do not expose arbitrary high-power polynomial authoring, so optional-underflow branches have no fabricated public workflow coverage. A numerical failure is not proof that an exact system is infeasible. The forthcoming tiny-point source checks prove exact represented source offsets; the amplified LengthRelation case measures an actual geometric consequence without claiming nanoscale BRep support.

## Required complete application acceptance

Use `test/small-polynomial-terms-workflow/` only after a normal source-matched app is ready. Genuine public authored datum/Points/Segments, inspected IDs, original equation inspection, edits/refusals/travel, typed signed source, My files sync and fresh native Open must remain one coherent workflow. The independent artifact oracle must report both actual geometric error and accepted-versus-redundant classification. Keep first failures, including any unrelated earlier candidate/replay boundary; do not loosen an oracle to obtain a pass.
