// Solver feasibility probe only; not registered or serialized production behavior.
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {Param} from '../../web/app/sketcher/shapes/param.ts';
import {EndPoint} from '../../web/app/sketcher/shapes/point.ts';
import {AlgNumConstraint,ConstraintDefinitions} from '../../web/app/sketcher/constr/ANConstraints.ts';
import {Polynomial,POW_1_FN,SIN_FN,COS_FN} from '../../web/app/sketcher/constr/polynomial.ts';
import {ParametricManager} from '../../web/app/sketcher/parametric.ts';

const equation=(v,t,angle,lx,ly,isY)=>new Polynomial(0)
 .monomial(1).term(v,POW_1_FN).monomial(-1).term(t,POW_1_FN)
 .monomial(-lx).term(angle,isY ? SIN_FN : COS_FN)
 .monomial(isY ? -ly : ly).term(angle,isY ? COS_FN : SIN_FN);

test('actual solver admits an explicit three-parameter rigid transform and external anchors',()=>{
 const viewer={refresh(){},screenToModel2(x,y,p){p.x=x;p.y=y},annotationLayer:{add(){},remove(){}}};
 const stage=new ParametricManager(viewer).stage;
 const group={id:'group',stage,constraints:new Set(),tx:new Param(0),ty:new Param(0),angle:new Param(0),visitParams(cb){cb(this.tx);cb(this.ty);cb(this.angle)}};
 const points=[[0,0],[100,0],[100,50],[0,50]].map(([x,y],i)=>new EndPoint(x,y,`p${i}`));
 stage.assignObject(group);points.forEach(p=>stage.assignObject(p));
 const local=[[0,0],[100,0],[100,50],[0,50]];
 const schema={id:'RigidProbe',defineParamsScope:([g,...pts],cb)=>{g.visitParams(cb);pts.forEach(p=>p.visitParams(cb));},collectPolynomials:(out,params)=>{
  const [tx,ty,angle,...xy]=params;
  local.forEach(([x,y],i)=>out.push(equation(xy[2*i],tx,angle,x,y,false),equation(xy[2*i+1],ty,angle,x,y,true)));
 }};
 const rigid=new AlgNumConstraint(schema,[group,...points]);stage.addConstraint(rigid);
 assert.equal(stage.algNumSystem.conflicting.has(rigid),false);
 // Explicit target anchors constrain the transform through the ordinary solver.
 for(const [p,x,y] of [[points[0],20,30],[points[1],20,130]]){
  const c=new AlgNumConstraint(ConstraintDefinitions.LockPoint,[p],{x:String(x),y:String(y)});stage.addConstraint(c);
  assert.equal(stage.algNumSystem.conflicting.has(c),false);
 }
 stage.algNumSystem.solveFine();
 assert.equal(stage.algNumSystem.solveStatus.success,true);
 const expected=[[20,30],[20,130],[-30,130],[-30,30]];
 points.forEach((p,i)=>{assert.ok(Math.abs(p.x-expected[i][0])<1e-5);assert.ok(Math.abs(p.y-expected[i][1])<1e-5);});
});

test('explicit group owner preserves authored local frame and current solver transform on native-shaped record',async()=>{
 const {RigidGroup}=await import('../../web/app/sketcher/rigid/rigidGroup.ts');
 const {planRigidSegments}=await import('../../web/app/sketcher/rigid/rigidGroupPlan.mjs');
 const plan=planRigidSegments('g',[
  {id:'s1',a:{id:'s1:A',x:0,y:0},b:{id:'s1:B',x:10,y:0}},
  {id:'s2',a:{id:'s2:A',x:10,y:0},b:{id:'s2:B',x:10,y:10}}
 ]);
 const g=new RigidGroup('g',{version:plan.version,members:plan.members,points:plan.points,transform:plan.transform});
 g.tx.set(23);g.ty.set(-4);g.angle.set(0.8);
 const restored=RigidGroup.read('g',JSON.parse(JSON.stringify(g.write())));
 assert.deepEqual(restored.write(),g.write());
 assert.equal(restored.id,'g');
});

