# Typed artifact readers: revised minimal proposal

Proposal only, grounded in source at ACAD `03b906168e0fa5050ae329cb6bb6c7bf98f4c0b1`.
This document adds no production or driver changes, no tests, builds or browser
execution. The existing E18 driver and its frozen inputs remain unchanged.

## Revision to the earlier proposal

**A new private expression-facade snapshot/capability is not currently justified.**
The earlier proposal treated an additional snapshot as desirable isolation without
a demonstrated failure of the existing guarded accepted service. Parent-recorded
complete E18 R3 observations on runtime `1e293a8` include successful typed geometry,
real native point reads, formula propagation and mixed history travel. No point-read
facade/currentness failure was observed. R3's later refusal comparison differed only
in four opaque inspection tokens; that does not establish an expression-ownership
defect. R4 remains the parent's active complete workflow at this writing.

The next artifact-reader extension should reuse the same accepted expression
service and existing observation lifetime contract that the point reader uses.
Do not add a second quantity table, private generation flag, ticket registry,
publication participant, newly prepared facade or new evaluation framework.

## Why the accepted service already supplies authority

`web/app/cad/expressions/expressionsBundle.ts` owns a private `typedFacade`,
`acceptedPhysicalSource` and `acceptedPhysicalRevisions`. `currentPhysical()`
requires the matching script plus script/list/errors/table revisions and no errors.
`resolveQuantity(name,dimension)` calls that check before delegating to the private
accepted facade. The values were evaluated in the existing quantity Worker and
admitted by `candidateExpressionFacade.mjs`; reads do not need to evaluate them
again. Physical source v1 is its version prefix plus a JSON **array** of definitions,
not a new wrapper/document.

`workerSolidPointCommands.ts` captures the actual `ctx.expressionService`, all four
expression stream objects/revisions, the exact authored history, accepted models,
document generation, source namespace/version signature, operation descriptors,
current body/build/measurements and counters. Its `current()` checks source strings
and frame/face identities as well as the service/stream/revision identities.

The three artifact readers already carry the same relevant guards. Their captured
history is independently compared with the accepted history before and after the
read. Their frozen sketch storage has no live source fallback and rejects writes.
The independent source inventory is bounded to 64 saved planes, each at most
64 KiB, and binds every source's bytes and frame to the owning face.

In `craftBundle.ts`, `evaluateWorkerSolidRead` serializes under the existing
`pipelineTail`, requires its read's currentness before replay, and calls the same
`evaluatePipeline`. The latter creates `operationContext = Object.create(ctx)`;
only a **write** with `preparation.expressionPublication` substitutes a candidate
expression facade. A read inherits the current accepted expression service. The
reader checks that the service and its accepted streams have not changed across
the operation. Supported selected-profile/through-hole operations additionally
resolve exact numeric dimensions against that accepted service and retain their
own source/stream/owner guards around Worker/native suspension points.

Ordinary accepted writes cannot interleave with the read's pipeline. Document or
source replacement invalidates the existing guards; it is not a reason to adopt
a new expression source mid-read. No unguarded direct service use or public caller
override is proposed. This reasoning is limited to the existing shared service/API
contract; it does not claim arbitrary monkey-patched internal objects are supported.

## Exact remaining refusals

| Reader | Current blocker | Existing downstream authority |
|---|---|---|
| `craft/workerStepExportCommands.ts`, `inspectWorkerStepExports` | The eligibility expression rejects `e.isTyped` and any nonempty expression source/table. | Captured document and geometry revisions, whole-part exact staged STEP build, current selected producers/metrics/placements, complete frozen replay, private ledger STEP Blob and native receipt checks. |
| `craft/workerManufacturingMeshReplay.ts`, `prepareWorkerManufacturingMeshes` | The initial parameter check rejects typed source. | Pure `prepareHostSave` envelope, current manufacturing revision, complete current assignment manifest, exact source/history coverage, private candidate controlled mesh read, one-shot issued artifacts after cleanup. |
| `craft/workerDrawingReadCommands.ts`, `readWorkerLinkedPartDrawing` | The parameter check rejects typed source before replay. | Captured definition/document/geometry revision, actual target and datum/source bindings, real candidate dimension witnesses and HLR projection, exact accepted native measurements. |

`genericManufacturingBodies.ts` already admits current typed state via
`hasCurrentPhysicalResult()`. It checks actual current native outputs rather than
interpreting raw authored dimensions as geometry. No new typed gate was found in
`export/workerGeneric3mf.ts` or `export/workerLinkedDrawingSvg.ts`; those private
consumers operate on issued artifacts/real drawing observations. PM and Desktop
file routes still apply their normal document, account, file and settlement guards.

