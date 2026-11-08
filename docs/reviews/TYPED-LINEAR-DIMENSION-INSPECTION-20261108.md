# Existing LinearDimension records in typed inspection

Source-only diagnosis and bounded repair, based on Core66bafe03f7e814ade3a56deb45072f05812eb3a3. No tests, probes, TSC, builds or browser execution were performed. No original driver/example, expected result, Native binary, C08/C09 feature, Desktop, Files, generator or model format changes are included.

## Actual whole-workflow blocker

The repaired measurement R2 whole run on Core4d5 / Desktop4c failed after56 rows and three native saves. The former physical-configuration setup failure was gone: apply-physical-configurations succeeded. The next inspection omitted the actual sketch from candidates. `typedClosedSketchInspection.mjs::prepareTypedClosedSketchInspection` explicitly rejected any nonempty dimensions array before the actual read Worker could run. The source contains a genuine native LinearDimension created through the public ruler workflow, not an injected record. R2 artifacts/source/hash/cleanup receipts remain frozen under `/tmp/codi-length-measurement-workflow-20261108-r2`; no further downstream pass is inferred.

## Canonical shared record policy

NEW `web/app/sketcher/shapes/linearDimensionRecord.mjs` captures exactly the existing native serialization:

```
{id, type:'LinearDimension', data:{a, b, offset}}
```

Its own-data fields must be canonical, IDs/references nonempty strings, and offset a finite Number. It does not add a global ID-length or offset-magnitude cap, a positive-offset requirement, or an a!=b rule. Negative offsets, signed zero and equal endpoint references retain the existing finite-data semantics. Other/extra fields and other dimension types are refused explicitly, not stripped or coerced. The returned immutable copy is structural validation data, not live ownership, a geometric measurement, or publication authority.

This is the same form written by `LinearDimension.write()` and IO's dimension-layer serializer, and used by the existing length-measurement preparation/transition. No separate role/value/unit/style or cached measured length is persisted. The existing single physical parameter model and canonical numerical length resolution remain unchanged.

## Typed read / dimension-edit discovery

`cad/craft/typedClosedSketchInspection.mjs` keeps its existing1MiB string/UTF-8 envelope and stage limits. It admits only canonical existing LinearDimension rows through that shared policy, then runs the same typed dependent length-field preparation. It neither removes/replaces dimension rows nor alters the source, offset, IDs or references. Labels, generators and every other dimension form remain explicitly unsupported for this typed read route.

The helper is shared by typed candidate discovery and typed existing-driving-dimension edit/removal parameter capture. Actual closed-sketch inspection, frame/source/revision checks, stale-service guards and candidate publication are unchanged. Typed length-measurement creation/conversion remain refused by the existing mutation guard and advertised canCreate/canConvert policy. No new typed mutation authority follows from readable ruler metadata.

## Actual IO / Worker ownership

The old strict IO branch checked dimension references existed, but did not require a LinearDimension endpoint reference to identify a Point. A Segment or other root could structurally pass that old reference check despite not being a valid ruler endpoint.

The narrow LinearDimension branch of `sketcher/io.ts::validateStrictDimension` now reuses the shared canonical record policy and resolves both references against its actual index. Each must be an actual registered `EndPoint` instance with matching native identity/index membership. No ID grammar, coordinate matching or nearest-object inference is used. Equal endpoint identity remains allowed. The other existing native dimension-class branches are unchanged.

`validateProjectSketch` builds registered native objects before invoking that validator. Strict actual Worker IO invokes it again against the current constructed model before `LinearDimension.load` constructs the genuine ruler and adds it to the dimension layer. Existing solver/source serialization checks require the dimensions/labels/constants/metadata to remain unchanged; the record policy is not a replacement for those model/Worker checks. The typed preparation imports only the pure policy, not shape constructors or a canvas/model projection on the main thread.

This intentionally tightens malformed LinearDimension native admission: noncanonical unknown fields and non-Point references now fail before being silently lost or treated as a valid ruler. It does not add a dimension form or rewrite/migrate old files. Existing overall source/tree limits apply; no new global record-count, identifier-length or numerical magnitude limit is introduced.

## Required complete qualification after composition

Root must review the shared IO tightening, compose/build the application and rerun the unchanged complete measurement workflow. The actual typed configuration step must retain the native ruler and permit inspection/discovery; supported driving-dimension edits/removal still need their original Worker/equation/identity proof. Typed ruler conversion refusal, no-change behavior and exact native source/offset/ID persistence must remain intact. Retain every first failure without changing expected results.

Because strict IO participates in native Save/Open, the relevant complete .cad regression must also run on the coherent runtime before any broader claim. This packet by itself proves no new whole workflow, precision, ruler rendering, unknown-dimension, material or BRep capability.