test('explicit group and real segment endpoints follow a single transform with polar equations',async()=>{
 const {RigidGroup}=await import('../../web/app/sketcher/rigid/rigidGroup.ts');
 const {RigidGroupSchema}=await import('../../web/app/sketcher/rigid/rigidGroupSchema.ts');
 const {rigidGroupValid,assertRigidStageValid}=await import('../../web/app/sketcher/rigid/rigidGroupDomain.mjs');
 const {planRigidSegments}=await import('../../web/app/sketcher/rigid/rigidGroupPlan.mjs');
 const {Segment}=await import('../../web/app/sketcher/shapes/segment.ts');
 const viewer={refresh(){},screenToModel2(x,y,p){p.x=x;p.y=y},annotationLayer:{add(){},remove(){}}};
 const stage=new ParametricManager(viewer).stage;
 const segments=[new Segment(0,0,100,0,'s1'),new Segment(100,0,100,50,'s2'),new Segment(100,50,0,50,'s3'),new Segment(0,50,0,0,'s4')];
 const plan=planRigidSegments('g',segments),group=new RigidGroup('g',{version:plan.version,members:plan.members,points:plan.points,transform:plan.transform});
 stage.assignObject(group);
 for(const s of segments){stage.assignObject(s);stage.addConstraint(new AlgNumConstraint(ConstraintDefinitions.Polar,[s,s.a,s.b],undefined,true));}
 // Keep the deliberately unguarded schema ID to preserve the original
 // counterexample even after the production candidate adds domain guards.
 const rigid=new AlgNumConstraint({...RigidGroupSchema,id:'RigidUnprotectedProbe'},[group,...segments]);stage.addConstraint(rigid);assert.equal(stage.algNumSystem.conflicting.has(rigid),false);
 // Merely setting interactive values is a preference, not a pose command.
 stage.algNumSystem.prepare([group]);group.tx.set(8);stage.algNumSystem.solveFine();
 assert.equal(stage.algNumSystem.solveStatus.success,true);
 assert.ok(Math.abs(group.tx.get()-8)>1e-3,'interactive preference unexpectedly became an exact pose contract');
 for(const pose of [{x:8,y:0,a:0},{x:8,y:12,a:0},{x:8,y:12,a:Math.PI/3},{x:0,y:0,a:0}]){
  const schema={id:'TemporaryPoseProbe',defineParamsScope:([g],cb)=>g.visitParams(cb),collectPolynomials:(out,params)=>{
   [pose.x,pose.y,pose.a].forEach((value,i)=>out.push(new Polynomial(-value).monomial(1).term(params[i],POW_1_FN)));
  }};
  const command=new AlgNumConstraint(schema,[group],undefined,true);stage.addConstraint(command);
  assert.equal(stage.algNumSystem.conflicting.has(command),false);
  stage.algNumSystem.prepare();stage.algNumSystem.solveFine();
  assert.equal(stage.algNumSystem.solveStatus.success,true);
  assert.ok(Math.abs(group.tx.get()-pose.x)<1e-6&&Math.abs(group.ty.get()-pose.y)<1e-6&&Math.abs(group.angle.get()-pose.a)<1e-8,`requested ${JSON.stringify(pose)}, got ${JSON.stringify([group.tx.get(),group.ty.get(),group.angle.get()])}`);
  const x=pose.x+100*Math.cos(pose.a),y=pose.y+100*Math.sin(pose.a);
  assert.ok(Math.abs(segments[0].b.x-x)<1e-5&&Math.abs(segments[0].b.y-y)<1e-5);
  const {mapRigidPoints}=await import('../../web/app/sketcher/rigid/rigidGroupPlan.mjs');
  const expected=mapRigidPoints(plan,{x:pose.x,y:pose.y,angle:pose.a});
  segments.flatMap(s=>[s.a,s.b]).forEach((p,i)=>assert.ok(Math.hypot(p.x-expected[i].x,p.y-expected[i].y)<1e-5,`rigid point ${i} moved away from commanded pose`));
  stage.algNumSystem.removeConstraint(command);
 }
 const horizontal=new AlgNumConstraint(ConstraintDefinitions.Horizontal,[segments[0]],{angle:'0'});stage.addConstraint(horizontal);
 assert.equal(stage.algNumSystem.conflicting.has(horizontal),false);
 const snapshot=()=>JSON.stringify({group:group.write(),segments:segments.map(s=>s.write()),polar:segments.map(s=>[s.params.t.get(),s.params.ang.get()])});
 const prior=snapshot();
 const angleSchema={id:'TemporaryAngleProbe',defineParamsScope:([g],cb)=>cb(g.angle),collectPolynomials:(out,[a])=>out.push(new Polynomial(-Math.PI/3).monomial(1).term(a,POW_1_FN))};
 const impossible=new AlgNumConstraint(angleSchema,[group],undefined,true);stage.addConstraint(impossible);
 // This formerly admitted counterexample now rejects. Establish the contract
 // independently rather than treating a changed conflict bit as proof.
 assert.ok(100*Math.sin(Math.PI/3)>80,'the requested rigid edge has nonzero Y displacement, while Horizontal requires zero');
 assert.equal(stage.algNumSystem.conflicting.has(impossible),true);
 assert.equal(stage.algNumSystem.redundant.has(impossible),false);
 assert.equal(snapshot(),prior,'rejected raw admission preserves transform, every endpoint and polar parameter exactly');
 assert.equal(rigidGroupValid(group,segments),true);
 assert.throws(()=>assertRigidStageValid(stage,group,segments),/retained constraint is rejected/);
 stage.algNumSystem.solveFine();
 const residuals=stage.algNumSystem.allConstraints.map(c=>{const equations=[];c.collectPolynomials(equations);return {type:c.schema.id,max:Math.max(0,...equations.map(e=>Math.abs(e.value()))),rejected:stage.algNumSystem.conflicting.has(c)};});
 console.log('rejected rigid-angle fresh authored polynomial residuals',JSON.stringify(residuals));
 assert.ok(residuals.filter(r=>r.type!=='TemporaryAngleProbe').every(r=>Number.isFinite(r.max)&&r.max<1e-6),'all retained geometric equations remain satisfied');
 assert.ok(Math.abs(residuals.find(r=>r.type==='TemporaryAngleProbe').max-Math.PI/3)<1e-8,'the rejected angle equation remains unsatisfied in the preserved valid geometry');
 assert.equal(stage.algNumSystem.dof,null,'this private probe does not establish Jacobian rank/DOF');
 assert.equal(stage.algNumSystem.fullyConstrained,null,'unknown diagnostic must not become a fully constrained claim');
 assert.equal(snapshot(),prior,'re-solving the accepted set preserves the original valid geometry');
 stage.algNumSystem.removeConstraint(impossible);stage.algNumSystem.removeConstraint(horizontal);
 // The identical angle equation is feasible after removing Horizontal. Prove
 // its actual geometry with direct sine/cosine, without the mapping helper.
 const permitted=new AlgNumConstraint(angleSchema,[group],undefined,true);stage.addConstraint(permitted);
 assert.equal(stage.algNumSystem.conflicting.has(permitted),false);
 stage.algNumSystem.solveFine();assert.equal(stage.algNumSystem.solveStatus.success,true);
 assert.ok(Math.abs(group.angle.get()-Math.PI/3)<1e-8);
 segments.flatMap(segment=>[segment.a,segment.b]).forEach((point,i)=>{
  const local=plan.points[i],x=group.tx.get()+local.x*Math.cos(group.angle.get())-local.y*Math.sin(group.angle.get()),y=group.ty.get()+local.x*Math.sin(group.angle.get())+local.y*Math.cos(group.angle.get());
  assert.ok(Math.hypot(point.x-x,point.y-y)<1e-6,'feasible control satisfies the independent rigid transform');
 });
 assertRigidStageValid(stage,group,segments);
 stage.algNumSystem.removeConstraint(permitted);
 const resetSchema={id:'TemporaryResetPoseProbe',defineParamsScope:([g],cb)=>g.visitParams(cb),collectPolynomials:(out,params)=>params.forEach(p=>out.push(new Polynomial(0).monomial(1).term(p,POW_1_FN)))};
 const reset=new AlgNumConstraint(resetSchema,[group],undefined,true);stage.addConstraint(reset);
 assert.equal(stage.algNumSystem.conflicting.has(reset),false);stage.algNumSystem.solveFine();assertRigidStageValid(stage,group,segments);stage.algNumSystem.removeConstraint(reset);
 const {runSketchTransaction}=await import('../../web/app/sketcher/actions/sketchTransaction.js');
 const pm=stage.parametricManager;viewer.parametricManager=pm;
 const horizontalAgain=new AlgNumConstraint(ConstraintDefinitions.Horizontal,[segments[0]],{angle:'0'});stage.addConstraint(horizontalAgain);
 viewer.io={serializeSketch:()=>JSON.stringify({group:group.write(),segments:segments.map(s=>s.write()),polar:segments.map(s=>[s.params.t.get(),s.params.ang.get()]),constraints:stage.algNumSystem.allConstraints.map(c=>c.schema.id)})};
 viewer.historyManager={diffs:[],historyPointer:-1,lastCheckpoint:'',_counter:0,_checkpoint(){this.lastCheckpoint=viewer.io.serializeSketch();}};
 const before=viewer.io.serializeSketch(),commandAgain=new AlgNumConstraint(angleSchema,[group],undefined,true);
 assert.throws(()=>runSketchTransaction(viewer,{mutate:()=>stage.addConstraint(commandAgain),validate:()=>{
  assertRigidStageValid(stage,group,segments);
 }}),/Invalid rigid geometry|constraint/);
 assert.equal(viewer.io.serializeSketch(),before,'failed pose restores the exact group, members and constraints');
 stage.algNumSystem.removeConstraint(horizontalAgain);
 for(const [p,x,y] of [[segments[0].a,20,30],[segments[0].b,20,130]]){
  const c=new AlgNumConstraint(ConstraintDefinitions.LockPoint,[p],{x:String(x),y:String(y)});stage.addConstraint(c);assert.equal(stage.algNumSystem.conflicting.has(c),false);
 }
 stage.algNumSystem.solveFine();assert.equal(stage.algNumSystem.solveStatus.success,true);
 for(const [s,xy] of segments.map((s,i)=>[s,[[20,30,20,130],[20,130,-30,130],[-30,130,-30,30],[-30,30,20,30]][i]])){
  [s.a.x,s.a.y,s.b.x,s.b.y].forEach((n,j)=>assert.ok(Math.abs(n-xy[j])<1e-5));
 }
});

