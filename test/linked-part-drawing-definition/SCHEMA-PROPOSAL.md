# E22 drawing definition and operation preparation — schema review

Implemented metadata admission/preparation only, following root schema review of `141bc1859` with the view/axis corrections below. CAD inspection base `7b688c88d3608f177172ee551a391ca2ce566332`; follows workflow contract `2d15b35a2`. This slice cannot attest geometry, source membership, current targets, measured values, native reference survival, available builds, publication, persistence or Undo/Redo.

## Owned new files

- `modules/drawing/linkedPartDrawingDefinition.mjs` and `.d.mts`: constants, exact typed definition capture.
- `modules/drawing/linkedPartDrawingOperation.mjs` and `.d.mts`: revision-bound metadata preparation and one proposed shared-journal record capture.
- `test/linked-part-drawing-definition/`: synthetic metadata fixtures, boundary/failure tests, source pins and scope notes.

No Craft/projectManager/authoredEditJournal/common Worker/native/Desktop files change. All actual hole witnesses, reference discovery, shared journal dispatch and native adapter persistence remain OPEN. The operation record is a proposed entry for later integration, not a new journal implementation.

## Capture rules and bounds

Every record has EXACT listed fields, an Object/null prototype, enumerable own data descriptors only, and no symbols, accessors, functions or extra fields. Arrays are dense bounded own-data arrays without custom properties. Capture reads descriptors, creates detached deeply frozen data, and serializes only that detached admitted schema. Nested prototypes and cycles do not become hidden serialized state. Reject nonfinite values and unsafe numeric identities. Preserve opaque identity strings exactly; no region/selection parsing or ID construction.

Each definition and each public preparation request is independently bounded to65536 UTF-8 bytes of canonical admitted JSON. Expose both limits; wrapper bytes count, so a maximal standalone definition may require reducing metadata before it fits a public request. Per-field maxima are not a promise that every maximum can be combined. Bound strings/counts BEFORE serialization. Definitions have at most16 dimensions and1..3 views. No arbitrary recursive metadata or extension bag.

Authored drawing/view/dimension IDs: nonempty strings≤128 UTF-16 code units, no control characters. They are supplied by the later trusted caller/allocator; drawingId is immutable within replacement. View/dimension IDs remain stable labels while explicit complete replacement may add/remove definitions. This module allocates no feature IDs. Source face/curve IDs≤256, opaque region IDs≤8192, native selection IDs≤16384; all nonempty and no control characters, otherwise preserved verbatim. Feature IDs are safe positive integers. Build is exactly `sha256:<64 lowercase hex>:<64 lowercase hex>`. Revisions are opaque nonempty strings≤256, not parsed as numeric counters.

Finite physical sheet dimensions: `(0,10000]` millimeters. Scale numerator/denominator: safe integers1..10000, coprime (reject rather than silently rewrite a noncanonical fraction). All paper placements are `[x,y]` in the closed physical sheet bounds. This is layout admission, not assurance projected geometry fits the sheet. Title≤256 code units, permits empty; no control characters. Numeric negative-zero paper coordinates are rejected to avoid JSON losing admitted distinctions; no geometry coordinates are present.

## Exact definition

```ts
type Drawing = {
 version: 1; unit: 'millimeter'; drawingId: Id; title: string;
 target: {featureId: FeatureId; operationType: Id;
   engine: 'occ'; engineRevision: Build;
   output: 'complete-native-result'};
 datum: {featureId: FeatureId; faceId: SourceId; regionId: RegionId};
 sheet: {width: number; height: number;
   scale: {numerator: number; denominator: number}};
 views: View[]; // 1..3, unique bases in top/front/right subsequence order
 dimensions: Dimension[]; // 0..16 while authoring; complete export policy later
};
type View = {viewId: Id; basis: 'top'|'front'|'right';
 paperOrigin: [number,number]; visibility: 'visible-and-hidden'};
```

