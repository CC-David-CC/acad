# Root serial composition

Core baseline: qualified b3fd5fcc6c944fefb2b23f421f78fb0c2a5d96ad.
Ordered product:2977e9e (core),14fa50e (central wiring),6c9b45e (preserve existing
human recovery/duplicate policy with a separate closed eligibility layer), then
final follow-up/source-driver commits reported in handoff. No execution.

Existing Object.assign(ctx.craftService,closedSketchCommands) already installs
both methods. Add only these CraftService optional type declarations:

```ts
applyClosedSketchFixEntity?: ReturnType<typeof createClosedSketchTransitionCommands>['applyClosedSketchFixEntity'];
removeClosedSketchFixEntity?: ReturnType<typeof createClosedSketchTransitionCommands>['removeClosedSketchFixEntity'];
```

Desktop bb1c7cb2837ee463b30237a5e6f8585942a0906e supplies NEW
apps/system/jsketcher/fixed-entity-commands.mjs and registration note. Root index:

```js
import {registerFixedEntityCommands} from './fixed-entity-commands.mjs';
if(host.commands)host.onDispose(registerFixedEntityCommands(host,()=>rectangle.target()));
```

Source discovery is existing inspect-closed-sketch.fixedEntities:
`targets:[{id,type,stage,canFix,reason}]`,
`rows:[{constraintId,stage,index,typeId,id,constants,status,canRemove,reason}]`.
Public apply {revision,faceId,id}; remove {revision,faceId,constraintId}.
No new public geometry/flag/constant request or scalar-Fix editing.

DistancePL lane's central packet is additive. Keep its dimensionTargets
conditional supportingLine field and third support Map in discovery. Our only
inspection additions are fixedEntities import/key/capture/output. Keep PL scalar
verifier selection and shared field policy, which the existing dimension travel
dispatch continues to use. New Fix classification runs before that classifier
only when a Fix row actually changes; unrelated ordinary dimension deletion
shifting a later Fix's array index is not a Fix semantic change.

Untyped journal's new Fix boundary checks only the Fix obligation when present,
then the existing full target replay still executes. Typed journal continues its
exact supported dimension/coordinate dispatch with one explicit Fix branch.
No journal schema/stack/parameter snapshot document or geometry engine added.

Root alone normal-builds, stages and executes unchanged whole driver/oracle after
this coherent packet. No product tests/probes/TSC/build/browser were run here.
