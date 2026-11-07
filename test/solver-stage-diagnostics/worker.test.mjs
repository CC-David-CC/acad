import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {solve,point,constraint,sketch,workerLifecycle} from './reproduce.mjs';
const diagnostics={localJacobian:{version:1,scope:'per-stage'}},rows=[];
const lock=(id,x,y,stage=0,state='accepted')=>constraint('LockPoint',[id],{x:String(x),y:String(y)},stage,state);
const base=cs=>sketch([point('p',1,2),point('q',5,2,1)],[[lock('p',1,2)],cs]);
const report=(r,index)=>{assert.equal(r.ok,true,JSON.stringify(r.error));const d=r.localJacobian;assert.equal(d.version,1);assert.equal(d.status,'stage-local');assert.equal(d.scope,'stage-local-fixed-inputs');assert.equal(d.physicalDof,null);assert(!Object.hasOwn(d,'rank'));assert(!Object.hasOwn(d,'localNullity'));assert.equal(d.stages[index].stage,index);return d.stages[index].localJacobian;};
const checked=async(id,source,extra=diagnostics)=>{const before=structuredClone(source),result=await solve(source,extra);assert.deepEqual(source,before);rows.push({id,source,result});if(result.ok){assert.equal(result.evidence.length,source.stages.reduce((n,s)=>n+s.constraints.length,0));for(const e of result.evidence)assert(e.residuals.every((v,i)=>Number.isFinite(v)&&Math.abs(v)<=e.tolerances[i]));}else assert(!Object.hasOwn(result,'localJacobian'));return result;};

