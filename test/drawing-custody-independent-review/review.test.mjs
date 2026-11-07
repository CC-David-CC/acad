// Actual manager activation, validation/hash Workers; empty-model metadata only.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {fileURLToPath} from 'node:url';
import {definition} from '../linked-part-drawing-definition/fixture.mjs';
import {encodeProjectEnvelope} from '../../web/app/cad/projectManager/projectEnvelope.mjs';
const root=new URL('../../',import.meta.url),original=new URL('../display-units/manager-fixture.mjs',import.meta.url),generated=new URL('.build/drawing-custody-review/manager-fixture.mjs',root);
let source=fs.readFileSync(original,'utf8');source=source.replace(/from '([^']+)'/g,(all,name)=>name.startsWith('.')?"from '"+new URL(name,original).href+"'":all);
const marker='return{ctx,manager:ctx.projectManager,project,storage,workers,workerReplies,map,';assert.equal(source.split(marker).length,2);source=source.replace(marker,'return{reactivateManager(){module.exports.activate(ctx);return ctx.projectManager;},ctx,manager:ctx.projectManager,project,storage,workers,workerReplies,map,');fs.mkdirSync(new URL('./',generated),{recursive:true});fs.writeFileSync(generated,source);const{fixture}=await import(generated.href);
const value=()=>encodeProjectEnvelope({model:{history:[],expressions:'',assembly:[],counters:{featureId:0}},sketches:[]},null,null,definition());
async function use(fn){const f=fixture();try{await fn(f);}finally{await f.close();}}
test('current manager preserves drawing through genuine validation and Save',()=>use(async f=>{const v=value();await f.manager.restoreSnapshotBytesInEmptyWorkspace(new Blob([JSON.stringify(v)]));const p=await f.manager.prepareHostSave();assert.equal(p.isCurrent(),true);assert.deepEqual(JSON.parse(JSON.stringify(p.envelope)),JSON.parse(JSON.stringify(v)));}));
test('initial restore validity callback replacing actual manager must refuse before document generation changes',()=>use(async f=>{
 const original=f.manager,signal=f.project.documentSignal,generation=f.project.documentGeneration;let replaced=false,error;
 try{await original.restoreSnapshotBytesInEmptyWorkspace(new Blob([JSON.stringify(value())]),{valid(){if(!replaced){replaced=true;f.reactivateManager();}return true;}});}catch(e){error={name:e.name,message:e.message};}
 const observation={scope:'Actual manager functions/Workers; empty-model metadata fixture',error,beforeGeneration:generation,afterGeneration:f.project.documentGeneration,oldSignalAborted:signal.aborted,currentSignalAborted:f.project.documentSignal.aborted,validationWorkers:f.workers.validation};if(process.env.CODI_DRAWING_REVIEW_OUTPUT)fs.writeFileSync(process.env.CODI_DRAWING_REVIEW_OUTPUT+'/restore-reentrancy.json',JSON.stringify(observation,null,2)+'\n');
 assert.equal(error?.name,'AbortError');assert.equal(f.project.documentGeneration,generation);assert.equal(signal.aborted,false);assert.equal(f.workers.validation,0);
}));
test('old manager Save preparation after reactivation must not authenticate old drawing as current',()=>use(async f=>{
 const original=f.manager;await original.restoreSnapshotBytesInEmptyWorkspace(new Blob([JSON.stringify(value())]));const replacement=f.reactivateManager();let prepared,error;try{prepared=await original.prepareHostSave();}catch(e){error={name:e.name,message:e.message};}
 const observation={scope:'Actual managers/Workers; empty-model metadata fixture',error,currentDrawing:replacement.getLinkedPartDrawingDefinition(),orphanEnvelopeVersion:prepared?.envelope.version,orphanDrawing:prepared?.envelope.drawings?.[0]?.drawingId,isCurrent:prepared?.isCurrent()};if(process.env.CODI_DRAWING_REVIEW_OUTPUT)fs.writeFileSync(process.env.CODI_DRAWING_REVIEW_OUTPUT+'/save-reentrancy.json',JSON.stringify(observation,null,2)+'\n');
 assert.ok(error||!prepared.isCurrent(),'orphaned manager must not authenticate Save');
}));
