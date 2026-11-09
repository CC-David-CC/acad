# lib3mf 2.5.0 metadata QName review

Status: source-only diagnosis and comparison policy. No library imports/calls,
assessment/probe/test execution, artifact parsing, reader/product changes or
rewriting. Preserve the first and R2 complete batches unchanged. Package metadata
remains UNCERTAIN pending the next coherent actual batch; full shape/source
intent and surface deviation remain NOT_CERTIFIED.

## Exact inputs and observation boundary

- Review base `b6a530e0f8c2de828a022a58ba713e7c62c0125a`, including canonical
  `test/library-validation/evidence-r2/assessment/report.json`, blob
  `be3d6b9bedbf2afb1a4a98a9b10c8c00adf48130`, SHA256
  `a1cde5fb6d0141d60b9b1b2b49bee39b1bbca1f4709a11a1a68e56b0e010bfdc`.
- Actual executed R2 observer `2355b7c4fc7e1b09c79e51bb69237c233d710357`.
  Its final comparison reports `library metadata differs from raw package` on
  all six files, warnings `[]`; actual returned metadata was not retained.
  Earlier material/object/triangle/component/build/unit checks passed, as recorded
  in the R2 README. No omitted API row/value is claimed as an actual observation.
- Current observer blob `6255dcd5a7681dd23f36ef1b033e1f790939b92b` differs from
  that executed observer only by retaining `observed['metadata']` before the
  assertion. That observability source is UNRUN in R2.
- Actual exporter `web/app/cad/export/core3mf.mjs`, blob
  `debd2c36b338f779e54b565d7b4eefcf7e3cac93`, SHA256
  `d549c30b493868c87275edd6cdf653002182aa91b6fb808fffdb698574f613ed`;
  provenance leaf `controlledMesh3mfProvenance.mjs`, blob
  `d5b670fe84e735d3a1eb35c1a6bf2ae15d7c6ffd`, SHA256
  `6f5f9ded6fe2db8dad4ff4a99f191df6f1a1d94c3ac4870fd9b62d2c233779fe`.
- Exact upstream `v2.5.0` API and implementation, primary links below. This does
  not assume later master/WASM behavior or execute the downloaded binding.

## Confirmed reader comparison defect; exporter declaration is correct

`core3mf.mjs:163–164` emits `codi:SourceRevision` and, when captured provenance is
provided as in this actual corpus, `codi:ManufacturingBindings` as core
`<metadata>` elements, and declares on `<model>`:

```xml
xmlns:codi="https://ksu.codes/3mf/metadata/2026"
```

