# Orientation replay candidate phase audit — 2026-11-07

This is a source-only audit with read-only inspection of already completed real public workflows. No solver, tolerance, product, driver or test change was made here. No test/probe/build/browser execution was performed for this audit. The reviewed repair is root commit `e95c377fe0dea6d5f69a2776cbbe5544c0d585d4`; application qualification remains the parent's complete workflow.

## Observed failure and custody

The unchanged public driver SHA256 is `868b15b282edb28eeed41040ae0944978fcf88c9f0f0d3f3ab48d4a62c720b47`.

- R2 portable receipt: `test/line-orientation-public-workflow/evidence-r2/receipt.json`, SHA256 `528a9446418b8550d048b608bcf9a31d942abbd8f1e556fd4cebe7c5cee2ce3c`. The current driver reached 66 rows, then the mixed Parallel group failed `CURRENT_GEOMETRY_MISMATCH`. This was the existing same-direction segment, not the new partial member.
- R3 diagnostic receipt: original `/tmp/codi-acad-orientation-proof-r3/receipt.json`, SHA256 `1c9a0c5d4272b2ffb2ffcd92b773909d75360773f13ce5095656e1927c5f4ca8`. Compiled ACAD `e01f49595aabbcdcb21f7c38729b6180967e46e9`, Desktop `c12ccbe1825507a0f1411a5dae71aaa867d3c131`; unchanged driver and no numerical policy changes. Again 66 rows, then failure. The raw receipt is retained by the parent; this document does not duplicate its account data.
- R3 actual failing field: `agent-primitive-23a7587e-e096-485b-beea-f939340b6f1a.b.y`. Warm draft value `80.00000002516768`; fresh solve value `80.0000000015683`; absolute displacement `2.3599383780492644e-8 mm` = `0.023599383780492644 nm` = `23.599383780492644 pm`. Existing bound remains `1e-9 mm` = `0.001 nm` = `1 pm`.

The last accepted R2 same segment was exactly `(230,80)->(240,80)`. Its actual authored rows locked its start with signed X/Y constraints, fixed physical length 10 by LengthRelation factor 0/offset 10, and related its angle to the fixed horizontal axis by Parallel angle `0.00`. The new partial member began `(440,150)->(448,156)`, also length 10 with a locked start. The requested mixed group connected actual inspected axis, same, and partial IDs. This is a genuine affected constraint component: adding the new equation can change its numerical solution, while unrelated geometry must remain exact.

Unit convention: `1 mm = 1,000,000 nm = 1,000,000,000 pm`. The replay bound is a **1 pm (0.001 nm)** geometric stability target; this audit does not claim that the existing raw solver stopping or residual criteria establish that accuracy. Earlier audit wording incorrectly labeled the measured displacement as nanometres and the bound as 1 nm; only those conversions/labels are corrected here. All raw millimetre values and receipt hashes remain unchanged.

## Source-confirmed phase difference

References below are paths in the ACAD source; line numbers describe the reviewed source and may move.

1. `web/app/sketcher/shapes/segment.ts:60` derives angle/length from endpoints. `stabilize()` at line 74 creates the internal Polar relation.
2. `web/app/sketcher/io.ts:173` assigns and stabilizes loaded objects before reading authored constraints. `io.ts:375` serializes only non-internal constraints.
3. `web/app/sketcher/constr/AlgNumSystem.ts:136` records admission hints on **all** constraints, including internal Polar rows. Warm objects therefore retain internal hints that are absent from the serialized source.
4. `AlgNumSystem.ts:395` rebuilds candidates as hinted-accepted, then unhinted legacy, then conflicting/nonaccepted retry rows, preserving order within each category. Fresh load regenerates unhinted Polars; warm incremental admission has hinted Polars. Existing redundant hints also bypass the clean all-set fast path at line 432.
5. Consequently warm incremental group admission and cold source reconstruction need not build identical reduced systems or follow identical solve trajectories. This is a deterministic source difference, not evidence of random nondeterminism.

Before the repair, `constraintGroupTransition.ts` serialized the warm draft, cold-solved it, then applied the Save replay stability guard **between draft and first cold solve**. The failed comparison therefore mixed candidate construction with the independent stability check intended for an actual returned/persistable source.

## Equations and numerical hypothesis