test('nongroup horizontal and angle contradiction remains distinguishable',async()=>{
 const {Segment}=await import('../../web/app/sketcher/shapes/segment.ts');
 const viewer={refresh(){},screenToModel2(x,y,p){p.x=x;p.y=y},annotationLayer:{add(){},remove(){}}};
 const stage=new ParametricManager(viewer).stage,segment=new Segment(0,0,100,0,'s');stage.assignObject(segment);
 stage.addConstraint(new AlgNumConstraint(ConstraintDefinitions.Polar,[segment,segment.a,segment.b],undefined,true));
 const horizontal=new AlgNumConstraint(ConstraintDefinitions.Horizontal,[segment],{angle:'0'});stage.addConstraint(horizontal);
 const angle=new AlgNumConstraint(ConstraintDefinitions.Angle,[segment],{angle:'60'},true);stage.addConstraint(angle);
 const equations=[];for(const c of stage.algNumSystem.allConstraints){const polys=[];c.collectPolynomials(polys);equations.push({id:c.schema.id,max:Math.max(0,...polys.map(p=>Math.abs(p.value()))),rejected:stage.algNumSystem.conflicting.has(c)});}
 console.log('nongroup contradiction',JSON.stringify(equations));
 assert.equal(stage.algNumSystem.conflicting.has(angle),true);
});

