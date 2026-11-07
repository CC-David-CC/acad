// Actual operation/model/Worker clients. The evaluator is an explicit refusal
// boundary until a qualified native mount is integrated; never fake a solid.
import {createWorkerSelectedSweepOperation} from '../../modules/workbenches/modeler/features/workerSelectedSweep/workerSelectedSweep.operation';
import {MOpenFaceShell} from '../../web/app/cad/model/mopenFace';
import {PlaneSurfacePrototype} from '../../web/app/cad/model/surfacePrototype';
import {Plane} from '../../modules/geom/impl/plane';
import {sketchBoundaryFrame} from '../../web/app/cad/sketch/boundaryValidity';
export {runSketchSolve} from '../../web/app/sketcher/headless/client';
export {runPrismSemantic} from '../../modules/engine/extrusion/prismSemanticClient';
export const revision='sha256:'+'a'.repeat(64)+':'+'b'.repeat(64);
const stream=value=>({value,revision:1});
export function fixture(sources){
 const profilePlane=new MOpenFaceShell(new PlaneSurfacePrototype(new Plane(Plane.XY.normal,0))),pathPlane=new MOpenFaceShell(new PlaneSurfacePrototype(new Plane(Plane.XZ.normal,0))),planes=[profilePlane,pathPlane],faces=new Map(planes.map(p=>[p.face.id,p.face])),sourceMap=new Map([[profilePlane.face.id,sources.profile],[pathPlane.face.id,sources.path]]),versions=new Map([...sourceMap.keys()].map(id=>[id,1]));
 const controller=new AbortController(),calls=[],hooks=[],events={closes:0,checks:0};let epoch=1,evaluateHook=null;
 const owner={signal:controller.signal,requireCurrent(){events.checks++;if(controller.signal.aborted)throw new DOMException('Candidate closed','AbortError');},close(){if(!controller.signal.aborted){events.closes++;controller.abort();}},addPublicationCheck(label,check){hooks.push({label,check});}};
 const project={hasHostLifetime:true,documentGeneration:1,sketchStorageNamespace:'owned/',isDocumentCurrent:g=>g===project.documentGeneration&&!controller.signal.aborted},storage={revision:1,getAllKeysFromNamespace:()=>[...sourceMap.keys()].map(id=>'owned/'+id),versionOf:key=>versions.get(key.slice(6))};
 const craft={evaluationEpoch:epoch,modifications$:stream({history:[],pointer:-1})},expressions={isTyped:false,script$:stream(''),table$:stream({}),list$:stream([]),errors$:stream([])},registry={isEvaluating:true,findFace:id=>faces.get(id)},sketchStorage={getSketchData:id=>sourceMap.get(id)};
 const ctx:any={engineEvaluation:owner,projectService:project,storageService:storage,craftService:craft,expressionService:expressions,projectManager:{unit:'millimeter'},cadRegistry:registry,sketchStorageService:sketchStorage};
 const operation=createWorkerSelectedSweepOperation({evaluate:async input=>{calls.push(input);if(evaluateHook)return evaluateHook(input);throw Object.assign(Error('Native evaluation intentionally not run'),{code:'NATIVE_NOT_RUN'});},buildPolicy:{requireBuild:()=>({id:'occ',revision,sweepVersion:1}),historyBuild:()=>null}});
 const params={version:1,unit:'millimeter',engine:'occ',engineRevision:revision,featureId:3,faceId:profilePlane.face.id,regionId:'sketch-region:not-discovered-yet',pathFaceId:pathPlane.face.id,pathCurves:sources.pathCurves,transport:'corrected-frenet',bodyPolicy:'separate'};
 return{ctx,operation,params,owner,controller,calls,hooks,events,planes,faces,sourceMap,versions,frame:sketchBoundaryFrame(profilePlane.face),pathFrame:sketchBoundaryFrame(pathPlane.face),setEvaluateHook(fn){evaluateHook=fn;},setSource(id,value){sourceMap.set(id,value);versions.set(id,versions.get(id)+1);},close(){owner.close();}};
}
export function sourceFrames(){const f=fixture({profile:'',path:'',pathCurves:[]});const result={profile:f.frame,path:f.pathFrame};f.close();return result;}
