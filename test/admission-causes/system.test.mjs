import assert from 'node:assert/strict';import {test,after} from 'node:test';import fs from 'node:fs';
import {AlgNumConstraint,ConstraintDefinitions} from '../../web/app/sketcher/constr/ANConstraints.ts';
import {Polynomial,POW_1_FN,FreeFunction} from '../../web/app/sketcher/constr/polynomial.ts';
import {EndPoint} from '../../web/app/sketcher/shapes/point.ts';
import {HeadlessSketchWorkspace} from '../../web/app/sketcher/headless/workspace.ts';
import {assertRetainedStageValid} from '../../web/app/sketcher/rigid/rigidGroupDomain.mjs';
import {solveSketch} from '../../web/app/sketcher/headless/solve.ts';
import {addSignedDistanceTransition} from '../../web/app/sketcher/headless/signedDistanceTransition.ts';
import {admissionCause,causeForSolveStatus,captureSketchFailure,withAdmissionCause,failureCause} from '../../web/app/sketcher/constr/admissionCause.mjs';
import {captureSignedDistanceEnvelope,captureSignedDistanceVerificationEnvelope} from '../../web/app/sketcher/headless/signedDistanceEnvelope.mjs';
import {captureLineRelationEnvelope} from '../../web/app/sketcher/headless/lineRelationEnvelope.mjs';
const workerFixtures={};
after(()=>{if(process.env.CODI_CAUSE_WORKER_FIXTURE)fs.writeFileSync(process.env.CODI_CAUSE_WORKER_FIXTURE,JSON.stringify(workerFixtures,null,2)+'\n');});
const frame={origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]},boundary={lines:[],arcs:[],circles:[],nurbses:[]};
const make=(type,objects,constants)=>new AlgNumConstraint(ConstraintDefinitions[type],objects,constants);
function setup(){const w=new HeadlessSketchWorkspace({}),pm=w.parametricManager,p=new EndPoint(0,0,'p');w.layers[1].add(p);return{w,pm,p,sys:pm.stage.algNumSystem};}
function native(w){const result=JSON.parse(w.io.serializeSketch({boundaryFrame:frame},{strict:true}));result.boundary=structuredClone(boundary);return result;}
function solve(sketch,revision='cause'){return solveSketch({revision,sketch,boundary:structuredClone(boundary),externalParameters:{}});}
test('real PM constant-row cause survives accepted-only rebuild; identity, removal, retry and rollback stay scoped',()=>{
 const {w,pm,p,sys}=setup(),first=make('LockPoint',[p],{x:0,y:0}),bad=make('LockPoint',[p],{x:1,y:0});pm._add(first);pm._add(bad);
 assert.equal(sys.solveStatus.success,true);assert.equal(sys.getAdmissionCause(bad)?.kind,'algebraic-contradiction');assert.equal(sys.getAdmissionCause(first),undefined);assert.equal(sys.getAdmissionCause({...bad}),undefined);const owner=bad.stage;bad.stage={algNumSystem:{}};assert.equal(sys.getAdmissionCause(bad),undefined);bad.stage=owner;
 sys.invalidate();assert.equal(sys.solveStatus.success,true);sys.revalidateConstraint(bad);assert.equal(sys.getAdmissionCause(bad),undefined);sys.invalidate();assert.deepEqual(sys.getAdmissionCause(bad),admissionCause('algebraic-contradiction'));
 const saved=w.io.serializeSketch({boundaryFrame:frame},{strict:true});assert.equal(saved.includes('rejectionCause'),false);assert.equal(saved.includes('exact-reduced-row'),false);
 pm.startTransaction();sys._removeConstraint(first);assert.throws(()=>pm.finishTransaction(()=>{throw Error('rollback control')},false),/rollback control/);assert.equal(w.io.serializeSketch({boundaryFrame:frame},{strict:true}),saved);assert.deepEqual(sys.getAdmissionCause(bad),admissionCause('algebraic-contradiction'));
 sys.removeConstraint(first);assert.equal(sys.getAdmissionCause(bad),undefined);assert.equal(sys.isConflicting(bad),false);assert.equal(p.x,1);sys.removeConstraint(bad);assert.equal(sys.rejectionCauses.has(bad),false);
});
test('real source reduction preserves approximate ancestor instead of alleging exact contradiction',()=>{
 const {w,pm,p,sys}=setup(),q=new EndPoint(0,0,'q');w.layers[1].add(q);
 const row=(id,fn,points)=>new AlgNumConstraint({id,name:id,defineParamsScope:(objects,cb)=>objects.forEach(o=>cb(o.params.x)),collectPolynomials:(out,params)=>out.push(fn(params))},points);
 const alias=row('ApproximateAlias',([x,y])=>new Polynomial(1e-14).monomial(1).term(x,POW_1_FN).monomial(-1).term(y,POW_1_FN),[p,q]);
 const lock=row('YZero',([y])=>new Polynomial().monomial(1).term(y,POW_1_FN),[q]);
 const impossible=row('XOne',([x])=>new Polynomial(-1).monomial(1).term(x,POW_1_FN),[p]);
 pm.startTransaction();for(const c of[alias,lock,impossible])pm._add(c);pm.finishTransaction();assert.equal(sys.isConflicting(impossible),true);if(process.env.CODI_CAUSE_DEBUG)console.log('approx diagnostic', [...sys.rejectionCauses].map(([c,v])=>[c.schema.id,v]),[...sys.substitutedParams].map(([p,v])=>[p.id,v.usedApproximateReduction]));assert.deepEqual(sys.getAdmissionCause(impossible),admissionCause('approximate-reduction-rejection'));
});
test('registered source original residual failure stays distinct despite inherited numeric success; input preserved',()=>{
 const fixture=JSON.parse(fs.readFileSync(process.env.CODI_CAUSE_FIXTURE||'test/admission-causes/midpoint-fixture.json','utf8'));
 workerFixtures.midpoint=fixture;const source=JSON.stringify(fixture.contradictory),result=solve(fixture.contradictory);assert.equal(result.ok,false);assert.equal(result.error.code,'RESIDUAL');assert.deepEqual(result.error.cause,admissionCause('original-residual-failure'));assert.equal(JSON.stringify(fixture.contradictory),source);
 assert.equal(solve(fixture.source).ok,true);assert.equal(solve(solve(fixture.source).sketch).ok,true);
 const w=new HeadlessSketchWorkspace({});w.io._loadSketch(structuredClone(fixture.source),{strict:true});const pm=w.parametricManager,index=w.createIndex(),line=index.line,before=w.io.serializeSketch(undefined,{strict:true}),bad=make('DistancePP',[line.a,line.b],{distance:11});
 pm.startTransaction();pm._add(bad);assert.throws(()=>pm.finishTransaction(()=>{const sys=pm.stage.algNumSystem;workerFixtures.nonlinearDiagnostic={solveStatus:{...sys.solveStatus},originalResiduals:sys.allConstraints.map(c=>{const rows=[];c.collectPolynomials(rows);return{type:c.schema.id,residuals:rows.map(row=>row.value())};})};assert.equal(sys.solveStatus.success,true);assert.ok(workerFixtures.nonlinearDiagnostic.originalResiduals.some(row=>row.residuals.some(value=>Math.abs(value)>1e-6)));assertRetainedStageValid(pm.stage);},false),/residual/);
 assert.equal(w.io.serializeSketch(undefined,{strict:true}),before);assert.equal(pm.stage.algNumSystem.allConstraints.includes(bad),false);assert.equal(pm.stage.algNumSystem.getAdmissionCause(bad),undefined);

});
test('registered native rejected locks and degenerate circle classify distinct public solve causes',()=>{
 const {w,pm,p}=setup(),q=new EndPoint(10,0,'q');w.layers[1].add(q);pm._add(make('LockPoint',[p],{x:0,y:0}));pm._add(make('LockPoint',[q],{x:10,y:0}));pm._add(make('SignedDistanceX',[p,q],{distance:11}));const sketch=native(w);for(const c of sketch.stages[0].constraints)c.admission={version:1,state:'accepted'};workerFixtures.claimedAcceptedContradiction=structuredClone(sketch);const source=JSON.stringify(sketch),rejected=solve(sketch);assert.equal(rejected.ok,false,JSON.stringify(rejected));assert.equal(rejected.error.code,'SOLVE_FAILED',JSON.stringify(rejected));assert.deepEqual(rejected.error.cause,admissionCause('algebraic-contradiction'));assert.equal(JSON.stringify(sketch),source);
 const degenerate=structuredClone(sketch);degenerate.objects=[{id:'c',type:'Circle',stage:0,role:null,data:{c:{x:0,y:0},r:0}}];degenerate.stages[0].constraints=[];workerFixtures.degenerateCircle=structuredClone(degenerate);const invalid=solve(degenerate);assert.equal(invalid.ok,false);assert.equal(invalid.error.code,'INVALID');assert.deepEqual(invalid.error.cause,admissionCause('invalid-domain'));
});
test('headless PM callback captures signed contradiction before automatic rollback and keeps legacy code',()=>{
 const {w,pm,p}=setup(),q=new EndPoint(10,0,'q');w.layers[1].add(q);pm._add(make('LockPoint',[p],{x:0,y:0}));pm._add(make('LockPoint',[q],{x:10,y:0}));const source=JSON.stringify(native(w)),result=addSignedDistanceTransition({revision:'signed-cause',sketchJSON:source,externalParameters:{},intent:{axis:'x',ids:['p','q'],distance:11}});
 workerFixtures.signedRequest={sketchJSON:source,externalParameters:{},intent:{axis:'x',ids:['p','q'],distance:11}};assert.equal(result.ok,false);assert.equal(result.error.code,'DISTANCE_CONFLICT');assert.deepEqual(result.error.cause,admissionCause('algebraic-contradiction'));assert.equal(JSON.stringify(native(w)),source);assert.deepEqual(captureSignedDistanceEnvelope(result,'signed-cause'),result);
});
test('actual PM numerical failure records solver outcome and restores prior geometry',()=>{
 const {w,pm,p,sys}=setup(),before=p.x;
 const wave=new FreeFunction(x=>Math.sin(1e12*x)+2,x=>1e12*Math.cos(1e12*x),'finite-high-frequency-no-root');
 const constraint=new AlgNumConstraint({id:'ConvergenceProbe',name:'Convergence probe',defineParamsScope:([p],cb)=>cb(p.params.x),collectPolynomials:(out,[x])=>out.push(new Polynomial().monomial(1).term(x,wave))},[p]);
 pm._add(constraint);if(process.env.CODI_CAUSE_DEBUG)console.log('numeric diagnostic',sys.getAdmissionCause(constraint),sys.solveStatus,p.x);
 assert.equal(sys.isConflicting(constraint),true);assert.deepEqual(sys.getAdmissionCause(constraint),admissionCause('numerical-convergence-failure'));assert.equal(p.x,before);assert.equal(sys.solveStatus.success,false);sys.solveFine();assert.equal(sys.solveStatus.success,true);assert.deepEqual(sys.getAdmissionCause(constraint),admissionCause('numerical-convergence-failure'));
 sys.removeConstraint(constraint);assert.equal(sys.rejectionCauses.has(constraint),false);
 // This custom-schema actual PM control is not a supported public Worker model.
});
test('a nonfinite reduced constant is numerical evidence, never an exact algebraic contradiction',()=>{
 const {w,pm,p,sys}=setup(),c=new AlgNumConstraint({id:'NonfiniteConstantProbe',name:'Nonfinite constant probe',defineParamsScope:([p],cb)=>cb(p.params.x),collectPolynomials:out=>out.push(new Polynomial(Infinity))},[p]);
 pm._add(c);assert.equal(sys.isConflicting(c),true);assert.deepEqual(sys.getAdmissionCause(c),admissionCause('nonfinite-result'));assert.equal(p.x,0);
});
test('status classifier treats inherited solve-failed pseudo-domain as convergence, not invalid-domain',()=>{
 for(const domainError of ['DIRECTION_SOLVE_FAILED','PROJECTED_SOLVE_FAILED'])assert.deepEqual(causeForSolveStatus({success:false,error:Infinity,domainError}),admissionCause('numerical-convergence-failure'));
 assert.equal(causeForSolveStatus({success:false,error:1}).kind,'numerical-convergence-failure');assert.equal(causeForSolveStatus({success:false,error:Infinity,domainError:'DIRECTION_DOMAIN'}).kind,'invalid-domain');assert.equal(causeForSolveStatus({success:true,error:Infinity}).kind,'nonfinite-result');assert.equal(causeForSolveStatus({success:true,error:1}),undefined);
 // These status-only controls do not claim an actual numerical fixture failed.
});
test('strict failure transports retain only verified bounded cause data without getters or unknown fields',()=>{
 for(const capture of [captureSignedDistanceEnvelope,captureLineRelationEnvelope,captureSignedDistanceVerificationEnvelope]){
  const error={code:'SOLVE_FAILED',message:'Bounded failure',cause:admissionCause('numerical-convergence-failure')},result=capture({revision:'r',ok:false,error},'r');assert.deepEqual(result.error,error);assert.ok(Object.isFrozen(result.error.cause));
  for(const cause of [{kind:'algebraic-contradiction',basis:'solver-status'},{kind:'impossible',basis:'none'},{...error.cause,extra:1}])assert.throws(()=>capture({revision:'r',ok:false,error:{...error,cause}},'r'));
  let reads=0;const poison={...error};Object.defineProperty(poison,'cause',{enumerable:true,get(){reads++;throw Error('getter read')}});assert.throws(()=>capture({revision:'r',ok:false,error:poison},'r'));assert.equal(reads,0);
  assert.throws(()=>capture({revision:'r',ok:false,error:{...error,extra:1}},'r'));
  assert.deepEqual(capture({revision:'r',ok:false,error:{code:'OLD',message:'Old failure'}},'r').error,{code:'OLD',message:'Old failure'});
 }
 const frozen=Object.freeze(Error('original'));assert.equal(withAdmissionCause(frozen,admissionCause('invalid-domain')),frozen);assert.equal(failureCause(frozen),undefined);assert.throws(()=>captureSketchFailure({code:'X',message:'x',cause:undefined}));
});
