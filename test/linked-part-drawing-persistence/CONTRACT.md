# Linked-part drawing persistence adapter

Contract frozen against Core `8b8adfc7b39d968e026c2078d971d62cf8cd6d37`.
**Unimplemented. Tests here observe the BEFORE boundary.** No native geometry,
browser, drawing realization, publication or E22 completion is qualified.
Root approved this format direction on 2026-11-07; production edits remain pending.

## One native document

Add optional top-level `drawings:[definition]` to the existing native envelope.
Exactly one definition is supported, using the actual
`captureLinkedPartDrawingDefinition` schema unchanged. A drawing-bearing file
has envelope `version:3`, `format:'codi-jsketcher-project'`, `unit:'millimeter'`.
No definition means no `drawings` property and the existing version2 writer;
removing the sole definition returns to that representation. Version3 requires
the property and exactly one dense own-data element. Reject null, empty/multiple
arrays, unknown fields, malformed definitions, v2 with drawings, and v3 without
drawings. Continue reading ordinary v2; do not add historical migration/import
machinery or a second drawing file. Older guarded readers reject v3 explicitly.

Proposed codec API:

```js
encodeProjectEnvelope(project, manufacturing=null, presentation=null, drawing=null)
decodeProjectEnvelope(value) // {project, manufacturing, presentation?, drawing:null|Definition}
```

The encoder's fourth argument is singular because the manager and current
metadata operation have one drawing. Only the envelope adapter constructs the
one-element array. Absence is canonical, explicit `drawings:null` is invalid.
Default v2 encoding and existing manufacturing/presentation fields must remain
exact. Envelope model/sketch/source structure and all authored IDs stay unchanged.
The proposed fourth argument is presently ignored by JavaScript; no caller may
use it before implementation and its retention tests pass.

## Definition, units and validity

Reuse `modules/drawing/linkedPartDrawingDefinition.mjs` and its declaration,
not a new schema or copy of its validator. Definition version1, canonical mm;
sheet and label coordinates are physical paper mm, distinct from model mm.
Rational sheet scale does not rescale model geometry. Display inch presentation
does not rewrite either definition or authored source. Future angular facts stay
canonical radians; this schema saves no measured facts/angles today.

Existing limits remain: 65536 UTF-8 definition bytes, 3 views, 16 dimensions,
128-unit drawing/view/dimension IDs, opaque region IDs <=8192 UTF-16 units,
selection IDs <=16384, finite bounded sheet/placement values. Keep actual strict
own-data, dense-array, getter-free capture rules and the existing total native
file/tree limits. Worker-private native HLR's 4MiB cap does not expand UI metadata
limits. Do not attach projections, values, source copies, digests, runtime handles,
native indices, source frames, reference-resolution states or temporary receipts.

Schema validity and reference resolution are separate:

| Input | Native Open / subsequent Save | Drawing realization |
| --- | --- | --- |
| Invalid schema/unit/version/bounds | Reject before staged writes; no incoming definition installed | Not attempted |
| Valid exact references, current supported part | Retain exact intent | Later qualified shared read may resolve |
| Valid missing producer/source/curve/selection, changed region/type, unavailable drawing build | Open otherwise valid part, retain original definition verbatim | Explicit unresolved reason; no substituted target/value |
| Part's own history cannot rebuild | Existing restore failure/custody policy; no incoming definition installed | Not published |

The definition capture deliberately cannot prove native membership. A target
feature ID not found in history is a valid unresolved reference, not invalid JSON
or permission to drop intent. No closest geometry, latest-body search, opaque ID
parsing, provider/native fallback or automatic reference migration. Unresolved
definitions may be saved; completeness-dependent manufacturing drawing export
must refuse until explicitly repaired/removed. This adapter does not implement
resolution, dimensions or a renderer.

## Exact core boundaries

| Production file | Required bounded change |
| --- | --- |
| `web/app/cad/projectManager/projectEnvelope.mjs` | Import existing definition capture; exact v2/v3 admission, fourth encoder argument, singular decoded drawing; retain all existing shape/metadata checks. |
| `projectValidationCore.ts` | Run definition structural capture through the codec in the actual validation Worker; preserve full validated envelope. No native reference validation or model evaluation here. |
| `projectValidationWorker.ts` | Existing `value` already retains the full envelope; preserve it, including drawings. `storage` remains model/sketch bytes only. No drawing-as-sketch storage or main-thread whole-envelope transfer bypass. Add code only if tests reveal retention/type changes needed. |
| `projectManagerBundle.ts` | Private captured drawing + revision; pure capture/host Save retention; document guards; restore-after-success; New/reset/owned dispose cleanup; interfaces. No public setter or journal publication yet. |

No change to geometry serialization in `projectBundle.ts` is necessary: drawing
is outside `project`; its existing pure `captureModel()` remains canonical. No
new geometry/native Worker call for drawing metadata. No changes to material or
geometry digest domains, resource budgets or canonical unit engine.

