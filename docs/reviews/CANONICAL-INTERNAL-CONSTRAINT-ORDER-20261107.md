# Shared internal constraint ordering — R5 source review

Read-only source analysis; no product changes, tests/probes/build/browser execution. Reviewed actual `primitiveTransition.ts`, `AlgNumSystem.ts`, `io.ts`, shape stabilization and history comparison in ACAD root source around `dea6ce685668bce01c78419ddc63441568dd2884`. Root owns the implementation and actual first-difference diagnostic. This is a proposal, not evidence that a new order has fixed the complete workflow.

## Actual failure and information boundary

Original `/tmp/codi-acad-orientation-proof-r5/receipt.json`, SHA256 `b36dc4d21fcba93014a9e314290accd0a79a1d742fc618dccef1725f6f401bdf`; compiled ACAD `578b865ef1cfc0d18a9436fec142b58d3e10023c`, Desktop `faac5866399b6d165ff5147d3ddbde92e8361b1a`. Actual workflow failed after **82 rows**, after mixed group/no-op/stale/zero/refusal controls had passed. The final accepted source has 20 objects and 76 authored constraints: 75 accepted, one redundant, none rejected.

The failing actual public command appends an ordinary Segment `(470,100)->(478,106)`, role null, stage 0. Its later intended endpoint locks were **not reached**. At append time its only new constraint is its own internal Polar; it shares no authored points or equations with old objects.

`primitiveTransition.ts` first cold-replays the source, loads that result in another workspace, adds/stabilizes the new primitive inside one transaction, then serializes a warm candidate. It checks new data against the requested data, removes the new object from a comparison copy, and compares **all retained state exactly** using `sameRestoredSketch`. The actual failure is at this old-state comparison: `INTENT_CHANGED`, `Existing sketch state changed.` Thus the new-object check passed, but **which old field changed is not exposed** in this receipt. The final cold candidate solve/check was not reached. Existing geometry and saved admission hints are both part of the comparison; no coordinate delta or changed hint can be asserted from this message alone. This must not be called a proven roundoff-only or hint-only failure.

## Two distinct source-confirmed order differences

1. **Admission priority depends on warm-only hints.** `recordAdmissionHints()` (`AlgNumSystem.ts:136`) writes hints for all constraints, including internal Polar/ArcConsistency. Serialization (`io.ts:375`) omits internals. Fresh `io._loadSketch` stabilizes objects before reading authored rows, so it regenerates unhinted internals; warm objects retain their internal hints. `rebuildAdmission()` (`:395`) orders accepted-hinted, legacy-unhinted, retry rows. That changes the internal/authored admission sequence without any authored model change.
2. **Polynomial order differs even if fallback candidates are reordered.** `validConstraints()` (`:111`) traverses raw `allConstraints`. A cold load registers all object internals before saved authored rows. A warm append registers the new internal Polar **after** all retained authored rows. `prepareRaw()` (`:835`) resolves constants and `evaluateAndBuildSolver()` (`:865`) normalizes params and calls `evaluatePolynomials()` (`:572`) through this traversal. Reduction visits ordered rows, chooses linear substitutions and builds graph/isolations from that order. Reordering only `rebuildAdmission` candidates leaves this difference in fast-path and ordinary prepare/solve.

R5 has a saved redundant authored row. The current clean all-set fast path excludes any nonaccepted hint, so its existence makes full ordered admission relevant. This is a source/evidence fact, not a trace proving the exact failing pivot or changed value.

## Narrow shared implementation proposal

Preserve stored `allConstraints`, authored source order, serialized IDs/indices/hints, equations, values, rollback and tolerance policies. Introduce a **derived stable evaluation order** only:

```
internal = allConstraints.filter(c => c.internal)
authored = allConstraints.filter(c => !c.internal)
evaluationOrder = [...internal, ...authored]
admissionOrder = [...internal,
                  ...authoredAcceptedHinted,
                  ...authoredLegacyUnhinted,
                  ...authoredRetry]
```

