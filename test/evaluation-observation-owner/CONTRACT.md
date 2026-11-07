# Permanent observation-owner authority

Actual evaluationResources pool currently permits every sealed candidate to
accept(). The read-only orchestrator keeps its owner private, but state checks
around await alone do not enforce discard-only authority. New mesh ledger must
not risk closing an accepted owner when a callback promotes it mid-read.

Add immutable begin purpose:'model'|'observation', default model. Actual owner
requireObservationOnly() checks its captured role and currentness; a plain flag
or copied caller field grants nothing. Observation owners can allocate/seal/read
and close, but accept() is permanently forbidden, even after a read finishes.
No second resource ledger or temporary mutable lease. Normal publication stays
callback-free. Craft owner must explicitly choose observation for its read-only
pipeline; new mesh helper checks that method and private ledger/state bindings.

While touching admission, retain the pool ceiling across reentrant lifetime
callbacks: recheck owner capacity after the initial guard, before registration.
Use actual branded AbortSignal/EventTarget intrinsic registration/removal and
aborted reads, so own method overrides cannot strand registration/closed-owner
resources. Do not promise cleanup during process/browser crashes.

Tests exercise actual pool and actual native AbortSignal. Closable mounts are
explicit protocol fixtures, not Native geometry. No browser/accounts/filesystem
race, live deployment or accepted-model proof is claimed by these tests.
