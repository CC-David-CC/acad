# C11 linked datum, position, finish and clearance requirements — BEFORE plan

Proposal only, awaiting approval. Exact Core base:
`832e47ca5631c092a1f7dc7f0b24a9b01998825c`, fetched by full object ID from the
ACAD LAN. No product, current driver, frozen source/evidence, status or runtime
was changed. No parser, tests, probes, build, Native or browser execution.

## Required finite gap and retained evidence

The original finite C11 list in
`docs/reviews/GATE1-FINITE-CLOSURE-AUDIT-20261107.md:235` requires linked A/B/C,
position diameter0.20|A|B|C, Ra3.2µm and explicit limits producing
clearance0.005..0.035mm. The prior decomposition in
`docs/reviews/C11-DRAWING-EXTENSION-DECOMPOSITION-20261108.md:78` already fixes
their meaning as authored requirements plus authenticated current targets, not
manufacturing conformance, ISO fit lookup or a new assembly.

Do not redo the completed geometry/view work:

- `test/drawing-reference-repair-public-workflow/evidence-r5/README.md` and its
  actual receipt/oracle retain E22 on Corebaf95/Host78cc:138 rows,44 Native reads,
  12SVG,6.cad cycles,26 travels and two real repair→Undo→Redo chains. This plan
  reuses that publication/journal/refusal/persistence architecture.
- `test/section-detail-drawing-public-workflow/evidence-r5/QUALIFICATION.json`,
  `oracle.json`, `whole/receipt.json`, actual SVGs and `visual-review.json` bind
  Cored7b478ae9b0d679223240674ea43beada4b2f099 / Hosteabff28ae7dea4946fa81a576f37eac55acad509:
  whole71239/FIRST90667 PASS,63 Native observation sets,16SVG,8.cad and24 travels.
  Isometric, actual material cap section/hatching, true detail crop/2:1,
  bore marks/axes/baseline/ordinate/group callout and cross-view captions remain
  within those qualified scopes. That proof explicitly leaves these new
  requirement kinds and general authored leader layout open.
- Current derived-warning source is reused, including complete visible text
  membership, fixed-size paper boxes, actual obstacles and prewrite refusal.
  Source presence is not a new warning-layout/runtime qualification here.

## Actual source capability

| Seam at this base | Present behavior and missing addition |
| --- | --- |
| `modules/drawing/linkedPartDrawingDefinition.mjs` (`a7b735535cb985409c6f118030dbffce6a90cfd8`) and `.d.mts` | Exact versions1/2/3. `datum` is the original source feature/face/region binding, not datum featureA/B/C. NativeFace carries real opaque selection/origin, SourcePoint carries original curve/point, BoreReference carries actual semantic bore identity. V3 annotations are bore-center, baseline, ordinate, hole-callout only. New requirement labels alone cannot enter these variants. |
| `linkedPartDrawingOperation.mjs`; `authoredEditJournal.mjs:703`; `manufacturingPublicationWorker.mjs` | Existing create/replace/remove proposes one complete definition and one `document-metadata` event, before/after exactly captured, no-op detected, UTF8/UTF16 charged. PM publication and shared mixed Undo/Redo install that same definition atomically. No second requirement document/journal is needed. |
| `drawingReferenceFacts.mjs` (`161934704336dfca617a5748825025b24ab5b808`), `ownedDrawingReadProtocol.mjs` (`9e0a8ddecce72f4983896f2be75596c5b71d79c8`) | Current protected read already has the actual owned topology, live selection index, constructor source and finite semantic bore witnesses. NativeFace resolution verifies actual descriptor/origin and current index mapping; finite plane/cylinder/axis facts exist. It does not expose eligible plane discovery or these manufacturing requirement facts. |
| `workerDrawingReadCommands.ts` (`de466d7a692bc958f7dff81f8230ca1479a95266`), `solidLedger.mjs:362`, controller/OCI | Full independent current-tip replay, captured source/frame/physical result, actual owner/handle/build and read-only geometry checks exist. Public discovery is bore-only. Extend this path; do not read display topology or infer a plane from a role name. |
| PM `inspectLinkedPartDrawing`, `applyLinkedPartDrawingOperation`, `travelLinkedPartDrawingMetadata`, `exportLinkedPartDrawingSvg` | Definition readiness is explicitly authored-only. Read/export uses accepted exact definition and current document/geometry tokens. New support needs truthful schema/version and build admission, not only a menu/schema enum. |
| `projectEnvelope.mjs`, `nativeArchiveCodec.worker.ts`, Save/Open bridge | Native stores the same single definition in `authored/drawings.json`, with ZIP/manifest/hash/preflight and real model regeneration. Existing envelope/container version need not change for a new inner drawing definition version. Archive owner/Files leases/CAS are unrelated and stay untouched. |
| Host `drawing-commands.mjs` | Existing inspect/create/replace/remove are a thin scoped adapter, preserving account/window/signal/settlement and compact4KiB registry schema. Source read at Host9be437fff351fbe71e7ee6f56cfef31c862fde71, file blob5fc1ca10b2df00e09f66f247841e194275e2d54e; it admits versions1/2/3 only. Recheck actual Host composition before implementation. |

