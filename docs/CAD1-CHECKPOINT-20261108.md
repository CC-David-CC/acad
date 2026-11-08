# CAD 1 checkpoint — 2026-11-08

Requested decision checkpoint, not a pause or release. Later CAD generations are
separate projects/branches; first qualify and freeze this Gate1 candidate.

## What the numbers mean

21 active exercises(E01–E16,E18–E22); all have named working evidence, but all
remain Partial and none has full combined exercise signoff. E17 assembly/C10
is Gate2. This is **not 0% implemented**, and named passes are **not 100% Gate1**.
A defensible overall completion percentage or calendar ETA is not available.
There are real missing shared operations as well as qualification backlog.

Effort classes below are planning estimates, not measured ETAs: S=bounded work
usually hours; M=several focused workdays; L=potentially weeks or multiple packets.
They are not additive, assume available compute/runtime, and can increase after
complete workflows expose defects. Difficulty estimates risk of another repair.

## Current workstreams, ordered by immediate execution

| Workstream | Working / partial / not working | Next exact exit | Effort; difficulty |
|---|---|---|---|
| Files foundation | Accepted scoped foundation; no new Files campaign | Preserve accepted contracts during CAD Save/Open; race/security probes canceled | No independent Files work scheduled |
| Revised precision policy | User explicitly accepts50pm=0.05nm=5e-8mm; available precision retained. New coordinate-only policy source in agent worktree, not qualified | Integrate policy without relaxing angles/domain/source identity; complete orientation workflow | S source + M qualification; medium |
| Orientation/solver | R11 FAIL109rows/no saves under old1pm guard. ReplayY delta4.5604pm; conditional analytic candidateY error11.8552pm, cold7.2948pm. These fit50pm, but full workflow not proved | Bounded actual stop diagnostics/accepted-iterate repair; then complete public author/edit/refuse/travel/Save/Open | M; high |
| Native .cad save/open | Earlier R2 functional37rows/4saves/12exports but11 versus10 codec targets(all retired). Owner repair774c779 integrated. R3 FAIL7rows at typed width edit. Typed helper fixes integrated | Resolve R4 startup login timeout; unchanged full archive workflow, ten targets, drawing-span reuse, malformed Open/Files UI and independent artifacts | M; medium-high |
| Reference/driving dimensions | Core and Desktop bridge registered; no complete new workflow qualification | Run complete ordinary Segment reference→driving/edit/travel/native Open workflow; preserve actual ruler identity | S integration + M qualification; medium |
| C07 history controls | Source branch supports bounded suppression/prefix/branch; review fixes committed on isolated branch, not main qualification | Integrate final source/adapter/whole driver; fresh Native module graph staging; complete save/reopen/control workflow | M; high |
| Constraint/dimension families | Named signed/concentric/midpoint/angle/singular/report cases PASS; full finite family/role coverage incomplete | Finish audited C03/C04 inventory: original equations, branch/domain and genuine failure semantics; missing ordinary shared targets | M–L; high |
| Sketch primitives and editing | Point/Segment/Circle/Arc and rectangle/polygon named paths PASS | C01 finite infinite-line/ellipse/spline/slot/offset/trim/extend/mirror/pattern/projection capability and shared operation gaps | L; high |
| Planar arrangements | Disjoint/nested, repair, corner contact, bounded crossing rectangles PASS | C02 circle lens/tangent/coincident/shared-edge/zero-area and explicit selection/repair cases | M–L; high |
| Solid feature limits | Plate/holes/fillet/chamfer/shell/revolve/sweep/loft/Booleans named workflows PASS | C05/C06 finite contact/limit/capability checks and required missing semantic operations; do not infer all-engine parity | M–L; high |
| Frames / attachments | Principal frames and selected plane/depth cases PASS | C08 genuine custom frame/inverse, pivot/parent transform and attached source regeneration through common history | M–L; high |
| Parameters / configurations | Typed units and two-configuration Base/Compact workflows PASS; tiny arithmetic70rows/6files independent PASS | Integrate role/policy changes; remaining finite quantity/target semantics and final combined run | M; medium-high |
| Drawing competencies | Linked3orthographic views/6dimensions, source edits, repair,6native cycles/8SVG named PASS | C11 isometric/section/detail/center and datum/fit/callout annotation requirements, persistence/export | L; high |
| STEP/core3MF / materials | Named plate/pattern/typed and2part/3region enclosure artifact workflows PASS | Retain measurable geometry/material grouping and final new-container/final-build artifact checks | M; medium-high |
| Final composition / beta / freeze | Old public helper prerequisite PASS; newest private composition not final beta-qualified | Changed complete workflows, original plate chain, viewable output, exact hardcoded examples, canonical matrix, both-LAN backup, final handoff; then requested pause | M after dependencies; high |