test('actual production Worker closes reproduced two-stage fixed-prior reporting gap',async()=>{
 const before=JSON.parse(readFileSync(new URL('before.json',import.meta.url)));assert.equal(before.ok,true);assert.deepEqual(before.localJacobian,{version:1,status:'unavailable',reason:'unsupported-stages'});
 const source=base([constraint('SignedDistanceX',['p','q'],{distance:'4'},1)]),oldOpt=JSON.parse(readFileSync(new URL('before-opt-in.json',import.meta.url)));assert.deepEqual(oldOpt.source,source);assert.deepEqual(oldOpt.options,diagnostics);assert.equal(oldOpt.response.error.code,'INVALID');
 const r=await checked('fixed-prior',source),a=report(r,0),b=report(r,1);
 assert.deepEqual([a.variables,a.equations,a.rank,a.localNullity],[2,2,2,0]);assert.deepEqual([b.variables,b.equations,b.rank,b.localNullity,b.fixedExternalVariables],[2,1,1,1,2]);assert.deepEqual(r.sketch,before.sketch);assert.deepEqual(r.evidence,before.evidence);assert.deepEqual(b.rowOrigins.map(x=>[x.authoredIndex,x.typeId]),[[0,'SignedDistanceX']]);
});
test('real per-stage under/full/redundant controls use original Jacobians and preserve admission',async()=>{
 for(const [id,cs,rank,equations,nullity,states] of [['under',[],0,0,2,[]],['full',[lock('q',5,2,1)],2,2,0,['accepted']],['redundant',[lock('q',5,2,1),lock('q',5,2,1,'redundant')],2,4,0,['accepted','redundant']]]){
  const r=await checked(id,base(cs)),d=report(r,1);assert.deepEqual([d.variables,d.equations,d.rank,d.localNullity],[2,equations,rank,nullity]);assert.equal(d.status,'estimated');assert.deepEqual(r.evidence.slice(1).map(e=>e.state),states);assert.equal(report(r,0).rank,2);if(id==='redundant')assert.deepEqual(d.orderedContribution.groups.map(g=>g.increment),[2,0]);
 }
});
test('real singular zero-distance constraint keeps uncertainty separate from local nullity',async()=>{
 const source=sketch([point('p',0,0),point('q',0,0,1)],[[lock('p',0,0)],[constraint('DistancePP',['p','q'],{distance:'0'},1)]]),r=await checked('singular',source),d=report(r,1);
 assert.equal(d.status,'zero-gradient');assert.equal(d.rank,0);assert.equal(d.localNullity,2);assert.deepEqual(d.zeroGradientRows,[0]);assert.equal(d.orderedContribution.groups[0].status,'unknown');assert.equal(d.orderedContribution.groups[0].increment,null);assert.equal(r.localJacobian.physicalDof,null);assert.equal(d.fixedExternalVariables,2);
 // The actual solution q=p is isolated with p fixed despite a zero first
 // derivative. Never reinterpret the tangent nullity as two physical freedoms.
 assert.deepEqual(r.sketch.objects[1].data,{x:0,y:0});
});
test('real algebraic contradiction returns existing exact rejection and no diagnostic',async()=>{
 const r=await checked('contradiction',base([lock('q',5,2,1),lock('q',6,2,1)]));assert.equal(r.ok,false);assert.equal(r.error.code,'SOLVE_FAILED');assert.deepEqual(r.error.cause,{kind:'algebraic-contradiction',basis:'exact-reduced-row'});
});
test('zero-length segment and zero-radius circle are domain refusals, not contradiction reports',async()=>{
 for(const [id,object] of [['zero-segment',{id:'s',type:'Segment',role:null,stage:1,data:{a:{x:0,y:0},b:{x:0,y:0}}}],['zero-circle',{id:'c',type:'Circle',role:null,stage:1,data:{c:{x:0,y:0},r:0}}]]){const source=sketch([point('p',1,2),object],[[lock('p',1,2)],[]]),r=await checked(id,source);assert.equal(r.ok,false);assert.equal(r.error.code,'INVALID');assert.equal(r.error.cause.kind,'invalid-domain');}
});
test('actual ground reference is fixed in the new stage-local report',async()=>{
 const source=sketch([point('p',3,2)],[[constraint('SignedDistanceX',['ground/ORIGIN','p'],{distance:'3'})]]),r=await checked('ground-fixed',source),d=report(r,0);assert.equal(d.status,'estimated');assert.deepEqual([d.variables,d.fixedExternalVariables,d.rank,d.localNullity],[2,2,1,1]);
});
test('ordinary single-stage Worker reports and no-option results remain byte-equivalent data',async()=>{
 const before=JSON.parse(readFileSync(new URL('baseline-before.json',import.meta.url)));
 for(const [id,row] of Object.entries(before)){const r=await checked('legacy-'+id,row.source,{localJacobian:{version:1}});assert.deepEqual(r,row.result);}
 const ordinary=await checked('no-option',base([]),{localJacobian:undefined});assert.equal(ordinary.ok,true);assert(!Object.hasOwn(ordinary,'localJacobian'));
 const legacyMulti=await checked('legacy-multistage',base([]),{localJacobian:{version:1}});assert.deepEqual(legacyMulti.localJacobian,{version:1,status:'unavailable',reason:'unsupported-stages'});
});
test('diagnostic variable/equation quotas are shared across stages without rejecting a valid solve',async()=>{
 for(const [count,status] of [[32,'estimated'],[33,'unavailable']]){const objects=[];for(let s=0;s<2;s++)for(let i=0;i<count;i++)objects.push(point('p'+s+'-'+i,i,s,s));const r=await checked('shared-variables-'+count,sketch(objects,[[],[]])),a=report(r,0),b=report(r,1);assert.equal(a.status,'estimated');assert.equal(b.status,status);if(count===32)assert.deepEqual([a.variables,b.variables,a.rank,b.rank],[64,64,0,0]);else assert.equal(b.reason,'unsupported-or-limit');}
 for(const count of [32,33]){const cs=(id,n,stage)=>Array.from({length:n},(_,i)=>lock(id,id==='p'?1:5,2,stage,i?'redundant':'accepted')),source=sketch([point('p',1,2),point('q',5,2,1)],[cs('p',32,0),cs('q',count,1)]),r=await checked('shared-equations-'+count,source),a=report(r,0),b=report(r,1);assert.equal(a.equations,64);if(count===32)assert.deepEqual([b.equations,b.rank,b.localNullity],[64,2,0]);else{assert.equal(b.status,'unavailable');assert.equal(b.reason,'limit');}}
});
test('existing source-stage bound is preserved and invalid scope requests remain invalid',async()=>{
 const source=sketch([point('p',1,2)],Array.from({length:32},()=>[])),r=await checked('stage-limit-32',source);assert.equal(r.ok,true);assert.equal(r.localJacobian.stages.length,32);
 const over=await checked('stage-limit-33',sketch([point('p',1,2)],Array.from({length:33},()=>[])));assert.equal(over.ok,false);assert.equal(over.error.code,'UNSUPPORTED');
 for(const localJacobian of [{version:1,scope:'global'},{version:1,scope:'per-stage',extra:1},{version:2,scope:'per-stage'}]){const r=await checked('invalid-scope',base([]),{localJacobian});assert.equal(r.ok,false);assert.equal(r.error.code,'INVALID');}
});
test.after(()=>{assert.equal(workerLifecycle.started,workerLifecycle.terminated);writeFileSync(new URL('after.json',import.meta.url),JSON.stringify({scope:'actual-production-Node-Worker',workerLifecycle,rows},null,2)+'\n');});
