# Finite-curve source extraction: BEFORE API and ownership contract

SOURCE PROPOSAL ONLY / UNIMPLEMENTED / UNRUN. 2026-11-09.
Basis: `integration/foundation-next-20261109` at
`9831c7a8f740c19ad403d157ece5606d4a047d16`. The inspected sketch/headless,
closedSketchTransitions and finiteCurveReadProtocol files are unchanged through
Root `f11f620f977ba5feacb5cd1d8a80f0f98ac732fc`.
This packet changes only this note. No parser/import, solve, test, probe, build,
Native, module or browser execution. No new mounted capability or qualification.
Root decisions `8f1a17a` and bridge `2f16ecd` remain authoritative.

## Proposed implementation boundary

One NEW leaf `web/app/sketcher/headless/finiteCurveSourceExtraction.ts`, exporting
`extractFiniteCurveSource(request)` and `verifyFiniteCurveSource(request)`.
A small adjacent own-data envelope/type leaf may separate transport capture from
headless imports, if needed by Main. These names and the shapes below are proposed
for Root approval; no existing task or command currently implements them.

The leaf reads two actual nongenerated root Segment/Circle/Arc entities in ONE
original sketch. It produces immutable source-preparation data, not intersections,
contact/disjoint certificates, query event IDs or geometry mutations. It does not
call Native, issue a shape/result name, save a cache or change the sketch/J.
Unrelated supported geometry/constraints/generators remain fully validated;
they are not filtered away to make the selected pair appear independent.

Exact private request (outer task tag is stripped by solveWorker, as today):

```ts
{
  revision: string,
  sketchJSON: string,
  externalParameters: Readonly<Record<string, number>>,
  intent: { curveIds: readonly [string, string] }
}
```

Keep original text byte-for-byte. Limits derive from sketchTransition and the
frozen codec: nonempty revision <=256 chars; source <=1MiB both chars and UTF-8;
<=1024 own external names, each nonempty <=256, finite numeric value abs<=1e9;
exactly two distinct nonempty selected IDs <=256 without controls. Dense arrays,
exact own enumerable data keys, no accessors/symbols/extra members. Cross-realm
own-data capture must not require identity with the host Array/Object prototype.
No caller coordinates, source frame, solved source, evidence, generated flag,
auxiliary batch, hash or success flag is admitted. Face/document/host identity
stays in the genuine private Craft job; adding an unproved faceId to this request
would not establish ownership and is unnecessary for this leaf.

Proposed success receipt (all nested data detached and bounded):

```ts
{
  version: 1, revision, ok: true,
  sourceSha256: string, bindingSha256: string, admissionSha256: string,
  frame: { origin:[number,number,number], x:[number,number,number],
           y:[number,number,number], z:[number,number,number] },
  targets: readonly [
    { id:string, type:'Segment'|'Circle'|'Arc', role:string|null,
      stage:number, members:readonly string[] },
    { id:string, type:'Segment'|'Circle'|'Arc', role:string|null,
      stage:number, members:readonly string[] }
  ],
  input: EncodedFiniteCurveReadInput
}
```

`input` is exactly the frozen finiteCurveReadProtocol encoder output, containing
its own curves/values/inputBits/algorithmOrder. No second borrowed geometry
object or source-row alias is returned. Target members come from actual objects,
not suffix parsing; canonical member order is root,a,b for Segment; root,c for
Circle; root,a,b,c for Arc. Member IDs bounded <=1024, <=4 per target. Frame has
exactly the original metadata.boundaryFrame values, finite and detached; it is
not a newly orthogonalized frame. Proposed receipt cap16KiB UTF-8, with no full
source or residual-array repetition. All hashing is Worker-only.

