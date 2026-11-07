import {createVolatileWorkspace} from '../../web/app/cad/storage/volatileWorkspace.mjs';
// Actual manager TS with explicit UI/storage/pipeline protocol doubles. Real
// codecs, lifetime helpers, validation Worker and incremental hashing remain.
// No CAD geometry or rendering is synthesized or qualified by this fixture.
import {installPureCaptureFixture} from '../generic-manufacturing-assignment/capture-model-fixture.mjs';
import assert from 'node:assert/strict';
import {Worker as NodeWorker} from 'node:worker_threads';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import * as genericMetadata from '../../web/app/cad/projectManager/genericManufacturingAssignment.mjs';
import * as historyCapture from '../../web/app/cad/craft/capturePipelineHistory.mjs';
import * as envelope from '../../web/app/cad/projectManager/projectEnvelope.mjs';
import * as display from '../../web/app/cad/projectManager/displayUnits.mjs';
import * as manufacturing from '../../web/app/cad/projectManager/manufacturingMetadata.mjs';
import * as source from '../../web/app/cad/parameters/physicalSource.mjs';
import * as expressions from '../../modules/gems/safeExpression.mjs';
import * as options from '../../web/app/cad/projectManager/captureDocumentJobOptions.mjs';
import * as restoreTiming from '../../web/app/cad/projectManager/restoreTimeout.mjs';
import * as failure from '../../web/app/cad/projectManager/failOwnedRestore.mjs';
import * as canonical from '../../web/app/cad/projectManager/incrementalCanonical.mjs';
import * as publication from '../../web/app/cad/projectManager/manufacturingPublicationClient.mjs';
import * as metadataPreparation from '../../web/app/cad/projectManager/documentMetadataPreparation.mjs';
import * as preparation from '../../web/app/cad/projectManager/workerSavePreparation.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..'),require=createRequire(import.meta.url),ts=require('/tmp/codi-typed-common-transaction-20261105/node_modules/typescript');
const unused=new Proxy({}, {get:(_t,key)=>()=>{throw Error('Unqualified unused import '+String(key));}}),stream=value=>({value,revision:0});
export function fixture({deferReplay=false}={}){
 const map=new Map(),terminations=[],workerReplies=[],workers={validation:0,hash:0,geometry:0,terminated:0};let controller=new AbortController(),generation=1,storageRevision=0,closed=false,host=true,loadFailure=false;
 const window=new EventTarget();window.location={search:'?webos=1'};
 class WorkerAdapter extends EventTarget {
  constructor(url){super();assert(['validation','hash'].includes(url),'No geometry Worker may be created');workers[url]++;this.kind=url;this.thread=new NodeWorker(resolve(root,'test/display-units/node-worker.cjs'),{workerData:{entry:url==='validation'?resolve(root,'.build/display-units/validation/worker.js'):resolve(root,'web/app/cad/projectManager/incrementalHashWorker.mjs'),verb:resolve(root,'web/lib/verb.js'),module:url==='hash'}});this.thread.on('message',data=>{workerReplies.push({kind:url,data:structuredClone(data)});const event=new MessageEvent('message',{data});this.onmessage?.(event);this.dispatchEvent(event);});this.thread.on('error',error=>{this.onerror?.(error);this.dispatchEvent(new Event('error'));});}
  postMessage(value,transfers){this.thread.postMessage(value,transfers);}
  terminate(){if(this.stopped)return;this.stopped=true;const p=this.thread.terminate().then(()=>workers.terminated++);terminations.push(p);}
 }
 const workspace=createVolatileWorkspace(),storage={versionOf:key=>workspace.versionOf(key),namespaceRevision:prefix=>workspace.namespaceRevision(prefix),get revision(){return workspace.revision;},get:key=>workspace.get(key),set(key,value){workspace.set(key,value);map.set(key,value);},remove(key){workspace.remove(key);map.delete(key);},getAllKeysFromNamespace:prefix=>workspace.getAllKeysFromNamespace(prefix),stageWrite(key,value){const before=workspace.get(key);this.set(key,value);return()=>{before===null?this.remove(key):this.set(key,before);return true;};}};
 const mods=stream({history:[],pointer:-1}),craft={modifications$:mods,isProcessing:false,isEditingHistory:false,pipelineFailure$:stream(null),engineCleanupFailure$:stream(null),evaluationEpoch:1,inspectRectangleCreation:()=>({revision:'craft-unchanged'})};
 const expression={script$:stream(''),list$:stream([]),errors$:stream([]),isTyped:false,hasCurrentPhysicalResult:()=>true};
 const ctx={services:{storage,ui:{registerFloatView(){}},sketcher:{inPlaceEditor:{inEditMode:false}}},storageService:storage,craftService:craft,expressionService:expression,cadRegistry:{shells:[]},streams:{operation:{registry:stream({})}},wizardService:{workingRequest$:stream(null)},workbenchService:{currentWorkbench$:stream({internal:true,workbenchId:'default'}),defaultWorkbenchId:'default'},assemblyService:{getConstraints:()=>[]},surfacingService:{state$:stream({revision:0}),scene:{surfaces:[]},save:()=>null}};
 const project={id:'owned-test',get documentGeneration(){return generation;},get documentSignal(){return controller.signal;},get hasHostLifetime(){return host;},isDocumentCurrent:g=>!closed&&!controller.signal.aborted&&g===generation,sketchStorageNamespace:'TCAD.projects.owned-test.sketch.',projectStorageKey:()=> 'TCAD.projects.owned-test',sketchStorageKey:id=>'TCAD.projects.owned-test.sketch.'+id,counterGenerator:{projectCounters:{featureId:0}},scheduleSave(){},save(){storage.set(this.projectStorageKey(),JSON.stringify(this.captureModel()));},beginDocumentChange(){controller.abort();controller=new AbortController();generation++;return generation;},dispose(){closed=true;controller.abort();},loadData(data,g){assert.equal(g,generation);ctx.projectManager.resetDocumentState(g);if(loadFailure)throw Error('Injected replay failure');expression.script$.value=data.expressions;mods.value={history:data.history,pointer:data.history.length-1};craft.isProcessing=deferReplay;},loadStrict(g){this.loadData(JSON.parse(storage.get(this.projectStorageKey())),g);}};
 ctx.projectService=project;installPureCaptureFixture(ctx,project);
 const dependencies={'../projectBundle':{PROJECTS_PREFIX:'TCAD.projects.',SKETCH_SUFFIX:'.sketch.'},'./genericManufacturingAssignment.mjs':genericMetadata,'./genericManufacturingBodies':unused,'../craft/capturePipelineHistory.mjs':historyCapture,'./ProjectManager':{ProjectManager:()=>null},'gems/exportTextData':unused,'sketcher/io':{validateProjectSketch(){throw Error('Use the actual validation Worker for nonempty sketches');}},'gems/safeExpression.mjs':expressions,'../parameters/physicalSource.mjs':source,'../parameters/candidateExpressionFacade.mjs':unused,'../parameters/preparedPhysicalState.mjs':unused,'../export/manufacturingTo3mf.mjs':unused,'../export/workerEnclosure3mf':unused,'./projectEnvelope.mjs':envelope,'./displayUnits.mjs':display,'codi-project-validation-worker':{default:'validation'},'./manufacturingMetadata.mjs':manufacturing,'cad/model/workerGeometry':unused,'./restoreTimeout.mjs':restoreTiming,'./failOwnedRestore.mjs':failure,'./captureDocumentJobOptions.mjs':options,'./incrementalCanonical.mjs':canonical,'./enclosureMaterialAssignment.mjs':unused,'./workerSavePreparation.mjs':preparation,'codi-manufacturing-hash-worker':{default:'hash'},'codi-manufacturing-publication-worker':{default:'publication'},'./manufacturingPublicationClient.mjs':publication,'./documentMetadataPreparation.mjs':metadataPreparation};
 const module={exports:{}},code=ts.transpileModule(readFileSync(resolve(root,'web/app/cad/projectManager/projectManagerBundle.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020},reportDiagnostics:true});assert.equal(code.diagnostics.length,0);
 const load=vm.runInThisContext('(function(module,exports,require,window,Worker){'+code.outputText+'\n})',{filename:'actual-projectManagerBundle.ts'});
 load(module,module.exports,key=>{assert(Object.hasOwn(dependencies,key),'Unexpected import '+key);return dependencies[key];},window,WorkerAdapter);module.exports.activate(ctx);
 return{ctx,manager:ctx.projectManager,project,storage,workers,workerReplies,map,finishReplay(){craft.isProcessing=false;},failReplay(){loadFailure=true;},unbound(){host=false;},newDocument(){const g=project.beginDocumentChange();ctx.projectManager.resetDocumentState(g);mods.value={history:[],pointer:-1};},async drain(){await Promise.allSettled(terminations);},async close(){project.dispose();await Promise.allSettled(terminations);}};
}
