// Explicit Worker protocol doubles, no native or geometry success claim.
import test from 'node:test';import assert from 'node:assert/strict';
import {createVerifiedOciMount} from '../../modules/engine/mount/oci-verified-mount.mjs';
test('only known numeric-range diagnostic propagates and closes candidate; other errors retain ENGINE_FAILURE',async()=>{
 const original=globalThis.Worker;
 try{for(const code of ['MESH_VOLUME_NUMERIC_RANGE','OTHER',undefined]){
  let terminated=0;
  globalThis.Worker=class{postMessage(m){queueMicrotask(()=>this.onmessage({data:m.kind==='init'?{kind:'ready'}:{kind:'error',seq:m.seq,...(code?{code}:{}),error:'measurement diagnostic'}}));}terminate(){terminated++;}};
  const mount=createVerifiedOciMount({workerUrl:'/worker.js',jsPath:'/glue.js',wasmPath:'/native.wasm'});await mount.ready;
  await assert.rejects(mount.execute({op:'solid.box.create',version:1,unit:'millimeter',origin:[0,0,0],dimensions:[1,1,1]}),{code:code==='MESH_VOLUME_NUMERIC_RANGE'?code:'ENGINE_FAILURE'});
  assert.equal(terminated,1);await assert.rejects(mount.execute({op:'solid.box.create',version:1,unit:'millimeter',origin:[0,0,0],dimensions:[1,1,1]}),{code:'MOUNT_CLOSED'});mount.close();assert.equal(terminated,1);
 }}finally{globalThis.Worker=original;}
});
