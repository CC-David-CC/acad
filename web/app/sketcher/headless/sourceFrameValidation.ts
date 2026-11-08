// Worker-only native-file preflight. Native face parent locators are NOT
// admitted/approximated by this phase A deterministic source-placement check.
import {SOURCE_FRAME_TYPE,captureSourceFrameParameters,sourceFrameFail as fail} from 'engine/source/sourceFrameIntent.mjs';
import {canonicalAuthoredFeatureId as fid} from 'cad/craft/authoredFeatureIdentity.mjs';
import {sourcePlaneFaceId} from 'cad/craft/sourcePlaneIdentity.mjs';
import {deriveSourceFrame,principalSourceFrame,checkedSourceFrame,closeSourceFrame} from './sourceFrameMath';
export function validateProjectSourceFrames(project:any){
 const history=project.model.history;if(!history.some((row:any)=>row.type===SOURCE_FRAME_TYPE))return;
 const definitions=new Map<number,any>(),sources=new Map<string,any>(),frames=new Map<number,any>(),levels=new Map<number,number>();
 for(let index=0;index<history.length;index++)definitions.set(fid(history[index].params.featureId),{entry:history[index],index});
 for(const sketch of project.sketches){if(sources.has(sketch.id))fail('INVALID_FRAME_DEPENDENCY','Source identities must be unique.');sources.set(sketch.id,sketch.data);}
 let count=0;
 function resolve(featureId:number,depth:number):any{
  if(depth>16)fail('RESOURCE_LIMIT','Source frame parent depth exceeds16.');if(frames.has(featureId))return frames.get(featureId);
  const row=definitions.get(featureId);if(!row)fail('INVALID_FRAME_DEPENDENCY','Source parent is missing.');let frame,level=0;
  if(row.entry.type==='PLANE')frame=principalSourceFrame(row.entry.params);
  else if(row.entry.type===SOURCE_FRAME_TYPE){const p=captureSourceFrameParameters(row.entry.params);let parentFrame=null;if(p.parent){const parent=definitions.get(p.parent.featureId);if(!parent||parent.index>=row.index||p.parent.faceId!==sourcePlaneFaceId(p.parent.featureId))fail('INVALID_FRAME_DEPENDENCY','An actual earlier source-plane parent is required.');parentFrame=resolve(p.parent.featureId,depth+1);level=(levels.get(p.parent.featureId)||0)+1;if(level>16)fail('RESOURCE_LIMIT','Source frame parent depth exceeds16.');}frame=deriveSourceFrame(p,parentFrame);const source=sources.get(sourcePlaneFaceId(featureId));if(!source)fail('UNRESOLVED_SOURCE','The custom source sketch is missing.');if(!closeSourceFrame(checkedSourceFrame(source.metadata?.boundaryFrame),frame))fail('STALE_FRAME','The saved derived source frame does not match its authored attachment.');}
  else fail('UNSUPPORTED_FRAME_PARENT','Only explicit source-plane parents are admitted.');
  levels.set(featureId,level);frames.set(featureId,frame);return frame;
 }
 for(const row of history)if(row.type===SOURCE_FRAME_TYPE){if(++count>64)fail('RESOURCE_LIMIT','Custom source frame count exceeds64.');resolve(fid(row.params.featureId),0);}
}
