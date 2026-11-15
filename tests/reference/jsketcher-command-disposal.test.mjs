import test from 'node:test';
import assert from 'node:assert/strict';
import {registerFeatureCommands} from "../../webos/feature-commands.mjs";
import {createRectangleController} from "../../webos/rectangle-commands.mjs";
import {registerSketchCommands} from "../../webos/sketch-commands.mjs";
import {registerDocumentSaveCommand} from "../../webos/document-commands.mjs";
import {registerMaterialCommands} from "../../webos/material-commands.mjs";
const never=()=>new Promise(()=>{});
function setup(){
 const controller=new AbortController(),handlers=new Map(),state={session:{},open:true};
 const host={signal:controller.signal,session:()=>state.session,commands:{register(spec,run){handlers.set(spec.id,run);return()=>handlers.delete(spec.id)}}};
 return {controller,handlers,state,host,run:(id,args)=>handlers.get(id)(args)};
}
async function cancelled(f,job){f.controller.abort();await assert.rejects(job,error=>error.name==='AbortError'&&!Object.hasOwn(error,'committed'));}
test('worker feature and authored travel commands settle when the frame never replies',{timeout:2000},async()=>{
 for(const [id,method,args] of [
  ['create-worker-extrusion','createWorkerExtrusion',{revision:'r',faceId:'f',regionId:'g',depth:20}],
  ['travel-authored-edit','authoredEditTravel',{revision:'r',direction:'undo'}]
 ]){const f=setup(),stop=registerFeatureCommands(f.host,()=>({craft:{[method]:never},valid:()=>f.state.open}));await cancelled(f,f.run(id,args));stop();assert.equal(f.handlers.size,0);}
});
test('rectangle create and edit settle on window close without a child reply',{timeout:2000},async()=>{
 for(const edit of [false,true]){const f=setup(),craft={inspectRectangleCreation:()=>({ready:true}),inspectRectangleDimensions:()=>({ready:true}),createRectangleSketch:never,editRectangleDimensions:never},rect=createRectangleController(f.host,()=>({craft,valid:()=>f.state.open}));await cancelled(f,edit?rect.edit({}):rect.create({}));}
});
test('sketch inspection and edit settle without a child reply',{timeout:2000},async()=>{
 for(const inspect of [false,true]){const f=setup(),context={actions:{DiameterLength:{inspect:never,invokeById:never}}},stop=registerSketchCommands(f.host,()=>({context,valid:()=>f.state.open}));await cancelled(f,inspect?f.run('sketch-diameter-targets',{}):f.run('sketch-diameter',{objectId:'c',diameter:10,revision:'r'}));stop();}
});
test('material assignment settles without a child reply',{timeout:2000},async()=>{
 const f=setup(),stop=registerMaterialCommands(f.host,()=>({manager:{assignEnclosureMaterialRoles:never},valid:()=>f.state.open}));
 const role={material:{id:'PLA',name:'PLA'},appearance:null};await cancelled(f,f.run('assign-enclosure-materials',{featureId:1,revision:'r',roles:{BODY:role,LID:role}}));stop();
});
test('Save cancellation never claims a known write outcome or retries',{timeout:2000},async()=>{
 const f=setup();let calls=0;const stop=registerDocumentSaveCommand(f.host,{inspect:()=>({revision:'r',path:'/part.jsketcher.json'}),save(){calls++;return never()}});
 await cancelled(f,f.run('save',{revision:'r'}));assert.equal(calls,1);stop();
});
test('a new session settles old work while its frame remains pending',{timeout:2000},async()=>{
 const f=setup(),stop=registerFeatureCommands(f.host,()=>({craft:{createWorkerExtrusion:never},valid:()=>f.state.open}));
 const job=f.run('create-worker-extrusion',{revision:'r',faceId:'f',regionId:'g',depth:20});f.state.session={};await assert.rejects(job,error=>error.name==='AbortError');stop();
});
