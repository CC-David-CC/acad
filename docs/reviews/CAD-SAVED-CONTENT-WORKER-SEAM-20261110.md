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
