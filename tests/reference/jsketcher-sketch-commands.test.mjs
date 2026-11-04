import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registerSketchCommands} from '../apps/system/jsketcher/sketch-commands.mjs';
function fixture(){
 const handlers=new Map(),session={},state={session,valid:true,mutations:0,checks:0};
 const action={async inspect(ctx,options){state.checks++;assert.equal(ctx,context);assert.equal(options.valid(),true);return {revision:'token',objects:[{id:'a'},{id:'b'}]};},async invokeByIds(ctx,ids,revision,options){assert.equal(ctx,context);assert.equal(options.valid(),true);state.mutations++;return {objects:ids,status:'accepted'};}};
 const context={actions:{Concentric:action}},controller=new AbortController();
 const host={session:()=>state.session,signal:controller.signal,commands:{register(descriptor,handler){handlers.set(descriptor.id,handler);return ()=>handlers.delete(descriptor.id);}}};
 const dispose=registerSketchCommands(host,()=>({context,valid:()=>state.valid}));
 return {host,state,handlers,action,context,controller,dispose};
}
test('discovered sketch commands call the shared operation using scoped IDs',async()=>{
 const f=fixture(),inspection=await f.handlers.get('sketch-circular-objects')({});
 const result=await f.handlers.get('sketch-concentric')({ids:inspection.objects.map(o=>o.id),revision:inspection.revision});
 assert.deepEqual(result,{objects:['a','b'],status:'accepted'});assert.equal(f.state.mutations,1);f.dispose();f.dispose();assert.equal(f.handlers.size,0);
});
test('invalid payloads never invoke a model mutation',async()=>{
 const f=fixture();for(const args of [{ids:['a','a'],revision:'x'},{ids:['a','b'],revision:'x',extra:1},{ids:['a','b']},null])await assert.rejects(f.handlers.get('sketch-concentric')(args));
 await assert.rejects(f.handlers.get('sketch-circular-objects')({extra:1}));assert.equal(f.state.mutations,0);f.dispose();
});
test('closed and pre-aborted windows reject before reaching the model',async()=>{
 for(const abort of [false,true]){const f=fixture();if(abort)f.controller.abort();else f.state.valid=false;await assert.rejects(f.handlers.get('sketch-concentric')({ids:['a','b'],revision:'x'}));assert.equal(f.state.mutations,0);f.dispose();}
});
test('the shared operation receives a guard that becomes false after a session change',async()=>{
 const f=fixture();let finish,entered;const started=new Promise(resolve=>entered=resolve),wait=new Promise(resolve=>finish=resolve);
 f.action.invokeByIds=async(ctx,ids,revision,options)=>{entered();await wait;if(!options.valid())throw Error('stale session');f.state.mutations++;};
 const pending=f.handlers.get('sketch-concentric')({ids:['a','b'],revision:'x'});await started;f.state.session={};finish();await assert.rejects(pending,/stale session/);assert.equal(f.state.mutations,0);f.dispose();
});
