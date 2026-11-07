// Real command/source discovery and model plane; submit/edit are explicit
// routing doubles, never a successful native/model publication.
import {createWorkerSweepCommands} from '../../web/app/cad/craft/workerSweepCommands';
import {MOpenFaceShell} from '../../web/app/cad/model/mopenFace';
import {PlaneSurfacePrototype} from '../../web/app/cad/model/surfacePrototype';
import {Plane} from '../../modules/geom/impl/plane';
import {sketchBoundaryFrame} from '../../web/app/cad/sketch/boundaryValidity';
import {listSweepBuilds,requireSweepBuild,genericHistoryBuild} from '../../modules/engine/mount/selectedProfileBuildSelection.mjs';
import {selectedProfileHistoryBudget} from '../../modules/engine/mount/selectedProfileBudget.mjs';
import {OCC_SWEEP_PROFILE_BUILD,OCC_REVOLVE_PROFILE_BUILD} from '../../modules/engine/mount/engineCatalog.mjs';
export {runSketchSolve} from '../../web/app/sketcher/headless/client';
export const revision=OCC_SWEEP_PROFILE_BUILD.revision,oldRevision=OCC_REVOLVE_PROFILE_BUILD.revision;
const stream=value=>({value,revision:1});
export function fixture(input){
 const plane=new MOpenFaceShell(new PlaneSurfacePrototype(Plane.XY)),pathPlane=new MOpenFaceShell(new PlaneSurfacePrototype(Plane.XZ)),face=plane.face,pathFace=pathPlane.face,frame=sketchBoundaryFrame(face),pathFrame=sketchBoundaryFrame(pathFace);plane.originatingOperation=0;pathPlane.originatingOperation=1;
 let source=input?.profile??input,pathSource=input?.path??input,version=1,creation=1,journal=1;const doc=new AbortController(),events={submitted:[],edits:[],allocated:0,released:0};
 const history=[{type:'PLANE',params:{featureId:1,orientation:'XY',depth:0,datum:null}},{type:'PLANE',params:{featureId:2,orientation:'XZ',depth:0,datum:null}}];
 const project={documentGeneration:1,documentSignal:doc.signal,hasHostLifetime:true,sketchStorageNamespace:'test-sketch/',isDocumentCurrent:g=>g===1&&!doc.signal.aborted,counterGenerator:{generateFeatureId(){events.allocated++;return '3';},releaseFeatureId(){events.released++;}}};
 const craft:any={evaluationEpoch:1,inspectRectangleCreation:()=>({ready:!doc.signal.aborted,reason:null,revision:'creation:'+creation}),inspectAuthoredEdits:()=>({revision:'journal:'+journal}),modifications$:stream({history,pointer:0}),models$:stream([plane,pathPlane]),pipelineFailure$:stream(null),engineCleanupFailure$:stream(null)};
 const ctx:any={projectService:project,storageService:{getAllKeysFromNamespace:()=>['test-sketch/'+face.id,'test-sketch/'+pathFace.id],versionOf:()=>version},sketchStorageService:{getSketchData:id=>id===face.id?source:id===pathFace.id?pathSource:null},cadRegistry:{findFace:id=>id===face.id?face:id===pathFace.id?pathFace:null},craftService:craft,expressionService:{isTyped:false,script$:stream(''),table$:stream({}),list$:stream([]),errors$:stream([])},projectManager:{unit:'millimeter'},operationService:{get:id=>({id})},services:{sketcher:{inPlaceEditor:{inEditMode:false}}},streams:{sketcher:{sketchingFace:stream(null)}},wizardService:{workingRequest$:stream(null)},workbenchService:{currentWorkbench$:stream({internal:true})},assemblyService:{constraints$:stream([])}};
 const commands=createWorkerSweepCommands(ctx,(request,_yes,no)=>{events.submitted.push(request);no(Object.assign(Error('Native publication intentionally not executed'),{code:'NATIVE_NOT_RUN'}));},()=>{},{listBuilds:listSweepBuilds,requireBuild:requireSweepBuild,historyBuild:genericHistoryBuild,budget:selectedProfileHistoryBudget});
 return{ctx,commands,face,frame,pathFace,pathFrame,events,setSource(s){source=s;version++;},setPathSource(s){pathSource=s;version++;},bumpCreation(){creation++;},bumpJournal(){journal++;},close(){doc.abort();}};
}
