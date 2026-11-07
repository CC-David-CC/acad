import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './fixture.mjs';
test('pending operation refuses the same face after its plane predicate becomes false',async()=>{
 const f=await fixture();try{const gate=f.hold('result'),pending=f.run();await gate.reached;f.face.surface.simpleSurface.isPlane=false;gate.release();await assert.rejects(pending,{name:'AbortError'});assert.equal(f.objects.size,1);}finally{f.close();}
});
test('registered publication refuses the same face after its plane predicate becomes false',async()=>{
 const f=await fixture();try{await f.run();f.face.surface.simpleSurface.isPlane=false;assert.throws(()=>f.owner.requireCurrent(),{name:'AbortError'});}finally{f.close();}
});