## Every exercise

The authoritative detailed row and evidence links remain in Desktop
`docs/evidence/CAD-GATE1-BASELINE-20261106.md`; this snapshot does not replace it.

| ID | Exercise | Named workflow evidence | Full status / remaining gate |
|---|---|---|---|
| E01 | Line and circle | PASS ordinary source and mixed open/closed extrusion | Partial; C01 and final composition |
| E02 | Fully constrain rectangle | PASS reports and independent rank; singular recovery | Partial; remaining solver family cases |
| E03 | Edit dimensions | PASS width limits, units, midpoint/angle | Partial; shared roles/orientation/precision |
| E04 | Disconnected rectangles | PASS two-body selection/edit/reopen | Partial; finite C02 arrangements |
| E05 | Three nested circles | PASS disk/annulus selection/edit/reopen | Partial; finite topology/selection contracts |
| E06 | Duplicate line | PASS4recovery cases/8native files | Partial; remaining primitive domains |
| E07 | Contradiction | PASS rejection/recovery/travel/native reopen | Partial; broader finite solver cases |
| E08 | Extruded plate | PASS measured source-bound plate | Partial; declared directions/domains |
| E09 | Four holes | PASS source/depth/diameter updates | Partial; limits and required hole semantics |
| E10 | Change original plate | PASS full source/hole/fillet/pattern/unit/travel/export chain | Partial; final composed regression |
| E11 | Fillet/chamfer | PASS ordinary creation/edit/travel/reopen | Partial; finite limit/vanished-reference cases |
| E12 | Enclosure | PASS shell and separate lid/inset-label manufacturing model | Partial; remaining limits/final composition |
| E13 | Stepped revolve | PASS create/source/angle/travel/reopen | Partial; frame/domain/capability coverage |
| E14 | Curved sweep | PASS4cases plus retained capacity/reopen | Partial; path/lifetime/domain boundaries |
| E15 | Loft | PASS circular and rectangular source/plane edits | Partial; correspondence/frame boundaries |
| E16 | Boolean solids | PASS scoped union/cut/common/contact/multibody | Partial; declared engine-specific limits |
| E18 | Parameters | PASS typed units/expressions/Base-Compact | Partial; role/precision/final integration |
| E19 | Broken reference | PASS explicit repair/deletion/travel/reopen | Partial; split/merge and final integration |
| E20 | STEP / core3MF | PASS independent named artifacts and materials | Partial; final build/container exchange |
| E21 | Native reload | PASS many JSON-native families; new .cad not qualified | Partial; archive workflow and final composition |
| E22 | Drawing | PASS linked ordinary drawing native/Open/SVG | Partial; finite C11 additional views/annotations |

## Exact code and evidence anchors

Core integrated before this checkpoint:
`2b92bdd` preserves R11 failure and final50pm decision; preceding
`4a9c2ceffaa8ddc55487e67c64f3dd36bd854ed2` integrates optional typed helper
numeric-envelope eligibility; `e28cf77d6815d85eb917ce2041e78fc72262b7c9`
was the earlier10pm documentation decision, superseded by50pm.
Latest executed fixture remains older, not identical to current source:
Core `a5368ef77d91363c0ea8d484f64e1640fd8a58ef`, Desktop
`a0def557e4d19da328369825e3da5d988bba380d`.

| Anchor | Meaning |
|---|---|
|774c779|Archive restore-local codec custody fix; source, awaiting whole qualification|
|4152038aebfbcacab1df167f3eaf5e11a47ba973|Coordinate original-source/shared ownership repair; R11 still failed|
|535035c + e1a995c + a5368ef + b67a34d +4a9c2ce|Typed rectangle reconstruction and generic fallback/eligibility fixes|
|c07915c through93ec67b|Ordinary Segment measurement roles Core source|
|25c432f9a + c43edd917|Desktop measurement bridge/driver and registration|
|33ff549|Small-equation workflow PASS70rows/6files/independent frozen1pm source check|
|015f354|ArchiveR3 FAIL at typed width100→120, not owner lifetime|
|2b92bdd|OrientationR11 historical FAIL and conditional analyticY analysis|
|31049d6 /8749e8c /1f037a2 /875a9bc|Singular recovery /rectangle arrangement /BaseCompact /retained report scoped passes|

## Agent lanes: source work is not yet qualification

Three existing authorized agents; no concurrent Chrome drivers.

