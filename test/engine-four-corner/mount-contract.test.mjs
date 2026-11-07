import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {captureFourCornerRequest,copyFourCornerTopology} from '../../modules/engine/mount/fourCornerMountContract.mjs';
const request={version:1,unit:'millimeter',featureId:'4',parentFeatureId:'2',centerFeatureId:'3',revision:'r',sketchDigest:'a'.repeat(64),faceId:'face',regionId:'region',sideIds:{minX:'a',maxX:'b',minY:'c',maxY:'d'},offsetX:10,offsetY:10,diameter:4};
const fixture=JSON.parse(readFileSync(new URL('../../research/four-corner-topology/fixtures/normal-lines.json',import.meta.url))).result;
test('request and native topology are detached bounded data',()=>{const r=captureFourCornerRequest(request),t=copyFourCornerTopology(fixture);assert.notEqual(r.sideIds,request.sideIds);assert.notEqual(t.faces,fixture.faces);assert.deepEqual(t,fixture);});
test('malformed request, accessors, pointers and partial result fail closed',()=>{for(const change of [x=>x.featureId='03',x=>x.sideIds.maxX=x.sideIds.minX,x=>x.offsetX=Infinity,x=>x.extra=1]){const x=structuredClone(request);change(x);assert.throws(()=>captureFourCornerRequest(x));}let calls=0,x=structuredClone(request);Object.defineProperty(x.sideIds,'minX',{enumerable:true,get(){calls++;return 'a'}});assert.throws(()=>captureFourCornerRequest(x));assert.equal(calls,0);for(const change of [x=>x.ptr=9,x=>x.faces.pop(),x=>x.fourCornerTools.pop(),x=>{delete x.vertices[0]}]){const x=structuredClone(fixture);change(x);assert.throws(()=>copyFourCornerTopology(x));}});
test('binding copy rejects caller accessors and preserves canonical fields',async()=>{const {captureFourCornerBinding}=await import('../../modules/engine/mount/fourCornerMountContract.mjs');const {version,...body}=request;const binding={...body,centerDiameter:10};assert.deepEqual(captureFourCornerBinding(binding),binding);let calls=0;Object.defineProperty(binding,'centerDiameter',{enumerable:true,get(){calls++;return 10}});assert.throws(()=>captureFourCornerBinding(binding));assert.equal(calls,0)});
test('capability is advertised only for the explicit four-hole runtime pair',async()=>{
 const {createWorkerMount}=await import('../../modules/engine/mount/worker-controller.mjs');
 const old=globalThis.Worker;globalThis.Worker=class{postMessage(){} terminate(){}};
 const opts={workerUrl:'/worker',jsPath:'/engine',wasmPath:'/wasm'};
 const base={engine:'occ-spi-v1',representation:'occ-brep-worker-owned',profile:true,mesh:false,centeredCut:true,jsSha256:'f74142622c9ced56b8f2e7955301ace5902f811734a71128767fb05de4159972',wasmSha256:'c39793b8aff34dc548b57fee1d901219e372702a5005ef92dfdf94994c012897'};
 try {
  const legacy=createWorkerMount(opts,base);assert.equal(legacy.descriptor.operations.some(x=>x.id==='solid.profile.four-corner-through-holes'),false);await assert.rejects(legacy.fourCornerThroughHoles({}),{code:'UNSUPPORTED_OPERATION'});legacy.close();
  assert.throws(()=>createWorkerMount(opts,{...base,fourCornerCut:true}),{code:'INVALID_MOUNT'});
  const current={...base,jsSha256:'a8774acbbe3a90d7c82fe294c769096179eae351e5a8c854d4d0a31737a706ee',wasmSha256:'13617eda9a2118edfd1244b5d46523e7d9628a87ec995a0237b2b5cc58d532f2',fourCornerCut:true};
  const mount=createWorkerMount(opts,current);assert.equal(mount.descriptor.operations.some(x=>x.id==='solid.profile.four-corner-through-holes'),true);mount.close();
  for(const change of [{centeredCut:false},{mesh:true},{profile:false},{jsSha256:'0'.repeat(64)},{wasmSha256:'0'.repeat(64)}]) assert.throws(()=>createWorkerMount(opts,{...current,...change}),{code:'INVALID_MOUNT'});
 } finally {globalThis.Worker=old}
});
