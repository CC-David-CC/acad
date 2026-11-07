import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateProjectSketch} from '../../web/app/sketcher/io.ts';
const sketch=()=>({version:3,objects:[{id:'point',type:'Point',stage:0,data:{x:0,y:0}}],dimensions:[],labels:[],stages:[{constraints:[{typeId:'LockPoint',objects:['point'],constants:{x:'0',y:'0'},annotations:[],admission:{version:1,state:'accepted'}}],generators:[]}],constants:''});
test('revision-one constraint intent is checked before reconstruction',()=>{
 validateProjectSketch(sketch());
 for(const mutate of [c=>delete c.admission,c=>c.admission={version:2,state:'accepted'},c=>c.typeId='NoSuchConstraint',c=>c.objects=[null],c=>c.objects=['missing'],c=>c.annotations={},c=>delete c.constants.x,c=>c.constants.extra='1']){
  const candidate=sketch();mutate(candidate.stages[0].constraints[0]);assert.throws(()=>validateProjectSketch(candidate));
 }
});
