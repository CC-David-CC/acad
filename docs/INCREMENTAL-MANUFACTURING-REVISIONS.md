# Research design: incremental manufacturing revisions

This is a proposed scheme, not an implementation or compatibility promise. The
current worker experiment streams the entire project each time. It bounds its
working buffers but cannot reuse previous hash work. A Merkle root is a new,
explicitly versioned identifier; SHA-256 of a whole file cannot be recovered
from the SHA-256 digests of its chunks.

## Separate revision scopes

* `model-merkle-v1`: history, model expressions, all sketch content, surfacing
  content, and their explicit ordered structure. It excludes material,
  appearance and the stored revision token. It must represent everything that
  can affect current or future geometry; this conservative first schema includes
  even fields that might later prove to be presentation-only.
* `manufacturing-merkle-v1`: the model root and the complete validated
  manufacturing metadata, including units, object and region grouping, bindings,
  material identity, appearance and transforms. It excludes its own root.

Each component is typed and domain-separated, length-delimited and SHA-256
hashed. Maps sort canonical JSON keys using one specified ordering; arrays retain
order. Strings are canonical UTF-8 JSON with unpaired surrogates escaped, and
numbers match the explicitly versioned JSON encoding. Leaves include their
logical path, content length and content digest. Parent nodes encode child count,
ordered child names and digests with explicit byte lengths. A subtree cannot be
substituted across model/metadata domains or paths. The version and hash scheme
travel with the digest, and unknown schemes are refused, never silently treated
as a full JSON SHA-256. Published cross-language test vectors are required.

Split large logical items into fixed-size canonical byte chunks initially. Every
chunk has an offset/index and length. This is efficient for in-place edits but
insertions can shift later chunks and trigger rehashing; content-defined chunks
are a later option and must preserve deterministic boundaries and limits.
Small independent entries (operations, sketches, bindings and regions) should
be addressed as distinct logical leaves rather than requiring file-wide chunks.

## Cache correctness and transactional invalidation

Cache keys include account subject, project identity, hash-scheme version,
logical path and a service-owned monotonic revision; never use a caller-supplied
hash, timestamp or advisory file version as proof of content. A cache entry is
reusable only if the owning authoritative document service can prove that exact
logical item and all relevant descendants have not changed. Unknown provenance,
legacy imports, external edits, account changes, counter reset, app crashes,
undo/redo or untracked mutation invalidate affected entries conservatively.
Never persist or share cache entries across accounts just because bytes match.
For multiple tabs/devices, a local in-memory generation is not cross-device
authority: compare the account file service's version and reconcile conflicts;
restart or fully revalidate the cache after replacement by another writer.

Model edits, undo/redo, loads, parameter changes, sketch edits and metadata
changes must update item versions and the global monotonic generation in the
same transaction that publishes their effects. No reader may observe a new
model with an old generation or vice versa. Subtree invalidation propagates to
its ancestors, including reorder/deletion and object splits/merges. Version
wraparound or untrusted change paths invalidate the entire tree.

Capture a stable read transaction or immutable snapshot root and its generation.
A worker computes hashes from bounded chunks without transferring an entire
project clone. Cache updates are staged privately; do not publish partial roots
or reuse entries from cancelled, failed, conflicting or stale runs. Before
commit, confirm the generation and exact input membership are unchanged, the
account/frame still matches, and the expected file version remains current.
A compare-and-swap commits both the new cache mapping and file metadata; where
that is unavailable, fail safely and rebuild rather than claim atomicity. If a
file write completes but the model changes during it, the written snapshot may
be valid, but the current workspace remains dirty and must not advance its saved
baseline to the later state. No signal cancellation implies a file was not
written once a write has begun.

## Verification before adoption

Require independent implementations/test vectors covering Unicode and invalid
JSON, tiny/empty/large leaves, key reordering, array changes, domain separation,
path and order binding, corrupted cache entries, one-byte edits, insertion shifts,
reorder/delete, concurrent edits, stale generation, cancellation, crashes,
transaction rollback, account changes and simultaneous tabs. Compare each
cached result with a fresh full Merkle recomputation; don't compare it to a flat
SHA-256 as though they were interchangeable. Measure actual transferred bytes,
number of leaves rehashed, elapsed time, peak renderer+worker RSS and device
memory pressure. One-byte edits to a large unchanged item should rehash only its
changed chunks and ancestor path; prove it rather than infer it from hash calls.
Existing project/file size limits are unchanged by this design. Handle low-memory
or unavailable worker conditions with truthful, actionable errors and retain the
saved model. This proposal is not integrated or release-ready.

## Future physical studies

Manufacturing material identity and display appearance are not evidence of
physical properties. Future physical datasets need independently versioned,
curated provenance, units, uncertainty and validity ranges. Unknown properties
remain unknown. Region material assignment and its coordinate/orientation are
separate from material identity; air and solid regions are explicit. Boundary
conditions, applied fields, study conditions and measurement definitions belong
to a versioned study, not the 3MF display color or a guessed material. Solved
deformation is a derived result tied to the model and study revisions, not an
edit to the undeformed CAD source. Future bounded search must preserve parameter
and material candidates, evidence and limits and independently reanalyse the
selected result for convergence. None of this design implements a physics
solver or certifies a part for fabrication.

## In-memory experiment

`incrementalRevisionCache.mjs` is a non-integrated experiment for the protocol
above. Its caller supplies trusted item/chunk versions and a global transaction
check; the existing model does not yet provide either, so this experiment must
not be connected to real saves. It reuses per-item digests only within one
account, project, path and identical file version. File replacement invalidates
reuse; the future safe lineage mechanism needed to retain cache through an
ordinary save does not yet exist. A private staged cache publishes only after a
second transaction check. Roots are domain-separated ordered lists of path and
content digest; item/chunk digest domain separation is the provider's required
responsibility, not verified by this experiment.

`incremental-revision.test.mjs` covers fresh recomputation equivalence, changed
items, ordering, duplicate paths, discarded and stale transactions, account and
file-version isolation and a synthetic four-chunk one-byte edit. The test hands
the cache the changed chunk's new trusted version; it does not demonstrate a
real document service identifying dirty chunks, real model changes, on-disk
cache durability, browser traffic or automatic recovery. The root is a distinct
`codi-model-merkle-v1` scheme and is not flat SHA-256.
