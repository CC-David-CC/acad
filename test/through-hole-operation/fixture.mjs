// Actual operation TS + actual ledger/capture/resource owner. Models, transport
// and display projection are explicit doubles; recorded data is not fresh geometry.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {chain,inputProof,runtime,revision} from '../through-hole-ledger/fixture.mjs';
import {evaluateWorkerSolid,inspectWorkerSolidSelections} from '../../modules/engine/solid/solidLedger.mjs';
import {captureOwnedHoleIntent} from '../../modules/engine/solid/ownedHoleIntent.mjs';
import {solidBodyId} from '../../modules/engine/solid/solidIntent.mjs';
import {createEvaluationResourcePool} from '../../web/app/cad/craft/evaluationResources.mjs';
export {inputProof};
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..'),require=createRequire(import.meta.url);
const ts=require(process.env.THROUGH_HOLE_TYPESCRIPT||'/tmp/codi-typed-common-transaction-20261105/node_modules/typescript');
export const operationPath='modules/workbenches/modeler/features/workerThroughHoles/workerThroughHoles.operation.ts';
// Required class identity and placement/display protocol only; no CAD topology.
export class PlaneDouble {constructor(id){this.face={id,root:this,surface:{simpleSurface:{isPlane:true}},get isPlaneBased(){return this.surface.simpleSurface&&this.surface.simpleSurface.isPlane;},defaultSketchId:id};}}
export class SolidDouble {
 constructor(featureId,engine,view,runtime,metrics){
  const display=Object.freeze({status:view.displayStatus,reason:view.displayReason,sourceTriangleCount:metrics.triangleCount,renderTriangleCount:view.displayStatus==='available'?metrics.triangleCount:0});
  Object.assign(this,{featureId,id:solidBodyId(featureId),ext:{workerGeometry:Object.freeze({engine,runtime,resultKind:metrics.resultKind})},csys:{origin:{x:0,y:0,z:0},x:{x:1,y:0,z:0},y:{x:0,y:1,z:0},z:{x:0,y:0,z:1}},location$:{value:{mxx:1,mxy:0,mxz:0,tx:0,myx:0,myy:1,myz:0,ty:0,mzx:0,mzy:0,mzz:1,tz:0}},faces:[],edges:[],vertices:[],hasDisplayProjection:()=>display.status==='available',inspectDisplayProjection:()=>display,inspectKernelMetrics:()=>metrics});
 }
}
const load=()=>{
 const source=readFileSync(resolve(root,operationPath),'utf8'),m={exports:{}};
 const dependencies={'cad/craft/schema/types':{Types:{number:'number',string:'string'}},'cad/model/mworkerSolid':{MWorkerSolid:SolidDouble},'cad/model/mopenFace':{MOpenFaceShell:PlaneDouble},'engine/solid/solidLedger.mjs':{evaluateWorkerSolid},'engine/solid/ownedHoleIntent.mjs':{captureOwnedHoleIntent}};
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020},reportDiagnostics:true});
 assert.equal(code.diagnostics.length,0);
 vm.runInNewContext(code.outputText,{exports:m.exports,module:m,require:key=>{assert(Object.hasOwn(dependencies,key),'Unexpected import '+key);return dependencies[key];},DOMException},{filename:operationPath});
 return m.exports.createWorkerThroughHolesOperation;
};
const createOperation=load(),stream=value=>({value,revision:1});
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return{promise,resolve};};

