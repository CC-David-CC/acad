import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Generator,numericSketchIdHighWater} from '../../web/app/sketcher/id-generator.js';
test('restored sparse spline point IDs reserve new allocation past every saved ID',()=>{
 const sketch={objects:[{id:'21',data:{cPoints:[{id:'71'},{id:'86'},{id:'89'}],fPoints:[{id:'3'},{id:'55'}]}},{id:'85',data:{cPoints:[{id:'58'},{id:'70'},{id:'98'},{id:'110'}]}}]};
 Generator.resetIDGenerator();Generator.reserveThrough(numericSketchIdHighWater(sketch));
 const ids=Array.from({length:20},()=>String(Generator.genID()));
 assert.equal(ids[0],'111');assert.equal(new Set(ids).size,20);assert.ok(!ids.includes('86'));
});
test('preflight temporary allocation restores live generator on success and rejection',()=>{
 Generator.resetIDGenerator(12);
 assert.equal(Generator.withReservedIds(110,()=>Generator.genID()),111);
 assert.equal(Generator.genID(),12);
 assert.throws(()=>Generator.withReservedIds(500,()=>{assert.equal(Generator.genID(),501);throw Error('invalid sketch')}),/invalid sketch/);
 assert.equal(Generator.genID(),13);
});
test('nonnumeric authored IDs remain valid and unsafe allocation refuses',()=>{
 assert.equal(numericSketchIdHighWater({objects:[{id:'ground/ORIGIN'},{id:'curve/A'}]}),-1);
 assert.throws(()=>numericSketchIdHighWater({id:String(Number.MAX_SAFE_INTEGER)}),/exhausted/);
 Generator.resetIDGenerator(Number.MAX_SAFE_INTEGER);assert.equal(Generator.genID(),Number.MAX_SAFE_INTEGER);assert.throws(()=>Generator.genID(),/exhausted/);Generator.resetIDGenerator();assert.equal(Generator.genID(),0);
});
