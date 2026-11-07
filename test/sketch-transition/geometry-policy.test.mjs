import test from 'node:test';
import assert from 'node:assert/strict';
import {assertAllowedSolverGeometry as check} from '../../web/app/sketcher/headless/transitionGeometryPolicy.mjs';
const rejects=(type,a,b)=>assert.throws(()=>check(type,a,b),e=>e.code==='UNSUPPORTED_SOLVER_DATA_CHANGE');
test('only known solver coordinates and radii are movable',()=>{
 const values=[['Point',{x:1,y:2},a=>{a.x=3}],['Segment',{a:{x:1,y:2},b:{x:3,y:4}},a=>{a.b.x=5}],['Circle',{c:{x:1,y:2},r:3},a=>{a.r=4}],['Arc',{a:{x:1,y:2},b:{x:3,y:4},c:{x:0,y:0}},a=>{a.a.y=5}],['Ellipse',{c:{x:0,y:0},rx:2,ry:1,rot:0},a=>{a.rot=1}],['EllipticalArc',{c:{x:0,y:0},rx:2,ry:1,rot:0,a:{x:2,y:0},b:{x:0,y:1}},a=>{a.a.x=1}],['BezierCurve',{cp1:{x:0,y:0},cp2:{x:1,y:1},cp3:{x:2,y:1},cp4:{x:3,y:0}},a=>{a.cp2.y=2}]];
 for(const [type,before,mutate] of values){const after=structuredClone(before);mutate(after);assert.equal(check(type,before,after),true);after.injected=1;rejects(type,before,after);}
});
test('spline control coordinates may move but knots, modes, point IDs and other authored data do not',()=>{
 const before={degree:2,cPoints:[{id:'p1',x:0,y:0,weight:1},{id:'p2',x:1,y:1,weight:1},{id:'p3',x:2,y:0,weight:1}],fPoints:[{id:'f',x:0,y:0}],kValues:[0,0,0,1,1,1],type:'Clamped',method:1,interpolation:false,CVModel:false,branch:'authored'};
 const moved=structuredClone(before);moved.cPoints[1].x=3;assert.equal(check('BSpline',before,moved),true);
 for(const mutate of [a=>{a.degree=3},a=>{a.kValues[2]=.1},a=>{a.cPoints[1].id='other'},a=>{a.cPoints[1].weight=2},a=>{a.method=2},a=>{a.type='Closed'},a=>{a.branch='other'},a=>{a.fPoints[0].x=8}]){const after=structuredClone(before);mutate(after);rejects('BSpline',before,after)}
});
test('rigid transform is movable but membership and local coordinates are authored',()=>{
 const before={version:1,members:[{id:'s',a:'s:A',b:'s:B'}],points:[{id:'s:A',x:0,y:0},{id:'s:B',x:10,y:0}],transform:{x:0,y:0,angle:0}};
 const moved=structuredClone(before);moved.transform.angle=1;assert.equal(check('RigidGroup',before,moved),true);
 for(const mutate of [a=>{a.members[0].id='z'},a=>{a.points[0].x=2},a=>{a.points[0].id='z'},a=>{a.version=2}]){const after=structuredClone(before);mutate(after);rejects('RigidGroup',before,after)}
});
test('unknown changed data, missing fields and nonfinite moved values are refused; unchanged unknown data is preserved',()=>{
 const before={x:1,nested:{tag:'preserve'}};assert.equal(check('FutureShape',before,structuredClone(before)),true);rejects('FutureShape',before,{x:2,nested:{tag:'preserve'}});rejects('Point',{x:1,y:2},{x:Infinity,y:2});rejects('Segment',{a:{x:0,y:0},b:{x:1,y:1}},{a:{x:0,y:0},b:{x:1}});
});
