// Actual activate(ctx)/manager/Worker functions. Empty structural model and
// synthetic drawing metadata, no Native or public authoring proof.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {definition} from '../linked-part-drawing-definition/fixture.mjs';
import {encodeProjectEnvelope} from '../../web/app/cad/projectManager/projectEnvelope.mjs';
const root=new URL('../../',import.meta.url),original=new URL('../display-units/manager-fixture.mjs',import.meta.url),generated=new URL('.build/drawing-activation-custody/manager-fixture.mjs',root);
let source=fs.readFileSync(original,'utf8');source=source.replace(/from '([^']+)'/g,(all,name)=>name.startsWith('.')?"from '"+new URL(name,original).href+"'":all);
const marker='return{ctx,manager:ctx.projectManager,project,storage,workers,workerReplies,map,';assert.equal(source.split(marker).length,2);source=source.replace(marker,'return{reactivateManager(){module.exports.activate(ctx);return ctx.projectManager;},ctx,manager:ctx.projectManager,project,storage,workers,workerReplies,map,');fs.mkdirSync(new URL('./',generated),{recursive:true});fs.writeFileSync(generated,source);const{fixture}=await import(generated.href);
const value=()=>encodeProjectEnvelope({model:{history:[],expressions:'',assembly:[],counters:{featureId:0}},sketches:[]},null,null,definition());
const open=f=>f.manager.restoreSnapshotBytesInEmptyWorkspace(new Blob([JSON.stringify(value())]));
async function use(fn){const f=fixture();try{await fn(f);}finally{await f.close();}}
test('orphan snapshot refuses before local storage writes and does not purge either manager',()=>use(async f=>{
 await open(f);const held=f.manager.getLinkedPartDrawingDefinition(),revision=f.storage.revision,old=f.manager,replacement=f.reactivateManager();assert.throws(()=>old.snapshotCurrentProject(),{name:'AbortError'});assert.equal(f.storage.revision,revision);assert.equal(old.getLinkedPartDrawingDefinition(),held);assert.equal(replacement.getLinkedPartDrawingDefinition(),null);
}));
test('orphan Save refuses before invoking external options or writing workspace',()=>use(async f=>{
 await open(f);const old=f.manager,revision=f.storage.revision;f.reactivateManager();let calls=0;await assert.rejects(old.prepareHostSave({valid(){calls++;return true;}}),{name:'AbortError'});assert.equal(calls,0);assert.equal(f.storage.revision,revision);
}));
test('prepared Save becomes stale after reactivation without copying or clearing metadata',()=>use(async f=>{
 await open(f);const old=f.manager,held=old.getLinkedPartDrawingDefinition(),prepared=await old.prepareHostSave(),replacement=f.reactivateManager();assert.equal(prepared.isCurrent(),false);assert.equal(old.getLinkedPartDrawingDefinition(),held);assert.equal(replacement.getLinkedPartDrawingDefinition(),null);
}));
test('initial Save validity reactivation refuses before captured snapshot writes',()=>use(async f=>{
 await open(f);const old=f.manager,revision=f.storage.revision,generation=f.project.documentGeneration;let replacement;await assert.rejects(old.prepareHostSave({valid(){replacement??=f.reactivateManager();return true;}}),{name:'AbortError'});assert.equal(f.storage.revision,revision);assert.equal(f.project.documentGeneration,generation);assert.equal(f.project.documentSignal.aborted,false);assert.equal(replacement.getLinkedPartDrawingDefinition(),null);
}));
test('replacement preflight callback cannot reactivate manager after advancing document',()=>use(async f=>{
 const generation=f.project.documentGeneration,signal=f.project.documentSignal;let calls=0;await assert.rejects(f.manager.restoreSnapshotBytesInEmptyWorkspace(new Blob([JSON.stringify(value())]),{valid(){if(++calls===3)f.reactivateManager();return true;}}),{name:'AbortError'});assert.equal(calls,3);assert.equal(f.project.documentGeneration,generation);assert.equal(signal.aborted,false);assert.equal(f.workers.validation,0);
}));
test('later Worker-phase reactivation cannot let failed old restore dispose replacement',()=>use(async f=>{
 const generation=f.project.documentGeneration;let calls=0,replacement;await assert.rejects(f.manager.restoreSnapshotBytesInEmptyWorkspace(new Blob([JSON.stringify(value())]),{valid(){if(++calls===4)replacement=f.reactivateManager();return true;}}),{name:'AbortError'});assert.equal(calls,4);assert.equal(f.project.documentGeneration,generation+1);assert.equal(f.project.documentSignal.aborted,false);assert.equal(replacement.inspectDisplayUnits().lengthUnit,'millimeter');await f.drain();assert.equal(f.workers.validation,1);assert.equal(f.workers.terminated,1);assert.equal(f.workers.geometry,0);
}));
