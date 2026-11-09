# N8 / ARC23: archive cost reconciliation and next whole-workflow plan

Source/evidence review only, 2026-11-08. Core base `b2ed517865ded824260503b31210659ff2dca072`; Desktop source reviewed in `/tmp/codi-desktop-mechanical-candidate-20261105` (head observed `19490e2826b903a526aff8056afe9f0638cef785`). No product, quota, driver, acceptance-status or Files change; no test, build, browser, Native or performance execution. Historical measurements below retain their producing scope. This is not another qualification run or a universal memory/performance claim.

## Decision for the next step

The remaining ARC23 main-thread serialization is source-confirmed. `.cad` moves archive encoding, hashing, compression and validation to a Worker, but host dirty/currentness checks still synchronously build and serialize the authored envelope. Open also hydrates a parsed graph **and** Worker-prepared storage strings on main before actual model adoption. Neither cost is measured by the existing archive receipt counters.

There is no newly demonstrated archive corruption, leaked codec lease, mandatory full Blob copy or physical-memory regression in the reviewed evidence. The previously repaired restore-owner transfer remains qualified; do not reopen it merely because a Worker was observed or a Blob is retained. Next use one complete current genuine part workflow to attribute costs, then decide the smallest ARC23 repair. Do not patch Files, add a full-file cache/copy layer, lower integrity checks or raise limits based on an inferred cause.

## Contracts and distinct budgets

Normative source: `docs/proposals/CAD-NATIVE-CONTAINER-V1-20261107.md`, especially the existing-seam inventory, limits, Save settlement and cost acceptance; concrete implementation contract: `test/native-cad-container/CONTRACT.md` and `RESTORE-OWNER-HANDOFF.md`. The older N8 audit row and initial unchecked format notes describe their source era; later actual `.cad` receipts below are not demoted to JSON proofs.

| Bound / obligation | Actual meaning; preserve it |
| --- | --- |
| Archive outer and aggregate decompressed content | Each at most 134,217,728 bytes; all bounds apply together. `nativeArchiveFormat.mjs` also bounds 10,032 entries, 10,000 sketches, 16 optional derived entries, 8MiB metadata and 256KiB credits. Not a heap bound. |
| Native document structure | Existing history/sketch/tree/depth validation remains. The 256-entry/256KiB authored edit capture is not a replacement native-file capacity policy. |
| Files | Existing 128MiB file limit, account quotas, verified generations, CAS and committed/unknown settlement remain. No new quota or Files exercise is proposed. |
| Installed site/app code | Desktop `active-system/assets/desktop/app-inventory-limits.mjs`: 4,096 files, 256MiB per asset, **1,073,741,824 bytes total**. Source explicitly says installed trusted code, not user files or a resident-memory allowance. Preserve this 1GiB inventory budget. |
| Codec custody | One prior verified archive plus one pending output per owner; an Open can temporarily retain old and candidate frames. This is not one/two total physical copies throughout browser/Files/renderer processes. |
| Editing truth | One authored graph; source/IDs/units/material/drawing/surfacing retained. Cached/derived data is never authoring or regeneration authority. Session journal remains session-scoped. |
| Heavy work | UTF8/JSON archive encoding, SHA/CRC, compression and strict archive validation in Worker. Cooperative source projection and hydration still do main work; ARC23 dirty comparison remains explicit. |

No actual current contract reviewed establishes a universal browser physical-memory cap or a Save/Open latency SLA. Neither 1GiB installed-code inventory nor a historical harness safety stop supplies one. Root should choose any additional performance acceptance budget **before** a future run; never label a post-hoc sampled maximum a product limit.

## Current ownership and work map

Paths in this section are Core-relative unless prefixed Desktop. These are source paths, not attributed wall times.

