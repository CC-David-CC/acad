import test from 'node:test';
import assert from 'node:assert/strict';
import {captureWorkerReplyRecord,captureWorkerMetadata} from '../../modules/engine/mount/workerReplyRecord.mjs';

test('reply header copies own data without traversing a transferred payload',()=>{
 const buffer=new ArrayBuffer(128),nested={value:1},source={kind:'result',seq:1,buffer,nested};
 const result=captureWorkerReplyRecord(source);
 assert.equal(Object.getPrototypeOf(result),null);
 assert.equal(result.buffer,buffer);assert.equal(result.nested,nested);
 source.seq=2;assert.equal(result.seq,1);
});
test('reply header rejects accessors without executing them',()=>{
 for(const key of ['ok','revision','kind','seq','evidence','error']){
  let reads=0;const value={};Object.defineProperty(value,key,{enumerable:true,get(){reads++;return 1;}});
  assert.throws(()=>captureWorkerReplyRecord(value));assert.equal(reads,0,key);
 }
});
test('reply header refuses non-records, hidden and symbol fields and field overflow',()=>{
 for(const value of [null,[],1,'reply',new Date(),Object.create({ok:true}),{[Symbol('x')]:1},Object.defineProperty({},'ok',{value:true}),Object.fromEntries(Array.from({length:33},(_,i)=>['x'+i,i]))])assert.throws(()=>captureWorkerReplyRecord(value));
 assert.equal(captureWorkerReplyRecord(Object.assign(Object.create(null),{ok:true})).ok,true);
});
test('native metadata detaches records and accepts acyclic shared values',()=>{
 const pair=[1,2,3],value={bounds:{min:pair,max:pair},valid:{valid:true,method:'native'},quality:null};
 const result=captureWorkerMetadata(value);
 assert.deepEqual(JSON.parse(JSON.stringify(result)),value);
 assert.notEqual(result.bounds.min,pair);assert.notEqual(result.bounds.min,result.bounds.max);
 pair[0]=99;assert.equal(result.bounds.min[0],1);
});
test('native metadata rejects nested accessors without executing them',()=>{
 let reads=0;const value={bounds:{}};Object.defineProperty(value.bounds,'min',{enumerable:true,get(){reads++;return [0,0,0];}});
 assert.throws(()=>captureWorkerMetadata(value));assert.equal(reads,0);
 const a=[1,2,3];Object.defineProperty(a,'1',{enumerable:true,get(){reads++;return 2;}});
 assert.throws(()=>captureWorkerMetadata({bounds:a}));assert.equal(reads,0);
});
test('native metadata rejects sparse, decorated and oversized arrays and cycles',()=>{
 const cyclic={};cyclic.self=cyclic;
 for(const value of [{x:[1,,3]},{x:Object.assign([1],{other:1})},{x:Array(33).fill(0)},cyclic,{x:Infinity},{x:undefined},{x:new Float64Array(3)}])assert.throws(()=>captureWorkerMetadata(value));
});
test('native metadata structural and text budgets are bounded',()=>{
 let deep=1;for(let i=0;i<10;i++)deep={x:deep};assert.throws(()=>captureWorkerMetadata(deep));
 assert.throws(()=>captureWorkerMetadata({x:'a'.repeat(32769)}));
 assert.throws(()=>captureWorkerMetadata(Array.from({length:32},()=>Array(32).fill(0))));
});
test('representative OCC and Manifold scalar evidence fits the metadata contract',()=>{
 for(const v of [{faces:6,triangles:12,bounds:{min:[0,0,0],max:[10,10,5]},signedVolume:500,empty:false,resultKind:'single-solid',solidCount:1,nativeValidity:{method:'occ-inspect-analytic-v1',valid:true},nativeTopology:null,nativeVolume:500,nativeBounds:{min:[0,0,0],max:[10,10,5]},materialRegions:null,voidRegions:null,validLevel0:null,validLevel2:null,manifoldPredicate:null,volumeQuality:'tessellation-signed-integral'},{triangles:12,vertices:8,components:1,volume:500,bounds:{min:[0,0,0],max:[10,10,5]},empty:false,resultKind:'mesh-container',nativeStatus:'NoError',meshComponents:1,nativeValidity:null,solidCount:null,materialRegions:null,voidRegions:null,validLevel0:null,validLevel2:null,manifoldPredicate:null,volumeQuality:'mesh-kernel-volume'}])assert.deepEqual(JSON.parse(JSON.stringify(captureWorkerMetadata(v))),v);
});
