# C11 linked requirements: current integration checklist — 2026-11-09

Source review only. No parser/import, tests, probes, builds, Native/browser calls,
or runtime creation. Root trees and frozen packets were not edited.

The stable comparison is Core `01d31d5409450e3d7a8d42264f43d3a7c442d4e3`
and Host `aff15ea8182ff3ed0f32c81a76a59b0d642ae455`. Core advanced during review:
observed `03e24bdd26c56f42d2e018ccb2c1e6a04c7c7f33` already contains the
schema/metadata/read-leaf/renderer packets below. Common transport composition
was still proceeding; this note does not certify a moving index. Finite extents
qualification `d68ecb2` remains separate; linked requirements are unexecuted.

## Ordered frozen dependencies and disposition

| Original commit | Exact scope | Composition |
| --- | --- | --- |
| `78519cd6c1cdee5f00e400d69fa3cb7460747b9c` | modules/drawing/linkedPartDrawingDefinition.mjs + .d.mts; schema review | Already Root `6e7f793` |
| `0019894da96da89baef4b045b449270f19f5b295` | manufacturingPublicationClient.mjs / Worker.mjs and projectManagerBundle.ts in web/app/cad/projectManager; metadata review | Already Root `e3f1ba8` |
| `b031e057e739dea13adb1b35c64265df0a952021` | read DTO BEFORE contract | Already Root `33cb0ad` |
| `21904c50a998e857fb0835c5609a0008de4649f9` | mount drawingReferenceFacts, NEW drawingRequirementFacts / drawingRequirementProtocol, ownedDrawingReadProtocol / ownedDrawingDerivedProtocol; Craft workerDrawingReadCommands.ts | Already Root `367a622` |
| `4293c30f47c4fe9dd2a6ad42bd5705de8e864d8a` | web/app/cad/export/linkedPartDrawingSvg.mjs + NEW linkedPartDrawingRequirementForms.mjs | Already Root `56ff6d6` |
| `66ea54cc9f8ae227f20e43013c97cc683dbf0d5a` | complete public acceptance BEFORE | Then frozen acceptance below |
| `f0902afb039123f8ce7258fbb1b263900e6cea16` | test/drawing-requirement-public-workflow ten files, acceptance handoff | Not a product capability; retain unchanged |
| Host `b8c730c5eaff64e02c045af41b2f6122122c6dbd` | drawing-commands.mjs, NEW drawing-requirement-commands.mjs, index.mjs, inspect-state.mjs; Host source note | Apply once to current Host |
| Host `1a1f3a61f1d5806a7c902515412dae3c3b7b1dc5` | NEW examples/linked-drawing-requirements.mjs + index export | Apply after b8; byte-equal Core example |

Host paths above are under apps/system/jsketcher. The current aff15 production
subtree is byte-identical to the packet's d8488ac44 base: no intervening Host
product splice conflict was found. Preserve current complete registrations.
Root's later integration commits replace the original product commits in the
build roster; do not cherry-pick duplicate equivalent schema/read/render code.

## Remaining Root-owned production closure

These are explicit missing integration obligations at stable01d, not new
runtime defect claims. Original21904 handoff gives complete field contracts.

1. **Craft** — web/app/cad/craft/craftBundle.ts imports the two new ledger
   functions, keeps createWorkerDrawingReadCommands registration, and adds its
   two method types. In evaluateWorkerSolidRead's drawing mux, handle
   requirementQuery and requirementDefinition before the old boreQuery/default
   drawing branches. Preserve candidate-only observation owner, expectedMetrics,
   registered source/frame/history/material/definition captures and post-await
   currentness. Do not replace the existing planar/point/derived/mesh paths.
2. **Ledger** — modules/engine/solid/solidLedger.mjs and .d.mts add
   readCandidateWorkerDrawingRequirementTargets and
   readCandidateWorkerDrawingRequirements to the existing observation-only
   drawing-or-bores custody path. Targets capture the bore-query-shaped input;
   requirements capture accepted v4. Validate real output kind/source registry,
   producer, handles, actual exact build/metrics, original datum and owner.
   Select corresponding unresolved result when source is genuinely unavailable.
   Strictly capture Native replies and return metadata BEFORE projection/derived
   view iteration. Full v4 drawing retains existing HLR and derived-view
   budgets, leases and shell-only section gate; it also needs the new flag.
