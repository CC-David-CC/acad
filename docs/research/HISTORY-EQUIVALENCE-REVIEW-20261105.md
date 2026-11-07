# Independent review: restored sketch equality

Reviewed `2ad57a006df613c4ce0cbdfb1743742bfb26a763` as carried by root `3bd196f31`. **No concrete correctness or ownership blocker found for the native serialized-state comparison.** This review adds tests/receipts/notes only; no product change is proposed.

`web/app/sketcher/historyEquivalence.mjs:6` retains array length/order and distinguishes arrays from objects. Lines 7–8 compare the complete sorted set of own JSON keys and every corresponding value; integer-like, prototype-named, Unicode and extra keys are not ignored. Primitive types and complete strings remain significant. JSON parsing produces ordinary data properties, so these accesses do not invoke user-authored getters or `toJSON` methods.

The legacy rule at line 17 is unchanged: only when an expected constraint lacks its **own** `admission` property may the replayed hint at that same stage/constraint position be removed before comparison. Explicit null and other saved hints remain meaningful. The helper does not reorder stages/constraints, remove hints from already hinted expected rows, or ignore other metadata/geometry. Unknown legacy admission priority remains unknowable; no intent migration or generalized hint relaxation is introduced.

The deletion affects only the function's freshly parsed actual JSON graph. Inputs and retained history snapshots are immutable strings; no parsed graph, keys or label text is cached in module/global state or returned to the caller. Both temporary graphs remain needed during the synchronous call, and object key arrays are still allocated/sorted. The change avoids repeated canonical copies, not all large-data allocation or main-thread work.

`web/app/sketcher/history.js:105` still loads strictly, compares, rolls back on failure and retains the earlier recovery snapshot if rollback fails. `recover` at line 124 likewise preserves recovery until verified. Pointer movement, snapshot budgets, patch application and history string ownership are unchanged by this commit. The comparator continues to rely on strict load/serialization for native format validity; it is an equality check, not an input validator.

## Independent focused checks

The existing three `history-equivalence.test.mjs` tests pass. New [pure source-method controls](../../test/history-equivalence-review/review.mjs) perform **275 differential comparisons** against [the exact prior algorithm](../../test/history-equivalence-review/previous.mjs): mixed-stage legacy hint presence, explicit null, changed/removed saved hints, reordered stages/constraints, geometry/metadata/type/key changes, own prototype-named data, fixed-seed nested key permutations and complete ~1 MiB strings with a difference near the end. All intended outcomes agree. These are comparison semantics controls, not a new browser/model/history reconstruction qualification.

Comparator-only instrumentation on the large input records four JSON parses/four JSON stringifications before versus two parses/zero stringifications after. The old comparator generated 4,161,920 additional string code units in this control; the new comparator generates none through JSON.stringify. This is logical output-size/call evidence, not measured peak memory, RSS, physical string allocation size or all history allocations. [Raw source-control receipt](../../test/history-equivalence-review/receipt.json) contains exact method/test hashes.

One out-of-domain distinction is explicitly retained: JSON text with numeric overflow (`1e999`) was canonicalized to null by the old JSON.stringify path; the new comparator refuses equality with null. Native snapshots emitted by JSON serialization do not contain the overflow spelling, and strict native geometry validation rejects nonfinite coordinates. This is stricter behavior outside the emitted native-state domain, not a supported-history weakening.

## Existing runtime evidence and limits

Inspected root-provided [147 log](../../test/history-equivalence-review/root-147-large-history.log) and [2ad log](../../test/history-equivalence-review/root-2ad-large-history.log), each reporting 1,037,419 bytes. Both report undo changed state, exact redo, native reopen and released history. Both retain 8,304,560 charged bytes across two snapshot entries. These are root's matched browser tests, not a separate browser run by this review lane; their runtime asset binding was not re-audited here.

The single paired observations show max heartbeat gap 59.4 ms versus 42.2 ms and one 52 ms long task versus none. Heap-after samples are similar and are not peak-memory proof. The logs do not separately report an undo duration, so no specific undo speedup or threshold follows. These small matched observations and the pure allocation control support the bounded optimization; they do not qualify 128 MiB CAD, general worst-case latency or completion of the full Worker-first snapshot goal.

No blocking missing control remained in the reviewed equality semantics after the new focused checks. Broader runtime scope remains owned by the existing qualification work; no source packaging or deployment occurred.
