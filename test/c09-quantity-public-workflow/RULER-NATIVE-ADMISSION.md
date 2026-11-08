# Additive native LinearDimension admission controls

**Source only, unexecuted.** Prepared against Core `86a461256f7d38aaad81909cc3d6fde4adff78c3`, which includes the shared native ruler record and actual registered EndPoint validation. No tests/probes/typechecks/build/browser or malformed-file construction was run during this task. Existing positive C09 quantities/displays, twelve formula refusals, travel and three Save/Open cycles remain in the ONE workflow.

## Exact expected public outcome

Both new controls require **`CAD_ARCHIVE_INVALID`**, not an error list or a generic engine failure. Source trace:

1. `nativeArchiveCodec.worker.ts:decode` verifies ZIP/descriptor/SHA/design-root content, constructs the authored envelope and calls `projectValidationCore.ts:preflight` before source hydration/replay/adoption.
2. `preflight` calls the same `validateProjectSketch` in `sketcher/io.ts`. For LinearDimension, `captureLinearDimensionRecord` requires exact native record/data fields. IO then resolves both actual source references, requiring the registry/index objects to be real `EndPoint` instances with exact identity.
3. An unknown data field throws the helper's normal Error; a real Segment reference passes existence admission but fails the actual EndPoint test with a normal Error. Neither error supplies its own code. The codec's message catch therefore emits `CAD_ARCHIVE_INVALID`.
4. `nativeArchiveClient.ts` preserves that code; PM's normal `failOwnedRestore` returns the original failure when cleanup succeeds. The normal host `native-project-file.mjs` `.cad` route delegates directly to that restore, and `index.mjs:openProject` rethrows before `published`/frame adoption.

Unexpected cleanup, cancellation, integrity or replay failures must fail the workflow at their real code. No code is accepted merely because it is an error. No transport defect is inferred or reproduced here; this is a source-confirmed expectation for the owned normal-Error cases.

## The two genuine own-file derivatives

The driver uses the byte/SHA-equal, real `edited-3inch.cad` Save from its own public authoring chain. `malformed_rulers.py` uses existing independent standard-library ZIP utilities to locate the one actual saved LinearDimension and an actual Segment ID in that same source. It never parses an opaque ID or manufactures an endpoint locator.

- `unknown-data-field.cad`: add only `data.unsupportedRulerField: true` to the actual ruler. This exercises the unknown **data** field branch. The outer record-field rule is source-reviewed but is not separately runtime-qualified by these two inputs.
- `segment-reference.cad`: replace only ruler `data.a` with the actual saved Segment ID. The target exists; it is not an EndPoint. All other ruler fields/references remain genuine and unchanged.

The independent builder recompresses the changed sketch entry using the declared raw-deflate profile, updates its CRC/size/SHA, updates the required-entry descriptor and designRevision, then rebuilds the canonical ZIP directory and manifest. Other entry payloads are retained byte-for-byte. It does not use the production encoder/parser, validate a fake successful Native model or modify the original Save. Mid-workflow invocation constructs only these explicitly authorized negative inputs, not a separate positive qualification step.

Each derivative is written through the normal own My files API, awaited, synchronized and independently byte/SHA-matched to its own server copy. It is then opened through the registered `open-project` command. At that point the active accepted document has newer `inch(2.5)` source and a real undoable journal; the source archive contains `inch(3)`. A successful accidental adoption cannot hide behind equal geometry.

The genuine existing Unsaved changes dialog is required. The driver records its labels and clicks the actual visible `Discard and open` button using a trusted browser action. It does not override `host.ui.confirm`, alter a model or bypass the normal Open transaction. Despite that consent, malformed candidate adoption must refuse atomically: raw accepted source/history/geometry, all quantity/display fields, presentation, journal, counters, material revision, document tokens, path/dirty association and current resources remain exact. This is not a close/unload/filesystem-race test.

After both refusals, real public formatted/canonical/Native reads must work. A normal parameter edit back to `inch(3)` must rebuild the current Native body; shared Undo returns to `inch(2.5)`. The original final native Save, server synchronization and fresh signed Open then complete the same workflow. There are still exactly three positive Save/Open cycles, not a new imported or alternate model.

## Independent AFTER-WHOLE validation

Only after the entire driver passes does `check.py` verify both derivative files and their exact server-readback copies. The existing independent ZIP32/CRC/SHA/designRevision reader must accept their container integrity; thus a corrupted container cannot masquerade as the intended semantic refusal. The checker requires exactly the one stated parsed ruler mutation, unchanged model/definitions/other source/material/presentation domains, unchanged other compressed payloads, actual saved IDs, preserved original Save SHA, exact public failure code, unchanged active state and healthy public continuation.

`.cad` is mandatory before execution; the driver asserts the composed host advertises it. Historical JSON extension fallback was removed from this current workflow. No foreign import, historical migration, production format change, account probe, private positive model write, UI build or deployment is introduced. Source readiness is not a Native/browser qualification claim.
