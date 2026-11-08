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

## Current finite execution lanes — 2026-11-07

- Shared primitive append: exact disconnected-component preservation, fresh
  full-candidate admission and original-equation validation; R6 failure retained.
- Singular point distance: actual free reduced-coordinate initializer integrated
 0c6d44c; complete lock/alias/typed/travel/native workflow pending.
- Intersecting profiles: bounded two-rectangle cell/source-span graph integrated;
  normal build passes, whole source/reselection/child/repair/native workflow runs.
- Native .cad: Worker archive/source capture plus ordinary host file association
  source implementation; no archive runtime qualification yet.
- Precision: default rounding source repair pending genuine untouched-default UI
  proof; coefficient/affine-offset loss still open under separate coherent repair.

Qualified Base/Compact37rows/four native files (1f037a2) and current rectangle
reports21rows/two files (875a9bc) are scoped whole-workflow results. They do not
close full Gate1, alter any failed evidence, reopen Files, or qualify1pm geometry.
The canonical detailed matrix remains in the desktop repository.