The actual topology/analytic plane and cylinder ports are already present on
the current qualified drawing cohorts. No new C++ primitive, mesh cone,
Native ordinal/name API, pair/default change or standards database is required
for this finite annotation/reference slice.

## One definition, exact proposed v4 intent

Retain version1/2/3 byte/meaning behavior. Version4 retains all v3 fields and adds
`datumFeatures` and `requirements`. Keep their pure capture in the current
definition module so it reuses actual NativeFace/BoreReference validators; no
new caller-supplied proof callback or duplicated reference validator.

Every new record has an exact bounded `annotationId`, existing `viewId` and
authored paper `label`. Datum feature also has `symbol:'A'|'B'|'C'` and an actual
NativeFace reference. Each symbol is unique; all annotation IDs are unique
across old bore annotations/new datums/requirements. Combined count of all three
collections stays within the existing16-annotation budget. This retains the
existing worst-case16 dimensions+16 diagnostics,64KiB definition/request and
256KiB journal charge. Do not raise sheet/Native/transfer/Files quotas.

| New exact semantic kind | Authored values and target; derived read meaning |
| --- | --- |
| Datum feature | `{annotationId,symbol,viewId,label,reference:NativeFace}`. Initial A is an actual planar cap; B and C are actual straight planar side supports. Discover/select real eligible references, never parse opaque IDs or accept a caller plane/frame. A/B/C ordered precedence belongs to the position requirement. |
| Position tolerance | `{annotationId,kind:'position-tolerance',viewId,label,target:BoreReference,zone:{kind:'diameter',value:0.20,unit:'millimeter'},datumSymbols:['A','B','C']}`. Initial domain: one actual finite witnessed center bore, planar triad and plain diameter zone without modifiers. Report resolved nominal CAD bore/axis and datum membership separately from the authored0.20 zone. No inspected manufacturing deviation, pass/fail, material modifier, simulator or ASME/ISO certification. |
| Surface finish | `{annotationId,kind:'surface-finish',viewId,label,target:NativeFace,parameter:'Ra',maximum:{value:3.2,unit:'micrometer'}}`. Preserve this ONE authored value/unit, derive0.0032mm where needed, render Ra3.2µm. It is a typed LENGTH requirement despite a distinct display unit. Do not duplicate/synchronize two stored physical values, add expression grammar, or infer actual Ra from BRep smoothness/tessellation. |
| Clearance limits | `{annotationId,kind:'clearance-fit',viewId,label,nominalDimensionId,hole:{lowerDeviation:0,upperDeviation:0.015},declaredShaft:{lowerDeviation:-0.020,upperDeviation:-0.005},unit:'millimeter'}`. `nominalDimensionId` must bind one actual eligible hole-diameter dimension in this SAME definition and its real bore. Current measured nominalN is not stored again. Derive hole[N,N+.015], DECLARED shaft[N−.020,N−.005], required clearance[.005,.035]. A shaft limit is authored mating intent, not a measured/modelled second body. |

Finite capture accepts only these quantities/units/kinds, finite numbers,
positive position diameter/Ra, ordered deviations and distinct ordered datums.
Unknown units, fields, modifiers, duplicate symbols/IDs or cross-definition
dimension names refuse at actual schema predicates. Do not classify a physically
possible different fit/feature as mathematically impossible: interference fits,
nonplanar datum simulators and other requirement types remain outside this
explicit initial capability. No named parameter strings are silently coerced;
this finite metadata slice uses typed literal quantities, not a new expression
binding subsystem.

Clearance arithmetic uses cancellation of the COMMON nominal before subtraction:
`minimum=hole.lowerDeviation−declaredShaft.upperDeviation`,
`maximum=hole.upperDeviation−declaredShaft.lowerDeviation`. Preserve full
represented values; formatting is presentation. Independent rational arithmetic
and IEEE operation bounds check it, not a hardcoded label or widened tolerance.
If a changed actual nominal makes either physical size interval nonpositive,
return an explicit unresolved fit-domain reason with no derived clearance
acceptance. Geometry/currentness failures are not requirement conformance.

## Protected resolution and public authority

Add one bounded public read-only discovery command, proposed
`inspect-worker-drawing-requirement-targets`, with the existing current
document/geometry revisions and target+source-datum query. Reuse the existing
captured read-only replay and one evaluation owner. A narrow private read verb
can enumerate at most16 current eligible plane descriptors plus the already
bounded semantic bore rows, under the same64KiB observation/work bounds.
Plane rows expose their actual opaque NativeFace reference, source/origin role,
resolved status, analytic support and a genuine finite boundary anchor; never a
Native face index/handle. No unclaimed generated face is given an invented ID.
Existing bore discovery and already-qualified views need not be recreated.

