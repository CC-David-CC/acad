# C08 storage consistency decision: one authored pose, one derived frame witness

Docs-only resolution against32ae. No new source code, schema implementation or execution. This supersedes the earlier phrase "no frame cache in the ZIP": **the proposed compatible implementation DOES persist the existing sketch `metadata.boundaryFrame` as a derived, validated cache/witness.** It does not persist an additional Native analytic plane, native member index, handle or separate authoritative world-pose definition. The acceptance oracle must check that cache rather than assert that it is absent.

## Exact existing distinction

- Authored local entities, constraints, generators, constants, labels, ordering and other sketch intent remain the one saved sketch source. Their coordinates are sketch-local.
- The current world-placement witness is specifically `sketch.metadata.boundaryFrame = {origin,x,y,z}`. It is not the same as `sketch.boundary`. The latter stores referenced external model curves; this finite independent-source implementation requires its `lines/arcs/circles/nurbses` arrays empty and preserves them exactly. It cannot discard or reinterpret a nonempty boundary as local intent.
- `ReadSketch` in `web/app/cad/sketch/sketchReader.ts` builds local geometry from `objects`, without itself validating metadata.boundaryFrame. World projection uses the owning real `MFace.csys`. Therefore a ReadSketch success is NOT proof of cache coherence. The private pre-source hook must validate the frame cache before registry initialization calls ReadSketch.
- `sketchDiagnosticService.ts` checks saved metadata.boundaryFrame against the actual face frame. `acceptedSketchProjectionWorker.ts` and `projectionWitness.mjs` bind the frame to the actual solved source/evidence. `inPlaceSketcher.js` captures boundaryFrameAtOpen, preserves it on save, and validates it against the current face before committing. `solveWorker.ts` sketch-save-validation compares the request's current frame and the saved metadata frame. Existing source-plane depth preparation explicitly changes only this field.
- The four protected part read/export services capture immutable source bytes plus each actual source face's frame and pass both as sketchOverrides/sketchSourceFrames into the same replay. They do not turn metadata into an independent pose authority.

## Chosen finite representation

No new sketch format and no second copy of local geometry. Saved SOURCE_FRAME_V1 params from the previous plan remain the single placement authority: exact local basis or one rigid base/axis/angle/pivot/translation, plus the exact source or Native parent locator. For a Native parent, current membership/analytic plane is rederived from its genuine earlier owned BRep; saved nominal depth/region/context is not a plane witness.

The sketch bytes continue to contain the existing exact metadata field:

```js
{
  // existing local sketch fields and metadata retained
  metadata: { /* existing other metadata */, boundaryFrame: {origin,x,y,z} },
  boundary: {lines:[],arcs:[],circles:[],nurbses:[]}
}
```

The operation type/source identity determines that boundaryFrame is derived from the attachment/placement. A caller-supplied `derived:true`, cache hash, frame revision or trusted flag is unnecessary and would not establish authority. No new persisted document/geometry epoch is proposed: session revisions are not durable proof across Open. Existing .cad manifests/SHA/CRC prove stored bytes, not geometric correctness of their frame values.

Source identity is the original canonical producer feature and its actual constructed source face/defaultSketchId. It does not change when the parent moves, its depth changes, the cache bytes change, or the source is explicitly repaired to a different eligible parent. Opaque region identity remains determined by actual local source membership; discovery must corroborate it rather than promise all arbitrary profiles are stable. The Native parent's selectionId remains an opaque authored locator, and never becomes the child's sketch face ID.

## Runtime validation, not two synchronized pose authorities

For each accepted attached source there is a required relation:

`saved boundaryFrame == independently derived current attachment frame × authored local placement`.

The right-hand side comes from the saved operation/parent graph and actual Native parent; it never uses the saved boundaryFrame as an input pose. The saved frame can confirm or fail that relation, but cannot override it. Use the unchanged existing exact/frame-equivalence policy where already required; this plan does not widen it to the50pm geometric budget or drawing tolerance. Saved authoring values/IDs/order remain exact. The50pm small-design criterion applies separately to the eventual independently measured placements.