export async function fixture({index=0,selectionTransform,meshTransform}={}){
 const data=chain(index),doc=new AbortController(),pool=createEvaluationResourcePool(),owner=pool.begin({signal:doc.signal,valid:()=>true});
 const plane=new PlaneDouble(data.source.sourceFaceId),face=plane.face,objects=new Map(),faces=new Map([[face.id,face]]),handles=new Map(),calls=[],models=[],gates=[];
 let queued=data.steps[0],closes=0,factoryCalls=0,pause=null,hook=null;
 const pauseIf=async phase=>{if(hook)hook(phase);if(pause?.phase===phase){const p=pause;pause=null;p.reached.resolve();await p.release.promise;}};
 const mount={descriptor:{engine:'occ-boolean-history-v1-component',representation:'occ-brep-worker-owned',runtimeAssets:runtime,operations:[{id:'solid.selections.read',version:1,selectionPlanVersion:2},{id:'solid.holes.through',version:1}]},ready:Promise.resolve(),
  async execute(request,options){
   calls.push({request,signal:options?.signal});
   if(request.op==='solid.selections.read'){
    const entry=handles.get(request.handle);assert(entry);let selection=structuredClone(entry.step.observed.selection);if(selectionTransform)selection=selectionTransform(selection,entry.step);
    await pauseIf('selection');return{contractVersion:1,op:request.op,unit:'millimeter',selection};
   }
   const step=queued;assert(step,'A recorded transport response must be queued');queued=null;
   if(step.kind==='profile')assert.deepEqual(request,step.intent.profile);
   else{const {op,handle,sourceHandle,...authored}=request;assert.equal(op,'solid.holes.through');assert.deepEqual(authored,step.intent);assert.equal(handles.get(handle)?.step.intent.featureId,step.intent.producerFeatureId);assert.equal(handles.get(sourceHandle)?.step.intent.featureId,step.intent.sourceFeatureId);}
   const handle=Object.freeze({recordedTransportId:handles.size+1});handles.set(handle,{step});
   await pauseIf('result');return{...structuredClone(step.observed.result),handle};
  },
  async readSolidMesh(request,options){
   calls.push({request,signal:options?.signal});const entry=handles.get(request.handle);assert(entry);const m=entry.step.observed.mesh,coords=new Float64Array(m.coordinates);
   let mesh={contractVersion:1,op:'solid.mesh.read',unit:'millimeter',quality:'display-only',triangleCount:m.triangleCount,buffer:coords.buffer,displayBuffer:new Float32Array(coords).buffer,displayStatus:'available',displayReason:null,evidence:structuredClone(m.evidence)};
   if(meshTransform)mesh=meshTransform(mesh,entry.step);await pauseIf('mesh');return mesh;
  },
  assertSolidBinding(handle){assert(handles.has(handle),'Recorded handle is no longer owned');},close(){closes++;handles.clear();}
 };
 const registry={isEvaluating:true,find:id=>objects.get(id),findFace:id=>faces.get(id)};
 const expressions={isTyped:false,script$:stream(''),table$:stream({}),list$:stream([]),errors$:stream([])};
 const ctx={engineEvaluation:owner,cadRegistry:registry,projectService:{hasHostLifetime:true,documentGeneration:1,isDocumentCurrent:g=>g===1&&!doc.signal.aborted},projectManager:{unit:'millimeter'},storageService:{revision:1},craftService:{evaluationEpoch:1,modifications$:stream({history:[]})},expressionService:expressions};
 const createMount=(engine,rev)=>{factoryCalls++;assert.equal(engine,'occ');assert.equal(rev,revision);return mount;},validateMount=(engine,m,rev)=>{assert.equal(engine,'occ');assert.equal(m,mount);assert.equal(rev,revision);};
 const base=await evaluateWorkerSolid({owner,kind:'profile',request:data.steps[0].intent,sourceBinding:data.steps[0].sourceBinding,registry,createMount,validateMount,createModel:(...args)=>new SolidDouble(...args),valid:()=>true});
 owner.addPublicationCheck('recorded-profile:10',base.publicationCheck);objects.set(base.outputId,base.model);models.push(base.model);calls.length=0;
 const operation=createOperation(createMount,validateMount);
 const run=async(raw=data.steps[1].intent,{step=data.steps[1],materialized={}}={})=>{queued=step;return operation.run(materialized,ctx,raw);};
 const publish=result=>{for(const m of result.consumed)objects.delete(m.id);for(const m of result.created){objects.set(m.id,m);models.push(m);}};
 const hold=phase=>{assert(!pause);const p={phase,reached:deferred(),release:deferred()};pause=p;gates.push(p);return{reached:p.reached.promise,release:p.release.resolve};};
 const close=()=>{for(const p of gates)p.release.resolve();doc.abort();owner.close();};
 return{...data,ctx,owner,pool,doc,plane,face,faces,objects,handles,calls,models,operation,mount,base,run,publish,hold,close,inspect:inspectWorkerSolidSelections,setHook:fn=>{hook=fn;},get closes(){return closes;},get factoryCalls(){return factoryCalls;}};
}
