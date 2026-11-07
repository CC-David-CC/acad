// Exact actual PM, Craft methods and dedicated Workers. Small accepted Native
// model/history/resource state is an explicit PROTOCOL fixture, not geometry.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {fixture} from '../generic-manufacturing-assignment/manager-fixture.mjs';
import * as journal from '../../web/app/cad/craft/authoredEditJournal.mjs';
import {sketchRevision} from '../../web/app/cad/craft/sketchRevision.mjs';
import {transport} from './transport.mjs';
const require=createRequire(import.meta.url),ts=require('../../node_modules/typescript'),runtime=require('../../.build/manufacturing-publication-tests/runtime.cjs');
const src=ts.createSourceFile('craftBundle.ts',fs.readFileSync(new URL('../../web/app/cad/craft/craftBundle.ts',import.meta.url),'utf8'),ts.ScriptTarget.Latest,true),wanted=['inspectAuthoredEdits','authoredEditTravel','captureManufacturingEditContext','commitManufacturingMetadata','superseded'],found=new Map();
function visit(n){if(ts.isFunctionDeclaration(n)&&wanted.includes(n.name?.text))found.set(n.name.text,n.getText(src));ts.forEachChild(n,visit);}visit(src);assert.equal(found.size,wanted.length);
const code=ts.transpileModule([...found.values()].join('\n'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020},reportDiagnostics:true});assert.equal(code.diagnostics.length,0);
const bind=vm.runInThisContext('(function(ctx,authoredJournal$,modifications$,models$,update$,evaluationEpoch,pendingPipelines,pendingModifications,pipelineFailure$,engineCleanupFailure$,fullTipSignature,fullTipSketchRevision,fullTipMaterialSurfaceRevision,journalHeadDefinition,journalHeadSignature,sketchRevision,prepareStateBatch,recordPreparedManufacturingEdit,planPreparedManufacturingTravel,documentMetadataTarget,authoredDepthOperation){'+code.outputText+';return {inspect:inspectAuthoredEdits,travel:authoredEditTravel,capture:captureManufacturingEditContext,commit:commitManufacturingMetadata,tip:()=>fullTipMaterialSurfaceRevision};})');
export const roles=()=>({BODY:{material:{id:'pla',name:'PLA'},appearance:{id:'red',name:'Red',color:'#ff0000'}},LID:{material:{id:'petg',name:'PETG'},appearance:null}});
export function setup({empty=false}={}){
 const f=fixture(),workers=transport(),previousWorker=globalThis.Worker;globalThis.Worker=workers.Adapter;
 const models=['BODY','LID'].map(outputRole=>({id:'worker-enclosure:1:'+JSON.stringify([7,outputRole]),featureId:7,originatingOperation:0,outputRole}));
 f.ctx.craftService.modifications$.value={history:Object.freeze(empty?[]:[Object.freeze({type:'WORKER_ENCLOSURE_V1',params:Object.freeze({featureId:7,width:100,height:50,depth:20})})]),pointer:empty?-1:0};f.ctx.craftService.models$.value=empty?[]:models;f.ctx.cadRegistry.shells=f.ctx.craftService.models$.value;
 const descriptor={run(){throw Error('NATIVE_REPLAY_NOT_RUN_PROTOCOL_FIXTURE');}};f.ctx.streams.operation.registry.value={WORKER_ENCLOSURE_V1:descriptor};f.ctx.operationService={get:()=>descriptor};
 const journal$=runtime.state(empty?journal.emptyAuthoredEditJournal(1,0):journal.recordExtrusionEdit(journal.emptyAuthoredEditJournal(1,0),{document:1,revision:0,index:0,featureId:7,before:1,after:2})),update$=runtime.stream(),delegates=[];
 f.ctx.craftService.update$=update$;
 const install=()=>{
  const craft=bind(f.ctx,journal$,f.ctx.craftService.modifications$,f.ctx.craftService.models$,update$,f.ctx.craftService.evaluationEpoch,0,0,f.ctx.craftService.pipelineFailure$,f.ctx.craftService.engineCleanupFailure$,'ACCEPTED_PROTOCOL_TIP_NOT_NATIVE_PROOF',sketchRevision(f.storage,f.project.sketchStorageNamespace),f.manager.inspectMaterialSurfaceRevision(),f.ctx.craftService.modifications$.value.history,'ACCEPTED_PROTOCOL_TIP_NOT_NATIVE_PROOF',sketchRevision,runtime.prepareStateBatch,journal.recordPreparedManufacturingEdit,journal.planPreparedManufacturingTravel,journal.documentMetadataTarget,args=>{delegates.push(args);throw Error('GEOMETRY_REPLAY_NOT_RUN_PROTOCOL_FIXTURE');});
  Object.assign(f.ctx.craftService,{inspectAuthoredEdits:craft.inspect,authoredEditTravel:craft.travel,captureManufacturingEditContext:craft.capture,commitManufacturingMetadata:craft.commit});f.craft=craft;
 };
 install();let saves=0;f.project.scheduleSave=()=>{saves++;};
 return Object.assign(f,{journal$,update$,publicationWorkers:workers,delegates,protocolModels:models,installProtocolAcceptedTip:install,saveCount:()=>saves,async cleanup(){f.setReplyHook(null);await f.close();await workers.close();globalThis.Worker=previousWorker;}});
}
export const assign=(f,value=roles(),options={})=>f.manager.assignEnclosureMaterialRoles(7,value,{revision:f.manager.inspectEnclosureMaterialRoles().revision,...options});
export const travel=(f,direction,options={})=>f.craft.travel({revision:f.craft.inspect().revision,direction},options);
export function snapshot(f){return{A:f.manager.getManufacturingMetadata(),J:structuredClone(f.journal$.value),T:f.craft.tip(),material:f.manager.inspectMaterialSurfaceRevision(),revision:f.manager.inspectDocumentRevision(),authored:f.craft.inspect(),history:f.ctx.craftService.modifications$.value,models:f.ctx.craftService.models$.value,epoch:f.ctx.craftService.evaluationEpoch,counters:{...f.project.counterGenerator.projectCounters},storageRevision:f.storage.revision};}