| Seam | Actual work and ownership |
| --- | --- |
| Desktop `apps/system/jsketcher/index.mjs:132–144` | `snapshot()` calls `snapshotCurrentProject()` then `JSON.stringify(supportedEnvelope(...))`; `unchanged()` repeats it, and `hasChanges()` compares with retained baseline. Open, Save and derived export guards call it repeatedly. No timer-driven dirty polling was established by this review. |
| Desktop `index.mjs` Open / `.cad` Save / export and `inspect-state.mjs` | Open captures old/restored snapshots before adoption; `.cad` Save captures a baseline before Worker prepare and checks again afterward. Export takes and rechecks a snapshot. Inspect separately rebuilds/parses inspection data and compares authored JSON. Archive compression does not remove these passes. |
| `projectManagerBundle.ts` `captureCurrentProject` / `capturedManufacturingJob` | General snapshot captures model and sketches using JSON serialization/parsing; synchronous surfacing source save is included. Geometry-capturing jobs can additionally `structuredClone` the envelope. Native archive prepare deliberately uses `captureGeometry=false`, avoiding that clone on its new byte-preparation path. Keep the pure no-incidental-project-cache-write behavior. |
| `projectBundle.ts` `captureModel()` | Returns the real history/expression/assembly/counter references plus history-state marker. It is source projection, not a new serialized geometry model. Ordinary explicit project autosave remains separate. |
| `nativeArchiveSource.ts` | Traverses actual own-data source, lazily reads actual sketch strings, bounds depth/nodes, batches at most 512 tokens/64KiB charge, splits strings without breaking surrogate pairs, yields after acknowledged credits. No whole-envelope main stringify/hash is introduced here. `Reflect.ownKeys`/projection still cost main work; credits do not prove a fixed per-batch time. |
| Surfacing `Scene.entity.ts` / `surfacingBundle.ts` | Cooperative serializer projects the same scene/order/fields, membership/weights/groups/mirror/source IDs, yielding every 256 steps. No tessellation or new Native construction. The synchronous compatibility serializer remains in snapshot paths. Nonempty scene cost is unmeasured here. |
| `nativeArchiveCodec.worker.ts` encode | Canonicalizes/validates source, checks manufacturing, owns entry text/metadata and prior compressed spans. Changed entries are encoded/hashed/compressed; unchanged verified spans pass through. Output uses chunk Blobs/final Blob. That proves logical ownership, not browser physical-copy behavior. |
| Same Worker decode/hydrate | Validates ZIP local/central/descriptors, decompresses/verifies CRC/SHA, parses authored JSON and prepares both parsed `value` and `storage` strings (including model stringify). It keeps a verified previous archive and streams `{value,storage,parameterState,receipt}` back in credits. |
| `nativeArchiveClient.ts` / `ArchiveDataReceiver` in `nativeArchiveFormat.mjs` | Main consumes bounded token messages into actual arrays/objects; text accumulation uses `this.text += value`. Main does not JSON-parse the whole archive here, but graph/string materialization, possible flattening/GC and PM staging loops remain. Decode output is not a zero-duplication graph. |
| PM restore/adoption | Actual storage strings and parsed model are staged, then normal regeneration/adoption runs. Local restore-owned codec transfers exactly once after successful restore into an empty managed slot; reset still closes old managed ownership. Failure closes its own local codec and exact-job restore. No re-decode/rebind or replacement-owner cleanup is proposed. |
| Worker rebase / host verified lease | Committed generation is independently verified; rebase hashes the full committed Blob and compares with issued pending SHA before replacing previous. Prior host lease is released after ownership replacement/codec cleanup. A returned Worker result is not a file commit. |

The same value can exist as authored storage string, parsed sketch/model, candidate replay data, renderer state and codec-owned entry text. Some are necessary for different authorities; their actual simultaneous memory must be measured. Source alone cannot turn each logical occurrence into a full physical allocation, nor prove no copy.

### Export is a separate phase, not archive decode

Modern generic core3MF takes the protected manufacturing observation/replay and one-shot Worker encoder (`workerGeneric3mf.ts`); actual mesh buffers transfer to the encoder and the final `Uint8Array` is a view of its output buffer. It avoids the legacy PM `prepareHostSave` fallback, which still captures an envelope. Native/mesh rebuilding and encoding remain actual costs even when the `.cad` archive is tiny.

