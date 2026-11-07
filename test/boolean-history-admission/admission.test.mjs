// Admission only: this inert Worker never returns or evaluates geometry.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createBooleanHistoryOccMount} from '../../modules/engine/mount/occ-boolean-history-mount.mjs';
import {createMechanicalProfileOccMount} from '../../modules/engine/mount/occ-mechanical-profile-mount.mjs';
import {createWorkerMount} from '../../modules/engine/mount/worker-controller.mjs';
const options={workerUrl:'/worker.js',jsPath:'/runtime.js',wasmPath:'/runtime.wasm'};
let workers=[];
class InertWorker{constructor(){this.posts=[];workers.push(this);}postMessage(msg){this.posts.push(msg);}terminate(){this.terminated=true;}}
async function fixture(fn){const before=globalThis.Worker;globalThis.Worker=InertWorker;workers=[];try{await fn();}finally{for(const w of workers)assert(w.terminated);globalThis.Worker=before;}}
test('new runtime advertises selection v2; previous runtime stays scoped',()=>fixture(async()=>{
 for(const [make,modern]of [[createBooleanHistoryOccMount,true],[createMechanicalProfileOccMount,false]]){
  const mount=make(options);try{
   assert.equal(workers.at(-1).posts[0].booleanHistory,modern?1:undefined);
   const ops=mount.descriptor.operations,ids=ops.map(o=>o.id);
   assert.equal(ids.includes('solid.selections.read'),modern);assert.equal(ids.includes('solid.prism.selections.read'),!modern);
   assert.equal(ops.find(o=>o.id==='solid.boolean.subtract').input,modern?'oci-boolean-history-mm-v1':'oci-boolean-mm-v1');
   if(modern)assert.equal(ops.find(o=>o.id==='solid.selections.read').selectionPlanVersion,2);
  }finally{mount.close();}
 }
}));
test('history mode refuses unpinned or incompatible runtime before Worker creation',()=>fixture(async()=>{
 for(const c of [{edgeTreatments:false},{edgeTreatments:true,selectedProfile:false},{edgeTreatments:true,selectedProfile:true,selectedProfileVersion:3,captureSelectedProfile:()=>{},representation:'occ-brep-worker-owned'}])assert.throws(()=>createWorkerMount(options,{engine:'bad',mesh:false,profile:false,booleanHistory:true,jsSha256:'0'.repeat(64),wasmSha256:'0'.repeat(64),...c}),{code:'INVALID_MOUNT'});
 assert.equal(workers.length,0);
}));
test('exact own-data requests and current feature identities precede any Worker job',()=>fixture(async()=>{
 const mount=createBooleanHistoryOccMount(options),worker=workers.at(-1);worker.onmessage({data:{kind:'ready'}});await mount.ready;
 try{
  const request={op:'solid.boolean.subtract',version:1,unit:'millimeter',a:{},b:{},featureId:3,producerAFeatureId:1,producerBFeatureId:2};
  let reads=0;const accessor={...request};Object.defineProperty(accessor,'featureId',{enumerable:true,get(){reads++;return 3;}});
  for(const input of [accessor,{...request,extra:1},{...request,featureId:1},{...request,producerBFeatureId:0},{...request,featureId:NaN},{...request,version:2}])await assert.rejects(mount.execute(input),{code:'INVALID_REQUEST'});
  assert.equal(reads,0);assert.equal(worker.posts.length,1);
  await assert.rejects(mount.execute(request),{code:'INVALID_HANDLE'});assert.equal(worker.posts.length,1);
  await assert.rejects(mount.execute({op:'solid.prism.selections.read'}),{code:'UNSUPPORTED_OPERATION'});
 }finally{mount.close();}
}));
