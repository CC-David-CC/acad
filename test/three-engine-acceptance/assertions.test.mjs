// These test the test oracle, not a kernel, Worker, CAD history or persistence.
import test from 'node:test';
import assert from 'node:assert/strict';
import {numericCases,boxRequest} from './cases.mjs';
import {checkDescriptor,checkShape,measureMesh} from './matrix.mjs';
const descriptor={contractVersion:1,unit:'millimeter',engine:'test-oracle-only',representation:'test-only',mountId:'m',generation:1,
 runtimeAssets:{verification:'worker-sha256',jsSha256:'a'.repeat(64),wasmSha256:'b'.repeat(64)}};
const expected={engine:descriptor.engine,representation:descriptor.representation,...descriptor.runtimeAssets};
const result={handle:{representation:descriptor.representation,mountId:'m',generation:1},evidence:{volume:6000,bounds:{min:[0,0,0],max:[10,20,30]}}};
test('box oracle and copied authored requests',()=>{
 for(const c of numericCases.filter(c=>!c.op))assert.equal(c.volume,c.a.dimensions.reduce((a,b)=>a*b,1));
 const request=boxRequest(numericCases[0].a);request.dimensions[0]=1;
 assert.equal(numericCases[0].a.dimensions[0],10);
});
test('descriptor refuses wrong engine, unit and runtime pin',()=>{
 checkDescriptor(descriptor,expected);
 for(const patch of [{engine:'fallback'},{unit:'inch'},{runtimeAssets:{...descriptor.runtimeAssets,wasmSha256:'c'.repeat(64)}}])assert.throws(()=>checkDescriptor({...descriptor,...patch},expected));
});
test('oracle refuses signed-volume inversion, shifted geometry and foreign owner',()=>{
 checkShape(result,numericCases[0],descriptor);
 assert.throws(()=>checkShape({...result,evidence:{bounds:result.evidence.bounds,signedVolume:-6000}},numericCases[0],descriptor));
 assert.throws(()=>checkShape({...result,evidence:{...result.evidence,signedVolume:6000}},numericCases[0],descriptor));
 assert.throws(()=>checkShape({...result,evidence:{...result.evidence,volume:6000.01}},numericCases[0],descriptor));
 assert.throws(()=>checkShape({...result,evidence:{...result.evidence,bounds:{min:[1,0,0],max:[11,20,30]}}},numericCases[0],descriptor));
 assert.throws(()=>checkShape({...result,handle:{...result.handle,mountId:'foreign'}},numericCases[0],descriptor));
});
test('empty must be explicit and cannot hide a finite solid',()=>{
 const empty=numericCases.find(c=>c.id==='disjoint-common');
 checkShape({...result,evidence:{empty:true,volume:0,bounds:null}},empty,descriptor);
 assert.throws(()=>checkShape({...result,evidence:{volume:0,bounds:null}},empty,descriptor));
 assert.throws(()=>checkShape({...result,evidence:{empty:true,volume:1,bounds:null}},empty,descriptor));
});
test('triangle measurement rejects bad buffers and preserves orientation',()=>{
 const triangle=new Float64Array([1,0,0,0,1,0,0,0,1]);
 assert.equal(measureMesh(triangle.buffer).volume,1/6);
 assert.equal(measureMesh(new Float64Array([1,0,0,0,0,1,0,1,0]).buffer).volume,-1/6);
 assert.throws(()=>measureMesh(new ArrayBuffer(8)));
 triangle[0]=NaN;assert.throws(()=>measureMesh(triangle.buffer));
});
