import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseMathDefinitions} from '../../modules/gems/safeExpression.mjs';

test('ordered named formulas evaluate across representative scales',()=>{
 for(const width of [100,120,1,0,-10,1e-6,1e6]){
  const result=parseMathDefinitions(`width = ${width}\nheight = width / 2`);
  assert.deepEqual(result.errors,[]);assert.equal(result.variables.width,width);assert.equal(result.variables.height,width/2);
 }
});
test('forward references evaluate and dependency cycles are reported distinctly',()=>{
 const forward=parseMathDefinitions('height = width / 2\nwidth = 100');assert.deepEqual(forward.errors,[]);assert.equal(forward.variables.height,50);
 const cycle=parseMathDefinitions('a = b + 1\nb = a + 1');assert.ok(cycle.errors.some(error=>/Cyclic parameter dependency/.test(error.message)));
 const missing=parseMathDefinitions('a = missing + 1');assert.match(missing.errors[0].message,/Unknown math variable/);
});
