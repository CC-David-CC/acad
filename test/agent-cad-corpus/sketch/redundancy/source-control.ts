import fs from 'node:fs';
import assert from 'node:assert/strict';
import {HeadlessSketchWorkspace} from '../../../../web/app/sketcher/headless/workspace';
import {solveSketch} from '../../../../web/app/sketcher/headless/solve';
import {ConstraintDefinitions,AlgNumConstraint} from '../../../../web/app/sketcher/constr/ANConstraints';
import {assertCurrentDiagnosticGeometry} from '../../../../web/app/sketcher/headless/diagnosticGeometry.mjs';
import {prepareTypedDependentSketch} from '../../../../web/app/sketcher/headless/typedDependentSketch.mjs';
import {decodePhysicalSource} from '../../../../web/app/cad/parameters/physicalSource.mjs';
import {evaluatePhysicalSource} from '../../../../web/app/cad/parameters/evaluatePhysicalSource.mjs';
import {RigidGroup} from '../../../../web/app/sketcher/rigid/rigidGroup';
import {planRigidSegments} from '../../../../web/app/sketcher/rigid/rigidGroupPlan.mjs';
import {genericControls} from './generic-controls';
const empty={lines:[],arcs:[],circles:[],nurbses:[]},frame={origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]};
const point=(id,x,y)=>({id,type:'Point',role:null,stage:0,data:{x,y}}),line=(id,ax,ay,bx,by)=>({id,type:'Segment',role:null,stage:0,data:{a:{x:ax,y:ay},b:{x:bx,y:by}}}),circle=(id,x,y,r)=>({id,type:'Circle',role:null,stage:0,data:{c:{x,y},r}}),arc=()=>({id:'r',type:'Arc',role:null,stage:0,data:{a:{x:5,y:0},b:{x:0,y:5},c:{x:0,y:0}}});
const base=objects=>({version:3,objects,dimensions:[],labels:[],stages:[{constraints:[],generators:[]}],constants:'',metadata:{boundaryFrame:frame},boundary:empty});
const inputPath=process.env.CODI_REDUCTION_INPUTS||'/tmp/codi-reduction-legacy-inputs.json';
if(process.env.CODI_REDUCTION_GENERATE==='1'){
 const rows=JSON.parse(fs.readFileSync('test/review-save-compat/registered-save-browser-fixtures-349.json','utf8')).cases.map(row=>({name:'carried-save/'+row.name,request:row.request}));
 const receipt=JSON.parse(fs.readFileSync('test/agent-cad-corpus/sketch/receipts/r2/receipt.json','utf8'));
 for(const row of receipt.rows){const request=JSON.parse(row.before);if(request.sketch||request.sketchJSON)rows.push({name:'p0/'+row.id,request});}
 for(const key of ['original','acceptedSource']){const sketch=JSON.parse(receipt.registered[key]);rows.push({name:'registered-rectangle/'+key,request:{revision:key,sketch,boundary:sketch.boundary,externalParameters:{}}});}
 const add=(name,objects,typeId,refs,constants)=>{
  const ws=new HeadlessSketchWorkspace({});ws.io._loadSketch(base(objects),{strict:true});const index=ws.createIndex();let targets=refs.map(id=>index[id]);
  if(typeId==='RigidGroup'){const plan=planRigidSegments('g',targets),g=new RigidGroup('g',{version:plan.version,members:plan.members,points:plan.points,transform:plan.transform});ws.layers[1].add(g);targets=[g,...targets];}
  const c=new AlgNumConstraint(ConstraintDefinitions[typeId],targets,constants);c.stage=ws.parametricManager.stage;c.admissionHint={version:1,state:'accepted'};
  const sketch=JSON.parse(ws.io.serializeSketch({boundaryFrame:frame},{strict:true}));sketch.boundary=structuredClone(empty);sketch.stages[0].constraints=[c.write()];
  rows.push({name:'schema/'+name,request:{revision:name,sketch,boundary:sketch.boundary,externalParameters:{}}});
 };
 add('PCoincident',[point('a',0,0),point('b',0,0)],'PCoincident',['a','b']);
 add('Vertical',[line('s',0,0,0,10)],'Vertical',['s'],{angle:'90'});
 add('EqualLength',[line('a',0,0,10,0),line('b',0,2,10,2)],'EqualLength',['a','b']);
 add('LengthRelation',[line('a',0,0,10,0),line('b',0,2,20,2)],'LengthRelation',['a','b'],{factor:'2',offset:'0'});
 add('DistancePL',[point('p',0,5),line('s',-10,0,10,0)],'DistancePL',['p','s'],{distance:'5',inverted:'false'});
 add('PointOnLine',[point('p',3,0),line('s',0,0,10,0)],'PointOnLine',['p','s']);
 add('Collinear',[line('a',0,0,10,0),line('b',20,0,30,0)],'Collinear',['a','b']);
 add('AxisSymmetry',[point('p',2,3),point('q',2,-3),line('s',0,0,10,0)],'AxisSymmetry',['p','q','s']);
 add('FixSegment',[line('s',0,0,10,0)],'FixSegment',['s'],{ax:'0',ay:'0',bx:'10',by:'0',length:'10',direction:'0'});
 add('FixCircle',[circle('c',2,3,5)],'FixCircle',['c'],{cx:'2',cy:'3',radius:'5'});
 add('FixArc',[arc()],'FixArc',['r'],{ax:'5',ay:'0',bx:'0',by:'5',cx:'0',cy:'0',radius:'5',sweep:String(Math.PI/2)});
 add('RigidGroup',[line('a',0,0,10,0),line('b',10,0,10,10)],'RigidGroup',['a','b']);
 for(const [name,cross]of [['two-independent-stages',false],['later-refers-earlier',true]]){
  const s=base([point('a',0,0),{...point('b',2,3),stage:1}]);s.stages=[{constraints:[{typeId:'LockPoint',objects:['a'],constants:{x:'0',y:'0'},stage:0,annotations:[],admission:{version:1,state:'accepted'}}],generators:[]},{constraints:cross?[{typeId:'PCoincident',objects:['b','a'],stage:1,annotations:[],admission:{version:1,state:'accepted'}}]:[],generators:[]}];rows.push({name:'stages/'+name,request:{revision:name,sketch:s,boundary:empty,externalParameters:{}}});
 }
 fs.writeFileSync(inputPath,JSON.stringify({source:'35bf9d098 baseline fixture generation; frozen before prototype edits',rows},null,2)+'\n');
}
const inputs=JSON.parse(fs.readFileSync(inputPath,'utf8')),rows=[];
for(const entry of inputs.rows){
 const req=entry.request,sketch=structuredClone(req.sketch||JSON.parse(req.sketchJSON)),inputBefore=JSON.stringify(sketch);let external=req.externalParameters||{},error=null;
 try{if(req.parameterSource!=null){const values=evaluatePhysicalSource(decodePhysicalSource(req.parameterSource)).values;external=prepareTypedDependentSketch(sketch,name=>{const row=values.find(v=>v.name===name);if(!row||row.dimension!=='length')throw Error('Expected typed length');return row.value;});}}catch(e){error=e.message;}
 let result:any=error?{ok:false,error:{code:'PARAMETER_PREP',message:error}}:solveSketch({revision:req.revision,sketch,boundary:structuredClone(req.boundary||sketch.boundary),externalParameters:external});
 const loaded:any={};
 if(!error)try{const ws=new HeadlessSketchWorkspace(external);ws.io._loadSketch(structuredClone(sketch),{strict:true});for(const stage of ws.parametricManager.stages){stage.solverSystem.prepare();stage.solve(false);}loaded.sketch=JSON.parse(ws.io.serializeSketch(sketch.metadata,{strict:true}));loaded.hints=loaded.sketch.stages.map(s=>s.constraints.map(c=>({typeId:c.typeId,admission:c.admission})));loaded.systems=ws.parametricManager.stages.map(stage=>({success:stage.solverSystem.solveStatus.success,rows:stage.solverSystem.allConstraints.map(c=>({typeId:c.schema.id,internal:c.internal||false,redundant:stage.solverSystem.redundant.has(c),rejected:stage.solverSystem.conflicting.has(c)&&!stage.solverSystem.redundant.has(c)}))}));}catch(e){loaded.error=e.message;}
 let currentGeometry='not-required';if(result.ok&&(req.task==='sketch-save-validation'||req.verifyCurrent===true))try{assertCurrentDiagnosticGeometry(sketch,result.sketch);currentGeometry='unchanged';}catch(e){currentGeometry=e.code||e.message;}
 rows.push({name:entry.name,sourceSchemas:sketch.stages.flatMap(s=>s.constraints.map(c=>c.typeId)),stageCount:sketch.stages.length,inputAdmissions:sketch.stages.map(s=>s.constraints.map(c=>c.admission)),inputUnchanged:inputBefore===JSON.stringify(sketch),ok:result.ok,error:result.error||null,evidence:result.evidence||null,currentGeometry,loaded});
}
const legacyPair=inputs.rows.find(row=>row.name==='p0/sketch.p0.known-implied-redundancy-label').request;
const freshBase=structuredClone(legacyPair.sketch);freshBase.stages[0].constraints=[];
const freshWorkspace=new HeadlessSketchWorkspace({});freshWorkspace.io._loadSketch(freshBase,{strict:true});
const segment=freshWorkspace.createIndex().s,stage=freshWorkspace.parametricManager.stage;
stage.addConstraint(new AlgNumConstraint(ConstraintDefinitions.Horizontal,[segment],{angle:'0'}));
stage.addConstraint(new AlgNumConstraint(ConstraintDefinitions.SignedDistanceY,[segment.a,segment.b],{distance:'0'}));
const freshSketch=JSON.parse(freshWorkspace.io.serializeSketch(freshBase.metadata,{strict:true}));freshSketch.boundary=structuredClone(freshBase.boundary);
const freshResult=solveSketch({revision:'fresh',sketch:structuredClone(freshSketch),boundary:structuredClone(freshSketch.boundary),externalParameters:{}});
assert.equal(freshResult.ok,true,JSON.stringify(freshResult));
const freshReload=solveSketch({revision:'fresh-reload',sketch:JSON.parse(JSON.stringify(freshResult.sketch)),boundary:structuredClone(freshSketch.boundary),externalParameters:{}});
assert.equal(freshReload.ok,true,JSON.stringify(freshReload));assert.deepEqual(freshReload.sketch.stages,freshSketch.stages);
const freshRoundtrip={admissions:freshSketch.stages[0].constraints.map(c=>({typeId:c.typeId,admission:c.admission})),serializedSketch:JSON.stringify(freshSketch),workerRequest:{revision:'fresh-authored-priority',sketch:freshSketch,boundary:structuredClone(freshSketch.boundary),externalParameters:{}},strictSolve:true,strictReload:true};
const benchmark=[];
if(process.env.CODI_REDUCTION_BENCH==='1')for(const count of [16,128,512]){
 const samples=[];for(let repeat=0;repeat<3;repeat++){
  const objects=Array.from({length:count},(_,i)=>point('p'+i,i%32,Math.floor(i/32))),s=base(objects);
  s.stages[0].constraints=objects.map(o=>({typeId:'LockPoint',objects:[o.id],constants:{x:String(o.data.x),y:String(o.data.y)},stage:0,annotations:[],admission:{version:1,state:'accepted'}}));
  const start=performance.now(),ws=new HeadlessSketchWorkspace({});ws.io._loadSketch(s,{strict:true});for(const stage of ws.parametricManager.stages){stage.solverSystem.prepare();stage.solve(false);if(!stage.solverSystem.solveStatus.success)throw Error('Lock benchmark failed');}samples.push(performance.now()-start);
 }benchmark.push({count,samplesMs:samples});
}
const report={version:1,scope:'Source-controlled real HeadlessSketchWorkspace/solver; Node compatibility globals only, not browser/Worker/UI qualification',source:process.env.CODI_REDUCTION_SOURCE||null,registeredSchemas:Object.keys(ConstraintDefinitions),freshRoundtrip,generic:genericControls(process.env.CODI_REDUCTION_EXPECT_RESTART==='1'),benchmarkScope:'Exploratory Node same-process load/prepare/solve elapsed time, no Chrome or worst-case guarantee',benchmark,rows};
fs.writeFileSync(process.env.CODI_REDUCTION_OUTPUT||'/tmp/codi-reduction-source-result.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({rows:rows.length,ok:rows.filter(r=>r.ok).length,errors:rows.filter(r=>!r.ok).map(r=>[r.name,r.error.code]),registeredSchemas:report.registeredSchemas.length}));process.exit(0);
