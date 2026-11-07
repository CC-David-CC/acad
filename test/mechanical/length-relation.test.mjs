import assert from 'node:assert/strict';
import {test} from 'node:test';
import {AlgNumConstraint,ConstraintDefinitions} from '../../web/app/sketcher/constr/ANConstraints.ts';
import {AlgNumSubSystem} from '../../web/app/sketcher/constr/AlgNumSystem.ts';
import {Param} from '../../web/app/sketcher/shapes/param.ts';
import {Polynomial,POW_1_FN} from '../../web/app/sketcher/constr/polynomial.ts';
import {solveSketch} from '../../web/app/sketcher/headless/solve.ts';

const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-6,`${a} != ${b}`);
function setup(first=25,second=10){
 const stage={objects:[],index:0};
 const segment=(id,t)=>({id,stage,constraints:new Set(),params:{t:new Param(t)},visitParams(cb){cb(this.params.t)}});
 const a=segment('a',first),b=segment('b',second);stage.objects.push(a,b);
 const sys=new AlgNumSubSystem(()=>100,v=>v,stage);
 const lock=(object,n)=>new AlgNumConstraint({id:'test-length-lock',name:'test-length-lock',defineParamsScope:([o],cb)=>cb(o.params.t),collectPolynomials:(out,[p])=>out.push(new Polynomial(-n).monomial().term(p,POW_1_FN))},[object]);
 const relation=(factor,offset)=>new AlgNumConstraint(ConstraintDefinitions.LengthRelation,[a,b],{factor:String(factor),offset:String(offset)});
 return {a,b,sys,lock,relation,stage};
}
test('one simultaneous length model expresses equality, ratio and signed difference',()=>{
 for(const [factor,offset,want] of [[1,0,10],[2,0,20],[1,5,15],[1,-5,5],[2,5,25]]){
  const f=setup(want,10);f.sys.addConstraint(f.lock(f.b,10));const c=f.relation(factor,offset);f.sys.addConstraint(c);f.sys.solveFine();
  assert.equal(f.sys.isConflicting(c),false);close(Math.abs(f.a.params.t.get()),want);close(f.b.params.t.get(),10);
  assert.equal(c.write().typeId,'LengthRelation');assert.deepEqual(c.write().constants,{factor:String(factor),offset:String(offset)});
 }
});
test('physical lengths respect negative internal segment orientation',()=>{
 for(const [first,second] of [[-25,10],[25,-10],[-25,-10]]){
  const f=setup(first,second);f.sys.addConstraint(f.lock(f.b,second));const c=f.relation(2,5);f.sys.addConstraint(c);f.sys.solveFine();
  assert.equal(f.sys.isConflicting(c),false);close(Math.abs(f.a.params.t.get()),25);close(f.b.params.t.get(),second);
 }
});
test('existing EqualLength also compares physical magnitudes without changing the sign branch',()=>{
 const f=setup(-10,10);f.sys.addConstraint(f.lock(f.b,10));const c=new AlgNumConstraint(ConstraintDefinitions.EqualLength,[f.a,f.b]);f.sys.addConstraint(c);f.sys.solveFine();
 assert.equal(f.sys.isConflicting(c),false);close(f.a.params.t.get(),-10);close(f.b.params.t.get(),10);
});
test('changing an independent length propagates through the retained relationship',()=>{
 const f=setup();const fixed=f.lock(f.b,10);f.sys.addConstraint(fixed);const c=f.relation(2,5);f.sys.addConstraint(c);
 f.sys.removeConstraint(fixed);f.sys.addConstraint(f.lock(f.b,20));f.sys.solveFine();
 assert.equal(f.sys.isConflicting(c),false);close(Math.abs(f.a.params.t.get()),45);close(f.b.params.t.get(),20);
});
test('contradictory affine relation cannot displace prior lengths',()=>{
 const f=setup();f.sys.addConstraint(f.lock(f.a,25));f.sys.addConstraint(f.lock(f.b,10));const bad=f.relation(2,-5);f.sys.addConstraint(bad);f.sys.solveFine();
 assert.equal(f.sys.isConflicting(bad),true);close(f.a.params.t.get(),25);close(f.b.params.t.get(),10);
});
test('constant validation rejects trailing text, nonfinite values and negative ratio',()=>{
 const f=setup();for(const values of [{factor:'1x',offset:'0'},{factor:'1',offset:'2x'},{factor:'Infinity',offset:'0'},{factor:'1',offset:'NaN'},{factor:'-1',offset:'0'}]){
  const c=new AlgNumConstraint(ConstraintDefinitions.LengthRelation,[f.a,f.b],values);assert.throws(()=>c.validateCandidateConstants(c.constants,v=>v));
 }
});
test('native relation restores an equation instead of baking a measured value',()=>{
 const f=setup(),c=f.relation(2,5);c.stage=f.stage;const saved=c.write();
 const restored=AlgNumConstraint.read(saved,{a:f.a,b:f.b});f.sys.addConstraint(f.lock(f.b,12));f.sys.addConstraint(restored);f.sys.solveFine();
 assert.equal(f.sys.isConflicting(restored),false);close(Math.abs(f.a.params.t.get()),29);assert.deepEqual(restored.constants,{factor:'2',offset:'5'});
});

