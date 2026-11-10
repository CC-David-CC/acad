import {SOURCE_PROJECTION_TYPE,captureSourceProjection,projectionFail as fail} from 'engine/source/sourceProjectionIntent.mjs';
import {sourcePlaneFaceId} from './sourcePlaneIdentity.mjs';
import {MOpenFaceShell} from '../model/mopenFace';
import {isRegisteredSourceProjection,readProjectedSourceRecord} from 'workbenches/modeler/features/sourceProjection/sourceProjection.operation';
export {SOURCE_PROJECTION_TYPE,isRegisteredSourceProjection};
// Actual accepted-source custody only. The independent candidate replay still
// MUST run the registered producer and validate its original source/cache in
// two Workers. This guard grants neither an inert history exemption nor a write.
export function captureProjectionReadGuard(ctx:any,history:any[]){
 if(!Array.isArray(history)||history.length>256)fail('RESOURCE_LIMIT','Projection read history exceeds its existing bound.');
 if(!history.some(entry=>entry.type===SOURCE_PROJECTION_TYPE))return null;
 const craft=ctx.craftService,registry=ctx.cadRegistry,sketches=ctx.sketchStorageService,operations=ctx.operationService,project=ctx.projectService,state=craft.modifications$.value,generation=project.documentGeneration,signal=project.documentSignal;
 if(state.history!==history||state.pointer!==history.length-1)fail('UNSUPPORTED_HISTORY','Projection reads require their actual complete accepted history.');
 const rows:any[]=[];
 for(let index=0;index<history.length;index++){
  const entry=history[index];if(entry.type!==SOURCE_PROJECTION_TYPE)continue;
  if(rows.length>=64)fail('RESOURCE_LIMIT','Projection read custody exceeds64 source producers.');
  const parameters=entry.params,p=captureSourceProjection(parameters),faceId=sourcePlaneFaceId(p.featureId),face=registry.findFace(faceId),operation=operations.get(SOURCE_PROJECTION_TYPE);
  if(!isRegisteredSourceProjection(operation)||!(face?.root instanceof MOpenFaceShell)||face.root.face!==face||face.root.originatingOperation!==index||face.id!==faceId||face.defaultSketchId!==faceId)fail('PROJECTION_SOURCE_UNAVAILABLE','The actual registered projected source is unavailable.');
  const record=readProjectedSourceRecord(ctx,face);if(!record||record.projectionDescriptor!==operation)fail('PROJECTION_CACHE_MISMATCH','The accepted projection has no actual current prepared source binding.');
  rows.push({index,entry,parameters,parameterText:JSON.stringify(p),faceId,face,operation,record});
 }
 function requireCurrent(){
  if(ctx.craftService!==craft||ctx.cadRegistry!==registry||ctx.sketchStorageService!==sketches||ctx.operationService!==operations||ctx.projectService!==project||!project.hasHostLifetime||!project.isDocumentCurrent(generation)||project.documentSignal!==signal||craft.modifications$.value!==state||state.history!==history||state.pointer!==history.length-1)throw new DOMException('Projection read custody was superseded.','AbortError');
  for(const row of rows)if(history[row.index]!==row.entry||row.entry.type!==SOURCE_PROJECTION_TYPE||row.entry.params!==row.parameters||JSON.stringify(captureSourceProjection(row.parameters))!==row.parameterText||registry.findFace(row.faceId)!==row.face||row.face.root.originatingOperation!==row.index||operations.get(SOURCE_PROJECTION_TYPE)!==row.operation||!isRegisteredSourceProjection(row.operation)||readProjectedSourceRecord(ctx,row.face)!==row.record)throw new DOMException('Projection original source/cache authority changed.','AbortError');
 }
 requireCurrent();return Object.freeze({requireCurrent});
}
