// Component services/model planes are real classes. Shared submit deliberately
// refuses NativeNotRun: this fixture never synthesizes an accepted solid.
import {createWorkerLoftCommands} from '../../web/app/cad/craft/workerLoftCommands';
import {MOpenFaceShell} from '../../web/app/cad/model/mopenFace';
import {PlaneSurfacePrototype} from '../../web/app/cad/model/surfacePrototype';
import {Plane} from '../../modules/geom/impl/plane';
import {sketchBoundaryFrame} from '../../web/app/cad/sketch/boundaryValidity';
import {listLoftBuilds,requireLoftBuild,genericHistoryBuild} from '../../modules/engine/mount/selectedProfileBuildSelection.mjs';
import {selectedProfileHistoryBudget} from '../../modules/engine/mount/selectedProfileBudget.mjs';
import {OCC_LOFT_PROFILE_BUILD,OCC_SWEEP_PROFILE_BUILD} from '../../modules/engine/mount/engineCatalog.mjs';
export {runSketchSolve} from '../../web/app/sketcher/headless/client';
export const revision=OCC_LOFT_PROFILE_BUILD.revision,oldRevision=OCC_SWEEP_PROFILE_BUILD.revision;
const stream=value=>({value,revision:1});
export function fixture(input,staged=true){
 const a=new MOpenFaceShell(new PlaneSurfacePrototype(Plane.XY)),b=new MOpenFaceShell(new PlaneSurfacePrototype(new Plane(Plane.XY.normal,30))),faces=[a.face,b.face],frames=faces.map(sketchBoundaryFrame);a.originatingOperation=0;b.originatingOperation=1;
 let sources=input??['',''],version=1,creation=1;const doc=new AbortController(),events={submitted:[],allocated:0,released:0};
 const history=[{type:'PLANE',params:{featureId:1,orientation:'XY',depth:0,datum:null}},{type:'PLANE',params:{featureId:2,orientation:'XY',depth:30,datum:null}}];
 const project={documentGeneration:1,documentSignal:doc.signal,hasHostLifetime:true,sketchStorageNamespace:'test-sketch/',isDocumentCurrent:g=>g===1&&!doc.signal.aborted,counterGenerator:{generateFeatureId(){events.allocated++;return'3';},releaseFeatureId(){events.released++;}}};
 const craft:any={evaluationEpoch:1,inspectRectangleCreation:()=>({ready:!doc.signal.aborted,reason:null,revision:'creation:'+creation}),modifications$:stream({history,pointer:0}),models$:stream([a,b]),pipelineFailure$:stream(null),engineCleanupFailure$:stream(null)};
 const ctx:any={projectService:project,storageService:{getAllKeysFromNamespace:()=>faces.map(f=>'test-sketch/'+f.id),versionOf:()=>version},sketchStorageService:{getSketchData:id=>sources[faces.findIndex(f=>f.id===id)]??null},cadRegistry:{findFace:id=>faces.find(f=>f.id===id)},craftService:craft,expressionService:{isTyped:false,script$:stream(''),table$:stream({}),list$:stream([]),errors$:stream([])},projectManager:{unit:'millimeter'},operationService:{get:id=>({id})},services:{sketcher:{inPlaceEditor:{inEditMode:false}}},streams:{sketcher:{sketchingFace:stream(null)}},wizardService:{workingRequest$:stream(null)},workbenchService:{currentWorkbench$:stream({internal:true})},assemblyService:{constraints$:stream([])}};
 const commands=createWorkerLoftCommands(ctx,(request,_yes,no)=>{events.submitted.push(request);no(Object.assign(Error('Native publication deliberately not executed'),{code:'NATIVE_NOT_RUN'}));},()=>{},{listBuilds:staged?listLoftBuilds:()=>[],requireBuild:staged?requireLoftBuild:()=>{throw Object.assign(Error('Loft not staged'),{code:'ENGINE_BUILD_UNAVAILABLE'});},historyBuild:genericHistoryBuild,budget:selectedProfileHistoryBudget});
 return{ctx,commands,faces,frames,events,setSource(i,s){sources=sources.slice();sources[i]=s;version++;},bumpCreation(){creation++;},close(){doc.abort();}};
}
