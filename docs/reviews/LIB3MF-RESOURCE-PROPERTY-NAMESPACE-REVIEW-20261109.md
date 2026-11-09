# lib3mf 2.5.0 resource/property namespace review

Status: source-only diagnosis and generic reader recommendation, not an export
defect or a successful new library assessment. No imports, Native/library calls,
assessment execution, adapter/product edits or artifact rewriting were performed.
The first six-file assessment stays immutable and UNCERTAIN for package semantics.
Full source intent and surface deviation remain NOT_CERTIFIED.

## Exact reviewed inputs

- Core `829962e9ebcbe11be8b240008ba6be6340b5483f`;
  `test/library-validation/compare_actual.py` blob
  `ae5c6aa6efa88c4eb81f4aebf72a8bedcc96361e`.
- R730 environment `/mnt/data10tb/codi-acad-library-validation-native-20261109-r1`.
  Its `assessment-first/report.json` SHA256 is
  `e293f26ece3dcbc822a0000b39d58e1be988602f1f02ed961c7a664f4ef008ef`.
  The first record reports library version `[2,5,0]`, UNCERTAIN,
  `ValueError('library material assignment differs')`, line182, warnings `[]`.
  The returned property tuple was not retained before that assertion; do not
  invent its measured values or claim the next corrected batch already passes.
- Installed generated Python source read as text only:
  `venv/lib/python3.12/site-packages/lib3mf/Lib3MF.py`, SHA256
  `439254b0d31e787218abedb309adb2cdeb93d96d653504e01f92b105dccb1d8d`.
  Retained `lib3mf.so` SHA256
  `6d2905faee1960a5f4a40032c73139696c64f63fee3230c279ed1e4086e97ac3`.
  Package acquisition/build custody remains Root's existing record.
- Upstream primary source inspected at the explicit `v2.5.0` tag, linked below.
  No later master/WASM API is substituted.

## Confirmed namespace mismatches

There are **two independent translations**, not one numeric resource ID:

| Value | Namespace | Correct reconciliation |
|---|---|---|
| XML `object/@id`, `basematerials/@id`, `pid`, component/build `objectid` | Model-local resource ID, within its actual model package part | `(packagePart, GetModelResourceID())` |
| API `GetResourceID()` / `GetUniqueResourceID()` | Package-unique resource ID | Resolve through actual enumerated resource, retain its package part/model ID |
| XML `pindex`, triangle `p1/p2/p3` | Zero-based index within the referenced resource | Resolve through that group's actual ordered index-to-property map |
| API ObjectLevelProperty `PropertyID`, triangle `PropertyIDs`, BaseMaterialGroup getter argument | Internal material PropertyID | Actual `GetAllPropertyIDs()[xmlIndex]`, never arithmetic or a name match |

