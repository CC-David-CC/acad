// Exact production service + real history/build/budget helpers. Explicit target,
// metadata/services are ADMISSION DOUBLES only. Evaluator always throws: there
// is no successful classification, native geometry or public authoring result.
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {getEventListeners} from 'node:events';
import * as historyCapture from '../../web/app/cad/craft/capturePipelineHistory.mjs';
import * as sketchStamp from '../../web/app/cad/craft/sketchRevision.mjs';
import * as kinds from '../../modules/engine/solid/authoredSolidKinds.mjs';
import * as catalog from '../../modules/engine/mount/engineCatalog.mjs';
import * as buildSelection from '../../modules/engine/mount/selectedProfileBuildSelection.mjs';
import * as budget from '../../modules/engine/mount/selectedProfileBudget.mjs';
const require=createRequire(import.meta.url),ts=require('typescript');
export const source=readFileSync(new URL('../../web/app/cad/craft/workerSolidPointCommands.ts',import.meta.url),'utf8');
export const nativeRemove=Object.getPrototypeOf(AbortSignal.prototype).removeEventListener;
const standardPlaneOperation={run(){throw Error('No plane geometry in this fixture');}};
class AdmissionTargetDouble{}
const imports={'../model/mworkerSolid':{MWorkerSolid:AdmissionTargetDouble},'../model/mopenFace':{MOpenFaceShell:class{}},'../sketch/sketchReader':{ReadSketch(){throw Error('No sketch in error-only fixture');}},'../sketch/boundaryValidity':{sketchBoundaryFrame(){throw Error('No plane in error-only fixture');}},'./capturePipelineHistory.mjs':historyCapture,'./sketchRevision.mjs':sketchStamp,'engine/solid/authoredSolidKinds.mjs':kinds,'engine/mount/engineCatalog.mjs':catalog,'engine/mount/selectedProfileBuildSelection.mjs':buildSelection,'engine/mount/selectedProfileBudget.mjs':budget,'workbenches/modeler/features/plane/simplePlaneOperation':{default:standardPlaneOperation}};
export function loadService({AbortSignalClass=AbortSignal,logger=console}={}){const module={exports:{}};vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module,exports:module.exports,require:id=>{if(!imports[id])throw Error('Unexpected import '+id);return imports[id];},AbortController,AbortSignal:AbortSignalClass,DOMException,setTimeout,clearTimeout,setInterval,clearInterval,TextEncoder,console:logger});return module.exports.createWorkerSolidPointCommands;}
const factory=loadService(),stream=value=>({value,revision:1});
export function fixture({error=Object.assign(Error('NATIVE_NOT_RUN'),{code:'NATIVE_NOT_RUN'}),create=factory,evaluator}={}){
 const build=catalog.OCC_SWEEP_PROFILE_BUILD,document=new AbortController(),runtime=Object.freeze({jsSha256:build.runtimeAssets.jsSha256,wasmSha256:build.runtimeAssets.wasmSha256}),metrics=Object.freeze({admissionDoubleNotNativeEvidence:true,resultKind:'single-solid',solidCount:1,nativeValidity:{valid:true},runtime}),identity=[1,0,0,0,0,1,0,0,0,0,1,0],matrixKeys=['mxx','mxy','mxz','tx','myx','myy','myz','ty','mzx','mzy','mzz','tz'],target=new AdmissionTargetDouble(),history={history:[{type:'WORKER_SOLID_BOX_V1',params:{version:1,unit:'millimeter',engine:'occ',engineRevision:build.revision,featureId:1,origin:[0,0,0],dimensions:[1,1,1]}}],pointer:0};
 Object.assign(target,{id:'admission-double-target',featureId:1,inspectKernelMetrics:()=>metrics,location$:stream(Object.fromEntries(matrixKeys.map((k,i)=>[k,identity[i]]))),csys:{origin:{x:0,y:0,z:0},x:{x:1,y:0,z:0},y:{x:0,y:1,z:0},z:{x:0,y:0,z:1}}});
 const row={id:target.id,featureId:1,engine:'occ',metrics,placement:identity},info={ready:true,reason:null,revision:'point-fixture:1',bodies:[row]},craft={inspectWorkerSolids:()=>info,evaluationEpoch:1,modifications$:stream(history),models$:stream([target]),pipelineFailure$:stream(null),engineCleanupFailure$:stream(null)},project={documentSignal:document.signal,hasHostLifetime:true,documentGeneration:1,isDocumentCurrent:g=>g===1&&!document.signal.aborted,sketchStorageNamespace:'point-fixture/',counterGenerator:{projectCounters:{featureId:2}}},storage={revision:1,getAllKeysFromNamespace:()=>[],versionOf:()=>null},descriptor={run(){throw Error('No native operation in service fixture');}},ctx={craftService:craft,projectService:project,storageService:storage,sketchStorageService:{getAllSketches:()=>[],getSketchData(){throw Error('No sketch expected');}},cadRegistry:{find:id=>id===target.id?target:null,findFace:()=>null},projectManager:{unit:'millimeter',isRestoring:false},expressionService:{isTyped:false,script$:stream(''),table$:stream({}),list$:stream([]),errors$:stream([])},operationService:{get:()=>descriptor},streams:{sketcher:{sketchingFace:stream(null)}},wizardService:{workingRequest$:stream(null)},workbenchService:{currentWorkbench$:stream(null)},assemblyService:{constraints$:stream([])}};
 const calls=[],api=create(ctx,async input=>{calls.push(input);if(evaluator)return evaluator(input);throw error;});
 return{api,ctx,document,target,metrics,history,error,calls,request:{revision:info.revision,version:1,unit:'millimeter',engine:'occ',engineRevision:build.revision,bodyId:target.id,featureId:1,points:[[0,0,0]]},close(){document.abort();},snapshot(){return{history:JSON.stringify(history),featureId:project.counterGenerator.projectCounters.featureId,epoch:craft.evaluationEpoch,models:craft.models$.value,targetMetrics:target.inspectKernelMetrics(),pipelineFailure:craft.pipelineFailure$.value,engineCleanupFailure:craft.engineCleanupFailure$.value};}};
}
export const listenerCount=signal=>getEventListeners(signal,'abort').length;
export function release(signal){for(const fn of getEventListeners(signal,'abort'))nativeRemove.call(signal,'abort',fn);}
export function counted(signal){const add=signal.addEventListener,remove=signal.removeEventListener,counts={adds:0,removes:0};Object.defineProperties(signal,{addEventListener:{configurable:true,value(...args){counts.adds++;return add.apply(this,args);}},removeEventListener:{configurable:true,value(...args){counts.removes++;return remove.apply(this,args);}}});return counts;}
