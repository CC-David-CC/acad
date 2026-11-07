import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {Polynomial,POW_1_FN,POW_2_FN,COS_FN} from '../../web/app/sketcher/constr/polynomial.ts';
import {Param} from '../../web/app/sketcher/shapes/param.ts';
import {Segment} from '../../web/app/sketcher/shapes/segment.ts';
import {EndPoint} from '../../web/app/sketcher/shapes/point.ts';
import {AlgNumConstraint,ConstraintDefinitions} from '../../web/app/sketcher/constr/ANConstraints.ts';
import {AlgNumSubSystem} from '../../web/app/sketcher/constr/AlgNumSystem.ts';
import {HeadlessSketchWorkspace} from '../../web/app/sketcher/headless/workspace.ts';
import {prepareSignedDistance} from '../../web/app/sketcher/actions/signedDistanceAdmission.js';

const factor=(t,a,constant=0)=>new Polynomial(constant).monomial(1).term(t,POW_1_FN).term(a,COS_FN);
test('only certified identity POW1 factors cancel; current nonzero values prove nothing',()=>{
 const t=new Param(10),a=new Param(.3),p=factor(t,a);
 assert.equal(p.cancelCommonNonzeroFactors(new Set()),0);
 assert.equal(p.monomials[0].terms.length,2);
 const original=p.value();assert.equal(p.cancelCommonNonzeroFactors(new Set([t])),1);
 assert.ok(Math.abs(original-t.get()*p.value())<1e-14);
 t.set(-10);assert.ok(Math.abs(-original-t.get()*p.value())<1e-14);
});
test('nonzero constants including tiny offsets, missing common factor, and non-POW1 terms refuse',()=>{
 const t=new Param(10),a=new Param(.3),s=new Set([t]);
 for(const c of[1,1e-30,-1e-30])assert.equal(factor(t,a,c).cancelCommonNonzeroFactors(s),0);
 const mixed=factor(t,a).monomial(1).term(a,COS_FN);
 assert.equal(mixed.cancelCommonNonzeroFactors(s),0);
 assert.equal(new Polynomial().monomial(1).term(t,POW_2_FN).term(a,COS_FN).cancelCommonNonzeroFactors(s),0);
});
test('approximate compaction permanently marks the derived row and blocks exact cancellation',()=>{
 const t=new Param(10),a=new Param(.3),x=new Param(1),p=factor(t,a).monomial(1e-30).term(x,POW_1_FN);
 p.compact();assert.equal(p.usedApproximateReduction,true);
 assert.equal(p.cancelCommonNonzeroFactors(new Set([t])),0);
});

