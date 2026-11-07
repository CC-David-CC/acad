// Real command/source discovery and model plane; submit/edit are explicit
// routing doubles, never a successful native/model publication.
import {createWorkerRevolveCommands} from '../../web/app/cad/craft/workerRevolveCommands';
import {MOpenFaceShell} from '../../web/app/cad/model/mopenFace';
import {PlaneSurfacePrototype} from '../../web/app/cad/model/surfacePrototype';
import {Plane} from '../../modules/geom/impl/plane';
import {sketchBoundaryFrame} from '../../web/app/cad/sketch/boundaryValidity';
import {listRevolveBuilds,requireRevolveBuild,genericHistoryBuild} from '../../modules/engine/mount/selectedProfileBuildSelection.mjs';
import {selectedProfileHistoryBudget} from '../../modules/engine/mount/selectedProfileBudget.mjs';
import {OCC_REVOLVE_PROFILE_BUILD,OCC_BOOLEAN_HISTORY_BUILD} from '../../modules/engine/mount/engineCatalog.mjs';
export {runSketchSolve} from '../../web/app/sketcher/headless/client';
export const revision=OCC_REVOLVE_PROFILE_BUILD.revision,oldRevision=OCC_BOOLEAN_HISTORY_BUILD.revision;
const stream=value=>({value,revision:1});
export function fixture(input){
 const plane=new MOpenFaceShell(new PlaneSurfacePrototype(Plane.XY)),face=plane.face,frame=sketchBoundaryFrame(face);plane.originatingOperation=0;
 let source=input,version=1,creation=1,journal=1;const doc=new AbortController(),events={submitted:[],edits:[],allocated:0,released:0};
 const history=[{type:'PLANE',params:{featureId:1,orientation:'XY',depth:0,datum:null}}];
 const project={documentGeneration:1,documentSignal:doc.signal,hasHostLifetime:true,sketchStorageNamespace:'test-sketch/',isDocumentCurrent:g=>g===1&&!doc.signal.aborted,counterGenerator:{generateFeatureId(){events.allocated++;return '2';},releaseFeatureId(){events.released++;}}};
 const craft:any={evaluationEpoch:1,inspectRectangleCreation:()=>({ready:!doc.signal.aborted,reason:null,revision:'creation:'+creation}),inspectAuthoredEdits:()=>({revision:'journal:'+journal}),modifications$:stream({history,pointer:0}),models$:stream([plane]),pipelineFailure$:stream(null),engineCleanupFailure$:stream(null),async authoredRevolveAngleOperation(args,options){events.edits.push({args,options});return Object.freeze({changed:false,revision:'journal:'+journal});}};
 const ctx:any={projectService:project,storageService:{getAllKeysFromNamespace:()=>['test-sketch/'+face.id],versionOf:()=>version},sketchStorageService:{getSketchData:id=>id===face.id?source:null},cadRegistry:{findFace:id=>id===face.id?face:null},craftService:craft,expressionService:{isTyped:false,script$:stream(''),table$:stream({}),list$:stream([]),errors$:stream([])},projectManager:{unit:'millimeter'},operationService:{get:id=>({id})},services:{sketcher:{inPlaceEditor:{inEditMode:false}}},streams:{sketcher:{sketchingFace:stream(null)}},wizardService:{workingRequest$:stream(null)},workbenchService:{currentWorkbench$:stream({internal:true})},assemblyService:{constraints$:stream([])}};
 const commands=createWorkerRevolveCommands(ctx,(request,_yes,no)=>{events.submitted.push(request);no(Object.assign(Error('Native publication intentionally not executed'),{code:'NATIVE_NOT_RUN'}));},()=>{},{listBuilds:listRevolveBuilds,requireBuild:requireRevolveBuild,historyBuild:genericHistoryBuild,budget:selectedProfileHistoryBudget});
 return{ctx,commands,face,frame,events,setSource(s){source=s;version++;},bumpCreation(){creation++;},bumpJournal(){journal++;},close(){doc.abort();}};
}
