// Protocol-boundary tests only: fake craft methods are not geometry, solver,
// genuine Worker, native publication, browser or signed-persistence proof.
import test from 'node:test';import assert from 'node:assert/strict';
import {getEventListeners} from 'node:events';import {runInNewContext} from 'node:vm';
import {registerSelectedProfileCommands} from '../apps/system/jsketcher/selected-profile-commands.mjs';
const build='sha256:cbd49d63d0900f50dda7fc53518d5f06183e85b1dea720522cc2994b0876adc9:a81af0b78dd585124f3f2d05d09b4a387b276bd1f655f0234002a6ab4646a637';
const inspection=()=>({revision:'revision',faceId:'source-plane',depth:5});
const depthEdit=()=>({revision:'authored-revision',index:1,featureId:2,depth:7.5});
const creation=()=>({...inspection(),regionId:'sketch-region:{"faceId":"source-plane","outer":["source-plane/c"],"holes":[]}',unit:'millimeter',engine:'occ',engineRevision:build,bodyPolicy:'separate'});
function fixture(){
 const handlers=new Map(),controller=new AbortController(),state={session:{},valid:true,version:0,validThrows:false,calls:[],targets:0};
 const craft={inspectSelectedProfileCommands(){state.calls.push({method:'inspectSelectedProfileCommands',count:arguments.length});return {ready:true,revision:'revision',engineRevision:build,sourceFaces:[{faceId:'source-plane'}]};}};
 craft.inspectSelectedProfileHistory=function(){state.calls.push({method:'inspectSelectedProfileHistory',count:arguments.length});return{ready:true,revision:'authored-revision',features:[]};};
 for(const method of['inspectSelectedProfileRegions','createSelectedProfileExtrusion','editSelectedProfileDepth'])craft[method]=async(args,options)=>{state.calls.push({method,args,options});return args;};
 const host={signal:controller.signal,session:()=>state.session,commands:{register(def,run){handlers.set(def.id,{def,run});return()=>handlers.delete(def.id);}}};
 const getTarget=()=>{state.targets++;const version=state.version;return{craft,valid:()=>{if(state.validThrows)throw Error('Destroyed realm');return state.valid&&state.version===version;}};};
 const stop=registerSelectedProfileCommands(host,getTarget);return{state,craft,host,controller,handlers,stop,getTarget,run:(id,args)=>handlers.get(id).run(args)};
}
test('register five explicit selected-profile commands with data-only schemas and no fallback/save payload',()=>{
 const f=fixture();assert.deepEqual([...f.handlers.keys()],['inspect-selected-profiles','inspect-selected-regions','create-selected-extrusion','inspect-selected-profile-history','edit-selected-profile-depth']);
 const read=f.handlers.get('inspect-selected-regions').def.parameters,create=f.handlers.get('create-selected-extrusion').def.parameters;
 assert.deepEqual(read.required,['revision','faceId','depth']);assert.deepEqual(create.required,['revision','faceId','regionId','unit','engine','engineRevision','depth','bodyPolicy']);
 assert.equal(read.additionalProperties,false);assert.equal(create.additionalProperties,false);assert.deepEqual(create.properties.engine.enum,['occ']);assert.deepEqual(create.properties.unit.enum,['millimeter']);assert.deepEqual(create.properties.bodyPolicy.enum,['separate']);assert.equal(create.properties.regionId.maxLength,8192);assert.equal(read.properties.faceId.maxLength,256);assert.equal(create.properties.engineRevision.minLength,136);assert.equal(create.properties.engineRevision.maxLength,136);assert.match(build,new RegExp(create.properties.engineRevision.pattern));
 assert.equal(f.run('inspect-selected-profiles',{}).engineRevision,build);assert.deepEqual(f.state.calls,[{method:'inspectSelectedProfileCommands',count:0}]);f.stop();f.stop();assert.equal(f.handlers.size,0);
});
test('async commands capture detached frozen intent and pass the exact host signal/current guard',async()=>{
 const f=fixture();for(const [command,method,args]of[['inspect-selected-regions','inspectSelectedProfileRegions',inspection()],['create-selected-extrusion','createSelectedProfileExtrusion',creation()],['edit-selected-profile-depth','editSelectedProfileDepth',depthEdit()]]){
  const expected={...args},pending=f.run(command,args);args.revision='changed';args.depth=999;if('regionId'in args)args.regionId='changed';const result=await pending,last=f.state.calls.at(-1);assert.deepEqual(result,expected);assert.equal(last.method,method);assert.notEqual(last.args,args);assert.ok(Object.isFrozen(last.args));assert.ok(Object.isFrozen(last.options));assert.equal(last.options.signal,f.controller.signal);assert.equal(last.options.valid(),true);assert.equal(getEventListeners(f.controller.signal,'abort').length,0);
 }f.stop();
});
test('advertised required-key arrays cannot mutate the private input whitelist',async()=>{
 const f=fixture();for(const [command,args]of[['inspect-selected-regions',inspection()],['create-selected-extrusion',creation()],['edit-selected-profile-depth',depthEdit()]]){
  f.handlers.get(command).def.parameters.required.push('rawSource');assert.deepEqual(await f.run(command,args),args);const count=f.state.calls.length;await assert.rejects(f.run(command,{...args,rawSource:'not allowed'}));assert.equal(f.state.calls.length,count);
 }f.stop();
});
test('plain cross-realm and null-prototype data are accepted; arrays/classes/non-data records refuse',async()=>{
 const f=fixture(),cross=runInNewContext('({revision:"revision",faceId:"source-plane",depth:5})');assert.deepEqual(await f.run('inspect-selected-regions',cross),inspection());assert.deepEqual(await f.run('inspect-selected-regions',Object.assign(Object.create(null),inspection())),inspection());
 const count=f.state.calls.length;for(const args of[null,undefined,[],Array(3),new class{constructor(){Object.assign(this,inspection());}}(),Object.assign(Object.create({inherited:true}),inspection())])await assert.rejects(f.run('inspect-selected-regions',args));assert.equal(f.state.calls.length,count);f.stop();
});
test('accessors, unknown/string/symbol fields, sparse values and nonenumerable fields refuse before target dispatch',async()=>{
 const f=fixture();let gets=0;const depthGetter=inspection();Object.defineProperty(depthGetter,'depth',{enumerable:true,get(){gets++;return 5;}});const idGetter=creation();Object.defineProperty(idGetter,'regionId',{enumerable:true,get(){gets++;return 'sketch-region:x';}});
 const hidden=inspection();Object.defineProperty(hidden,'depth',{enumerable:false,value:5});const symbol={...creation(),[Symbol('unknown')]:1},wrong={...inspection(),unknown:1};delete wrong.depth;
 for(const [command,args]of[['inspect-selected-regions',depthGetter],['create-selected-extrusion',idGetter],['inspect-selected-regions',hidden],['create-selected-extrusion',symbol],['inspect-selected-regions',wrong],['inspect-selected-regions',{...inspection(),depth:Array(2)}],['create-selected-extrusion',{...creation(),regionId:Array(2)}],['create-selected-extrusion',{...creation(),rawHistory:[]}],['create-selected-extrusion',{...creation(),handle:{}}]])await assert.rejects(f.run(command,args));
 assert.throws(()=>f.run('inspect-selected-profiles',{extra:1}));assert.throws(()=>f.run('inspect-selected-profiles',[]));assert.equal(gets,0);assert.equal(f.state.calls.length,0);assert.equal(f.state.targets,0);f.stop();
});
test('bounded identities/depth preserve exact opaque data and reject invalid values without coercion',async()=>{
 const f=fixture();for(const depth of[Number.MIN_VALUE,1,1e6])assert.equal((await f.run('inspect-selected-regions',{revision:'r'.repeat(256),faceId:'f'.repeat(256),depth})).depth,depth);
 const huge=creation();huge.regionId='sketch-region:'+'x'.repeat(8192-'sketch-region:'.length);assert.equal((await f.run('create-selected-extrusion',huge)).regionId,huge.regionId);
 const count=f.state.calls.length;let coerced=0;for(const extra of[{revision:''},{revision:'r'.repeat(257)},{faceId:''},{faceId:'f'.repeat(257)},{faceId:3},{depth:0},{depth:-0},{depth:-1},{depth:NaN},{depth:Infinity},{depth:1e6+1},{depth:'5'},{depth:{valueOf(){coerced++;return 5;}}}])await assert.rejects(f.run('inspect-selected-regions',{...inspection(),...extra}));
 for(const extra of[{regionId:''},{regionId:'wrong'},{regionId:huge.regionId+'x'},{revision:''},{faceId:'f'.repeat(257)},{depth:0},{depth:Infinity},{depth:1e6+1}])await assert.rejects(f.run('create-selected-extrusion',{...creation(),...extra}));assert.equal(coerced,0);assert.equal(f.state.calls.length,count);f.stop();
});
test('engine/unit/body-policy and engine revision are explicit; exact available build remains core authority',async()=>{
 const f=fixture();for(const extra of[{engine:'smlib'},{engine:'manifold'},{engine:'occ '},{unit:'inch'},{unit:'mm'},{bodyPolicy:'union'},{engineRevision:build+'\n'},{engineRevision:build.toUpperCase()},{engineRevision:'sha256:'+ 'a'.repeat(64)},{engineRevision:new String(build)}])await assert.rejects(f.run('create-selected-extrusion',{...creation(),...extra}));assert.equal(f.state.calls.length,0);
 const alternate='sha256:'+'1'.repeat(64)+':'+'2'.repeat(64);f.craft.createSelectedProfileExtrusion=async args=>{f.state.calls.push({args});assert.equal(args.engineRevision,alternate);throw Object.assign(Error('Exact qualified build differs'),{code:'ENGINE_REVISION_MISMATCH'});};await assert.rejects(f.run('create-selected-extrusion',{...creation(),engineRevision:alternate}),{code:'ENGINE_REVISION_MISMATCH'});assert.equal(f.state.calls.length,1);f.stop();
});
test('unavailable target, absent method and already-lost lifetime never fall back to another operation',async()=>{
 for(const mode of['session','signal','target','throwing-target','missing']){
  const f=fixture();let fallback=0;f.craft.createWorkerExtrusion=()=>{fallback++;};if(mode==='session')f.state.session=null;if(mode==='signal')f.controller.abort();if(mode==='target')f.state.valid=false;if(mode==='throwing-target')f.state.validThrows=true;if(mode==='missing')delete f.craft.createSelectedProfileExtrusion;
  await assert.rejects(f.run('create-selected-extrusion',creation()),/unavailable/);assert.equal(f.state.calls.length,0);assert.equal(fallback,0);f.stop();
 }
});
test('pending commands settle on account/frame/signal/realm loss and late success is inert',async()=>{
 for(const [command,method,args]of[['inspect-selected-regions','inspectSelectedProfileRegions',inspection()],['create-selected-extrusion','createSelectedProfileExtrusion',creation()],['edit-selected-profile-depth','editSelectedProfileDepth',depthEdit()]])for(const mode of['session','frame','signal','realm']){
  const f=fixture();let release,options;f.craft[method]=(_args,scope)=>{options=scope;return new Promise(r=>release=r);};const pending=f.run(command,args);
  if(mode==='session')f.state.session={};if(mode==='frame')f.state.version++;if(mode==='signal')f.controller.abort();if(mode==='realm')f.state.validThrows=true;
  await assert.rejects(pending,{name:'AbortError'});assert.equal(options.valid(),false);assert.equal(getEventListeners(f.controller.signal,'abort').length,0);release({late:true});await new Promise(r=>setTimeout(r,0));await assert.rejects(pending,{name:'AbortError'});f.stop();
 }
});
test('successful replies are rechecked, synchronous discovery rechecks owner, and genuine core errors propagate',async()=>{
 const f=fixture();f.craft.inspectSelectedProfileRegions=async()=>{f.state.valid=false;return{shouldNotEscape:true};};await assert.rejects(f.run('inspect-selected-regions',inspection()),{name:'AbortError'});f.state.valid=true;f.craft.inspectSelectedProfileCommands=()=>{f.state.session={};return{shouldNotEscape:true};};assert.throws(()=>f.run('inspect-selected-profiles',{}),/window or account changed/);
 const coreError=Object.assign(Error('Core refusal'),{code:'UNSUPPORTED_REGION_TOPOLOGY'});f.craft.createSelectedProfileExtrusion=async()=>{throw coreError;};await assert.rejects(f.run('create-selected-extrusion',creation()),e=>e===coreError);assert.equal(getEventListeners(f.controller.signal,'abort').length,0);f.stop();
});
test('partial registration failure unregisters earlier commands in reverse order',()=>{
 const f=fixture(),removed=[];let count=0;f.stop();assert.throws(()=>registerSelectedProfileCommands({...f.host,commands:{register(def){if(++count===3)throw Error('registration failed');return()=>removed.push(def.id);}}},f.getTarget),/registration failed/);assert.deepEqual(removed,['inspect-selected-regions','inspect-selected-profiles']);
});

