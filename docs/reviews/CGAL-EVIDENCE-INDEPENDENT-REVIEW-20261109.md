# Independent CGAL frozen-evidence intake source review

SOURCE REVIEW ONLY, 2026-11-09. No checker/producer imports, parsing, tests,
probes, compilation, Native/library/browser execution, artifact mutation or
live executable revalidation occurred. This note changes no acceptance criteria
or frozen report. Root owns subsequent integration and complete execution.

## Exact reviewed inputs

| Input | Git commit / path |
|---|---|
| New intake and contract | `23baf01e1be8289b3b31efe4be57b459029167ae`, `test/library-validation/cgal_evidence.py`, `test/library-validation/CGAL-EVIDENCE-CONTRACT.md` |
| Rational/sequence preflight | `b3b5381222f4978c919a245faa1446f1095bf85d`, `test/library-validation/cylindrical_surface_certificate.py` |
| Frozen evidence | `0523b3f6dff5d28d568490bba06fc4c55a148896`, `test/library-validation/evidence-r3/assessment/report.json` and its six archived per-object CGAL stdin/stdout/stderr folders |
| First build custody | Same evidence commit, `test/library-validation/evidence-first/build-custody.json` |
| Acquisition snapshot | Same evidence commit, `test/library-validation/acquisition-r1/acquisition.json` |
| Executed observer | `32700df4e38e34269a0a9892e00f0220f5daf0eb`, `test/library-validation/compare_actual.py` |
| Compiled source and input inventory | `829962e9ebcbe11be8b240008ba6be6340b5483f`, `test/library-validation/cgal/mesh_readonly.cpp`, `cgal/CMakeLists.txt`, and `test/selected-profile-extents-workflow/diagnostics-r4/INPUTS.json` |

Addresses below refer to those exact source objects. The six existing reports
are independent retained artifacts; this review does not rerun their binaries
or declare a new runtime PASS.

## Confirmed finding: private index rows are only shallowly read-only

`cgal_evidence.py:288–291` returns an ordinary dictionary for each completed
mesh row. The loader adds its artifact SHA/byte fields and puts that dictionary
into `index`. `_BoundCGALAssessment.__init__` at lines 299–302 wraps only the
outer `rows` dictionary in `MappingProxyType`; it does not freeze those values.
Consequently the private index still contains writable row dictionaries. The
assessment attributes are also ordinary replaceable instance attributes.

This is a source immutability limitation, not a demonstrated swapped-array
acceptance, a public input channel, or a Python security-boundary claim. The
supported `bind_mesh` API never accepts a caller validity flag; it recomputes
both original-array and exact-stdin hashes and checks the actual artifact
SHA/size before returning a flat read-only metadata mapping. Its normal public
return contains only immutable scalar values. There is no observed mutation
of the private index in the reviewed code.

Smallest remedy: after the loader has completed each row's artifact fields,
copy/freeze every row mapping before issuing the outer mapping. If the intended
contract also excludes accidental attribute replacement, expose read-only
properties over sealed storage. No new issuer framework or security sandbox
is needed. Keep the complete-batch issuance and per-call file/array binding.
Root should resolve this mismatch before describing the *private index* itself
as immutable; the existing contract's narrower immutable returned metadata is
accurate.

## Source-confirmed compatibility and custody conclusions

No additional concrete mismatch with the actual frozen R3 schema was found:

- Observer `compare_actual.py:401–413` encodes original binary64 coordinates as
  big-endian 16-hex bit strings, decimal face indices and LF; its raw hash uses
  little-endian F64 coordinates plus nonnegative 64-bit indices. Intake
  `_mesh_arrays` reproduces those encodings without coordinate conversion,
  reindexing or signed-zero loss. Signed versus unsigned index packing has
  identical bytes for the admitted nonnegative indices.
- Observer lines 454–465 derive each archive directory from the artifact stem
  plus the original mesh object ID. The intake uses that same rule. The private
  lookup key is `(artifact basename, object ID)`, so equal object IDs in different
  files do not collide. Receipt/manifest/report file rosters must agree, and
  each file's raw mesh-ID set must equal its complete assessment mesh set.
- The C++ source at lines 289–302 sorts component summaries by their smallest
  original face ID. Complete successful insertion preserves all original face
  IDs; the intake's sorted unique first-face IDs, first ID zero, matching
  component count and summed triangle census follow that actual producer.
  The strict component-detail bound rejects partial evidence rather than
  declaring an incomplete component inventory complete.
- Executed observer lines 208–367 reconcile the actual lib3mf model-resource
  and property-ID namespaces with XML identities, scene transforms, materials,
  triangle properties, unit and expanded metadata names/counts/string values.
  Its exact scoped metadata strings match the consumer and frozen report.
  Neither float32 positions nor the known mustPreserve limitation is promoted
  to binary64 geometry or roundtrip authority.
- The build custody source inventory belongs to `829962e9`; its recorded old
  observer is not the later executed observer. The intake correctly validates
  that original build inventory separately from the actual `32700df4` observer
  SHA in the R3 report. Acquisition bytes are bound to the completed-build
  record, and executed package versions are compared to that snapshot. This is
  frozen provenance, not a claim that a current working executable was rehashed.
- Receipt SHA/bytes and producer tuple, six actual artifact SHA/byte bindings,
  complete report roster, mesh array hashes, CGAL stdin hash, archived stdout
  equality, empty stderr and complete passing geometric checks are conjunctive.
  Omitting a batch member cannot be repaired by a matching individual mesh.
  Source intent, analytic coverage, deviation, instance-combined geometry and
  metadata preservation remain outside this intake's certification scope.

The reviewed source has explicit bounded file/object/array/report domains.
This review establishes no measured peak memory, latency or executable lifetime.
The schema parser's structural census happens after bounded JSON decoding; its
byte bound is not a measured peak-memory guarantee.

## Preflight precision/resource review

`b3b5381` checks concrete list/tuple type and count before iterating or copying
caller sequences, and validates selected face/vertex arities and integer
indices before set construction or rational conversion. It rejects generators
and arbitrary numeric types instead of consuming an unbounded stream. Selected
wall coordinates/support values are checked before `Fraction` construction.
The certificate remains a selected-surface proof; the bound whole-mesh intake
owns full raw-mesh identity and geometric-validity evidence.

The dyadic bound preserves all finite binary64 values. The smallest subnormal
has denominator `2^1074` (1075 denominator bits); the largest finite magnitude
is below `2^1024`. A difference of any two such values has magnitude below
`2^1025`; with denominator at most `2^1074`, its reduced numerator needs at most
2099 bits, within the 2100-bit limit. Signed permutations add no coefficient
rounding and retain this bound. Genuine finite float conversion remains exact;
there is no decimal rounding, float32 conversion or tolerance increase. Fraction
arithmetic identifies positive and negative zero geometrically; original IEEE
bit identity remains the separate raw-evidence hash obligation.

No precision-cutting defect was found for the stated original-F64 and exact
signed-permutation-difference domain. Arbitrary non-dyadic rationals and larger
integers are intentionally outside that finite intake, not invalid CAD designs.

## Remaining integration obligations

Root must bind the real caller's original object-local arrays before any local
frame/Fraction mapping, retain the exact evidence/observer/build anchors and
new helper source in transitive producer custody, and preserve independent
source/material/instance/deviation checks. New helper/source review alone does
not qualify the old failed surface checker or close broader Gate1 coverage.
