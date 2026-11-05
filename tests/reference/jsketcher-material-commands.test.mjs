import test from 'node:test';
import assert from 'node:assert/strict';
import {registerMaterialCommands} from '../apps/system/jsketcher/material-commands.mjs';
const args=()=>({featureId:7,revision:'r1',roles:{BODY:{material:{id:'pla',name:'PLA'},appearance:{id:'red',name:'Red',color:'#ff0000'}},LID:{material:{id:'petg',name:'PETG'},appearance:null}}});
function fixture(){
 const handlers=new Map(),abort=new AbortController(),state={session:{},current:true,mutations:0};
 const manager={inspectEnclosureMaterialRoles(){return {revision:'r1',featureIds:[7]}},async assignEnclosureMaterialRoles(id,roles,options){assert.equal(id,7);assert.equal(options.revision,'r1');assert.ok(options.valid());state.mutations++;}};
 const host={signal:abort.signal,session:()=>state.session,commands:{register(def,fn){handlers.set(def.id,fn);return ()=>handlers.delete(def.id);}}};
 return {handlers,abort,state,manager,host,dispose:registerMaterialCommands(host,()=>({manager,valid:()=>state.current}))};
}
test('material discovery and assignment use the shared operation without saving',async()=>{
 const f=fixture();assert.deepEqual(f.handlers.get('inspect-enclosure-materials')({}),{revision:'r1',featureIds:[7]});
 assert.deepEqual(await f.handlers.get('assign-enclosure-materials')(args()),{status:'accepted',saved:false});
 assert.equal(f.state.mutations,1);f.dispose();f.dispose();assert.equal(f.handlers.size,0);
});
test('optional label uses the same detached CAD assignment operation',async()=>{
 const f=fixture(),input=args();input.roles.LABEL={material:{id:'pla',name:'PLA'},appearance:{id:'white',name:'White',color:'#ffffff'}};
 f.manager.assignEnclosureMaterialRoles=async(id,roles)=>{assert.equal(id,7);assert.deepEqual(roles.LABEL,input.roles.LABEL);assert.notEqual(roles.LABEL,input.roles.LABEL);assert.notEqual(roles.LABEL.material,input.roles.LABEL.material);f.state.mutations++;};
 await f.handlers.get('assign-enclosure-materials')(input);assert.equal(f.state.mutations,1);
 let reads=0;Object.defineProperty(input.roles.LABEL,'material',{enumerable:true,get(){reads++;return {id:'x',name:'x'}}});await assert.rejects(f.handlers.get('assign-enclosure-materials')(input));assert.equal(reads,0);f.dispose();
});
test('accessors, symbols and malformed nested fields do not reach CAD',async()=>{
 const f=fixture(),run=f.handlers.get('assign-enclosure-materials');let reads=0;
 const bad=args();Object.defineProperty(bad.roles.BODY.material,'name',{enumerable:true,get(){reads++;return 'PLA';}});
 await assert.rejects(run(bad),/arguments/);assert.equal(reads,0);
 const symbol=args();symbol[Symbol('extra')]=1;await assert.rejects(run(symbol),/arguments/);
 for(const id of [0,-1,NaN,Infinity,1.5,'7'])await assert.rejects(run({...args(),featureId:id}));
 const extra=args();extra.roles.LID.material.extra=true;await assert.rejects(run(extra),/arguments/);
 assert.equal(f.state.mutations,0);f.dispose();
});
test('in-flight operation gets account/window/abort guard and detached input',async()=>{
 for(const invalidate of [f=>f.state.session={},f=>f.state.current=false,f=>f.abort.abort()]){
  const f=fixture();let release,entered;const wait=new Promise(r=>release=r),ready=new Promise(r=>entered=r);
  f.manager.assignEnclosureMaterialRoles=async(id,roles,options)=>{entered();await wait;assert.equal(roles.BODY.material.name,'PLA');if(options.signal.aborted||!options.valid())throw Error('stale');f.state.mutations++;};
  const input=args(),pending=f.handlers.get('assign-enclosure-materials')(input);await ready;input.roles.BODY.material.name='changed';invalidate(f);release();
  await assert.rejects(pending,/stale/);assert.equal(f.state.mutations,0);f.dispose();
 }
});
test('partial command registration cleans up',()=>{
 let count=0,removed=0;
 assert.throws(()=>registerMaterialCommands({commands:{register(){if(++count===2)throw Error('registration');return ()=>removed++;}}},()=>null),/registration/);
 assert.equal(removed,1);
});
