import './platform.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {writeFileSync} from 'node:fs';
import {installWindow,drain,lifecycle,setReplyHook,requests} from './platform.mjs';
import {captureDrivingDimensionIntent,classifyDrivingDimensionDelta,captureDrivingDimensionReply} from '../../web/app/sketcher/headless/drivingDimensionTarget.mjs';
const api=createRequire(import.meta.url)('../../.build/closed-dimension-edit/service/service.cjs');installWindow();const url='http://fixture.test/static/worker.js',rows=[];
const frame={origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]},boundary={lines:[],arcs:[],circles:[],nurbses:[]};
const c=(typeId,objects,constants,stage=0,state='accepted')=>({typeId,objects,constants,stage,annotations:typeId==='SegmentLength'?[{offset:20}]:typeId==='DiameterLength'?[{angle:0}]:[],admission:{version:1,state}});
const source=(objects,stages)=>({version:3,objects,dimensions:[],labels:[],stages:stages.map(constraints=>({constraints,generators:[]})),constants:'',boundary:structuredClone(boundary),metadata:{boundaryFrame:structuredClone(frame)}});
const circle=(r=10)=>({id:'c',type:'Circle',role:null,stage:0,data:{c:{x:0,y:0},r}}),segment=(id='s',length=10,stage=0)=>({id,type:'Segment',role:null,stage,data:{a:{x:0,y:stage*5},b:{x:length,y:stage*5}}});
const circleSource=(extra=[])=>source([circle()],[[c('DiameterLength',['c'],{diameter:'20'}),...extra]]);
const segmentSource=()=>source([segment()],[[c('SegmentLength',['s'],{length:'10'})]]);
const solve=async(sketch,externalParameters={})=>{const r=await api.runSketchSolve(url,{revision:'fixture-prepare',sketch,boundary:structuredClone(boundary),externalParameters});assert.equal(r.ok,true,JSON.stringify(r.error));return r.sketch;};
async function use(input,options,work){const f=api.fixture(input,options);try{return await work(f);}finally{setReplyHook(null);f.close();await drain();}}
async function inspect(f){const i=f.commands.inspectSketchTransitions();assert.equal(i.ready,true,i.reason);return f.commands.inspectClosedSketch({revision:i.revision,faceId:f.face.id});}
async function target(f,type){const i=await inspect(f),t=i.dimensionTargets.find(t=>t.typeId===type&&t.canEdit);assert(t,'Discovered editable dimension required');return{i,t};}
async function edit(f,type,value){const{i,t}=await target(f,type);return f.commands.editClosedSketchDimension({revision:i.revision,faceId:f.face.id,constraintId:t.constraintId,value});}
async function remove(f,type){const{i,t}=await target(f,type);return f.commands.removeClosedSketchDimension({revision:i.revision,faceId:f.face.id,constraintId:t.constraintId});}
const diameter=s=>2*JSON.parse(s).objects.find(o=>o.id==='c').data.r;
const length=s=>{const d=JSON.parse(s).objects.find(o=>o.id==='s').data;return Math.hypot(d.b.x-d.a.x,d.b.y-d.a.y);};
const near=(a,b)=>assert(Math.abs(a-b)<=1e-6,`${a} != ${b}`);