The binding for a live validation is captured runtime identity, not a new persisted clock: manager/document generation and signal, complete authored history identity/signature, source namespace/key/version/bytes, parent/current source model identity, exact backend/descriptor, Native candidate owner/token and source witnesses, journal/full-tip revision and actual face frame. Losing any binding invalidates the preparation. After Open these runtime witnesses must be rebuilt, not loaded as trusted proof from the archive. Reuse current captured streams/identities and current accepted source faces; do not introduce a second synchronized revision flag or global pose cache.

Three distinct modes are required:

1. **Unchanged replay / read / native Open:** independently derive the real parent frame first, compose placement, and validate the stored cache against it before ReadSketch or dependent Native work. A missing/malformed/stale cache refuses with a typed source-frame failure. Do not rewrite it silently on Open, use it to position the new source, or accept it merely because the archive digest matches. A read observation never writes source storage or J.
2. **Explicit accepted frame/depth/attachment edit:** capture exact old source bytes and old actual source face/operation under the existing currentness guards. Validate the old cache against that captured accepted face/definition; the new private candidate independently reads the new Native parent and derives the new frame. Worker preparation may change ONLY metadata.boundaryFrame for affected descendant sources, plus the exact requested producer/parent intent delta in history. It must prove every other local/metadata/boundary field unchanged. A mismatch in the original accepted source cache is not permission to repair arbitrary data. The final candidate must use the same new frame in its actual source face, validated source bytes and Native feature requests.
3. **New independent attached source:** the genuine registered producer creates its own stable source face only after Native membership/frame admission. Existing empty-sketch Worker creation creates one actually empty local source with its derived cache bound to this real frame. This is normal public source creation, not a successful fixture seed or caller-provided source snapshot. Before publication it is subject to the same source census and frame check.

Any source-only cached frame edit made outside those guarded modes is invalid. Changing the cache does not repair an unresolved attachment. Explicit parent repair changes the saved locator only through the reviewed operation and obtains fresh Native authority before producing the new cache.

## Source-overlay/writeback order

The current static candidate overlay does not support late verified source installation; a new PRIVATE variant was proposed, not yet approved. Its complete flow must be:

1. Capture the original immutable local sketch/metadata bytes and full source/dependency inventory before replay. Capture expected old frames and exact requested operation delta. No accepted writes.
2. Replay earlier producers normally in ONE candidate. Resolve the Native parent through its actual protected ledger/Worker read. Produce the new independent source face with the derived explicit csys.
3. BEFORE registry initialization/ReadSketch for that source, run Worker source validation and independent reconstruction against the original request. In an explicit edit, receive complete verified candidate source bytes with only the authorized boundaryFrame delta and the matching frame witness. In unchanged replay/Open, verify the original cache and return/preserve the original source bytes; do not return a healed replacement.
4. Install only those returned bytes in the evaluation-private overlay, once and before the source can be read. The installer stays in the trusted Craft closure; operationContext receives the existing immutable read interface. Validate declared affected-source coverage and reject repeated/unexpected installation, post-read modification, missing frame evidence and full-tip source census mismatch. Subsequent source solve/profile/Native operations consume that exact verified view.
5. After all dependent operations succeed, prepare a single accepted storage write batch for authorized edited sources, plus the matching operation/local placement/attachment and shared J/full-tip tokens. Freeze/charge the complete journal proposal first. Commit all in the existing publication interval, then notify. A no-op, read, stale reply, cancelled or failed candidate publishes neither cache updates nor source intent. No callback/write to accepted storage is used to make old readers succeed.

For ordinary source geometry edits (primitive/dimension changes), the cache is retained and must still match the actual current source face; those edits do not grant frame or parent-edit permission. Their independent Worker replay/evidence checks remain unchanged. Existing human sketch save captures the same actual source face frame, so it saves this derived witness without gaining authority to detach/reparent the sketch. If a parent edit is pending, existing active-editor/currentness rules refuse it; stale editor save must not restore an old frame.

## Exact reader / save / Open bridge obligations

