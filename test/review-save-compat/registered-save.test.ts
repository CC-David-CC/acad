// Actual async Save and real headless solver; controlled store and dispatch bridge.
// This is neither browser UI nor a real browser Worker/client qualification.
import assert from 'node:assert/strict';import fs from 'node:fs';import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import {HeadlessSketchWorkspace} from '../../web/app/sketcher/headless/workspace';
import {solveSketch} from '../../web/app/sketcher/headless/solve';
import {assertCurrentDiagnosticGeometry} from '../../web/app/sketcher/headless/diagnosticGeometry.mjs';
import {captureActiveSketchForDiagnostics} from '../../web/app/sketcher/headless/diagnosticCapture.mjs';
import {unchangedSketchSave} from '../../web/app/cad/sketch/unchangedSketchSave.mjs';
import {isStableSketchForSave,sameSketchSaveFrame,makeSketchSaveReceipt,saveAndExitEditor} from '../../web/app/cad/craft/unconsumedSketchSave.mjs';
import {ConstraintDefinitions,validateConstraintConstantValues} from '../../web/app/sketcher/constr/ANConstraints';
import {sketchMutationEpoch} from '../../web/app/sketcher/sketchMutationEpoch.mjs';
import {prepareTypedDependentSketch} from '../../web/app/sketcher/headless/typedDependentSketch.mjs';
import {decodePhysicalSource} from '../../web/app/cad/parameters/physicalSource.mjs';
import {evaluatePhysicalSource} from '../../web/app/cad/parameters/evaluatePhysicalSource.mjs';
const frame={origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]},boundary={lines:[],arcs:[],circles:[],nurbses:[]};
const point=(id,x,y)=>({id,type:'Point',role:null,stage:0,data:{x,y}}),segment=(id,ax,ay,bx,by)=>({id,type:'Segment',role:null,stage:0,data:{a:{x:ax,y:ay},b:{x:bx,y:by}}}),circle=(id,x,y,r)=>({id,type:'Circle',role:null,stage:0,data:{c:{x,y},r}}),arc=(id,x=0,y=0,r=5)=>({id,type:'Arc',role:null,stage:0,data:{c:{x,y},a:{x:x+r,y},b:{x,y:y+r}}});
const ellipse=(id,type='Ellipse')=>({id,type,role:null,stage:0,data:{c:{x:0,y:0},rx:5,ry:3,rot:0,...(type==='EllipticalArc'?{a:{x:5,y:0},b:{x:0,y:3}}:{})}}),bezier=id=>({id,type:'BezierCurve',role:null,stage:0,data:{cp1:{x:0,y:0},cp2:{x:10,y:0},cp3:{x:20,y:0},cp4:{x:30,y:0}}});
const relation=(typeId,objects,constants)=>({typeId,objects,...(constants?{constants}:{}),stage:0,admission:{version:1,state:'accepted'}});
const cases=[];const add=(name,objects,constraint)=>cases.push({name,sketch:{version:3,objects,dimensions:[],labels:[],stages:[{constraints:constraint?[constraint]:[],generators:[]}],constants:'',metadata:{boundaryFrame:frame},boundary:structuredClone(boundary)}});
for(const first of ['Circle','Arc'])for(const second of ['Circle','Arc'])for(const schema of ['Concentric','EqualRadius'])add(schema+' '+first+'/'+second,[first==='Circle'?circle('a',0,0,5):arc('a'),second==='Circle'?circle('b',0,0,schema==='Concentric'?7:5):arc('b',0,0,schema==='Concentric'?7:5)],relation(schema,['a','b']));
add('RadiusLength Arc',[arc('a')],relation('RadiusLength',['a'],{length:'5'}));
for(const [schema,angle,line]of [['Angle','0',segment('a',0,0,10,0)],['AngleBetween','90',segment('b',20,0,20,10)],['Parallel','180',segment('b',20,0,10,0)],['Perpendicular','270',segment('b',20,0,20,-10)]])add(schema,schema==='Angle'?[line]:[segment('a',0,0,10,0),line],relation(schema,schema==='Angle'?['a']:['a','b'],{angle}));
add('DistancePP',[point('a',0,0),point('b',3,4)],relation('DistancePP',['a','b'],{distance:'5'}));
for(const schema of ['PointInMiddle','Symmetry'])add(schema,[point('p',5,0),segment('s',0,0,10,0)],relation(schema,['p','s']));
for(const circular of ['Circle','Arc']){
 add('PointOnCircle '+circular,[point('p',3,4),circular==='Circle'?circle('c',0,0,5):arc('c')],relation('PointOnCircle',['p','c']));
 add('TangentLC '+circular,[segment('s',-5,0,5,0),circular==='Circle'?circle('c',0,3,3):arc('c',0,3,3)],relation('TangentLC',['s','c'],{inverted:'false'}));
}
add('PointOnBezier',[point('p',15,0),bezier('b')],relation('PointOnBezier',['p','b']));
add('TangentLineBezier',[segment('s',-5,0,5,0),bezier('b')],relation('TangentLineBezier',['s','b']));
for(const type of ['Ellipse','EllipticalArc'])add('PointOnEllipse '+type,[point('p',5,0),ellipse('e',type)],relation('PointOnEllipse',['p','e']));
add('Fillet',[segment('a',-5,0,5,0),segment('b',0,-5,0,5),arc('r',3,3,3)],relation('Fillet',['a','b','r'],{inverted1:'false',inverted2:'true'}));
for(const type of ['Ellipse','EllipticalArc'])add(type+' native geometry',[ellipse('e',type)]);
add('Bezier geometry',[bezier('b')]);
for(const type of ['Ellipse','EllipticalArc']){const o=ellipse('e',type);o.data={ep1:{x:-5,y:0},ep2:{x:5,y:0},r:3,...(type==='EllipticalArc'?{a:{x:5,y:0},b:{x:0,y:3}}:{})};add(type+' legacy read/current native write',[o]);}
const collapsedHandle=bezier('b');collapsedHandle.data.cp2={...collapsedHandle.data.cp1};add('Bezier zero endpoint handle',[collapsedHandle]);
add('Bezier child LockPoint',[bezier('b')],relation('LockPoint',['b:1:B'],{x:'10',y:'0'}));
add('Ellipse center LockPoint',[ellipse('e')],relation('LockPoint',['e:C'],{x:'0',y:'0'}));
add('EllipticalArc endpoint LockPoint',[ellipse('e','EllipticalArc')],relation('LockPoint',['e:A'],{x:'5',y:'0'}));
add('Parallel same direction',[segment('a',0,0,10,0),segment('b',20,0,30,0)],relation('Parallel',['a','b'],{angle:'0'}));
add('Perpendicular positive direction',[segment('a',0,0,10,0),segment('b',20,0,20,10)],relation('Perpendicular',['a','b'],{angle:'90'}));
add('DistancePP zero coincidence',[point('a',0,0),point('b',0,0)],relation('DistancePP',['a','b'],{distance:'0'}));
for(const [schema,b]of [['SignedDistanceX',point('b',-5,0)],['SignedDistanceY',point('b',0,-5)]])add(schema+' negative',[point('a',0,0),b],relation(schema,['a','b'],{distance:'-5'}));
add('ProjectedDistance negative',[point('a',0,0),point('b',-5,0),segment('axis',0,0,10,0)],relation('ProjectedDistance',['a','b','axis'],{distance:'-5'}));
const browserFixtures=[];
const source=fs.readFileSync('web/app/cad/sketch/inPlaceSketcher.js','utf8'),body=source.match(/\n  async save\(\) \{([\s\S]*?)\n  \}/)[1];
async function actualSave(input,{typed=false,corrupt=null,refused=false,name="unnamed"}={}){
 const workspace=new HeadlessSketchWorkspace({});workspace.io._loadSketch(structuredClone(input),{strict:true});workspace.parametricManager.refresh();
 workspace.historyManager={recoverySnapshot:null,diffs:[],historyPointer:-1,lastCheckpoint:'',_counter:0};const tool={};workspace.toolManager={tool,defaultTool:tool};
 const original=JSON.parse(workspace.io.serializeSketch({expressionsSignature:'123'},{strict:true}));original.boundary=structuredClone(boundary);original.metadata.boundaryFrame=structuredClone(frame);
 let stored='{"unrelatedOldSource":true}',version=1,writes=0,dispatches=0,exits=0,lastEvidence;
 const face={id:'target'},storage={get:()=>stored,versionOf:()=>version,namespaceRevision:()=>version,set(key,bytes){stored=bytes;version++;writes++;}},project={documentGeneration:1,sketchStorageNamespace:'test',isDocumentCurrent:()=>true},expressions={signature:'123',script$:{value:typed?'codi-physical-parameters:1\n[]':'',revision:1},list$:{revision:1},errors$:{revision:1},table$:{value:{},revision:1},isTyped:typed,hasCurrentPhysicalResult:()=>true};
 const editor={face,viewer:workspace,boundaryAtOpen:structuredClone(boundary),boundaryFrameAtOpen:structuredClone(frame),sketchStorageKey:'s',authoredSaveGuard:null,ctx:{services:{storage},storageService:storage,projectService:project,cadRegistry:{findFace:()=>face},expressionService:expressions},exit(){exits++;}};
 const dispatch=async(url,request,options)=>{dispatches++;assert.equal(options.valid(),true);if(corrupt){const changed=JSON.parse(request.sketchJSON);corrupt(changed);request={...request,sketchJSON:JSON.stringify(changed)};}browserFixtures.push({name,request:structuredClone(request),expectedOK:!refused});const result=await new Promise((resolve,reject)=>{const bootstrap='global.window=global;window.location={search:""};window.addEventListener=()=>{};window.removeEventListener=()=>{};global.verb={eval:{Analyze:{rationalSurfaceClosestParam(){throw Error("unexpected NURBS call")}}}};require(require("node:worker_threads").workerData.bundle);';const thread=new Worker(bootstrap,{eval:true,workerData:{bundle:__filename,request}});thread.once('message',value=>{thread.terminate();resolve(value);});thread.once('error',error=>{thread.terminate();reject(error);});});if(!result.ok)return result;lastEvidence=result.evidence;return {revision:request.revision,ok:true,validated:true};};
 editor.save=new Function('getSketchBoundaries','sketchBoundaryFrame','boundaryGeometryClose','sameSketchSaveFrame','unchangedSketchSave','sketchMutationEpoch','makeSketchSaveReceipt','isStableSketchForSave','captureActiveSketchForDiagnostics','runSketchSolve','sketchWorkerUrl',`return async function(){${body}}`)(()=>boundary,()=>frame,(a,b)=>JSON.stringify(a)===JSON.stringify(b),sameSketchSaveFrame,unchangedSketchSave,sketchMutationEpoch,makeSketchSaveReceipt,isStableSketchForSave,captureActiveSketchForDiagnostics,dispatch,'controlled-real-backend');
 if(refused){await assert.rejects(saveAndExitEditor(editor,()=>{}));assert.equal(writes,0);assert.equal(dispatches,1);assert.equal(exits,0);assert.equal(stored,'{"unrelatedOldSource":true}');return;}
 await saveAndExitEditor(editor,()=>{});assert.equal(writes,1);assert.equal(dispatches,1);assert.equal(exits,1);assert.deepEqual(JSON.parse(stored),original);
 const reopened=new HeadlessSketchWorkspace({});reopened.io._loadSketch(JSON.parse(stored),{strict:true});const restored=JSON.parse(reopened.io.serializeSketch(JSON.parse(stored).metadata,{strict:true}));restored.boundary=structuredClone(boundary);assert.deepEqual(restored,JSON.parse(stored));
 assert.ok(lastEvidence.every(row=>row.residuals.every((n,i)=>Number.isFinite(n)&&Math.abs(n)<=row.tolerances[i])));return {stored,evidence:lastEvidence};
}
if(!isMainThread){try{const request=workerData.request,sketch=JSON.parse(request.sketchJSON),result=solveSketch({revision:request.revision,sketch,boundary:structuredClone(sketch.boundary),externalParameters:request.parameterSource===null?request.externalParameters:prepareTypedDependentSketch(sketch,name=>{const values=evaluatePhysicalSource(decodePhysicalSource(request.parameterSource)).values,row=values.find(row=>row.name===name);if(!row||row.dimension!=='length')throw Error('Typed length required');return row.value;})});if(result.ok)assertCurrentDiagnosticGeometry(sketch,result.sketch);parentPort.postMessage(result);}catch(error){parentPort.postMessage({ok:false,revision:workerData.request.revision,error:{code:'TEST_BACKEND_ERROR',message:error.message}});}}
else (async()=>{for(const distance of ['-5',-5,'NaN','Infinity',Infinity,NaN])assert.throws(()=>validateConstraintConstantValues(ConstraintDefinitions.DistancePP,{distance},v=>v),/nonnegative|finite/);for(const distance of ['0',0,'5',5])assert.doesNotThrow(()=>validateConstraintConstantValues(ConstraintDefinitions.DistancePP,{distance},v=>v));console.log('PASS shared DistancePP constant validation rejects negative/nonfinite and retains zero');for(const c of cases){await actualSave(c.sketch,{name:c.name});console.log('PASS actual Save + real backend '+c.name);}
for(const c of cases.filter(c=>c.name==='Fillet'||c.name==='TangentLC Circle')){await actualSave(c.sketch,{typed:true,name:'typed '+c.name});console.log('PASS actual typed Save '+c.name);}
const target=cases.find(c=>c.name==='Concentric Circle/Circle').sketch;
for(const [name,corrupt]of [['unknown schema',s=>{s.stages[0].constraints[0].typeId='FutureRelation';}],['wrong entity reference',s=>{s.stages[0].constraints[0].objects[0]='missing';}],['unknown geometric intent',s=>{s.objects[0].data.hiddenIntent=1;}],['degenerate circular domain',s=>{s.objects[0].data.r=0;}],['nonfinite geometry',s=>{s.objects[0].data.r='Infinity';}]]){await actualSave(target,{corrupt,refused:true,name:'refuse '+name});console.log('PASS actual Save refuses '+name+' without write/exit');}
await actualSave(cases.find(c=>c.name==='DistancePP').sketch,{corrupt:s=>{s.stages[0].constraints[0].constants.distance='-5';},refused:true,name:'refuse negative DistancePP'});console.log('PASS actual Save refuses negative DistancePP before write/exit');
const tangent=cases.find(c=>c.name==='TangentLineBezier').sketch;await actualSave(tangent,{corrupt:s=>{const b=s.objects.find(o=>o.type==='BezierCurve');for(const k of ['cp1','cp2','cp3','cp4'])b.data[k]={x:0,y:0};},refused:true,name:'refuse degenerate Bezier'});console.log('PASS actual Save refuses degenerate Bezier without write/exit');
const angled=cases.find(c=>c.name==='Angle').sketch;await actualSave(angled,{corrupt:s=>{s.stages[0].constraints[0].constants.angle='10';},refused:true,name:'refuse solver-changed geometry'});console.log('PASS actual Save refuses solver-changed geometry without write/exit');
if(process.env.CODI_SAVE_FIXTURE_OUTPUT)fs.writeFileSync(process.env.CODI_SAVE_FIXTURE_OUTPUT,JSON.stringify({version:1,source:'349eb4d60',cases:browserFixtures},null,2)+'\n');
console.log('PASS '+cases.length+' registered save compatibility controls + typed/refusal checks (Node Worker thread, not browser Worker)');process.exit(0);})().catch(error=>{console.error(error);process.exit(1)});
