// Host transport/admission controls only; no synthetic native geometry or UI.
import test from 'node:test';
import assert from 'node:assert/strict';
import {registerRevolveCommands} from '../apps/system/jsketcher/revolve-commands.mjs';
const methods=['inspectWorkerRevolves','inspectWorkerRevolveRegions','createWorkerRevolve','inspectWorkerRevolveHistory','editWorkerRevolve'];
const create=()=>({revision:'creation:1',unit:'millimeter',engine:'occ',engineRevision:'sha256:'+'a'.repeat(64)+':'+'b'.repeat(64),faceId:'source-face',regionId:'sketch-region:opaque',axisSegmentId:'source-segment',angleRadians:Math.PI,bodyPolicy:'separate'});
function fixture(){
 const entries=new Map(),calls=[],controller=new AbortController();let session={},valid=true,reply=()=>Promise.resolve({transportControl:true});
 const craft=Object.fromEntries(methods.map(method=>[method,(...args)=>{calls.push({method,args});return method.startsWith('inspect')&&!method.endsWith('Regions')?{transportControl:true}:reply();}]));
 const host={signal:controller.signal,session:()=>session,commands:{register(spec,run){entries.set(spec.id,{spec,run});return()=>entries.delete(spec.id);}}};
 const dispose=registerRevolveCommands(host,()=>({craft,valid:()=>valid}));
 return {entries,calls,craft,dispose,changeAccount(){session={};},invalidate(){valid=false;},hold(){let resolve;const promise=new Promise(r=>{resolve=r;});reply=()=>promise;return resolve;}};
}
test('five commands retain signed angle and distinct revision roles',async()=>{
 const f=fixture();assert.equal(f.entries.size,5);const value=create();value.angleRadians=-Math.PI;await f.entries.get('create-worker-revolve').run(value);assert.equal(f.calls.at(-1).method,'createWorkerRevolve');assert.deepEqual(f.calls.at(-1).args[0],value);assert(Object.isFrozen(f.calls.at(-1).args[0]));
 const edit={revision:'authored:2',index:0,featureId:42,angleRadians:2*Math.PI};await f.entries.get('edit-worker-revolve').run(edit);assert.deepEqual(f.calls.at(-1).args[0],edit);f.dispose();f.dispose();assert.equal(f.entries.size,0);
});
test('invalid intent/accessors never reach core',()=>{
 const f=fixture(),run=f.entries.get('create-worker-revolve').run;for(const patch of[{angleRadians:0},{angleRadians:NaN},{angleRadians:Infinity},{angleRadians:2*Math.PI+1e-8},{unit:'inch'},{engine:'smlib'},{engineRevision:'latest'},{engineRevision:create().engineRevision+'\n'},{regionId:'first-region'},{axisSegmentId:''},{bodyPolicy:'join'},{extra:true}])assert.throws(()=>run({...create(),...patch}));let getters=0;const input=create();Object.defineProperty(input,'angleRadians',{enumerable:true,get(){getters++;return Math.PI;}});assert.throws(()=>run(input));assert.equal(getters,0);assert.equal(f.calls.length,0);f.dispose();
});
test('captured input is detached during pending transport',async()=>{
 const f=fixture(),release=f.hold(),input=create(),pending=f.entries.get('create-worker-revolve').run(input);input.angleRadians=1;input.axisSegmentId='changed';assert.equal(f.calls[0].args[0].angleRadians,Math.PI);assert.equal(f.calls[0].args[0].axisSegmentId,'source-segment');release({transportControl:true});await pending;f.dispose();
});
test('account loss rejects unavailable outcome; late transport remains inert',async()=>{
 const f=fixture(),release=f.hold(),pending=f.entries.get('create-worker-revolve').run(create());f.changeAccount();await assert.rejects(pending,e=>e.name==='AbortError'&&!Object.hasOwn(e,'committed'));release({transportControl:true});f.dispose();
});
test('missing method/invalidated target refuse',()=>{
 const f=fixture();delete f.craft.inspectWorkerRevolves;assert.throws(()=>f.entries.get('inspect-worker-revolves').run({}),/unavailable/);f.invalidate();assert.throws(()=>f.entries.get('inspect-worker-revolve-history').run({}),/unavailable/);assert.equal(f.calls.length,0);f.dispose();
});
test('partial registration refusal unregisters earlier commands',()=>{
 let registered=0,removed=0;assert.throws(()=>registerRevolveCommands({signal:new AbortController().signal,session:()=>({}),commands:{register(){if(++registered===3)throw Error('controlled refusal');return()=>removed++;}}},()=>({})),/controlled refusal/);assert.equal(removed,2);
});
