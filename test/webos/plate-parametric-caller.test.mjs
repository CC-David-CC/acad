import {test} from 'node:test';import assert from 'node:assert/strict';
import {resolveDependentSketch} from '../../web/app/cad/sketch/dependentSketchSolve.js';
const boundary=x=>({lines:[{id:'edge',a:{x:0,y:0},b:{x,y:0}}],arcs:[],circles:[],nurbses:[]});
function fixture(){const face={id:'face',csys:{origin:{x:0,y:0,z:0},x:{x:1,y:0,z:0},y:{x:0,y:1,z:0},z:{x:0,y:0,z:1}}},authored={metadata:{boundaryFrame:{origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]}},boundary:boundary(10),stages:[{constraints:[{objects:['boundary/edge']}]}]},state={source:JSON.stringify(authored),boundary:boundary(20),face,script:'x=1',params:{x:1}};const ctx={projectService:{},craftService:{modifications$:{value:{}}},sketchStorageService:{getSketchData:()=>state.source},cadRegistry:{findFace:()=>state.face},expressionService:{script$:{get value(){return state.script}},list$:{revision:0},errors$:{revision:0},table$:{get value(){return state.params}}}};return {face,state,ctx,getBoundary:()=>state.boundary,workerUrl:'/worker.js'};}
test('dispatches filtered boundaries without writing authored source',async()=>{const f=fixture(),before=f.state.source;let request;const result=await resolveDependentSketch({...f,run:async(_url,r)=>{request=r;return {revision:r.revision,ok:true,sketch:{objects:[]},evidence:[]}}});assert.deepEqual(result,{objects:[]});assert.equal(f.state.source,before);assert.equal(request.sketch.boundary.lines[0].b.x,10);assert.equal(request.boundary.lines[0].b.x,20)});
test('changed input, face, parameters or boundary refuses worker result',async()=>{for(const change of [s=>s.source+=' ',s=>s.face={},s=>s.params.x=2,s=>s.boundary=boundary(21)]){const f=fixture();await assert.rejects(resolveDependentSketch({...f,run:async(_url,r)=>{change(f.state);return {revision:r.revision,ok:true,sketch:{},evidence:[]}}}),{name:'AbortError'});}});
test('history identity changes while solving invalidate reply',async()=>{const f=fixture();await assert.rejects(resolveDependentSketch({...f,run:async(_url,r)=>{f.ctx.craftService.modifications$.value={};return {revision:r.revision,ok:true,sketch:{},evidence:[]}}}),{name:'AbortError'})});
test('unsupported or malformed worker output is refused',async()=>{const f=fixture();await assert.rejects(resolveDependentSketch({...f,run:async(_url,r)=>({revision:r.revision,ok:false,error:{message:'Unsupported curve'}})}),/Unsupported curve/);await assert.rejects(resolveDependentSketch({...f,run:async()=>({revision:'wrong',ok:true,sketch:{},evidence:[]})}),/could not be solved/)});
test('missing or changed face frame refuses solve and late frame changes invalidate the result',async()=>{
 let f=fixture(),raw=JSON.parse(f.state.source);delete raw.metadata.boundaryFrame;f.state.source=JSON.stringify(raw);await assert.rejects(resolveDependentSketch({...f,run:async()=>{throw Error('must not dispatch')}}),/frame/);
 f=fixture();f.face.csys.x.x=-1;await assert.rejects(resolveDependentSketch({...f,run:async()=>{throw Error('must not dispatch')}}),/frame/);
 f=fixture();await assert.rejects(resolveDependentSketch({...f,run:async(_url,r)=>{f.face.csys.origin.x=5;return {revision:r.revision,ok:true,sketch:{},evidence:[]}}}),{name:'AbortError'});
});

test('typed dependent dispatch carries the captured source, never a scalar length table',async()=>{const f=fixture();f.state.script='typed-source';Object.assign(f.ctx.expressionService,{isTyped:true,hasCurrentPhysicalResult:()=>true});let request;await resolveDependentSketch({...f,run:async(_url,r)=>{request=r;return {revision:r.revision,ok:true,sketch:{objects:[]},evidence:[]}}});assert.equal(request.task,'typed-dependent-solve');assert.equal(request.parameterSource,'typed-source');assert.equal('externalParameters' in request,false);assert.equal(JSON.parse(request.sketchJSON).boundary.lines[0].b.x,10);assert.equal(request.boundary.lines[0].b.x,20)});
test('typed dependent stale source, stream revision and facade refuse late replies',async()=>{for(const change of [f=>f.state.script+='x',f=>f.ctx.expressionService.list$.revision++,f=>f.ctx.expressionService={...f.ctx.expressionService}]){const f=fixture();Object.assign(f.ctx.expressionService,{isTyped:true,hasCurrentPhysicalResult:()=>true});await assert.rejects(resolveDependentSketch({...f,run:async(_url,r)=>{change(f);return {revision:r.revision,ok:true,sketch:{},evidence:[]}}}),{name:'AbortError'})}});

test('typed names cause a dependent solve even without changed boundary',async()=>{
 for(const referenced of [false,true]) {
  const f=fixture();
  const obj=JSON.parse(f.ctx.sketchStorageService.getSketchData(f.face.id));
  if(!referenced)obj.stages[0].constraints=[];
  obj.stages[0].constraints.push({typeId:'SegmentLength',objects:['segment'],constants:{length:'width'}});
  f.ctx.sketchStorageService.getSketchData=()=>JSON.stringify(obj);
  f.ctx.expressionService.isTyped=true;f.ctx.expressionService.hasCurrentPhysicalResult=()=>true;
  const actual=f.getBoundary;obj.boundary=actual(f.face);
  let seen;await resolveDependentSketch({...f,run:async(_url,request)=>{seen=request;return {revision:request.revision,ok:true,sketch:{},evidence:[]}}});
  assert.equal(seen?.task,'typed-dependent-solve');
 }
});

test('candidate freshness is rechecked after asynchronous dependent solve',async()=>{
 const f=fixture();f.ctx.expressionService.isTyped=true;f.ctx.expressionService.hasCurrentPhysicalResult=()=>true;let current=true;f.ctx.requireParameterCandidateCurrent=()=>{if(!current)throw new DOMException('Candidate changed','AbortError')};
 await assert.rejects(resolveDependentSketch({...f,run:async(_url,request)=>{current=false;return {revision:request.revision,ok:true,sketch:{},evidence:[]}}}),{name:'AbortError'});
});
