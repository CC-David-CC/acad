import {test} from 'node:test';import assert from 'node:assert/strict';
import {boundaryChangeForSketch,boundaryGeometryClose,selectReferencedBoundaries} from '../../web/app/cad/sketch/boundaryValidity.js';
const boundary=(x=10)=>({lines:[{id:'edge',a:{x:0,y:0},b:{x,y:0}}],arcs:[],circles:[],nurbses:[]});
const sketch={boundary:boundary(),stages:[{constraints:[{objects:['point','boundary/edge'] }]}]};
test('stable referenced boundary and small projection noise do not trigger change',()=>{assert.deepEqual(boundaryChangeForSketch(sketch,boundary()),{referenced:true,changed:false,referencedIds:['edge']});assert.equal(boundaryChangeForSketch(sketch,boundary(10+1e-10)).changed,false);assert.ok(boundaryGeometryClose([1,2],[1+1e-10,2]));});
test('changed geometry requests a solve and unresolved identities refuse',()=>{assert.equal(boundaryChangeForSketch(sketch,boundary(20)).changed,true);assert.throws(()=>boundaryChangeForSketch({...sketch,boundary:undefined},boundary()),/missing/);assert.throws(()=>boundaryChangeForSketch(sketch,{...boundary(),lines:[]}),/identity/);assert.throws(()=>boundaryChangeForSketch(sketch,{...boundary(),lines:[...boundary().lines,...boundary().lines]}),/ambiguous/);});
test('unrelated sketches do not require a boundary snapshot',()=>assert.deepEqual(boundaryChangeForSketch({stages:[]},{}),{referenced:false,changed:false}));

test('worker boundary payload contains every referenced edge and omits unrelated geometry',()=>{const b={...boundary(),circles:[{id:'unrelated',c:{x:3,y:3},r:1}]};const c=boundaryChangeForSketch(sketch,b);assert.deepEqual(selectReferencedBoundaries(b,c.referencedIds),boundary());});
