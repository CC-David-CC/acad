# Independent AFTER wrapper — source-only preparation

The original projection `check.py`, `dxf_oracle.py`, and independent native
`archive_oracle.py` are unchanged. No assertions, whole receipts, app sources or
artifacts are edited. This packet has not run the checker, parser, build or test.

`run-artifact-oracle.py` executes the existing stdout-only checker as a separate
`python -B` child after a complete terminal whole PASS. It keeps stdout/stderr
and child outcome outside the original whole. It writes FIRST-ORACLE.json only
when the child exits0, its complete stdout parses as JSON with status PASS, and
all original inputs plus pinned sources remain unchanged. Failure/timeout/refusal
retains its new AFTER logs and custody without a PASS artifact or retry.

## Source identities

Provide both the original producing checkout/commit and the new separate
verifier checkout/commit. The wrapper's own source must equal its explicit
verifier Git blob. Each checker/helper must equal its committed verifier blob
AND the identical original producing blob; their bytes/SHA/Git OID are retained.
Original receipt pins and its source roster must bind those helpers to the
provided producing root/commit. Both source roots must be actual clean Git roots
at their supplied commits before/after. This prevents a new wrapper commit from
silently substituting rewritten assertions or a different original producer.
The existing checker independently verifies the full original source roster.

The R8 whole's producing Core was
`4fa264907c9bf44a6a0d857aa5495bc2c3cc6073` in
`/mnt/data10tb/codi-acad-assembled-build-20261110-r8`. Those are original producer
inputs; the NEW verifier commit must be the actual reviewed wrapper commit.
No new qualification is inferred from this source-only note.

## Original input and output bounds

All supplied paths and every ancestor/component must be real and nonsymlinked.
AFTER is an exclusive new directory outside the whole and both source roots.
Inventory traverses incrementally (not an unbounded prebuilt tree list), permits
at most20000 entries/10000 regular files/depth64, at most128MiB per file/1GiB
aggregate, and hashes each original file in1MiB chunks before/after. File
identity is checked around each read; symlinks and other file types refuse.
Checker/import source files are bounded2MiB. Checker logs are retained, bounded
for result adoption at8MiB each; child execution is bounded180seconds. Parsing
original bounded receipt metadata and the small checker JSON is separate from
chunked asset hashing; this is not a peak-RAM qualification claim.

This is an immutable-input evidence wrapper, not a filesystem race test, a new
geometry algorithm, an account test, an app/Native run or a deployment. No
product module is imported. Its ordinary Git/source checks are read-only.

## Root-owned invocation after independent source review

From the NEW clean verifier checkout, with an actual NEW output path whose
parent exists:

```sh
python3 -B test/associative-source-projection-workflow/run-artifact-oracle.py \
 /actual/immutable-R8-whole \
 /actual/NEW-projection-AFTER \
 /mnt/data10tb/codi-acad-assembled-build-20261110-r8 \
 4fa264907c9bf44a6a0d857aa5495bc2c3cc6073 \
 FULL_ACTUAL_REVIEWED_VERIFIER_COMMIT
```

Keep failed FIRST attempts and original whole artifacts unchanged. A passing
wrapper can only certify the existing projection checker's stated finite scope;
it does not qualify all projection kinds, all CAD1, or newer untested source.
