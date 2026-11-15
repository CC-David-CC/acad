// Mock host protocol tests only: no native geometry, real Worker, browser,
// Craft replay/publication or signed file persistence is qualified here.
import test from 'node:test';import assert from 'node:assert/strict';
import {getEventListeners} from 'node:events';import {runInNewContext} from 'node:vm';
import {registerEdgeTreatmentCommands} from "../../webos/edge-treatment-commands.mjs";
const build='sha256:'+ 'a'.repeat(64)+':'+ 'b'.repeat(64);
const creation=()=>({revision:'r',version:1,unit:'millimeter',engine:'occ',engineRevision:build,bodyId:'owned-body',kind:'fillet',edgeIds:['opaque-b','opaque-a'],size:3});
const edit=()=>({revision:'h',index:1,featureId:4,size:2});
function fixture(){
 const handlers=new Map(),controller=new AbortController(),state={session:{},version:0,valid:true,validThrows:false,targets:0,calls:[]};
 const craft={};for(const method of['inspectWorkerEdgeTreatments','inspectWorkerEdgeTreatmentHistory'])craft[method]=function(){state.calls.push({method,count:arguments.length});return{revision:'r',scope:method}};
 for(const method of['createWorkerEdgeTreatment','editWorkerEdgeTreatment'])craft[method]=async(args,options)=>{state.calls.push({method,args,options});return args};
 const host={signal:controller.signal,session:()=>state.session,commands:{register(def,run){handlers.set(def.id,{def,run});return()=>handlers.delete(def.id)}}};
 const context=()=>{state.targets++;const version=state.version;return{craft,valid:()=>{if(state.validThrows)throw Error('Destroyed realm');return state.valid&&state.version===version}}};
 const stop=registerEdgeTreatmentCommands(host,context);return{state,craft,host,controller,handlers,stop,context,run:(id,args)=>handlers.get(id).run(args)};
}
test('four explicit command schemas expose caller intent without feature allocation/native handles',()=>{
 const f=fixture();assert.deepEqual([...f.handlers.keys()],['inspect-edge-treatments','create-edge-treatment','inspect-edge-treatment-history','edit-edge-treatment']);
 const schema=f.handlers.get('create-edge-treatment').def.parameters;assert.deepEqual(schema.required,Object.keys(creation()));assert.equal(schema.additionalProperties,false);assert.deepEqual(schema.properties.engine.enum,['occ']);assert.deepEqual(schema.properties.kind.enum,['fillet','chamfer-equal']);assert.equal(schema.properties.edgeIds.maxItems,16);assert.equal(schema.properties.edgeIds.uniqueItems,true);assert.equal(schema.properties.edgeIds.items.maxLength,16384);assert.match(build,new RegExp(schema.properties.engineRevision.pattern));
 for(const [command,method]of[['inspect-edge-treatments','inspectWorkerEdgeTreatments'],['inspect-edge-treatment-history','inspectWorkerEdgeTreatmentHistory']]){assert.equal(f.run(command,{}).scope,method);assert.deepEqual(f.state.calls.at(-1),{method,count:0})}
 f.stop();f.stop();assert.equal(f.handlers.size,0);
});
test('creation/edit forward exact detached frozen ordered intent and host lifetime',async()=>{
 const f=fixture();for(const [command,method,args]of[['create-edge-treatment','createWorkerEdgeTreatment',creation()],['edit-edge-treatment','editWorkerEdgeTreatment',edit()]]){
  const expected=structuredClone(args),pending=f.run(command,args);args.revision='changed';args.size=999;if(args.edgeIds)args.edgeIds.reverse();assert.deepEqual(await pending,expected);
  const call=f.state.calls.at(-1);assert.equal(call.method,method);assert.notEqual(call.args,args);assert(Object.isFrozen(call.args));if(call.args.edgeIds)assert(Object.isFrozen(call.args.edgeIds));assert(Object.isFrozen(call.options));assert.equal(call.options.signal,f.controller.signal);assert.equal(call.options.valid(),true);assert.equal(getEventListeners(f.controller.signal,'abort').length,0);
 }f.stop();
});
test('schema required arrays cannot modify private argument admission',async()=>{
 const f=fixture();for(const [command,args]of[['create-edge-treatment',creation()],['edit-edge-treatment',edit()]]){f.handlers.get(command).def.parameters.required.push('handle');assert.deepEqual(await f.run(command,args),args);await assert.rejects(f.run(command,{...args,handle:'forbidden'}))}assert.equal(f.state.calls.length,2);f.stop();
});
test('plain cross-realm and null-prototype intent accepted; classes/arrays/non-data refused',async()=>{
 const f=fixture();assert.deepEqual(await f.run('edit-edge-treatment',runInNewContext('({revision:"h",index:1,featureId:4,size:2})')),edit());assert.deepEqual(await f.run('create-edge-treatment',Object.assign(Object.create(null),creation())),creation());
 const before=f.state.calls.length;for(const input of[null,undefined,[],new class{constructor(){Object.assign(this,edit())}}(),Object.assign(Object.create({x:1}),edit())])await assert.rejects(f.run('edit-edge-treatment',input));assert.equal(f.state.calls.length,before);f.stop();
});
test('accessors/nonenumerable/symbol/extra keys and native/producer/new-feature fields refuse before target',async()=>{
 const f=fixture();let gets=0;const getter=creation();Object.defineProperty(getter,'size',{enumerable:true,get(){gets++;return 3}});const hidden=creation();Object.defineProperty(hidden,'size',{value:3,enumerable:false});
 for(const input of[getter,hidden,{...creation(),[Symbol('x')]:1},{...creation(),handle:'x'},{...creation(),producerFeatureId:2},{...creation(),featureId:3},{...creation(),nativeIndex:1},{...creation(),target:'other'}])await assert.rejects(f.run('create-edge-treatment',input));
 assert.throws(()=>f.run('inspect-edge-treatments',{extra:1}));assert.throws(()=>f.run('inspect-edge-treatment-history',[]));assert.equal(gets,0);assert.equal(f.state.targets,0);assert.equal(f.state.calls.length,0);f.stop();
});
test('edge selection is dense detached own-data and uniquely bounded without coercion',async()=>{
 const f=fixture();const max=Array.from({length:16},(_,i)=>`${i}`+'x'.repeat(16384-String(i).length));assert.deepEqual((await f.run('create-edge-treatment',{...creation(),edgeIds:max})).edgeIds,max);
 let gets=0;const getter=['a'];Object.defineProperty(getter,'0',{enumerable:true,get(){gets++;return'a'}});const hidden=['a'];Object.defineProperty(hidden,'0',{enumerable:false,value:'a'});
 const extras=['a'];extras.extra='b';const symbol=['a'];symbol[Symbol('x')]=1;const before=f.state.calls.length;
 for(const edgeIds of[[],Array(1),['a','a'],[''],['x'.repeat(16385)],Array.from({length:17},(_,i)=>String(i)),[1],getter,hidden,extras,symbol,{0:'a',length:1}])await assert.rejects(f.run('create-edge-treatment',{...creation(),edgeIds}));
 assert.equal(gets,0);assert.equal(f.state.calls.length,before);f.stop();
});
test('all scalar/build bounds refuse malformed values and preserve explicit alternative-build core refusal',async()=>{
 const f=fixture();let coerced=0;for(const change of[{revision:''},{revision:'r'.repeat(257)},{version:'1'},{version:true},{unit:'inch'},{engine:'manifold'},{engine:'auto'},{engineRevision:build+'\n'},{engineRevision:build.toUpperCase()},{bodyId:''},{bodyId:'b'.repeat(1025)},{kind:'chamfer'},{size:0},{size:-0},{size:-1},{size:NaN},{size:Infinity},{size:1e6+1},{size:'2'},{size:{valueOf(){coerced++;return 2}}}])await assert.rejects(f.run('create-edge-treatment',{...creation(),...change}));
 for(const change of[{index:-1},{index:256},{index:1.5},{featureId:0},{featureId:Number.MAX_SAFE_INTEGER+1},{featureId:'4'},{size:0},{size:Infinity},{size:1e6+1}])await assert.rejects(f.run('edit-edge-treatment',{...edit(),...change}));assert.equal(coerced,0);assert.equal(f.state.calls.length,0);
 for(const size of[Number.MIN_VALUE,1e6])assert.equal((await f.run('edit-edge-treatment',{...edit(),size})).size,size);
 const alternate='sha256:'+'1'.repeat(64)+':'+'2'.repeat(64),error=Object.assign(Error('Exact runtime unsupported'),{code:'ENGINE_REVISION_MISMATCH'});f.craft.createWorkerEdgeTreatment=async intent=>{assert.equal(intent.engineRevision,alternate);throw error};await assert.rejects(f.run('create-edge-treatment',{...creation(),engineRevision:alternate}),e=>e===error);f.stop();
});
test('unavailable session/window/realm/signal/method refuse without any fallback',async()=>{
 for(const mode of['session','window','realm','signal','missing']){const f=fixture();if(mode==='session')f.state.session=null;if(mode==='window')f.state.valid=false;if(mode==='realm')f.state.validThrows=true;if(mode==='signal')f.controller.abort();if(mode==='missing')delete f.craft.createWorkerEdgeTreatment;await assert.rejects(f.run('create-edge-treatment',creation()),/unavailable/);assert.equal(f.state.calls.length,0);f.stop()}
});
test('pending creation/edit settle on session/window/realm/signal loss; late success stays inert',async()=>{
 for(const [command,method,args]of[['create-edge-treatment','createWorkerEdgeTreatment',creation()],['edit-edge-treatment','editWorkerEdgeTreatment',edit()]])for(const mode of['session','window','realm','signal']){
  const f=fixture();let release,options;f.craft[method]=(_args,scope)=>{options=scope;return new Promise(resolve=>release=resolve)};const pending=f.run(command,args);
  if(mode==='session')f.state.session={};if(mode==='window')f.state.version++;if(mode==='realm')f.state.validThrows=true;if(mode==='signal')f.controller.abort();
  await assert.rejects(pending,{name:'AbortError'});assert.equal(options.valid(),false);assert.equal(getEventListeners(f.controller.signal,'abort').length,0);release({late:true});await new Promise(r=>setTimeout(r,0));await assert.rejects(pending,{name:'AbortError'});f.stop();
 }
});
test('sync inspection and successful asynchronous replies recheck captured ownership',async()=>{
 const f=fixture();f.craft.inspectWorkerEdgeTreatments=()=>{f.state.session={};return{shouldNotEscape:true}};assert.throws(()=>f.run('inspect-edge-treatments',{}),/window or account changed/);
 f.craft.editWorkerEdgeTreatment=async()=>{f.state.valid=false;return{shouldNotEscape:true}};await assert.rejects(f.run('edit-edge-treatment',edit()),{name:'AbortError'});f.stop();
});
test('core refusal and committed outcome remain exact; bridge invents no rollback result',async()=>{
 const f=fixture();for(const committed of[false,true]){const error=Object.assign(Error('Core refused'),{code:'REFUSED',committed});f.craft.createWorkerEdgeTreatment=async()=>{throw error};await assert.rejects(f.run('create-edge-treatment',creation()),e=>e===error)}
 const error=Object.assign(Error('Caller lost after publication'),{name:'AbortError',committed:true});let rejectCore;f.craft.editWorkerEdgeTreatment=()=>new Promise((_resolve,reject)=>rejectCore=reject);const pending=f.run('edit-edge-treatment',edit());f.state.valid=false;rejectCore(error);await assert.rejects(pending,e=>e===error);assert.equal(getEventListeners(f.controller.signal,'abort').length,0);f.stop();
});
// Retained first-run observation: a stronger mock expected exact committed:true
// even when the method synchronously invalidated its lifetime BEFORE returning
// its rejected promise. Original combined run: 28/29, assertion validation false;
// actual: AbortError('Modeling command was cancelled or its outcome is unavailable.').
// scoped-command.mjs SHA e3a6cea748e01ded5ea8ebf09eca72d1bac3839203e43697aafb546de9177640
// explicitly documents pending cancellation as unknown outcome. This is not the
// settled-core-error case above; never infer committed:false or promise rollback.
// The product helper is unchanged, and the boundary was reported for root review.
test('already-lost lifetime reports unknown outcome before later core settlement',async()=>{
 const f=fixture();f.craft.editWorkerEdgeTreatment=async()=>{f.state.valid=false;throw Object.assign(Error('Late committed refusal'),{committed:true})};
 await assert.rejects(f.run('edit-edge-treatment',edit()),error=>error.name==='AbortError'&&/outcome is unavailable/.test(error.message)&&!Object.hasOwn(error,'committed'));
 assert.equal(getEventListeners(f.controller.signal,'abort').length,0);f.stop();
});
test('partial registration cleans up reverse-order and disposal is idempotent',()=>{
 const f=fixture();f.stop();const removed=[];let count=0;assert.throws(()=>registerEdgeTreatmentCommands({...f.host,commands:{register(def){if(++count===4)throw Error('registration failed');return()=>removed.push(def.id)}}},f.context),/registration failed/);assert.deepEqual(removed,['inspect-edge-treatment-history','create-edge-treatment','inspect-edge-treatments']);f.stop();assert.equal(f.handlers.size,0);
});
