export {ReadSketch} from '../../web/app/cad/sketch/sketchReader';
export {createCandidateSketchStorage} from '../../web/app/cad/craft/candidateSketchStorage.mjs';
export {getSketchBoundaries} from '../../web/app/cad/sketch/sketchBoundaries';
import {createSourcePlaneDepthCommands} from '../../web/app/cad/craft/sourcePlaneDepthCommands';
import planeOperation from '../../modules/workbenches/modeler/features/plane/simplePlaneOperation';
import {MObjectIdGenerator} from '../../web/app/cad/model/mobject';
import {MOpenFaceShell} from '../../web/app/cad/model/mopenFace';
import {sketchBoundaryFrame} from '../../web/app/cad/sketch/boundaryValidity';
export {runSketchSolve} from '../../web/app/sketcher/headless/client';
export {runSourcePlaneDepthPreparation} from '../../web/app/sketcher/headless/sourcePlaneDepthClient';
export {MOpenFaceShell,sketchBoundaryFrame};
export {sameSketchSaveFrame} from '../../web/app/cad/craft/unconsumedSketchSave.mjs';
export function realPlane(orientation:string,depth:number){MObjectIdGenerator.pushContext('');try{const m=planeOperation.run({orientation,depth,datum:null},{cadRegistry:null}).created[0];m.originatingOperation=0;return m;}finally{MObjectIdGenerator.popContext();}}
const stream=value=>({value,revision:1});
// Actual plane operation/classes, production Worker/client/service. No native
// output or successful shared publication is fabricated: submit always refuses.
export function fixture(source:string,orientation='XY',depth=0){
 const model=realPlane(orientation,depth),face=model.face,id=face.id,frame=sketchBoundaryFrame(face),key='plane-test/'+id,document=new AbortController();let text=source,version=1,material='m:1',valid=true;const events={submitted:[],writes:[],discards:0,commits:0,cancelled:0};let candidateCheck:any=null;
 const history={history:[{type:'PLANE',params:{featureId:'1',orientation,depth,datum:null}}],pointer:0},craft:any={evaluationEpoch:1,inspectRectangleCreation:()=>({ready:true,reason:null,revision:'geometry:1'}),inspectAuthoredEdits:()=>({revision:'journal:1'}),modifications$:stream(history),models$:stream([model]),pipelineFailure$:stream(null),engineCleanupFailure$:stream(null)};
 const storage={getAllKeysFromNamespace:namespace=>namespace==='plane-test/'?[key]:[],versionOf:k=>k===key?version:null,get:k=>k===key?text:null,prepareWrites(changes){events.writes.push(changes);let discarded=false;return{isCurrent:()=>true,commit(){events.commits++;throw Error('Publication is not executed by this component fixture');},discard(){if(!discarded){discarded=true;events.discards++;}}}}};
 const project={documentGeneration:1,documentSignal:document.signal,hasHostLifetime:true,sketchStorageNamespace:'plane-test/',sketchStorageKey:x=>'plane-test/'+x,isDocumentCurrent:g=>g===1&&!document.signal.aborted};
 const ctx:any={projectService:project,storageService:storage,craftService:craft,sketchStorageService:{getSketchData:x=>x===id?text:null,getAllSketches:()=>[{id}]},cadRegistry:{findFace:x=>x===id?face:null},operationService:{get:()=>planeOperation},expressionService:{isTyped:false,script$:stream(''),table$:stream({}),list$:stream([]),errors$:stream([])},projectManager:{unit:'millimeter',isRestoring:false,inspectMaterialSurfaceRevision:()=>material},services:{sketcher:{inPlaceEditor:{inEditMode:false}}},streams:{sketcher:{sketchingFace:stream(null)}},wizardService:{workingRequest$:stream(null)},workbenchService:{currentWorkbench$:stream({internal:true})},assemblyService:{constraints$:stream([])}};
 const api=createSourcePlaneDepthCommands(ctx,async(yes,no,preparation,intent)=>{events.submitted.push({preparation,intent});try{if(candidateCheck){const next={history:structuredClone(history.history),pointer:0};next.history[0].params.depth=intent.afterDepth;const candidate=realPlane(orientation,intent.afterDepth);await candidateCheck({candidate,preparation,intent,next});const prepared=await preparation.prepare([candidate],next);prepared?.discard();}no(Object.assign(Error('Native/shared publication deliberately not executed'),{code:'NATIVE_NOT_RUN'}));}catch(error){no(error);}},()=>events.cancelled++);
 return{api,ctx,id,frame,model,events,request:newDepth=>({revision:'journal:1',index:0,featureId:1,faceId:id,depth:newDepth}),valid:()=>valid,close:()=>document.abort(),invalidate:()=>{valid=false},source:()=>text,setSource(value){text=value;version++},bumpMaterial:()=>material+='x',setCandidateCheck:fn=>candidateCheck=fn};
}
