# Shared owned STEP export — implementation and acceptance contract

Status: planned Worker/application bridge. Native STEP component qualification
does not establish this workflow. Native project persistence remains the editable
source; STEP is a derived manufacturing handoff from one explicit revision.

## Ownership and input

- Use the existing shared command and complete-part candidate evaluator, also
  used for native point queries. UI and agents call the same operation.
- Capture current document generation, authored revision, selected public body
  IDs and producer identities, material/presentation revision, exact engine
  build, source bytes and existing lifetime guards before asynchronous work.
- Include the project manager's full document revision as well as the geometry
  revision. A material or presentation edit must invalidate the artifact/write
  proposal without a main-thread content hash.
- Regenerate the complete part using one explicitly selected STEP-capable native
  cohort. Refuse mixed or unavailable builds; never substitute another kernel.
- Public input cannot contain DRAW names, pointers, kernel handles, meshes,
  replacement history or a claimed successful result. Validate selections against
  the actual regenerated current-part ownership map before native export.
- Preserve placement. Initially admit only a proved identity-placement domain
  unless the actual placement is exported and independently checked. Do not
  silently drop transforms or component semantics.

## Native resource and transport

- Follow the qualified BeginOwnedStepExportV1 / ReadOwnedStepExportV1 /
  ReleaseOwnedStepExportV1 ABI exactly. Check scalar status before reading the
  structured exchange receipt; clear the exchange slot around each call.
- One private native export lease, at most 8 MiB, sequential reads of at most
  65,536 bytes. Validate resource, offset, length and EOF on every response.
- A negative status accepts no chunk even if the destination memory was copied.
  Publication failure (-11) already retires the native lease: discard all parts
  and fail; never retry that resource or resume a partial artifact.
- A failed publication or copy must release the lease. Cancellation, timeout,
  malformed response and mount disposal must settle once and retire all owned
  resources. Keep pending custody until cleanup and settlement are accounted for.
- Assemble immutable Blob chunks inside the Worker. Send the Blob plus bounded
  metadata. No base64, giant number arrays, whole-file JSON or main-thread text
  assembly. A detached copy is acceptable if its ownership ends cleanly.
- Validate Blob brand/size/type with intrinsic accessors separately from the
  JSON-only metadata validator. Admit exactly one artifact bounded to 8 MiB.
  Do not loosen the generic acyclic JSON metadata contract to carry Blobs.
- Capture supported schema, units and structure from actual native receipts:
  STEP/AP214IS, millimeter, geometric-solid-set. Do not claim assembly or editable
  feature-history export.

## My files and publication

- Use host document/file operations for the destination, browser commit and
  server synchronization. Do not introduce a second application file store.
- The shared save/write lease controls availability across windows. Do not
  acknowledge a successful browser save before its actual commit.
- Distinguish generation failure, rejected destination, known uncommitted write,
  browser commit, pending server synchronization and unknown write outcome.
  Never retry an unknown outcome by assuming it failed.
- Export must not mutate the editable model, journal, counters, source bytes,
  material assignments or dirty state. Recheck currentness before accepting a
  generated artifact or beginning the host write.
- No desktop-PC download is required for this acceptance workflow.

## Required proofs before signoff

- [ ] Actual current-part regeneration, exact native build and ownership checks.
- [ ] Plate with holes, disjoint solids, transformed selections or explicit
      unsupported placement refusal, and a file crossing multiple 64 KiB reads.
- [ ] Independent analytic dimensions, volume, bounds, openings and solid counts
      after reading exported bytes. Label same-OCCT-reader evidence explicitly;
      it is not independent-kernel interoperability proof.
- [ ] Source/result BRep, tolerance, accepted-state and resource preservation.
- [ ] Rejected input, stale revision, cancellation, cleanup failure, disposal,
      repeated export and healthy retry through genuine Worker lifetimes.
- [ ] Normal My files save, exact server bytes, explicit synchronization state,
      and retained export file after fresh login.
- [ ] Native project save/reopen remains editable and can export again.
- [ ] UI and agent use the same implementation and report the same failures.
- [ ] Regression tests and canonical state-machine/checklist updates accompany
      every confirmed correction; retain first failures with their original pins.

No checkbox is satisfied merely by native FFI tests or mocked successful geometry.
