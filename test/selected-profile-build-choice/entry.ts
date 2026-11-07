// Actual discovery services and model/frame classes. The edit callback is an
// explicit protocol double until root wires the real prepared suffix replay.
import {HeadlessSketchWorkspace} from '../../web/app/sketcher/headless/workspace';
import {createSelectedProfileRegionCommands} from '../../web/app/cad/craft/selectedProfileRegionCommands';
import {createSelectedProfileCommands} from '../../web/app/cad/craft/selectedProfileCommands';
import {createSelectedProfileDepthCommands} from '../../web/app/cad/craft/selectedProfileDepthCommands';
import {MOpenFaceShell} from '../../web/app/cad/model/mopenFace';
import {PlaneSurfacePrototype} from '../../web/app/cad/model/surfacePrototype';
import {Plane} from '../../modules/geom/impl/plane';
import {sketchBoundaryFrame} from '../../web/app/cad/sketch/boundaryValidity';
import {OCC_BOOLEAN_HISTORY_BUILD,OCC_SELECTED_PROFILE_BUILD,OCC_STEP_EXPORT_BUILD} from '../../modules/engine/mount/engineCatalog.mjs';
import {emptyAuthoredEditJournal,recordSelectedProfileRegionEdit} from '../../web/app/cad/craft/authoredEditJournal.mjs';
export {runSketchSolve} from '../../web/app/sketcher/headless/client';
export {HeadlessSketchWorkspace};
export {requireSelectedProfileBuild} from '../../modules/engine/mount/selectedProfileBuildSelection.mjs';
export const stepRevision=OCC_STEP_EXPORT_BUILD.revision;
export const defaultRevision=OCC_BOOLEAN_HISTORY_BUILD.revision;
export const legacyRevision=OCC_SELECTED_PROFILE_BUILD.revision;
const stream=value=>({value,revision:1});
export function fixture(input,{featureCount=1,engineRevision=OCC_BOOLEAN_HISTORY_BUILD.revision,buildPolicy=null}={}){
 const plane=new MOpenFaceShell(new PlaneSurfacePrototype(Plane.XY)),face=plane.face,frame=sketchBoundaryFrame(face);plane.originatingOperation=0;
 let source=JSON.stringify({...structuredClone(input),metadata:{...input.metadata,boundaryFrame:frame}}),version=1,creationCounter=1,journalCounter=0,journal=emptyAuthoredEditJournal(1,0),callbackHook=null;
 const doc=new AbortController(),events={callbacks:[],accepted:0},p={version:1,unit:'millimeter',engine:'occ',engineRevision,featureId:2,faceId:face.id,regionId:'sketch-region:unit-initial',depth:5,bodyPolicy:'separate'},history=[{type:'PLANE',params:{featureId:1,orientation:'XY',depth:0,datum:null}},...Array.from({length:featureCount},(_,i)=>({type:'WORKER_SELECTED_PROFILE_EXTRUDE_V2',params:{...p,featureId:i+2}}))];
 const project={documentGeneration:1,documentSignal:doc.signal,hasHostLifetime:true,sketchStorageNamespace:'test-sketch/',sketchStorageKey:id=>'test-sketch/'+id,isDocumentCurrent:g=>g===1&&!doc.signal.aborted,counterGenerator:{generateFeatureId(){events.allocated=(events.allocated||0)+1;return 99;},releaseFeatureId(){events.released=(events.released||0)+1;},projectCounters:{featureId:featureCount+1}}};
 const storage={getAllKeysFromNamespace:()=>['test-sketch/'+face.id],versionOf:()=>version};
 const craft:any={evaluationEpoch:1,inspectRectangleCreation:()=>({ready:!doc.signal.aborted,reason:null,revision:'creation:'+creationCounter}),inspectAuthoredEdits:()=>({revision:'authored:'+journal.revision+':'+journalCounter+':'+version,canUndo:journal.cursor>0,canRedo:journal.cursor<journal.entries.length}),modifications$:stream({history,pointer:history.length-1}),models$:stream([plane]),pipelineFailure$:stream(null),engineCleanupFailure$:stream(null)};
 const ctx:any={projectService:project,storageService:storage,sketchStorageService:{getAllSketches:()=>[{id:face.id}],getSketchData:id=>id===face.id?source:null},cadRegistry:{findFace:id=>id===face.id?face:null},craftService:craft,expressionService:{isTyped:false,script$:stream(''),table$:stream({}),list$:stream([]),errors$:stream([])},projectManager:{unit:'millimeter'},operationService:{get:id=>({id})},services:{sketcher:{inPlaceEditor:{inEditMode:false}}},streams:{sketcher:{sketchingFace:stream(null)}},wizardService:{workingRequest$:stream(null)},workbenchService:{defaultWorkbenchId:'default',currentWorkbench$:stream({internal:true})},assemblyService:{constraints$:stream([])}};
 Object.assign(craft,createSelectedProfileCommands(ctx,(op,resolve,reject)=>{events.callbacks.push(structuredClone(op));reject(Object.assign(Error('Error-only submit: native not run'),{code:'NATIVE_NOT_RUN'}));},()=>{},buildPolicy),createSelectedProfileDepthCommands(ctx));
 return {ctx,face,plane,doc,events,source};
}