`CResource::GetResourceID` and `GetUniqueResourceID` both call `getUniqueID`;
`GetModelResourceID` separately returns the model-local ID. A bare API ID is
therefore not generally equal to the XML integer. [Exact resource implementation,
lines66–91](https://raw.githubusercontent.com/3MFConsortium/lib3mf/v2.5.0/Source/API/lib3mf_resource.cpp)

The observed comparison at `compare_actual.py:181–183` names its outputs
`pid,index,has_prop`, then compares them directly to XML `pid,pindex`. The Python
binding actually returns `(UniqueResourceID, PropertyID, HasObjectLevelProperty)`;
its tuple order is correct, but the second value is **not an XML index**. The
native getter returns stored `m_nUniqueResourceID` and `m_nPropertyIDs[0]`.
[Mesh getter implementation, lines187–197](https://raw.githubusercontent.com/3MFConsortium/lib3mf/v2.5.0/Source/API/lib3mf_meshobject.cpp)

The object reader resolves the XML property resource in the current model path,
then calls `mapResourceIndexToPropertyID(pindex)` before storing the default.
It stores the resource's package-unique ID alongside that translated PropertyID.
Thus numeric equality to the original XML tuple is an invalid predicate even
when a package's resource IDs happen to coincide. [Object reader,
lines317–354](https://raw.githubusercontent.com/3MFConsortium/lib3mf/v2.5.0/Source/Model/Reader/v100/NMR_ModelReaderNode100_Object.cpp)

For an untouched newly-read base-material resource specifically, internal
PropertyIDs start at1. The resource builds its index map from those actual IDs.
Therefore XML first-base index0 maps to internal PropertyID1 in this source
path. This is a source-derived explanation for the current assertion, not a
measurement of the omitted tuple and not permission to implement `index+1`.
[Material resource, lines36–56 and94–105](https://raw.githubusercontent.com/3MFConsortium/lib3mf/v2.5.0/Source/Model/Classes/NMR_ModelBaseMaterials.cpp)

## Adjacent predicates needing the same coherent correction

The first assertion prevents later checks from running. Source review confirms
these additional namespace errors in the same reader; they are not additional
observed runtime failures:

| compare_actual.py | Current assumption | Required correction |
|---|---|---|
| 173–175,217 | `GetResourceID()` indexes raw model-local objects/set | Resolve actual package part + model ID; retain unique ID separately |
| 181–183,199–201 | Returned PropertyID is raw `pindex`; has_prop not asserted | Compare exact presence plus both translated IDs; name output `propertyId`, not `propertyIndex` |
| 192–198 | Triangle `ResourceID/PropertyIDs` equal XML `pid/p1/p2/p3` | Resolve resource identity and each effective XML index through its actual property map |
| 210 | Component resource's package-unique ID equals raw `objectid` | Resolve returned resource handle to model part/model ID |
| 222–227 | Build `GetObjectResourceID()` equals raw `objectid` | Resolve its actual object/resource identity before comparison |
| 231 | `GetBaseMaterialGroupByID(rawModelId)` uses XML namespace | Pass enumerated group unique ID, or keep the actual group handle |
| 233,237 | `GetName(i)` and `GetDisplayColor(i)` accept a positional index | Pass actual `GetAllPropertyIDs()[i]` |

`GetBaseMaterialGroupByID` resolves a **unique** resource ID, not a model ID.
[Model implementation, lines258–270](https://raw.githubusercontent.com/3MFConsortium/lib3mf/v2.5.0/Source/API/lib3mf_model.cpp)
Build/component resource-ID getters likewise return unique IDs.
[Build getter, lines78–80](https://raw.githubusercontent.com/3MFConsortium/lib3mf/v2.5.0/Source/API/lib3mf_builditem.cpp),
[component getter, lines58–60](https://raw.githubusercontent.com/3MFConsortium/lib3mf/v2.5.0/Source/API/lib3mf_component.cpp)

BaseMaterialGroup name/color getters take a PropertyID. Its `GetAllPropertyIDs`
enumerates the actual map by resource index; this is the supported bridge, and
the installed Python wrapper returns that list directly. [Material API,
lines65–109](https://raw.githubusercontent.com/3MFConsortium/lib3mf/v2.5.0/Source/API/lib3mf_basematerialgroup.cpp)
The XML base reader adds each encountered child to the group in order.
[Base-material reader, lines85–97](https://raw.githubusercontent.com/3MFConsortium/lib3mf/v2.5.0/Source/Model/Reader/v100/NMR_ModelReaderNode100_BaseMaterials.cpp)

## Inheritance and normalization

Do not compare only material names/colors or assume that a populated per-triangle
API row implies explicit XML attributes. The triangle reader starts from the
object defaults, resolves effective per-corner indices to PropertyIDs and stores
the effective resource unique ID. The API returns those resolved values.
[Triangle reader, lines111–139](https://raw.githubusercontent.com/3MFConsortium/lib3mf/v2.5.0/Source/Model/Reader/v100/NMR_ModelReaderNode100_Triangles.cpp)

For the actual controlled files, reconcile each unoverridden triangle against
the translated actual object default. For supported explicit triangle overrides,
retain exact raw attribute presence and implement the documented/core inheritance
rules, then translate the resulting indices. Missing `p2/p3` inherit `p1` in the
reviewed triangle parser. Strict warnings and unsupported/invalid combinations
remain explicit; do not normalize malformed fields into a convenient success.
[Triangle property parser, lines75–100](https://raw.githubusercontent.com/3MFConsortium/lib3mf/v2.5.0/Source/Model/Reader/v100/NMR_ModelReaderNode100_Triangle.cpp)

Raw capture currently defaults absent object fields to0 and discards their
presence. Preserve `hasPid/hasPindex` (and raw triangle attribute presence) in a
reader correction. Compare `has_prop` according to the admitted XML/default
semantics. Do not treat an absent binding as the first property of resource0;
the getter's output-ID slots have no binding meaning when `has_prop` is false.
Any broader optional-field form not yet reconciled stays UNSUPPORTED/UNCERTAIN.

## Recommended bounded generic reconciliation

1. Enumerate actual resources before assertions. Build a bijection from each
   package-unique ID to `(absolute package part path, model-local resource ID,
   actual resource type/handle)`. Preserve all namespaces in bounded report rows.
   Duplicate/unknown/extra resources or unresolved references refuse the
   reconciliation. Match each raw model by its exact package part; do not flatten
   external/submodel resources. The current raw parser only covers the one
   admitted model part, so a multi-model input must remain explicitly unsupported
   until that parser actually inventories it.
2. For each actual base-material group, use its model-local key to match the raw
   group. Obtain `GetAllPropertyIDs()`, require exact count/unique IDs, and retain
   the positional XML-index→PropertyID map. Read each name/color by that actual
   PropertyID and compare to the corresponding raw child, preserving order and
   alpha. No `+1`, sorted-name inference or nearest/identical-color remapping.
3. Resolve object-level and effective triangle references through both maps.
   Compare exact raw presence, actual resource/part, effective index and decoded
   material assignment, while retaining the API unique/PropertyID tuple. Keep
   original triangle order/indices and Float32-conversion checks unchanged.
4. Resolve component/build identities through their actual returned resources;
   preserve transform, counts, iteration/instance order, metadata and resource
   rosters. Keep the separate Float64 raw geometry authority and all strict
   reader/warning policies. A namespace translation is not a waiver for a real
   wrong material, extra object, source revision, count or placement.
5. Record each relevant observation **before** asserting it: object unique/model
   IDs and part, returned property tuple, expected XML tuple, translated tuple,
   actual ordered group PropertyIDs and raw material child indices. Report a
   bounded first mismatch plus total/census completeness; never silently drop
   unknown IDs or overrun existing resource/diagnostic limits.
6. Root can then freeze one coherent reader correction and run the same complete
   six-file batch to a NEW assessment directory, retaining the first report and
   all original archive/array/source hashes. Do not announce package PASS from
   this source diagnosis, and do not modify exporter output to fit an incorrect
   comparison. Validity and source/full-surface accuracy remain separate.

This recommends a reader-only reconciliation, with no production/schema/Native
pair/default/material/persistence change. Generic namespaces apply beyond this
six-file example; the explanation does not turn the single current material or
sequential IDs into an acceptance special case.
