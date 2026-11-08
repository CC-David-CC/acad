import {MOpenFaceShell} from 'cad/model/mopenFace';
import {PlaneSurfacePrototype} from 'cad/model/surfacePrototype';
import {Plane} from 'geom/impl/plane';
import CSys from 'math/csys';
import Vector from 'math/vector';
import {Types} from 'cad/craft/schema/types';
import standardPlaneOperation from '../plane/simplePlaneOperation';
import {sourcePlaneShellId,sourcePlaneFaceId} from 'cad/craft/sourcePlaneIdentity.mjs';
import {captureSourceFrameParameters,SOURCE_FRAME_TYPE,sourceFrameFail as fail} from 'engine/source/sourceFrameIntent.mjs';
import {canonicalAuthoredFeatureId} from 'cad/craft/authoredFeatureIdentity.mjs';
import {captureSourcePlaneParameters} from 'sketcher/headless/sourcePlaneDepthEnvelope.mjs';
import {runSourceFramePreparation} from 'sketcher/headless/sourceFrameClient';
import {sketchBoundaryFrame} from 'cad/sketch/boundaryValidity';
import workerUrl from 'codi-headless-sketch-worker';
const PRINCIPAL_RUN=standardPlaneOperation.run;
const sourceFrameRun=async(params:any,ctx:any,raw:any)=>{
 const p=captureSourceFrameParameters(raw),featureId=canonicalAuthoredFeatureId(p.featureId),owner=ctx.engineEvaluation;
 if(params.featureId!==featureId||!owner||ctx.cadRegistry?.isEvaluating!==true)fail('INVALID_WORKSPACE','Source frames require a genuine candidate evaluation.');
 const history=ctx.authoredEvaluationHistory,index=history?.findIndex((entry:any)=>canonicalAuthoredFeatureId(entry.params.featureId)===featureId);
 if(!Array.isArray(history)||index<0||history[index].type!==SOURCE_FRAME_TYPE||history[index].params!==raw)fail('INVALID_FRAME_DEPENDENCY','The current source definition is unavailable.');
 let parentFrame=null,parent:any=null;
 if(p.parent){
  parent=ctx.cadRegistry.findFace(p.parent.faceId);const source=parent?.root,at=source?.originatingOperation,entry=history[at],op=entry&&ctx.operationService.get(entry.type);
  if(!(source instanceof MOpenFaceShell)||source.face!==parent||!parent.isPlaneBased||parent.defaultSketchId!==p.parent.faceId||!Number.isSafeInteger(at)||at<0||at>=index||canonicalAuthoredFeatureId(entry.params.featureId)!==p.parent.featureId)fail('INVALID_FRAME_DEPENDENCY','The actual parent must be an earlier retained source plane.');
  if(entry.type==='PLANE'){captureSourcePlaneParameters(entry.params);if(op.run!==PRINCIPAL_RUN||op.admitGeometry)fail('UNSUPPORTED_FRAME_PARENT','The principal source implementation changed.');}
  else if(entry.type===SOURCE_FRAME_TYPE){captureSourceFrameParameters(entry.params);if(op.run!==sourceFrameRun)fail('UNSUPPORTED_FRAME_PARENT','The custom source implementation changed.');}
  else fail('UNSUPPORTED_FRAME_PARENT','Only authored source-plane parents are supported.');
  let depth=0,walk=entry;while(walk.type===SOURCE_FRAME_TYPE){if(++depth>16)fail('RESOURCE_LIMIT','Source attachment depth exceeds16.');const a=captureSourceFrameParameters(walk.params);if(!a.parent)break;const next=history.findIndex((v:any)=>canonicalAuthoredFeatureId(v.params.featureId)===a.parent.featureId);if(next<0||next>=history.indexOf(walk))fail('INVALID_FRAME_DEPENDENCY','Source parents must be earlier and acyclic.');walk=history[next];}if(walk.type==='PLANE'&&++depth>16)fail('RESOURCE_LIMIT','Source attachment depth exceeds16.');
  parentFrame=sketchBoundaryFrame(parent);
 }
 const parentText=parent?JSON.stringify(parentFrame):null,parameterText=JSON.stringify(p);
 const current=()=>{owner.requireCurrent();if(ctx.operationService.get(SOURCE_FRAME_TYPE).run!==sourceFrameRun||JSON.stringify(captureSourceFrameParameters(raw))!==parameterText||ctx.authoredEvaluationHistory!==history||p.parent&&(ctx.cadRegistry.findFace(p.parent.faceId)!==parent||JSON.stringify(sketchBoundaryFrame(parent))!==parentText))throw new DOMException('Source parent changed.','AbortError');};
 current();const reply:any=await runSourceFramePreparation(workerUrl,{revision:crypto.randomUUID(),mode:'derive',parameters:p,parentFrame},{signal:owner.signal,valid:()=>{try{current();return true;}catch{return false;}}});current();
 const f=reply.frame,vector=(v:number[])=>new Vector(v[0],v[1],v[2]),csys=new CSys(vector(f.origin),vector(f.x),vector(f.y),vector(f.z)),plane=new Plane(csys.z as any,csys.z.dot(csys.origin));
 const model=new MOpenFaceShell(new PlaneSurfacePrototype(plane),csys,sourcePlaneShellId(raw,params.featureId)),source=ctx.sketchStorageService.getSketchData(model.face.id);
 if(source===null)fail('UNRESOLVED_SOURCE','The independent custom source has no saved sketch.');
 if(source!==null){await runSourceFramePreparation(workerUrl,{revision:crypto.randomUUID(),mode:'reframe',sketchJSON:source,beforeFrame:f,afterFrame:f,candidateJSON:source},{signal:owner.signal,valid:()=>{try{current();return true;}catch{return false;}}});current();}
 return{consumed:[],created:[model]};
};
export default {id:SOURCE_FRAME_TYPE,label:'Source frame',info:'Explicit numeric source frame and earlier source-plane attachment.',icon:standardPlaneOperation.icon,form:[],schema:{featureId:{type:Types.number}},admitGeometry:()=>{},paramsInfo:()=>'(source frame)',run:sourceFrameRun};

// Internal producer identity, never a caller-supplied native locator.
export const sourceFrameFaceId=sourcePlaneFaceId;