Linked SVG uses `capturedManufacturingJob(...,false)`, guarded current drawing/document/geometry tokens, protected Native read and Worker rendering. Main admits bounded metadata/intrinsic buffers; projected buffers are transferred. The public host still performs its format-independent snapshot guards. SVG is derived display, not a second measured/source model.

STEP captures bounded original source/frames/history and performs owned read-only Native replay/export; native lease/chunks stay in Worker. Preserve its existing 8MiB export/64KiB chunk bounds and every format's actual output/mesh caps. Do not raise all outputs to the archive's 128MiB limit. Export observations/ownership cleanup and actual file settlement must be recorded independently from archive codec ownership.

## What existing primary evidence does and does not establish

Desktop paths below refer to its repository; Core paths refer to this repository. Raw receipts and their producing artifact/oracle packets take precedence over summary headings.

| Existing evidence | Actual observation | Boundary on the claim |
| --- | --- | --- |
| Core `test/native-cad-container/evidence-r7/{receipt.json,oracle.json,*.cad,README.md}` | Core `8908fb8…` / Desktop `7c2b85f…`: complete 38-row Save/Open/export flow, four `.cad` files, twelve STEP/core3MF/SVG artifacts, six malformed-file refusals, ten observed codec targets retired; FIRST oracle passes ZIP/CRC/SHA, source and actual artifacts. | Real functional/reuse/retirement proof; archives are only 3,814 / 3,814 / 4,058 / 3,817 bytes. Not 128MiB capacity, peak RAM, GC or large-cache acceleration. |
| Same R7 actual Save counters | Initial changed 11,599/reused 0; unchanged changed 0/reused 2,411; edited changed 5,647/reused 956; after fresh Open/reedit changed 5,614/reused 956. Unchanged file SHA is identical; independent after-Open check retains actual drawing compressed span 956. | Changed counter is uncompressed changed-entry UTF8, reused is compressed span bytes. Outer verification and committed rebase still each scan the full 3,814/3,814/4,058/3,817-byte output. Counter zero is not zero hashing/I/O/network. |
| Desktop `test/full-history-replay-cost/evidence-r1/receipt.json` | 32 accepted outputs from 21,257-byte historical JSON. Open 44,685ms: 128 sketch/64 semantic/1 Native/1 validation Workers; query 41,642ms: 128/64/1. Owned resources retire; sampled owners/mounts bounded. | One Native realm, not 32 Native Workers. 500ms samples can miss transitions. Not `.cad`, memory use or large authored source; overlapping Worker times must not be summed. |
| Desktop `test/full-history-replay-cost/cache-qualification/evidence-r2/receipt.json` | Same finite 32-output case: Open 10,865.66ms with 4 sketch/64 semantic/1 Native/1 validation; query 8,863.63ms with 4/64/1. Main observers saw overlapping outer/iframe 190/76ms tasks and about 200ms maximum Open RAF gap; early observer blind spot recorded. | Actual later source cohort, not a controlled same-binary speedup study. No exact hydration duration, no zero main work and no used-memory inference. |
| Desktop `test/agent-cad-corpus/sweep/signed-capacity-evidence-r2/receipt.json` and `signed-capacity-reopen-evidence-r1/receipt.json` | Original 32/33rd quota/query/Save passed then Open timed out: **retain FAIL**. Later separately frozen reopen proof passes, about 44.063s Open/43.031s query on the 21,257-byte source. | Finite Native output capacity and recovered functional Open, not 128MiB source capacity or a RAM theorem. Reuse rather than repeat quota controls for a cost audit. |
| Desktop `research/native-app-cache-proof-20261107/evidence-r1`, `evidence-r2`, `RESULTS.md` | Native WASM payload 35,204,120B, completed encoded transfer 35,204,843B on private-profile repeats (cache objective FAIL). Ordinary-profile actual native queries have explicit completed cache hits/encoded zero; three warmed wall times 1,827.522 / 1,981.375 / 2,116.912ms, 192 classes/state preserved. | Profile/HTTP-cache behavior, not zero CPU/RAM or cold/native-hydration performance. No CacheStorage copy layer. Local policy proof did not deploy production Caddy. Absence of a network event is not encoded zero. |
| Desktop `tests/files-isolated-128m-transfer-receipt-20261104.txt` and adjacent `.md` | Actual 134,217,728-byte Files capture/sync/fresh-profile read and one-byte delta SHA pass; 71,509B application request bodies during delta, 174.572s whole run, sampled heartbeat 31.055ms. Once-per-second process-tree PSS/private samples: baseline 427,685,888/222,810,112B; capture maxima 841,393,152/637,820,928B; fresh read 1,026,091,008/802,803,712B; closed-pages 408,201,216/204,980,224B. | Isolated Files, two browsers/test generator/verification overhead, guest stub and blocked speech. No Native CAD. Sampled maximum is not continuous peak; excludes Node/server/kernel cache. Request bodies are not wire traffic; 3.5GiB harness stop is not a product budget. |
| Desktop `tests/files-public-beta-128m-memory-audit-20261104.md` | Reconciles older 3,490,820,096B summed RSS observation and retained harness buffers/process sampling. | Do not relabel shared-page-summed RSS as physical CAD peak or infer a codec leak. |
| Desktop `tests/jsketcher-combined-core-b2a-20261105.md` | Source-era actual 1,037,667-byte sketch/large label: retained edit/travel/native JSON reopen, 403ms task/461.1ms heartbeat gap; heap-used snapshots without forced GC. | Useful historical source-heavy warning; no current `.cad` attribution, current public large-source recipe or leak proof. Raw original temporary log was not established as retained primary evidence by this review. |