The actual Worker preflight returns the full original envelope after validation;
its projected `storage` intentionally omits all envelope metadata. Verify both
paths rather than inferring retention from `storage`. Byte restore already uses
this Worker. The string restore currently validates only typed source in a
Worker: drawing-bearing/version3 string input must also use it and consume the
validated full value, while preserving existing typed parameter preparation.
No drawing-bearing accepted restore can bypass Worker structural validation.

## Manager custody and publication

Add private `drawingDefinition:Definition|null`, `drawingRevision`, and readonly
`getLinkedPartDrawingDefinition()` returning the immutable captured value. No
external setter in the persistence slice. Native restore is the only initial
installer; later normal shared transaction ownership installs metadata jointly.

`captureCurrentProject()` includes the singular definition in the same envelope
construction. `capturedManufacturingJob()` captures drawing identity/revision
and rechecks them after every await and in its `isCurrent` closure. In
`prepareHostSave()` the manufacturing helper rebuilds an envelope from only
project/manufacturing; explicitly reassemble its validated result with the
captured presentation AND drawing using the codec. Otherwise the current branch
would lose drawing intent on material-bearing saves. Do not add drawing to the
geometry or manufacturing snapshot digest. The host full native envelope and
dirty serializer must nevertheless include it.

Add drawingRevision to `inspectDocumentRevision()`; exclude it from
`inspectMaterialSurfaceRevision()` and geometry fingerprints. A paper-layout edit
changes document dirty/currentness and shared journal chronology without changing
geometry epoch, source bytes, counters, material assignment revision or native
result names. A no-op does not increment revision or append a journal entry.
Transient document/geometry bindings are not saved in the definition.

During restore keep decoded drawing detached/operation-local until the SAME
guarded geometry rebuild and round-trip checks succeed. Install it beside
manufacturing/presentation only after the final custody guard. Failure/cancel or
late stale completion must not install it, clear a newer document's drawing, or
retarget an unresolved reference. `requireEmptyWorkspace()` includes non-null
drawing state. `resetDocumentState()` clears it only for the current generation;
owned project disposal must promptly drop metadata/derived-job references through
that same lifecycle, without an old restore's finally affecting a replacement.
Current `projectBundle.ts:196` disposes its document lifetime but does not call a
manager disposal hook. The bounded manager implementation can attach an intrinsic
abort listener to its current document signal on reset, retire the prior listener,
and clear only its own matching signal/manager slot on abort. It must not call
`resetDocumentState()` after abort (that method requires a current generation).
Test reentrant reset/replacement and disposal; no additional project serializer
or projectBundle mutation is presumed necessary.
No native handles or derived cache are introduced by this adapter.

Existing `authoredEditJournal.mjs` already implements `document-metadata` entries,
`recordDocumentMetadataEdit`, `planDocumentMetadataTravel` and the linked drawing
record capture, with 64-entry/8MiB aggregate trimming and bounded drawing entry
charge. Reuse those; no second Undo stack. Metadata + next shared journal + full
accepted-tip adoption must publish atomically in one owner turn. This is a
required later publication gate, not something a standalone manager setter can
promise. Ordinary mixed source/model/drawing Undo and Redo must restore exact
definitions and chronological bindings. Native fresh Open resets session history
as it already does; only the definition persists. Resolution is recomputed.

## Required acceptance after approval

1. Actual validation Worker: ordinary v2 unchanged; v3 definition round-trip,
   malformed/null/extra/multiple/getter/budget/unit rejection; full envelope vs
   storage projection; typed and ordinary string/byte paths.
2. Actual manager with explicit storage/UI/pipeline fixtures: capture and Save
   retain definition both without and with manufacturing hashing, inch metadata
   retained, pure capture causes no writes/counter/native dispatch, save currentness
   invalidates on concurrent metadata change. Fixtures are not native proof.
3. Restore: success-only install, valid unresolved IDs retained; failure/cancel,
   stale generation, failed replay, New, disposal and two-manager isolation. Exact
   failed-state expectations respect existing generation-revocation semantics.
4. Shared publication (separate owner): creation/replacement/removal/no-op,
   drawing/source/model LIFO UndoRedo, branch truncation, quotas, atomic accepted
   full-tip/journal adoption and failure preservation. No publication until done.
5. Host-owned follow-up: `supportedEnvelope`, native dirty/baseline serializers,
   Save/Open receipt validators must admit exact v3; same `.jsketcher.json` path.
   Actual signed Save/sync/server bytes/fresh Open/repair/re-save with real part
   and discovered IDs. Keep drawing-free v2 controls. No browser/native success
   can be inferred from this test packet or schema tests.

## BEFORE evidence

`before.test.mjs` uses the actual codec and compiled production validation
Worker. The manager test loads actual manager TypeScript with the established
explicit UI/storage/pipeline fixture and actual validation Worker. The source
definition fixture is labeled synthetic metadata and references no authored
geometry. Empty project is structural input, not a fake positive native result.
Tests assert current rejection/missing retention as observations; their passing
status means the gap is reproducible, not drawing persistence is supported.
