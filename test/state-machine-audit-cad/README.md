# CAD state-machine audit lane

Root owns the single canonical `docs/STATE-MACHINES.md`; this directory supplies source-bound findings, regression controls and mappings only. Reviewed CAD794aab6ef5882cef17d3704538962ca0542c88b9. Full active CAD1 scope stays unchanged.

## Confirmed service-level gap: display-unit final-guard reentrancy

Two production-manager controls fail before correction. In `setDisplayUnits`, the final external `options.valid` callback runs AFTER the revision/readiness checks. A nested accepted inch change is overwritten by an outer stale millimeter request; separately, starting the pipeline in that final callback still permits presentation publication while busy. The actual metadata setter executes with the existing explicit manager fixture, without synthetic geometry or UI. Native/canonical geometry is untouched. See `evidence-before/observations.json`, TAP and source pins.

Rank P2: concrete service-contract/reentrancy fault; current public host validity callbacks are mostly read-only, so no public corruption route or geometric data loss is claimed. Grouped correction: recheck manager/Craft custody, readiness and captured revision after the final external guard, before no-op or metadata mutation. Root authorized only this setter section; all other product ownership stays separate.

The first invocation lacked the worktree dependency link and could not load acorn; it did not execute a manager control. Qualified tests use Node24 and the existing `/tmp/codi-typed-common-transaction-20261105/node_modules` environment (local symlink, not copied state or Git input).


## Repair checkpoint and retained coverage

Product853bd4b90 changes only the display-unit setter section. Manager/Craft identity is captured before caller guards; after the final external guard it rechecks custody, busy/readiness and the exact inspected revision before no-op or metadata publication. Canonical units, numerical geometry, source and journal semantics are unchanged.

After-fix controls: **5 new regressions PASS** (newer nested edit, newly stale no-op, pipeline-start, manager replacement, Craft replacement); **14 retained manager controls PASS**, including ordinary/no-op/stale/lifetime and actual validation/hash Worker paths; **36 lifetime/resource/restore/material controls PASS**; the actual state-batch control program and full TypeScript also pass. See evidence-after. No native geometry was simulated or qualified. The initial 2FAIL observations/TAP remain frozen under evidence-before.

This is a confirmed service-level contract repair, component-qualified. Current public host callbacks are mostly read-only; no unsupported claim of a live public corruption incident is made. A newly built signed app containing this setter change has not been qualified by this lane. [Mappings](MAPPINGS.md) feed the existing canonical families; they do not create another state-machine inventory or increase its family count.
