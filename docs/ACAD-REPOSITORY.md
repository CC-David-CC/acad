# ACAD repository boundary

User decision, 2026-11-07: ACAD means Agent Computer-Aided Design. This is a
separate internal project with one fresh initial source commit and no inherited
JSketcher Git history. Retained source licenses/notices remain intact.

## LAN repositories

- Primary: `example.invalid:/srv/data/git/ACAD.git`
- Backup: `r730:/mnt/data10tb/git/ACAD.git`
- Default branch: `main`
- Original JSketcher source/history remain separately in the old LAN
  `JSKetcher.git` repositories. They are references, not ACAD remotes.
- The prior public fork is `https://github.com/CC-David-CC/jsketcher`; ACAD changes
  must not be pushed there as continuation of the JSketcher integration.

The initial snapshot includes tracked source, tests, evidence and notes. It
excludes dependencies, generated build outputs, private account/service data and
old Git objects. `SOURCE-SNAPSHOT.json` records provenance without importing its
history.

## Qualification

Earlier evidence retains its original source commits, runtime pins, outcomes and
limits. Those historical IDs belong to the separate reference repository; they
are not ACAD ancestors. Their presence does not qualify this new composed build.

New atomic source-dimension/region edits and shell manufacturing admission still
require their complete application workflows. The earlier top-open shell
edit/travel/native Save/Open workflow passed on its frozen build. Gate1 is open.

## Continuing work

Create future worktrees/branches from ACAD. Import finishing work from old
worktrees as reviewed patches, never merge/fetch/push their inherited ancestry.
At cutover, `git rev-list --count main` is one and the root has no parents;
subsequent ACAD commits accumulate normally.

The separate desktop repository owns serving, authenticated file services,
public command adapters and the maintained Gate1 chart
(`docs/evidence/CAD-GATE1-BASELINE-20261106.md`), work queue
(`docs/WEBOS-WORK-QUEUES.md`) and state inventory (`docs/STATE-MACHINES.md`).
Do not create a second independently maintained copy of those checklists here.
