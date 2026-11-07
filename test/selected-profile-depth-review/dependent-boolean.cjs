const assert=require('node:assert/strict');
module.exports=async({fresh})=>{
 const page=await fresh();await page.evaluate(()=>sp.setup());
 const row=await page.evaluate(async()=>{
  const c=__CAD_APP,k=c.craftService,source=sp.rawCapture().sketches;let phase='first-selected';
  try{
   const first=await sp.create(),regions=await sp.inspect(),other=regions.regions.find(r=>r.regionId!==sp.regionId),info=k.inspectSelectedProfileCommands();
   phase='second-selected';const second=await k.createSelectedProfileExtrusion({...sp.request(),revision:info.revision,regionId:other.regionId});
   phase='union';const union=await k.createWorkerSolidBoolean({revision:k.inspectWorkerSolids().revision,version:1,unit:'millimeter',engine:'occ',kind:'union',a:first.outputId,b:second.outputId});
   const snapshot=()=>({history:k.modifications$.value,sources:sp.rawCapture().sketches,bodies:k.inspectWorkerSolids().bodies,features:k.inspectSelectedProfileHistory().features,journal:k.inspectAuthoredEdits()});
   const before=snapshot(),f=before.features.find(f=>f.featureId===first.featureId),edit=depth=>k.editSelectedProfileDepth({revision:k.inspectSelectedProfileHistory().revision,index:f.index,featureId:f.featureId,depth});
   phase='dependent-depth';const changed=await edit(6),after=snapshot();phase='undo';const undo=await k.authoredEditTravel({revision:k.inspectAuthoredEdits().revision,direction:'undo'}),undone=snapshot();phase='redo';const redo=await k.authoredEditTravel({revision:k.inspectAuthoredEdits().revision,direction:'redo'}),redone=snapshot();
   phase='rejected-native-depth';let rejected;try{rejected={ok:true,value:await edit(1e-12)}}catch(e){rejected={ok:false,name:e.name,code:e.code,message:e.message,committed:e.committed||false}}const afterRejected=snapshot();
   phase='no-op';const noBefore={state:snapshot(),models:k.models$.revision,history:k.modifications$.revision,epoch:k.evaluationEpoch,workers:spWorkers.length},noop=await edit(6),noAfter={state:snapshot(),models:k.models$.revision,history:k.modifications$.revision,epoch:k.evaluationEpoch,workers:spWorkers.length};
   spHost.abort();await new Promise(r=>setTimeout(r,100));return{ok:true,first,second,union,source,before,changed,after,undo,undone,redo,redone,rejected,afterRejected,noBefore,noop,noAfter,workers:spWorkers,closedResources:k.engineResourceUsage};
  }catch(e){spHost.abort();await new Promise(r=>setTimeout(r,100));return{ok:false,phase,error:{name:e.name,code:e.code,message:e.message,committed:e.committed||false},state:sp.rawCapture(),workers:spWorkers,closedResources:k.engineResourceUsage};}
 });
 assert.equal(row.ok,true,JSON.stringify(row));
 const near=(a,b)=>assert(Math.abs(a-b)<1e-6,`${a} != ${b}`);
 for(const [name,volume,depth] of [['before',15*Math.PI,3],['after',27*Math.PI,6],['undone',15*Math.PI,3],['redone',27*Math.PI,6]]){
  const state=row[name];assert.deepEqual(state.sources,row.source);assert.equal(state.bodies.length,1);const body=state.bodies[0];assert.equal(body.id,row.union.outputId);near(body.metrics.nativeVolume,volume);assert.equal(body.metrics.nativeValidity.valid,true);assert.equal(body.metrics.solidCount,2);
  for(const key of ['min','max'])for(let i=0;i<3;i++)near(body.metrics.nativeBounds[key][i],({min:[-2,-2,0],max:[11,2,depth]})[key][i]);
  assert.equal(state.features.length,2);assert.equal(state.features.find(f=>f.featureId===row.first.featureId).depth,depth);assert.equal(state.features.find(f=>f.featureId===row.second.featureId).depth,3);
  const expected=structuredClone(row.before.history);expected.history.find(h=>h.params.featureId===row.first.featureId).params.depth=depth;assert.deepEqual(state.history,expected);
 }
 assert.equal(row.rejected.ok,false);assert.equal(row.rejected.code,'ENGINE_FAILURE');assert.equal(row.rejected.committed,false);const canonical=s=>({...s,journal:{...s.journal,revision:s.journal.revision.split(':').slice(0,2).join(':')}});assert.deepEqual(canonical(row.afterRejected),canonical(row.redone));
 assert.equal(row.noop.changed,false);assert.deepEqual(row.noBefore,row.noAfter);assert.equal(row.closedResources.owners,0);assert.equal(row.closedResources.mounts,0);assert.equal(row.closedResources.cleanupFailed,false);assert(row.workers.every(w=>w.terminated));await page.close();return[row];
};
