import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWorkerMount} from '../../modules/engine/mount/worker-controller.mjs';

const options={workerUrl:'/worker.js',jsPath:'/runtime.js',wasmPath:'/runtime.wasm'};
const clean={engine:'occ',representation:'occ-brep-worker-owned',profile:true,mesh:false,centeredCut:true,
  jsSha256:'f74142622c9ced56b8f2e7955301ace5902f811734a71128767fb05de4159972',
  wasmSha256:'c39793b8aff34dc548b57fee1d901219e372702a5005ef92dfdf94994c012897'};
class InertWorker {postMessage() {} terminate() {}}

test('centered-hole discovery is limited to the pinned OCC profile runtime', async () => {
  const original=globalThis.Worker;globalThis.Worker=InertWorker;
  try {
    const mount=createWorkerMount(options,clean);
    assert.equal(mount.descriptor.operations.filter(x=>x.id==='solid.profile.centered-through-hole').length,1);
    mount.close();
    const alias=createWorkerMount(options,{...clean,engine:'custom-occ-alias'});
    assert.equal(alias.descriptor.operations.some(x=>x.id==='solid.profile.centered-through-hole'),true);
    alias.close();
    for (const config of [{...clean,wasmSha256:'0'.repeat(64)}, {...clean,mesh:true}, {...clean,profile:false}, {...clean,representation:'manifold-mesh-worker-owned'}, {...clean,representation:'unknown'}]) {
      assert.throws(()=>createWorkerMount(options,config),{code:'INVALID_MOUNT'});
    }
    for (const config of [{...clean,centeredCut:false},{...clean,centeredCut:false,mesh:true,profile:false}]) {
      const other=createWorkerMount(options,config);
      assert.equal(other.descriptor.operations.some(x=>x.id==='solid.profile.centered-through-hole'),false);
      await assert.rejects(other.centeredThroughHole({}),{code:'UNSUPPORTED_OPERATION'});
      other.close();
    }
  } finally {globalThis.Worker=original}
});
