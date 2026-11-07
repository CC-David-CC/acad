// Actual registered command -> actual service -> actual production Worker.
// Host/storage/session are explicit context doubles; models and solver are real.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {fixture,twoStage,sketch,point,constraint} from './normal-command.mjs';
import {transport} from './transport.mjs';
const rows=[],counts={started:0,terminated:0};
const physical=definitions=>'codi-physical-parameters:1\n'+JSON.stringify(definitions);
const lengthSource=physical([{name:'L',dimension:'length',expression:'mm(10)'},{name:'M',dimension:'length',expression:'mm(20)'}]);
const typedSketch=(stages=2)=>sketch(Array.from({length:stages},(_,i)=>({id:'s'+i,type:'Segment',role:null,stage:i,data:{a:{x:0,y:i*5},b:{x:i?20:10,y:i*5}}})),Array.from({length:stages},(_,i)=>[constraint('SegmentLength',['s'+i],{length:i?'M':'L'},i)]));
const frozen=value=>{if(value&&typeof value==='object'){assert(Object.isFrozen(value));for(const v of Object.values(value))frozen(v);}};
async function use(source,options,job){const t=transport(),f=fixture(source,t.run,options);try{return await job(f,t);}finally{f.close();await t.drain();assert.equal(t.counts.started,t.counts.terminated);counts.started+=t.counts.started;counts.terminated+=t.counts.terminated;}}
const remember=(id,report,t)=>{rows.push({id,report,requests:t.requests});return report;};