test('depth history discovery is read-only and exposes no caller-authored history',async()=>{
 const f=fixture();assert.equal(f.run('inspect-selected-profile-history',{}).revision,'authored-revision');assert.deepEqual(f.state.calls,[{method:'inspectSelectedProfileHistory',count:0}]);
 const schema=f.handlers.get('edit-selected-profile-depth').def.parameters;assert.deepEqual(schema.required,['revision','index','featureId','depth']);assert.equal(schema.additionalProperties,false);assert.equal(schema.properties.index.maximum,255);
 for(const value of[{history:[]},[],null])assert.throws(()=>f.run('inspect-selected-profile-history',value));
 f.craft.inspectSelectedProfileHistory=()=>{f.state.session={};return{};};assert.throws(()=>f.run('inspect-selected-profile-history',{}),/window or account changed/);f.stop();
});
test('depth edits reject invalid identities, accessors and unrequested model fields before dispatch',async()=>{
 const f=fixture();let reads=0;const getter=depthEdit();Object.defineProperty(getter,'depth',{enumerable:true,get(){reads++;return 5;}});
 for(const args of[getter,{...depthEdit(),index:-1},{...depthEdit(),index:256},{...depthEdit(),index:1.5},{...depthEdit(),index:'1'},{...depthEdit(),featureId:0},{...depthEdit(),featureId:1.5},{...depthEdit(),featureId:'2'},{...depthEdit(),depth:0},{...depthEdit(),depth:Infinity},{...depthEdit(),depth:1e6+1},{...depthEdit(),depth:'7.5'},{...depthEdit(),revision:''},{...depthEdit(),engine:'occ'},{...depthEdit(),history:[]}])await assert.rejects(f.run('edit-selected-profile-depth',args));
 assert.equal(reads,0);assert.equal(f.state.targets,0);assert.equal(f.state.calls.length,0);f.stop();
});
test('depth bridge preserves explicit committed failure from the core without inventing rollback',async()=>{
 const f=fixture(),error=new DOMException('Accepted change was superseded.','AbortError');Object.defineProperty(error,'committed',{value:true});
 f.craft.editSelectedProfileDepth=async()=>{throw error;};await assert.rejects(f.run('edit-selected-profile-depth',depthEdit()),e=>e===error&&e.committed===true);f.stop();
});