Core 1.3 defines metadata `name` as a QName and requires vendor-defined names to
use a prefix declared on the model. Unrecognized metadata may be ignored by
other consumers; that does not make it normative editable history. This exact
namespace declaration is appropriate; no exporter change is indicated by the
source finding. [Core 1.3, section3.4.1](https://3mf.io/wp-content/uploads/sites/106/2025/02/3MF_Core_Specification_v1.3.0.pdf)

The normal lib3mf root reader starts with metadata enabled. `ReadMetaDataNode`
splits the lexical key, resolves its prefix through `GetNamespaceURI`, and stores
the URI, local name and decoded value. Failure to resolve a prefix adds a warning/
exception; its fallback string is not a successful namespace resolution.
[Root reader, lines47–49 and139–175](https://raw.githubusercontent.com/3MFConsortium/lib3mf/v2.5.0/Source/Model/Reader/NMR_ModelReaderNode_ModelBase.cpp)

The API explicitly defines `GetNameSpace` as the namespace URL; `GetName` and
`GetValue` expose the stored local name/value separately. Thus the current
observer incorrectly constructs `URI + ':' + localName` and compares that with
raw lexical `prefix + ':' + localName`. For this source path it would compare
`https://ksu.codes/3mf/metadata/2026:SourceRevision` against
`codi:SourceRevision`. This is a source-proven invalid predicate, not a measured
R2 tuple. Do not fix it by stripping prefixes, hardcoding codi, or changing the
archive. [Exact API, MetaData class](https://raw.githubusercontent.com/3MFConsortium/lib3mf/v2.5.0/AutomaticComponentToolkit/lib3mf.xml)

## Exact unprefixed/unknown/default behavior

| Case | lib3mf2.5 source behavior | Reader policy |
|---|---|---|
| Declared prefix in metadata name | Resolves prefix to URI, then retains URI/local/value | Compare expanded-name tuple, retaining lexical spelling separately |
| Unrecognized but valid declared namespace | No namespace whitelist in this metadata path; nonempty local name admitted | Do not drop app-private records; require actual retention/count/value for this assessment |
| Undeclared prefix | Warning/exception and fallback namespace string | Keep UNCERTAIN/FAIL; never bless the fallback as a URI |
| No prefix, standard name | Stored namespace is `""`, not the model element's default core namespace | Compare `("", localName, value)` |
| No prefix, other name | `UNKNOWNMETADATA` warning/exception; not added normally | Preserve diagnosis; do not auto-qualify or attach default core URI |
| Empty name | Invalid metadata warning | Explicit invalid/uncertain result |
| Absent type | Parser initializes `"xs:string"` | Retain raw presence and this API default; no numeric/JSON coercion |
| Absent preserve | Parser initializes `true` | Record actual API value separately from normative raw default; see limitation below |

The accepted unprefixed names are exactly `Title`, `Designer`, `Description`,
`Copyright`, `LicenseTerms`, `Rating`, `CreationDate`, `ModificationDate`,
`Application`. The model element's default XML namespace must **not** be applied
to these well-known metadata keys. This is the explicit lib3mf/core metadata
convention, not a generic claim about every XML QName-bearing attribute.
[Metadata validation, lines113–127](https://raw.githubusercontent.com/3MFConsortium/lib3mf/v2.5.0/Source/Model/Classes/NMR_ModelMetaData.cpp),
[constants, lines98–106](https://raw.githubusercontent.com/3MFConsortium/lib3mf/v2.5.0/Include/Model/Classes/NMR_ModelConstants.h)

The metadata parser initializes `type="xs:string"`, `preserve=true`, and changes
preserve by the literal test `attributeValue != "0"`. Therefore its absent
preserve default, and its treatment of explicit `"false"`, diverge from the
Core1.3 boolean/default semantics (false when absent). This is a confirmed
**library-source fidelity limitation**, not an observed R2 API value or an
exporter defect. The controlled exporter omits type/preserve and makes no
foreign round-trip preservation claim. Do not change its flags merely to make a
library assertion pass. [Parser, lines38–66](https://raw.githubusercontent.com/3MFConsortium/lib3mf/v2.5.0/Source/Model/Reader/v100/NMR_ModelReaderNode100_MetaData.cpp)

For any added default/type/preserve observations, expose raw attributes,
normative defaults and actual API values as distinct fields. A correct name/value
reconciliation may pass without claiming that preserve or arbitrary XSD type
validation was tested. If preservation semantics are included in the assessed
scope, record the source limitation as UNSUPPORTED/UNCERTAIN; do not silently
redefine the standard's default to true. No preservation round trip occurred.

## Generic exact comparison policy

1. Retain the **in-scope namespace map at each metadata element** while parsing
   bounded XML (start-ns/start/end scope stack). ElementTree's ordinary `.attrib`
   does not retain xmlns declarations or expand a QName stored in an attribute
   value. Preserve lexical name, scope/model part and namespace bindings as
   evidence. Do not use regex text stripping or a global final prefix dictionary.
2. Parse each admitted lexical name as a well-formed QName. For a prefixed name,
   require exactly one valid declared prefix/local pair and resolve its URI.
   Undeclared, empty or malformed names refuse. For an unprefixed name, apply
   the standard metadata convention above, requiring an admitted standard name
   and using empty namespace. Preserve exact URI/local case and Unicode; do not
   normalize URLs or use prefix spelling as semantic identity.
3. Compare exact `(namespaceURI, localName, decodedStringValue)` API and raw
   tuples, with exact scope/count/multiplicity. Reject duplicate expanded names,
   unknown extras, missing records or changed values. Do not concatenate URI
   and name into a colon-delimited key; URIs contain colons themselves. Existing
   lexical names stay in observations. Preserve strict XML/text grammar and
   explicit resource/depth/namespace/metadata bounds; overflow is not truncation
   into a successful census.
4. Keep original decoded content as a string. The existing exact SourceRevision
   and ManufacturingBindings/source/resource/material correspondence checks
   remain required; JSON semantic validation is additional and must not replace
   the metadata value equality. Retain original archive/array/source hashes and
   all already-passing core package checks.
5. Capture each actual API tuple and raw expanded tuple **before assertions**,
   with any type/preserve observations clearly labeled by scope/limitations.
   The next complete six-file run goes to a new directory, preserving first/R2.
   A normal qualified read should not omit these two records in the reviewed
   source path; missing output cannot be excused merely because the general
   standard allows other consumers to ignore private metadata.

## Responsibilities kept separate

Normative core 3MF resources, object/triangle material assignments, component/
build relationships and units describe the exported printable payload. Our
app-private metadata carries additional snapshot provenance. Its source module
explicitly keeps authoritative editable history in native CAD; it is not a second
feature document or an importable reconstruction of history.

For this handoff, private does not mean optional to the acceptance proof:
SourceRevision must still match the actual accepted export revision, and the
decoded binding data must still cross-bind exact part/region/body/producer/build/
material identities to the actual core resources. Other applications need not
understand those app-local identities or preserve them when saving. No conformance
or full native-history interchange claim follows from their presence.

This diagnosis calls for a **reader-only expanded-QName reconciliation**. It
identifies no export namespace defect and requests no production/Native/material/
archive/default change. Even if the next actual metadata content comparison
passes, the independent finite surface/design proof remains OPEN.
