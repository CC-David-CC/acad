// Protocol admission controls only. No native engine behavior is inferred from
// this Worker stub; actual OCC math is separately exercised in browser.cjs.
import test from 'node:test';import assert from 'node:assert/strict';
import {createVerifiedOciMount} from '../../modules/engine/mount/oci-verified-mount.mjs';
import {createVerifiedManifoldMount} from '../../modules/engine/mount/manifold-verified-mount.mjs';
import {createRawSmlibMount} from '../../modules/engine/raw-smlib/rawMount.mjs';
import {createSelectedProfileOccMount} from '../../modules/engine/mount/occ-selected-profile-mount.mjs';
const request={op:'solid.profile.extrude',version:2,unit:'millimeter',frame:{origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]},depth:5,region:{id:'region',outer:[{kind:'circle',id:'circle',center:[0,0],radius:10}],holes:[]}};
test('unqualified legacy OCC, Manifold and SMLib neither advertise nor dispatch generic profiles',async()=>{
 const old=globalThis.Worker,workers=[];globalThis.Worker=class{constructor(){workers.push(this);this.messages=[];}postMessage(msg){this.messages.push(msg);queueMicrotask(()=>this.onmessage?.({data:{kind:'ready'}}));}terminate(){this.closed=true;}};
 try{for(const factory of[createVerifiedOciMount,createVerifiedManifoldMount,createRawSmlibMount]){
  const mount=factory({workerUrl:'/worker.js',jsPath:'/runtime.js',wasmPath:'/runtime.wasm'});try{await mount.ready;assert.equal(mount.descriptor.operations.some(op=>op.id==='solid.profile.extrude'&&op.version===2),false);await assert.rejects(mount.execute(request),{code:'UNSUPPORTED_OPERATION'});assert.deepEqual(workers.at(-1).messages.map(x=>x.kind),['init']);}finally{mount.close();assert.equal(workers.at(-1).closed,true);}
 }}finally{if(old===undefined)delete globalThis.Worker;else globalThis.Worker=old;}
});

test('public dispatch rejects discriminator accessors without evaluating them or sending a native job',async()=>{
 const old=globalThis.Worker,workers=[];globalThis.Worker=class{constructor(){workers.push(this);this.messages=[];}postMessage(message){this.messages.push(message);queueMicrotask(()=>this.onmessage?.({data:{kind:'ready'}}));}terminate(){this.closed=true;}};
 const observations=[];
 try{
  const mount=createSelectedProfileOccMount({workerUrl:'/worker.js',jsPath:'/runtime.js',wasmPath:'/runtime.wasm'});
  try{
   await mount.ready;
   for(const field of ['op','version']){
    let reads=0;const data={...request};Object.defineProperty(data,field,{enumerable:true,get(){reads++;return request[field];}});
    await assert.rejects(mount.execute(data),{code:'INVALID_REQUEST'});
    observations.push({field,reads});
   }
   const inherited=Object.assign(Object.create({op:request.op}),request);delete inherited.op;
   await assert.rejects(mount.execute(inherited),{code:'INVALID_REQUEST'});
   assert.deepEqual(workers[0].messages.map(message=>message.kind),['init']);
   assert.deepEqual(observations,[{field:'op',reads:0},{field:'version',reads:0}]);
  }finally{mount.close();assert.equal(workers[0].closed,true);}
 }finally{if(old===undefined)delete globalThis.Worker;else globalThis.Worker=old;}
});
