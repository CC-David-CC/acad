import {replaySketchTransition} from './sketchTransition';
import {projectRenderSketch} from './renderSketchProjection.mjs';
import {inspectEllipseRows} from './ellipseParameterTransition';
import {discoverDrivingDimensions} from './drivingDimensionTarget.mjs';

// Reconstruct the same solver model as an edit, in a disposable Worker.
// Transfer only discovery data, never live objects or publication authority.
// Coordinates below belong to the validated cold replay, not exact saved bytes.
// Replay verification bounds reconstruction drift; inspection never publishes
// that solved copy back into storage or changes the authored revision.
export function inspectClosedSketchTransition(request:any) {
  const verified=replaySketchTransition(request);
  if(!verified.ok||!('serializedSketch' in verified))return verified;
  try {
    const sketch=JSON.parse(verified.serializedSketch),frame=sketch.metadata?.boundaryFrame;
    if(!frame||Object.keys(frame).sort().join(',')!=='origin,x,y,z'||
       !['origin','x','y','z'].every(key=>Array.isArray(frame[key])&&frame[key].length===3&&frame[key].every(Number.isFinite))) {
      throw Object.assign(Error('The saved sketch has no valid authored frame.'),{code:'FRAME_UNAVAILABLE'});
    }
    const objects=sketch.objects.map(object=>({id:object.id,type:object.type,role:object.role??null,stage:object.stage??0}));
    // Read-only declared native point identities, not permission to edit a
    // generated object. The edit operation independently checks real ownership.
    const pointSource={...sketch,objects:sketch.objects.filter(object=>['Point','Segment','Circle','Arc'].includes(object.type))};
    const points=projectRenderSketch(pointSource).objects.flatMap(object=>object.handles.map(point=>({id:point.id,parentId:object.id,x:point.x,y:point.y})));
    const constraints=sketch.stages.flatMap((stage,stageIndex)=>stage.constraints.map((constraint,index)=>({
      stage:stageIndex,index,typeId:constraint.typeId,objects:constraint.objects,
      constants:constraint.constants||{},admission:{version:constraint.admission.version,state:constraint.admission.state}
    })));
    if(objects.length>10000||constraints.length>10000)throw Error('Sketch inspection exceeds its limit.');
    return {revision:request.revision,ok:true,objects,points,constraints,ellipses:inspectEllipseRows(JSON.parse(request.sketchJSON),sketch,request.externalParameters),dimensionTargets:discoverDrivingDimensions(sketch,points),stageCount:sketch.stages.length,boundaryFrame:frame,
      emptyBoundary:['lines','arcs','circles','nurbses'].every(key=>Array.isArray(sketch.boundary?.[key])&&sketch.boundary[key].length===0)};
  } catch(error) {
    return {revision:request.revision,ok:false,error:{code:error?.code||'INSPECTION_INVALID',message:error?.message||'Sketch inspection failed.'}};
  }
}