3. **Kernel/controller** — modules/engine/solid/SolidKernel.ts and
   modules/engine/mount/worker-controller.mjs add:
   solid.drawing.requirement-targets.read / solid.drawing.requirements.read,
   version1, maxBytes65536, nativeResultCost0, response-local. Discovery has
   max16 planes and max16 bores. Methods readDrawingRequirementTargets /
   readDrawingRequirements reuse strict token/evidence/source-token/currentness,
   cancellation and malformed-reply terminal handling. Requests carry actual
   handle/sourceHandle/producerFeatureId and query OR definition, no public
   result token or projection buffers.
4. **OCI** — modules/engine/mount/oci-verified-worker.js adds a dedicated
   drawingRequirementVersion1 init mode requiring existing drawingReferencesMode
   and the complete staged graph. Add solid-drawing-requirement-targets and
   solid-drawing-requirements as NONPRODUCING [kind,false] entries to the SAME
   closed ownedKinds Map. Discovery uses actual topology/index/source-profile
   qualification then resolveOwnedDrawingRequirementTargets. Metadata read uses
   the SAME resolveOwnedDrawingReferences v4 observation as full sheet read;
   never an alternate facts model or HLR constructor. Gate ordinary full v4
   reference read too. Preserve current bound-constructor/extent exclusivity,
   arrangement exclusions, cleanup/refusal classifications and realm retirement.
5. **Declared capabilities/factory** — modules/engine/mount/engineCatalog.mjs
   needs explicit drawingRequirementVersion1 only for Root's complete selected
   cohort, exact two operation descriptors and both methods. Thread dedicated
   controller/init config through the selected occ-*-mount.mjs constructor.
   The frozen recipe takes CODI_ENGINE_REVISION explicitly and uses ordinary
   legacy selected V3 + centered-through + box/Boolean capabilities; no new
   Native ABI/pair/default switch is required. Matching WASM or old bore flags
   alone confer nothing. Its current availability assertion deliberately does
   not assume a newly exposed public availableBuilds flag.
6. **Metadata/save** — retain the already composed v4 pure capture, PM summary
   and both Worker reply admissions: combined annotationCount includes old
   annotations+datums+requirements; separate datumFeatureCount/requirementCount
   and role. Native envelope remains existing outer v2/v3, inner drawing4.
   No PM/File lifecycle or save/full-tip guard changes are requested.

The metadata-only requirements read must match the actual accepted PM
definition before replay and over awaits. Discovery is allowed before authoring.
Both use the original source/frame and actual Native plane/cylinder membership.
A lower A repair requires a genuine finite end/rim on the surviving cylinder;
THRU is neither inferred nor required. Failure to discover that real repair
triad is a retained prerequisite/whole failure, never permission to replace IDs.

## Closed graph and source-roster delta

NEW transitive Native leaves, even for graphs that only carry older drawings:

- modules/engine/mount/drawingRequirementFacts.mjs
- modules/engine/mount/drawingRequirementProtocol.mjs

The first is imported by drawingReferenceFacts; the second by
ownedDrawingReadProtocol. Preserve the whole current graph UNION (counterbore,
blind, extent, countersink, pure identity/quantity, derived drawing and constructor
binding leaves), not an old base list. Exact declaration/update sites:

- build/prepare-manufacturing-mesh-profile-assets.cjs and
  build/manufacturing-mesh-assets-entry.cjs;
- build/prepare-shell-profile-assets.cjs and build/shell-assets-entry.cjs;
- build/prepare-circular-profile-assets.cjs and build/circular-assets-entry.cjs;
- modules/engine/mount/catalogMount.ts shared manufacturingModules, inherited
  blindManufacturingModules/shellModules/circularModules exact colocation lists;
- modules/engine/mount/ownedMechanicalNativeResources.mjs, shared by its
  prepare-mechanical-cohort-profile-assets producer, entry and factory.

Modern paths keep relative imports; emitted flat/directory paths must remain
consistent with actual producer rewrite rules. No missing leaf may be masked by
an unavailable feature flag: importing an older read module still imports it.

OCI edits require all TEN actual8a150c70 baseline guards repinned coherently:
build/embedded-oci-worker.cjs plus prepare-{selected,loft,adaptive-metrology,
step-export,orthographic,manufacturing-mesh,shell,circular}-profile-assets.cjs
and prepare-mechanical-cohort-profile-assets.cjs. These are existing source
guards; no old Native portable/WASM hash changes are requested.

