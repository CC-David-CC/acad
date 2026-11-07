import assert from 'node:assert/strict';
import {test} from 'node:test';
import {Segment} from '../../web/app/sketcher/shapes/segment.ts';
import {prepareLengthRelation} from '../../web/app/sketcher/actions/lengthRelationAdmission.js';
function fixture(){
 const previous={conflicting:new Set(),redundant:new Set()},system={allConstraints:[],transactionBefore:previous,conflicting:new Set(),redundant:new Set()};
 const stage={index:0,algNumSystem:system},pm={stages:[stage],inTransaction:false,constantResolver:v=>v};
 const a=new Segment(0,0,10,0,'a'),b=new Segment(0,1,5,1,'b');a.stage=b.stage=stage;return {a,b,stage,pm,system,previous};
}
test('prepares without viewer or transaction, preserving constants and selected stage',()=>{
 const f=fixture(),p=prepareLengthRelation(f.pm,[f.a,f.b],{factor:'2',offset:'0'});assert.equal(p.stage,f.stage);assert.equal(p.constraint.schema.id,'LengthRelation');assert.deepEqual(p.constraint.constants,{factor:'2',offset:'0'});p.constraint.stage=f.stage;f.system.allConstraints.push(p.constraint);p.validate([f.stage]);
});
test('generated same-stage, duplicate and invalid constants refuse before admission',()=>{
 const f=fixture();assert.throws(()=>prepareLengthRelation(f.pm,[f.a,f.a],{factor:'1',offset:'0'}));f.a.generator={};assert.throws(()=>prepareLengthRelation(f.pm,[f.a,f.b],{factor:'1',offset:'0'}));f.a.generator=null;assert.throws(()=>prepareLengthRelation(f.pm,[f.a,f.b],{factor:'-1',offset:'0'}));
});
test('validator refuses new or newly rejected prior constraints but permits redundancy and previously rejected rows',()=>{
 const f=fixture(),p=prepareLengthRelation(f.pm,[f.a,f.b],{factor:'1',offset:'0'}),prior={};p.constraint.stage=f.stage;f.system.allConstraints.push(p.constraint,prior);f.system.conflicting.add(prior);assert.throws(()=>p.validate([f.stage]));f.previous.conflicting.add(prior);p.validate([f.stage]);f.system.conflicting.add(p.constraint);assert.throws(()=>p.validate([f.stage]));f.system.redundant.add(p.constraint);p.validate([f.stage]);
});
test('latest source stage owns the relation; a generated earlier-stage segment remains eligible',()=>{
 const f=fixture(),later={index:1,algNumSystem:{allConstraints:[],transactionBefore:{conflicting:new Set(),redundant:new Set()},conflicting:new Set(),redundant:new Set()}};f.pm.stages.push(later);f.a.generator={};f.b.stage=later;
 const p=prepareLengthRelation(f.pm,[f.a,f.b],{factor:'1',offset:'0'});assert.equal(p.stage,later);p.constraint.stage=later;later.algNumSystem.allConstraints.push(p.constraint);p.validate([f.stage,later]);
});