Other later complete `.cad` workflows (including actual legacy writer proof `56bfc01`) strengthen functional coverage, not unrecorded cost measurements. No reviewed primary receipt establishes a large `.cad` derived payload, an automatically produced geometry cache or 128MiB authored CAD Save/Open. Do not fill that absence with the Files receipt or a large synthetic label seed.

## Receipt and byte accounting for the next run

Keep distinct ledger columns, including units and phase boundaries:

1. Authored source UTF8 size, logical model/sketch count, actual Native result/display buffer counts and sizes; archive outer bytes, per-entry raw/compressed bytes, and optional derived payload roles separately.
2. `changedEncodedBytes` = changed entry uncompressed UTF8 submitted for encode/hash/compression, excluding manifest; `reusedCompressedBytes` = unchanged actual compressed spans. Decode's `archiveVerificationBytes` counts verified decompressed entry/manifest bytes, whereas encode uses full outer file bytes: label the operation/domain instead of adding unlike counters.
3. Outer output SHA scan, committed rebase SHA scan, host/Files generation verification and actual OPFS writes/read/hash scans separately. Integrity work is required even with no changed entry.
4. Delta literal/copy spans, full-upload fallback if selected, request body bytes, completed network encoded transfer and response payload bytes separately. Observe actual selected path; do not equate archive reuse with Files/network savings. Existing gateway delta/full hash and OPFS 256KiB hashing remain intact.
5. Logical Blob wrappers, ArrayBuffer byte lengths/transfers, outstanding prior/pending/verified-source leases and Worker targets separately from measured physical memory. `new Blob([blob])` and structured clone are not source proof of full copies or zero copies.

Audit artifact collection can itself call whole `files.read`, `Array.from(bytes)`, JSON/XML parsing or retain output Blobs. Perform independent artifact audits after the measured interval where feasible, and report those retained copies separately. Never attribute harness serialization/retention to codec production work, or omit normal production integrity passes to improve a number.

## Bounded next complete acceptance plan (not executed)

### One genuine current workflow first

Use the existing complete native-container/typed-artifact public mechanical recipe: one actual parameter-driven rectangle/through-hole part, material review and linked drawing, on an exact source-bound current normal cohort. Reuse its independent source/geometry/artifact criteria; no private successful seeds, helper-written geometry, replacement backend or additional account/race probes.

Record baseline after exact pin preflight and genuine part readiness; initial `.cad` Save/server equality; unchanged Save; one actual positive width/source edit; required manufacturing review/rebind; edited Save/sync; fresh signed Open; reedit/resave; genuine same-revision STEP/core3MF/dimensioned SVG exports; normal owned-window close and post-cleanup idle. Preserve actual shared travel/source/dirty/currentness and committed/unknown semantics. Independent ZIP/source/entry-span/geometry/export oracle runs only after this whole workflow. Existing malformed/refusal, Files128MiB and quota suites need not be duplicated solely for this cost question.

