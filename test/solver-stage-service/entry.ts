// Actual service, model/solver constructors and shared capture; test host and
// storage/session transport only. No browser UI or authored app mutation.
import {createSketchDiagnosticService} from '../../web/app/cad/sketch/sketchDiagnosticService';
import {HeadlessSketchWorkspace} from '../../web/app/sketcher/headless/workspace';
import {MOpenFaceShell} from '../../web/app/cad/model/mopenFace';
import {PlaneSurfacePrototype} from '../../web/app/cad/model/surfacePrototype';
import {Plane} from '../../modules/geom/impl/plane';
import {sketchBoundaryFrame} from '../../web/app/cad/sketch/boundaryValidity';
import {evaluatePhysicalSource} from '../../web/app/cad/parameters/evaluatePhysicalSource.mjs';
import {decodePhysicalSource} from '../../web/app/cad/parameters/physicalSource.mjs';
import {prepareTypedDependentSketch} from '../../web/app/sketcher/headless/typedDependentSketch.mjs';
const stream=value=>({value,revision:1});
export function fixture(input,run,{active=false,parameterSource=null}={}){
 const plane=new MOpenFaceShell(new PlaneSurfacePrototype(Plane.XY)),face=plane.face,frame=sketchBoundaryFrame(face),boundary={lines:[],arcs:[],circles:[],nurbses:[]};
 const native={...structuredClone(input),metadata:{boundaryFrame:frame}},typed=parameterSource!==null;
 let source=JSON.stringify(native),version=1,physicalCurrent=true;
 const external=active&&typed?prepareTypedDependentSketch(native,name=>{const result=evaluatePhysicalSource(decodePhysicalSource(parameterSource)),row=result.values.find(row=>row.name===name);if(!row||row.dimension!=='length')throw Error('Typed length expected');return row.value;}):{};
 const workspace=active?new HeadlessSketchWorkspace(external):null;if(workspace)workspace.io._loadSketch(structuredClone(native),{strict:true});
 const editor={inEditMode:active,face:active?face:null,viewer:active?workspace:null,boundaryAtOpen:boundary,boundaryFrameAtOpen:frame};
 const doc=new AbortController(),project={documentGeneration:1,documentSignal:doc.signal,hasHostLifetime:true,sketchStorageNamespace:'test-sketch/',sketchStorageKey:id=>'test-sketch/'+id,isDocumentCurrent:g=>g===1&&!doc.signal.aborted};
 const storage={namespaceRevision:()=>version,versionOf:()=>version},sketchStorage={getAllSketches:()=>[{id:face.id}],getSketchData:id=>id===face.id?source:null};
 const craft={isProcessing:false,evaluationEpoch:1,modifications$:stream({history:[{type:'PLANE',params:{featureId:1,orientation:'XY',depth:0,datum:null}}],pointer:0}),models$:stream([plane]),pipelineFailure$:stream(null),engineCleanupFailure$:stream(null)};
 const expressions={isTyped:typed,script$:stream(parameterSource||''),table$:stream({}),list$:stream([]),errors$:stream([]),hasCurrentPhysicalResult:()=>physicalCurrent};
 const ctx={projectService:project,storageService:storage,sketchStorageService:sketchStorage,cadRegistry:{findFace:id=>id===face.id?face:null},craftService:craft,expressionService:expressions,projectManager:{unit:'millimeter'},services:{sketcher:{inPlaceEditor:editor}},streams:{sketcher:{sketchingFace:stream(active?face:null)}},wizardService:{workingRequest$:stream(null)}};
 const service=createSketchDiagnosticService(ctx,run,'/static/actual-solver-worker.js');
 return{ctx,service,face,plane,workspace,editor,doc,native,frame,get source(){return source;},bumpVersion(){version++;},setSource(value){source=value;version++;},setPhysicalCurrent(value){physicalCurrent=value;},close(){doc.abort();}};
}