NEW Worker renderer leaf:
web/app/cad/export/linkedPartDrawingRequirementForms.mjs.
It must be in the built static import closure and staged source-byte census.
Keep current caption+warning layout leaves; the frozen acceptance already
includes both and the new forms leaf. No separate package/global API needed.

## Exact Host splice and disposal

b8 shares the existing bounded own-data copier as captureDrawingCommandData;
old metadata commands delegate to that identical policy. It extends inner
definition versions to [1,2,3,4] in drawing-commands, index saved-envelope check
and inspect-state. Outer saved-envelope versions remain2/3.

index.mjs import adjacent to drawing commands:

`import {registerDrawingRequirementCommands} from './drawing-requirement-commands.mjs';`

Registration immediately after registerDrawingBoreCommands:

`if(host.commands)host.onDispose(registerDrawingRequirementCommands(host,()=>rectangle.target()));`

New adapter rollback removes already registered commands in reverse order;
normal disposal drains/reverses its own stops. Captures actual target window,
session, Craft owner, signal/valid and settleScopedCommand. Preserve all old
bore/export/metadata/principal/countersink/extent registrations and current
full-tip Save/read guards. Add the example export:

`export {createDrawingRequirementExample} from './examples/linked-drawing-requirements.mjs';`

Public exact tuples:

- inspect-worker-drawing-requirement-targets:
  {version:1,unit:'millimeter',revision,geometryRevision,target,datum}, forwarded
  as {revision,geometryRevision,query:{version,unit,target,datum}}.
- read-linked-part-drawing-requirements:
  {revision,geometryRevision,definition}, metadata facts only.

Descriptions and parameter schemas must both satisfy the independent existing
512-character and4KiB registry budgets at the real full launch. No new UI or
disposal shortcut is authorized.

## Frozen acceptance/invocation custody

The ten local files are CONTRACT.md, README.md, example.mjs, desktop-driver.mjs,
check.py, truth.py, requirement_math.py, native_record.py, svg_oracle.py and
negative_archive.py. They already snapshot22 explicit runtime Core paths and10
Host paths, including both new Native leaves/forms, warning/caption layout,
archive oracle, signed-harness strict-join import, shared settlement leaves,
adapter and actual public example. This is the declared subset, not a claim of
every application source byte; all staged runtime files additionally bind
through the actual pins. Root's final common source graph must enter its build
census. No new acceptance roster leaf is presently needed for these packets.

Use separate actual full40-char commits for CODI_EXPECT_SOURCE,
CODI_EXPECT_DESKTOP, CODI_ACCEPTANCE_SOURCE and optional CODI_EXAMPLE_SOURCE
(default actual Host producer). Each roster byte must match its selected Git
commit:path; Core example must equal actual exported Host example. Acceptance
can run from a composed checkout containing byte-identical frozen files.
Required existing inputs: CODI_EVIDENCE NEW directory, CODI_DESKTOP_SOURCE_ROOT,
CODI_ENGINE_REVISION, CODI_SIGNED_PINS, CODI_TEST_URL/CDP, PUPPETEER_CORE_PATH.
Use only Root's frozen runtime/build/pins and fresh owned fixture.

Preserve all source edits/travel/refusals/metadata no-op/removal and repair,
unrelated OWN-target membership, actual roof cap loss, unresolved native
Save/Open, real discover/repair UndoRedo, three fresh Opens/four saves/seven
SVGs/two own malformed copies and all14 write dispositions. Unknown submitted
write retains exact own context; no unconditional close. Observe no history
prefix in this packet, so the extent prefix-only acceptance correction is not
a dependency and must not alter its normal full-tip observations.

## Compatibility conclusion / evidence still required

No new acceptance-only compatibility defect was established by this source
comparison; no frozen runner/checker/example was changed. Host production files
apply to the unchanged base. Already composed Core hunks retain current warning
layout, derived views and existing metadata read/save ownership. Missing common
capability/transport/graph closure would prevent actual protected reads; this
is an explicit integration prerequisite, not a qualification or reproduced bug.

After coherent Root review/build/stage/source census: ONE complete public whole,
then FIRST independent checker only after whole PASS, then actual seven SVG
reviews. Retain every first failure. Source50pm, Native incidence1e-7mm and
direction1e-8, projection1e-6mm and paper chord.02mm remain distinct. Neither
resolved geometry nor labels prove manufactured position/Ra/shaft conformance,
standards, physics, printer behavior, full C11, or whole Gate1.
