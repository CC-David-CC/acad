import test from 'node:test';
import assert from 'node:assert/strict';
import {registerSketchCommands} from "../../webos/sketch-commands.mjs";
function fixture(){
 const state={session:{},valid:true,calls:[]},controller=new AbortController(),handlers=new Map(),actions={};
 for(const name of ['CreateRigidGroup','PoseRigidGroup','DissolveRigidGroup'])actions[name]={inspect(context,options){state.calls.push({name,options});return {revision:'r',objects:[]};},invokeByIds(context,ids,revision,options){state.calls.push({name,ids,revision,options});return {id:'g',status:'accepted'};},invokeById(context,...args){state.calls.push({name,args});return {status:'accepted'};}};
 const stop=registerSketchCommands({signal:controller.signal,session:()=>state.session,commands:{register(spec,run){handlers.set(spec.id,run);return()=>handlers.delete(spec.id);}}},()=>({context:{actions},valid:()=>state.valid}));
 return {state,actions,controller,stop,handlers,run:(id,args)=>handlers.get(id)(args)};
}
test('rigid adapters share model actions and detach member IDs and absolute pose',async()=>{
 const f=fixture(),ids=['a','b'],pose={x:12,y:-3,angle:Math.PI/2};await f.run('sketch-rigid-groups',{});await f.run('sketch-create-rigid-group',{ids,revision:'r'});let call=f.state.calls.at(-1);assert.deepEqual(call.ids,ids);assert.notEqual(call.ids,ids);assert.equal(call.options.valid(),true);
 await f.run('sketch-pose-rigid-group',{groupId:'g',revision:'r',pose});call=f.state.calls.at(-1);assert.equal(call.name,'PoseRigidGroup');assert.deepEqual(call.args.slice(0,3),['g','r',pose]);assert.notEqual(call.args[2],pose);assert.ok(Object.isFrozen(call.args[2]));
 await f.run('sketch-dissolve-rigid-group',{groupId:'g',revision:'r'});assert.equal(f.state.calls.at(-1).name,'DissolveRigidGroup');f.stop();assert.equal(f.handlers.size,0);
});
test('rigid inputs refuse getters, sparse arrays, unsupported values and stale sessions before authoring',async()=>{
 const f=fixture();let reads=0;const ids=['a','b'];Object.defineProperty(ids,'1',{enumerable:true,get(){reads++;return 'b';}});for(const value of [ids,Array(2),['a','a'],['a']])await assert.rejects(f.run('sketch-create-rigid-group',{ids:value,revision:'r'}));
 const pose={x:0,y:0};Object.defineProperty(pose,'angle',{enumerable:true,get(){reads++;return 0;}});for(const value of [pose,{x:0,y:0,angle:Infinity},{x:1000001,y:0,angle:0},{x:0,y:0,angle:0,extra:0}])await assert.rejects(f.run('sketch-pose-rigid-group',{groupId:'g',revision:'r',pose:value}));assert.equal(reads,0);assert.equal(f.state.calls.length,0);
 f.state.valid=false;await assert.rejects(f.run('sketch-rigid-groups',{}));f.stop();
});
test('each rigid command settles when its child frame never replies',async()=>{
 for(const [id,args,name,method] of [['sketch-rigid-groups',{},'CreateRigidGroup','inspect'],['sketch-create-rigid-group',{ids:['a','b'],revision:'r'},'CreateRigidGroup','invokeByIds'],['sketch-pose-rigid-group',{groupId:'g',revision:'r',pose:{x:0,y:0,angle:0}},'PoseRigidGroup','invokeById'],['sketch-dissolve-rigid-group',{groupId:'g',revision:'r'},'DissolveRigidGroup','invokeById']]){const f=fixture();f.actions[name][method]=()=>new Promise(()=>{});const job=f.run(id,args);f.controller.abort();await assert.rejects(job,e=>e.name==='AbortError');f.stop();}
});
