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

test('diameter discovery and edit use the same scoped sketch action',async()=>{
 const f=fixture();let received;
 f.context.actions.DiameterLength={inspect:f.action.inspect,async invokeById(ctx,id,diameter,revision,options){
  assert.equal(ctx,f.context);assert.equal(options.valid(),true);received={id,diameter,revision};return {status:'accepted'};
 }};
 const inspection=await f.handlers.get('sketch-diameter-targets')({});
 assert.deepEqual(await f.handlers.get('sketch-diameter')({objectId:'a',diameter:12,revision:inspection.revision}),{status:'accepted'});
 assert.deepEqual(received,{id:'a',diameter:12,revision:'token'});f.dispose();assert.equal(f.handlers.size,0);
});
test('diameter rejects unavailable engines, invalid inputs and getters before mutation',async()=>{
 const f=fixture(),run=args=>f.handlers.get('sketch-diameter')(args),good={objectId:'a',diameter:12,revision:'token'};
 await assert.rejects(run(good),/authorized/);let calls=0;
 f.context.actions.DiameterLength={invokeById(){calls++;}};
 for(const diameter of [0,-1,Infinity,NaN,1000001,'12'])await assert.rejects(run({...good,diameter}));
 const accessor={...good};Object.defineProperty(accessor,'diameter',{enumerable:true,get(){calls++;return 12}});
 await assert.rejects(run(accessor),/data properties/);
 await assert.rejects(run({...good,[Symbol('extra')]:true}));assert.equal(calls,0);f.dispose();
});
test('diameter async operation receives cancellation and changed-account guard',async()=>{
 for(const mode of ['session','abort','window']){
  const f=fixture();let release,entered;const ready=new Promise(r=>entered=r),wait=new Promise(r=>release=r);
  f.context.actions.DiameterLength={async invokeById(ctx,id,diameter,revision,options){entered();await wait;if(!options.valid())throw Error('stale diameter');f.state.mutations++;}};
  const pending=f.handlers.get('sketch-diameter')({objectId:'a',diameter:12,revision:'token'});await ready;
  if(mode==='session')f.state.session={};else if(mode==='abort')f.controller.abort();else f.state.valid=false;
  release();await assert.rejects(pending,e=>e.name==='AbortError'||/stale diameter/.test(e.message));assert.equal(f.state.mutations,0);f.dispose();
 }
});
test('length relationship uses the scoped shared sketch operation',async()=>{
 const f=fixture();let received;
 f.context.actions.LengthRelation={inspect:f.action.inspect,async invokeByIds(ctx,ids,constants,revision,options){assert.equal(ctx,f.context);assert.equal(options.valid(),true);received={ids,constants,revision};return {status:'accepted'}}};
 const inspected=await f.handlers.get('sketch-length-relation-targets')({});
 assert.deepEqual(await f.handlers.get('sketch-length-relation')({ids:['a','b'],factor:2,offset:-5,revision:inspected.revision}),{status:'accepted'});
 assert.deepEqual(received,{ids:['a','b'],constants:{factor:2,offset:-5},revision:'token'});f.dispose();
});
test('length relationship refuses malformed values, sparse IDs and stale lifetime',async()=>{
 const f=fixture();let calls=0;f.context.actions.LengthRelation={invokeByIds(){calls++}};
 const run=f.handlers.get('sketch-length-relation'),good={ids:['a','b'],factor:2,offset:0,revision:'token'};
 const accessor=['a','b'];Object.defineProperty(accessor,0,{get(){calls++;return 'a'}});
 for(const bad of [{...good,ids:['a','a']},{...good,ids:Array(2)},{...good,ids:accessor},{...good,factor:-1},{...good,factor:Infinity},{...good,offset:NaN},{...good,extra:true}])await assert.rejects(run(bad));
 f.controller.abort();await assert.rejects(run(good));assert.equal(calls,0);f.dispose();
});
test('length relationship propagates abort and account lifetime to the shared operation',async()=>{
 for(const mode of ['session','abort','window']){
  const f=fixture();let release,started;const ready=new Promise(r=>started=r),wait=new Promise(r=>release=r);
  f.context.actions.LengthRelation={async invokeByIds(ctx,ids,constants,revision,options){started();await wait;if(!options.valid())throw Error('stale relation');f.state.mutations++}};
  const pending=f.handlers.get('sketch-length-relation')({ids:['a','b'],factor:2,offset:1,revision:'token'});await ready;
  if(mode==='session')f.state.session={};else if(mode==='abort')f.controller.abort();else f.state.valid=false;
  release();await assert.rejects(pending,error=>mode==='abort'?error.name==='AbortError':error.name==='AbortError'||error.message==='stale relation');assert.equal(f.state.mutations,0);f.dispose();
 }
});
test('length role inspection and conversion share scoped operation',async()=>{
 const f=fixture();let received;
 f.context.actions.LengthMeasurementRole={inspect:f.action.inspect,invokeById(ctx,args,options){assert.equal(ctx,f.context);assert.equal(options.valid(),true);received=args;return {role:args.role}}};
 const inspected=await f.handlers.get('sketch-length-measurements')({});
 assert.deepEqual(await f.handlers.get('sketch-convert-length-role')({role:'driving',segmentId:'a',dimensionId:'d',revision:inspected.revision}),{role:'driving'});
 assert.deepEqual(received,{role:'driving',segmentId:'a',dimensionId:'d',revision:'token'});
 assert.deepEqual(await f.handlers.get('sketch-convert-length-role')({role:'reference',segmentId:'a',revision:'token'}),{role:'reference'});f.dispose();
});
test('length role command rejects malformed target, accessor and inactive session',async()=>{
 const f=fixture();let calls=0;f.context.actions.LengthMeasurementRole={invokeById(){calls++}};
 const run=f.handlers.get('sketch-convert-length-role');for(const args of [{role:'driving',segmentId:'a',revision:'x'},{role:'reference',segmentId:'a',dimensionId:'d',revision:'x'},{role:'other',segmentId:'a',revision:'x'}])await assert.rejects(run(args));
 const bad={segmentId:'a',revision:'x'};Object.defineProperty(bad,'role',{enumerable:true,get(){calls++;return 'reference'}});await assert.rejects(run(bad));f.controller.abort();await assert.rejects(run({role:'reference',segmentId:'a',revision:'x'}));assert.equal(calls,0);f.dispose();
});
test('length role commands settle on window disposal even if the frame never responds',async()=>{
 const f=fixture();f.context.actions.LengthMeasurementRole={inspect:()=>new Promise(()=>{}),invokeById:()=>new Promise(()=>{})};
 const pending=f.handlers.get('sketch-convert-length-role')({role:'reference',segmentId:'a',revision:'token'});f.controller.abort();await assert.rejects(pending,{name:'AbortError'});f.dispose();
});
