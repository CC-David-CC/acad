import test from 'node:test';
import assert from 'node:assert/strict';
import {registerSketchCommands} from '../apps/system/jsketcher/sketch-commands.mjs';
function fixture(){
 const handlers=new Map(),controller=new AbortController(),state={session:{},valid:true,calls:[]},actions={};
 for(const name of ['SignedDistanceX','SignedDistanceY','ProjectedDistance','LengthRelation'])actions[name]={inspect(ctx,options){state.calls.push({name,options});return {revision:'r',objects:[]};},invokeByIds(ctx,ids,distance,revision,options){state.calls.push({name,ids,distance,revision,options});return {status:'accepted'};}};
 const host={signal:controller.signal,session:()=>state.session,commands:{register(spec,run){handlers.set(spec.id,run);return()=>handlers.delete(spec.id);}}};
 const stop=registerSketchCommands(host,()=>({context:{actions},valid:()=>state.valid}));
 return {handlers,controller,state,actions,stop,run:(id,args)=>handlers.get(id)(args)};
}
test('signed X/Y/projected commands use current shared sketch operations and preserve signed values',async()=>{
 const f=fixture();for(const [axis,name] of [['x','SignedDistanceX'],['y','SignedDistanceY'],['projected','ProjectedDistance']]){
  await f.run('sketch-signed-distance-targets',{axis});assert.equal(f.state.calls.at(-1).name,name);
  const ids=axis==='projected'?['p','q','s']:['p','q'];await f.run('sketch-signed-distance',{axis,ids,distance:-12,revision:'r'});
  const call=f.state.calls.at(-1);assert.equal(call.name,name);assert.deepEqual(call.ids,ids);assert.notEqual(call.ids,ids);assert.equal(call.distance,-12);assert.equal(call.options.valid(),true);
 }f.stop();assert.equal(f.handlers.size,0);
});
test('invalid axes, sparse IDs, accessors and bounds never invoke a sketch operation',async()=>{
 const f=fixture(),base={axis:'x',ids:['p','q'],distance:0,revision:'r'};let reads=0;
 const getter=['p','q'];Object.defineProperty(getter,'1',{enumerable:true,get(){reads++;return 'q';}});
 for(const patch of [{axis:'z'},{ids:Array(2)},{ids:getter},{ids:['p','p']},{axis:'projected'},{distance:Infinity},{distance:1000001}])await assert.rejects(f.run('sketch-signed-distance',{...base,...patch}));
 assert.equal(reads,0);assert.equal(f.state.calls.length,0);f.stop();
});
test('new signed and length adapters settle never-reply frame promises on window close',async()=>{
 for(const [id,args,action,method] of [
  ['sketch-signed-distance-targets',{axis:'x'},'SignedDistanceX','inspect'],
  ['sketch-signed-distance',{axis:'projected',ids:['p','q','s'],distance:0,revision:'r'},'ProjectedDistance','invokeByIds'],
  ['sketch-length-relation-targets',{},'LengthRelation','inspect'],
  ['sketch-length-relation',{ids:['a','b'],factor:1,offset:0,revision:'r'},'LengthRelation','invokeByIds']
 ]){const f=fixture();f.actions[action][method]=()=>new Promise(()=>{});const job=f.run(id,args);f.controller.abort();await assert.rejects(job,e=>e.name==='AbortError');f.stop();}
});
