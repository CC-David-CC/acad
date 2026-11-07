import test from 'node:test';import assert from 'node:assert/strict';
import {assertGeometry,authoredIntent,validateWorkerCase} from './oracles.mjs';
const s=objects=>({version:3,objects,stages:[],dimensions:[],labels:[],constants:'',metadata:{},boundary:{}});
test('line checks independent3-4-5 coordinates and length',()=>{
 const value=s([{id:'s',data:{a:{x:1,y:2},b:{x:4,y:6}}}]);
 assertGeometry(value,{kind:'line',id:'s',a:[1,2],b:[4,6],length:5});
 assert.throws(()=>assertGeometry(value,{kind:'line',id:'s',a:[1,2],b:[4,6],length:4}));
});
test('perpendicular-bisector false midpoint is refused by independent oracle',()=>{
 assert.throws(()=>assertGeometry(s([{id:'p',data:{x:0,y:5}}]),{kind:'point',id:'p',at:[0,0]}));
 assertGeometry(s([{id:'p',data:{x:0,y:0}}]),{kind:'point',id:'p',at:[0,0]});
});
test('radius-versus-diameter mistake cannot pass circle oracle',()=>{
 assert.throws(()=>assertGeometry(s([{id:'c',data:{c:{x:0,y:0},r:20}}]),{kind:'circle',id:'c',center:[0,0],radius:10}));
 assertGeometry(s([{id:'c',data:{c:{x:0,y:0},r:12.7}}]),{kind:'circle',id:'c',center:[0,0],radius:25.4/2});
});
test('intent projection retains authored metadata, formulas and annotations',()=>{
 const value=s([{id:'p',type:'Point',role:null,stage:0,data:{x:0,y:0}}]);value.constants='L = 10';value.metadata.label='intent';
 const changed=structuredClone(value);changed.objects[0].data.x=5;assert.deepEqual(authoredIntent(changed),authoredIntent(value));
 changed.constants='L = 20';assert.notDeepEqual(authoredIntent(changed),authoredIntent(value));
});
test('transport and Worker failures cannot masquerade as a correct domain refusal',()=>{
 const entry={expected:'rejected',oracle:{kind:'refusal'}};
 for(const result of [{ok:false,transportError:true,error:{code:'Error',message:'failed'}},{ok:false,error:{code:'WORKER_ERROR',message:'failed'}}])assert.throws(()=>validateWorkerCase(entry,{before:'{}',after:'{}',result}));
});
