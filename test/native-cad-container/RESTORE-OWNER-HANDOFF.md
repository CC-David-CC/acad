# Native archive restore owner handoff

Source-only repair, 2026-11-08. No tests, typecheck, build, browser or component probes were run for this repair. The next qualification is the complete public native archive workflow, with its existing ten-target expectation and all observed targets retired. R2 remains retained at `/tmp/codi-acad-native-archive-whole-20261107-r2` on the root host.

## Confirmed source trace

The failing composed runtime was ACAD `63786b8` / Desktop `640279b9f`. It reached 37 rows, four native archives, twelve real derived exports, six malformed own-file Open refusals and real Files UI Open with healthy continuation. The final codec-target assertion observed eleven rather than ten; all eleven targets were destroyed. This is an unnecessary codec lifetime/reuse defect, not evidence of an unretired Worker.

1. PM `documentJob(options,true)` calls `beginDocumentChange` and captures the **new** generation and its signal before codec creation. The earlier hypothesis of binding to an old generation was incorrect.
2. `restoreNativeArchiveBytesInEmptyWorkspace` previously acquired that codec through managed `nativeArchiveOwner(job)` and decoded once.
3. The unchanged native restore calls `restoreParsedSnapshotInEmptyWorkspace`, then `projectService.loadData(model,job.generation)`.
4. `loadData` adopts that same expected generation, then calls `projectManager.resetDocumentState`. That reset unconditionally calls `closeNativeArchive`, prematurely retiring the just-decoded managed codec and its verified prior archive span table.
5. Native replay and adoption still succeed. The subsequent reedited Save creates an extra codec and has no prior spans to reuse.

PM source blob `96860e59e500529542e933c39ca728a93971210d` and project service blob `1df480bed3ac2b43b889ff9891fc1a0a0c7af4f1` were identical between the failing runtime source and repair base `8a79bde127bdca9333a6c08c0ca415aec0816e9e`.

## Bounded repair

Only PM ownership changes. Before decode, retire any previous managed owner under the current job guard. Create one codec as a local pending-restore owner bound to the actual new document signal. Decode once and run native restore unchanged; metadata reset remains unconditional and sees no managed codec from this pending restore.

After successful replay, recheck manager authority, exact document generation/signal/storage, caller validity/cancellation and local codec availability. Require the managed slot to be empty, then synchronously transfer the exact local owner into it, with no callback or await between checks and assignment. The codec retains the same verified Blob/span table; no rebind, second decode, new native ABI, extra archive copy or main-thread heavy work is added.

Managed prepare and acquisition refuse with `CAD_ARCHIVE_BUSY` throughout the current pending restore, including its decode phase. Failure/cancellation closes only that local owner and always invokes `failOwnedRestore` for the exact job. A cleanup throw, including a falsey value, becomes a stable truthy `WORKER_CLEANUP_FAILED` record with exact `cause` and original `operationError`, and latches the PM cleanup fence. A stale job never closes a replacement/global owner. Host verified leases, whole-file comparison, CAS and committed/unknown outcomes are unchanged.

## Complete workflow assertions

Keep the expected ten codec targets and retirement assertion unchanged. After genuine fresh Open and formula reedit, the driver requires nonzero claimed prior-span reuse and binds its two actual saved archive SHA values in `afterOpenReuse`. The independent Python ZIP/source oracle separately identifies the unique actual `drawings` entry in the pre-Open and reedited archives. It requires the complete descriptor, actual content SHA, compressed bytes/SHA and local record SHA to match, and requires reported reuse to include that nonempty exact span. This is independent of the codec's claimed entry identity and target count.

In retained R2, all four actual drawing entries were 5985 bytes with content SHA `25c1ec8b291b20b2e1a26116554f7b5b2205fecfa1844650d5fd3a49eaee065b`; the unchanged compressed record was 956 bytes. The reedited Save incorrectly reported changed 11599 / reused 0. The oracle derives expected costs from actual archives, rather than hardcoding those sizes or changing the target count. The repair's runtime outcome remains unqualified until the whole workflow runs.

## Remaining limits

This preserves one prior archive plus one pending output, not an unbounded document cache. Files retains its complete Blob integrity/delta work and normal account/file limits. No zero-total-hash, zero-copy, network saving, heap/RSS, latency or capacity result follows from span reuse. ARC23 main-thread dirty JSON comparison and cooperative source hydration/projection remain separately disclosed work. No automatic derived-cache producer or new surfacing/performance qualification is claimed.
