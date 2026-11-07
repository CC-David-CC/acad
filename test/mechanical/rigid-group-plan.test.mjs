import assert from 'node:assert/strict';
import {test} from 'node:test';
import {planRigidSegments, mapRigidPoints} from '../../web/app/sketcher/rigid/rigidGroupPlan.mjs';
const p=(id,x,y)=>({id,x,y});
const rectangle=()=>[
 {id:'s1',a:p('a1',0,0),b:p('b1',100,0)},
 {id:'s2',a:p('a2',100,0),b:p('b2',100,50)},
 {id:'s3',a:p('a3',100,50),b:p('b3',0,50)},
 {id:'s4',a:p('a4',0,50),b:p('b4',0,0)}
];
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
test('rectangle keeps stable member and endpoint identities under planar transform',()=>{
 const input=rectangle(), plan=planRigidSegments('group-1',input), initial=mapRigidPoints(plan), moved=mapRigidPoints(plan,{x:27,y:-14,angle:1.2});
 assert.deepEqual(plan.members.map(m=>m.id),input.map(m=>m.id));
 for(let i=0;i<initial.length;i++)for(let j=0;j<i;j++)assert.ok(Math.abs(distance(initial[i],initial[j])-distance(moved[i],moved[j]))<1e-8);
 assert.deepEqual(initial.map(x=>x.id),moved.map(x=>x.id));
 assert.ok(Object.isFrozen(plan.points));
});
test('rejects overlapping identities, collapsed and collinear input',()=>{
 const shared=rectangle();shared[1].a.id=shared[0].b.id;assert.throws(()=>planRigidSegments('g',shared));
 const collapsed=rectangle();collapsed[0].b.x=0;assert.throws(()=>planRigidSegments('g',collapsed));
 assert.throws(()=>planRigidSegments('g',[{id:'s',a:p('a',0,0),b:p('b',1,0)},{id:'t',a:p('c',2,0),b:p('d',3,0)}]));
});

test('persisted frame is detached, validated and retained rather than reoriented',async()=>{
 const {readRigidGroupRecord}=await import('../../web/app/sketcher/rigid/rigidGroupPlan.mjs');
 const plan=planRigidSegments('g',rectangle());
 const record=JSON.parse(JSON.stringify({version:plan.version,members:plan.members,points:plan.points,transform:{x:7,y:9,angle:0.5}}));
 const read=readRigidGroupRecord('g',record);record.points[0].x=999;
 assert.equal(read.points[0].x,0);assert.equal(read.transform.angle,0.5);
 const duplicate=JSON.parse(JSON.stringify(read));delete duplicate.id;duplicate.members[1].id=duplicate.members[0].id;
 assert.throws(()=>readRigidGroupRecord('g',duplicate));
});
