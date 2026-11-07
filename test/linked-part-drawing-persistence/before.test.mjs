// BEFORE observations, not implemented drawing persistence or native geometry.
import test from 'node:test';
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {captureLinkedPartDrawingDefinition} from '../../modules/drawing/linkedPartDrawingDefinition.mjs';
import {definition} from '../linked-part-drawing-definition/fixture.mjs';
import {encodeProjectEnvelope,decodeProjectEnvelope} from '../../web/app/cad/projectManager/projectEnvelope.mjs';
import {fixture} from '../display-units/manager-fixture.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const project=()=>({model:{history:[],expressions:'',assembly:[],counters:{featureId:0}},sketches:[]});
const native=()=>encodeProjectEnvelope(project());
const drawingNative=version=>({...native(),version,drawings:[definition()]});
async function validate(value){
 const worker=new Worker(resolve(root,'test/display-units/node-worker.cjs'),{workerData:{entry:resolve(root,'.build/display-units/validation/worker.js'),verb:resolve(root,'web/lib/verb.js')}});
 try{return await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Actual validation Worker did not settle')),30000);worker.on('error',e=>{clearTimeout(timer);reject(e);});worker.on('message',reply=>{if(reply.progress)return;clearTimeout(timer);resolve(reply);});worker.postMessage({blob:new Blob([JSON.stringify(value)],{type:'application/json'})});});}
 finally{await worker.terminate();}
}
test('existing metadata capture admits the synthetic unresolved definition; it proves no reference',()=>{
 const source=definition(),captured=captureLinkedPartDrawingDefinition(source);assert.deepEqual(JSON.parse(JSON.stringify(captured)),source);assert.equal(Object.getPrototypeOf(captured),null);assert(Object.isFrozen(captured));assert.notEqual(captured,source);
 assert.equal(project().model.history.length,0); // referenced producers intentionally do not exist
});
test('v2 omission remains the current exact envelope',()=>{
 const value=native();assert.deepEqual(Object.keys(value),['format','version','unit','project']);assert.equal(value.version,2);assert.deepEqual(decodeProjectEnvelope(value).project,project());
});
for(const version of [2,3])test(`BEFORE missing persistence: codec rejects structurally valid drawing-bearing v${version}`,()=>{
 assert.throws(()=>decodeProjectEnvelope(drawingNative(version)),/Unsupported or invalid JSketcher project format/);
});
test('no workaround can hide drawing definitions in project/model',()=>{
 for(const target of ['project','model']){const value=native();(target==='project'?value.project:value.project.model).drawings=[definition()];assert.throws(()=>decodeProjectEnvelope(value),/Invalid or unsupported project structure/);}
});
test('BEFORE proposed fourth encoder argument is not an implemented persistence API',()=>{
 assert.deepEqual(encodeProjectEnvelope(project(),null,null,[definition()]),native());
});
test('actual production validation Worker retains existing full-envelope presentation',async()=>{
 const value={...native(),presentation:{version:1,lengthUnit:'inch'}},reply=await validate(value);
 assert.equal(reply.ok,true);assert.deepEqual(reply.value,value);assert.deepEqual(JSON.parse(reply.storage.model),project().model);assert.deepEqual(reply.storage.sketches,[]);
});
for(const version of [2,3])test(`BEFORE actual production validation Worker rejects drawing-bearing v${version}`,async()=>{
 const reply=await validate(drawingNative(version));assert.equal(reply.ok,false);assert.match(reply.error,/Unsupported or invalid JSketcher project format/);assert.equal(reply.value,undefined);assert.equal(reply.storage,undefined);
});
test('BEFORE manager byte restore invokes actual Worker, rejects drawing, retires Worker and stages no writes',async()=>{
 const f=fixture();try{
  const before={storage:[...f.map],history:structuredClone(f.ctx.craftService.modifications$.value),counters:structuredClone(f.project.counterGenerator.projectCounters),generation:f.project.documentGeneration};
  await assert.rejects(f.manager.restoreSnapshotBytesInEmptyWorkspace(new Blob([JSON.stringify(drawingNative(3))])),/Unsupported or invalid JSketcher project format/);
  await f.drain();assert.equal(f.workers.validation,1);assert.equal(f.workers.terminated,1);assert.equal(f.workers.geometry,0);assert.equal(f.workers.hash,0);
  assert.deepEqual([...f.map],before.storage);assert.deepEqual(f.ctx.craftService.modifications$.value,before.history);assert.deepEqual(f.project.counterGenerator.projectCounters,before.counters);
  // Failure may revoke/advance its owned generation; unchanged staged data
  // does not imply an unchanged document lifetime.
  assert(f.project.documentGeneration>=before.generation);assert.equal(typeof f.manager.getLinkedPartDrawingDefinition,'undefined');
 }finally{await f.close();}
});
test('schema invalidity remains distinct from valid unresolved references',()=>{
 const malformed=definition();malformed.unit='inch';assert.throws(()=>captureLinkedPartDrawingDefinition(malformed));
 const unresolved=definition();unresolved.target.featureId=999;assert.equal(captureLinkedPartDrawingDefinition(unresolved).target.featureId,999);
});
