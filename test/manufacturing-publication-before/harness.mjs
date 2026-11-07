// Actual manager, canonical-hash/validation Workers and exact production Craft
// inspection/travel functions. Accepted geometry/tip/replay are explicit small
// protocol fixtures. No Native geometry or actual app/host Save claim.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {fixture} from '../generic-manufacturing-assignment/manager-fixture.mjs';
import {sketchRevision} from '../../web/app/cad/craft/sketchRevision.mjs';
import {emptyAuthoredEditJournal,recordExtrusionEdit,planExtrusionTravel} from '../../web/app/cad/craft/authoredEditJournal.mjs';
const require=createRequire(import.meta.url),ts=require('../../node_modules/typescript'),{state,stream}=require('../../.build/manufacturing-publication-before/runtime.cjs');
const file=new URL('../../web/app/cad/craft/craftBundle.ts',import.meta.url),source=ts.createSourceFile('craftBundle.ts',fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true),declarations=new Map();
function visit(node){if(ts.isFunctionDeclaration(node)&&['inspectAuthoredEdits','authoredEditTravel'].includes(node.name?.text))declarations.set(node.name.text,node);ts.forEachChild(node,visit);}visit(source);
assert.equal(declarations.size,2);
export const extractedDeclarations=Object.fromEntries([...declarations].map(([name,node])=>[name,node.getText(source)]));
const code=ts.transpileModule([...declarations.values()].map(node=>node.getText(source)).join('\n'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS},reportDiagnostics:true});assert.equal(code.diagnostics.length,0);
const bind=vm.runInThisContext('(function(ctx,authoredJournal$,modifications$,sketchRevision,fullTipSketchRevision,fullTipMaterialSurfaceRevision,fullTipSignature,authoredDepthOperation){'+code.outputText+';return {inspect:inspectAuthoredEdits,travel:authoredEditTravel,tip:()=>fullTipMaterialSurfaceRevision};})',{filename:'exact-production-Craft-inspect-and-travel.js'});
export const roles=()=>({BODY:{material:{id:'pla',name:'PLA'},appearance:{id:'red',name:'Red',color:'#ff0000'}},LID:{material:{id:'petg',name:'PETG'},appearance:null}});
export function setup({cursor=1}={}){
 const f=fixture(),history=[{type:'WORKER_ENCLOSURE_V1',params:{featureId:7,width:100,height:50,depth:20}}],models=['BODY','LID'].map(outputRole=>({id:'worker-enclosure:1:'+JSON.stringify([7,outputRole]),featureId:7,originatingOperation:0,outputRole}));
 f.ctx.craftService.modifications$.value={history,pointer:0};f.ctx.craftService.models$.value=models;f.ctx.cadRegistry.shells=models;f.ctx.craftService.update$=stream();
 const descriptor={run(){throw Error('NATIVE_REPLAY_NOT_RUN_PROTOCOL_FIXTURE');}};
 f.ctx.streams.operation.registry.value={WORKER_ENCLOSURE_V1:descriptor};f.ctx.operationService={get:type=>type==='WORKER_ENCLOSURE_V1'?descriptor:undefined};
 let journal=recordExtrusionEdit(emptyAuthoredEditJournal(1,0),{document:1,revision:0,index:0,featureId:7,before:1,after:2});
 if(cursor===0)journal=planExtrusionTravel(journal,{document:1,revision:1,direction:'undo',index:0,featureId:7,currentDepth:2}).next;
 const journal$=state(journal),material=f.manager.inspectMaterialSurfaceRevision(),delegateCalls=[];
 const craft=bind(f.ctx,journal$,f.ctx.craftService.modifications$,sketchRevision,sketchRevision(f.storage,f.project.sketchStorageNamespace),material,'ACCEPTED_TIP_PROTOCOL_FIXTURE_NOT_NATIVE_PROOF',args=>{delegateCalls.push(args);throw Error('GEOMETRY_REPLAY_NOT_RUN_PROTOCOL_FIXTURE');});
 f.ctx.craftService.inspectAuthoredEdits=craft.inspect;f.ctx.craftService.authoredEditTravel=craft.travel;
 const notifications=[];const detachJournal=journal$.attach(()=>notifications.push('journal'));notifications.length=0;const detachUpdate=f.ctx.craftService.update$.attach(()=>notifications.push('update'));
 return Object.assign(f,{history,models,journal$,craft,delegateCalls,notifications,async cleanup(){detachJournal();detachUpdate();f.setReplyHook(null);await f.close();}});
}
export function snapshot(f){
 return {A:f.manager.getManufacturingMetadata(),J:structuredClone(f.journal$.value),T:f.craft.tip(),material:f.manager.inspectMaterialSurfaceRevision(),revision:f.manager.inspectDocumentRevision(),authored:f.craft.inspect(),history:structuredClone(f.history),modelIds:f.ctx.cadRegistry.shells.map(m=>m.id),epoch:f.ctx.craftService.evaluationEpoch,counters:{...f.project.counterGenerator.projectCounters},notifications:[...f.notifications],workers:{...f.workers},storageRevision:f.storage.revision};
}
export async function assign(f,value=roles(),options={}){return f.manager.assignEnclosureMaterialRoles(7,value,{revision:f.manager.inspectEnclosureMaterialRoles().revision,...options});}
export const ajt=s=>({A:s.A,J:s.J,T:s.T});
