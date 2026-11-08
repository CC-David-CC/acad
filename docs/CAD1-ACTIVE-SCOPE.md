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

## Current finite execution lanes — 2026-11-08

Latest composed complete run is orientationR11 on Corea5368ef/Desktopa0def557,
frozen at2b92bdd, `test/line-orientation-public-workflow/evidence-r11`.
It reaches109rows/no saves, failing first anti-parallel endpoint170→190.
Actual candidate/coldY delta4.5604338084pm exceeds the executed1pm bound.
Conditional independent expectedY errors are11.855235pm/7.294801pm; onlyY was
captured. User explicitly accepts50pm=0.05nm=5e-8mm. Policy source change and
whole-workflow qualification remain pending; historical FAIL stays unchanged.
No full-vector/nanoscale-BRep/physical guarantee follows. Solver diagnostics
and accepted-iterate ownership are a bounded separate source lane.

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
