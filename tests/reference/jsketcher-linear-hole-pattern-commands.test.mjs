// Mock host protocol tests only: no native geometry, real Worker, browser,
// Craft replay/publication or signed file persistence is qualified here.
import test from 'node:test';import assert from 'node:assert/strict';
import {getEventListeners} from 'node:events';import {runInNewContext} from 'node:vm';
import {registerLinearHolePatternCommands} from '../apps/system/jsketcher/linear-hole-pattern-commands.mjs';
const build='sha256:'+ 'a'.repeat(64)+':'+ 'b'.repeat(64);
const creation=()=>({revision:'r',version:1,unit:'millimeter',engine:'occ',engineRevision:build,bodyId:'owned-body',seedFeatureId:3,axis:'source-local-x-positive',count:3,spacing:20});
const edit=()=>({revision:'h',index:1,featureId:4,count:4,spacing:15});
function fixture(){
 const handlers=new Map(),controller=new AbortController(),state={session:{},version:0,valid:true,validThrows:false,targets:0,calls:[]};
 const craft={};for(const method of['inspectWorkerLinearHolePatterns','inspectWorkerLinearHolePatternHistory'])craft[method]=function(){state.calls.push({method,count:arguments.length});return{revision:'r',scope:method}};
 for(const method of['createWorkerLinearHolePattern','editWorkerLinearHolePattern'])craft[method]=async(args,options)=>{state.calls.push({method,args,options});return args};
 const host={signal:controller.signal,session:()=>state.session,commands:{register(def,run){handlers.set(def.id,{def,run});return()=>handlers.delete(def.id)}}};
 const context=()=>{state.targets++;const version=state.version;return{craft,valid:()=>{if(state.validThrows)throw Error('Destroyed realm');return state.valid&&state.version===version}}};
 const stop=registerLinearHolePatternCommands(host,context);return{state,craft,host,controller,handlers,stop,context,run:(id,args)=>handlers.get(id).run(args)};
}
test('four explicit command schemas expose caller intent without feature allocation/native handles',()=>{
 const f=fixture();assert.deepEqual([...f.handlers.keys()],['inspect-linear-hole-patterns','create-linear-hole-pattern','inspect-linear-hole-pattern-history','edit-linear-hole-pattern']);
 const schema=f.handlers.get('create-linear-hole-pattern').def.parameters;assert.deepEqual(schema.required,Object.keys(creation()));assert.equal(schema.additionalProperties,false);assert.deepEqual(schema.properties.engine.enum,['occ']);assert.deepEqual(schema.properties.axis.enum,['source-local-x-positive']);assert.equal(schema.properties.count.minimum,2);assert.equal(schema.properties.count.maximum,17);assert.match(build,new RegExp(schema.properties.engineRevision.pattern));
 for(const [command,method]of[['inspect-linear-hole-patterns','inspectWorkerLinearHolePatterns'],['inspect-linear-hole-pattern-history','inspectWorkerLinearHolePatternHistory']]){assert.equal(f.run(command,{}).scope,method);assert.deepEqual(f.state.calls.at(-1),{method,count:0})}
 f.stop();f.stop();assert.equal(f.handlers.size,0);
});
test('creation/edit forward exact detached frozen intent and host lifetime',async()=>{
 const f=fixture();for(const [command,method,args]of[['create-linear-hole-pattern','createWorkerLinearHolePattern',creation()],['edit-linear-hole-pattern','editWorkerLinearHolePattern',edit()]]){
  const expected=structuredClone(args),pending=f.run(command,args);args.revision='changed';args.spacing=999;args.count=17;assert.deepEqual(await pending,expected);
  const call=f.state.calls.at(-1);assert.equal(call.method,method);assert.notEqual(call.args,args);assert(Object.isFrozen(call.args));assert(Object.isFrozen(call.options));assert.equal(call.options.signal,f.controller.signal);assert.equal(call.options.valid(),true);assert.equal(getEventListeners(f.controller.signal,'abort').length,0);
 }f.stop();
});
test('schema required arrays cannot modify private argument admission',async()=>{
 const f=fixture();for(const [command,args]of[['create-linear-hole-pattern',creation()],['edit-linear-hole-pattern',edit()]]){f.handlers.get(command).def.parameters.required.push('handle');assert.deepEqual(await f.run(command,args),args);await assert.rejects(f.run(command,{...args,handle:'forbidden'}))}assert.equal(f.state.calls.length,2);f.stop();
});
test('plain cross-realm and null-prototype intent accepted; classes/arrays/non-data refused',async()=>{
 const f=fixture();assert.deepEqual(await f.run('edit-linear-hole-pattern',runInNewContext('({revision:"h",index:1,featureId:4,count:4,spacing:15})')),edit());assert.deepEqual(await f.run('create-linear-hole-pattern',Object.assign(Object.create(null),creation())),creation());
 const before=f.state.calls.length;for(const input of[null,undefined,[],new class{constructor(){Object.assign(this,edit())}}(),Object.assign(Object.create({x:1}),edit())])await assert.rejects(f.run('edit-linear-hole-pattern',input));assert.equal(f.state.calls.length,before);f.stop();
});
test('accessors/nonenumerable/symbol/extra keys and native/producer/new-feature fields refuse before target',async()=>{
 const f=fixture();let gets=0;const getter=creation();Object.defineProperty(getter,'spacing',{enumerable:true,get(){gets++;return 20}});const hidden=creation();Object.defineProperty(hidden,'spacing',{value:20,enumerable:false});
 for(const input of[getter,hidden,{...creation(),[Symbol('x')]:1},{...creation(),handle:'x'},{...creation(),producerFeatureId:2},{...creation(),featureId:3},{...creation(),nativeIndex:1},{...creation(),target:'other'}])await assert.rejects(f.run('create-linear-hole-pattern',input));
 assert.throws(()=>f.run('inspect-linear-hole-patterns',{extra:1}));assert.throws(()=>f.run('inspect-linear-hole-pattern-history',[]));assert.equal(gets,0);assert.equal(f.state.targets,0);assert.equal(f.state.calls.length,0);f.stop();
});
test('all scalar/build bounds refuse malformed values and preserve explicit alternative-build core refusal',async()=>{
 const f=fixture();let coerced=0;for(const change of[{revision:''},{revision:'r'.repeat(257)},{version:'1'},{version:true},{unit:'inch'},{engine:'manifold'},{engine:'auto'},{engineRevision:build+'\n'},{engineRevision:build.toUpperCase()},{bodyId:''},{bodyId:'b'.repeat(1025)},{seedFeatureId:0},{seedFeatureId:'3'},{axis:'x'},{count:0},{count:1},{count:18},{count:2.5},{count:'3'},{spacing:0},{spacing:-0},{spacing:-1},{spacing:NaN},{spacing:Infinity},{spacing:1e6+1},{spacing:'2'},{spacing:{valueOf(){coerced++;return 2}}}])await assert.rejects(f.run('create-linear-hole-pattern',{...creation(),...change}));
 for(const change of[{index:-1},{index:256},{index:1.5},{featureId:0},{featureId:Number.MAX_SAFE_INTEGER+1},{featureId:'4'},{count:1},{spacing:0},{spacing:Infinity},{spacing:1e6+1}])await assert.rejects(f.run('edit-linear-hole-pattern',{...edit(),...change}));assert.equal(coerced,0);assert.equal(f.state.calls.length,0);
 for(const spacing of[Number.MIN_VALUE,1e6])assert.equal((await f.run('edit-linear-hole-pattern',{...edit(),spacing})).spacing,spacing);
 const alternate='sha256:'+'1'.repeat(64)+':'+'2'.repeat(64),error=Object.assign(Error('Exact runtime unsupported'),{code:'ENGINE_REVISION_MISMATCH'});f.craft.createWorkerLinearHolePattern=async intent=>{assert.equal(intent.engineRevision,alternate);throw error};await assert.rejects(f.run('create-linear-hole-pattern',{...creation(),engineRevision:alternate}),e=>e===error);f.stop();
});
test('unavailable session/window/realm/signal/method refuse without any fallback',async()=>{
 for(const mode of['session','window','realm','signal','missing']){const f=fixture();if(mode==='session')f.state.session=null;if(mode==='window')f.state.valid=false;if(mode==='realm')f.state.validThrows=true;if(mode==='signal')f.controller.abort();if(mode==='missing')delete f.craft.createWorkerLinearHolePattern;await assert.rejects(f.run('create-linear-hole-pattern',creation()),/unavailable/);assert.equal(f.state.calls.length,0);f.stop()}
});
test('pending creation/edit settle on session/window/realm/signal loss; late success stays inert',async()=>{
 for(const [command,method,args]of[['create-linear-hole-pattern','createWorkerLinearHolePattern',creation()],['edit-linear-hole-pattern','editWorkerLinearHolePattern',edit()]])for(const mode of['session','window','realm','signal']){
  const f=fixture();let release,options;f.craft[method]=(_args,scope)=>{options=scope;return new Promise(resolve=>release=resolve)};const pending=f.run(command,args);
  if(mode==='session')f.state.session={};if(mode==='window')f.state.version++;if(mode==='realm')f.state.validThrows=true;if(mode==='signal')f.controller.abort();
  await assert.rejects(pending,{name:'AbortError'});assert.equal(options.valid(),false);assert.equal(getEventListeners(f.controller.signal,'abort').length,0);release({late:true});await new Promise(r=>setTimeout(r,0));await assert.rejects(pending,{name:'AbortError'});f.stop();
 }
});
test('sync inspection and successful asynchronous replies recheck captured ownership',async()=>{
 const f=fixture();f.craft.inspectWorkerLinearHolePatterns=()=>{f.state.session={};return{shouldNotEscape:true}};assert.throws(()=>f.run('inspect-linear-hole-patterns',{}),/window or account changed/);
 f.craft.editWorkerLinearHolePattern=async()=>{f.state.valid=false;return{shouldNotEscape:true}};await assert.rejects(f.run('edit-linear-hole-pattern',edit()),{name:'AbortError'});f.stop();
});
test('core refusal and committed outcome remain exact; bridge invents no rollback result',async()=>{
 const f=fixture();for(const committed of[false,true]){const error=Object.assign(Error('Core refused'),{code:'REFUSED',committed});f.craft.createWorkerLinearHolePattern=async()=>{throw error};await assert.rejects(f.run('create-linear-hole-pattern',creation()),e=>e===error)}
 const error=Object.assign(Error('Caller lost after publication'),{name:'AbortError',committed:true});let rejectCore;f.craft.editWorkerLinearHolePattern=()=>new Promise((_resolve,reject)=>rejectCore=reject);const pending=f.run('edit-linear-hole-pattern',edit());f.state.valid=false;rejectCore(error);await assert.rejects(pending,e=>e===error);assert.equal(getEventListeners(f.controller.signal,'abort').length,0);f.stop();
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
 const f=fixture();f.craft.editWorkerLinearHolePattern=async()=>{f.state.valid=false;throw Object.assign(Error('Late committed refusal'),{committed:true})};
 await assert.rejects(f.run('edit-linear-hole-pattern',edit()),error=>error.name==='AbortError'&&/outcome is unavailable/.test(error.message)&&!Object.hasOwn(error,'committed'));
 assert.equal(getEventListeners(f.controller.signal,'abort').length,0);f.stop();
});
test('partial registration cleans up reverse-order and disposal is idempotent',()=>{
 const f=fixture();f.stop();const removed=[];let count=0;assert.throws(()=>registerLinearHolePatternCommands({...f.host,commands:{register(def){if(++count===4)throw Error('registration failed');return()=>removed.push(def.id)}}},f.context),/registration failed/);assert.deepEqual(removed,['inspect-linear-hole-pattern-history','create-linear-hole-pattern','inspect-linear-hole-patterns']);f.stop();assert.equal(f.handlers.size,0);
});
