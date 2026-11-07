import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assignEnclosureMaterials} from '../../web/app/cad/projectManager/enclosureMaterialAssignment.mjs';
const history=[{type:'WORKER_ENCLOSURE_V1',params:{featureId:7}}];
const bodies=['BODY','LID'].map(outputRole=>({id:'worker-enclosure:1:'+JSON.stringify([7,outputRole]),featureId:7,outputRole,originatingOperation:0}));
const roles={BODY:{material:{id:'pla',name:'PLA'},appearance:{id:'red',name:'Red',color:'#ff0000'}},LID:{material:{id:'petg',name:'PETG'},appearance:null}};
const input={metadata:null,revision:'revision-1',featureId:7,history,bodies,roles};
test('binds the authored roles independently of body order',()=>{const a=assignEnclosureMaterials({...input,bodies:[...bodies].reverse()});assert.deepEqual(a.bindings.map(x=>x.outputRole),['BODY','LID']);assert.deepEqual(a.objects.map(x=>x.regions[0].materialId),['pla','petg']);assert.equal(a.objects[1].regions[0].appearanceId,null);assert.deepEqual(assignEnclosureMaterials({...input,metadata:a}),a)});
test('rejects stale metadata, missing/duplicate bodies and conflicting identities',()=>{const a=assignEnclosureMaterials(input);assert.throws(()=>assignEnclosureMaterials({...input,metadata:{...a,revision:'old'}}));assert.throws(()=>assignEnclosureMaterials({...input,bodies:[bodies[0]]}));assert.throws(()=>assignEnclosureMaterials({...input,bodies:[...bodies,bodies[0]]}));assert.throws(()=>assignEnclosureMaterials({...input,metadata:a,roles:{...roles,LID:{material:{id:'pla',name:'Different'},appearance:null}}}));assert.equal(a.materials[0].name,'PLA')});

test('reassignment preserves authored object name, region identity and transform',()=>{const a=assignEnclosureMaterials(input);a.objects[0].name='Custom';a.objects[0].regions[0].id='custom-region';a.objects[0].regions[0].transform[9]=37;const b=assignEnclosureMaterials({...input,metadata:a});assert.equal(b.objects[0].name,'Custom');assert.equal(b.objects[0].regions[0].id,'custom-region');assert.equal(b.objects[0].regions[0].transform[9],37)});

const labeled={...input,history:[{type:'WORKER_ENCLOSURE_V2',params:{featureId:7}}],bodies:['BODY','LID','LABEL'].map(outputRole=>({id:'worker-enclosure:2:'+JSON.stringify([7,outputRole]),featureId:7,outputRole,originatingOperation:0})),roles:{...roles,LABEL:{material:{id:'pla',name:'PLA'},appearance:{id:'white',name:'White',color:'#ffffff'}}}};
test('v2 keeps label as a distinct material region inside the lid object',()=>{
 const data=assignEnclosureMaterials({...labeled,bodies:[...labeled.bodies].reverse()});
 assert.equal(data.objects.length,2);assert.equal(data.bindings.length,3);
 assert.deepEqual(data.objects.map(o=>o.regions.map(r=>r.bodyId)),[['enclosure-7-BODY'],['enclosure-7-LID','enclosure-7-LABEL']]);
 assert.equal(data.objects[1].regions[1].materialId,'pla');assert.equal(data.objects[1].regions[1].appearanceId,'white');
 assert.deepEqual(assignEnclosureMaterials({...labeled,metadata:data}),data);
});
test('v2 region identity and authored placement survive reassignment',()=>{
 const data=assignEnclosureMaterials(labeled);data.objects[1].name='Printed cover';
 data.objects[1].regions[1].id='inset-text';data.objects[1].regions[1].transform[9]=12;
 const changed=assignEnclosureMaterials({...labeled,metadata:data,roles:{...labeled.roles,LABEL:{...labeled.roles.LABEL,appearance:{id:'black',name:'Black',color:'#000000'}}}});
 assert.equal(changed.objects[1].name,'Printed cover');assert.equal(changed.objects[1].regions[1].id,'inset-text');assert.equal(changed.objects[1].regions[1].transform[9],12);assert.equal(changed.objects[1].regions[1].materialId,'pla');assert.equal(data.objects[1].regions[1].appearanceId,'white');
});
test('v2 refuses missing label, wrong version identity and duplicate roles without mutation',()=>{
 const data=assignEnclosureMaterials(labeled),before=structuredClone(data);
 for(const wrong of [labeled.bodies.slice(0,2),[...labeled.bodies,labeled.bodies[2]],labeled.bodies.map(b=>({...b,id:b.id.replace(':2:',':1:')}))])assert.throws(()=>assignEnclosureMaterials({...labeled,metadata:data,bodies:wrong}));
 assert.throws(()=>assignEnclosureMaterials({...labeled,roles}));assert.deepEqual(data,before);
});