`sourceSha256` hashes original UTF-8 text. `admissionSha256` hashes the actual full
captured-equation membership/classification sequence (stage,index,typeId,state),
not saved hints alone or raw floating residual arrays. `bindingSha256` is a
versioned domain-separated, length-prefixed encoding of sourceSha256, exact
external name/value pairs (names sorted by code-unit order; values as original
F64 words, retaining -0), selected order, frame F64 words, targets, inputBits,
algorithmOrder and admissionSha256. No JSON-number normalization of F64 inputs.
The digest is an exact receipt binding, not a numerical geometry certificate.

Verifier request adds exactly `expected` holding a strictly captured first
success receipt. It reruns extraction from the unchanged original request in a
SECOND fresh disposable Worker and compares every actual target/member/role/
stage, frame bit, encoded value bit/order and binding/classification digest.
It returns its independently derived receipt, not only `verified:true` or a
self-membership assertion. The first receipt is never used as geometry input.

## Actual proof and decode sequence

1. Capture request; parse only in the Worker. Retain original text and detached
   original parsed tree. Call actual solveSketch with separately cloned sketch
   AND boundary, preserving the strict anti-alias tree validator. Capture the
   genuine private auxiliary-witness batch only from its successful third
   callback; never manufacture or serialize it.
2. Use assertVerifiedReplayGeometry(original,cold.sketch,cold.evidence,external).
   Cold output is proof-only. Validate all original rows at original coordinates
   using evaluateCapturedSketch(original,external,cold.evidence,undefined,batch).
   Saved classifications must equal fresh actual admission; no rewrite/healing.
3. Decode original again through a fresh HeadlessSketchWorkspace and its private
   io.evaluateCapturedSketch visitor. This opens an actual decode transaction;
   do NOT call a mutable prepare helper, nest/finish a transaction or optimize.
   Use capturedParameterOwnership + installCapturedAuxiliaryWitnesses from the
   SAME successful cold observation. Recheck exact restored source equivalence
   before/after inspection and ownership.unchanged(). Destroy the workspace.
4. Select from the original root row inventory AND actual createIndex identity:
   actual TYPE/role/stage/stage.objects membership, no parent, !isGenerated;
   actual child/parameter ownership and no aliases between selected roots or
   their child identities. Require the precise ordinary child graph stated
   above. Coordinate coincidence is permitted; object aliasing is not.
5. Extract original captured geometry, encode with the frozen codec, then hash
   and recheck immutable snapshots across async digest awaits. No cold-solved
   coordinates or display/discovery values replace original source geometry.

The working precedent is lengthMeasurementTransition cold/coordinateProof/
decode; the original evaluator already validates full original equations and
registered domains. This plan needs no shared validator or IO skipSolve flag.
Ownership.geometry includes descendants and genuine internal Params; do not
reintroduce the old root.visitParams-only inventory omission. The optional
newPrimitiveId argument is NOT used: these query targets can already have real
constraints and downstream generator consumers. `.generators` records consumers;
`.isGenerated` traverses actual producer ownership. A read need not reject all
consumed inputs or earlier stages. Both selected stages can differ within the
existing <=32-stage graph, and construction-role curves can be queried; no new
same-stage or ordinary-role-only mutation restriction is proposed.

## Exact geometry and domain boundaries

Segment input uses original actual a/b; Circle original actual c/r. Arc stores
ONLY a/b/c: Arc constructor syncGeometry creates genuine r/ang1/ang2 and its
actual ArcConsistency internal equations are checked by the captured evaluator.
Read those original decode Params. Preserve original a/b/c and start angle;
lift end by one 2*pi only when needed for proper positive CCW sweep. Require
strict 0<sweep<2*pi and distinct actual a/b. Equal-direction/full-circle or
unrepresentable proper sweep is explicit unsupported/uncertain, never promoted
to Circle and never selected by a display tolerance. Return original endpoints
even when their radial agreement is only within existing equation admission;
do not project/snap B onto the support. Later finite-event certification must
account for original endpoints, actual constructed basis and numerical error.

