import test from 'node:test';
import assert from 'node:assert/strict';
import {captureSolidEdgeTreatment,solidBodyId} from '../../modules/engine/solid/solidIntent.mjs';
const make=()=>({version:1,unit:'millimeter',engine:'occ',engineRevision:'sha256:'+'a'.repeat(64)+':'+'b'.repeat(64),featureId:4,target:solidBodyId(3),producerFeatureId:3,kind:'fillet',edgeIds:['authored-edge-a','authored-edge-b'],size:3});
test('authored intent detaches edge identities and retains only replay inputs',()=>{
 const input=make(),intent=captureSolidEdgeTreatment(input);input.edgeIds[0]='changed';input.size=9;
 assert.equal(intent.size,3);assert.deepEqual(intent.edgeIds,['authored-edge-a','authored-edge-b']);assert.ok(Object.isFrozen(intent));assert.ok(Object.isFrozen(intent.edgeIds));
 assert.equal(JSON.stringify(intent).includes('handle'),false);assert.equal(JSON.stringify(intent).includes('nativeIndex'),false);
});
test('wrong producer, duplicate/unknown fields, units, kind and size reject',()=>{
 for(const change of [r=>r.target=solidBodyId(99),r=>r.featureId=3,r=>r.engine='manifold',r=>r.unit='inch',r=>r.kind='smooth',r=>r.size=0,r=>r.size=Infinity,r=>r.edgeIds=['a','a'],r=>r.edgeIds=[],r=>r.edgeIds=Array.from({length:17},(_,i)=>String(i)),r=>r.handle={id:'not-authored'},r=>r.nativeIndex=1]){const r=make();change(r);assert.throws(()=>captureSolidEdgeTreatment(r),{code:'INVALID_REQUEST'});}
});
test('sparse, accessor and symbol data cannot become saved edge selections',()=>{
 let calls=0;const r=make();Object.defineProperty(r.edgeIds,'0',{enumerable:true,get(){calls++;return 'a';}});assert.throws(()=>captureSolidEdgeTreatment(r),{code:'INVALID_REQUEST'});assert.equal(calls,0);
 const sparse=make();delete sparse.edgeIds[0];assert.throws(()=>captureSolidEdgeTreatment(sparse),{code:'INVALID_REQUEST'});
 const extra=make();extra.edgeIds[Symbol('x')]='a';assert.throws(()=>captureSolidEdgeTreatment(extra),{code:'INVALID_REQUEST'});
 const header=make();Object.defineProperty(header,'size',{enumerable:true,get(){calls++;return 3;}});assert.throws(()=>captureSolidEdgeTreatment(header),{code:'INVALID_REQUEST'});assert.equal(calls,0);
});
