# Selected-profile region edit contract

```ts
createSelectedProfileRegionCommands(ctx, submitRegionEdit)
```

The constructor returns frozen methods `inspectSelectedProfileRegionChoices({revision,index,featureId},options?)` and `editSelectedProfileRegion({revision,index,featureId,regionId},options?)`. Options are exact optional own data fields `{signal?,valid?}`. Revision is nonempty <=256 UTF-16 units, index a safe integer 0..255, featureId a positive safe integer. The opaque regionId is nonempty <=8192 units and is passed unchanged; no client-side parsing is required.

`submitRegionEdit(args,options)` must synchronously enter the existing shared `authoredFeatureOperation('selected-profile-region',args,options)` before any queued/deferred work. Its args are exactly `{revision,index,featureId,regionId}`; options are `{signal,valid}`. The callback's valid guard covers caller/document/service custody through expected candidate processing. Root owns the source/history/epoch/journal/budget/Worker membership and prepared publication guards. Successful changed callback receipt is exactly `{changed:true,revision,index,featureId,regionId}`; no-op receipt is exactly `{changed:false,revision}`. Callback errors, including known committed errors, propagate. A malformed fulfilled callback outcome raises INVALID_RESPONSE with possiblyCommitted:true, avoiding an unsafe ordinary-rejection interpretation.

Choices output is detached/frozen:

```ts
{
 revision,       // authored feature/journal token: use this for edit
 regionRevision, // distinct token used by current region-discovery service
 index,
 version:1,unit:'millimeter',engine:'occ',engineRevision,
 featureId,faceId,regionId,depth,bodyPolicy:'separate', // exact saved parameters
 currentSourceDigest, // actual bound sketch-Worker digest, 64 lowercase hex
 profileVersion:2|3,
 sourceFrame:{origin:[x,y,z],x:[x,y,z],y:[x,y,z],z:[x,y,z]},
 regions:[{regionId,support:'supported'|'unsupported',reason,descriptor:{outerCurveIds,holeCurveIds}}],
 dependencyCompatibility:'requires-full-replay'
}
```

Both revision domains, exact feature parameters, accepted-tip position, full history signature, raw source/version/namespace, current owned plane/frame and build are checked around genuine asynchronous discovery. The existing descriptor service performs its actual paired sketch/semantic Worker reconstruction; the wrapper recaptures descriptors against the captured source's ordinary curve census. Unsupported rows remain visible but cannot be edited. The old same-ID choice must still be currently listed and supported before the no-op reaches the root callback. Append-capacity exhaustion does not prohibit this fixed-cost edit.

Public edit output is always frozen `{changed,revision,index,featureId,regionId}`. No authored feature ID is allocated or substituted. Source, depth, units, body policy and exact whole-part build remain immutable. The root shared operation changes only params.regionId and records/travels the same journal; compatible children must replay or incompatible children must reject atomically, without retargeting.

Journal exports:

```ts
recordSelectedProfileRegionEdit(state,{document,revision,index,featureId,parameters,after})
planSelectedProfileRegionTravel(state,{document,revision,direction,index,featureId,parameters})
// plan -> frozen {index,featureId,regionId,next}
```

The entry kind is `selected-profile-region`, with feature/index, exact before/after opaque strings and immutable identity `{version,unit,engine,engineRevision,faceId,depth,bodyPolicy}`. It shares the existing 64-entry/8 MiB mixed journal, LIFO chronology and branch truncation. No native format, UUID, old region repair or extra authored model is added.

Typed/project-bound selected profiles remain unsupported. This operation reselects a region in the current accepted source; it does not combine a previously rejected nesting-changing source edit with reselection or repair a failed partial history. Signed downstream native replay, Undo/Redo and Save/Open qualification follows root wiring.
