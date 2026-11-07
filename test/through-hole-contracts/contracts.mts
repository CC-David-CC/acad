import type {KernelThroughHole,SolidRequest,ShapeResult,TransientShapeHandle,SolidKernel} from '../../modules/engine/solid/SolidKernel.js';
import type {OwnedHoleIntent} from '../../modules/engine/solid/ownedHoleIntent.mjs';
declare const handle:TransientShapeHandle,sourceHandle:TransientShapeHandle;
const center:OwnedHoleIntent={version:1,unit:'millimeter',engine:'occ',engineRevision:'registered-runtime',featureId:30,target:'authored-body',producerFeatureId:20,sourceFeatureId:10,sourceFaceId:'actual-face',sourceRegionId:'actual-region',kind:'centered-through',diameter:4};
const request:KernelThroughHole={...center,op:'solid.holes.through',handle,sourceHandle};
const corner:KernelThroughHole={...request,kind:'four-corner-through',offsetX:10,offsetY:10};
const unified:SolidRequest=corner;
// @ts-expect-error source ownership handle is mandatory
const missing:KernelThroughHole={...center,op:'solid.holes.through',handle};
// @ts-expect-error four-corner form requires both authored offsets
const noOffset:KernelThroughHole={version:1,unit:'millimeter',engine:'occ',engineRevision:'registered-runtime',featureId:30,target:'body',producerFeatureId:20,sourceFeatureId:10,sourceFaceId:'face',sourceRegionId:'region',diameter:4,op:'solid.holes.through',handle,sourceHandle,kind:'four-corner-through'};
// @ts-expect-error centered form does not accept corner offsets
const unwanted:KernelThroughHole={...request,offsetX:10};
// @ts-expect-error op literal cannot be widened or substituted
const wrongOp:KernelThroughHole={...request,op:'solid.holes.blind'};
// @ts-expect-error no solved tool extent is authored in this request
const depth:KernelThroughHole={...request,depth:22};
// @ts-expect-error source handle is opaque, not an arbitrary runtime string
const wrongHandle:KernelThroughHole={...request,sourceHandle:'private-handle'};
// @ts-expect-error immutable authored fields
request.diameter=6;
declare const result:ShapeResult;
if(result.op==='solid.holes.through'){const measured:TransientShapeHandle=result.handle;void measured;}
declare const kernel:SolidKernel;
kernel.execute(request);kernel.execute(corner);
void[unified,missing,noOffset,unwanted,wrongOp,depth,wrongHandle];
