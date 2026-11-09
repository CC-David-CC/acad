# Bound CGAL assessment evidence consumer

Source-only / UNRUN. `cgal_evidence.py` is a new offline after-whole intake;
no existing checker, Root source, runtime, artifact or frozen evidence was edited.
No imports, parser runs, tests, builds, library/Native/browser calls were executed
by this lane. Root owns composition, producer rosters and complete execution.

## Authority chain and API

Only `load_cgal_evidence(...)` issues the private detached assessment index.
The caller supplies full **reviewed Git commit/path anchors**, never values
selected by an assessment, current document, public flag or arbitrary valid bit.
The loader performs bounded read-only local Git blob reads; it never fetches,
builds, reruns tools, writes files or loads lib3mf/Trimesh/CGAL.

```python
bound = load_cgal_evidence(
    repository,
    evidence_commit=reviewed_evidence_commit,
    report_path=reviewed_report_path,
    build_custody_path=reviewed_build_record_path,
    acquisition_path=reviewed_acquisition_record_path,
    observer_commit=reviewed_executed_observer_commit,
    build_source_commit=reviewed_compiled_source_commit,
    input_manifest_commit=reviewed_input_manifest_commit,
    input_manifest_path=reviewed_input_manifest_path,
    executable_key=reviewed_build_artifact_key,
    receipt_bytes=original_immutable_whole_receipt_bytes,
)
evidence = bound.bind_mesh(actual_3mf_path, original_object_id,
                           original_raw_float64_vertices, original_integer_faces)
```

`bind_mesh` must receive the ORIGINAL object-local arrays decoded from the actual
3MF, BEFORE any source-frame conversion or Fraction arithmetic. Coordinates must
be genuine finite Python floats, not Float32, fitted/reconstructed points or
coerced arbitrary numerics. Faces are original zero-based integers, no booleans,
sorting, welding or reindexing. All validation precedes hashing/materialization.
The return is bounded immutable metadata, not geometry; use `dict(evidence)` if
an outer receipt needs JSON. There is no whole-part qualified flag.

Root's concrete current anchors (usage data only; NO example-name/dimension
branch exists in the helper):

| Argument | Current actual value |
|---|---|
| evidence_commit | `0523b3f6dff5d28d568490bba06fc4c55a148896` |
| report_path | `test/library-validation/evidence-r3/assessment/report.json` |
| build_custody_path | `test/library-validation/evidence-first/build-custody.json` |
| acquisition_path | `test/library-validation/acquisition-r1/acquisition.json` |
| observer_commit | `32700df4e38e34269a0a9892e00f0220f5daf0eb` |
| build_source_commit | `829962e9ebcbe11be8b240008ba6be6340b5483f` |
| input_manifest_commit | `829962e9ebcbe11be8b240008ba6be6340b5483f` for this original R4 manifest; later data is independently pinned |
| input_manifest_path | `test/selected-profile-extents-workflow/diagnostics-r4/INPUTS.json` |
| executable_key | `cgal-build-r2/codi-cgal-readonly-mesh` |

The raw file roster is derived from the bound whole receipt's actual 3MF export
entries; it is not fixed to six files, a plate dimension, object2 or one material.
Every listed file and every raw mesh resource must have passing complete evidence
before the loader returns. A matching individual mesh cannot bypass a failed or
omitted member of that assessed batch.

## What is checked

1. Canonical report/build/acquisition bytes come from the reviewed evidence Git
   commit. Build sourceCommit must match the separately supplied reviewed source
   commit, clean-state record and successful same-sources corrected build.
   Every source inventory record is checked against its Git blob/SHA256, including
   actual C++/CMake and all recorded build sources. The assessed data manifest
   has its own explicit Git commit; later datasets do not require an unchanged
   C++ validator to be rebuilt or the old build record to be rewritten. The executed observer SHA is checked
   against the separate reviewed observer Git commit, rather than assuming the
   first build's old observer is the later R3 observer.
2. Report executableSHA must equal the actual selected completed-build artifact
   record; acquisition bytes match build custody, and executed package versions
   match acquisition. This is frozen provenance. It is NOT a new live executable
   rehash, reproducible-build assertion, dependency reinstallation or rerun. Root
   expressly approved the frozen custody chain; a working binary need not enter
   Git. Existing first build/configuration failures stay preserved.
