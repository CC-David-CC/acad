import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sameRestoredSketch as same} from '../../web/app/sketcher/historyEquivalence.mjs';
test('key order is irrelevant but arrays and typed values stay strict',()=>{
 assert.equal(same('{"a":1,"b":[{"x":2,"y":3}]}','{"b":[{"y":3,"x":2}],"a":1}'),true);
 for(const b of ['{"a":"1","b":[{"x":2,"y":3}]}','{"a":1,"b":[{"x":3,"y":2}]}','{"a":1,"b":null}'])assert.equal(same('{"a":1,"b":[{"x":2,"y":3}]}',b),false);
 assert.equal(same('[1,2]','[2,1]'),false);assert.equal(same('null','{}'),false);
});
test('only previously absent admission hints may be added',()=>{
 const original={objects:[{id:'line'}],stages:[{constraints:[{typeId:'Horizontal',objects:['line']}]}]},actual=structuredClone(original);
 actual.stages[0].constraints[0].admission={version:1,state:'accepted'};
 assert.equal(same(JSON.stringify(original),JSON.stringify(actual)),true);
 const hinted=JSON.stringify(actual);actual.stages[0].constraints[0].admission.state='redundant';assert.equal(same(hinted,JSON.stringify(actual)),false);
 actual.stages[0].constraints[0].objects=['other'];assert.equal(same(JSON.stringify(original),JSON.stringify(actual)),false);
});
test('full large text and prototype-named data compare without truncation',()=>{
 const text='x'.repeat(1040000)+'ending',a=JSON.stringify({labels:[{text}]}),b=JSON.stringify({labels:[{text:text.slice(0,-1)+'X'}]});
 assert.equal(same(a,a),true);assert.equal(same(a,b),false);
 assert.equal(same('{"__proto__":{"x":1},"a":2}','{"a":2,"__proto__":{"x":1}}'),true);
 assert.throws(()=>same('{bad','{}'));
});
