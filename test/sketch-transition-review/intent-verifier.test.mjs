import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {sameRestoredSketch} from '../../web/app/sketcher/historyEquivalence.mjs';
// Execute the exact private verifier body. No solver, Worker, live editor or
// production result mutation is simulated by this source-method control.
const source=fs.readFileSync('web/app/sketcher/headless/sketchTransition.ts','utf8');
const match=source.match(/function verifyLengthIntent\(before:any,after:any,intent:any,status:string\) \{([\s\S]*?)\n\}/);
assert.ok(match,'Exact reviewed private function exists');
const fail=(code,message)=>Object.assign(Error(message),{code});
const verify=new Function('sameRestoredSketch','fail',`return function(before,after,intent,status){${match[1]}\n}`)(sameRestoredSketch,fail);
const objects=[
 {id:'a',type:'Segment',role:null,stage:0,data:{a:{x:0,y:0},b:{x:10,y:0}}},
 {id:'b',type:'Segment',role:null,stage:0,data:{a:{x:0,y:20},b:{x:10,y:20}}},
 {id:'raw',type:'BSpline',role:null,stage:0,data:{degree:2,cPoints:[{id:'splineraw_cPoint0',x:0,y:40},{id:'splineraw_cPoint1',x:10,y:50},{id:'splineraw_cPoint2',x:20,y:40}],fPoints:[],kValues:[0,0,0,1,1,1],interpolation:false,CVModel:false,type:'Clamped',method:-1}},
 {id:'g',type:'RigidGroup',role:null,stage:0,data:{version:1,members:[{id:'a',a:'a:A',b:'a:B'},{id:'b',a:'b:A',b:'b:B'}],points:[{id:'a:A',x:0,y:0},{id:'a:B',x:10,y:0},{id:'b:A',x:0,y:20},{id:'b:B',x:10,y:20}],transform:{x:0,y:0,angle:0}}}
];
const before={version:3,objects,dimensions:[],labels:[],stages:[{constraints:[],generators:[]}],constants:'',metadata:{marker:'authored'},boundary:{lines:[],arcs:[],circles:[],nurbses:[]}};
const intent={ids:['a','b'],factor:2,offset:0};
const after=structuredClone(before);after.stages[0].constraints.push({typeId:'LengthRelation',objects:['a','b'],constants:{factor:'2',offset:'0'},stage:0,annotations:[],admission:{version:1,state:'accepted'}});
const controls=[];
function control(id,mutate,expected){const candidate=structuredClone(after);mutate(candidate);let accepted=false,error=null;try{verify(before,candidate,intent,'accepted');accepted=true}catch(e){error={code:e.code,message:e.message}}assert.equal(accepted,expected,id);controls.push({id,verifierAccepted:accepted,error});}
control('requested-relation-only',()=>{},true);
control('numeric-coordinate-change',s=>s.objects[0].data.b.x=20,true);
control('changed-root-id',s=>s.objects[2].id='changed',false);
control('changed-metadata',s=>s.metadata.marker='changed',false);
control('changed-generator-intent',s=>s.stages[0].generators.push({typeId:'Changed'}),false);
control('changed-relation-target',s=>s.stages[0].constraints[0].objects.reverse(),false);
control('masked-spline-degree-and-knots',s=>{s.objects[2].data.degree=1;s.objects[2].data.kValues=[0,0,.5,1,1]},true);
control('masked-spline-method',s=>s.objects[2].data.method=1,true);
control('masked-spline-mode',s=>s.objects[2].data.CVModel=true,true);
control('masked-spline-child-id',s=>s.objects[2].data.cPoints[0].id='changed',true);
control('masked-rigid-local-definition',s=>s.objects[3].data.points[3].x=11,true);
control('masked-rigid-member-id',s=>s.objects[3].data.members[0].id='changed',true);
const receipt={version:1,source:'10489c3d5ef3da13394f1e8d0e1f8098b64c9980',layer:'synthetic-exact-source-method',functionBodySha256:crypto.createHash('sha256').update(match[1]).digest('hex'),scope:'Private verifyLengthIntent only. Other validation may reject mutated fields; no actual solver mutation or accepted full-transition corruption is established.',controls};
fs.writeFileSync('test/sketch-transition-review/intent-verifier-receipt.json',JSON.stringify(receipt,null,2)+'\n');
console.log('PASS 12 source-method controls; six authored data mutations evade the private intent comparator');
