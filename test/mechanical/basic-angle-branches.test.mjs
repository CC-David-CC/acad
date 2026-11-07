import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ConstraintDefinitions as d} from '../../web/app/sketcher/constr/ANConstraints.ts';
import {Param} from '../../web/app/sketcher/shapes/param.ts';
const seg=angle=>({params:{ang:new Param(angle)}});
test('parallel initialization preserves directed same/opposite orientation around the wrap',()=>{
 for(const [angle,expected] of [[0,0],[Math.PI,180],[2*Math.PI-0.01,0],[0.01,0],[Math.PI+0.01,180],[Math.PI-0.01,180]])
  assert.equal(d.Parallel.constants.angle.initialValue([seg(0),seg(angle)]),expected);
});
test('perpendicular initialization chooses the nearest signed ninety-degree branch',()=>{
 for(const [angle,expected] of [[Math.PI/2,90],[-Math.PI/2,270],[Math.PI/2+0.01,90],[-Math.PI/2-0.01,270]])
  assert.equal(d.Perpendicular.constants.angle.initialValue([seg(0),seg(angle)]),expected);
});
