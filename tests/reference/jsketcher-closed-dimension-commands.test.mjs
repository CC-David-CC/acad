// Host-adapter controls only; real solver/model qualification is separate.
import test from 'node:test';
import assert from 'node:assert/strict';
import {registerClosedSketchCommands} from "../../webos/closed-sketch-commands.mjs";

function fixture() {
 const entries=new Map(),controller=new AbortController(),state={session:{},valid:true,calls:[]};
 const craft={};
 for(const name of ['editClosedSketchDimension','removeClosedSketchDimension'])craft[name]=async(input,options)=>{state.calls.push({name,input,options});return {changed:true,input};};
 const host={signal:controller.signal,session:()=>state.session,commands:{register(d,handler){entries.set(d.id,{d,handler});return ()=>entries.delete(d.id);}}};
 const stop=registerClosedSketchCommands(host,()=>({craft,valid:()=>state.valid}));
 return {entries,controller,state,craft,stop,run:(name,args)=>entries.get(name).handler(args)};
}
const edit='edit-closed-sketch-dimension',remove='remove-closed-sketch-dimension';
const base={revision:'revision',faceId:'plane',constraintId:'opaque locator'};

test('length edit/remove are discoverable, detach exact intent and forward host lifetime',async()=>{
 const f=fixture(),input={...base,value:25.4},pending=f.run(edit,input);input.value=999;
 assert.deepEqual((await pending).input,{...base,value:25.4});
 assert(Object.isFrozen(f.state.calls[0].input));assert.equal(f.state.calls[0].options.signal,f.controller.signal);assert.equal(f.state.calls[0].options.valid(),true);
 assert.deepEqual((await f.run(remove,base)).input,base);assert.equal(f.state.calls[1].name,'removeClosedSketchDimension');
 const schema=f.entries.get(edit).d.parameters;assert.equal(schema.additionalProperties,false);assert.equal(schema.properties.value.oneOf.length,2);
 f.stop();f.stop();assert.equal(f.entries.size,0);
});
test('canonical numeric bounds and typed names are retained without display conversion',async()=>{
 const f=fixture();for(const value of [Number.MIN_VALUE,1e6,'width','_wall','$diameter','a'.repeat(128)])assert.equal((await f.run(edit,{...base,value})).input.value,value);
 f.stop();
});
test('malformed value, extra addressing fields and absent locators refuse before dispatch',async()=>{
 const f=fixture();
 for(const value of [0,-1,1e6+1,NaN,Infinity,'25.4','20 mm','wall*2','a'.repeat(129),true,null,{},[]])await assert.rejects(f.run(edit,{...base,value}));
 for(const change of [{revision:''},{revision:'x'.repeat(257)},{faceId:''},{faceId:'x'.repeat(1025)},{constraintId:''},{constraintId:'x'.repeat(4097)},{stage:0},{index:1},{value:20}])await assert.rejects(f.run(remove,{...base,...change}));
 assert.equal(f.state.calls.length,0);f.stop();
});
test('accessors are never evaluated and exact opaque IDs are preserved',async()=>{
 const f=fixture();let gets=0;const value={...base};Object.defineProperty(value,'value',{enumerable:true,get(){gets++;return 10;}});
 await assert.rejects(f.run(edit,value));assert.equal(gets,0);assert.equal(f.state.calls.length,0);
 const opaque='constraint:["雪",\\opaque]';assert.equal((await f.run(remove,{...base,constraintId:opaque})).input.constraintId,opaque);f.stop();
});
test('window/account loss settles held calls and late results cannot deliver old data',async()=>{
 for(const loss of ['session','window','abort']){
  const f=fixture();let deliver;f.craft.editClosedSketchDimension=()=>new Promise(resolve=>{deliver=resolve;});
  const pending=f.run(edit,{...base,value:10});
  if(loss==='session')f.state.session={};else if(loss==='window')f.state.valid=false;else f.controller.abort();
  await assert.rejects(pending,{name:'AbortError'});deliver({changed:true});f.stop();
 }
});
test('known core publication failures retain their committed marker and solver cause',async()=>{
 const f=fixture(),error=Object.assign(Error('Core result superseded'),{name:'AbortError',committed:true,cause:{code:'EXAMPLE'}});
 f.craft.removeClosedSketchDimension=async()=>{throw error;};await assert.rejects(f.run(remove,base),e=>e===error&&e.committed===true&&e.cause.code==='EXAMPLE');f.stop();
});