test('actual normal coordinator replaces one circle diameter and journals exact Undo/Redo',async()=>{
 await use(await solve(circleSource()),{},async f=>{const before=f.source,r=await edit(f,'DiameterLength',30);assert.equal(r.changed,true);assert.equal(r.authoredUndo,true);near(diameter(f.source),30);const after=f.source,n=JSON.parse(after);assert.equal(n.stages[0].constraints.filter(x=>x.typeId==='DiameterLength').length,1);assert.equal(n.stages[0].constraints[0].constants.diameter,'30');assert.deepEqual(n.stages[0].constraints[0].annotations,[{angle:0}]);await f.travel('undo');assert.equal(f.source,before);await f.travel('redo');assert.equal(f.source,after);rows.push({id:'diameter-edit',before:JSON.parse(before),after:n,receipt:r,journal:f.journal});});
});
test('actual segment length edit and removal preserve object identity and genuine underconstraint',async()=>{
 await use(await solve(segmentSource()),{},async f=>{const original=f.source;await edit(f,'SegmentLength',25);near(length(f.source),25);const edited=f.source;await remove(f,'SegmentLength');const removed=f.source,n=JSON.parse(removed);assert.equal(n.objects.length,1);assert.equal(n.objects[0].id,'s');assert.equal(n.stages[0].constraints.length,0);await f.travel('undo');assert.equal(f.source,edited);await f.travel('redo');assert.equal(f.source,removed);await f.travel('undo');await f.travel('undo');assert.equal(f.source,original);rows.push({id:'length-remove',edited:JSON.parse(edited),removed:n});});
});
test('removing a real accepted duplicate reactivates the surviving redundant diameter',async()=>{
 await use(await solve(circleSource([c('DiameterLength',['c'],{diameter:'20'},0,'redundant')])),{},async f=>{const{i}=await target(f,'DiameterLength');assert.deepEqual(i.constraints.map(c=>c.admission.state),['accepted','redundant']);await remove(f,'DiameterLength');const n=await inspect(f);assert.equal(n.constraints.length,1);assert.equal(n.constraints[0].admission.state,'accepted');near(diameter(f.source),20);await f.travel('undo');assert.deepEqual((await inspect(f)).constraints.map(c=>c.admission.state),['accepted','redundant']);rows.push({id:'redundant-reactivation',after:n});});
});
test('contradictory existing dimension edit preserves source/journal and a valid retry recovers',async()=>{
 await use(await solve(circleSource([c('FixCircle',['c'],{cx:'0',cy:'0',radius:'10'})])),{},async f=>{const before=f.source,journal=f.journal;await assert.rejects(edit(f,'DiameterLength',30));assert.equal(f.source,before);assert.equal(f.journal,journal);const r=await edit(f,'DiameterLength',20);assert.equal(r.changed,false);assert.equal(f.source,before);assert.equal(f.events.commits,0);rows.push({id:'contradiction-preserved'});});
});
test('strict discovered identity/domain/no-op and unsupported schema refuse without publication',async()=>{
 await use(await solve(circleSource()),{},async f=>{const{i,t}=await target(f,'DiameterLength'),before=f.source;for(const value of [0,-1,NaN,Infinity,'30','unknown',{},1e6+1])await assert.rejects(f.commands.editClosedSketchDimension({revision:i.revision,faceId:f.face.id,constraintId:t.constraintId,value}));await assert.rejects(f.commands.removeClosedSketchDimension({revision:i.revision,faceId:f.face.id,constraintId:t.constraintId+'x'}));const r=await edit(f,'DiameterLength',20);assert.equal(r.changed,false);assert.equal(f.source,before);assert.equal(f.events.prepares,0);await edit(f,'DiameterLength',25);await assert.rejects(f.commands.removeClosedSketchDimension({revision:i.revision,faceId:f.face.id,constraintId:t.constraintId}));});
});
const physical='codi-physical-parameters:1\n'+JSON.stringify([{name:'D',dimension:'length',expression:'mm(20)'},{name:'M',dimension:'length',expression:'inch(1)'},{name:'A',dimension:'angle',expression:'deg(90)'}]);
test('typed diameter rebinding/literal/removal use actual quantity lengths and exact typed Undo',async()=>{
 const typed=circleSource();typed.stages[0].constraints[0].constants.diameter='D';
 await use(await solve(typed,{D:20}),{parameterSource:physical},async f=>{const before=f.source;assert.equal((await inspect(f)).capabilities.mutations,'driving-dimension-edit-remove-only');await edit(f,'DiameterLength','M');near(diameter(f.source),25.4);assert.equal(JSON.parse(f.source).stages[0].constraints[0].constants.diameter,'M');const named=f.source;await edit(f,'DiameterLength',25.4);assert.equal(JSON.parse(f.source).stages[0].constraints[0].constants.diameter,'25.4');assert.notEqual(f.source,named);await f.travel('undo');assert.equal(f.source,named);await f.travel('undo');assert.equal(f.source,before);await f.travel('redo');assert.equal(f.source,named);await remove(f,'DiameterLength');assert.equal((await inspect(f)).constraints.length,0);await f.travel('undo');assert.equal(f.source,named);for(const value of ['A','missing','M*2'])await assert.rejects(edit(f,'DiameterLength',value));assert.equal(f.source,named);assert.deepEqual(f.ctx.expressionService.table$.value,{});rows.push({id:'typed-diameter',named:JSON.parse(named),source:physical});});
});
test('actual arc diameter replacement preserves consistency and source IDs',async()=>{
 const arc={id:'c',type:'Arc',role:null,stage:0,data:{a:{x:10,y:0},b:{x:0,y:10},c:{x:0,y:0}}};
 await use(await solve(source([arc],[[c('ArcConsistency',['c'],{}),c('DiameterLength',['c'],{diameter:'20'})]])),{},async f=>{await edit(f,'DiameterLength',30);const o=JSON.parse(f.source).objects[0],d=o.data;assert.equal(o.id,'c');near(2*Math.hypot(d.a.x-d.c.x,d.a.y-d.c.y),30);near(2*Math.hypot(d.b.x-d.c.x,d.b.y-d.c.y),30);rows.push({id:'arc-diameter',after:JSON.parse(f.source)});});
});
test('typed rectangle removes and restores one named driving length through the same journal',async()=>{
 const draft=await api.runSketchSolve(url,{task:'rectangle',revision:'rectangle',unit:'millimeter',frame,origin:[0,0],width:20,height:10});assert.equal(draft.ok,true,JSON.stringify(draft.error));const typed=draft.sketch;typed.stages[0].constraints.find(c=>c.typeId==='SegmentLength').constants.length='D';
 await use(await solve(typed,{D:20}),{parameterSource:physical},async f=>{const before=f.source;await edit(f,'SegmentLength','M');const changed=f.source;assert.equal(JSON.parse(changed).stages[0].constraints.find(c=>c.typeId==='SegmentLength').constants.length,'M');await remove(f,'SegmentLength');assert.equal((await inspect(f)).dimensionTargets.filter(t=>t.typeId==='SegmentLength').length,1);await f.travel('undo');assert.equal(f.source,changed);await f.travel('undo');assert.equal(f.source,before);rows.push({id:'typed-rectangle',after:JSON.parse(changed)});});
});
test('multi-stage earlier geometry remains fixed while a later owned segment length changes',async()=>{
 const first={id:'p',type:'Point',role:null,stage:0,data:{x:2,y:3}},s=segment('s',10,1),sketch=source([first,s],[[c('LockPoint',['p'],{x:'2',y:'3'})],[c('SegmentLength',['s'],{length:'10'},1)]]);
 await use(await solve(sketch),{},async f=>{await edit(f,'SegmentLength',18);near(length(f.source),18);assert.deepEqual(JSON.parse(f.source).objects[0].data,{x:2,y:3});});
});
test('actual Worker response is fenced by source/history/physical result/quantity and host lifetime',async()=>{
 const typed=circleSource();typed.stages[0].constraints[0].constants.diameter='D';
 const controls=[['source',f=>f.setSource(f.source+' ')],['history',f=>{f.ctx.craftService.modifications$.value={...f.ctx.craftService.modifications$.value};}],['registry',f=>{f.ctx.cadRegistry={findFace:()=>null};}],['physical-current',f=>f.setPhysicalCurrent(false)],['physical-source',f=>{f.ctx.expressionService.script$.value+=' ';}],['quantity',f=>f.setQuantityOverride(()=>21)],['host',f=>{f.ctx.projectService.hasHostLifetime=false;}],['cancel',f=>f.doc.abort()]];
 for(const [id,mutate] of controls)await use(await solve(typed,{D:20}),{parameterSource:physical},async f=>{const {i,t}=await target(f,'DiameterLength');const before=f.source,j=f.journal;setReplyHook((_r,request)=>{if(request.task==='sketch-transition-driving-dimension')mutate(f);});await assert.rejects(f.commands.editClosedSketchDimension({revision:i.revision,faceId:f.face.id,constraintId:t.constraintId,value:'M'}),{name:'AbortError'});assert.equal(f.events.commits,0);assert.equal(f.journal,j);if(id!=='source')assert.equal(f.source,before);rows.push({id:'fenced-'+id,commits:f.events.commits});});
});
test('intent/response capture rejects getters, sparse identities and malformed reply fields',()=>{
 let read=0;const bad={constraintId:'x'};Object.defineProperty(bad,'value',{enumerable:true,get(){read++;return 10;}});assert.throws(()=>captureDrivingDimensionIntent(bad,'edit'));assert.equal(read,0);assert.throws(()=>captureDrivingDimensionIntent({constraintId:'x',value:10,extra:true},'edit'));
 const reply={};Object.defineProperty(reply,'ok',{enumerable:true,get(){read++;return false;}});assert.throws(()=>captureDrivingDimensionReply(reply,'r'));assert.equal(read,0);
 for(const action of ['edit','remove'])assert(Object.isFrozen(captureDrivingDimensionIntent(action==='edit'?{constraintId:'x',value:10}:{constraintId:'x'},action)));
});
test('typed permission remains narrow and geometry-only/other-field travel is refused by actual Worker',async()=>{
 const typed=circleSource();typed.stages[0].constraints[0].constants.diameter='D';
 await use(await solve(typed,{D:20}),{parameterSource:physical},async f=>{const i=await inspect(f),before=f.source;await assert.rejects(f.commands.applySketchDiameter({revision:i.revision,faceId:f.face.id,id:'c',diameter:25}),{code:'TYPED_SKETCH_MUTATION_UNSUPPORTED'});assert.equal(f.source,before);const moved=JSON.parse(before);moved.objects[0].data.c.x=1;const rejected=await api.verifyDrivingDimensionCandidate(url,{revision:'unrelated-travel',sketchJSON:before,candidateJSON:JSON.stringify(moved),externalParameters:{D:20}},{},true);assert.equal(rejected.ok,false);assert.equal(rejected.error.code,'INTENT_CHANGED');const changed=JSON.parse(before);changed.metadata.extra='unrelated';const bad=await api.verifyDrivingDimensionCandidate(url,{revision:'metadata-travel',sketchJSON:before,candidateJSON:JSON.stringify(changed),externalParameters:{D:20}},{},true);assert.equal(bad.ok,false);assert.equal(bad.error.code,'INTENT_CHANGED');});
});
test('second actual Worker rejects a valid solved candidate containing another dimension edit',async()=>{
 const c2={...circle(),id:'other',data:{c:{x:50,y:0},r:10}},before=await solve(source([circle(),c2],[[c('DiameterLength',['c'],{diameter:'20'}),c('DiameterLength',['other'],{diameter:'20'})]]));
 await use(before,{},async f=>{const{i,t}=await target(f,'DiameterLength'),after=JSON.parse(f.source);after.objects[0].data.r=15;after.objects[1].data.r=20;after.stages[0].constraints[0].constants.diameter='30';after.stages[0].constraints[1].constants.diameter='40';const r=await api.verifyDrivingDimensionCandidate(url,{revision:'unrelated-dimension',sketchJSON:f.source,candidateJSON:JSON.stringify(after),externalParameters:{},action:'edit',intent:{constraintId:t.constraintId,value:30}});assert.equal(r.ok,false);assert.equal(r.error.code,'INTENT_CHANGED');assert.equal(f.events.commits,0);});
});
test('malformed actual Worker replies refuse without granting publication authority',async()=>{
 for(const mutate of [r=>{r.dimension.constraintId+='wrong';},r=>{r.dimension.resolvedValue=NaN;},r=>{r.extra=true;},r=>{r.evidence[0].units[0]='inch';}])await use(await solve(circleSource()),{},async f=>{const{i,t}=await target(f,'DiameterLength'),before=f.source;setReplyHook((r,request)=>{if(request.task==='sketch-transition-driving-dimension'&&r.ok)mutate(r);});await assert.rejects(f.commands.editClosedSketchDimension({revision:i.revision,faceId:f.face.id,constraintId:t.constraintId,value:30}));assert.equal(f.source,before);assert.equal(f.events.commits,0);});
});
test('known publication survives post-commit host loss as committed error',async()=>{
 await use(await solve(circleSource()),{},async f=>{f.setAfterPublication(()=>{f.ctx.projectService.hasHostLifetime=false;});await assert.rejects(edit(f,'DiameterLength',30),error=>error.name==='AbortError'&&error.committed===true);near(diameter(f.source),30);assert.equal(f.events.commits,1);assert.equal(f.journal.entries.length,1);});
});
test('legacy raw expression restores exactly through Undo and a rejected value permits healthy retry',async()=>{
 const raw=segmentSource();raw.constants='L = 5\nK = L*2';raw.stages[0].constraints[0].constants.length='K';
 await use(await solve(raw),{},async f=>{const before=f.source;await edit(f,'SegmentLength',20);near(length(f.source),20);assert.equal(JSON.parse(f.source).stages[0].constraints[0].constants.length,'20');await f.travel('undo');assert.equal(f.source,before);assert.equal(JSON.parse(f.source).stages[0].constraints[0].constants.length,'K');const j=f.journal;await assert.rejects(edit(f,'SegmentLength',0));assert.equal(f.source,before);assert.equal(f.journal,j);await edit(f,'SegmentLength',25);near(length(f.source),25);assert.equal(JSON.parse(f.source).stages[0].constraints[0].constants.length,'25');rows.push({id:'legacy-expression-restored',before:JSON.parse(before),after:JSON.parse(f.source)});});
});
test('typed underconstrained arc Undo proves the original forward edit instead of requiring inverse-solver symmetry',async()=>{
 const arc={id:'c',type:'Arc',role:null,stage:0,data:{a:{x:10,y:0},b:{x:0,y:10},c:{x:0,y:0}}},raw=source([arc],[[c('ArcConsistency',['c'],{}),c('DiameterLength',['c'],{diameter:'D'})]]);
 await use(await solve(raw,{D:20}),{parameterSource:physical},async f=>{const before=f.source;await edit(f,'DiameterLength','M');const after=f.source;await f.travel('undo');assert.equal(f.source,before);await f.travel('redo');assert.equal(f.source,after);rows.push({id:'typed-arc-travel',before:JSON.parse(before),after:JSON.parse(after)});});
});
test('independent whole-state proof preserves legitimate motion of a dependent second circle',async()=>{
 const other={...circle(),id:'other',data:{c:{x:30,y:0},r:10}},raw=source([circle(),other],[[c('DiameterLength',['c'],{diameter:'20'}),c('EqualRadius',['c','other'],{})]]);
 await use(await solve(raw),{},async f=>{const before=f.source;await edit(f,'DiameterLength',30);const after=f.source,n=JSON.parse(after);near(2*n.objects[0].data.r,30);near(2*n.objects[1].data.r,30);await f.travel('undo');assert.equal(f.source,before);await f.travel('redo');assert.equal(f.source,after);rows.push({id:'dependent-radius-motion',before:JSON.parse(before),after:n});});
});

test.after(async()=>{await drain();assert.equal(lifecycle.started,lifecycle.terminated);writeFileSync(new URL('actual.json',import.meta.url),JSON.stringify({scope:'actual production Worker + coordinator with explicit publication/storage doubles',lifecycle,requests:requests.map(r=>({task:r.task,revision:r.revision})),rows},null,2)+'\n');});
