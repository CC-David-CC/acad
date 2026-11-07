// Refusal/lifetime transport double only. No invented native success result.
import test from 'node:test';import assert from 'node:assert/strict';
import {createSweepProfileOccMount} from '../../modules/engine/mount/occ-sweep-profile-mount.mjs';
import {prepareSolvedSweep} from '../../modules/engine/extrusion/selectedSketchSweep.mjs';
import {sweepSourceFixture} from './source-fixture.mjs';
const request=(await prepareSolvedSweep(await sweepSourceFixture())).request;
async function run(code,action){const original=globalThis.Worker,posts=[];let closed=false;
 globalThis.Worker=class{postMessage(m){posts.push(m);queueMicrotask(()=>this.onmessage({data:m.kind==='init'?{kind:'ready'}:{kind:'refused',seq:m.seq,code,error:code}}));}terminate(){closed=true;}};
 try{const mount=createSweepProfileOccMount({workerUrl:'/worker.js',jsPath:'/runtime.js',wasmPath:'/runtime.wasm'});await mount.ready;try{await action(mount,posts,()=>closed);}finally{mount.close();}}finally{globalThis.Worker=original;}
}
for(const code of ['SWEEP_ZERO_PATH','SWEEP_PROFILE_NOT_ATTACHED','SWEEP_UNSUPPORTED_PATH'])test('explicit native refusal '+code+' does not publish or kill healthy mount',()=>run(code,async(mount,posts,closed)=>{
 assert.equal(posts[0].sweep,1);assert.equal(posts[0].revolve,1);assert(mount.descriptor.operations.some(op=>op.id==='solid.profile.sweep'&&op.version===1));
 await assert.rejects(mount.execute(request),{code});assert.equal(closed(),false);assert.equal(posts[1].kind,'selected-profile-sweep');
}));
test('native integrity failure cannot masquerade as a recoverable input refusal',()=>run('SWEEP_INPUT_CHANGED',async(mount,_posts,closed)=>{await assert.rejects(mount.execute(request),{code:'ENGINE_FAILURE'});assert.equal(closed(),true);}));
test('already aborted sweep never posts native work',()=>run('SWEEP_ZERO_PATH',async(mount,posts)=>{const controller=new AbortController();controller.abort();await assert.rejects(mount.execute(request,{signal:controller.signal}),{code:'CANCELLED'});assert.equal(posts.length,1);}));