The private ledger readers receive fresh candidate handles and exact numeric
requests from the shared operations, never authored names. In particular,
`drawingReferenceFacts.mjs` consumes numeric `sourceProfile.depth`, solved region
curves and real numeric hole-construction witnesses. Typed names need no new
native, drawing-measurement, mesh-encoding or STEP schema.

## Proposed production ownership after approval

1. Own the three reader files above. Replace their blanket typed refusal with the
   exact already integrated family admission: current accepted typed result plus
   `requireModernPhysicalHistory(history)` for one canonical selected rectangle,
   its extrusion and source-matched modern through holes. Legacy/nonempty untyped
   expressions and other typed feature families remain unsupported. STEP discovery
   must report eligibility truthfully as well as export enforcing it.
2. Optionally add a **pure admission function** to the existing
   `parameters/modernPhysicalBindings.mjs` to share this predicate and reason
   reporting. It must allocate no capability/state or quantity map and perform no
   expression evaluation. Family admission can run once over the captured bounded
   history; currentness continues to bind the unchanged history and expression
   service/streams. The existing point reader can retain its already successful
   equivalent predicate, or adopt the same pure function without changing behavior
   in the later coherent source checkpoint.
3. Preserve each reader's existing currentness guards. An explicit
   `hasCurrentPhysicalResult()` recheck may be composed with those checks for typed
   reads; it reuses existing authority rather than adding a synchronized flag.
4. Prepare a NEW complete public artifact workflow/independent artifact oracle.
   Do not modify the currently running/frozen E18 workflow or its expectations.

No changes are presently needed in expressionsBundle, expressionPublication,
Craft's evaluator/journal, PM, Desktop, private ledger, Worker/controller, native
ABI, catalog/default selection, asset stagers or encoders. A concrete later failure
at one of those boundaries must be reported before expanding ownership.

## Invariants that remain mandatory

- One complete authored replay and one observation-purpose resource owner per
  artifact read. It can never be accepted as model publication. No accepted/dead
  handles are borrowed. The same current backend revision must advertise and stage
  STEP, controlled mesh, or drawing capabilities as applicable; no substitution.
- The actual accepted source, formulas, authored bindings, models, journal, epoch,
  counters, materials and drawing definition remain unchanged by read/cancel/fail.
  Opaque inspection tokens are validity tokens, not persisted document content.
  Currentness and actual Undo/Redo verify history after a failed operation; token
  normalization must not hide a content or chronology change.
- The candidate must match captured accepted native volume/bounds and source/build
  identity. Its owner is closed and ID context restored before any artifact reaches
  a consumer; cleanup uncertainty remains a failure, not successful export.
- STEP keeps the native 64 KiB chunk/8 MiB Blob boundary. Manufacturing keeps
  protected source bindings, complete assignments, controlled mesh aggregate caps
  and the one-shot transfer to the Worker encoder. Drawing keeps Worker-validated
  HLR buffers, real dimension witnesses and explicit unresolved labels. No public
  JSON native handles or raw mesh/projection-buffer authoring API is added.
- Existing bounded main-thread source/model hydration and metadata checks remain
  disclosed. Formula evaluation/solve/hash/native geometry, mesh work and rendering
  remain in their existing Workers; this proposal adds no large main-thread loops.

## Complete qualification after the source slice

Continue with the same genuinely authored parameter-driven part and actual IDs;
choose an explicit staged build supporting each requested artifact. Independently
check current volume/bounds and native material/void queries, assign/rebind a real
material and appearance, publish a genuine linked drawing definition, and export
STEP, core 3MF and SVG through normal My files commands. Check the actual bytes,
material/color/unit/geometry values and dimension semantics using standalone
artifact readers rather than trusting producer expectations.

Edit formulas, verify geometry and dimensions propagate, reject stale read
revisions, and exercise cancellation/refusal with accepted state/resource
preservation. Existing manufacturing geometry hashes intentionally make prior
assignments stale after geometry edits: require genuine current assignment review
or rebind before exporting; do not silently rewrite material custody. Drawing's
authored references persist and either measure the new real geometry or report
unresolved. Normal native Save/server sync/fresh Open/reedit retains formulas,
bindings, assignments and drawing definitions. Exported artifacts remain derived;
the native project is the editable authored document.

Use one completed application workflow and independent after-the-fact artifact
review. No isolated qualification cycles or claims that these readers already pass.
