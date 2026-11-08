# Active CAD1 acceptance scope — user revision2026-11-06

The user explicitly moved exercise E17 (hinged assembly) from Gate1 to Gate2.
Assembly-specific competency C10 is therefore not a Gate1 blocker. Preserve
original identifiers; E17/C10 remain required later, not completed or deleted.

Gate1 now includes21 exercises E01–E16,E18–E22 and11 in-scope competency groups.
All other requirements stay: multibody parts, material regions, parametric
reliability, shared UI/agent operations, undo/recovery, native persistence,
STEP/3MF export, linked part drawings E22 and the original-rectangle workflow.

Continue fixes/qualification; do not pause until the revised full Gate1 passes,
the required beta/agent path is qualified, and handoff/checklist/backups are done.
Files remains accepted; filesystem-race testing cancelled; visitor relaying off.

Authoritative detailed definitions are in the desktop repository:
`docs/CAD-ENGINE-GATE-1.md`, `docs/CAD-ENGINE-GATE-2.md` and
`docs/evidence/CAD-GATE1-BASELINE-20261106.md` (scope-change commit bd2642d46).
Historical references to all22 exercises describe the prior scope and do not
reinstate assembly acceptance in Gate1.

## Current qualification checkpoint — 2026-11-08

The current four-workflow batch has TWO scoped qualified passes and TWO complete
workflow failures. These are not the full Gate1 denominator: Gate1 contains21
exercises, with no complete exercise-level signoffs yet. Existing scoped passes
remain useful evidence toward those exercises; zero signoffs does not mean zero
implementation. Assemblies E17/C10 remain Gate2.

| Workflow | Complete result | Next action |
|---|---|---|
| Line orientation R12 | Scoped PASS618cf39; independent bounded50pm oracle PASS c702b49 | Retain frozen evidence; qualify affected changes on later builds |
| Native `.cad` R6 | Scoped PASS49db2da; independent artifact oracle PASS | Retain frozen evidence; capacity/memory/ARC23 remain separate |
| Length measurement roles R2 | FAIL Desktop505d40353 after56checkpoints/3saves, at typed discovery following successful setup | Old setup failure progressed; typed inspection refuses retained native dimension records. Read/actual-Point ownership repair integrated86a4612; complete rerun required |
| Feature history controls R2 | FAIL697598a after45checkpoints/2.cad saves at passive prefix inspection | Old exact-axis rejection progressed; expected hole-clearance refusal/state retention and native reopen pass. Passive-preview provenance repair integratedffb71b1; complete rerun required |

Actual last qualified composition remains Core32ae9c8/Desktop60ec30ee9. New
source repairs are not qualification evidence. C08 custom source-frame work is
isolated and excluded from this repair batch. A four-of-four batch result would
not close the remaining finite competencies or the final beta/agent delivery.

Repair composition source review:168c28a carries7ac46c53f5141e6fcc00ca32effddd9ac96d7d73
from the isolated lane; root adds only the dedicated solveWorker task dispatch.
Main drafts from current source; Worker proves actual original dimension-row
ownership and only the two intended literal changes. The finite canonical
constructor preserves declared corners and original-equation/cold proofs.
Legacy noncanonical sources keep the generic path. Journal travel independently
validates and returns exact historical source bytes. Ordinary extrusion/read/
Open dispatch, exact-axis checks, expected HOLE_OUTSIDE_PROFILE and all existing
publication/currentness guards remain unchanged. No execution PASS follows yet.

Normal repair build4d5a0e319612d68844e7692552fedba349f8f8b9 completed successfully
on R730, including all ordinary Worker/Native component stages, main webpack,
resource copy and revision marking. Log `.build/gate1-repairs-4d5a0e3-build.log`
under `/mnt/data10tb/codi-acad-build-20261107-r2`. Normal fixture build/pin
recording also completed (`gate1-repairs-4d5a0e3-fixture.log`); this proves build
and byte custody, not geometry qualification.