test('strict native preflight and headless solve preserve group intent and reject invalid ownership',async()=>{
 const {Segment}=await import('../../web/app/sketcher/shapes/segment.ts');
 const {planRigidSegments}=await import('../../web/app/sketcher/rigid/rigidGroupPlan.mjs');
 const {validateProjectSketch}=await import('../../web/app/sketcher/io.ts');
 const {solveSketch}=await import('../../web/app/sketcher/headless/solve.ts');
 const segments=[new Segment(0,0,100,0,'s1'),new Segment(100,0,100,50,'s2'),new Segment(100,50,0,50,'s3'),new Segment(0,50,0,0,'s4')];
 const plan=planRigidSegments('g',segments),boundary={lines:[],arcs:[],circles:[],nurbses:[]};
 const group={version:1,members:plan.members,points:plan.points,transform:plan.transform};
 const sketch={version:3,objects:[...segments.map(s=>({id:s.id,type:'Segment',stage:0,data:s.write()})),{id:'g',type:'RigidGroup',stage:0,data:group}],dimensions:[],labels:[],constants:'',stages:[{constraints:[{typeId:'RigidGroup',objects:['g',...segments.map(s=>s.id)],stage:0,annotations:[],admission:{version:1,state:'accepted'}}],generators:[]}],boundary};
 assert.doesNotThrow(()=>validateProjectSketch(sketch));
 const solved=solveSketch({revision:'r1',sketch,boundary:structuredClone(boundary),externalParameters:{}});
 assert.equal(solved.ok,true,JSON.stringify(solved.error));
 assert.deepEqual(solved.sketch.objects.find(o=>o.id==='g').data.members,group.members);
 const orphan=structuredClone(sketch);orphan.stages[0].constraints=[];assert.throws(()=>validateProjectSketch(orphan),/Orphan/);
 const overlap=structuredClone(sketch);overlap.stages[0].constraints.push(structuredClone(overlap.stages[0].constraints[0]));assert.throws(()=>validateProjectSketch(overlap),/ownership/);
 const broken=structuredClone(sketch);broken.objects[0].data.a.x=99;assert.throws(()=>validateProjectSketch(broken),/rigid group/i);
});

