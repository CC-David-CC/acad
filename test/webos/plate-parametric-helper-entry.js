import {Viewer} from 'sketcher/viewer2d';
import {IO} from 'sketcher/io';
import {getSketchBoundaries} from 'cad/sketch/sketchBoundaries';
window.plateResearch = {
 data(ctx,faceId) {const face=ctx.cadRegistry.findFace(faceId),raw=JSON.parse(ctx.sketchStorageService.getSketchData(faceId));raw.boundary=getSketchBoundaries(face);return raw},
 solve(ctx, faceId) {
  const face=ctx.cadRegistry.findFace(faceId), raw=JSON.parse(ctx.sketchStorageService.getSketchData(faceId));
  raw.boundary=getSketchBoundaries(face);console.log('BOUNDARY_REGENERATED',JSON.stringify(raw.boundary));
  const canvas=document.createElement('canvas');document.createElement('div').appendChild(canvas);const viewer=new Viewer(canvas,IO,{});
  try {
   viewer.parametricManager.externalConstantResolver=ctx.expressionService.evaluateExpression;
   viewer.io._loadSketch(raw,{strict:true});
   const statuses=viewer.parametricManager.stages.map(s=>({success:s.algNumSystem.solveStatus.success,error:s.algNumSystem.solveStatus.error,conflicts:[...s.algNumSystem.conflicting].map(c=>c.schema.id),redundant:[...s.algNumSystem.redundant].map(c=>c.schema.id)}));
   const solved=JSON.parse(viewer.io.serializeSketch(undefined,{strict:true}));
   return {statuses,objects:solved.objects.filter(o=>o.type==='Circle').map(o=>o.data),constraints:solved.stages.flatMap(s=>s.constraints)};
  } finally {viewer.dispose()}
 }
};
