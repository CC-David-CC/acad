// Worker-only native-file preflight. Native face parent locators are NOT
// admitted/approximated by this phase A deterministic source-placement check.
import {SOURCE_FRAME_TYPE,captureSourceFrameParameters,sourceFrameFail as fail} from 'engine/source/sourceFrameIntent.mjs';
import {canonicalAuthoredFeatureId as fid} from 'cad/craft/authoredFeatureIdentity.mjs';
import {sourcePlaneFaceId} from 'cad/craft/sourcePlaneIdentity.mjs';
import {deriveSourceFrame,principalSourceFrame,checkedSourceFrame,closeSourceFrame} from './sourceFrameMath';
import {solidBodyId} from 'engine/solid/solidIntent.mjs';
import {AUTHORED_SOLID_KINDS} from 'engine/solid/authoredSolidKinds.mjs';
const identity={origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]};
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
  else if(row.entry.type===SOURCE_FRAME_TYPE){const p=captureSourceFrameParameters(row.entry.params);let parentFrame=null,deferred=false;if(p.parent){const parent=definitions.get(p.parent.featureId);if(!parent||parent.index>=row.index)fail('INVALID_FRAME_DEPENDENCY','An actual earlier parent is required.');
   if(p.parent.kind==='native-planar-face'){const a=p.parent,origin=definitions.get(a.sourceFeatureId);const sourceOwner=history.findIndex((entry:any)=>['PLANE',SOURCE_FRAME_TYPE].includes(entry.type)&&sourcePlaneFaceId(fid(entry.params.featureId))===a.sourceFaceId);if(sourceOwner<0||sourceOwner>=origin?.index||a.bodyId!==solidBodyId(a.featureId)||!AUTHORED_SOLID_KINDS.includes(parent.entry.type)||parent.entry.params.engine!==a.engine||parent.entry.params.engineRevision!==a.engineRevision||!origin||origin.index>parent.index||(a.framePolicy==='profile-extent-cap-source-datum-v1'?origin.entry.type!=='WORKER_SELECTED_PROFILE_EXTENT_EXTRUDE_V1':origin.entry.type!=='WORKER_SELECTED_PROFILE_EXTRUDE_V2')||origin.entry.params.engine!==a.engine||origin.entry.params.engineRevision!==a.engineRevision||origin.entry.params.faceId!==a.sourceFaceId||origin.entry.params.regionId!==a.sourceRegionId||!sources.has(a.sourceFaceId))fail('INVALID_FRAME_DEPENDENCY','Native parent and selected-source locator differ from the actual earlier definitions.');const ownerId=fid(history[sourceOwner].params.featureId);resolve(ownerId,depth+1);level=(levels.get(ownerId)||0)+1;deferred=true;}
   else{if(p.parent.faceId!==sourcePlaneFaceId(p.parent.featureId))fail('INVALID_FRAME_DEPENDENCY','The source-parent identity changed.');parentFrame=resolve(p.parent.featureId,depth+1);deferred=parentFrame===null;level=(levels.get(p.parent.featureId)||0)+1;}if(level>16)fail('RESOURCE_LIMIT','Source frame parent depth exceeds16.');}
   const source=sources.get(sourcePlaneFaceId(featureId));if(!source)fail('UNRESOLVED_SOURCE','The custom source sketch is missing.');const cached=checkedSourceFrame(source.metadata?.boundaryFrame);
   if(deferred){deriveSourceFrame(p.placement,identity,true);frame=null;/* No native equality claim here. Actual candidate replay MUST validate this cache before adoption. */}
   else{frame=deriveSourceFrame(p,parentFrame);if(!closeSourceFrame(cached,frame))fail('STALE_FRAME','The saved derived source frame does not match its authored attachment.');}}
  else fail('UNSUPPORTED_FRAME_PARENT','Only explicit source-plane parents are admitted.');
  levels.set(featureId,level);frames.set(featureId,frame);return frame;
 }
 for(const row of history)if(row.type===SOURCE_FRAME_TYPE){if(++count>64)fail('RESOURCE_LIMIT','Custom source frame count exceeds64.');resolve(fid(row.params.featureId),0);}
}
