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

Qualified scoped whole workflows: singular Point-distance31049d6 (89rows,
10 native files), two intersecting axis-aligned rectangles8749e8c (159rows,
6 native files), Base/Compact1f037a2 (37rows/4files), and retained rectangle
reports875a9bc (21rows/2files). These do not constitute whole Gate1 signoffs.

Built composition8a79bde includes scoped LengthRelation original-request
verification, descendant/auxiliary captured ownership, circular direction seam
comparison, nonzero polynomial/offset preservation and deferred original-row
validation. None is qualified by compilation alone. Original orientation R8
on8a79bde/Desktop640279b9f fails its first10×10 rectangle preparation after
actual97-asset pin verification; the generic failure does not identify its
cause. Receipt and log are frozen under the orientation evidence-r8 directory.
Investigate the real creation path; retain cases/bounds and rerun the whole flow.

Native .cad R2 on63786b8/Desktop640279b9f passes37 functional rows, four native
saves, twelve exports, six malformed-own-save refusals and genuine Files UI
Open. The COMPLETE workflow FAILS its lifecycle expectation:11 codec targets
versus10; all11 retire. Same-generation resetDocumentState closes the newly
decoded managed archive owner, losing its prior compressed spans before reedit.
The local restore-owned codec handoff repair is in progress, not qualified.
Do not change the expected count or infer a permanent Worker leak.

Reference/driving ordinary Segment measurement conversion is a separate bounded
shared-operation implementation lane. Full dimensional families, history/frame
coverage, drawings, fine-scale geometry and final one-build beta qualification
remain open. Untouched human default-dialog precision still needs its real UI
workflow. Files remains accepted; no race tests or external relay are resumed.

Latest composition2157a85 includes reviewed archive-owner repair774c779 and
bounded rectangle diagnostics. Whole orientation R9 (evidence-r9, frozen
7a2c802) still fails first rectangle: INVALID, independent-solve phase,
"Degenerate sketch segment." Both pre/post-solve geometry validation use that
message; the exact collapse point is not established. No later assertions or
saves run. Original equations and all acceptance bounds remain unchanged.
Shared reference/driving conversion and finite history suppress/prefix/branch
controls are independent implementation lanes; neither is qualified yet.

R10 on84fe435/Desktop640279b9f reaches109 recorded rows after the provenance
repair: earlier rectangle/mixed/append/length stops pass in this whole attempt.
First anti-parallel endpoint edit170→190 fails exact warm-candidate versus
fresh-solve equivalence in coordinateTransition; no field/magnitude evidence.
No save/reopen occurs. Coordinate original-request/scope repair is now the
immediate solver lane. Do not claim full orientation/precision/native/archive
qualification from the earlier passing portions. Frozen evidence is under
`test/line-orientation-public-workflow/evidence-r10`.
