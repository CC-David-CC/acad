import {test} from 'node:test';import assert from 'node:assert/strict';
import {ConstraintDefinitions as d,validateConstraintConstantValues as validate} from '../../web/app/sketcher/constr/ANConstraints.ts';
import {validateProjectSketch} from '../../web/app/sketcher/io.ts';
const valid=(schema,value)=>validate(schema,{angle:value},v=>v);
test('horizontal and vertical allow only equivalent numeric axis orientations',()=>{
 for(const n of [0,180,360,-180,540])assert.doesNotThrow(()=>valid(d.Horizontal,String(n)));
 for(const n of [90,270,450,-90,-270])assert.doesNotThrow(()=>valid(d.Vertical,String(n)));
 for(const [schema,bad] of [[d.Horizontal,45],[d.Horizontal,90],[d.Vertical,0],[d.Vertical,180],[d.Vertical,90.000001],[d.Horizontal,Infinity],[d.Horizontal,'abc'],[d.Vertical,'0x5a'],[d.Horizontal,'0xb4']])assert.throws(()=>valid(schema,String(bad)),/axis orientation/);
 assert.equal(d.Horizontal.constants.angle.transform(360),0);assert.ok(Math.abs(d.Vertical.constants.angle.transform(-90)-Math.PI*1.5)<1e-12);
});
test('native project preflight rejects invalid read-only axis angle before restore',()=>{
 const sketch={version:3,objects:[{id:'s',type:'Segment',stage:0,data:{a:{x:0,y:0},b:{x:1,y:0}}}],dimensions:[],labels:[],stages:[{constraints:[{typeId:'Horizontal',objects:['s'],constants:{angle:'45'},admission:{version:1,state:'accepted'}}],generators:[]}],constants:''};
 assert.throws(()=>validateProjectSketch(sketch),/axis orientation/);sketch.stages[0].constraints[0].constants.angle='180';assert.doesNotThrow(()=>validateProjectSketch(sketch));
});