// These targeted algebra tests deliberately invoke the real reduction on real
// schemas without claiming public admission. Public Worker proof is separate.
function system({negative=false,tiny=false}={}){
 const stage={objects:new Set()},axis=new Segment(0,0,0,10,'axis'),p=new EndPoint(3,5,'p'),q=new EndPoint(-3,5,'q'),aux=new EndPoint(0,6,'aux');
 if(negative){axis.params.t.set(-10);axis.params.ang.set(-Math.PI/2);}
 for(const o of[axis,p,q,aux]){o.traverse(child=>{child.stage=stage;});stage.objects.add(o);}
 const sys=stage.algNumSystem=new AlgNumSubSystem(()=>100,v=>v,stage);
 const make=(id,objects,constants)=>{const c=new AlgNumConstraint(ConstraintDefinitions[id],objects,constants);c.stage=stage;c.resolveConstants(v=>v);return c;};
 const polar=make('Polar',[axis,axis.a,axis.b]),symmetry=make('AxisSymmetry',[p,q,axis]);
 const first=make('SignedDistanceX',tiny?[axis.a,aux]:[axis.a,axis.b],{distance:tiny?1e-14:0});
 const second=tiny?make('SignedDistanceX',[aux,axis.b],{distance:0}):null;
 sys.allConstraints=[polar,symmetry,first,...second?[second]:[]];sys.projectedConstraintCount=1;
 const rebuild=()=>{sys.evaluateAndBuildSolver();return sys.polynomials.filter(row=>sys.polyToConstr.get(row)===polar);};
 const containsT=rows=>rows.some(row=>row.monomials.some(m=>m.terms.some(t=>t.param===axis.params.t)&&m.terms.some(t=>t.fn===COS_FN)));
 return{sys,stage,axis,aux,polar,symmetry,first,second,rebuild,containsT};
}
test('same active system direction domain certifies positive and negative t, preserving row/origin identity',()=>{
 for(const negative of[false,true]){
  const f=system({negative}),rows=f.rebuild();
  assert.equal(f.containsT(rows),false);
  assert.ok(rows.every(row=>f.sys.polyToConstr.get(row)===f.polar));
  assert.equal(f.axis.params.t.get(),negative?-10:10);
 }
});
test('certificate is revoked on removal, rejection and stage change, rebuilt for active redundant relation',()=>{
 for(const mode of['remove','reject','stage']){
  const f=system();assert.equal(f.containsT(f.rebuild()),false);
  if(mode==='remove'){f.sys.allConstraints=f.sys.allConstraints.filter(c=>c!==f.symmetry);f.sys.projectedConstraintCount=0;}
  if(mode==='reject')f.sys.conflicting.add(f.symmetry);
  if(mode==='stage')f.symmetry.stage={algNumSystem:{}};
  assert.equal(f.containsT(f.rebuild()),true,mode);
  if(mode==='reject'){f.sys.redundant.add(f.symmetry);assert.equal(f.containsT(f.rebuild()),false);}
 }
});
test('zero direction does not receive a certificate despite retaining the AxisSymmetry schema',()=>{
 const f=system();f.axis.b.y=0;f.axis.params.t.set(0);
 assert.equal(f.containsT(f.rebuild()),true);
});
test('two-step tiny-offset ancestor taints later exact alias; removal/rebuild clears only fresh provenance',()=>{
 const f=system({tiny:true}),rows=f.rebuild();
 assert.equal(f.containsT(rows),true);
 assert.ok(rows.some(row=>row.usedApproximateReduction));
 assert.ok([...f.sys.substitutedParams.values()].some(row=>row.usedApproximateReduction));
 // Replace the nonzero authored source requirement, rather than rounding it
 // in the test or reusing a cached certificate/proof from the prior build.
 const exact=new AlgNumConstraint(ConstraintDefinitions.SignedDistanceX,f.first.objects,{distance:0});
 exact.stage=f.stage;exact.resolveConstants(v=>v);
 f.sys.allConstraints=f.sys.allConstraints.map(c=>c===f.first?exact:c);
 assert.equal(f.containsT(f.rebuild()),false);
});
test('dropped ancestor coefficient remains tainted through affine substitution and offset cancellation',()=>{
 const f=system({tiny:true});
 f.first.constants.distance=2;f.first.resolveConstants(v=>v);
 f.second.constants.distance=-2;f.second.resolveConstants(v=>v);
 const original=f.first.collectPolynomials;
 // Algebra fault-control only: the production schema is unchanged. This
 // explicit tiny term distinguishes the original equation from its rounded
 // descendant even after the +2/-2 affine offsets cancel exactly.
 f.first.collectPolynomials=function(out){original.call(this,out);out[out.length-1].monomial(1e-30).term(f.aux.params.y,POW_1_FN);};
 const rows=f.rebuild();assert.equal(f.containsT(rows),true);
 assert.ok(rows.some(row=>row.usedApproximateReduction));
 f.first.collectPolynomials=original;
 assert.equal(f.containsT(f.rebuild()),false);
});
test('actual captured consumed sketch accepts live-axis X0 and normal native replay without a pose seed',()=>{
 const fixture=JSON.parse(readFileSync(process.env.CODI_AXIS_FIXTURE,'utf8'));
 const workspace=new HeadlessSketchWorkspace({});workspace.io._loadSketch(fixture.sketch,{strict:true});
 const pm=workspace.parametricManager,axis=workspace.createIndex()[fixture.ids[2]],prepared=prepareSignedDistance(pm,'x',[axis.a,axis.b],0);
 pm.startTransaction();pm._add(prepared.constraint);pm.finishTransaction(prepared.validate,false);
 assert.ok(Math.abs(axis.b.x-axis.a.x)<1e-7);assert.ok(Math.hypot(axis.b.x-axis.a.x,axis.b.y-axis.a.y)>1e-9);
 assert.equal(prepared.constraint.stage.algNumSystem.solveStatus.success,true);
 const saved=workspace.io.serializeSketch(undefined,{strict:true}),fresh=new HeadlessSketchWorkspace({});fresh.io._loadSketch(JSON.parse(saved),{strict:true});
 assert.equal(fresh.io.serializeSketch(undefined,{strict:true}),saved);
});
