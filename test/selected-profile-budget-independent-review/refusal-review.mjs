// Exact production controller, transport double only. No native/geometry proof.
import assert from 'node:assert/strict';import fs from 'node:fs';
import {source,pins,load} from './source.mjs';
const {createSelectedProfileOccMount}=await load('modules/engine/mount/occ-selected-profile-mount.mjs');
const {createVerifiedOciMount}=await load('modules/engine/mount/oci-verified-mount.mjs');
const previous=globalThis.Worker,rows=[];
try{
 for(const mode of ['string','long-string','nested-coercion-getter','header-error-getter','legacy-refusal']){
  let reads=0,last;
  const detail=mode==='long-string'?'x'.repeat(2000):mode==='nested-coercion-getter'?Object.defineProperty({},'toString',{get(){reads++;return()=> 'must not execute';}}):'Selected candidate cumulative result triangle budget exhausted';
  globalThis.Worker=class{constructor(){last=this;this.terminated=false;}postMessage(data){queueMicrotask(()=>{let reply=data.kind==='init'?{kind:'ready'}:{kind:'refused',seq:data.seq,code:'RESOURCE_LIMIT',error:detail};if(mode==='header-error-getter'&&data.kind!=='init')Object.defineProperty(reply,'error',{enumerable:true,get(){reads++;return 'must not execute';}});this.onmessage?.({data:reply});});}terminate(){this.terminated=true;}};
  const factory=mode==='legacy-refusal'?createVerifiedOciMount:createSelectedProfileOccMount,mount=factory({workerUrl:'/native-worker.js',jsPath:'/native.js',wasmPath:'/native.wasm'});
  try{await mount.ready;const result=await mount.execute({op:'solid.box.create',version:1,unit:'millimeter',origin:[0,0,0],dimensions:[1,1,1]}).then(value=>({ok:true,value}),e=>({ok:false,code:e.code,message:e.message}));
   const normal=['string','long-string'].includes(mode);assert.equal(result.code,normal?'RESOURCE_LIMIT':'ENGINE_FAILURE');assert.equal(reads,0);assert.equal(last.terminated,!normal);if(mode==='long-string')assert.equal(result.message.length,512);if(mode==='legacy-refusal')assert.equal(mount.descriptor.maxLifetimeNames,8);else assert.equal(mount.descriptor.maxLifetimeNames,32);rows.push({mode,reads,result,terminatedBeforeClose:last.terminated});
  }finally{mount.close();assert.equal(last.terminated,true);}
 }
}finally{globalThis.Worker=previous;}
const receipt={source,pins,scope:'Transport-only reply guards and32/8 descriptor policy; actual production controller, synthetic Worker envelopes. No native math/public browser claim.',rows,status:'PASS five independent refusal/legacy controls'};
if(process.env.CODI_RECEIPT)fs.writeFileSync(process.env.CODI_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({status:receipt.status,source,rows:rows.length}));