Ordinary entity admission (>1e-9mm for positive lengths/radii) remains unchanged.
The raw codec separately requires |selected coordinates|<=1e8, positive r<=1e8,
selected stage0..31 and proper branch. A valid sketch outside the query envelope
is unsupported for THIS query, not globally invalid. No new minimum radius,
angle epsilon or exact-contact tolerance. Existing 50pm replay fidelity is not
an intersection accuracy theorem. Native raw flags are still nonactionable.

Frame caveat: sameSketchSaveFrame checks finite shape and component agreement
within its existing1e-9 policy; self-comparison does NOT establish orthonormality
or handedness. The query is sketch-local. This leaf only retains original frame;
the future Craft owner ties it to the actual current source plane/frame. No
new direction tolerance or world-coordinate transform is introduced here.

## Source and task integration proposed to Root

- solveWorker: additive `sketch-finite-curve-source-extract` and
  `sketch-finite-curve-source-verify` branches, each one disposable Worker request.
- client: exact reply capture for these two tasks, cancellation/retirement and
  existing worker limit; no accepting an arbitrary success object.
- transitionClient or NEW finiteCurveSourceClient: bounded own-data request and
  strict receipt capture; invoke the same existing runSketchSolve machinery.
- closedSketchTransitions: dedicated read-only captureJob-based query service,
  original nonce/source/external map retained for both extractions; currentness
  before/after every await. It must NOT use public inspectClosedSketch's cold
  point inventory as positive source input or call job.prepare/sketch-bytes J.
- Later private semantic preparation binds both independent receipts to actual
  captured face, document generation, manager, source namespace/version, epoch,
  host/native lifetime, actual source plane/frame, material/expression/typed
  definitions and explicit query engine revision. No Main geometry or hashing;
  no caller-public branded flag. Raw query owner remains discard-only and
  shape-free. This packet does not invent or implement that mount issuer.

Actual captureJob is NOT arbitrary-source authority: currently it requires a
settled full tip, known unconsumed-sketch history/source association, empty
boundary inspection and captured genuine frame; all streams/services/source/
expression/physical/material anchors must remain current. Existing typed read
preparation resolves registered LENGTH bindings and preserves typed raw source;
it does not grant arbitrary named ANGLE or local-constant support. The leaf may
consume only its captured numeric resolver map, while the coordinator retains
and rechecks real definition/list identity. Native-attached/boundary sources or
unsupported typed histories need a separately approved source-owner extension;
no fake empty boundary or blanket read bypass belongs in this leaf.

Failures preserve actual original solver/domain/admission cause and bounded
code/message using shared failureCause/withAdmissionCause/captureSketchFailure.
Proposed new local codes distinguish unsupported selected target/query envelope,
source extraction mismatch and resource limit; they must not relabel numerical
failure inconsistent. A failed extraction cannot authorize Native invocation.
Unknown Native/protocol/currentness/cleanup classification is still the later
query caller's terminal obligation, not an empty intersection result.

## Approval and finite follow-on checks

Root approval requested for this exact private DTO, two task names, deterministic
Arc lift, mixed-stage/construction read eligibility and16KiB receipt bound before
implementation. No source authority blocker requires changing IO/solver today.
Unresolved downstream work is concrete: actual protected query owner/mount for
new explicit pair; original-support/finite/root-completeness certification; then
shared trim/extend original-source transaction + full-suffix J/native Save/Open.
They are not claimed implemented by these source preparation receipts.

The eventual ONE whole public workflow must include actual nongenerated
Segment/Circle/quarter-Arc discovery, constrained and free targets, typed named
length update, two independent original-source preparations, exact read-only
source/J/IDs/frame/material state, proper seam/branch and unsupported generated/
unknown/alias/stale/cancel/refusal cases, then certified query and genuine
trim/extend travel/.cad/freshOpen. Independent equations/finite membership and
artifact truth follow terminal whole success. No microtests, injected positives,
raw Native flags or stored query answers substitute for that acceptance.
