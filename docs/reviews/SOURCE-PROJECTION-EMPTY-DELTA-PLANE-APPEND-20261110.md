# Projection replay with no cache delta at a legacy PLANE append

## BEFORE — confirmed failure and source boundary

The complete mixed protected-read whole failed on its first public `create-rectangle-sketch`, after the retained associative projection chain. Actual runtime Core `556cc3553ffbb4d881463b7efd650bb87d914172`, Host `0fee14964910613df24df860369a22f751c6b92a`; receipt `/mnt/data10tb/codi-acad-assembled-mixed-20261110-r1/whole/receipt.json`, SHA256 `a2e4ee0cd805dfc061582dedf7a84cf74383450dd9fe251bd264acde88e7a63e`. The command returned `Projection cache change requires the actual authored event.`, committed/possiblyCommitted false. Own contexts retired, no pending write. This note neither rewrites that failure nor reports a successful rerun.

`rectangleCreation.ts` submits an actual PLANE append. `craftBundle.ts` only supplies an operation-append journal proposal for `supportsOperationAppend(normalized.type)`; PLANE is outside that vocabulary. With existing projections, its genuine replay still finishes and `preparedProjectionChanges` supplies the actual private delta array. The interceptor always passes that array and its possibly absent journal proposal to `supplementProjectionSourceJournal`.

`authoredEditJournal.mjs:supplementProjectionSourceJournal` currently rejects a missing proposal before inspecting whether that actual array is empty. No cache delta count was retained in the failed receipt. Empty is the source-based expectation for replay of unchanged projection inputs beside a new unrelated plane, **not a measured assertion about this run**. The repair must inspect the real result, rather than assume that expectation or hide a nonempty delta.

The established later Craft path resets the prior shared journal when an unjournalled legacy append changes its accepted history signature. That reset is intentional here: do not retain stale projection events, create a fabricated PLANE event, or substitute another journal. An absent proposal must remain absent when returning from a zero-delta supplement, allowing the existing reset/publication path to decide normally.

## Bounded repair contract

1. Validate the actual rows array and retained count bound before handling an absent proposal.
2. Only null/undefined proposal plus actual zero rows may return unchanged. Nonempty rows still require the actual authored event.
3. A supplied proposal always retains document/revision validation, including zero rows. Historical travel always retains direction and exact historical delta validation; an empty actual result cannot bypass an expected nonempty historical delta.
4. Preserve replay, source/frame/admission/currentness proofs, workspace cleanup, exact before/after cache comparisons, byte budgets and atomic publication. No Native, solver, format, transport, public API or feature allocation changes.
5. Requalify the complete unchanged mixed runner and its after-whole independent archive/equation/DXF/STEP/mesh oracle on a normal rebuilt candidate. No isolated probes or source-only PASS claim.

## SOURCE repair disposition

The follow-up changes only the supplement guard order. It validates `Array.isArray(rows)` and `rows.length<=64`, returns a null/undefined proposal only for `rows.length===0`, then applies the unchanged supplied-proposal identity/revision and historical-travel checks. False or other malformed supplied proposals still refuse. Nonempty rows with no proposal still refuse before publication. Existing Craft reset logic, cache replay/change production, workspace writes and all publication/currentness code are untouched.

No code import, parser, test, build, Native or browser execution was performed. Actual zero-delta success and retained nonempty/travel behavior remain obligations of the grouped whole qualification.