Extend the normal v4 drawing read with ordered datum/requirement rows matching
the exact definition. Existing native topology/index performs membership and
unique-descendant resolution. A small Worker-only requirement-facts module
receives these actual private objects; it cannot accept a transport proof flag.
Full replay currentness/cancellation, source binding, Native input/name/catalog
preservation, transfer bounds and owner retirement remain as today.

For the finite datum triad require actual finite plane boundaries, mutually
orthogonal eligible cap/side supports and a unique intersection. Orient each
normal using the actual captured source axes, not a caller normal, display or
nearest face. This produces an EPHEMERAL datum-feature frame, distinct from and
never written over `definition.datum`/the authored source frame. Proposed
explicit qualification: Native plane/finite-anchor incidence1e-9mm and
normal/alignment1e-12, with original source basis checks unchanged. These are
new named plane qualifications for review, not a borrowed drawing epsilon or
50pm manufacturing certificate; existing drawing facts currently use1e-7mm /
1e-8 direction in a different measurement role. No global tolerance changes.

Position requires the actual current bore axis perpendicular to A and live
A/B/C support membership. It may expose nominal axis/intersection/coordinates
as CAD geometry facts, never as a manufacturing position-error result. Finish
requires the actual eligible referenced surface. Fit requires the live actual
diameter dimension/bore, and separates Native nominal value from authored limit
arithmetic. Per-row evidence roles must say `authored-manufacturing-requirement`
and `geometry-binding-resolved`; no `measuredRa`, `measuredClearance`, tolerance
pass/fail or counterfeit standards certification.

Use existing create/replace/remove commands and SAME shared PM operation for
human callers and agent adapter; no second authoring path/UI. Inspect exposes
v4 schema admission separately from actual per-build requirement-read capability.
Advertise the new protected JS capability only after its real protocol/Worker/
controller/ledger/closed-graph path exists on an explicitly selected current
drawing cohort. Old builds must refuse unsupported reads precisely rather than
render convincing unverified labels. No Native ABI/pair/default switch follows.

New row failures need a finite reviewed reason vocabulary: proposed distinct
target-unresolved, datum-frame-unqualified, position-axis-unqualified,
fit-nominal-unavailable, fit-limit-domain and surface-unqualified reasons, while
retaining actual original ancestry/type-loss causes where applicable. Do not
catch arbitrary code prefixes/messages as missing-reference results. Native
resource/ownership/cleanup, malformed response, cancellation and currentness
failures retain their real outer error/settlement semantics, not a successful
unresolved requirement. Exact machine codes and pre-/postpublication fields
must be frozen from the eventual source predicates before acceptance runs.

## Lifecycle, unresolved intent and presentation

| Transition | Required invariant |
| --- | --- |
| Captured source/target→discovery→definition | Exact document+geometry tokens and actual discovered references; stale authoring refuses before publication. Definitions are intent; metadata create is not proof of resolution. |
| Parent/source edit→read | Replay current geometry and independently resolve the SAME refs. Surviving unique ancestry follows; lost/split/merged/ambiguous/type-changed refs become explicit unresolved with null geometry facts. No nearest/ordinal/follow-latest retarget, cached successful values or label-derived acceptance. |
| Broken reference→repair | User explicitly replaces the actual reference/ordered datum definition through drawing.replace. Discover a genuinely eligible alternative; changing datum meaning is an authored edit, not automatic repair. Immediate Undo restores exact prior unresolved intent; Redo exact repaired intent. |
| Unsupported/unresolved→Save/Open | Structurally valid unresolved intent may persist under the existing drawing contract. Open validates the exact metadata and regenerates actual model; read/export re-evaluates, never heals. Malformed own v4 data rejects before adoption via the existing archive/schema boundary. Freeze exact machine code after source implementation, not by inventing an unobserved error. |
| Requirement edit/UndoRedo | One before/after definition J event, exact IDs/raw unit/value/reference intent and bounded byte charge; metadata edits allocate no solid/source feature IDs. Failed/no-op edits preserve existing source/J/material/geometry/dirty semantics. |
| Export | Typed datum tags/feature-control frame/finish/limits are visible SVG presentation tied to resolved actual targets. Available paper label positions remain authored; no hidden-text-only semantics. Unresolved messages use current bounded warning placement with full visible identity/reason and no ghost requirement measurement. Existing source/Native/section/detail/caption/chord/resource/read-only/write settlement rules remain. |

