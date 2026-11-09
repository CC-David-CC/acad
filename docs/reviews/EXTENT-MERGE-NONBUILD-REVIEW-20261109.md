# Extent merge: independent non-build source review

Reviewed immutable ACAD `14b21b0340475a06f5b18c927b546ce5403f5466`, merge of root `12de85e84f212e1ec7338b3525d543a89a58856f` and extent `8678c35b770855fa3978abfeab789c76f303bfd1`. Source-only BEFORE review: no production or acceptance files changed; no parser, test, probe, build, Native operation or browser was run. The later constructor-binding composition is outside this immutable review.

## Confirmed: CAD-AUTHORED-EDIT-POSTCOMMIT-RECEIPT-01

New extent edit/travel selects `authoredFeatureOperation('profile-extents')`. After its modification callback resolves, the generic receipt path at `web/app/cad/craft/craftBundle.ts:1476–1480` calls `requireCommittedCurrent`, reads `inspectAuthoredEdits().revision`, then removes the abort listener in `finally`.

The lifetime predicate correctly throws `superseded(true)` for caller loss. It does not cover all subsequent readers: `inspectAuthoredEdits` at lines 851–872 invokes `sketchRevision`, `inspectMaterialSurfaceRevision` and `inspectDocumentRevision`; the material reads used for `fullTip`/`controlsCurrent` are outside its initial best-effort catch. A thrown read after successful publication can escape without a committed marker. A listener cleanup exception in the final `finally` can likewise replace a successful receipt or committed error without retaining that status. `profileExtentCommands.ts:111` directly returns this Promise. Shared Undo/Redo dispatch reaches the same branch.

This is a source-confirmed classification hole, not an observed runtime incident, bad geometry/J commit or rollback. It is inherited from the generic path newly selected for extent edits/travel. Counterbore/blind branches immediately above already have explicit committed receipt catches; extent creation has its own committed/cleanup tracking. Suggested repair: derive publication knowledge from the actual acceptance callback, preserve committed:true and any known actual receipt/revision across subsequent receipt or listener-cleanup failure, retain original causes, and never relabel prepublication rejection or retry/rollback publication. A truthful common settlement boundary can avoid another duplicated per-kind catch while preserving existing receipt shapes and codes.

## Other reviewed unions

No additional confirmed defect was identified in this bounded review:

| Seam | Source evidence |
| --- | --- |
| Modern typed families | Explicit family strings replace positional list assumptions. Exactly one selected constructor, exact hole source/region/runtime identity, typed-history-control refusal and old-selected-constructor-only counterbore restriction remain. |
| Typed roles/variants | Active roles select only real variant fields. Signed one-sided/nonnegative two-sided domains use actual extent capture, not a blanket positive-length rule. Raw names remain names. Standalone countersink angle roles remain outside the active map. |
| Manifest/Craft | Exact selected-profile identity targets include extent; the old depth-specific rectangle convenience explicitly refuses extent variants. Existing prepared expression/source/J publication is reused. |
| Journal | Extent edit/travel stores exact raw active variants and common identity. Named-binding erasure/reinterpretation is refused. Append Undo includes suppression and active fields; deletion Redo compares type/key cardinality/values. Both new edit requests are charged by the small-fragment max(UTF-16,UTF-8) append budget, and profile-extents participates in total/eviction charges. Physical field transactions retain source/sketch/per-field accounting. |
| High-water | projectBundle.ts:328 release clears the reservation set only; it does not lower or recycle the feature high-water counter. |
| Source proof | Actual face/source/frame/boundary/definitions/history/evaluation owner are captured. Two independent source and semantic Workers bind source/digest/evidence/request; ledger requires actual registry source identity and current owner. Native measurements remain publication checks. |
| Type union | SolidKernel.ts includes the extent request and its result operation literal. |
| Native quota ownership | Old chargeSelectedResult still releases on quota. Only extent receives non-retiring chargeProfileExtentResult. Its helper retires a positively established fresh result once with original pointer and exact census acknowledgment. Unknown Native/exchange/scratch/retirement custody is terminal, not recoverable quota failure. |
| Controller/refusal union | Exact pending extent kind, finite refusal set and bounded exact refusal fields are required. Unknown/malformed/ownership/cleanup failures close the actual Worker. Old counterbore/blind/drawing/other operation paths remain in the union. |
| Cancellation custody | Genuine signal intrinsics feed a private signal to existing send/shutdown. Main sets nativeStarted before evaluation and closes the actual candidate owner on later failure, including failure before model adoption. This is source reasoning, not measured cancellation coverage. |

