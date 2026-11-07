# Experimental manufacturing metadata

This is an incomplete research prototype, not a release format. A host-staged
native project may wrap its existing project and a version-1 manufacturing
record. Legacy projects stay unwrapped and acquire no invented identities.
Units, materials and appearances are separate. Printable objects explicitly
contain regions, each with a referenced authored binding, material, appearance,
and 12-number 3MF-style transform. Grouping is never inferred from color.

Bindings reference unique positive feature IDs and an operation type. The
experimental resolver maps each binding to exactly one current model root
whose originating history index identifies that feature. Missing, duplicated,
consumed or multiple roots are errors; no face or shell ID is used as a durable
identity. Exact revision matching currently trusts an external opaque token; it
is NOT a content hash or authentication. `proposeManufacturingRebind` only
builds a preview after an edit; it neither proves semantic equivalence nor
confirms/saves the change.

No user-facing assignment tools, revision generation, confirmation, My files
flow, dirty tracking, reset lifecycle, export adapter or undo integration are
implemented. After changes, split/merge or semantic edits, users need a tested
review flow before any assignment can be rebound. Do not deploy. The old
protected WebOS restore rejects the envelope before mutation. Old standalone
import can clear a workspace before discovering an unsupported file, so opening
the experimental envelope there is unsafe and unsupported.

Focused tests: `node --test test/manufacturing/metadata.test.mjs`. Local Chromium
experiments against test-built assets confirmed an unknown version is rejected
before clearing the empty workspace, a valid wrapped empty project roundtrips,
and one native box's metadata survives staged restore and snapshot. These do
not prove My files, multiple bodies, parameter editing or complete lifecycle.

A separate `test/manufacturing/metadata-browser.test.cjs` exercises a real
native box and its history wizard: width 10 is changed to 15, then a review
proposal resolves its live regenerated root. It needs an independently served
experimental build (`JSKETCHER_URL`) and this source's
`manufacturingMetadata.mjs` as a test-only `/manufacturingMetadata.mjs`, a CDP
browser (`CODI_TEST_CDP`) and `PUPPETEER_CORE_PATH`. This narrow test does not
accept or persist the proposed assignment.

Hash research separates `geometryRevision(project)` (the entire native project
bundle including model, sketches, and surfacing, excluding manufacturing data)
from `manufacturingSnapshotDigest(project, metadata)` (the same project plus
all manufacturing metadata). Each hashes a tagged, sorted-key canonical JSON
value with SHA-256. Array order matters; object key order and source formatting
do not. The digest is returned separately and is never included in its own
input. Metadata's stored revision is included as ordinary data in the snapshot
digest; it is not validated merely by computing that digest. These pure helpers
are not wired to host save or restore, do not authenticate the file, and do not
solve concurrent edits. Canonicalizing large bundles currently allocates full
strings and byte buffers and needs size/worker qualification before release.

`prepareManufacturingSnapshot(capture, isActive)` is an isolated async proof of
the proposed save protocol. It captures a canonical immutable copy, recomputes
the geometry revision rather than accepting the metadata token as proof, and
checks the current capture and activity again after hashing. It returns an
envelope and both digests; it does not itself persist them or check a file's
account, version, frame identity, or close state. Those must be checked by the
host immediately before and after the write. A temporary 8 MiB canonical JSON
cap is explicit; the prototype still materializes the serialized input before
the size check and should not be treated as memory bounded for arbitrary input.
The digest is not yet stored/verified on restore. Hashing and rebind confirmation
are not wired to a UI or the live host.

`hash-memory-probe.cjs` uses isolated Chromium contexts and repeated-string
project input to probe the unbounded geometry hash at 8, 32, 64 and 128 MiB.
It requires an explicitly provisioned test HTTP server exposing this source,
a CDP browser and `PUPPETEER_CORE_PATH`; inspect host free memory first. One
workstation run reported 94/357/636/1224 ms and browser-reported JS heap of
about 49/161/385/769 MiB immediately after hashing. Heap readings are not peak
memory or RSS, and this is not a real CAD workflow or 128 MiB product test.

Incremental hash research: `incrementalCanonical.mjs` emits JSON string
fragments without serializing the entire model, validates JSON-shaped input,
and streams a maximum of one 256 KiB transferable batch at a time to a
separate `incrementalHashWorker.mjs`. The research worker imports pinned
`@noble/hashes` 1.8.0 (MIT; `sha256.js` SHA-256
`f2119097d9414c28c9539b0160a33def471c4f78c075e3f8ab06df72dae47938`,
`LICENSE` SHA-256 `4f221aee6e072336700c408c68ab3b96a3fc09f6aebe6f48f1bd99e5ef13faec`).
Install that and a pinned bundler into an isolated test directory; do not commit
generated worker output or dependencies. For the recorded test build:
`esbuild web/app/cad/projectManager/incrementalHashWorker.mjs --bundle --format=esm --platform=browser --outfile=test/manufacturing/.worker-generated.mjs`.
Serve the checkout on loopback, run `worker-browser.test.cjs` and remove the
generated file afterward. The real Chromium check matched native SubtleCrypto
on Unicode/lone surrogates, observed one chunk in flight, cancelled a worker,
and rejected an actual edit accompanied by generation increment. The caller
must provide a reliable monotonic generation changed by every geometry and
metadata edit, and must recheck identity/file version before saving; neither is
wired here. Dedicated workers must be terminated by their owner on completion,
error, cancellation or window close. This is not an authentication mechanism.

`worker-memory-probe.cjs` runs synthetic repeated strings at 8/32/64/128 MiB.
A workstation run took roughly 0.17/0.62/1.20/2.40 seconds. Sampling the
main-thread JS heap every 20 ms showed highs around 11/35/70/138 MiB;
`performance.memory` reported around 19/68/133/263 MiB at completion. These
are not total-process RSS, worker heap, or true peak; no full project was
transferred to the worker. Input itself remains in browser memory. Complete
real CAD/host save, exact peak and low-memory device qualification remain open.

An experimental `snapshotForHostSave()` validates a manufacturing geometry
revision and rejects changes during preparation; staged restore also verifies
that revision before importing. The companion host branch calls this explicitly
for wrapped projects. It blocks saving after a model edit until a rebind flow
exists. The helper still has the 8 MiB experimental limit and full-document
hash; neither is acceptable as the final product implementation. It does not
store or verify a full manufacturing digest. Prototype-only, no deployment.

The experimental host review flow can propose a rebind only when every region
resolves to one unique current producer with the same feature ID and operation
type. It ties the one-use proposal to exact model+metadata bytes and rechecks
those bytes and all live bindings at confirmation. More than 10 regions are
refused pending a usable review interface. The host confirmation lists each
object, region, material and appearance and explicitly warns this is not
geometry or manufacturing validation. A user must confirm; this is not proof
that unchanged feature IDs preserve topology and it is not automatic rebind.
The temporary 8 MiB/full-hash restriction remains.