Label every phase warmed/preflight/current-part as applicable. Do not call a session cold after pin fetch/model creation. Capture profile/cache mode, actual WASM request completion/cache facts and all source/runtime pins; no shared cache clear, interception, global browser changes or hidden new caching layer.

### Measurements without changing authority

* Record end-to-end public Save/Open/edit/export elapsed time, plus observable codec, hydration, replay, file-capture/sync and rebase boundaries separately. A Worker lifetime is not CPU time; overlapping scopes do not add to total latency. If a boundary is not observable, mark it missing instead of subtracting guesses.
* Install passive main-thread long-task/RAF observations in the outer and owned CAD/staging frames early enough to cover hydration. Record missed startup windows and observer failures. A missing >=50ms entry is not zero work; overlapping frame records cannot be summed. Any deeper diagnostic instrumentation is separately labeled from ordinary latency.
* With root-approved owned ordinary Chrome custody, sample actual PID/start-time/type process trees using PSS/private (RSS also retained as RSS), with a stated bounded cadence, missing-process coverage and timestamps. A sampled maximum is a lower bound on a continuous peak. Keep Node/server/OS caches separate; do not count summed RSS as unique physical pages. Include normal guest/speech baseline honestly, rather than silently stubbing features.
* Separately report JS heap **used**, heap limit/capacity, Native WASM buffer capacity, logical meshes/Blobs/AB sizes and process memory. Neither WASM capacity nor JS heap alone measures physical model memory. No forced-GC result is required to claim correct ownership cleanup.
* Observe before prepare; prior+pending output; committed rebase; Open old+candidate frame overlap; hydrated/pre-regeneration/post-adoption state where observable; pre/post-export; accepted idle and normal close/fixed idle. Record per-frame accepted/candidate/detached owners, mounts, codec targets and leases. Successful retirement does not promise immediate OS reclamation.
* Preserve durable write settlement even if a safety bound is reached: retire only owned cancellable prewrite work; never force-close an uncertain Save or pretend it did not commit. A run safety stop is disclosed, not promoted to a product SLA/quota.

### Large-source and large-payload followup gates

A 21KiB source with 32 Native outputs, a near-1MiB historical label, a 35MiB WASM and a 128MiB opaque Files Blob stress different things. Do not combine them into one claimed large-CAD measurement.

For **actual authored-source/ARC23 scale**, first identify a genuine available public authoring chain with meaningful large source/surfacing and an independent source/geometry oracle within all existing bounds. No such current large-source recipe was established here. If absent, report that concrete input/coverage prerequisite before qualification; do not privately pad or seed a successful model.

For **codec-only large unchanged content**, a separately root-approved bounded optional-payload carrier around a genuine authored archive could isolate compressed-span reuse and Files/hash costs. Label its bytes opaque/non-geometric and its producer independent; preserve authored source/identities. Current product does not automatically produce/adopt a geometry cache. Such a fixture cannot establish actual model-cache acceleration, main hydration scale, meaningful CAD capacity or renderer memory, and is not implemented/requested by this note.

Do not jump directly to a claimed 128MiB CAD pass from either carrier. Any eventual actual-capacity workflow requires a real admitted authored input, whole regeneration/source proof and attributed measurements under unchanged limits. Historical Files capacity remains valid for its own subsystem.

## Recommended decision boundary

Proceed with one current genuine whole-workflow attribution run when root's serial runtime lane is free. Preserve completed functional proofs and their failures; make no new blanket N8/ARC23/Gate1 signoff here. If measured main serialization dominates, propose a focused authored dirty/savepoint identity design preserving currentness, rather than synchronizing a second model or trusting archive/cache hashes. If hydration dominates, target the real parsed/storage duplication and staging boundary with equivalent adoption authority. If Native replay, assets, Files integrity or export dominates, keep that attribution separate. Current source confirms the ARC23 work seam; it does not yet choose a justified codec/Files/memory patch.