Current repair fixture: Core4d5a0e3/Desktop4c4862b7b1f48eef1686dfafa837a93c9bd907b3,
97 selected pins in `/mnt/data10tb/codi-acad-gate1-repair-pins-20261108-r2.json`,
CAD bundle02044c13adb00c1707f9a0967808effc1c16eb9ca91cb0ef80271f6e508ce39f;
Files bundleee2a712cabade0aad7a3b2c5bc4d8c311d7dc8f52963aadb14e210d9d54b010a
is unchanged. Public code fixture has487files/414CAD assets/522364021innerbytes.
Loopback20985 uses new direct private real-disk runtime
`/tmp/codi-acad-fixture-state-20261108-r3` on R730; no account/key state copied,
no external relay or public deployment. Earlier immutable fixture20984 remains.
Measurement R2 terminal FAIL is frozen Desktop505d40353.56checkpoints/3saves,
two fresh Open/edit cycles; owned context retired/shared browser retained and
source hashes unchanged. The final physical setup returned, then the discovery
candidate assertion stopped before formula editing/refusal. Returned discovery
and post-configuration source were not captured. Source inspection establishes
that typed discovery excludes every nonempty dimension array, including the
native LinearDimension retained by this workflow. A bounded read repair is a
new source lane; no test assertion was relaxed.
History R2 terminal FAIL is frozen697598a:45checkpoints/2actual.cad saves,
fresh Open/reedit/travel, old expected hole-clearance refusal now passes. Trace
records accepted prefix(null), followed by UNAVAILABLE from controls inspection
before the intended source-plane branch request. Wizard derives a workingRequest
from the next history entry even for passive review; controls reject any such
request. Actual remaining readiness flags/post-prefix snapshot were not captured.
Owned context retired, shared browser retained, source hashes unchanged. Driver2642
is terminal; no Chrome workflow is currently running. Earlier R1 remains frozen.

Next source composition, not execution evidence:

- 86a4612 carriesabbd81d1: typed discovery admits only canonical existing native
  LinearDimension records without dropping or rewriting them. Shared strict IO
  requires their actual EndPoint/index identities; no new ID/offset cap or typed
  mutation permission. Complete measurement and native Save/Open regressions are
  required; own malformed-ruler controls are being added to the C09 whole flow.
- ffb71b1 carries55133e1: WizardService privately distinguishes bounded pristine
  history-derived preview from genuine/explicitly modified draft. Existing UI and
  isInProgress remain; hints alone never grant admission. Existing detached data
  is frozen only after bounded proof; unprovable requests remain editable/active.
  History controls bind/recheck that predicate and retain all other guards, with
  specific actual-condition diagnostics. Complete unchanged history rerun remains.
- e23e31b carries77fad61 (prepared whole source a32294a/3d8042a): existing physical
  inspector returns current public display projections for length/area/volume/
  angle, keeping canonical values exact and display text rounding separate.
  Nonapplicable or rejected formatting has explicit derived availability; no
  canonical row is lost. Full C09 quantity/units/refusal/travel/native workflow
  is prepared, not run. Additional malformed-ruler controls are source-only.

C08 phase-A source remains isolated at36cd24a with Desktopcb821428e, including
root registration/shared validation-code transport. It is excluded from the next
repair build; required native-solid-face attachment phaseB remains open.

The sections below retain chronological implementation and execution notes.
Statements such as “running,” “queued,” and “not qualified yet” describe those
earlier checkpoints; the table above and latest completed results supersede them.

## Earlier finite execution lanes — 2026-11-08

Latest orientationR12 PASS on Core32ae9c8/Desktop60ec30ee9, frozen618cf39
under test/line-orientation-public-workflow/evidence-r12.150checkpoints,
2nativeJSON Save/server-sync/fresh-Open cycles,reopenededit/travel/secondOpen,
source hashes unchanged,owned contexts retired. Earlier R11 remains2b92bdd.
Functional analytic1e-6mm bound is distinct from50pm reconstruction/accuracy.
Post-whole precision intake initially refused exact stored/replay equality:
inspection returns a solved copy. Separate source/replay datasets must meet the
SAME independent reference/budget; no accuracy PASS yet.

