import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {inspectStageGenerators} from '../../web/app/sketcher/headless/stageGeneratorPolicy.mjs';
const fixture=JSON.parse(fs.readFileSync(new URL('../review-circle-mirror/actual-circle-mirror.json',import.meta.url)));
function example(major=false){
 const s=structuredClone(fixture),g=s.stages[0].generators[0];
 const axis=s.objects.find(o=>o.id===g.params.reflectionLine[0]);axis.data={a:{x:0,y:0},b:{x:10,y:10}};
 const src=s.objects.find(o=>o.id===g.params.objects[0]),out=s.objects.find(o=>o.id===g.generatedObjects[0]);
 const a={x:5,y:2}, b=major?{x:2,y:-1}:{x:2,y:5}, c={x:2,y:2};
 src.type=out.type='Arc';src.data={a,b,c};const reflect=p=>({x:p.y,y:p.x});out.data={a:reflect(b),b:reflect(a),c:reflect(c)};
 return {s,src,out};
}
test('oblique reflection preserves minor and major arcs with swapped endpoints',()=>{for(const major of [false,true])assert.equal(inspectStageGenerators(example(major).s).generatorCount,1)});
test('stale endpoints, center, unequal radius and ambiguous full turn refuse',()=>{
 for(const change of [({out})=>out.data.a.x++,({out})=>out.data.c.y++,({src})=>src.data.b.x++,({src})=>src.data.b={...src.data.a},({out})=>out.data.a.x=Infinity]){
  const f=example();change(f);assert.throws(()=>inspectStageGenerators(f.s));
 }
});
