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

Latest composed complete run is orientation R10 on84fe435/Desktop640279b9f,
frozen at b2f3242 under
`test/line-orientation-public-workflow/evidence-r10`. It reaches109 rows, passing
the earlier rectangle/mixed-group/disconnected-append/LengthRelation stops, then
fails first anti-parallel endpoint edit170→190. coordinateTransition's exact
candidate/fresh-solve comparison reports CURRENT_GEOMETRY_MISMATCH without a
field/value/magnitude. No saves run. Original-request coordinate repair with
exact targets/unaffected source/original equations is the immediate solver lane;
no numerical-only explanation or tolerance waiver is justified. The shared
capturedGeometryScope extraction is approved to reuse actual length/coordinate
parameter ownership and original-equation dependency policy, not duplicate it.

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