The entries have distinct viewIds and named bases in canonical top/front/right subsequence order. The actual full-workflow acceptance still requires all3 views. This fixed first-stage convention avoids unimplemented arbitrary view frames. DimensionIds are distinct; each viewId must name an admitted view. Drawing/view/dimension identity namespaces are separate. Target operationType is bounded opaque metadata, NOT proof of registration. Runtime and producing feature must later match the actual complete current output. No bodyId is saved because output identity is reconstructed from the fixed producing feature; the public service still resolves a current body during admission.

Top basis sourceX/sourceY/+sourceZ, front sourceX/sourceZ/−sourceY, right sourceY/sourceZ/+sourceX, camera from+n, third-angle placement policy comes from the workflow contract. No frame or vectors are stored here.

## Reference variants and dimensions

```ts
type SourcePoint = {kind:'source-point'; featureId:FeatureId;
 faceId:SourceId; regionId:RegionId; curveId:SourceId;
 curveType:'segment'|'circle'; point:'a'|'b'|'center'};
// segment admits a/b only; circle admits center only.
// All source fields must equal drawing.datum except curveId/curveType/point.

type NativeFace = {kind:'native-face'; originFeatureId:FeatureId;
 selectionId:SelectionId; geometry:'plane'};
type NativeEdge = {kind:'native-edge'; originFeatureId:FeatureId;
 selectionId:SelectionId; geometry:'line'};
type CenterHole = {kind:'center-hole'; featureId:FeatureId;
 sourceFeatureId:FeatureId; faceId:SourceId; regionId:RegionId;
 slot:'center'; geometry:'cylinder'};
// Hole feature differs from sourceFeatureId. Source fields equal datum.

type Common = {dimensionId:Id; viewId:Id; label:[number,number]};
type Dimension =
 | Common & {kind:'source-distance'; axis:'datum-x'|'datum-y';
     from:SourcePoint; to:SourcePoint}
 | Common & {kind:'plane-distance'; axis:'datum-normal';
     first:NativeFace; second:NativeFace}
 | Common & {kind:'edge-length'; edge:NativeEdge}
 | Common & {kind:'hole-diameter'; hole:CenterHole}
 | Common & {kind:'hole-offset'; axis:'datum-x'|'datum-y'; hole:CenterHole};
```

Source-distance means the absolute component of the two solved source points along the declared datum axis. Hole-offset means the signed native hole-axis/datum-plane intersection component from the datum origin along that axis. These are source datum axes, never ambiguous view-u/v coordinates. Datum-x components admit top/front; datum-y admit top/right. Datum-normal cap separation admits front/right, not top where the thickness is not visible. Actual native line/plane eligibility, alignment and hole projection remain real measurement-service checks; metadata admission does not prove them.

Source-distance endpoints must have different semantic refs; plane-distance refs must have different selectionIds. A source curve ID cannot contradict its declared curveType. Within one drawing a selectionId cannot contradict its declared originFeatureId or edge/face kind. A center-hole featureId cannot contradict its complete source binding across dimensions. Distinct dimensions may intentionally reuse the same witness. Metadata equality is not native membership proof. Source distances are datum measurements; hole diameter/offset and cap distance require actual current native witnesses. Do not claim that synthetically admitting a center-hole reference means its cylinder witness is implemented.

There are no saved measured values, unit overrides, raw expressions, source bytes/digests, native indices/handles, projection record IDs, geometry coefficients, tolerances or arbitrary styling. Typed labels, text templates, detached detail views, arbitrary rotations, corner/pattern hole slots and GD&T are outside version1.

## Pure operation preparation

Proposed exports:

```ts
captureLinkedPartDrawingDefinition(value:unknown): Readonly<Drawing>;
captureLinkedPartDrawingRequest(value:unknown): Readonly<Request>;
prepareLinkedPartDrawingOperation(input:{request:unknown,current:unknown}): Preparation;
captureLinkedPartDrawingOperationRecord(value:unknown): Readonly<JournalRecord>;
```

