import assert from 'node:assert/strict';
import {HeadlessSketchWorkspace} from '../../../../web/app/sketcher/headless/workspace';
import {AlgNumConstraint} from '../../../../web/app/sketcher/constr/ANConstraints';
import {Polynomial,POW_1_FN,SIN_FN} from '../../../../web/app/sketcher/constr/polynomial';
export function genericControls(restart:boolean){
 const ws=new HeadlessSketchWorkspace({});ws.io._loadSketch({version:3,objects:[{id:'p',type:'Point',role:null,stage:0,data:{x:1,y:0}},{id:'q',type:'Point',role:null,stage:0,data:{x:0,y:2}}],dimensions:[],labels:[],stages:[{constraints:[],generators:[]}],constants:'',boundary:{lines:[],arcs:[],circles:[],nurbses:[]}},{strict:true});
 const index=ws.createIndex(),p=index.p,q=index.q,stage=ws.parametricManager.stage,system=stage.solverSystem;
 const schema=(id,collectPolynomials)=>({id,defineParamsScope:([a,b],cb)=>{a.visitParams(cb);b.visitParams(cb);},collectPolynomials});
 const prefix=new AlgNumConstraint(schema('GenericPrefixMultiEquation',(out,[x,y,a])=>{out.push(new Polynomial(-1).monomial(1).term(x,POW_1_FN),new Polynomial().monomial(1).term(y,POW_1_FN).monomial(1).term(a,SIN_FN));}),[p,q]);
 const fixed=new AlgNumConstraint(schema('GenericFixedInput',(out,[x,y,a])=>out.push(new Polynomial().monomial(1).term(a,POW_1_FN))),[p,q]);
 const candidate=new AlgNumConstraint(schema('GenericImplied',(out,[x,y])=>out.push(new Polynomial().monomial(1).term(y,POW_1_FN))),[p,q]);
 system.startTransaction();for(const c of [prefix,fixed,candidate]){c.stage=stage;system.addConstraint(c);}system.finishTransaction();system.solveFine();
 assert.equal(system.solveStatus.success,true);assert.equal(system.redundant.has(candidate),restart);assert.equal(system.redundant.has(prefix),false,'Earlier multi-equation relation must retain its independent equation');
 assert.equal(p.x,1);assert.ok(p.y===0);assert.ok(q.x===0);assert.equal(q.y,2);
 const before=system.allConstraints.map(c=>({id:c.schema.id,admission:c.admissionHint}));
 system.removeConstraint(fixed);system.solveFine();assert.equal(system.redundant.has(candidate),false,'Removing the prerequisite must reactivate the retained candidate');assert.equal(system.isConflicting(candidate),false);
 const after=system.allConstraints.map(c=>({id:c.schema.id,admission:c.admissionHint}));
 // Independent partial equation survives an implied component.
 const other=new HeadlessSketchWorkspace({});other.io._loadSketch({version:3,objects:[{id:'p',type:'Point',role:null,stage:0,data:{x:0,y:0}},{id:'q',type:'Point',role:null,stage:0,data:{x:0,y:0}}],dimensions:[],labels:[],stages:[{constraints:[],generators:[]}],constants:'',boundary:{lines:[],arcs:[],circles:[],nurbses:[]}},{strict:true});
 const ids=other.createIndex(),sys=other.parametricManager.stage.solverSystem;
 const one=new AlgNumConstraint(schema('GenericX',(out,[x])=>out.push(new Polynomial().monomial(1).term(x,POW_1_FN))),[ids.p,ids.q]);
 const partial=new AlgNumConstraint(schema('GenericPartial',(out,[x,y])=>out.push(new Polynomial().monomial(1).term(x,POW_1_FN),new Polynomial().monomial(1).term(y,POW_1_FN))),[ids.p,ids.q]);
 sys.startTransaction();for(const c of [one,partial]){c.stage=other.parametricManager.stage;sys.addConstraint(c);}sys.finishTransaction();sys.solveFine();assert.equal(sys.redundant.has(partial),false);assert.equal(sys.isConflicting(partial),false);
 // Existing eqEps semantics are numerical, not exact-rational certification.
 // x=0 and x=1e-13 are mathematically inconsistent but are treated as the same
 // reduced row by the inherited1e-12 algebraic zero tolerance in both sources.
 const nearZero=new AlgNumConstraint(schema('GenericNearZero',(out,[x])=>out.push(new Polynomial(-1e-13).monomial(1).term(x,POW_1_FN))),[ids.p,ids.q]);
 nearZero.stage=other.parametricManager.stage;sys.addConstraint(nearZero);assert.equal(sys.redundant.has(nearZero),true);
 return {scope:'Actual nonvisual workspace/constraint subsystem, custom generic polynomial schemas; no browser/Worker/UI claim',prefixBefore:before,prefixAfterRemovingPrerequisite:after,partialMultiEquationRemainsActive:true,inheritedTolerance:{offset:1e-13,classification:nearZero.admissionHint.state,mathematicalExactRedundancy:false}};
}
