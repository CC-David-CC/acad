# Numerical-algebraic admission priority candidate

This is an isolated candidate for root review, not release acceptance. The only product change is a restart of the existing polynomial reduction scan in `AlgNumSystem.evaluatePolynomials`; no schema names, numerical rank calculation, solver framework, zero tolerance or intent guard change is introduced.

Current checkpoint: rebased by cherry-pick onto root `7422cf9249133fad6ca24c94591f18306d2dde53`; matched candidate source `0447b2a8bd59ce567077b3ff15ff89e01e64f983` now passes actual application action authoring, installed Worker Save, fresh native-project replay and unchanged-byte no-op Save. See [current qualification](CURRENT742-QUALIFICATION.md), [pins](current742-pins.json) and [aggregate adapter fragment](current-fragment.json). The older receipts and original `pins.json` below retain their original historical scope.

Fix mechanism: Horizontal fixes the internal angle. This makes an earlier Polar Y equation linear, but the old forward scan uses the later SignedDistanceY row as a pivot before revisiting the earlier equation. The resulting zero row is credited to the multi-equation internal Polar relation; that relation still has an independent X equation, so neither whole authored relation is labeled redundant. Restarting after an algebraic reduction preserves prior-row priority. Accepted admission means not detected conflicting/redundant under this classifier; it never certifies independence, physical DOF or global satisfiability.

The source-controlled [comparison](receipts/comparison.json) checks89 frozen baseline inputs, all37 registered schema IDs (35 authored plus internal Polar/ArcConsistency), and two multistage cases. All89 loaded geometry arrays are JSON-equal, all caller inputs remain unchanged and88 admission/error outcomes remain unchanged. Exactly one old accepted/accepted pair reclassifies SignedDistanceY as redundant and therefore **strict-refuses INTENT_CHANGED**. `solve.ts` is untouched; this is an intentionally exposed compatibility boundary, not a silently migrated file.

Fresh source proof uses the real nonvisual `HeadlessSketchWorkspace`, `AlgNumConstraint`, `stage.addConstraint` and strict IO. No admission label is assigned in that fresh-authoring path. The original source naturally writes accepted/accepted; the candidate naturally writes accepted/redundant. Each source passes strict solve and serialized reload of its own freshly authored record. The candidate record/request is included in `candidate.json:freshRoundtrip`. Current matched browser qualification is recorded separately above. The standalone Worker test covers native serialization→actual Worker solve/reload/Save validation and preserves the older metadata refusal; the separate `app-save-browser.test.cjs` covers actual app action authoring and persistence.

Actual installed4a3 Worker before-control is archived separately: it accepts its old accepted/accepted record and refuses the candidate's naturally generated accepted/redundant record. It used the pinned production client and genuine installed Worker;2/2 Workers terminated and its browser context closed. No candidate browser pass is inferred from this old-runtime negative control.

Generic source controls use real nonvisual workspace objects with custom polynomial schemas, not a Horizontal/SignedY special case. They verify priority after a fixed input makes an earlier equation linear, retain an independent component of a partially implied multi-equation relation, and reactivate the retained candidate after prerequisite removal. Existing27 atomic admission/removal/external-stage regressions and the midpoint regressions pass with the candidate.

The inherited zero tolerance is1e-12. A separate generic control records that x=0 followed by x=1e-13 is classified redundant by **both** sources although it is not mathematically exact redundancy. This candidate preserves numerical-algebraic admission semantics; it is not an exact-rational or global logical certificate. Local Jacobian reports remain separate and are not used to relabel constraints or infer DOF.

Exploratory Node load/prepare/solve medians for16/128/512 independent point locks were approximately0.86/17.61/166.21ms before and1.48/22.23/217.01ms after in this run. Three samples per size, shared host, one Node process per source; no Chrome/Worker or worst-case claim. The added restart/compaction work has a measurable cost; keep broader performance qualification open.

Reproduce candidate source controls without regenerating the baseline fixtures:

```sh
CODI_REDUCTION_INPUTS=test/agent-cad-corpus/sketch/redundancy/receipts/inputs.json \
CODI_REDUCTION_EXPECT_RESTART=1 CODI_REDUCTION_BENCH=1 \
CODI_REDUCTION_OUTPUT=/tmp/restart-candidate.json \
node test/agent-cad-corpus/sketch/redundancy/run-source.cjs
node test/agent-cad-corpus/sketch/redundancy/compare.mjs \
  test/agent-cad-corpus/sketch/redundancy/receipts/before.json \
  /tmp/restart-candidate.json /tmp/restart-comparison.json
```

The original source is `35bf9d0987f4d02091ce1b82b521c79a1f5ca49e`. Run the same harness in a separate isolated checkout using its original `AlgNumSystem.ts` and without `CODI_REDUCTION_EXPECT_RESTART=1` to reproduce `before.json`. Frozen inputs must not be regenerated after changing the classifier. Node compatibility globals only permit importing the existing nonvisual backend; these are source controls, not browser/UI/Worker qualification. The private test bundle is deleted after each run.

For `fresh-worker-browser.test.cjs`, supply exact matching `JSKETCHER_TEST_URL`, `CODI_SKETCH_WORKER_URL`, `CODI_SKETCH_WORKER_SHA256`, `CODI_APP_SHA256`, `CODI_REDUCTION_BEFORE`, `CODI_REDUCTION_AFTER` and `CODI_BROWSER_RECEIPT`; set `CODI_EXPECT_PRIORITY_RESTART=1` only for the candidate. Root owns the next matched app/Worker pins and any admission-format/version decision. No migration or broad intent relaxation belongs to this prototype.
