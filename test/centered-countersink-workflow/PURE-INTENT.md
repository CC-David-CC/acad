# Pure countersink intent and authored materialization — SOURCE ONLY

Isolated base: root `82af6a9a77d99b765d06d0bd6df2c308d406fe3f`.
Ordered source commits:
`a951a90b65cd0f37f4e55672be4955fe3dcdaeaa` (approved two-file pure extraction),
then `f6ade4c22361cda51ac8876892058b794d8498f7` (new countersink/ANGLE metadata
and unregistered-plan refactor). Root keeps the entire packet UNMERGED until
the current immutable whole sequence settles and the exact closure additions
below are composed with the next full source batch. No tests/probes/parser,
TSC, build, Native or browser execution accompanies it; no closure/runtime or
usable countersink claim follows. Existing runtimee521 is unaffected.

## Pure dependency boundary and preserved semantics

`engine/solid/ownedCountersinkIntent.mjs` now owns the small exact15-field
`captureNumericCountersinkIntent` and numeric keys; its ONLY import is the new
pure `solidBodyIdentity.mjs`. It has no Worker topology/cone capture, tool plan,
Native proof, app/frame/document, allocator or capability dependency. The
existing unregistered `ownedCountersinkPlan.mjs` imports and re-exports that
same function/keys, preserving its current private API. Its numeric domains,
identity/strict own-data checks,64KiB limit, messages/codes and frozen result
remain unchanged; all planning and qualification math stays unchanged.

One canonical `solidBodyId` was moved verbatim from `solidIntent.mjs` into
`solidBodyIdentity.mjs`: same positive-safe integer validation, exact
`worker-solid:1:` plus JSON[featureId,"body"] construction and INVALID_REQUEST /
"Invalid feature identity." refusal. Existing solidIntent imports/re-exports
the SAME function; all its other functions/imports are untouched. No caller
migration, opaque-ID parsing, alternative grammar or duplicate implementation.

Similarly `isAuthoredLength` / `resolveAuthoredLength` moved verbatim into pure
`authoredLengthQuantity.mjs`; existing `authoredLengthBinding.mjs` imports and
re-exports them while retaining its actual hole capture/materializer. Same
identifier grammar, literal(0,1e6]mm, current typed-facade checks, exact
`resolveQuantity(name,'length')`, returned-value domain and failure messages/
codes. No second resolver, evaluation, state or registered field family.
These are the ONLY two extra existing files approved/edited; ownership was
coordinated with Dxf. Existing physical-field files and its extents lane stay
untouched.

## Authored numeric versus named intent

NEW `authoredCountersinkIntent.mjs` and `.d.mts` provide:

- `captureAuthoredCountersinkIntent(input)` retains all actual identity/source
  fields and raw throughDiameter/entryDiameter/includedAngleRadians names or
  literals in one frozen, strictly bounded15-field record.
- `materializeAuthoredCountersinkIntent(input,expressions,materialized?)`
  resolves lengths through the canonical length leaf and FULL included radians
  through standalone `authoredIncludedAngleBinding.mjs`. It calls ONLY the
  actual accepted/prepared facade supplied by the owning transaction, never
  creates/evaluates another parameter source, then reruns numeric capture.
- The separate exact3-field `captureAuthoredCountersinkDimensions` and
  `materializeAuthoredCountersinkDimensions` allow preallocation admission
  without inventing a feature/producer/source identity.

The standalone ANGLE runtime leaf is exactly the one frozen in
`00babda3f79cd7c40c21aa25e18dea3ad1236ba6`; its physical-role edits are NOT
merged. Literal and resolved angles require finite0<alpha<pi, FULL canonical
radians, never degrees, half-angle, positive generic length or sink depth.
Names use the same bounded typed-identifier grammar. Named resolution requires
isTyped and hasCurrentPhysicalResult(), then actual resolveQuantity(name,'angle').
Undefined/wrong-dimension/stale-facade errors propagate from the authoritative
facade; no conversion, fallback, coercion, synthesized constant or silent erasure.

All literal fields validate their own real domain during capture. Diameter
order is checked immediately only when BOTH are real literal numbers, otherwise
only after BOTH actual length values resolve. Schema-only1/2/pi/2 sentinels
validate unchanged identity fields internally; they are never returned as
dimensions, evaluated, sent to Native or used as successful geometry/source.
The restored raw-name record gets its own actual UTF-8≤64KiB check. Optional
materialized comparison captures a full actual numeric15-field record and
requires exact Object.is agreement for ALL identity and dimension fields, not
just an asserted prior numeric value. Raw authored records are never mutated.

New declarations describe the existing structural quantity facade; there is no
runtime import from app code or any Worker proof module in this Main path.
The owning later transaction still MUST capture/fence facade/source/history/
document/manager identity across preparation and publish; these pure functions
do not issue that authority or replace independent original-request proof.

## REQUIRED exact closed-graph additions (not implemented here)

The approved extraction adds the single static dependency
`solidIntent.mjs -> ./solidBodyIdentity.mjs`. Every current verbatim Native graph
that emits solidIntent therefore needs the SAME new pure leaf. Source inventory
at82af, not an executed staging result:

