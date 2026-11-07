import assert from 'node:assert/strict';
import test from 'node:test';
import {createDisplayProjection} from './displayProjection.mjs';
test('projection keeps triangles, empty results and source bytes',()=>{
 const values=new Float64Array([0,0,0,1,0,0,0,1,0]),before=values.slice(),result=createDisplayProjection(values.buffer,1);
 assert.equal(result.status,'available');assert.deepEqual([...new Float32Array(result.buffer)],[...before]);assert.deepEqual(values,before);
 assert.equal(createDisplayProjection(new ArrayBuffer(0),0).buffer.byteLength,0);
});
test('preview loss does not change native coordinates',()=>{
 const values=new Float64Array([1e8,0,0,1e8+1,0,0,1e8,1,0]),result=createDisplayProjection(values.buffer,1);
 assert.equal(result.status,'unavailable');assert.equal(result.reason,'float32-collapsed-triangle');assert.equal(result.buffer.byteLength,0);assert.equal(values[3],1e8+1);
});
test('invalid and nonfinite native transports reject',()=>{
 assert.throws(()=>createDisplayProjection(new ArrayBuffer(8),1));
 assert.throws(()=>createDisplayProjection(new Float64Array([NaN,0,0,1,0,0,0,1,0]).buffer,1));
});
