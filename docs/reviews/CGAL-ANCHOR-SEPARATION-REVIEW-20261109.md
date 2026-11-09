# Independent review: CGAL dataset/build anchor separation

SOURCE ONLY / UNRUN. Reviewed the uncommitted three-file delta in
`/tmp/codi-acad-foundation-next-20261109` over HEAD
`fe502d8d94d60ee0a28045aee171495336a9e37a`, following review
`6455be1e5b5832200105e0d9a43b1da44df3c91e`. No Root files were edited.
No checker imports, parsing, tests, probes, builds, Native/library/browser
execution or evidence mutation occurred. These are source findings, not a new
runtime PASS or a replacement for pending planar/custody/launcher controls.

## Exact observed uncommitted source

| Path | Git blob identity | SHA256 |
|---|---|---|
| `test/library-validation/cgal_evidence.py` | `649ddbc64aa8e62229400a9db1081bf4f607a24e` | `54e0aaddaaa60eddf7a418c19fb7716ba005a6f4ead3daa0a1a153387fb82d11` |
| `test/library-validation/CGAL-EVIDENCE-CONTRACT.md` | `4684f48a4134eb641f6b2b2f542f7975e070243f` | `2d69ddf36ad2987ed0d33c3ee96f349bcfe932d86528f10bd0e42dbbb526411e` |
| `test/selected-profile-extents-workflow/check.py` | `d08402cb49c698619fedc101ebefe7366ddfa678` | `71f40f404e51074feb5ef4f81845a193aae5c8bc7a1de0172a940646c537cc8d` |

Blob hashes identify the source read for this review; they do not claim Root
has committed those working-tree bytes. Addresses below refer to this snapshot.

## Confirmed narrow parsing issue

The new optional anchor-file CLI at `check.py:285–286` bounds its size to 65536
bytes, then calls ordinary `json.loads(anchor_file.read_text())`. The standard
JSON object decoder keeps the last occurrence of a repeated key. The later
exact nine-key dictionary check at line 219 sees only that collapsed result.
Thus a document containing duplicate `evidence_commit` or `report_path` entries
can pass the closed key-set check using the final value. All final values still
face the genuine Git/hash/receipt checks, so this is ambiguity in the reviewed
anchor document, not proof that nonmatching evidence can become valid.

Use a bounded duplicate-rejecting `object_pairs_hook` for this new anchor file,
with explicit UTF-8 decoding. Keep the exact key set, string-only values,
canonical relative paths and full Git OID requirements. No blanket receipt
parser rewrite, identity fallback or weaker custody is needed. This finding
was sent to Root before this documentation checkpoint; no repair was made in
this lane and no duplicate-key input was executed.

## Source-confirmed custody and usability conclusions

The separate data-manifest commit fixes the earlier caller limitation without
weakening compiled-source identity:

- `input_manifest_commit` is now a required loader argument. Its own
  `_GitSnapshot` validates the full OID and obtains that immutable manifest at
  its explicit canonical path. The assessment still must name the exact manifest
  SHA. The manifest still binds exact receipt bytes/SHA and actual artifact
  SHA/size, and the report independently binds the same receipt and producer
  tuple. No report or current geometry chooses its own caller anchors.
- Removing the *new* manifest path from mandatory *compiler* source keys is
  correct: the compiler inventory still requires actual C++ and CMake, and
  every recorded source is validated against its original compiled-source
  commit and Git blob/SHA. If the old inventory contains the original R4
  manifest or old observer, those records are still checked unchanged. A later
  dataset does not rewrite the old build record or pretend to be a compiler
  input. The executed observer has its separate reviewed commit/SHA as before.
- Build clean-state/same-sources/success/executable identity, acquisition-byte
  custody and executed package-version checks remain conjunctive and unchanged.
  This remains frozen completed-build provenance, not a fresh binary rehash or
  reproducible-build claim.
- Only the exact original Source0af/Hostbe24/acceptance7e triple receives default
  historical anchors. New wholes refuse absent anchors explicitly. Their
  supplied dictionary must have exactly nine string-valued keys, including
  the independent input-manifest commit; downstream OID/path validation still
  applies. A correctly reviewed future assessment can now bind its own receipt
  without requiring an unchanged C++ validator to be rebuilt.
- Provenance retains the independent manifest commit and manifest SHA. Complete
  file/mesh rosters and original F64/index/file binding are unchanged; no
  matching individual object can excuse a missing or failed batch member.
- The existing eighteen historical versus twenty-one new source-snapshot
  policies and acceptance-commit attribution of both new helpers are unchanged.
  The separate current verifier/launcher/anchor-file before/after custody still
  needs Root's complete packet; a JSON field named reviewed is not review proof.

No further confirmed custody weakening or future-whole schema blocker was found
in this bounded three-file delta. It does not mount or qualify the separate
finite-curve Native header or raw protocol.