| Existing cohort / emitted directory | Existing root producer to regenerate | Explicit emitted-list edit needed | Existing catalog colocation set needing the same leaf |
|---|---|---|---|
| boolean-history / `.build/boolean-history-assets` | `build/prepare-boolean-history-assets.cjs` | `build/boolean-history-assets-entry.cjs` | own `OCC_BOOLEAN_HISTORY_BUILD` required array |
| revolve-profile / `.build/revolve-profile-assets` | `build/prepare-revolve-profile-assets.cjs` | `build/revolve-profile-assets-entry.cjs` | own `OCC_REVOLVE_PROFILE_BUILD` required array |
| sweep-profile / `.build/sweep-profile-assets` | `build/prepare-sweep-profile-assets.cjs` | `build/sweep-profile-assets-entry.cjs` | own `OCC_SWEEP_PROFILE_BUILD` required array |
| loft-profile / `.build/loft-profile-assets` | `build/prepare-loft-profile-assets.cjs` | `build/loft-profile-assets-entry.cjs` | shared `loftMountOptions` base required array |
| adaptive-metrology / `.build/adaptive-metrology-assets` | `build/prepare-adaptive-metrology-profile-assets.cjs` | `build/adaptive-metrology-assets-entry.cjs` | same loftMountOptions base |
| step-export / `.build/step-export-assets` | `build/prepare-step-export-profile-assets.cjs` | `build/step-export-assets-entry.cjs` | same base + unchanged STEP extra |
| manufacturing-mesh / `.build/manufacturing-mesh-assets` | `build/prepare-manufacturing-mesh-profile-assets.cjs` | `build/manufacturing-mesh-assets-entry.cjs` | same base + unchanged blind/counterbore extras |
| shell / `.build/shell-assets` | `build/prepare-shell-profile-assets.cjs` | `build/shell-assets-entry.cjs` | same base + unchanged shell extras |
| circular / `.build/circular-assets` | `build/prepare-circular-profile-assets.cjs` | `build/circular-assets-entry.cjs` | same base + unchanged circular extras |

All catalog sets above are in `modules/engine/mount/catalogMount.ts`. Add exactly
`modules/engine/solid/solidBodyIdentity.mjs`, not authored countersink/ANGLE/length
modules or other unregistered feature helpers, to these current Native lists.
`build/stage-owned-profile-component.cjs:24–29` recursively stages relative
import/export dependencies, so the existing root producers will capture this
leaf when genuinely rerun. That alone is NOT resource delivery: each explicit
asset-entry list feeds emitted webpack resources and
`assertOwnedProfileResourceClosure` checks their entire relative-import closure;
the catalog then checks exact key membership/colocation. Missing the emitted
leaf will fail closure or delivery; merely staging a file is insufficient.
No stager/list/catalog/webpack source has been edited in this packet.

The existing webpack asset/resource rules for these nine whole directories
preserve relative paths and need no new directory/allowlist/pair admission.
Root must regenerate component sources/files/entry hashes together, bind the
new actual producing source and perform the one normal batch build/staging
review. Common bootstrap bytes were not changed; no new Native pair or existing
capability/default flag is justified by this metadata leaf.

At82af the selected-profile/polygon-profile/mechanical-profile and legacy-prism
verbatim graphs do NOT contain solidIntent; they need no extra Native leaf for
this extraction. Preserve their actual existing root sets/guards. The raw
SMLib/Manifold binaries/graphs and old Native loader paths are not changed.
Static app/Worker-controller bundles already importing solidIntent follow its
new ES-module dependency through normal bundling, not public raw asset tables.

The second dependency is
`authoredLengthBinding.mjs -> ./authoredLengthQuantity.mjs`: it belongs to normal
static app/source-validation code, not any of the nine Native asset-entry lists
at82af. Existing actual consumers include authored blind/counterbore metadata,
selected-profile/through-hole modeler operations, authored J/unconsumed-source
policy, modernPhysicalBindings and source validation. Headless sourceFrameValidation
also reaches solidIntent. Rebuild the normal Main and relevant headless/project/
semantic/static parameter bundles as part of root's composed batch. No separate
worker source rules/quota/splitting policy or successful build is claimed here.

The FUTURE new conical mechanical cohort does not yet have a registered module
set, so its complete closure remains OPEN until the dispatcher/factory exists.
It must include actual numeric intent+body identity and private cone helpers,
with exact reviewed pair/capability/closed sources. It must NOT evaluate authored
names inside the numeric Native request boundary. No auto-discovery assumption
or guessed module/pair declaration is offered for that missing integration.

## Still missing, unchanged

Actual countersink field-role registration (length,length,ANGLE), authored feature
and public adapters, shared J/edit/travel/original-request preparation, actual
four-result dispatcher/ledger/cleanup, complete source/currentness and numeric
Native binding, exact root-compiled/qualified mechanical cohort, all persistence/
read/export/material/drawing/ref consumers and the genuine complete .cad/native/
artifact workflow/oracle remain REQUIRED. PRIVATE-FOUNDATION.md keeps those
geometry/ownership/precision requirements. No usable feature or new proof is
published by this source-only metadata packet.
