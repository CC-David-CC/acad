# Tangency R1: missing shared-policy compatibility export

SOURCE-ONLY repair based on Coree98166d62f9bd14fffb643772b8b5f6db87966a1.
No tests, probes, TSC, builds, Native or browser execution. EqualLength remains
on its separate backed source-only branch; none of its product is included.

## Actual complete-run failure and source cause

Preserved first whole run:
`test/tangency-public-workflow/evidence-r1/{receipt.json,whole.log}`, evidence
ae1e597. Actual producing Core5e80f0d9dda72515738f3a4f0cf6fc861e84aef,
Hostc6d2bfe91f1e04dcbf099e7c992dceba93356eac, unchanged MFG32e/abb Native
pair. Run terminalFAIL:46rows/429recorded commands/22Native observations/two
normal .cad/server/fresh-Open cycles, input source unchanged and owned contexts
retired. Supporting tangency, travel/local5->4->2, distinct normal-coordinate
redundancy, finite Circle and Arc interior/endpoint positives were reached;
this does not qualify the complete tangency workflow.

First outside-Segment finite request was the actual locked Circle center[-10,5],
radius5 against support Segment[0,0]->[10,0], after supporting tangency had been
accepted. The expected finite-domain refusal FINITE_CONTACT_OUTSIDE instead
returned TANGENCY_FAILED with message:

```
registeredDomainFailureCause is not a function
```

The source-confirmed call chain is:

1. `headless/sketchValidation.ts` imports registeredDomainFailureCause from its
   compatibility path `./registeredConstraintPolicy.mjs`.
2. That compatibility module re-exported only assertRegisteredConstraintDomain,
   registeredResidualProfile and hasRegisteredResidualPolicy.
3. The actual selector exists as a named export in
   `constr/registeredConstraintPolicy.mjs`. The d004437 taxonomy packet added
   the new import/catch call but missed the compatibility re-export.
4. When validateConstraintGeometry catches the original registered domain error,
   invoking the undefined imported selector throws TypeError. The outer tangency
   outcome sees this new code-less error and truthfully applies its generic
   TANGENCY_FAILED fallback, losing the original typed refusal.

The prior positive path did not exercise that catch. This is a module-export
repair; no finite predicate/geometry failure, Native defect, new solver failure
or changed acceptance criterion is inferred from this TypeError.

## Product change and retained semantics

One production line adds registeredDomainFailureCause to the compatibility
module's explicit named re-exports. The authoritative function remains the same
single definition in `constr/registeredConstraintPolicy.mjs`; no duplicated
selector, catch fallback, new cause vocabulary or success override is added.
Existing three exports/import paths stay unchanged.

The original error code/message/cause is then handled by the existing
withAdmissionCause boundary. RESOURCE_LIMIT retains resource-limit;
FINITE_CONTACT_UNCERTAIN/UNSUPPORTED_FINITE_ARC retain retained-validation-failure;
ordinary registered domain errors retain invalid-domain. The function/math,
residual policy, finite contact authority, side/branch, original equations,
solve counts, original-request verification, publication/currentness/candidate
cleanup, J and frozen whole driver/checker/criteria are unchanged.

## Exact consumer and build/pin scope

The direct affected consumer is `headless/sketchValidation.ts`, specifically
validateConstraintGeometry's domain catch. Its callers include `solve.ts`,
`capturedSketchEvaluation.ts`, `capturedParameterOwnership.ts` and the actual
transition/inspection validators including tangency. `AlgNumSystem.ts` already
imports the correct authoritative constr path; the direct human admission
imports are also correct and require no source changes.

Normal generated-bundle consumers that must receive the repaired dependency:

| Production entry / config | Source dependency and generated output |
| --- | --- |
| `headless/solveWorker.ts`; `build/webpack.headless-sketch-worker.cjs` | solve/captured/transition validation -> compatibility module; `.build/headless-sketch-worker/worker.js`. |
| `cad/projectManager/projectValidationWorker.ts`; `build/webpack.project-validation-worker.cjs` | projectValidationCore -> mirrorSourceValidation -> capturedParameterOwnership -> sketchValidation; `node_modules/.cache/codi-project-worker/worker.js`. |
| `cad/projectManager/nativeArchiveCodec.worker.ts`; `build/webpack.native-archive-worker.cjs` | imports the same projectValidationCore and therefore the same validator closure; `.build/native-archive-worker/worker.js`. |

Rebuild the coherent normal app/Workers rather than replacing one served worker
in an old fixture. Main app import URLs/content-addressed asset names, resulting
worker/app byte-SHAs and signed package/outer pins must be regenerated and
stream-verified through the existing root build/staging workflow. The normal
serial script may rebuild other generated assets; their actual changed/unchanged
hashes are observations for that build, not predicted here. No source module
list, dispatcher, alias, static stager/OCI bootstrap hash consumer or declared
runtime capability changes are needed for this one export. In particular no
Native source/glue/WASM, Native build identity/default, SDK/archive input, ABI,
model/format, host adapter/Files/UI or old retained Native pins change.

Root must rerun the UNCHANGED complete tangency workflow after the normal build.
That run must reach the same FINITE_CONTACT_OUTSIDE control and all later finite
uncertainty/circle-circle/refusal/travel/.cad checks; a source repair or compiled
bundle alone is not an after-pass claim. Preserve original R1 and any next first
failure. The ordinary contract and broader Gate1 closure remain unchanged.
