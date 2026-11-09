# CGAL/cylindrical evidence caller integration review

SOURCE ONLY / UNRUN. Reviewed exact `11e25b2a9ef55aa1399011556cc4aa99cc69105d`
against parent `420ea4ef8a92ec1208aa2852e1e876ed29d760c1`, together with
its existing `cgal_evidence.py` and `cylindrical_surface_certificate.py`.
No imports, parsers, tests, probes, builds, Native/library/browser execution,
root changes or frozen producer/evidence edits occurred. This is a bounded
follow-up to `CGAL-EVIDENCE-INDEPENDENT-REVIEW-20261109.md`.

## Confirmed caller limitation: future whole needs its own bound assessment

`check.py:25–30` fixes evidence, observer and compiled-source anchors to the
historical R4 assessment. At lines 211–219 the roster permits both the exact old
R4 producer tuple and a new whole with 21 source snapshots, but the subsequent
`load_cgal_evidence` call unconditionally passes that same old evidence and its
old `diagnostics-r4/INPUTS.json` with the supplied whole receipt bytes.

The loader checks that receipt against the manifest record and embedded report
SHA before geometric binding (`cgal_evidence.py:416–427`). A new whole containing
the additional snapshot records or a changed acceptance tuple necessarily has
different receipt bytes, so the new-whole path cannot complete with these fixed
historical anchors. This is an incomplete integration path, not an erroneous
historical-evidence rejection or a demonstrated runtime incident. The current
full packet is explicitly NOT READY; no qualification is inferred.

Keep the exact historical R4 branch and evidence intact. Before a new whole can
be checked, obtain and pin a separately reviewed completed assessment and input
inventory bound to that *actual new receipt*, with matching executed observer /
build custody, then pass those independent caller anchors. Do not relax the
receipt SHA or reuse the old reports as proof of a new browser/export batch.
If this staged caller is intentionally historical-only, make that limitation
explicit and retain new-whole assessment selection as a required next seam.

## Confirmed preserved integration behavior

- Historical identity is the exact triple Source
  `0afb07fe8e216ba9a03cf21923e0ab70aed72546`, Host
  `be24fbc232c967912f529053d34a9d407b369a39`, acceptance
  `7e1e2b6d8eafac4411f1cc63d5b5dc67c5de994a`. Its twelve workflow-local files
  plus four Core runtime/archive helpers and two Desktop helpers total eighteen.
  They match the actual `0523b3f6` retained
  `test/selected-profile-extents-workflow/evidence-r4/whole/receipt.json`
  sourceSnapshot roster and the original acceptance driver. In particular it
  does not retroactively claim `reader-offline.cjs` executed in that browser run.
- The new driver roster has thirteen workflow-local files, the same six other
  retained helpers, plus `cgal_evidence.py` and
  `cylindrical_surface_certificate.py`: twenty-one. Both added helpers are
  assigned the new acceptance commit in the driver and checker. Their source
  snapshots and Git blob checks remain exact. Separate *current post-whole*
  checker custody is still an explicitly pending integration obligation; the
  old snapshots are not renamed to imply the corrected checker executed then.
- The intake fix copies and wraps every completed private mesh row and copies
  provenance before issuance. Its slot-backed normal attribute assignment is
  rejected. The prior mutable nested-row alias is removed; returned evidence
  remains flat read-only metadata. This is ordinary immutable data custody,
  not a Python security-sandbox assertion.
- `check.py:200` supplies original decoded F64 world coordinates, original
  integer triangle IDs, exact object ID and actual artifact path to
  `bind_mesh` **before** invoking `inspect_mesh` or any frame conversion.
  The binder independently verifies exact array/stdin hashes and artifact
  SHA/bytes. No local/Fraction array is substituted for the original object.
- `mesh_oracle.py:51–57` admits the existing exact orthonormal signed-permutation
  frame and additionally proves right-handedness. It computes each subtraction
  and axis application as `Fraction(original_float)` arithmetic before any
  float conversion. `local_exact` reaches the cylindrical certificate; the
  float view remains for retained classification/diagnostics. Thus the new
  exact path does not encode a prior rounded world-minus-origin subtraction.
- Each triangle goes through the same planar-side/cap/blind-floor classification
  or exactly one cylindrical candidate. Only the latter appends its original
  face ID once to that cylinder's `wall_faces` list. Every declared cylinder
  receives a certificate; missing wall IDs refuse rather than becoming empty
  successful evidence. All triangle labels still feed the full indexed edge,
  vertex-link, connected-shell, rim, patch-roster, Euler and volume checks.
- The deleted wall-only logic required exactly two distinct XY coordinates per
  triangle and tiled each straight-generator rectangle. Its replacement is the
  full exact annular radial-projection certificate over all assigned original
  triangles. The unrelated planar `disjoint_triangles` calls remain. The
  source/material/resource associations, cap and blind-floor domain tests,
  actual rim/chord/winding checks, global volume allowance and genus checks
  remain. No physical or mesh tolerance was raised by this delta.
- STEP and SVG oracle modules and native archive reader are unchanged by the
  commit. The caller still checks archive/native/source equations, real
  manufacturing resource/material associations, all fourteen export artifacts,
  issued source revisions, actual saved/opened history and the separate STEP
  reader receipt/source SDK binding. Generic CGAL geometry is added, not used
  as a substitute for source intent, material, placement or analytic coverage.

No further confirmed integration defect was found in this bounded delta.
Planar wrapper, current verifier custody, launcher and negative controls remain
explicitly pending. The raw finite-curve Native header/protocol are separate,
uncompiled/unmounted work and supply no authority to this mesh-evidence path.