function nativeSketch(){
 const constraint=(typeId,objects,constants)=>({typeId,objects,constants,stage:0,annotations:typeId==='SegmentLength'?[{offset:0}]:[],admission:{version:1,state:'accepted'}});
 return {version:3,objects:[
  {id:'a',type:'Segment',role:null,stage:0,data:{a:{x:0,y:0},b:{x:25,y:0}}},
  {id:'b',type:'Segment',role:null,stage:0,data:{a:{x:0,y:10},b:{x:10,y:10}}}
 ],dimensions:[],labels:[],constants:'',metadata:{},boundary:{lines:[],arcs:[],circles:[],nurbses:[]},stages:[{generators:[],constraints:[
  constraint('LockPoint',['a:A'],{x:'0',y:'0'}),constraint('LockPoint',['b:A'],{x:'0',y:'10'}),
  constraint('Horizontal',['a'],{angle:'0'}),constraint('Horizontal',['b'],{angle:'0'}),
  constraint('SegmentLength',['b'],{length:'10'}),constraint('LengthRelation',['a','b'],{factor:'2',offset:'5'})
 ]}]};
}
test('headless native regeneration preserves the relation and propagates edited length',()=>{
 const sketch=nativeSketch();sketch.stages[0].constraints.find(c=>c.typeId==='SegmentLength').constants.length='20';
 const result=solveSketch({revision:'relation',sketch,boundary:structuredClone(sketch.boundary),externalParameters:{}});
 assert.equal(result.ok,true,JSON.stringify(result));
 const measure=o=>Math.hypot(o.data.b.x-o.data.a.x,o.data.b.y-o.data.a.y);
 close(measure(result.sketch.objects[0]),45);close(measure(result.sketch.objects[1]),20);
 assert.deepEqual(result.sketch.stages[0].constraints.find(c=>c.typeId==='LengthRelation').constants,{factor:'2',offset:'5'});
 assert.ok(result.evidence.some(e=>e.typeId==='LengthRelation'&&e.state==='accepted'&&e.residuals.every(r=>Math.abs(r)<=e.tolerance)));
});
test('impossible negative physical length is rejected without mutating native input',()=>{
 const sketch=nativeSketch();Object.assign(sketch.stages[0].constraints.find(c=>c.typeId==='LengthRelation').constants,{factor:'1',offset:'-15'});
 const before=JSON.stringify(sketch),result=solveSketch({revision:'impossible',sketch,boundary:structuredClone(sketch.boundary),externalParameters:{}});
 assert.equal(result.ok,false);assert.ok(['SOLVE_FAILED','RESIDUAL','INVALID'].includes(result.error.code),JSON.stringify(result));assert.equal(JSON.stringify(sketch),before);
});

test('different initial magnitudes, orientations, and affine constants',()=>{
 for(const [first,second,factor,offset,want] of [[40,10,2,5,25],[-40,10,2,5,25],[3,-10,1,5,15],[-3,-10,1,-5,5],[4,10,0,7,7]]){
  const f=setup(first,second);f.sys.addConstraint(f.lock(f.b,second));const c=f.relation(factor,offset);f.sys.addConstraint(c);f.sys.solveFine();
  assert.equal(f.sys.isConflicting(c),false,JSON.stringify({first,second,factor,offset}));close(Math.abs(f.a.params.t.get()),want);
 }
});
test('equal length converges from unlike signed gauges',()=>{
 for(const [first,second] of [[30,10],[-30,10],[30,-10],[-30,-10]]){
  const f=setup(first,second);f.sys.addConstraint(f.lock(f.b,second));const c=new AlgNumConstraint(ConstraintDefinitions.EqualLength,[f.a,f.b]);f.sys.addConstraint(c);f.sys.solveFine();
  assert.equal(f.sys.isConflicting(c),false);close(Math.abs(f.a.params.t.get()),10);assert.equal(c.write().typeId,'EqualLength');
 }
});
test('duplicate equal and contradictory relation retain fixed geometry',()=>{
 const f=setup(10,10);f.sys.addConstraint(f.lock(f.a,10));f.sys.addConstraint(f.lock(f.b,10));
 const equal=new AlgNumConstraint(ConstraintDefinitions.EqualLength,[f.a,f.b]);f.sys.addConstraint(equal);f.sys.solveFine();
 assert.equal(f.sys.redundant.has(equal),true,'satisfied duplicate is redundant');const bad=f.relation(2,0);f.sys.addConstraint(bad);f.sys.solveFine();
 assert.equal(f.sys.isConflicting(bad),true);close(f.a.params.t.get(),10);close(f.b.params.t.get(),10);
});
test('scale and singular zero remain finite',()=>{
 for(const value of [1e-6,1,1e6]){const f=setup(value*2,value);f.sys.addConstraint(f.lock(f.b,value));const c=f.relation(2,0);f.sys.addConstraint(c);f.sys.solveFine();assert.equal(f.sys.isConflicting(c),false);assert.ok(Number.isFinite(f.a.params.t.get()));assert.ok(Math.abs(Math.abs(f.a.params.t.get())-2*value)<=Math.max(1e-8,value*1e-8));}
 const f=setup(0,0),c=f.relation(1,0);f.sys.addConstraint(c);f.sys.solveFine();assert.ok(Number.isFinite(f.a.params.t.get())&&Number.isFinite(f.b.params.t.get()));
});