The actual Polar equations are `x1 + t*cos(theta) - x2 = 0` and `y1 + t*sin(theta) - y2 = 0` (`ANConstraints.ts`, Polar). Fixed axis endpoints require its horizontal direction; the old Parallel relates same to axis and the new Parallel relates partial to same. Near horizontal, endpoint sensitivity to angle is approximately `L*deltaTheta`. The moving partial begins with a nonzero vertical residual and enters the same coupled system as the older same segment.

`modules/math/optim/dogleg.js:49` uses fine residual and gradient infinity thresholds both `1e-8`; success at lines 122–125 is residual **or** gradient stopping. `constr/solver.js` also supplies fine LM fallback accuracy `1e-8`. Those are raw numerical-system criteria, not a theorem limiting every reconstructed coordinate's displacement to `1e-9 mm`. `headless/solve.ts:193` separately verifies the actual original registered equations/domains and emits actual admission evidence; its length residual policy allows `1e-6 mm`, angles `1e-8 rad`.

This supports a coupled stopping/order/reduction explanation for the observed displacement; it does **not** identify which stopping condition fired in R3. There is no retained per-iteration trace proving roundoff, gradient stopping, a particular elimination or a solver defect. The measured 23.6 pm must not be dismissed as ordinary coordinate ULP error at y=80.

Reduction has a distinct tolerance: `geom/tolerance.ts` defines `EPSILON=1e-12`. `AlgNumSystem.ts:649` and its linear substitution paths can discard sufficiently small constants/offsets, recording approximate-reduction provenance. Tightening dogleg alone does not undo those reductions or establish a coordinate-error bound. Isolation explicitly leaves rank/DOF unknown (`AlgNumSystem.ts:1147`); it would be unjustified to freeze allegedly fully constrained parameters from equation counts.

A global `1e-12` solve default is not a demonstrated fix: angular sensitivity scales with length (at L=1e8 mm, 1e-12 rad corresponds to about `1e-4 mm` = `100 nm`), and at coordinates 1e8 mm a Float64 ULP is about `1.49e-8 mm` = `0.0149 nm` = `14.9 pm`, greater than the unchanged `1 pm` replay bound. At that scale the current guard effectively requires bit-stable reconstruction. Changing numerical thresholds cannot be advertised as universal absolute geometric accuracy.

## Review of the narrow phase repair

Root `e95c377` makes the warm transaction a **draft**, performs one actual cold solve to construct the returned canonical candidate, and uses one separate fresh solve solely to verify that candidate. It returns the canonical candidate, not unbounded or unchecked second-pass geometry.

The reviewed code retains:

- exact source membership, identity, authored constants and intent outside the requested group;
- the existing actual affected-constraint graph and exact unrelated-object preservation, applied to both warm draft and cold candidate;
- original-equation/domain and actual admission verification inside both solve calls;
- the unchanged `1e-9 mm` candidate-to-independent-replay guard and current branch checks;
- equality of canonical and verification authored admission type/state sequences;
- independent reconstruction of the complete original request in `verifyConstraintGroup`, with exact expected candidate comparison;
- no retry/polishing loop, rounding, snapping, copied precursor positions, averaging, tolerance change or global hint reorder.

This is a meaningful phase correction rather than comparing output with itself. It does not prove eventual canonical stability: a canonical-to-fresh failure must still refuse. If that occurs, numerical stopping/reduction needs its own measured, scale-aware investigation rather than hidden repeated solving.

One review note was sent to the parent: final group reply rows are derived from a third reconstruction workspace (`describe(check.constraints)`), while the explicit admission equality concerns canonical and second-solve evidence. A narrow locator/type/status comparison against canonical authored rows would keep that third workspace from silently supplying a different classification. This is a source-contract guard gap, **not** an observed R3 classification failure. The parent owns any repair.

A separate latent issue was reported, not changed: `verifiedReplayGeometry.ts` compares `abs(normalized(u)-normalized(v))` for directed angle closeness. Values on opposite sides of 0/2pi can appear far apart despite a small physical directed difference. Circular distance would preserve the actual angular bound and class. R3 failed the coordinate guard first; no claim is made that this latent boundary caused R3.

## Scope and remaining evidence

The actual R2/R3 failures remain failures and their receipts remain unchanged. This audit does not qualify the phase repair, native geometry, a complete orientation exercise, secondary engines or general numerical accuracy. The next evidence is the parent's unchanged complete public orientation workflow on the repaired compiled runtime, including ordinary/reversed groups, intent-preserving travel and native Save/Open. No isolated tests were requested or run.