test('normal discovery/analyze command closes the saved multi-stage service refusal',async()=>{
 const before=JSON.parse(readFileSync(new URL('before-service.json',import.meta.url)));assert.equal(before.outcome.code,'UNSUPPORTED');assert.equal(before.dispatches,0);
 await use(twoStage(),{},async(f,t)=>{const inventory=f.inspect();assert.equal(inventory.saved.find(x=>x.faceId===f.face.id).availability,'current');const source=f.source,history=f.ctx.craftService.modifications$.value,report=remember('saved',await f.analyze(),t);assert.equal(report.status,'stage-local');assert.equal(report.localJacobian.physicalDof,null);assert.deepEqual(report.admission.map(x=>[x.stage,x.index,x.typeId]),[[0,0,'LockPoint'],[1,0,'SignedDistanceX']]);assert.deepEqual(report.localJacobian.stages.map(x=>[x.stage,x.localJacobian.rank,x.localJacobian.localNullity]),[[0,2,0],[1,1,1]]);assert.equal(report.localJacobian.stages[1].localJacobian.fixedExternalVariables,2);assert.deepEqual(t.requests[0].localJacobian,{version:1,scope:'per-stage'});assert.equal(f.source,source);assert.equal(f.ctx.craftService.modifications$.value,history);frozen(report);});
});
test('active mode uses real current staged solver objects and the same authorized commands',async()=>{
 await use(twoStage(),{active:true},async(f,t)=>{assert.equal(f.workspace.parametricManager.stages.length,2);const source=f.workspace.io.serializeSketch(undefined,{strict:true});const r=remember('active',await f.analyze(),t);assert.equal(r.mode,'active');assert.equal(r.status,'stage-local');assert.equal(f.workspace.io.serializeSketch(undefined,{strict:true}),source);assert.deepEqual(r.localJacobian.stages.map(s=>s.localJacobian.rank),[2,1]);frozen(r);});
});
test('ordinary single-stage saved/active output shape and Worker option remain unchanged',async()=>{
 for(const active of [false,true])await use(sketch([point('p',1,2)],[[constraint('LockPoint',['p'],{x:'1',y:'2'})]]),{active},async(f,t)=>{const r=remember('single-'+active,await f.analyze(),t);assert.equal(r.status,'estimated');assert.deepEqual(Object.keys(r).sort(),['admission','evidence','faceId','localJacobian','mode','revision','scope','status']);assert(!Object.hasOwn(r.admission[0],'stage'));assert(!Object.hasOwn(r.localJacobian,'stages'));assert.deepEqual(t.requests[0].localJacobian,{version:1});assert.deepEqual([r.localJacobian.rank,r.localJacobian.localNullity],[2,0]);});
});
test('typed saved/active multi-stage diagnostics retain dimensional names and use normal typed task',async()=>{
 for(const active of [false,true])await use(typedSketch(),{active,parameterSource:lengthSource},async(f,t)=>{const source=f.source,r=remember('typed-'+active,await f.analyze(),t);assert.equal(r.status,'stage-local');assert.equal(r.localJacobian.physicalDof,null);assert.deepEqual(r.localJacobian.stages.map(s=>s.localJacobian.rank),[3,3]);assert.equal(t.requests[0].task,'typed-dependent-diagnostics');assert(!Object.hasOwn(t.requests[0],'localJacobian'));assert.deepEqual(Object.keys(t.requests[0]).sort(),['boundary','parameterSource','revision','sketchJSON','task']);assert.equal(t.requests[0].parameterSource,lengthSource);assert.deepEqual(JSON.parse(t.requests[0].sketchJSON).stages.map(s=>s.constraints[0].constants.length),['L','M']);assert.equal(f.source,source);frozen(r);});
});
test('typed single-stage diagnostics and typed-dependent-solve keep existing contracts',async()=>{
 await use(typedSketch(1),{parameterSource:lengthSource},async(f,t)=>{const r=remember('typed-single',await f.analyze(),t);assert.equal(r.status,'estimated');assert(!Object.hasOwn(r.localJacobian,'stages'));assert(!Object.hasOwn(r.admission[0],'stage'));const request={...t.requests[0],revision:'typed-nondiagnostic',task:'typed-dependent-solve'},ordinary=await t.run('/static/actual-solver-worker.js',request,{});assert.equal(ordinary.ok,true,JSON.stringify(ordinary.error));assert(!Object.hasOwn(ordinary,'localJacobian'));rows.push({id:'typed-solve',result:ordinary});});
});
test('unsupported typed units/bindings return honest unavailable snapshots without a rank claim',async()=>{
 for(const [source,parameterSource] of [[typedSketch(),physical([{name:'L',dimension:'angle',expression:'deg(10)'},{name:'M',dimension:'length',expression:'mm(20)'}])],[sketch([point('p',1,2),point('q',5,2,1)],[[constraint('LockPoint',['p'],{x:'L',y:'2'})],[]]),lengthSource]])await use(source,{parameterSource},async(f,t)=>{const before=f.source,r=remember('typed-unsupported',await f.analyze(),t);assert.equal(r.status,'unavailable');assert.equal(r.scope,'current-sketch-admission-snapshot');assert.equal(r.reason.code,'TYPED_SKETCH_INVALID');assert(!Object.hasOwn(r,'localJacobian'));assert.equal(f.source,before);});
});
test('singular stages and shared-budget exhaustion remain explicit through the normal service',async()=>{
 const singular=sketch([point('p',0,0),point('q',0,0,1)],[[constraint('LockPoint',['p'],{x:'0',y:'0'})],[constraint('DistancePP',['p','q'],{distance:'0'},1)]]);
 await use(singular,{},async(f,t)=>{const r=remember('singular',await f.analyze(),t),d=r.localJacobian.stages[1].localJacobian;assert.equal(d.status,'zero-gradient');assert.equal(d.orderedContribution.groups[0].status,'unknown');assert.equal(r.localJacobian.physicalDof,null);});
 const objects=[];for(let s=0;s<2;s++)for(let i=0;i<33;i++)objects.push(point('p'+s+'-'+i,i,s,s));await use(sketch(objects,[[],[]]),{},async(f,t)=>{const r=remember('shared-budget',await f.analyze(),t);assert.equal(r.status,'stage-local');assert.equal(r.localJacobian.stages[0].localJacobian.status,'estimated');assert.equal(r.localJacobian.stages[1].localJacobian.status,'unavailable');});
});
test('saved source ABA/history/stream/document changes invalidate completed Worker reports',async()=>{
 for(const mutate of [f=>f.bumpVersion(),f=>f.setSource(f.source+' '),f=>{f.ctx.craftService.modifications$.value={...f.ctx.craftService.modifications$.value};},f=>{f.ctx.expressionService.table$={value:{},revision:1};},f=>f.doc.abort()])await use(twoStage(),{},async(f,t)=>{t.setHook(()=>mutate(f));await assert.rejects(f.analyze(),{name:'AbortError'});});
});
test('active actual parameter mutation invalidates pending active-source diagnostics',async()=>{
 await use(twoStage(),{active:true},async(f,t)=>{t.setHook(()=>{f.workspace.createIndex().q.x+=.01;});await assert.rejects(f.analyze(),{name:'AbortError'});});
});
test('typed physical currentness and original physical source fence completed reports',async()=>{
 for(const mutate of [f=>f.setPhysicalCurrent(false),f=>{f.ctx.expressionService.script$.value+=' ';f.ctx.expressionService.script$.revision++;}])await use(typedSketch(),{parameterSource:lengthSource},async(f,t)=>{t.setHook(()=>mutate(f));await assert.rejects(f.analyze(),{name:'AbortError'});});
});
test('host cancellation/detachment is enforced by unchanged normal command lifetime custody',async()=>{
 for(const mutate of [f=>f.hostLife.abort(),f=>f.detach()])await use(twoStage(),{},async(f,t)=>{t.setHook(()=>mutate(f));await assert.rejects(f.analyze(),{name:'AbortError'});});
});
test('malformed ordered reports, nullity and original residuals refuse after actual Worker solve',async()=>{
 const patches=[r=>{r.localJacobian.physicalDof=0;},r=>r.localJacobian.stages.reverse(),r=>{r.localJacobian.stages[1].localJacobian.rank=2;},r=>{r.localJacobian.stages[1].localJacobian.localNullity=99;},r=>{r.localJacobian.stages[1].localJacobian.orderedContribution.groups[0].typeId='LockPoint';},r=>{r.localJacobian.stages[1].localJacobian.rowOrigins[0].constraintId='another';},r=>{r.evidence[1].residuals[0]=.0001;r.evidence[1].tolerance=.001;},r=>{const a=r.localJacobian.stages[0].localJacobian,b=r.localJacobian.stages[1].localJacobian;Object.assign(a,{variables:64,localNullity:62,nullityLower:62,nullityUpper:62});Object.assign(b,{variables:65,localNullity:64,nullityLower:64,nullityUpper:64});},r=>{r.localJacobian.stages[1].localJacobian={version:1,status:'unavailable',reason:'limit',rank:1};}];
 for(const patch of patches)await use(twoStage(),{},async(f,t)=>{t.setHook(r=>patch(r));await assert.rejects(f.analyze());});
});
test('normal protocol rejects new caller scope fields, stale revisions and stale saved frames',async()=>{
 await use(twoStage(),{},async(f,t)=>{const inspected=f.inspect(),args={revision:inspected.revision,mode:'saved',faceId:f.face.id};assert.throws(()=>f.invoke('analyze-sketch',{...args,scope:'per-stage'}));f.bumpVersion();await assert.rejects(f.invoke('analyze-sketch',args),{name:'AbortError'});assert.equal(t.counts.started,0);const source=JSON.parse(f.source);source.metadata.boundaryFrame.origin[0]=1;f.setSource(JSON.stringify(source));await assert.rejects(f.analyze(),{code:'FRAME_UNAVAILABLE'});assert.equal(t.counts.started,0);});
});
test.after(()=>{assert.equal(counts.started,counts.terminated);writeFileSync(new URL('actual-service.json',import.meta.url),JSON.stringify({scope:'actual-command-registrar/service/production-Worker-with-host-storage-doubles',counts,rows},null,2)+'\n');});
