# Export refusal codes: source repair and whole-workflow admission

Source-only packet from Core `88a81819078cee0512adcd5cec26f7692a09e79b`
and Desktop `06f630880f66dd171209d62f96ce5187fd91f57d`.
No tests, build, TSC, browser, Native execution or probes were run. This packet
adds no geometry/format qualification or status/count change.

The actual typed-artifact receipt `test/typed-part-artifacts/evidence-r1/receipt.json`
rows7–9 retained `code:null` for stale STEP, unreviewed material3MF and stale SVG.
Frozen producing Desktop3142 and the current signed harness both preserve a
string `error.code`; these omissions originate at the actual throw sites.
Historical receipts, artifacts, criteria and frozen source snapshots remain
unchanged. Their geometry and format evidence is separate from missing G5 code
coverage; this source repair does not relabel them as code-qualified.

## Authoritative predicates

| Predicate | Code | Ownership |
| --- | --- | --- |
| STEP document or geometry revision differs from inspected request | `STALE_DOCUMENT` | Desktop `step-export-commands.mjs` selection admission |
| STEP engine/build differs with matching revisions | `ENGINE_REVISION_MISMATCH` | Same selection admission; distinct from ordinary cancellation |
| SVG or3MF inspected document revision differs | `STALE_DOCUMENT` | Respective public adapters and shared derived-export coordinator's initial revision guard |
| Valid captured manufacturing metadata revision differs from the actual Worker-hashed geometry revision | `MANUFACTURING_REVIEW_REQUIRED` | Core `workerSavePreparation.mjs`, before snapshot digest/publication |

Existing messages and error names are preserved. STEP keeps its AbortError name
and message but assigns the string code only at the known selection predicate.
Ordinary cancellation/currentness aborts are not relabeled stale or build errors.
SVG's existing unavailable-lifetime branch remains separate from its revision
predicate. The manufacturing code agrees with the existing native archive
Worker's same review-required condition; no codec or archive owner is changed.

No catch classifies message text, no generic failure is converted to a known
refusal, and no registry/harness validator is relaxed. `fileOutcomeError` still
returns a prewrite error unchanged and preserves an existing string code when
wrapping a pending/committed write; committed/possiblyCommitted markers, causes,
cleanup precedence, CAS, browser/server distinction and no-retry policy are
unchanged. Unrelated uncoded export failures are not claimed repaired.

## Complete regression to run after composition

The current complete drivers at `test/typed-part-artifacts/desktop-driver.mjs`
and `test/native-cad-container/desktop-driver.mjs` now require, and record before
asserting, these exact codes for the original three real refusals:

1. Edit the actual typed width100→120; export STEP with the previous revision:
   `STALE_DOCUMENT`.
2. Export current geometry with the still-unreviewed real material assignment:
   `MANUFACTURING_REVIEW_REQUIRED`.
3. Export SVG with the prior inspected drawing revision: `STALE_DOCUMENT`.

All existing checks remain: no committed/unknown outcome, absent refused file,
accepted source/history/material/drawing/association/counters/resources unchanged,
then actual formula UndoRedo proving refusals add no journal entry. Continue
explicit material review, successful STEP/core3MF/SVG files, mm/inch physical
invariance, normal Save/server equality/freshOpen/reedit/resave/reopen and the
existing independent artifact/source oracle. The .cad driver additionally keeps
all malformed-archive, Files UI Open, compressed-span reuse and exact ten retired
codec-target assertions. No failure expectation, geometry tolerance or cleanup
criterion is weakened. Root owns the future whole-run qualification.
