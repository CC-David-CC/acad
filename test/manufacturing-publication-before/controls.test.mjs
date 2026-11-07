import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {Worker as NodeWorker} from 'node:worker_threads';
import {setup,snapshot,assign,roles,ajt} from './harness.mjs';
import {fixture} from '../generic-manufacturing-assignment/manager-fixture.mjs';
import {installBody,request} from '../generic-manufacturing-assignment/admission-fixture.mjs';
const rows=[];
const equalAJT=(a,b)=>assert.deepEqual(ajt(a),ajt(b));
async function use(fn,options){const f=setup(options);try{await fn(f);}finally{await f.cleanup();assert.equal(f.workers.geometry,0);assert.equal(f.workers.hash,f.workers.terminated);}}
test('BEFORE observation: actual enclosure assignment and role edit change A, not J/T, disabling existing Undo',()=>use(async f=>{
 const before=snapshot(f);await assign(f);await f.drain();const assigned=snapshot(f);
 assert.equal(before.authored.canUndo,true);assert.equal(assigned.authored.canUndo,false);assert.notDeepEqual(assigned.A,before.A);assert.deepEqual(assigned.J,before.J);assert.equal(assigned.T,before.T);assert.notEqual(assigned.material,assigned.T);
 const changed=roles();changed.BODY={material:{id:'abs',name:'ABS'},appearance:{id:'black',name:'Black',color:'#000000'}};
 await assign(f,changed);await f.drain();const edited=snapshot(f);assert.equal(edited.A.objects[0].regions[0].materialId,'abs');assert.deepEqual(edited.J,before.J);assert.equal(edited.T,before.T);assert.deepEqual(edited.notifications,[]);
 rows.push({id:'assignment-edit-A-without-JT',before,assigned,edited});
}));
test('BEFORE actual travel function: Undo and Redo are unavailable after assignment, no geometry delegate runs',async()=>{
 for(const cursor of [1,0])await use(async f=>{
  const direction=cursor?'undo':'redo',before=snapshot(f);assert.equal(before.authored[cursor?'canUndo':'canRedo'],true);
  assert.throws(()=>f.craft.travel({revision:before.authored.revision,direction}),/GEOMETRY_REPLAY_NOT_RUN_PROTOCOL_FIXTURE/);assert.equal(f.delegateCalls.length,1);f.delegateCalls.length=0;
  await assign(f);const after=snapshot(f);assert.throws(()=>f.craft.travel({revision:after.authored.revision,direction}),/No supported authored edit/);assert.equal(f.delegateCalls.length,0);
  rows.push({id:'travel-unavailable-'+direction,before,after,geometryReplay:'not executed; prior route trap only'});
 },{cursor});
});
test('BEFORE identical role assignment retains equal payload but advances document/material token without a journal entry',()=>use(async f=>{
 await assign(f);const before=snapshot(f);await assign(f);await f.drain();const after=snapshot(f);
 assert.deepEqual(after.A,before.A);assert.deepEqual(after.J,before.J);assert.equal(after.T,before.T);assert.notEqual(after.material,before.material);assert.notEqual(after.revision,before.revision);
 rows.push({id:'no-op-token-churn',before,after});
}));
test('actual rebind prepares real changed canonical hash; confirmation changes A without journal/tip adoption',()=>use(async f=>{
 await assign(f);f.history[0].params.width=150;const before=snapshot(f);
 const proposal=await f.manager.proposeHostManufacturingRebind();assert.ok(proposal.token);equalAJT(snapshot(f),before);
 f.manager.confirmHostManufacturingRebind(proposal.token);await f.drain();const after=snapshot(f);
 assert.notEqual(after.A.revision,before.A.revision);assert.deepEqual(after.J,before.J);assert.equal(after.T,before.T);assert.equal(after.authored.canUndo,false);
 rows.push({id:'confirmed-rebind-A-without-JT',scope:'explicit authored/history geometry fixture; real canonical hash, no native re-evaluation',before,after});
}));
test('rejected role identity conflict and stale/preaborted requests preserve all A/J/T',()=>use(async f=>{
 await assign(f);const before=snapshot(f),conflict=roles();conflict.BODY.material.name='different value for existing ID';
 await assert.rejects(assign(f,conflict),/already in use/);equalAJT(snapshot(f),before);
 await assert.rejects(assign(f,roles(),{revision:'stale'}));equalAJT(snapshot(f),before);
 const controller=new AbortController();controller.abort();await assert.rejects(assign(f,roles(),{signal:controller.signal}),{name:'AbortError'});equalAJT(snapshot(f),before);
 await f.drain();rows.push({id:'rejection-AJT-preserved',before,after:snapshot(f),note:'legacy snapshot may write volatile project storage; not a purity claim'});
}));
test('real hash reply reentrancy: storage change, caller loss and replaced document cannot install the old proposal',async()=>{
 for(const mode of ['storage','caller','document'])await use(async f=>{
  await assign(f);const before=snapshot(f);let valid=true,triggered=false;
  f.setReplyHook(kind=>{if(kind==='hash'&&!triggered){triggered=true;if(mode==='storage')f.storage.set('fixture-changed-source','changed');else if(mode==='caller')valid=false;else f.newDocument();}});
  let failure;try{await assign(f,roles(),{valid:()=>valid});}catch(error){failure={name:error.name,message:error.message,code:error.code??null,committedPresent:Object.hasOwn(error,'committed'),committed:error.committed??null};}
  assert.ok(failure,'Changed preparation must refuse');assert.ok(triggered);f.setReplyHook(null);await f.drain();
  if(mode==='document'){assert.equal(f.manager.getManufacturingMetadata(),null);assert.equal(f.project.documentGeneration,2);rows.push({id:'hash-reentrant-new-document',old:before,newA:null,failure,oldJournalRetainedByFixture:true,note:'protocol New resets manager; full Craft reset not simulated'});}
  else{equalAJT(snapshot(f),before);rows.push({id:'hash-reentrant-'+mode,before,after:snapshot(f),failure});}
 });
});
test('generic readonly preparation becomes stale without publishing A/J/T',async()=>{
 const f=fixture();const b=installBody(f);try{
  const before={A:f.manager.getManufacturingMetadata(),material:f.manager.inspectMaterialSurfaceRevision()},info=f.manager.inspectGenericManufacturingParts();
  const p=await f.manager.prepareGenericManufacturingAssignment(request(info.revision,b.model));assert.equal(p.isCurrent(),true);assert.equal(p.summary.publication,'unavailable');
  b.bump();assert.equal(p.isCurrent(),false);assert.equal(f.manager.getManufacturingMetadata(),before.A);assert.equal(f.manager.inspectMaterialSurfaceRevision(),before.material);
  rows.push({id:'stale-generic-preparation',scope:'actual manager/hash Worker with explicit model/measurement admission fixture; no Native proof',publication:p.summary.publication,currentAfter:false});
 }finally{await f.close();assert.equal(f.workers.geometry,0);}
});
test('queued caller observer after real hash cleanup sees committed A but old J/T; no publication notification exists',()=>use(async f=>{
 const original=NodeWorker.prototype.terminate;let cleanupRequested=false,queued=false,observed;
 NodeWorker.prototype.terminate=function(...args){cleanupRequested=true;return original.apply(this,args);};
 try{
  await assign(f,roles(),{valid(){if(cleanupRequested&&!queued){queued=true;queueMicrotask(()=>{observed=snapshot(f);});}return true;}});
  await Promise.resolve();assert.ok(queued&&observed);assert.notEqual(observed.A,null);assert.equal(observed.J.revision,1);assert.notEqual(observed.T,observed.material);assert.equal(observed.authored.canUndo,false);assert.deepEqual(observed.notifications,[]);
  rows.push({id:'queued-observer-after-cleanup',scope:'real guard callback queues observer; not a nonexistent publication-notify hook',observed,postCommitNotifyFault:'OPEN: current writer emits no metadata publication'});
 }finally{NodeWorker.prototype.terminate=original;}
}));
test('normal manager native envelope Save/restore retains definitions through real validation/hash Workers, protocol replay only',()=>use(async f=>{
 await assign(f);const saved=await f.manager.snapshotForHostSave(),a=f.manager.getManufacturingMetadata();assert.deepEqual(saved.manufacturing,a);assert.equal(saved.version,2);assert.ok(!JSON.stringify(saved).includes('authoredJournal'));
 const reopened=fixture();try{
  const descriptor={run(){throw Error('NATIVE_REPLAY_NOT_RUN_PROTOCOL_FIXTURE');}};reopened.ctx.streams.operation.registry.value={WORKER_ENCLOSURE_V1:descriptor};reopened.ctx.operationService={get:()=>descriptor};
  await reopened.manager.restoreSnapshotBytesInEmptyWorkspace(new Blob([JSON.stringify(saved)]));assert.deepEqual(reopened.manager.getManufacturingMetadata(),a);
  const again=await reopened.manager.snapshotForHostSave();assert.deepEqual(again.manufacturing,saved.manufacturing);assert.deepEqual(again.project,saved.project);await reopened.drain();
  rows.push({id:'manager-native-envelope-save-restore',version:saved.version,manufacturing:saved.manufacturing,workerCounts:{...reopened.workers},scope:'actual manager, native envelope, validation/hash Workers; protocol model replay, no Native reconstruction, signed My files, server sync or actual Craft fresh-session proof'});
 }finally{await reopened.close();}
}));
test.after(()=>{
 const dir=process.env.CODI_METADATA_EVIDENCE_DIR||new URL('../../.build/manufacturing-publication-before/results/',import.meta.url).pathname;fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'observations.json'),JSON.stringify({scope:'BEFORE actual functions/Workers plus explicit protocol state; not app or native geometry',rows},null,2)+'\n');
});