- `validConstraints` should traverse that stable internal-first view while retaining its exact active/conflicting exclusion rule. This covers constant resolution, parameter normalization, polynomial construction, snapshots and `updateFullyConstrainedObjects`. Do not sort/mutate raw `allConstraints` or reorder authored rows by hint in polynomial evaluation; preserve that existing equation-order meaning.
- Internal priority must not depend on a warm hint or its old derived classification. Re-derive actual internal admission from the current captured geometry. Authored accepted/legacy/retry precedence stays as currently declared, including stored authored hints and exact locator order. A cold/warm source-equivalent graph should not schedule differently merely because the internal definitions were reconstructed.
- `recordAdmissionHints` should clear/omit **only internal hint metadata** rather than retaining an in-memory priority bit absent from source. Keep actual internal conflicting/redundant/diagnostic state and external-dependency bookkeeping; this is not permission to fabricate accepted internals, silently drop their equations or erase genuine domain errors. Existing snapshots already capture/restore `admissionHint` including undefined.
- Internal rows retain deterministic source-object/stabilizer registration order within the internal partition. In the current nongenerated Point/Segment/Circle/Arc domain, `io._loadSketch` stabilizes objects in serialized order, Segment adds one Polar and Arc adds its actual ArcConsistency; warm append adds the new object's internal row at the end of the internal subset, matching its source position. Do not sort by debug counters, numeric values, opaque IDs or nearest coordinates. Broader generated/elliptical domains need their actual per-object internal ordering retained, not an unproven universal rekeying rule.

### Fast paths that must obey the same policy

- **Clean whole-set build (`rebuildAdmission:432`):** uses `prepareRaw`, so it requires the common evaluation traversal. Eligibility should use authored priority/conflict hints; internal warm hints or prior derived state must not choose a different branch. A tentative build still rechecks actual internal equations/domain and finite solve success, otherwise restores geometry and falls back. No former internal rejection may be turned into accepted solely by ignoring its metadata.
- **Hinted independent LockPoint batch (`:455`):** currently proves only hinted rows have two distinct lock params, requires no legacy rows and a retry set. If internals are filtered out of priority partitions, this can accidentally become eligible in a system whose internals couple those locks. Smallest safe restriction: require **zero internal rows** for this optimization, or supply a stronger real dependency proof counting every internal parameter use. Do not infer independence from the authored subset alone.
- **Legacy all-LockPoint batch (`:481`):** retain its complete-use census and all-candidates LockPoint condition. If `candidates` becomes authored-only, explicitly require zero internals as above. A new projected/nonlinear/internal definition cannot be omitted from that proof.
- **Single-row admission (`admitOne:195`):** its existing prior-accepted preservation checks can remain; it calls `prepareRaw`, so must use the same canonical equation traversal. Derived accepted/prior sets used as sets must not become a new serialized sort order. New internal insertion must not bypass actual authored-prior rejection checks.
- **`atomicReclassification(:775)`, removal and interactive rebuild:** all return through common prepare/readmission. Preserve exact rollback of values, solver state, hints, conflicts/redundancy and projected-domain state. Interactive parameter preference is still explicit and must not be silently normalized away.

The tight ownership surface is `AlgNumSystem.ts`: the traversal helper/`validConstraints`, derived hint write, admission partition/fast-path predicates and both lock guards. Root may keep primitive first-difference diagnostics separate. No polynomial coefficient changes, solver defaults, replay tolerances, per-transition intent exceptions, copied old coordinates or silent hint deletion in stored authored source are part of this proposal.

## Required invariants and expected effect on unrelated append

1. Internal membership and complete original equations survive; active/refused/redundant outcomes are genuine, not preassigned by a private flag.
2. Authored constraints retain original stored order, raw literal spelling, identity, admission precedence and strict source comparison. Actual final evidence still derives from final solved state.
3. Same retained object/constraint graph produces the same internal/authored equation order regardless cold parse versus warm registration chronology. New disconnected primitives form their own real isolation, without moving old components through a different old-system pivot sequence.
4. No change to the requested new primitive or tolerated movement of old state: primitive append's exact old-state guard remains meaningful. No-op, stale, conflict and failure still preserve source/history/journal/resources.
5. Canonical group output still receives its independent next-replay bound **1e-9 mm = 0.001 nm = 1 pm** and actual receipt-state checks; a repeated wrong solution is not an accuracy proof.
6. Consistent ordering reduces one demonstrated construction inconsistency; it does **not** prove numerical idempotence or identify R5's first diff. Original residual stopping, approximate coefficient reduction and conditioning remain separate. If a coherent full rerun still changes retained state, keep the failure and inspect actual field/type/state/value before proposing further numerical repair.

The retained R5 receipt alone cannot show whether the warm append changed coordinates, existing admission or other serialized state; root's narrow bounded first-difference diagnostic should report that, without changing the comparison subject or threshold. Complete unchanged real orientation + ordinary source author/edit/travel/Save/Open workflows are the qualification after coherent implementation. No step tests or execution occurred for this review.