| Bridge | Required adaptation / unchanged protection |
|---|---|
| Source producer + registry | Preserve separate independent MOpenFaceShell identity; actual explicit csys derives from operation/Native witness. Add pre-initialization validation as above. `cadRegistry.checkWorkerFace` stays strict; never write a sketch to the solid face. |
| `ReadSketch` | No need to make its local geometry parser choose a world pose. Caller establishes coherent source frame before invoking it. Do not strip metadata or relax parsing as a shortcut. |
| Worker source transitions / projection / diagnostics | Native cache validity is established before invoking their existing frame/source consistency contracts. Preserve frame checks; extend new source-owner discovery deliberately. Do not let pure solver success prove attachment validity. |
| In-place human sketch save | Existing open/current actual frame guard remains; retain metadata witness exactly when local geometry changes. No new UI or mutable-frame authority is added. Any previously hidden source-owner guard needs the same narrow source-producer recognition, not removal. |
| Point / STEP / manufacturing / drawing read replay | Capture original immutable source bytes and actual accepted face frames as currently; fresh replay independently derives the Native attachment and checks cache equality before reading. No live fallback or healed bytes. Same permanent observation owner, exact currentness/build/native result checks and cleanup-before-result. |
| Native Save | Persist the actual accepted source bytes, including the derived boundaryFrame cache. Save stays pure: no auto-reframe, source reset or model mutation. Require the current validated full-tip/source inventory as for existing shared saves; compare the captured stored cache against the actual accepted source face frame under the captured model/history/source revisions, with parsing/charging in existing Worker preparation where large. Missing/stale/unqualified coherence refuses before file commitment rather than silently rewriting it. No new main-thread source parse/large serialization loops. The archive source bridge/codec streams these exact bytes normally; manifests and compressed-span reuse naturally account for their changed contents. |
| Native Open | Archive/validation Worker checks exact data schemas, locator IDs and causal references first. Full candidate replay then reads actual Native parent before initializing the attached source and validates the stored cache. Only after the complete graph/source census succeeds can PM adopt the new document. Native/Open should not transfer a decoded cache as authority or alter caller source data to hide a stale frame. No new PM archive owner/lease mechanism. A new typed error forwarding splice may be needed in PM's existing known validation-error catch; root must coordinate it separately, not modify archive ownership. |
| Journal travel | SAME journal entry stores exact before/after source bytes, including their derived cache fields, and exact requested operation/locator delta. Undo/Redo independently derive the historical target frame and verify the supplied historical bytes; do not canonicalize them or treat them as proof. Local source stays exact; redo tail/budget/high-water/publication behavior unchanged. Journal remains session-scoped; native documents persist definitions/cache, not the Undo log. |

## Tradeoff and explicit limits

Keeping this one derived cache preserves the current source/editor/solver/projection save contract and avoids a competing local-source schema or widespread ephemeral source-format adapters. It costs a source-byte change per moved source, journal byte charge and a changed compressed sketch span in .cad. Parent-only pose edits therefore cannot claim zero changed source bytes or reuse of those changed source spans. Unrelated source entries remain byte-identical and eligible for existing verified compressed-span reuse. This is a stated storage tradeoff, not two authoritative poses.

Removing boundaryFrame from persistence would require every editor, diagnostic, save validator, projection path, dependent solve and archive source to accept an authenticated transient frame view while retaining a single canonical local source. That is a larger alternative and is NOT proposed for this finite Gate1 slice. Nothing here approves skipping current frame/boundary authority. The temporary overlay is only a transaction-local derived view and is discarded on failure; it never becomes another independently editable document.

The eventual independent oracle must: (a) find and validate persisted derived caches, (b) recompute their required relation from saved authored placement/locator plus actual native parent observations, (c) compare exact local source intent before/after, (d) refuse a CRC/SHA-correct own archive whose cache is stale while its locator/local source are unchanged, and (e) prove healthy Save/Open/reedit retains correct cache/source/native geometry and resource cleanup. A test that merely asserts no cached frame exists in the ZIP would be wrong.