`current` is trusted-owner-supplied plain metadata `{revision,geometryRevision,drawing:Drawing|null}` captured and validated, not a callback or live context. Exactly one drawing is supported in this stage. It is not a replacement document model. Preparation synchronously compares both revisions, captures before/after definitions and returns a proposal; caller must recheck document identity/currentness at actual async dispatch/publication. This module neither advances revisions nor writes metadata/history/counters.

| Request (exact fields) | Preconditions | Prepared outcome |
|---|---|---|
| `{op:'drawing.create',version:1,unit:'millimeter',revision,geometryRevision,definition}` | current drawing null | before null, after definition, changed true |
| `{op:'drawing.replace',version:1,unit:'millimeter',revision,geometryRevision,drawingId,definition}` | existing ID matches both IDs | complete replacement; changed false only for exact canonical admitted equality |
| `{op:'drawing.remove',version:1,unit:'millimeter',revision,geometryRevision,drawingId}` | existing ID matches | before current, after null, changed true |

Replacement deliberately permits explicit reference/target repair and view/dimension additions/removals. Existing drawingId is immutable. No automatic ID migration, patch language, merge or geometry coercion. Target capability and discovered replacement reference custody remain the later service's responsibility. Reorderings of the dimension array are explicit metadata changes; fixed view order remains invariant.

Preparation result exact `{changed,binding:{revision,geometryRevision},before,after,journalRecord}`. No-op returns `journalRecord:null`; it must not create a journal step or advance the eventual revision. Failure throws typed `INVALID_REQUEST`, `RESOURCE_LIMIT`, `STALE_DOCUMENT`, `DRAWING_ALREADY_EXISTS` or `DRAWING_NOT_FOUND`; no changed/published success is fabricated.

## Proposed shared journal entry

```ts
type JournalRecord = {
 kind:'document-metadata'; version:1; domain:'linked-part-drawing';
 key:Id; before:Drawing|null; after:Drawing|null; byteSize:number;
};
```

Exactly one null permits create/remove; both nonnull permit replacement with the same drawingId==key. Both null or equal before/after refuse as non-edits. `byteSize` is computed by preparation and checked exactly by capture: for canonical JSON of the admitted record excluding byteSize itself, `max(UTF8.byteLength,2*text.length)`. This is a conservative serialized/string budget charge, not measured JS heap usage. Bound the entry charge≤262144 bytes; budget failure refuses before publication. The later shared journal owns document generation, journal revision, cursor, existing64-entry/8MiB budget, branch truncation and atomic publication. It must route exact kind/domain and compare current admitted before/after on travel. This proposal does NOT implement another stack.

`document-metadata` is a proposed common journal kind with a domain discriminator so later material metadata can reuse the same journal. This module admits ONLY linked-part-drawing; it does not invent or accept a material schema. Existing old-feature entries and shapes remain unchanged until root explicitly integrates the dispatcher/budget logic.

## Required synthetic metadata tests

Roundtrip detached/frozen three-view/seven-dimension definitions; exact variant fields and cross-reference consistency; opaque IDs retained without parsing; canonical scale and physical sheet bounds; zero dimensions admitted without a manufacturing completeness claim; replace/create/remove/no-op and stale revisions; immutable drawing identity, honest ref repair, dimension reorder; exact journal before/after and charges; 64KiB UTF-8 boundaries including multibyte and request overhead; source/selection/key maxima; sparse arrays/symbol/nonenumerable/inherited/accessor/extra fields and caller mutation after capture; forbidden persisted measurement/frame/handle/HLR fields; cycle/nonfinite/unsafe IDs/negative-zero; mismatched provenance metadata; deep frozen result and no shared caller containers.

Every success fixture is SYNTHETIC METADATA, not actual geometry or a successful native engine. No test may label schema admission as source/shape/native membership, shared publication, actual Undo/Redo, signed Save/Open or E22 completion. Reuse existing retained Node checks only as compatibility evidence; no browser/native run is needed for this isolated slice.
