import test from 'node:test';
import assert from 'node:assert/strict';
import {registerSketchExportCommands,validateDxfBlob} from "../../webos/sketch-export-commands.mjs";

test('accepts only real nonempty DXF Blobs within the 8 MiB output limit',()=>{
 const limit=8*1024*1024;
 assert.equal(validateDxfBlob(new Blob([new Uint8Array(limit)],{type:'application/dxf'}),Blob.prototype),limit);
 for(const value of [new Blob([],{type:'application/dxf'}),new Blob(['x'],{type:'text/plain'}),new Blob([new Uint8Array(limit+1)],{type:'application/dxf'}),{size:1,type:'application/dxf'}])assert.throws(()=>validateDxfBlob(value,Blob.prototype));
});

function fixture(){
 const handlers=new Map(),controller=new AbortController(),state={session:{},valid:true,calls:0,last:null};
 const craft={inspectSketchDXFExports:()=>({revision:'r',candidates:[{faceId:'f',sketchId:'s'}]})};
 const host={signal:controller.signal,session:()=>state.session,commands:{register(spec,run){handlers.set(spec.id,{spec,run});return()=>handlers.delete(spec.id)}}};
 const stop=registerSketchExportCommands(host,{getTarget:()=>({craft,valid:()=>state.valid}),exportDxf:async value=>{state.calls++;state.last=value;return {path:value.path}}});
 return {handlers,controller,state,craft,host,stop,run:(id,args)=>handlers.get(id).run(args)};
}
test('discovery and export use bounded detached request with proper schema',async()=>{
 const f=fixture();try{assert.equal(f.run('inspect-sketch-dxf-exports',{}).candidates[0].faceId,'f');const arg={revision:'r',faceId:'f',path:'/sketch.dxf'},job=f.run('export-sketch-dxf',arg);arg.path='/changed.dxf';assert.equal((await job).path,'/sketch.dxf');assert.equal(f.state.calls,1);assert.ok(Object.isFrozen(f.state.last));assert.equal(f.handlers.get('export-sketch-dxf').spec.parameters.additionalProperties,false)}finally{f.stop();f.stop();assert.equal(f.handlers.size,0)}
});
test('rejects extra fields, accessors and bad paths before dispatch',async()=>{
 const f=fixture(),bad={revision:'r',faceId:'f',path:'/x.dxf'};let gets=0;Object.defineProperty(bad,'faceId',{enumerable:true,get(){gets++;return 'f'}});try{for(const v of [bad,{revision:'r',faceId:'f',path:'/x.svg'},{revision:'r',faceId:'f',path:'/x.dxf',extra:1},{revision:'',faceId:'f',path:'/x.dxf'}])await assert.rejects(f.run('export-sketch-dxf',v));assert.equal(gets,0);assert.equal(f.state.calls,0);assert.throws(()=>f.run('inspect-sketch-dxf-exports',{extra:1}))}finally{f.stop()}
});
test('pending export settles on account switch or close; registration failures clean up',{timeout:2000},async()=>{
 for(const mode of ['session','abort']){const f=fixture();f.stop();const stop=registerSketchExportCommands(f.host,{getTarget:()=>({craft:f.craft,valid:()=>true}),exportDxf:()=>new Promise(()=>{})});const pending=f.run('export-sketch-dxf',{revision:'r',faceId:'f',path:'/x.dxf'});if(mode==='session')f.state.session={};else f.controller.abort();await assert.rejects(pending,{name:'AbortError'});stop()}
 const f=fixture();f.stop();let registered=0,removed=0;assert.throws(()=>registerSketchExportCommands({...f.host,commands:{register(){if(++registered===2)throw Error('failed');return()=>removed++}}},{getTarget:()=>({}),exportDxf:()=>{}}));assert.equal(removed,1);
});
