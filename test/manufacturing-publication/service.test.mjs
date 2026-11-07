// Actual source methods and real hash/metadata/validation Workers; accepted
// model/tip/replay is explicitly a PROTOCOL fixture, never Native geometry.
import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,snapshot,assign,travel,roles} from './harness.mjs';
import {installBody,request} from '../generic-manufacturing-assignment/admission-fixture.mjs';
import {emptyAuthoredEditJournal,recordExtrusionEdit} from '../../web/app/cad/craft/authoredEditJournal.mjs';
const stable=s=>({A:s.A,J:s.J,T:s.T,material:s.material,revision:s.revision,history:s.history,models:s.models,epoch:s.epoch,counters:s.counters,storageRevision:s.storageRevision});
async function use(fn){const f=setup();try{await fn(f);}finally{await f.cleanup();assert.equal(f.workers.geometry,0);assert.equal(f.publicationWorkers.usage.created,f.publicationWorkers.usage.terminated);assert.deepEqual(f.publicationWorkers.usage.errors,[]);}}
test('actual enclosure assignment/role edit jointly installs A/J/T before first observer',()=>use(async f=>{
 const before=snapshot(f),seen=[];let armed=false;const detach=f.journal$.attach(()=>{if(armed)seen.push(snapshot(f));});armed=true;
 await assign(f);const after=snapshot(f);assert.equal(seen.length,1);assert.equal(seen[0].J.revision,before.J.revision+1);assert.equal(seen[0].T,seen[0].material);assert.equal(seen[0].authored.undoTarget.kind,'document-metadata');assert.equal(seen[0].authored.canUndo,true);assert.notEqual(seen[0].A,null);
 assert.equal(after.history,before.history);assert.equal(after.models,before.models);assert.equal(after.epoch,before.epoch);assert.deepEqual(after.counters,before.counters);assert.equal(after.storageRevision,before.storageRevision);
 const edited=roles();edited.BODY={material:{id:'abs',name:'ABS'},appearance:{id:'black',name:'Black',color:'#000000'}};await assign(f,edited);assert.equal(snapshot(f).J.revision,3);assert.equal(f.manager.getManufacturingMetadata().objects[0].regions[0].materialId,'abs');detach();
}));
test('diagnostic wrapper of real Worker reply proves main publication does not traverse metadata payload arrays',()=>use(async f=>{
 let armed=true,attempts=0;
 f.publicationWorkers.setReplyMap(data=>{
  if(data.kind!=='manufacturing-prepared'||!data.after)return data;
  const after={...data.after};for(const key of ['materials','appearances','bindings','objects'])after[key]=new Proxy(after[key],Object.fromEntries(['get','ownKeys','getOwnPropertyDescriptor','getPrototypeOf'].map(trap=>[trap,(...args)=>{if(armed){attempts++;throw Error('Unexpected main payload traversal');}return Reflect[trap](...args);}])));
  return {...data,after};
 });
 await assign(f);armed=false;assert.equal(attempts,0);assert.equal(f.manager.getManufacturingMetadata().objects.length,2);assert.equal(f.craft.inspect().canUndo,true);
 // Instrumentation adds proxies after a genuine Worker result; it is a
 // structural no-traversal control, not a normal transport or Native proof.
}));
test('metadata Undo/Redo uses same journal, restores exact payload and leaves prior geometry travel route available',()=>use(async f=>{
 await assign(f);const accepted=f.manager.getManufacturingMetadata(),before=snapshot(f),hashes=f.workers.hash,workers=f.publicationWorkers.usage.created;
 await travel(f,'undo');let info=f.craft.inspect();assert.equal(f.manager.getManufacturingMetadata(),null);assert.equal(info.canRedo,true);assert.equal(info.undoTarget.kind,'extrusion-depth');assert.equal(info.canUndo,true);
 assert.throws(()=>f.craft.travel({revision:info.revision,direction:'undo'}),/GEOMETRY_REPLAY_NOT_RUN_PROTOCOL_FIXTURE/);assert.equal(f.delegates.length,1);f.delegates.length=0;
 await travel(f,'redo');assert.deepEqual(f.manager.getManufacturingMetadata(),accepted);assert.equal(f.craft.inspect().canUndo,true);assert.equal(f.craft.tip(),f.manager.inspectMaterialSurfaceRevision());assert.equal(f.workers.hash,hashes);assert.equal(f.publicationWorkers.usage.created,workers+2);
 const after=snapshot(f);assert.equal(after.history,before.history);assert.equal(after.models,before.models);assert.equal(after.epoch,before.epoch);
}));
test('canonical no-op preserves all A/J/T/revisions/storage and does not truncate redo',()=>use(async f=>{
 await assign(f);const a=roles();a.BODY={material:{id:'abs',name:'ABS'},appearance:null};await assign(f,a);await travel(f,'undo');const before=snapshot(f);assert.equal(before.authored.canRedo,true);
 await assign(f,roles());assert.deepEqual(stable(snapshot(f)),stable(before));assert.equal(f.craft.inspect().canRedo,true);
}));
test('conflict/stale/preabort reject with exact accepted A/J/T and redo state preserved',()=>use(async f=>{
 await assign(f);const before=snapshot(f),bad=roles();bad.BODY.material.name='Changed immutable material ID';await assert.rejects(assign(f,bad));assert.deepEqual(stable(snapshot(f)),stable(before));
 await assert.rejects(assign(f,roles(),{revision:'stale'}));const c=new AbortController();c.abort();await assert.rejects(assign(f,roles(),{signal:c.signal}));assert.deepEqual(stable(snapshot(f)),stable(before));
}));
test('genuine held metadata Worker result cancellation releases owner and late delivery cannot commit',()=>use(async f=>{
 const before=snapshot(f),ready=f.publicationWorkers.hold(),c=new AbortController(),pending=assign(f,roles(),{signal:c.signal});await ready;c.abort();await assert.rejects(pending,{name:'AbortError'});f.publicationWorkers.release();await f.publicationWorkers.drain();assert.deepEqual(stable(snapshot(f)),stable(before));
}));
test('post-Worker caller callback reentrancy cannot bypass last pure A/J/T preflight',()=>use(async f=>{
 const before=snapshot(f);let changed=false;await assert.rejects(assign(f,roles(),{valid(){if(f.publicationWorkers.usage.terminated&&!changed){changed=true;f.ctx.surfacingService.state$.value.revision++;}return true;}}));
 assert.ok(changed);assert.deepEqual(f.manager.getManufacturingMetadata(),before.A);assert.deepEqual(f.journal$.value,before.J);assert.equal(f.craft.tip(),before.T);
}));
test('ordinary observer throw is logged after commit and entry stays Undoable',()=>use(async f=>{
 let armed=false;const failure=new Error('injected observer'),original=console.error,logs=[];console.error=(...a)=>logs.push(a);const detach=f.journal$.attach(()=>{if(armed)throw failure;});armed=true;
 try{await assign(f);assert.ok(logs.length);assert.equal(f.craft.inspect().canUndo,true);assert.equal(f.journal$.value.entries.at(-1).kind,'document-metadata');}finally{detach();console.error=original;}
 await travel(f,'undo');assert.equal(f.manager.getManufacturingMetadata(),null);
}));
test('escaping notification failure is committed:true with exact cause, no rollback',()=>use(async f=>{
 const cause=0,original=f.update$.nextGuarded;f.update$.nextGuarded=()=>{throw cause;};
 await assert.rejects(assign(f),error=>{assert.equal(error.committed,true);assert.equal(error.cause,cause);return true;});f.update$.nextGuarded=original;
 assert.equal(f.craft.inspect().canUndo,true);assert.notEqual(f.manager.getManufacturingMetadata(),null);await travel(f,'undo');assert.equal(f.manager.getManufacturingMetadata(),null);
}));
test('observer caller loss/cancel/Close preserve committed entry and refuse normal success',async()=>{
 for(const mode of ['valid','abort','close'])await use(async f=>{
  let valid=true,armed=false;const c=new AbortController(),seen=[];const detach=f.journal$.attach(()=>{if(!armed)return;seen.push(snapshot(f));if(mode==='valid')valid=false;else if(mode==='abort')c.abort();else f.project.dispose();});armed=true;
  await assert.rejects(assign(f,roles(),{signal:c.signal,valid:()=>valid}),error=>{assert.equal(error.committed,true);return true;});detach();assert.equal(seen.length,1);assert.equal(seen[0].T,seen[0].material);assert.equal(seen[0].authored.canUndo,true);assert.equal(f.journal$.value.entries.at(-1).kind,'document-metadata');
 });
});
test('observer starts a second real metadata operation in the same chronology without rollback',()=>use(async f=>{
 let next;const changed=roles();changed.BODY={material:{id:'second',name:'Second'},appearance:null};let armed=false;const detach=f.journal$.attach(()=>{if(armed&&!next){next=assign(f,changed);}});armed=true;
 await assign(f);await next;detach();assert.equal(f.journal$.value.entries.length,3);assert.equal(f.manager.getManufacturingMetadata().objects[0].regions[0].materialId,'second');await travel(f,'undo');assert.equal(f.manager.getManufacturingMetadata().objects[0].regions[0].materialId,'pla');
}));
test('concurrent preparations have one accepted publication; stale loser cannot append a second entry',()=>use(async f=>{
 const a=roles(),b=roles();b.BODY={material:{id:'race-second',name:'Race second'},appearance:null};const results=await Promise.allSettled([assign(f,a),assign(f,b)]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(f.journal$.value.entries.length,2);assert.equal(f.craft.tip(),f.manager.inspectMaterialSurfaceRevision());
}));
test('actual rebind is prepared read-only then uses same commit/travel; stale review token refuses',()=>use(async f=>{
 await assign(f);const old=f.manager.getManufacturingMetadata(),previous=f.ctx.craftService.modifications$.value;
 // Explicit accepted geometry/history protocol transition, NOT Native replay.
 f.ctx.craftService.modifications$.value={history:Object.freeze([{...previous.history[0],params:Object.freeze({...previous.history[0].params,width:150})}]),pointer:0};
 f.journal$.next(recordExtrusionEdit(f.journal$.value,{document:1,revision:f.journal$.value.revision,index:0,featureId:7,before:100,after:150}));f.installProtocolAcceptedTip();
 const before=snapshot(f),p=await f.manager.proposeHostManufacturingRebind();assert.deepEqual(stable(snapshot(f)),stable(before));f.manager.confirmHostManufacturingRebind(p.token);const after=f.manager.getManufacturingMetadata();assert.notEqual(after.revision,old.revision);assert.equal(f.craft.tip(),f.manager.inspectMaterialSurfaceRevision());await travel(f,'undo');assert.deepEqual(f.manager.getManufacturingMetadata(),old);await travel(f,'redo');assert.deepEqual(f.manager.getManufacturingMetadata(),after);
 const stale=await f.manager.proposeHostManufacturingRebind();const changed=roles();changed.BODY={material:{id:'newer',name:'Newer'},appearance:null};await assign(f,changed);const current=snapshot(f);assert.throws(()=>f.manager.confirmHostManufacturingRebind(stale.token));assert.deepEqual(stable(snapshot(f)),stable(current));
}));
test('generic shared setter uses actual class/custody admission fixture and actual Worker metadata, not Native geometry',()=>use(async f=>{
 const body=installBody(f);f.installProtocolAcceptedTip();const info=f.manager.inspectGenericManufacturingParts();assert.equal(info.publication,'shared-metadata-transaction-v1');const result=await f.manager.assignGenericManufacturingParts(request(info.revision,body.model));assert.equal(result.changed,true);assert.equal(f.manager.getManufacturingMetadata().bindings[0].featureId,7);assert.equal(f.craft.inspect().undoTarget.kind,'document-metadata');await travel(f,'undo');assert.equal(f.manager.getManufacturingMetadata(),null);await travel(f,'redo');assert.equal(f.manager.getManufacturingMetadata().objects.length,1);
}));
test('initial caller reentrancy cannot silently adopt a newer generic request revision',()=>use(async f=>{
 const body=installBody(f);f.installProtocolAcceptedTip();const input=request(f.manager.inspectGenericManufacturingParts().revision,body.model),before=snapshot(f);let changed=false;
 await assert.rejects(f.manager.assignGenericManufacturingParts(input,{valid(){if(!changed){changed=true;f.manager.setDisplayUnits({revision:f.manager.inspectDisplayUnits().revision,lengthUnit:'inch'});}return true;}}));
 assert.equal(f.manager.getManufacturingMetadata(),before.A);assert.deepEqual(f.journal$.value,before.J);assert.equal(f.craft.tip(),before.T);assert.equal(f.publicationWorkers.usage.created,0);
}));
test('initial caller rebind cannot make an older enclosure request current',()=>use(async f=>{
 await assign(f);const previous=f.ctx.craftService.modifications$.value;f.ctx.craftService.modifications$.value={history:[{...previous.history[0],params:{...previous.history[0].params,width:150}}],pointer:0};f.journal$.next(recordExtrusionEdit(f.journal$.value,{document:1,revision:f.journal$.value.revision,index:0,featureId:7,before:100,after:150}));f.installProtocolAcceptedTip();
 const p=await f.manager.proposeHostManufacturingRebind();let expected,triggered=false;const changed=roles();changed.BODY={material:{id:'stale-intent',name:'Stale intent'},appearance:null};
 await assert.rejects(assign(f,changed,{valid(){if(!triggered){triggered=true;f.manager.confirmHostManufacturingRebind(p.token);expected=snapshot(f);}return true;}}));
 assert.ok(expected);assert.deepEqual(stable(snapshot(f)),stable(expected));
}));
test('native envelope manager save/restore preserves definitions; fresh protocol session can reedit/Undo',()=>use(async f=>{
 await assign(f);const saved=await f.manager.snapshotForHostSave(),metadata=f.manager.getManufacturingMetadata(),opened=setup({empty:true});
 try{
  await opened.manager.restoreSnapshotBytesInEmptyWorkspace(new Blob([JSON.stringify(saved)]));
  assert.deepEqual(opened.manager.getManufacturingMetadata(),metadata);opened.ctx.cadRegistry.shells=opened.protocolModels;opened.ctx.craftService.models$.value=opened.protocolModels;opened.journal$.next(emptyAuthoredEditJournal(opened.project.documentGeneration,0));opened.installProtocolAcceptedTip();assert.equal(opened.craft.inspect().canUndo,false);
  const changed=roles();changed.BODY={material:{id:'after-open',name:'After Open'},appearance:null};await assign(opened,changed);assert.equal(opened.craft.inspect().canUndo,true);await travel(opened,'undo');assert.deepEqual(opened.manager.getManufacturingMetadata(),metadata);
 }finally{await opened.cleanup();}
 // Actual validation/manager, but model rebuild/session setup are explicit
 // protocol fixtures; no signed Files or Native reconstruction claim.
}));