3. Exact original whole receipt SHA/byte count matches the pinned input manifest
   and report, producing source/Host/acceptance/engine tuple matches, and the whole
   is PASS with contexts retired and source pins unchanged. Every actual 3MF
   basename/SHA/size matches receipt, manifest and complete report roster.
4. All raw indexed topology results pass: no bad edges/links/orphans, opposite
   edge-use count and exact Euler census. These scans are bound to the reviewed
   observer and original array hashes, not an unbound assertion. Trimesh must have
   watertight/consistent winding, unchanged original arrays, matching Euler and
   component counts, finite ordered bounds and positive finite numerical volume.
5. CGAL must have exit0, exact reviewed protocol/limits, complete exact input
   counts, complete zero-degenerate and zero-insertion scans, valid triangular
   closed graph, complete matching component summaries, complete zero intersection
   census and successful volume-boundary check. NOT_RUN/overflow/unknown/partial
   outcomes cannot become a pass. Original firstFaceIds and face counts remain
   bound; multiple components are not silently merged into one.
6. The actual archived CGAL stdin/stdout/stderr Git blobs are read under their
   source-defined per-file/object paths. Input SHA must match, stdout JSON must
   equal the embedded report, stderr must be empty. At `bind_mesh`, SHA256 is
   independently recomputed over F64LE coordinates plus unsigned64LE indices and
   the EXACT original stdin encoding (16-hex IEEE754 patterns, decimal indices,
   original order and LF). Signed-zero bits are preserved. A current artifact
   is streamed and hashed to require the original SHA/size. No archive geometry
   is substituted from the report.
7. Lib3mf must have scoped material/scene/unit/exact-expanded-metadata-content
   PASS, no strict-reader warnings, and actual Float32 conversion observations.
   This versioned intake deliberately requires the reviewed 2.5 profile and its
   explicit known preserve limitation. Float32 positions and mustPreserve are
   excluded from geometric/preservation authority. Neither private metadata nor
   raw topology becomes native editable history.

The output retains receipt/report/build/acquisition/observer/C++/CMake/executable
and input-manifest hashes, full source commits/producer tuple, actual artifact/
object/array/stdin/stdout hashes, counts/components/Euler and precise check scope.
Source intent, analytic wall/cap coverage, surface deviation and combined-instance
geometry always remain NOT_CERTIFIED here. Root must supply those independent
proofs and printed-instance/material/source ownership checks separately.

## Bounds, failure semantics and integration obligations

Current reviewed observer/CGAL profile: 150000 vertices, 100000 triangles,
8MiB decoded-array charge, 16MiB report/CGAL-text bounds, 64KiB CGAL output,
128 detailed component rows. The loader caps a complete batch at32 files,
512 raw objects/file and1024 mesh records; this is a finite evidence intake
domain, not a new CAD export capability. Missing/oversized evidence refuses
without truncation. Receipt/artifact bytes retain the existing128MiB limit;
strict JSON refuses duplicate keys, nonfinite numbers and excessive structure.
No geometry tolerance or quota changes.

`EvidenceRefusal` means unusable/unbound/nonpassing evidence, not an impossible
design. `EvidenceResourceLimit` distinguishes an intake bound. Local Git/read
failures, unsupported profile/schema, nonpassing batch members or altered files
must not be caught and replaced with an assumed valid flag. No repair/retry or
forced context cleanup occurs. This is an offline consumer, not a Python security
sandbox or new service capability; its source and caller anchors require Root
review like other oracle code.

Root owns actual `mesh_oracle.py`/`check.py` callsites and transitive producer
rosters. Add this NEW helper's exact Git blob/source hash to their before/after
custody and pin the caller's evidence/observer/build anchors. Invoke intake once
per complete immutable receipt and bind each actual raw object before local-frame
mapping; do not pass already rounded local coordinates or a boolean in its place.
Rehashing/JSON/library-resource costs remain unmeasured until Root's complete run;
no timing, peak-memory or current-binary lifetime claim is made. No original
failed report/checker or producing acceptance source is rewritten by this packet.
