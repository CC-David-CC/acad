// Real coordinator/solver/model classes; storage/replay/lifetime are explicit
// protocol doubles. No native solid geometry or public UI is simulated.
import {createClosedSketchTransitionCommands} from '../../web/app/cad/craft/closedSketchTransitions';
import {HeadlessSketchWorkspace} from '../../web/app/sketcher/headless/workspace';
import {MOpenFaceShell} from '../../web/app/cad/model/mopenFace';
import {PlaneSurfacePrototype} from '../../web/app/cad/model/surfacePrototype';
import {Plane} from '../../modules/geom/impl/plane';
import {sketchBoundaryFrame} from '../../web/app/cad/sketch/boundaryValidity';
import {evaluatePhysicalSource} from '../../web/app/cad/parameters/evaluatePhysicalSource.mjs';
import {decodePhysicalSource} from '../../web/app/cad/parameters/physicalSource.mjs';
import {emptyAuthoredEditJournal,recordSketchEdit,planSketchTravel} from '../../web/app/cad/craft/authoredEditJournal.mjs';
export {runSketchSolve} from '../../web/app/sketcher/headless/client';
export {runSketchTransition,verifyDrivingDimensionCandidate} from '../../web/app/sketcher/headless/transitionClient';
export {runClosedSketchInspection} from '../../web/app/sketcher/headless/inspectionClient';
export {HeadlessSketchWorkspace};
const stream=value=>({value,revision:1});
export function fixture(input,{parameterSource=null}={}){
 const plane=new MOpenFaceShell(new PlaneSurfacePrototype(Plane.XY)),face=plane.face;plane.originatingOperation=0;
 const frame=sketchBoundaryFrame(face),native={...structuredClone(input),metadata:{...input.metadata,boundaryFrame:frame}};
 let source=JSON.stringify(native),version=1,physicalCurrent=true,quantityOverride=null,afterPublication=null,travelCallback,journal=emptyAuthoredEditJournal(1,0);const doc=new AbortController(),events={prepares:0,commits:0,discards:0,cancels:0};
 const storage={getAllKeysFromNamespace:()=>['test-sketch/'+face.id],namespaceRevision:()=>version,versionOf:()=>version,prepareWrites(items){events.prepares++;const original=version;let done=false;return{isCurrent:()=>original===version,commit(){if(original!==version)throw Error('Stale fixture write');source=items[0].value;version++;done=true;events.commits++;},notify(){},discard(){if(!done)events.discards++;}};}};
 const project={documentGeneration:1,documentSignal:doc.signal,hasHostLifetime:true,sketchStorageNamespace:'test-sketch/',sketchStorageKey:id=>'test-sketch/'+id,isDocumentCurrent:g=>g===1&&!doc.signal.aborted};
 const craft={isProcessing:false,evaluationEpoch:1,inspectRectangleCreation:()=>({ready:!doc.signal.aborted,reason:null,revision:'fixture-craft'}),modifications$:stream({history:[{type:'PLANE',params:{featureId:1,orientation:'XY',depth:0,datum:null}}],pointer:0}),models$:stream([plane]),pipelineFailure$:stream(null),engineCleanupFailure$:stream(null)};
 const expressions={isTyped:parameterSource!==null,script$:stream(parameterSource||''),table$:stream({}),list$:stream([]),errors$:stream([]),hasCurrentPhysicalResult:()=>physicalCurrent,resolveQuantity(name,dimension){if(dimension!=='length')throw Error('Length required');if(quantityOverride)return quantityOverride(name);const row=evaluatePhysicalSource(decodePhysicalSource(expressions.script$.value)).values.find(v=>v.name===name);if(!row||row.dimension!=='length')throw Error('Typed length required');return row.value;}};
 const registry={findFace:id=>id===face.id?face:null};
 const ctx:any={projectService:project,storageService:storage,sketchStorageService:{getAllSketches:()=>[{id:face.id}],getSketchData:id=>id===face.id?source:null},cadRegistry:registry,craftService:craft,expressionService:expressions,projectManager:{unit:'millimeter',inspectMaterialSurfaceRevision:()=> 'fixture-material'},operationService:{},services:{sketcher:{inPlaceEditor:{inEditMode:false}}},streams:{sketcher:{sketchingFace:stream(null)}},wizardService:{workingRequest$:stream(null)},workbenchService:{defaultWorkbenchId:'default',currentWorkbench$:stream({internal:true,workbenchId:'default'})},assemblyService:{constraints$:stream([])}};
 async function publish(preparation){preparation.requireCurrent();const writes=await preparation.prepare([plane],{history:craft.modifications$.value.history});preparation.requireCurrent();if(!writes.isCurrent())throw Error('Stale fixture write');writes.commit();preparation.requireCommittedCurrent();}
 const commands=createClosedSketchTransitionCommands(ctx,(yes,no,preparation,entry)=>{void (async()=>{await publish(preparation);journal=recordSketchEdit(journal,{document:1,revision:journal.revision,faceId:entry.faceId,before:entry.before,after:entry.after});afterPublication?.();yes();})().catch(no);},()=>events.cancels++,cb=>{travelCallback=cb;});
 return{ctx,commands,face,plane,frame,doc,events,get source(){return source;},get journal(){return journal;},setSource(value){source=value;version++;},setAfterPublication(fn){afterPublication=fn;},setPhysicalCurrent(value){physicalCurrent=value;},setQuantityOverride(fn){quantityOverride=fn;},async travel(direction){const planned=planSketchTravel(journal,{document:1,revision:journal.revision,direction,faceId:face.id,currentBytes:source}),job=await travelCallback(face.id,source,planned.bytes,{signal:doc.signal,valid:()=>!doc.signal.aborted,committedValid:()=>!doc.signal.aborted});try{await publish(job.preparation);journal=planned.next;}finally{job.dispose();}},close(){doc.abort();}};
}
