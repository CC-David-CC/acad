# Exact saved-content Worker seam — source only

Core base 56756590. No tests/build or complete Host dirty-state repair.

Extracted captureHostProjectSourceJob from native encoding: same lifetime,
source/currentness/counter guards, cooperative surfacing and lazy sketches.
prepareHostSavedContent produces a private equal/isCurrent/adopt/release
capability. Equal null means no baseline. Adopt only after known Files commit
or successful Open/New publication. It checks document lifetime rather than
source currentness so a captured earlier save can remain the baseline.

Document-owned codec Worker retains one exact baseline and one pending
preparation, mutually exclusive with archive preparations. Strict credited
source transport reconstructs envelope/parsed sketches in Worker; exact saved
JSON order/value/number semantics are compared chunk-by-chunk, without hashes
or coordinate tolerance. Each retained stream is bounded128MiB, depth132,
nodes3M. Errors/cancellation close the owner and lose its baseline/cache,
requiring unknown rather than a clean result. Existing cleanup fence applies.

Still required: same-capture content preparation inside native encode; Host
known-write baseline adoption/cache, asynchronous inspect and New/Open
confirmation, synchronous conservative close, legacy JSON encoding disposition,
source roster closure and grouped large-project/workflow qualification.
This packet must not close ARC23 or CAD1. Review exact envelope equivalence,
shared-owner lifecycle and stale publication before integration.

## Coupled source continuation (not built/tested)

Same native encode now retains its exact authored-envelope stream and exposes
adoptSavedContent before rebase, so no second source capture is needed for Save.
Legacy JSON is encoded as an intrinsic Worker Blob from the same exact stream.
The manager caches exact observations against revision, baseline generation and
Worker identity. A stale source comparison sends a content-cancel transaction
that preserves the Worker baseline; physical failure remains unknown/fenced.
Adoption is capability-local idempotent and independent of archive rebase.
New/Open use a privately issued content preparation then adopt before candidate
publication; abandoned frames retire their baseline when detached.

Compare may inspect a settled history prefix using full authored history;
Save still refuses history review. Custom workbench and stale typed-parameter
results are refused explicitly without full Main snapshots. Unapplied wizard
and sketch drafts remain separate from accepted content and keep the Host's
synchronous close guard conservative.

Host companion branch fix/cad-dirty-tracking-20261110 removes its full JSON
snapshot/comparison path, adds async exact inspection and coalesced conservative
idle refresh, awaits refresh before file operations, and adopts same-capture
baselines only after known Files writes. Independent source review and grouped
E2E remain required. Legacy prepareHostSave still exists for other internal
callers and is not claimed globally free of copying. Cooperative capture still
walks authored data on Main; peak memory and responsiveness require measurement.

## Independent source review and explicit limitation

Read-only review through Core e8185f5a and Host5c4cd6c0a reported no remaining
confirmed source blocker. Source corrections preserve final JSON fragment
surrogate pairs, fence cached responses after reentrant caller validity checks,
retain accepted-source inspection beside stable wizard drafts, and inspect the
live surfacing count without serializing the scene. This is not runtime proof.

The saved-content baseline shares the document codec Worker. A physical codec
failure (or existing Host cleanup after archive-rebase failure) loses that
Worker's baseline. Cache owner/availability checks then report unknown/dirty;
they never return stale clean. The known Files write remains committed.
Reopen/resave restores the baseline. A separate persistent comparison owner or
an archive-reuse retirement API that preserves baseline would improve liveness;
this packet does not claim that improvement or resource-fault qualification.

Grouped acceptance must additionally place astral Unicode at a final16384-unit
JSON-fragment boundary, verify legacy JSON bytes and fresh reopen independently,
exercise Undo-to-saved, source change during comparison, cached validity callback
changes, wizard/history review inspect versus close/save readiness, nonempty
surfacing count, earlier-save/newer-edit, and candidate cancellation. No cancelled
filesystem-race or foreign-account probes are authorized by this source packet.
