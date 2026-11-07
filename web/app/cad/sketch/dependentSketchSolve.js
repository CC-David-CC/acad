import {boundaryChangeForSketch, boundaryGeometryClose, selectReferencedBoundaries, sketchBoundaryFrame} from './boundaryValidity';
let nextRevision=0;
// Capture only immutable, bounded inputs. The worker owns numerical solving;
// this caller rejects any response whose source, face or parameter context
// changed while the worker was running. It never writes authored sketch data.
export async function resolveDependentSketch({ctx, face, getBoundary, run, workerUrl, signal}) {
  const source=ctx.sketchStorageService.getSketchData(face.id);
  if(source===null)return null;
  if(typeof source!=='string'||source.length>1024*1024)throw new Error('Dependent sketch exceeds the current solve limit.');
  const authored=JSON.parse(source), initialBoundary=getBoundary(face);
  const change=boundaryChangeForSketch(authored,initialBoundary);
  const typed=ctx.expressionService.isTyped;
  const hasTypedBinding=typed && authored.stages?.some(stage=>stage.constraints?.some(c=>c.typeId==='SegmentLength' && typeof c.constants?.length==='string' && /^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/.test(c.constants.length.trim())));
  if(!change.changed&&!hasTypedBinding)return null;
  const frame=sketchBoundaryFrame(face);
  if(change.referenced && (!authored.metadata?.boundaryFrame || !boundaryGeometryClose(authored.metadata.boundaryFrame,frame)))throw new Error('Sketch face frame changed or its provenance is missing.');
  const project=ctx.projectService, history=ctx.craftService.modifications$.value, evaluationEpoch=ctx.craftService.evaluationEpoch;
  const expressions=ctx.expressionService,script=expressions.script$.value;
  ctx.requireParameterCandidateCurrent?.();
  if(typed&&!expressions.hasCurrentPhysicalResult())throw new Error('Typed parameters are unavailable.');
  const parameterTable=expressions.table$.value,parameterStreams=[expressions.script$,expressions.list$,expressions.errors$,expressions.table$],parameterRevisions=parameterStreams.map(s=>s.revision);
  const params=Object.create(null);
  for(const [key,value] of Object.entries(typed?{}:parameterTable)) {
    if(!/^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/.test(key)||!Number.isFinite(value))throw new Error('Shared sketch parameters are invalid.');
    params[key]=value;
  }
  const capturedParams=JSON.stringify(params), revision='dependent-sketch-'+(++nextRevision);
  const valid=()=>!signal?.aborted && ctx.projectService===project && ctx.craftService.evaluationEpoch===evaluationEpoch && ctx.craftService.modifications$.value===history && ctx.cadRegistry.findFace(face.id)===face && ctx.sketchStorageService.getSketchData(face.id)===source && ctx.expressionService===expressions && expressions.isTyped===typed && expressions.script$.value===script && parameterStreams.every((s,i)=>s.revision===parameterRevisions[i]) && (!typed||expressions.hasCurrentPhysicalResult()) && (typed||JSON.stringify(expressions.table$.value)===capturedParams);
  const emptyBoundary={lines:[],arcs:[],circles:[],nurbses:[]};
  const current=change.referenced?selectReferencedBoundaries(initialBoundary,change.referencedIds):emptyBoundary;
  const saved=change.referenced?selectReferencedBoundaries(authored.boundary,change.referencedIds):emptyBoundary;
  const sketch={...authored,boundary:saved};
  const request=typed?{task:'typed-dependent-solve',revision,sketchJSON:JSON.stringify(sketch),boundary:current,parameterSource:script}:{revision,sketch,boundary:current,externalParameters:params};
  const result=await run(workerUrl,request,{signal,valid});
  ctx.requireParameterCandidateCurrent?.();
  if(!valid() || !boundaryGeometryClose(initialBoundary,getBoundary(face)) || !boundaryGeometryClose(frame,sketchBoundaryFrame(face)))throw new DOMException('Sketch or boundary changed during solve.','AbortError');
  if(!result || result.revision!==revision || result.ok!==true || !result.sketch || !Array.isArray(result.evidence)) {
    throw new Error(result?.error?.message || 'Dependent sketch could not be solved.');
  }
  return result.sketch;
}