- History: Core branch `feature/shared-feature-history-controls-20261108`,
  latest observed committed tip `9acfd4694be47d9d55973976a51f972fbc1dd27c`.
  Ordered packet `0e97040`→`ffa2dfa`→`21a35da`→`b3640c0`→`0589b00`
  (complete public .cad driver/oracle)→`7fe28c3`→`9acfd46`.
  Desktop adapter `e34910267356d8409fb4a84a968a2d1d003dc9ee` is clean/both LANs.
  Core box-git9acfd46 confirmed; R730 push in flight, prior0589b00 confirmed.
  Final currentness guard under review; not yet integrated on main.
- Precision: R730 `/mnt/data10tb/codi-acad-original-rectangle-20261107-r1`,
  branch `feature/physical-coordinate-budget-20261108` based on e28cf77.
  Local staged preparation `/tmp/codi-physical-coordinate-source-20261108`;
  new physical policy plus diagnosticGeometry/verifiedReplayGeometry/
  splineDerivedValidation. Final50pm commit/report awaited.
- Numerical diagnostics: R730 `/mnt/data10tb/codi-acad-inset-label-20261107-r1`,
  branch `fix/solver-stop-diagnostics-20261108` based on e28cf77.
  Last confirmed dirty file dogleg.js; LM/solver/AlgNumSystem/headless diagnostic
  plumbing still pending. No raw stopping-threshold change planned.

These are live working snapshots; do not assume uncommitted agent work is backed
up. Re-read branch tips/status and their SOURCE/README notes before integrating.

## Resume without rediscovery

1. Read this snapshot, current Core scope/precision contract and Desktop matrix;
   then inspect actual main and the three branch statuses. No pause is implied.
2. Preserve all failed receipts; fix actual fixture login startup before rerun.
   No active shared Chrome driver was confirmed after R4 exited1.
3. Integrate final coordinate-only50pm and numerical diagnostic packets after
   source review; preserve exact authored intent and other unit/domain budgets.
4. Integrate final history/measurement source and Desktop adapters coherently.
   C07 imports a new Native graph module: restage ALL configured Native graphs
   through normal graph discovery before building; old cached graph closures are
   not valid. No C++ rebuild implied merely by JS graph changes.
5. Normal build, fresh signed CAD+real Files fixture and actual manifest pins;
   run complete Chrome workflows sequentially. Do not retag old evidence with
   new source. Start with orientation/.cad/roles/history affected flows.
6. Work remaining finite inventory in
   `docs/reviews/GATE1-FINITE-CLOSURE-AUDIT-20261107.md`, C01–C09/C11/C12.
   It distinguishes real missing product operations from missing evidence.
7. Qualify final composition/beta/exact examples, then freeze release candidate,
   handoff/checklist/backup and pause. Later CAD projects do not expand Gate1.

### Repositories and current infrastructure

- Core local `/tmp/codi-acad-main-20261107`; example.invalid
  `/srv/data/git/ACAD.git`; R730 `/mnt/data10tb/git/ACAD.git`.
- Desktop local `/tmp/codi-desktop-mechanical-candidate-20261105`, branch
  `integration/desktop-mechanical-candidate-20261105`; example.invalid
  `/srv/data/git/CodiServer-distro.git`; R730 `/mnt/data10tb/git/CodiServer.git`.
- Actual R730 built checkout `/mnt/data10tb/codi-acad-build-20261107-r2` at a5368ef;
  Desktop stage `/mnt/data10tb/codi-drawing-workflow-desktop-20261107-r1` at a0def557.
- Runtime loopback20983, ChromeCDP19329; apps
  `/mnt/data10tb/codi-acad-edit-repair-stage-20261108-r1-apps`.
  Existing local pins `/tmp/codi-acad-edit-repair-pins-20261108-r1.json`.
  Treat these as conveniences, not portable source truth: rebuild/re-pin if absent.
- Build helper `/mnt/data10tb/codi-acad-full-app-build-20261108.sh` is existing
  infrastructure, not sufficient for C07 fresh Native closure staging.
- Latest archive startup logs:
  `test/native-cad-container/evidence-r4-startup/`.
  Latest numerical evidence:
  `test/line-orientation-public-workflow/evidence-r11/`.
- Files accepted; filesystem races/security probes canceled; visitor relay OFF.
  No public deployment during current implementation; /desktop unchanged.
- Local disk about800MiB free at last observation; put large builds/deps onR730.
  Do not remove evidence/source. No new release/source packaging diversion.

Every code/evidence assertion above has bounded scope. Commit this checkpoint
and both repositories to both LAN mirrors before claiming it backed up; print
actual resulting commit IDs in the user-facing report.