Extent admission remains exact primary manufacturing JS `32eec74e3019d9e2d767c9016f05aa3daa49441c6102423a269d67b9c7f02a08` / WASM `abbf2aa02a6f2101c600aa1eedd20fa80ab2db206e677ca860d9c5103cdfbfcc`, with required V3/Boolean/manufacturing/through-hole/planar capabilities. No new mechanical-pair availability, Native geometry/resource/lifecycle qualification, or exhaustive inherited-provider review is claimed.

## Principal exact source inputs (SHA-256)

The merge Git object fixes all surrounding imports and history. Main reviewed files:

```
396ebb07d76bfd8791b958a887169ecea0aadcb2aae34287f84723795419dae4  web/app/cad/parameters/modernPhysicalBindings.mjs
916ea51109730349f4cb2e25ef4dd7ae3db27a2ccb5a328f52b42ff543c7b671  web/app/cad/parameters/physicalBindingFields.mjs
c5e5c343c65d292b5d53525a68c27dc2f62d8646f476fb642032c6e86f5478b6  web/app/cad/parameters/physicalBindings.mjs
5d6e3f1fff9e21c1172c2e96ff5becb2f8becd602769caee97ce62c6816d77f9  web/app/cad/parameters/verifyPhysicalBindings.mjs
28feab4519f93ca2d85530c6c16d85dfa8b95bd50f6b47989734700bafcef4d0  web/app/cad/parameters/authoredPhysicalManifest.mjs
ba40e55fdaecb8306e39d63683df1968156a08677cdc24e64fadd70737b2d9d8  web/app/cad/craft/authoredEditJournal.mjs
37ff67d3c46f17a1a1e56fdb671eb560c233ef48842af65889ccac3f5450372a  web/app/cad/craft/craftBundle.ts
9142a4dafb3e254cb0e69431f195ae8ddd9fcfd4edbcd8db1e2cc03521060908  web/app/cad/craft/profileExtentCommands.ts
e6b9874e612354e9f8eb73d0fac4daa94c2d194d60d16d2f83a6085a83fe0802  modules/engine/solid/ownedProfileExtentFeature.mjs
79bde288433126977863f52b11f2eed3d297b80d64399adef8d0156690cbbb70  modules/engine/mount/ownedProfileExtentPlan.mjs
77630a6b0c7814444b4387682a8949e0a6a5492880f0ed52a2580c5c26d093a8  modules/engine/mount/ownedProfileExtentWorker.mjs
b5dc2d70389cc0c7b2b206b48f292ae17d654dcff8c8b9615f9cb2b4d5f43831  modules/engine/mount/oci-verified-worker.js
a6db3ce56944638b471a1e806af48df22e4ea3f7c0e135eab903c3e756b5de52  modules/engine/mount/worker-controller.mjs
1e202cde1e99f962eb37a97d30dd32d4f4ba58c61fc5917ea2d99faaa941b409  modules/workbenches/modeler/features/workerProfileExtent/workerProfileExtent.operation.ts
34595474cf092d9e5719737b44e66bb0a075a373eff539ab1ccf1eb3dad496be  modules/engine/solid/SolidKernel.ts
18aaf36dc69f4fca25f6f8ee11eb8092d1d12c2fc915773c2b835e01d79b65cf  modules/engine/solid/solidLedger.mjs
```

Other read source: physicalLiteralFields.mjs, authoredHistoryControls.mjs, workerHistoryControlCommands.ts, allocator and prior selected-profile creation cleanup. Build graph unions/digest regeneration are a separate root-owned composition.