test('creation uses one guarded transaction and persists its native indexed owner',async()=>{
 const {Segment}=await import('../../web/app/sketcher/shapes/segment.ts');
 const {HeadlessSketchWorkspace}=await import('../../web/app/sketcher/headless/workspace.ts');
 const {createRigidGroup,inspectRigidGroups,createRigidGroupByIds,poseRigidGroup,editRigidGroupById}=await import('../../web/app/sketcher/rigid/rigidGroupOperation.js');
 const {validateProjectSketch}=await import('../../web/app/sketcher/io.ts');
 const viewer=new HeadlessSketchWorkspace({}),layer=viewer.findLayerByName('sketch');
 viewer.traverse=fn=>viewer.layers.forEach(l=>l.traverseSketchObjects(fn));
 viewer.historyManager={diffs:[],historyPointer:-1,lastCheckpoint:'',_counter:0,_checkpoint(){this.lastCheckpoint=viewer.io.serializeSketch(undefined,{strict:true});}};
 const segments=[new Segment(0,0,100,0,'a'),new Segment(100,0,100,50,'b'),new Segment(100,50,0,50,'c'),new Segment(0,50,0,0,'d')];
 for(const segment of segments){layer.add(segment);segment.stabilize(viewer);}
 const before=viewer.io.serializeSketch(undefined,{strict:true});
 assert.throws(()=>createRigidGroup(viewer,[segments[0],segments[0]]));assert.equal(viewer.io.serializeSketch(undefined,{strict:true}),before);
 const inspection=inspectRigidGroups(viewer),result=await createRigidGroupByIds(viewer,segments.map(s=>s.id),inspection.revision);
 assert.equal(result.status,'accepted');const saved=JSON.parse(viewer.io.serializeSketch(undefined,{strict:true}));
 assert.doesNotThrow(()=>validateProjectSketch(saved));assert.ok(saved.objects.some(o=>o.id===result.id&&o.type==='RigidGroup'));
 const after=viewer.io.serializeSketch(undefined,{strict:true});assert.throws(()=>createRigidGroup(viewer,segments),/already belongs/);assert.equal(viewer.io.serializeSketch(undefined,{strict:true}),after);
 const group=viewer.createIndex()[result.id];
 const beforeDelete=viewer.io.serializeSketch(undefined,{strict:true});
 assert.throws(()=>viewer.parametricManager.removeObjects([segments[0]]),/dissolve/i);
 assert.equal(viewer.io.serializeSketch(undefined,{strict:true}),beforeDelete,'member delete must not leave an orphan owner');
 const relation=viewer.parametricManager.stage.algNumSystem.allConstraints.find(c=>c.schema.id==='RigidGroup');
 assert.throws(()=>viewer.parametricManager.remove(relation),/dissolve/i);
 assert.throws(()=>viewer.parametricManager.removeObjects([group]),/dissolve/i);
 assert.equal(viewer.parametricManager.inTransaction,false);assert.equal(viewer.io.serializeSketch(undefined,{strict:true}),beforeDelete);
 const dragBefore=segments[0].b.x;viewer.parametricManager.stage.algNumSystem.prepare([segments[0].b]);
 segments[0].b.x-=2;viewer.parametricManager.stage.algNumSystem.solveRough();
 assert.equal(viewer.parametricManager.stage.algNumSystem.solveStatus.success,true,'ordinary member drag must solve');
 assert.notEqual(segments[0].b.x,dragBefore,'ordinary member drag must actually move');
 for(const pose of [{x:8,y:0,angle:0},{x:8,y:12,angle:0},{x:8,y:12,angle:Math.PI/3},{x:0,y:0,angle:0}]){
  assert.equal(poseRigidGroup(viewer,group,pose).status,'accepted');
  assert.ok(Math.abs(group.tx.get()-pose.x)<1e-6&&Math.abs(group.ty.get()-pose.y)<1e-6&&Math.abs(group.angle.get()-pose.angle)<1e-8);
 }
 const horizontal=new AlgNumConstraint(ConstraintDefinitions.Horizontal,[segments[0]],{angle:'0'});viewer.parametricManager.stage.addConstraint(horizontal);
 const locked=viewer.io.serializeSketch(undefined,{strict:true});
 assert.throws(()=>poseRigidGroup(viewer,group,{x:0,y:0,angle:Math.PI/3}),/constraint|geometry|pose/i);
 assert.equal(viewer.io.serializeSketch(undefined,{strict:true}),locked,'failed incompatible pose must restore exact native sketch');
 const stale=inspectRigidGroups(viewer);segments[0].params.t.set(segments[0].params.t.get()+1);segments[0].params.t.set(segments[0].params.t.get()-1);
 await assert.rejects(editRigidGroupById(viewer,group.id,stale.revision,'pose',{x:0,y:0,angle:0}),/changed/);
 const beforeFailure=viewer.io.serializeSketch(undefined,{strict:true}),collect=horizontal.collectPolynomials;
 horizontal.collectPolynomials=(...args)=>{if(!layer.objects.includes(group))throw Error('injected retained constraint failure');return collect.apply(horizontal,args);};
 try{const failed=inspectRigidGroups(viewer);await assert.rejects(editRigidGroupById(viewer,group.id,failed.revision,'dissolve',undefined),/injected/);}
 finally{horizontal.collectPolynomials=collect;}
 assert.equal(viewer.io.serializeSketch(undefined,{strict:true}),beforeFailure,'failed dissolve restores owner and constraints');
 const beforeDissolve=segments.map(s=>JSON.stringify(s.write())),next=inspectRigidGroups(viewer);
 assert.equal((await editRigidGroupById(viewer,group.id,next.revision,'dissolve',undefined)).status,'dissolved');
 assert.deepEqual(segments.map(s=>JSON.stringify(s.write())),beforeDissolve);
 assert.ok(viewer.parametricManager.stage.algNumSystem.allConstraints.includes(horizontal));
 assert.ok(!viewer.createIndex()[group.id]);assert.doesNotThrow(()=>validateProjectSketch(JSON.parse(viewer.io.serializeSketch(undefined,{strict:true}))));
});

