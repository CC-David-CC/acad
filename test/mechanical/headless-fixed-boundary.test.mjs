import {test} from 'node:test';import assert from 'node:assert/strict';
import {assertFixedBoundary} from '../../web/app/sketcher/headless/solve.ts';
test('fixed boundary endpoints, direction and length must remain unchanged',()=>{
 const boundary={lines:[{id:'edge',a:{x:0,y:0},b:{x:100,y:0}}],arcs:[],circles:[],nurbses:[]};
 const line={TYPE:'Segment',a:{x:0,y:0},b:{x:100,y:0},ang:0,t:100},index={'boundary/edge':line};
 assert.doesNotThrow(()=>assertFixedBoundary(index,boundary));
 line.a.x=1;assert.throws(()=>assertFixedBoundary(index,boundary),/boundary changed/i);line.a.x=0;
 line.ang=Math.PI;assert.throws(()=>assertFixedBoundary(index,boundary),/direction or length/i);line.ang=0;
 line.t=99;assert.throws(()=>assertFixedBoundary(index,boundary),/direction or length/i);
});
