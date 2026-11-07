import test from 'node:test';import assert from 'node:assert/strict';import {captureSolidMetrics as capture} from '../../modules/engine/solid/solidMetrics.mjs';
const runtime=Object.freeze({jsSha256:'a'.repeat(64),wasmSha256:'b'.repeat(64)}),bounds=()=>({min:[0,0,0],max:[1,1,1]});
const raw=(extra={})=>({resultKind:'single-material',materialRegions:1,voidRegions:0,validLevel0:true,validLevel2:true,manifoldPredicate:true,volume:1,volumeQuality:'native-relative-0.001',bounds:bounds(),...extra});
test('complete material containers preserve counts without invented body IDs',()=>{
 const m=capture('smlib',raw({resultKind:'multi-material',materialRegions:2,voidRegions:1,volume:3}),1024,runtime);
 assert.equal(m.materialRegions,2);assert.equal(m.voidRegions,1);assert.equal(m.solidCount,null);assert.equal(m.triangleCount,1024);assert.equal(m.precision.value,.001);assert.ok(Object.isFrozen(m.bounds.min));
});
test('undefined nonmanifold volume is explicitly unavailable, never numeric',()=>{
 for(const volume of [null,0,42]){const m=capture('smlib',raw({manifoldPredicate:false,volumeQuality:'native-undefined-nonmanifold',volume}),1,runtime);assert.equal(m.reportedVolume,null);assert.equal(m.volumeMagnitude,null);assert.equal(m.volumeAvailable,false);assert.equal(m.volumeKind,'unavailable');}
});
test('OCC solids and Manifold mesh components are not material regions',()=>{
 const o=capture('occ',{resultKind:'multi-solid',solidCount:2,materialRegions:null,voidRegions:null,validLevel0:null,validLevel2:null,manifoldPredicate:null,nativeValidity:{method:'occ-inspect-analytic-v1',valid:true},volumeQuality:'tessellation-signed-integral',signedVolume:-2,triangles:24,bounds:bounds()},24,runtime);
 assert.equal(o.solidCount,2);assert.equal(o.materialRegions,null);assert.equal(o.reportedVolume,-2);assert.equal(o.volumeMagnitude,2);assert.ok(Object.isFrozen(o.nativeValidity));
 const m=capture('manifold',{resultKind:'mesh-container',meshComponents:3,materialRegions:null,voidRegions:null,solidCount:null,nativeStatus:'NoError',volumeQuality:'mesh-kernel-volume',volume:3,triangles:36,bounds:bounds()},36,runtime);
 assert.equal(m.meshComponents,3);assert.equal(m.materialRegions,null);assert.equal(m.solidCount,null);
 const old=capture('manifold',{empty:false,components:3,triangles:36,volume:3,bounds:bounds()},36,runtime);assert.equal(old.resultKind,'unclassified-nonempty');assert.equal(old.materialRegions,null);
});
test('empty results preserve each provider measurement/validity vocabulary',()=>{
 const cases=[['smlib',raw({resultKind:'empty',materialRegions:0,voidRegions:0,validLevel2:null,manifoldPredicate:null,volume:0,volumeQuality:'empty',bounds:null})],['occ',{resultKind:'empty',solidCount:0,nativeValidity:{method:'occ-inspect-analytic-v1',valid:true},signedVolume:0,triangles:0,volumeQuality:'tessellation-signed-integral',bounds:null}],['manifold',{resultKind:'empty',meshComponents:0,nativeStatus:'NoError',empty:true,volume:0,triangles:0,volumeQuality:'mesh-kernel-volume',bounds:null}]];
 for(const [engine,evidence]of cases){const m=capture(engine,evidence,0,runtime);assert.equal(m.resultKind,'empty');assert.equal(m.reportedVolume,0);assert.equal(m.bounds,null);}
});
test('measurement alone never reclassifies native geometry and false counts refuse',()=>{
 const zero=capture('smlib',raw({volume:0}),1,runtime);assert.equal(zero.resultKind,'single-material');assert.equal(zero.reportedVolume,0);
 assert.throws(()=>capture('smlib',raw({resultKind:'multi-material',materialRegions:1}),1,runtime));
 assert.throws(()=>capture('occ',{resultKind:'single-solid',solidCount:1,nativeValidity:{method:'occ-inspect-analytic-v1',valid:false},signedVolume:1,triangles:1,bounds:bounds()},1,runtime));
 assert.throws(()=>capture('smlib',raw({resultKind:'empty',bounds:null,volume:0}),0,runtime));
});