test('an externally constrained accepted pose is the rollback baseline for a failed drag',async()=>{
 const {Segment}=await import('../../web/app/sketcher/shapes/segment.ts');
 const {HeadlessSketchWorkspace}=await import('../../web/app/sketcher/headless/workspace.ts');
 const {createRigidGroup}=await import('../../web/app/sketcher/rigid/rigidGroupOperation.js');
 const viewer=new HeadlessSketchWorkspace({}),layer=viewer.findLayerByName('sketch');viewer.traverse=fn=>viewer.layers.forEach(l=>l.traverseSketchObjects(fn));
 viewer.historyManager={diffs:[],historyPointer:-1,lastCheckpoint:'',_counter:0,_checkpoint(){this.lastCheckpoint=viewer.io.serializeSketch(undefined,{strict:true});}};
 const segments=[new Segment(0,0,100,0,'a'),new Segment(100,0,100,50,'b'),new Segment(100,50,0,50,'c'),new Segment(0,50,0,0,'d')];
 for(const segment of segments){layer.add(segment);segment.stabilize(viewer);}createRigidGroup(viewer,segments);
 const stage=viewer.parametricManager.stage,lock=new AlgNumConstraint(ConstraintDefinitions.LockPoint,[segments[0].a],{x:'10',y:'0'});stage.addConstraint(lock);
 assert.equal(stage.algNumSystem.conflicting.has(lock),false,`valid external anchor was rejected: ${JSON.stringify(stage.algNumSystem.solveStatus)}`);assert.ok(Math.abs(segments[0].a.x-10)<1e-6);
 const retained=stage.algNumSystem.projectedLastValid.get(segments[0].a.params.x);
 assert.ok(Math.abs(retained-10)<1e-6,`rollback snapshot must follow accepted anchor; retained ${retained}`);
 const before=segments.map(s=>s.write()),group=stage.algNumSystem.allConstraints.find(c=>c.schema.id==='RigidGroup').objects[0];
 group.angle.set(NaN);stage.algNumSystem.solveFine();
 assert.equal(stage.algNumSystem.solveStatus.success,false);assert.deepEqual(segments.map(s=>s.write()),before);
 const rebuild=stage.algNumSystem.rebuildAdmission;
 stage.algNumSystem.rebuildAdmission=()=>{segments[0].a.x=999;throw Error('injected readmission failure');};
 try{assert.throws(()=>stage.algNumSystem.removeConstraint(lock),/injected/);}finally{stage.algNumSystem.rebuildAdmission=rebuild;}
 assert.ok(stage.algNumSystem.allConstraints.includes(lock));assert.deepEqual(segments.map(s=>s.write()),before);
 stage.algNumSystem.removeConstraint(lock);
 assert.ok(!stage.algNumSystem.allConstraints.includes(lock));
 assert.equal(stage.algNumSystem.projectedLastValid.get(segments[0].a.params.x),segments[0].a.x);
});
