import {test} from 'node:test';import assert from 'node:assert/strict';
import {profilePlan,rectangleProfile,profileRegions,selectedRegionPlan} from '../../modules/workbenches/modeler/features/extrude/profilePlan.mjs';
const c=(x,y,r)=>({kind:'circle',x,y,r}),r=(minX,minY,maxX,maxY)=>({kind:'rectangle',minX,minY,maxX,maxY});
test('holes, islands, offset shapes and disjoint profiles preserve distinct bodies',()=>{
 assert.deepEqual(profilePlan([c(0,0,15),c(0,0,5),c(0,0,2),c(40,0,5)]),[{outer:0,holes:[1]},{outer:2,holes:[]},{outer:3,holes:[]}]);
 assert.deepEqual(profilePlan([c(3,0,2),r(-10,-10,10,10),r(30,0,35,5)]),[{outer:1,holes:[0]},{outer:2,holes:[]}]);
 assert.deepEqual(profilePlan([r(-2,-2,2,2),c(0,0,10)]),[{outer:1,holes:[0]}]);
});
test('touching, crossing, close and unclassified profiles are rejected',()=>{
 for(const shapes of [[c(0,0,5),c(10,0,5)],[c(0,0,5),c(8,0,5)],[c(0,0,10),c(5,0,5)],[r(0,0,10,10),r(5,5,15,15)],[r(0,0,10,10),c(0,5,1)],[null,c(0,0,2)],[c(0,0,NaN)],[c(1e15,0,1)]])assert.throws(()=>profilePlan(shapes));
 assert.throws(()=>profilePlan(Array.from({length:129},(_,i)=>c(i*4,0,1))),/Too many/);
});
test('rectangle validation ignores winding and rejects open or crossing edges',()=>{
 const p=(x,y)=>({x,y}),s=(a,b)=>({a:p(...a),b:p(...b)}),rect=[s([0,0],[10,0]),s([10,0],[10,5]),s([10,5],[0,5]),s([0,5],[0,0])];
 assert.deepEqual(rectangleProfile(rect),r(0,0,10,5));assert.deepEqual(rectangleProfile(rect.map(e=>({a:e.b,b:e.a})).reverse()),r(0,0,10,5));
 assert.equal(rectangleProfile(rect.slice(0,3)),null);assert.equal(rectangleProfile([rect[0],rect[1],rect[2],s([0,5],[10,0])]),null);
});

test('simple-segment validation rejects open and bow-tie contours',async()=>{
 const {validateSegmentLoop}=await import('../../modules/workbenches/modeler/features/extrude/profilePlan.mjs');
 const p=(x,y)=>({x,y}),s=(a,b)=>({a:p(...a),b:p(...b)});
 const square=[s([0,0],[10,0]),s([10,0],[10,10]),s([10,10],[0,10]),s([0,10],[0,0])];
 assert.doesNotThrow(()=>validateSegmentLoop(square));
 assert.throws(()=>validateSegmentLoop(square.slice(0,3)),/closed/);
 assert.throws(()=>validateSegmentLoop([s([0,0],[10,10]),s([10,10],[0,10]),s([0,10],[10,0]),s([10,0],[0,0])]),/intersecting/);
});

test('explicit region selection distinguishes annulus, inner disk, both and nested subsets',()=>{
 const two=[c(0,0,15),c(0,0,5)],twoRegions=profileRegions(two);
 assert.deepEqual(selectedRegionPlan(two,[0],'separate').regions,[twoRegions[0]]);
 assert.deepEqual(selectedRegionPlan(two,[1],'separate').regions,[twoRegions[1]]);
 assert.deepEqual(selectedRegionPlan(two,[0,1],'union').regions,twoRegions);
 const nested=[c(0,0,15),c(0,0,5),c(0,0,2)];
 const regions=profileRegions(nested);
 assert.deepEqual(regions,[{outer:0,holes:[1],depth:0},{outer:1,holes:[2],depth:1},{outer:2,holes:[],depth:2}]);
 const ring=selectedRegionPlan(nested,[0],'separate');assert.deepEqual(ring.regions,[regions[0]]);
 const middle=selectedRegionPlan(nested,[1],'separate');assert.deepEqual(middle.regions,[regions[1]]);
 const all=selectedRegionPlan(nested,[0,1,2],'union');assert.deepEqual(all.regions,regions);assert.equal(all.bodyPolicy,'union');
 const disjoint=[c(-20,0,3),c(20,0,3)];assert.equal(selectedRegionPlan(disjoint,[1],'separate').regions[0].outer,1);
 for(const bad of [[],[0,0],[3],[-1]])assert.throws(()=>selectedRegionPlan(nested,bad,'separate'));
 assert.throws(()=>selectedRegionPlan(nested,[0],undefined),/combined/);
});
