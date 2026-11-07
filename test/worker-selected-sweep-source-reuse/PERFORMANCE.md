# New main-thread work: bounds and genuine near-limit observation

This optimization does **not** move all heavy work off the main thread or establish negligible UI cost. Key accounting, structural admission and deep freezing are new operation-thread work. Full composed-CAD responsiveness/performance remains unqualified.

The first implementation made another deep copy before freezing. On genuine near-source-limit data it took16.0/6.8/6.5ms in a blank Chromium component. Delta`e474a0e79` removes that second allocation/copy: after bounded structural admission/accounting it freezes the ALREADY private admitted Worker record in place. It never freezes a live source/model or externally supplied command object. Immutable string leaves are retained; only a temporary bounded list of object references is needed. Mutation/retirement/cancellation/cap and real Worker controls still pass; the new identity assertion proves the returned immutable proof is the original private record.

## Reachable bounds

The helper defensively limits32768nodes/depth32 and8MiB aggregate optional payload accounting. This operation does not send an8MiB geometry object to its freeze pass.

Its callback returns exactly2 solve records. For each, existing `captureSelectedProfileSolve` admits a sketch tree≤8192nodes and solved serialization≤65536UTF8bytes; the tree must serialize exactly to that string. Evidence is independently≤65536bytes and reaches this helper as an immutable **string**, not another evidence tree; digest is64characters. Across the pair this bounds roughly16.4k tree nodes plus fixed wrappers. Counting string/key units at4bytes and conservative node/property overhead yields about2.4MB maximum proof-accounting weight, not exact JS heap/RAM. Separately bounded key fields are also accounted; source/model references are not traversed or cloned.

Optional overflow still runs uncached rather than rejecting a formerly valid model. Bounds are not universal time guarantees. Existing main-thread reply validation and subsequent rendering/admission are outside helper-only timing.

## Genuine source data

`large-source.mjs` used actual production primitive transition Workers, then4 fresh independent production solves/capture. Its maximal requested primitive-family prefixes were:

| Source | Objects | Solved source bytes | Next actual primitive response |
|---|---:|---:|---:|
| Circle |483|65424|65559bytes; exceeds existing64KiB limit|
| Segment |435|65399|65549bytes; exceeds existing64KiB limit|

922 generation Workers and4 fresh proof Workers retired. The pair has10125nodes/10124keys/209486UTF16string+key units. The offline checker verifies counts, exact serialized-source/sketch equality and actual source SHA/digests. This is a genuine solver-admitted proof family, **not** universal worst-case topology or accepted full native-sweep/scene complexity.

Earlier fixture-generator reuse attempts encountered the intentionally one-request production Worker: first unsettled await, then ignored second request/owned process stopped. Both diagnostics remain. Success used a fresh Worker per transition; no source seed or product bypass.

## All observations retained

| Policy/run | Main pass ms (3 observations) | Hit ms | RAF across pass |
|---|---|---|---|
| Original copy+freeze R1 |16.0,6.8,6.5|0.3,0.1,0.1|16.6–16.8ms|
| Owned-record freeze R2 |12.7,5.9,3.9|0.3,0.1,0.1|16.6ms|
| Owned-record freeze R3 |14.2,4.1,2.9|0.4,0.1,0.1|16.7–16.8ms|

R2 overlapped retained Node tests and remains a contaminated timing diagnostic. R3 ran after those processes ended. No≥50ms long task was observed. R3 independently verified its owned blank target disappeared; shared browser/root fixture were retained.

Revised iterations receive a fresh structuredClone **before** timing, representing new Worker-owned input rather than an already-frozen record. Payload install/transport/setup clone and actual Worker solves are excluded. The actual helper/owner run in a blank private component page, without CAD scene/model/account or fake Canvas. Digests/immutability and prompt Map retirement are checked.

These samples establish neither causal speedup nor universal frame/full-CAD responsiveness nor zero main work.14.2ms first pass is meaningful. The change removes a needless clone and preserves bounds/immutability. No further framework was added to chase blank-page timing. Composed saved32/four-case/owner-count and responsiveness measurements remain pending; no runtime promotion.

Baseline raw data: `evidence-performance-r1/`; revised runs/platform/pins/check: `evidence-performance-r2/`. Initial controls: `evidence-r1/`; final no-clone controls: `evidence-r2/`. Mathematical/semantic Worker byte hashes are unchanged. No deployment performed.