ArchiveR6 and independent artifact oracle PASS, frozen49db2da.38checkpoints,
4actual.cad saves/server-sync,12STEP/core3MF/SVG exports,freshOpen/reedit,
6malformed Open refusals,realFilesUIOpen,healthycontinuation;10codecWorkers/all
retired.956-byte unchanged drawing span survives Open/reedit. Named owner/width
defects superseded in scope; capacity/memory/ARC23 remain separate. Role workflow
running next; history queued. No final all-Gate1/beta signoff.

Native archive repair774c779 is integrated: keep the decoded codec restore-local
through same-generation metadata reset, then transfer custody after full guarded
replay. Complete .cad R2 previously passed37 functional rows/four saves/twelve
exports/six malformed Opens/real Files UI Open, but FAILED11 versus10 codecs.
All11 retired. New complete reuse/lifetime workflow still required; ten expected
workers and actual unchanged drawing compressed-span reuse remain enforced.

Shared ordinary Segment reference/driving conversion is source-integrated
(c07915c through93ec67b), with strict original-request+receipt verification,
original coordinates and existing native ruler identities. No role/value flags
are stored. Root review repairs cause-less errors/job cleanup/metadata binding
and removes per-ruler full-scene paint scans through maintained local links and
mutation-bound membership indexes. Desktop dedicated bridge/registration and
complete public workflow are integrated (25c432f9a/c43edd917), NOT built or
qualified yet. Typed/formula/generated/ambiguous conversions remain explicit
unsupported boundaries; actual human paint/gesture performance is unqualified.

Finite C07 shared suppression/prefix/branch controls are under isolated source
implementation. The approved boundary is retained at
`test/feature-history-controls-plan/CONTRACT.md` (64bfcdd): one authored graph
and journal, no silent dependent/material retarget, derived-required schema
marker, bounded readonly manufacturing-reference census and no archive-owner
changes. This does not close broader history/frame requirements.

Previously qualified scoped whole workflows remain: singular Point-distance
31049d6 (89rows/10files), intersecting rectangles8749e8c (159rows/6files),
Base/Compact1f037a2 (37rows/4files), retained reports875a9bc (21rows/2files).
The canonical full matrix remains in the Desktop repository. Gate1 stays open;
these older slices do not qualify the current untested composition. Nonzero
math/length/precision retained workflows, untouched default-dialog UI, remaining
finite competencies, final composed beta/agent delivery and handoff remain.
Files is accepted, filesystem-race testing cancelled, visitor relay off.

Latest complete results: small-equation R1 (33ff549) PASS70rows/six native cycles
plus independent1pm-budget source arithmetic checker. This does not qualify
nanoscale solids. Native archive R3 (015f354) FAIL7rows/two saves/three initial
exports at typed width100→120 exact-axis check; fresh Open/codec-lifetime/reuse
phases not reached, one codec retired. Typed rectangle declaration reconstruction
is approved as a separate Worker source lane, preserving constraints/units/full
precision and original-equation/cold proofs; no snapping or axis waiver.

## Decision checkpoint — 2026-11-08

See `docs/CAD1-CHECKPOINT-20261108.md` for the resumable snapshot, exact commits,
failed runs, live source lanes, finite remaining work and effort/difficulty.
User confirmed50pm small-design budget. Gate1 first; qualify and freeze that
candidate before later CAD generations on separate branches/projects. No pause
has been requested; checkpoint publication does not pause the active goal.

## Composed source update — 2026-11-08

