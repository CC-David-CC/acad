# Independent cylinder witness review

Frozen CAD source `cb4e36dbc`. No production edits, Native run/build, browser or
public authoring claim. New Node Worker tests consume the committed fresh Native
receipt. Every modified field/accessor below is explicitly synthetic, never a
new Native geometry success.

## Confirmed bounded admission defect

`cylinderCutWitness.mjs:25` passes raw `toolConstruction` into
`validatePrismProvenance`. That validator reads status before checking its
descriptor (`ownedTopologyContract.mjs:40`); its array helper checks own index
membership but not whether the index is a data property, so line54 invokes an
accessor at `data.sourceLoops[0].edges[0]`.

Two actual Node Worker counterexamples on the committed plate100 record:

- Nested status getter runs once before ENGINE_FAILURE refusal.
- Own enumerable getter at sourceLoops[0].edges[0] returns the original valid
  edge record and mutates input toolRequest.depth22→1. It executes twice; helper
  still returns the recorded D10 witness. Preparation captured the original
  request before the callback. This is input mutation during validation, not
  proof that a depth1 cutter made the hole.

This violates the helper's getter-free/input-unchanged contract. It is a private
data-admission defect, not demonstrated public corruption or a flaw in the
three genuine Native cylinders. Native JSON normally has no accessors. Root's
proposed bounded repair is strict detached construction-provenance capture before
any reads, locally in cylinderCutWitness; no shared topology-validator/framework
change is needed.

`purity-regression.test.mjs` contains the normative assertions: refusal, zero
accessor executions, and unchanged depth. Both are intentionally RED on this
source and must rerun unchanged after repair. `review.test.mjs` instead records
the seven BEFORE behaviors (three unchanged genuine-record replays plus four
synthetic controls); its defect-observation assertions describe this old source
and are not post-fix acceptance expectations.

## Mathematical support and declared limits

For admitted near-unit axes u/v, sameSupport compares undirected parallelism
|u×v|<=1e-8, line offset |(p-q)×v|<=1e-7mm and radius difference<=1e-7mm.
Axis reversal and moving the parameter origin along the same line are correctly
equivalent. These are numeric consistency thresholds, not universal OCCT accuracy
certificates. The selected cylinder comes from the tool's actual prism sweptFace
and unique same/modified B-side descendant; support corroborates it instead of
selecting by proximity. Returned diameter is twice the actual result radius.
Missing/split history and generated face correspondence refuse conservatively.

The witness proves infinite cylindrical support, not finite tool extent,
through-all material removal, trim coverage or unique semantic feature authorship.
A synthetic control changes tool depth22→1 and shifts its origin100mm along its
axis; the support witness still returns D10, correctly within this limited scope.
The future caller must authenticate the actual invocation/full scalar request,
subtract operation, native owner/build, source feature/region/document lifetime
and intended hole/material relationship. Curve labels and response-local slots
are not public binding proof. No nominal parameter should replace a current
measured fact when that integration is missing.

## Native copy mapping is already composed

Read-only review of actual fresh Native source
`0e429519e97a29e991ec4aa42b5ea6ddab24ddbb`, header
shape-io/ownedBooleanHistoryV1.hpp SHA256
`ad6e08d373c6638375e550081bb665e5106e48e3e7dc3cd82d0b3a4adc7e45e6`.
Exact excerpts/source pin are in evidence/.

copyRows checks copy.ModifiedShape(source(i)) and its working membership, then
appends the working shape in original-source order. ancestry calls
rows(originalMap,copyVector,resultMap,op). Each row emits source:i while querying
Modified/Generated/IsDeleted on working[i-1]; working survivors are modified
originals. Native therefore composes original→working→result. JavaScript's direct
original sweptFace index into B ancestry is correct. Applying sourceCopyB again
would be wrong.

All three fresh records happen to have identity copy certificates. The added
synthetic valid B-face target permutation1↔2 preserves original-order ancestry
and resolves sourceFace1→resultFace7/D10. That usefully guards against double
mapping but is not a newly executed nonidentity Native-copy qualification.

## Evidence scope and remaining controls

Committed fresh records cover100×50×20/D10,150×30×25/D14 and rotated/translated
100×50×20/D10. Their producer checks analytic volume, nine Native point states,
unchanged source metrics/catalogs and final owned-name count0. Reviewed Native
Boolean code additionally enforces bounded exact input BRep/catalog/tolerance
snapshots. This review only replays records. Existing retained logs report30
actual results/16 refusals plus malformed controls; no new rerun is claimed here.

Meaningful future integration controls: authenticated scalar/finite-extent
mismatch, stale owner/build/source, actual split/deleted cylinder refusal, and
genuine nonidentity copy if naturally available. Wider coordinate domains need
their own numeric-policy boundary checks. No confirmed mathematical failure in
the currently measured cylinders was found; full E22 remains unqualified.

```sh
/tmp/codi-files-move-node/bin/node --test test/cylinder-cut-witness-review/purity-regression.test.mjs
```

That command currently exits1 with two failures. All owned Node Workers settle
and terminate in finally. Historical observation receipt pins source before and
after unchanged. No product, service, account or shared browser was touched.