Render the position feature-control cells and datum identifiers as real visible
paths/text, finish Ra text linked to a genuine finite surface anchor, and fit
limits explicitly labelled as required/declared. Do not promise general leader
routing or hide a crowded success: validate the finite new annotation boxes and
sheet domain, otherwise explicit prewrite presentation refusal. STEP/core3MF
geometry exports do NOT thereby gain semantic PMI or finish/fit certification;
native editable intent and actual SVG are the semantic artifacts in this slice.

## Source ownership and composition, if approved

- Pure definition/types and operation capture: `modules/drawing/linkedPartDrawingDefinition.{mjs,d.mts}`;
  retain existing J record/domain and limits. No separate requirement state.
- New bounded Worker facts/protocol modules; narrow calls in `drawingReferenceFacts.mjs`,
  `ownedDrawingReadProtocol.mjs`, read-discovery service, ledger, SolidKernel,
  controller and OCI. Pure schema/type/read handling must audit all `version===3`
  sites (including bore annotations, PM inspect and publication summary) so v4
  never silently drops annotations/requirements.
- PM interface/inspect declaration, existing publication Worker and native
  envelope capture only as needed for v4; archive ownership/codec/Files bodies
  stay unchanged. Shared journal/Craft metadata pipeline remains unchanged
  except exact new definition capture, if required.
- Renderer adds finite visible requirement forms to the actual export Worker;
  reuses existing view/caption/warning layout. Thin Host drawing schema and new
  read adapter retain compact schema/session/window/signal/scoped settlement.
- Exact protected capability and closed module composition needs root review:
  current relevant rosters are manufacturing-mesh and shell preparation/entry,
  circular preparation/entry, `ownedMechanicalNativeResources.mjs` and
  `catalogMount.ts`; inspect transitive imports before declaring the full closure.
  Do not broaden path allowlists. Root owns final common bootstrap digests and
  batching. New Native build/compilation is not proposed.
- One new complete public recipe/driver plus independent source/math/SVG/archive
  oracle, exact transitive producer Git roster and all write settlement. Old
  qualified packets/evidence remain immutable. No requirement is exposed until
  this whole path is implemented; this proposal alone confers no capability.

## One complete eventual ordinary lifecycle

1. Public genuine100×50×20 selected plate with real centerØ10 and established
   bore/plane provenance; select existing explicit drawing cohort. Discover actual
   cap/side/bore references. Author one v4 drawing: A actual top cap, B/C actual
   mutually orthogonal side planes, positionØ.20|A|B|C on center bore, Ra3.2µm on
   a real cap, fit limits above on its live Ø10 dimension. Read proves geometry
   bindings and authored roles independently. Actual part geometry is unchanged
   by adding requirements; test metadata creation/edit/remove and mixed travel.
2. Edit width100→150, height50→30, parent depth20→25 and center diameter10→12
   through genuine shared operations. Actual plane/bore facts regenerate;
   requirement values/IDs/references stay exact, fit nominal interval follows
   the real diameter while clearance remains.005..035 from deviations. Inspect
   any source/display-unit change without rewriting canonical quantities or Ra
   unit/designation. Require exact geometry/state on all metadata-only reads.
3. Exercise stale/foreign/duplicate datum symbol, wrong quantity unit, invalid
   ordered limits/nonfinite/extra fields and unsupported modifier refusals at
   their actual predicates, with exact before/after state and current token
   policies. No unsupported input becomes a successful unlinked label.
4. Use an actual public parent Boolean/top-cap loss (the existing qualified
   C11 roof mechanism is a source-grounded candidate) and retain original
   references. Observe truthful unavailable datums/dependents and unchanged
   requirement intent, then Save/sync/fresh Open while unresolved. No presumed
   B/C survival or generated-face identity: inspect actual current ancestry.
   Explicit repair chooses real discovered eligible faces (a changed datum
   meaning must be visible in the definition), followed immediately by exact
   repair Undo/Redo and actual re-reads. If that particular operation cannot
   expose a legitimate repair target, report the interface gap rather than
   fabricate a discovery; do not claim success from Undo alone.
5. Three normal .cad/browser-server-equality/fresh-Open cycles, positive reedit,
   resave and healthy continuation. Genuine STEP/core3MF geometry/material review
   remains independent; real SVGs carry complete visible requirement semantics
   at resolved, unresolved and repaired phases. Every submitted file settles or
   retains its exact owned context on uncertainty; no retry/forced close.
6. AFTER the WHOLE, independent saved-source/ZIP CRC/SHA/Git and analytic/Fraction
   checks bind the actual IDs, plane supports/orientation, bore diameter/axis,
   full precision raw requirements, µm→mm conversion and derived intervals.
   Check actual SVG frame cells/datum identifiers/leaders/visible text/units,
   unresolved membership, paper bounds and absence of ghost conformance claims;
   not labels alone. Review real SVG renders. No new SLA, surface-metrology,
   standards, assembly/BOM, physics, import or general professional-layout claim.
