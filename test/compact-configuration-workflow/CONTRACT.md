# Base / Compact ordinary part configurations — source only

Prepared against current ACAD source for finite C07/C09. No product changes,
checks, build, browser execution or qualification accompany this checkpoint.
Only this new directory is owned. Source worktree:
`r730:/mnt/data10tb/codi-acad-compact-configuration-workflow-20261107`.
The parent runs one complete normal composed application workflow afterward.

## Actual existing capability

There is no missing public selection operation for this finite task. Existing
`apply-physical-configurations({revision,definitions,configurations,activeId})`
is both the edit and selection operation. Base is `activeId:null`, **not** an
invented configuration row or a reserved 'Base' ID. Compact has an authored ID
`compact`, name `Compact`, and one sparse width override. Public
`inspect-physical-parameters` returns the base definitions, all configurations,
selected ID and detached already-evaluated effective quantities; those are
different concepts when Compact overrides width.

Source authority inspected: `parameters/physicalSource.mjs` captures exactly
`{version:2,definitions,configurations,activeId}` under the
`codi-physical-parameters:2\n` prefix, bounded to64KiB. Its sparse overrides do
not store duplicate geometry, evaluated tables or separate documents.
`evaluatePhysicalSource.mjs` validates Base and every override set in the real
Worker, then returns the selected effective result. Geometry is regenerated
only for the selected configuration. Validation of an inactive formula is not
proof of inactive Native geometry feasibility.

Craft's existing `applyPhysicalConfigurations` delegates to the existing
`physicalSharedOperation`, source capture/dependency evaluator, same whole-part
replay, expression publication and `physical-transaction` journal. Existing
definition edits use `encodeUpdatedPhysicalDefinitions`, retaining v2 variants
and active selection rather than silently downgrading to v1. Ordinary UndoRedo
replays the stored source/semantic bindings in the same journal. No second
configuration document, copied model, optimizer or suppression system is used.

## Frozen ordinary geometry / mathematical truth

Use the actual public on-disk `source-bound-parameters.mjs` recipe to create
one selected canonical rectangle and modern centered +four-corner through holes
on one explicitly selected staged OCC build. Base definitions are:

* width=mm(100), height=width/2, depth=width/5;
* hole=width/10, corner=hole*0.4, edge=width*0.08.

Compact initially overrides **only** width=mm(80). Therefore its actual geometry
is80×40×16, centeredD8, cornerD3.2, offsets6.4. Editing that one override to90
gives90×45×18, D9/D3.6, offsets7.2. Base width later becomes120 while Compact90
is active: current geometry and effective quantities stay90, but Base/source
intent changes. Selecting Base then yields120×60×24, D12/D4.8, offsets9.6.
Selecting Compact again still yields90 and retains the edited Base120 source.

For effective width W, independent volume is
`(W*(W/2)-pi*((W/20)^2+4*(W/50)^2))*(W/5)` mm³; bounds are
`[0,0,0]..[W,W/2,W/5]`. Native point reads check center/four-corner bore void,
ordinary material, exterior and a cap boundary using independently derived mm
points. Public current quantity values must match the same expressions, with
`dimension:'length'` / `unit:'millimeter'`. This tests directed formulas and
variant selection, not simultaneous geometric-equation solving.

All actual feature/output/source/opaque region IDs, history operations, named
bindings and build revision remain fixed. Only solved source coordinates and
selected effective values change. No ID parsing or caller-solved geometry.

## One complete public workflow

1. Build/bind the real public typed Base part. Register Compact while selecting
   Base/null. Verify v2 source intent and unchanged Base geometry; repeat exact
   configuration request as a true no-op. Genuinely assign PLA/Blue to the one
   discovered final printable body through public manufacturing commands.
2. Select Compact80 and verify actual quantities, source and Native geometry.
   Refuse stale revision, unknown selection, duplicate ID, inactive dimension
   mismatch, dependency cycle and a selected oversized-hole geometry request.
   Preserve durable document/journal/resources; normalize only the four opaque
   inspection revisions already documented for failed physical candidates
   (host, physical, journal, solids) plus the mirrored manufacturing document
   inspection token. Real Undo/Redo after refusals proves chronology: Base100
   and Compact80 return with the same original IDs and formulas.
3. Explicitly review/rebind materials through genuine propose/confirm commands
   before saving the current configuration. Normal Native Save→browser commit→
   own server SHA/byte equality→fresh signed Open preserves Compact80 selection,
   Base100 definitions, sparse override, bindings and accepted geometry.
4. Reedit Compact width90; review; save. Edit the Base width120 through the same
   public ordinary definition API while Compact90 is active. The v2 selection
   and override remain, and current geometry/effective values stay90. Exercise
   mixed source/configuration/material UndoRedo without a separate history.
5. Select Base/null; verify120 and explicitly review; resave/open. Reselect the
   existing Compact90 after that fresh Open; verify90, review, resave/open again.
   Four actual editable Native files prove each stored variant/source phase.

Material assignments keep the same IDs, names, color, producer bindings and
part/region identities. Review tokens bind current authenticated capture;
identical physical shape is not used to guess that a changed authored source
already has current assignments. The driver saves only after explicit review.
No export/slicer/print/drawing claim is needed or added by this workflow.

Native Save retains v2 parameter source inside the normal Native project
envelope (envelope version2 here, distinct from parameter-source version2).
Only semantic definitions/overrides/active ID are persisted, not solved tools
or per-variant models. Session Undo starts empty after fresh Open.

## Independent after-whole-workflow oracle and limits

`check.py EVIDENCE` imports no production validator or quantity evaluator. It
uses Python JSON/math and the frozen finite formula family to independently
derive Base versus selected values; checks actual source equations/corners,
saved feature/source/region/build identities, sparse overrides, original names,
material/color/review identities and actual saved bytes; then checks recorded
Native volume/bounds/classifications and exact read-only state preservation.
Volume bound1e-6mm³, source/bounds bound1e-6mm, original axis residual1e-8rad.
No post-observation tolerance changes or general expression-evaluation claim.

The fixture contains only Base plus one Compact variant. Inactive geometry
validation, feature suppression, configuration-driven topology/family creation,
assemblies, large configuration sets and optimizer behavior remain unqualified.
Other ordinary E18 positive/refusal/units and artifact workflows remain frozen;
they are not rerun gratuitously. No new private successful author, Native seed,
browser execution, microtest, build, account-security or filesystem-race work.

Required environment is the normal signed harness set plus
`CODI_ENGINE_REVISION`: CODI_DESKTOP_SOURCE_ROOT, CODI_SIGNED_PINS,
CODI_EXPECT_SOURCE, CODI_EXPECT_DESKTOP, CODI_TEST_URL, CODI_TEST_CDP,
PUPPETEER_CORE_PATH24.35.0, and fresh CODI_EVIDENCE. Wait for root runtime pins
and foreground release. Await durable writes before retiring owned contexts;
disconnect shared Chrome without closing it or root-owned services.
