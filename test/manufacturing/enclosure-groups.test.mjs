import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assignEnclosureMaterials} from '../../web/app/cad/projectManager/enclosureMaterialAssignment.mjs';
import {validateEnclosureBuildGroups as validate} from '../../web/app/cad/export/enclosureBuildGroups.mjs';
function fixture(){
 const history=[{type:'WORKER_ENCLOSURE_V2',params:{featureId:7}}],bodies=['BODY','LID','LABEL'].map(outputRole=>({id:'worker-enclosure:2:'+JSON.stringify([7,outputRole]),featureId:7,outputRole,originatingOperation:0}));
 const roles=Object.fromEntries(['BODY','LID','LABEL'].map(role=>[role,{material:{id:role,name:role},appearance:null}]));
 return assignEnclosureMaterials({metadata:null,revision:'revision',featureId:7,history,bodies,roles});
}
test('assigned lid/label remain grouped under the same rigid placement',()=>{const m=fixture();for(const region of m.objects[1].regions)region.transform=[0,1,0,-1,0,0,0,0,1,10,20,30];validate(m,m.objects);m.objects[1].regions.reverse();validate(m,m.objects);});
test('different label placement cannot reuse nominal contact proof',()=>{const m=fixture();m.objects[1].regions[1].transform[9]+=1;assert.throws(()=>validate(m,m.objects),/same placement/);});
test('separate label object, cross-feature pairing and duplicate role refuse',()=>{
 for(const mutate of [m=>{const region=m.objects[1].regions.pop();m.objects.push({id:'label',name:'Label',regions:[region]});},m=>{m.bindings.find(b=>b.outputRole==='LABEL').featureId=8;},m=>{m.objects[1].regions[1]=structuredClone(m.objects[1].regions[0]);}]){const m=fixture();mutate(m);assert.throws(()=>validate(m,m.objects),/same placement/);}
});
test('body cannot silently merge into the lid print object',()=>{const m=fixture();m.objects[1].regions.unshift(m.objects[0].regions[0]);m.objects.shift();assert.throws(()=>validate(m,m.objects),/same placement/);});
