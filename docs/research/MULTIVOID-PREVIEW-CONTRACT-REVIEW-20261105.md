# Independent shared-contract preview review

Reviewed the shared-contract change later committed as `42bda4c5a79f386470362ef3ea9300f3558c7ed7`, and independently checked the legacy follow-up `a9dafce6e33c442c9ff16d0124c44236711eb5fc`. **One concrete shared-boundary edge was found and corrected by root; no remaining blocker was identified in the reviewed contract paths.** This lane changed only tests/notes and did not edit shared/native/provider code.

## Finding and correction

Initially, ledger/model required unavailable preview only when `resultKind==='multi-material'`. `captureSolidMetrics` intentionally labels evidence without resultKind as `unclassified-nonempty`; it can still carry known material/void counts. A controlled legacy record with materialRegions=2 and voidRegions=1 therefore reached the legacy Float64 fallback and exposed a preview. [Initial real capture/model receipt](../../test/multivoid-preview-review/initial-model-receipt.json) preserves that observation; its four reviewed source hashes exactly match 42bda4c5a.

This was a shared-contract bypass, **not an established route through the then-current pinned raw adapter**, which separately required classified evidence. Root changed the forward guard to predicate on known SMLib counts regardless of resultKind. The inverse reason guard still requires explicit multi-material classification, so contradictory legacy known-count records refuse instead of rendering or being reclassified. No unknown count is invented and no native shape is healed.

## Independent after-fix controls

[Fourteen source controls](../../test/multivoid-preview-review/receipt.json) pass against the recorded shared-source hashes. They run real capture/model/ledger methods with controlled provider records, not actual kernel/browser qualification.

- A correctly classified whole result with unavailable status, the new reason and zero display bytes remains nonempty with original metrics, positive source triangle count and zero render vertices. The model transfers and detaches the zero buffer, rather than merely observing its length.
- Available preview, a substitute precision reason, nonzero unavailable bytes and legacy Float64 fallback refuse for known unqualified material/void counts. Single-material/no-void and OCC/Manifold misuse of the reason refuse.
- Both classified and unclassified legacy routes refuse through `evaluateWorkerSolid`, close the candidate owner and publish no new controlled registry output. An available modern preview also refuses at the ledger boundary.
- A valid hidden-preview result retains its private binding: a subsequent real ledger Boolean receives the same authenticated whole-result handle. This is controlled-provider dispatch/custody evidence, not a fabricated native Boolean proof.

`solidLedger.mjs` still validates native Float64 buffer shape and captures metrics before publishing. The display guard does not replace the native handle with a mesh or reinterpret it as empty. `MWorkerSolid` stores only the transferred zero-byte Float32 projection for this reason and a frozen unavailable descriptor; the actual container stays in the owner ledger. Native Float64 data/handles do not enter authored history through this change. Native operation parameters remain replay intent.

## Manufacturing and runtime scope

Source inspection shows STL export checks worker shells with `assertLegacyGeometry` (`web/app/cad/exportBundle.js`); the worker 3MF adapter explicitly requires an OCC enclosure (`web/app/cad/export/workerEnclosure3mf.ts`). A hidden SMLib MWorkerSolid cannot qualify as that enclosure. No generic manufacturing route consumes its zero preview positions. This review did not run export browser controls.

Agent inspection can retain the nonempty opaque output ID, native metrics and explicit unavailable reason while rendering zero vertices. Available previews elsewhere retain their existing display scope; they are not universal orientation/manufacturing certificates. Float32 precision loss and material-side orientation remain separate reasons.

The bounded runtime follow-up is actual provider zero-display bytes/reason, downstream native reuse, common undo/redo/native replay and explicit export refusal. Root subsequently reports matched a9daf multi-void/output-history tests and signed fixture20374 D/island/fill/edit/save/reopen/account controls passing with desktop e3315cebb. That is separate owner evidence, not an independent rerun by this source-review lane; root owns its exact runtime receipts and aggregate status.

No universal geometry correctness, parity, kernel-default, manufacturing-export or full release claim follows. This lane performed no app build, deployment or packaging.
