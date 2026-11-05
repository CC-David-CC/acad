import test from 'node:test';
import assert from 'node:assert/strict';
import {registerSketchCommands} from '../apps/system/jsketcher/sketch-commands.mjs';
function fixture(){
 const state={session:{},valid:true,calls:[]},controller=new AbortController(),handlers=new Map(),actions={};
 for(const name of ['Collinear','AxisSymmetry'])actions[name]={inspect(context,options){state.calls.push({name,options});return {revision:'r',objects:[]};},invokeByIds(context,ids,revision,options){state.calls.push({name,ids,revision,options});return {status:'accepted'};}};
 const host={signal:controller.signal,session:()=>state.session,commands:{register(spec,run){handlers.set(spec.id,run);return()=>handlers.delete(spec.id);}}};
 const stop=registerSketchCommands(host,()=>({context:{actions},valid:()=>state.valid}));
 return {state,actions,controller,stop,handlers,run:(id,args)=>handlers.get(id)(args)};
}
test('line relations delegate to the same current sketch action with detached IDs',async()=>{
 const f=fixture();for(const [kind,name,ids] of [['collinear','Collinear',['a','b']],['axis-symmetry','AxisSymmetry',['p','q','axis']]]){
  await f.run('sketch-line-relation-targets',{kind});assert.equal(f.state.calls.at(-1).name,name);
  assert.equal((await f.run('sketch-line-relation',{kind,ids,revision:'r'})).status,'accepted');
  const call=f.state.calls.at(-1);assert.equal(call.name,name);assert.deepEqual(call.ids,ids);assert.notEqual(call.ids,ids);assert.equal(call.revision,'r');assert.equal(call.options.valid(),true);
 }f.stop();assert.equal(f.handlers.size,0);
});
test('invalid line targets, accessors and stale windows never reach model authoring',async()=>{
 const f=fixture(),base={kind:'collinear',ids:['a','b'],revision:'r'};let reads=0;const ids=['a','b'];Object.defineProperty(ids,'1',{enumerable:true,get(){reads++;return 'b';}});
 for(const patch of [{kind:'symmetry'},{ids:['a','a']},{ids:Array(2)},{ids},{kind:'axis-symmetry'},{revision:''}])await assert.rejects(f.run('sketch-line-relation',{...base,...patch}));
 f.state.valid=false;await assert.rejects(f.run('sketch-line-relation',base));assert.equal(reads,0);assert.equal(f.state.calls.length,0);f.stop();
});
test('line inspection and mutation settle when a destroyed frame never replies',async()=>{
 for(const inspection of [true,false]){const f=fixture();f.actions.Collinear[inspection?'inspect':'invokeByIds']=()=>new Promise(()=>{});
  const job=inspection?f.run('sketch-line-relation-targets',{kind:'collinear'}):f.run('sketch-line-relation',{kind:'collinear',ids:['a','b'],revision:'r'});
  f.controller.abort();await assert.rejects(job,e=>e.name==='AbortError');f.stop();
 }
});