Corea2c7c55 integrates final50pm coordinate-only policy3300aba, bounded C07
history controls throughc5f5e4a, root PM typed-code forwarding8ec83ac and actual
numerical stop diagnostics/accepted-iterate repaira2c7c55. Desktop history
adapter/registration2520c46f6/7d9951efe is integrated; fa0cd2156 adds actual
fixture-login error capture to the test helper. These are source integrations,
not new workflow passes. Historical checkpoint eb1a0ae remains a snapshot.

ArchiveR5 startup now records actual UI `signal timed out`, no registered
session, one diagnostic row/no CAD. Frozen491334d. R730 disk waits were observed;
complete cause is not established. Next fresh20984 fixture has private real-disk
runtime state on R730's separate root disk, without moving real accounts or
stopping unrelated transfers. No server-disk Save proof will be replaced by RAM.
Normal complete build requires fresh configured Native graph staging for C07;
then actual affected workflows run sequentially. See CAD1-CLOSURE-SEQUENCE.md.

## Executed composed build / fresh fixture — 2026-11-08

Normal Core32ae9c8 full build PASSED: physical/sketch/project/archive/hash/
publication/controlled3MF Workers; selected/default prism/rawSMLib/all10 modern
component graphs; main app webpack and Grunt resources. Actual Native/bootstrap
pins stayed unchanged; new history dependency is bundled controller source,
not an omitted dynamic resource. Build log remains on R730 at
codi-acad-build-20261107-r2/.build/gate1-composed-32ae9c8-build.log.

Fresh real CAD+Files bundle: codi-acad-gate1-composed-stage-20261108-r1-apps;
487 files,414 CAD dist assets,522313863 inner bytes. Actual byte pins:
codi-acad-gate1-composed-pins-20261108-r2.json (97 selected files, Core32ae,
Desktop60ec30ee9). A test pin-recorder URL/disk-path mistake was corrected in
6ba6c43; no CAD result follows from pin collection. Files bundle bytes unchanged.

The first20984 launch correctly rejected a symlinked private runtime path.
Desktop60ec30ee9 adds --runtime-root for fresh isolated fixtures only, preserving
private-directory ownership/symlink checks and default service paths. Actual
running fixture uses direct /tmp/codi-acad-fixture-state-20261108-r2 on R730's
separate real disk. No account/key state was moved. Source/server/app code
outside the test launcher is unchanged relative to Desktopfa0cd2156.

OrientationR12 is now running on20984/CDP19329, source32ae/Desktop60ec, evidence
/tmp/codi-orientation-workflow-20261108-r12, owned driver session26251. Login and
the previously failing antiparallel170→190 edit/UndoRedo/further350/10 edits
have completed. Do not label the whole run PASS before terminal result and
cleanup. Next complete workflows remain archive, measurement roles and history;
all Chrome drivers remain strictly sequential. Current source main also has
metadata-helper/docs-only changes beyond the actual built32ae snapshot.

## Latest completed batch results

Orientation618cf39 and archive49db2da are scoped qualifiedPASS. Independent
orientation full-vector oracleV2 also passes its bounded50pm case (retained
24.5772pm/replay7.2948pm); original source/replay-intake refusal is preserved.
Measurement roleR1 FAIL is frozen Desktop53363ab16: ordinary role/point/dimension/
travel/3save/reopen prefix passes, final typed configuration setup INVALID_INPUT.
Source-confirmed canonical typed binder rejects an unrelated genuine Point;
coherent repair is underway without dropping the final typed-bound refusal test.
HistoryR1 FAIL is frozen3b8a32f:25checkpoints, no saves; suppression/noop/travel/
dependency prefix passes, downstream hole sees non-axis-aligned resized source
(UNSUPPORTED_PROFILE rather than expectedHOLE_OUTSIDE_PROFILE). Actual failed
candidate vertices were not captured; no numeric-only cause claimed. Accepted
durable state stayed unchanged under the driver's explicit diagnostic exclusions.
Explicit rectangle-edit construction repair is under review, no tolerance/code
waiver. Both remaining full workflows require repaired-build complete reruns.
