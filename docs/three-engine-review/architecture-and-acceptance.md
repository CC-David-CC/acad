# Three-engine acceptance checkpoint — 2026-11-05

Scope: independent headless browser API/Worker evidence, source audit at CAD `5a53639b5`, and subsequent numerical fixtures at root `9e9dadf84` and SMLib candidates `a5ba34740`/`a548e2da0`/`047e41961`. No product, registry, UI or deployment changes belong to this review branch. Preserve the existing independent parametric design model, sketch solver and history. One selected kernel evaluates the whole canonical model sequence; render projections are derived data, not separate editable models. Initial acceptance runs that same model sequence independently under OCC, Native Mesh and SMLib. No continuous cross-kernel conversion or imported modeling framework is proposed. A document mixing three engines is outside initial acceptance and must refuse unsupported mixtures explicitly.

## Actual numerical proof

The reusable controls and exact receipts are in [test/three-engine-acceptance](../../test/three-engine-acceptance/README.md). Real same-origin Workers ran under CSP `script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'`, without JavaScript `unsafe-eval`, canvas or fabricated success responses. Test-only modules were SHA-pinned and supplied through CDP Fetch; production mount/Worker/WASM bytes were fetched and pinned independently. Each run owned and closed its browser context; no page Workers or CSP violations remained.

| Control | OCC / 20467 | Native Mesh / 20467 | SMLib a5 / 20549 |
| --- | --- | --- | --- |
| Primitive 10×20×30 and translated fractional box | Pass | Pass | Pass |
| Overlap common/union/subtract | Pass | Pass | Pass |
| Touching union, disconnected union | Pass | Pass | Pass |
| Independent triangle signed volume/bounds for all seven nonempty cases | Pass | Pass | Pass |
| Returned display-buffer mutation cannot alter second read | Pass | Pass | Pass |
| Disjoint common; coincident primitive-box subtract | Explicit unsupported | Empty solid pass | Explicit unsupported; candidate closes |
| Foreign mount, units, negative dimensions, unknown op, pre-abort, disposed handle, closed mount | 7 pass | 7 pass | 7 pass |
| Closed mount after exhausting eight-name lifetime budget | Pass | Pass | `RESOURCE_LIMIT` instead of `MOUNT_CLOSED`; concrete failure |

The earlier SMLib 20547 prototype returned generic `ENGINE_FAILURE` for the two empty cases, `INVALID_REQUEST` for unknown operations and `DISPOSED` after close. Its r2 receipt is retained. Candidate `a5ba34740` fixes the error distinctions and has its own receipt/config; this does not make all empty geometry supported. All-numeric-qualified remains false for OCC/SMLib because the two empty-result rows remain unsupported.

Actual a5 lifetime counterexample: create and dispose eight unit boxes; close the mount; submit a valid ninth box. `reserve()` in `smlibMount.mjs:18` checks the exhausted budget before `send()` checks closed state, yielding `RESOURCE_LIMIT`. This is a machine-readable lifetime inconsistency, not geometry corruption. The reusable matrix now includes the control; implementation owner has the reproducer. Ordinary after-close on a non-exhausted mount passed a5 r1.

Followup `a548e2da0` fixes the exhausted/closed check and limits empty classification to retained authored primitive boxes. Its fresh 20551 matrix passes 15 rows with two explicit unsupported empty results. An independent ordinary queued-microtask cancellation counterexample then exposed a dispatch/receipt gap; `047e41961` fixes it. [Lifecycle and timing observations](lifecycle-and-timing.md) retain exact before/after scope. Historical a5 failures above are not current unresolved claims. These mount proofs still do not qualify integrated app descriptor/operation/history wiring; root found a missing `validateMount` descriptor seam that helper-only tests bypassed, so actual app qualification is required.

SMLib a5 Worker SHA `3e870ad64aad4d5e19d4629601d9e407f16c8b546edb26539fbcc7aa0aa62472`; WASM `a48a3283760c21337881c5e2d5c973dbc62cf95cae46d1c012effd75389eb1ae`. Its source empty shortcut returns a refusal, never a synthesized solid or fallback. `smlibWorker.js:10` uses native evidence AABB separation/touch for common, and retained identical authored primitive boxes for subtract. Nonempty results still require SMLib native copy/Boolean/evidence and tessellation. General native errors remain failures. A followup restricting AABB reasoning to authored boxes is pending independent review; no general Boolean-derived empty classification is accepted here. Kernel volume uses its existing approximate API; these ordinary analytic box controls do not qualify general manufacturing accuracy.

## Shared architecture and actual gaps

| Source at 5a53639b5 | Finding and implication |
| --- | --- |
| `web/app/cad/craft/craftBundle.ts:845`, `:895`, `:1120`, `:1132` | History stores `{type,params}` requests and a pointer. Candidate replay uses a private registry/sketch storage, awaits each registered operation, validates lifetime and publishes models/history together. This substrate is reusable; it does not itself implement three-engine feature parity. |
| `web/app/cad/craft/workerFeatureCommands.ts:9`, `:38`; `modules/engine/extrusion/candidatePrismLedger.mjs:19`; `modules/engine/projection/centeredHoleProjection.ts:22` | Current worker mechanical capability/projection/source bindings explicitly require OCC. Bracket create/edit/parent repair cannot be advertised for SMLib merely because its box/Boolean mount works. New registered engine-specific operations, source bindings and checked projected models are required. |
| `web/app/cad/projectManager/projectEnvelope.mjs:19`, `:41` | Native v2 fixes millimeters and persists operation requests/sketches, with no generic document engine field at this audited base. Persist the whole-sequence kernel selection/provenance through an admitted schema; do not infer replay engine from a current default or save transient kernel handles. The authored model/history remains canonical. |
| `web/app/cad/model/workerGeometry.ts:11`, `:39`; `web/app/cad/craft/nativeEngine/nativeOperationService.ts:109` | Legacy OCC/native/worker representations refuse incompatible operands before conversion. Preserve these checks. A shared operation vocabulary must dispatch through an explicit supported representation, never silently reroute to another kernel. Native Boolean really uses Manifold; the legacy BRep engine interface alone is not proof of interchangeable kernels. |
| `web/app/cad/craft/craftBundle.ts:69`; `web/app/cad/craft/evaluationResources.mjs:4`, `:97`, `:120` | Generic ownership pool supports current candidate/accepted/detached lifetimes, with at most two mounts per owner and three total. Availability of three choices does not imply three mounts in one history. Keep explicit budget failure for unsupported mixtures; do not raise limits automatically. |

Root `9e9dadf84` adds common `readSolidMesh`/`assertSolidBinding` and engine catalog support; the numeric runs exercise those real methods. An engine catalog entry is availability metadata, not proof of graph replay, native persistence, default readiness or operation parity.

## Remaining reusable acceptance matrix

Every row below must retain requested engine ID, actual runtime/representation, millimeter units, authored operation parameters and machine-readable refusal codes. A runtime receipt must name exact app/client/Worker pins and fresh document/account scope. Source-only, synthetic controls and earlier browser receipts must stay separately labeled.

The current decision is evidence-led OCC primary, SMLib primary, or both; no default choice follows from seven boxes. Compare Chrome correctness, failure modes, initialization, execution, actual kernel memory and manufacturing exports using the same canonical model. OpenUSD is optional exchange/interoperability, not the native project format.

| Requirement, independently for OCC / Native / SMLib | Existing useful evidence | Required next bounded proof |
| --- | --- | --- |
| Ordinary primitive/Boolean dimensions, bounds, signed volume | This actual Worker matrix | Integrated actual engine dispatch with the same independent oracles; retain explicit empty capability differences |
| Bracket create then dimension edit | OCC mechanical/config history tests; `test/typed-bracket-bindings/bracket.test.cjs` | Real engine-specific graph on each kernel through browser agent API, with no fallback; explicit unsupported capability until implemented |
| Rejected edit preserves geometry, authored source, counters, history and accepted resources | Existing generic atomic transactions and OCC controls | Repeat exact before/after state/native bytes on each engine; failed candidate must not retire accepted owner |
| Undo/redo and failed branch after undo | Shared candidate history/pointer infrastructure; old native workflow controls | Await actual public command receipts, compare restored dimensions and provenance, ensure rejected branch preserves redo |
| Native save, close, fresh replay, edit, save again | Native envelope/replay source; carried OCC/current signed tests | Same registered graph/provenance after fresh browser document and actual saved bytes for every engine; no live native handles in file |
| Public browser agent typed admissions/refusals | Separate `test/smlib-integration` proposed contract at `b51003a4c` | Browser lane owns real command/transaction/native conformance. Proposed assertions are not implementation acceptance |
| Pending cancellation and stale result | Real pre-abort here; source pool cancellation; existing engine-resource browser controls | Hold an actual Worker response, cancel/supersede/close document, release response; prove no publication and accepted owner remains usable |
| Disposal, duplicate close, foreign/ABA handles | Real cross-mount/disposed/close here; original actual mount tests | Cross-engine handles, original-handle ABA, invalid bootstrap/WASM, operation crash and disposal fault; retain exact genuine versus injected timing scope |
| Available three vs mixed history | Three independent real numerical Workers available | Same graph per engine first. Mixed-three-engine history is unsupported pending explicit operand and resource design |
| Common performance and memory | Exploratory actual Chrome mount/roundtrip timings; shared-process/cache limits recorded | Repeat representative model sequence under controlled cold/warm conditions; measure actual Worker/WASM memory, never substitute host JS heap |
| Manufacturing export integrity | Existing OCC/3MF receipts are separate; current mesh reader explicitly returns display-only | Compare admitted manufacturing outputs from the same model on each kernel. Do not relabel a display mesh as manufacturing-qualified; unsupported formats remain explicit |

The older `test/webos/geometry-engine-comparison-browser.test.cjs` compares real OCC/Manifold kernels but includes in-page OCC. `native-mesh-workflow-browser.test.cjs` has an older Files stand-in. Neither substitutes for current three-engine Worker or signed/native replay proof. No 128 MiB/performance qualification, STEP translator, general feature catalogue, human UI, or canvas coverage is inferred from this checkpoint.
