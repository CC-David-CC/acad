// Actual normal application/public authoring and native save/fresh loader.
// No authored source seed, private geometry writer or fake Worker result.
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);for(const u of[base,cdp])assert(['127.0.0.1','localhost'].includes(u.hostname));assert.equal(base.port,process.env.CODI_EXPECT_PORT||'20685');
for(const k of['CODI_SOURCE_PIN','CODI_EXPECT_APP_SHA'])assert(new RegExp(k==='CODI_SOURCE_PIN'?'^[a-f0-9]{40}$':'^[a-f0-9]{64}$').test(process.env[k]||''),'Missing source-matched '+k);
const near=(a,b)=>assert(Math.abs(a-b)<=Math.max(1e-6,Math.abs(b)*1e-9),a+' != '+b);
async function pin(url){const r=await fetch(url);assert.equal(r.status,200);const h=crypto.createHash('sha256');for await(const block of r.body)h.update(block);return{url:String(url),sha256:h.digest('hex')};}
const receipt={source:process.env.CODI_SOURCE_PIN,scope:'Public generic-solid source regeneration, unrelated plane/primitive creation, failed-edit preservation and native save/fresh reopen; no signed Files or broad CAD1 claim',result:'RUNNING',cases:[]};
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:180000}),contexts=[];
async function fresh(){const context=await browser.createBrowserContext();contexts.push(context);const page=await context.newPage();const response=await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base));assert.doesNotMatch(response.headers()['content-security-policy']||'',/'unsafe-eval'/);await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});const app=await pin(new URL('static/index.bundle.js',base));assert.equal(app.sha256,process.env.CODI_EXPECT_APP_SHA);receipt.app=app;await page.evaluate(()=>{const c=__CAD_APP,host=new AbortController();c.projectService.bindHostLifetime({signal:host.signal,valid:()=>true});window.dependencyTrace=[];const Native=Worker;window.Worker=class extends Native{constructor(url,...args){super(url,...args);this.row={url:String(url),tasks:[],terminated:false};dependencyTrace.push(this.row);}postMessage(data,...args){this.row.tasks.push(data?.task||data?.kind||null);return super.postMessage(data,...args);}terminate(){this.row.terminated=true;return super.terminate();}};});return{page,context};}
try{
 const requested=(process.env.CODI_DEPENDENCY_CASES||'circle-union,empty-to-solid,default-box').split(',');for(const mode of requested){assert(['circle-union','empty-to-solid','default-box'].includes(mode));
  const original=await fresh();let reopened;
  try{
   const row=await original.page.evaluate(async mode=>{
    const c=__CAD_APP,k=c.craftService;let phase='start';const out={mode};
    const snapshot=()=>({history:JSON.stringify(k.modifications$.value),sources:c.sketchStorageService.getAllSketches().map(x=>({id:x.id,data:c.sketchStorageService.getSketchData(x.id),version:c.storageService.versionOf(c.projectService.sketchStorageKey(x.id))})),outputs:k.inspectWorkerSolids().outputs.map(o=>({id:o.outputId,engine:o.engine,resultKind:o.resultKind,metrics:o.metrics})),models:k.models$.value.map(m=>m.id),streams:[k.models$.revision,k.modifications$.revision],failure:k.pipelineFailure$.value});
    const empty=async(plane='XY',depth=0)=>{const info=k.inspectPrimitiveCreation();if(!info.ready)throw Error(info.reason);return k.createEmptySketchPlane({revision:info.revision,unit:'millimeter',plane,depth});};
    const append=async(faceId,kind,data)=>k.appendClosedSketchPrimitive({revision:k.inspectSketchTransitions().revision,faceId,kind,data,role:null,stage:0});
    const extrude=async(faceId,id)=>{const info=k.inspectSelectedProfileCommands(),d=await k.inspectSelectedProfileRegions({revision:info.revision,faceId,depth:5}),region=d.regions.find(r=>JSON.stringify(JSON.parse(r.regionId.slice(14)).outer)===JSON.stringify([faceId+'/'+id]));if(!region||region.support!=='supported')throw Error('Public circle region unavailable');return k.createSelectedProfileExtrusion({revision:info.revision,faceId,regionId:region.regionId,unit:'millimeter',engine:'occ',engineRevision:info.engineRevision,depth:5,bodyPolicy:'separate'});};
    try{
     if(mode==='default-box'){
      phase='default-box';const info=k.inspectWorkerSolids();out.box=await k.createWorkerSolidBox({revision:info.revision,version:1,unit:'millimeter',engine:'occ',origin:[0,0,0],dimensions:[10,20,30]});out.before=snapshot();
     }else{
      phase='source-planes';const a=await empty(),b=mode==='empty-to-solid'?await empty():a;out.faceIds=[a.faceId,b.faceId];
      out.circleIds=[(await append(a.faceId,'Circle',{c:{x:0,y:0},r:10})).primitive.id,(await append(b.faceId,'Circle',{c:{x:30,y:0},r:10})).primitive.id];
      phase='selected-solids';const first=await extrude(a.faceId,out.circleIds[0]),second=await extrude(b.faceId,out.circleIds[1]);
      phase='boolean';out.boolean=await k.createWorkerSolidBoolean({revision:k.inspectWorkerSolids().revision,version:1,unit:'millimeter',engine:'occ',kind:mode==='empty-to-solid'?'common':'union',a:first.outputId,b:second.outputId});out.before=snapshot();
      phase='public-diameter-after-boolean';const info=k.inspectSketchTransitions();if(!info.candidates.some(x=>x.faceId===a.faceId))throw Error('Original source not discoverable after Boolean');out.diameter=await k.applySketchDiameter({revision:info.revision,faceId:a.faceId,id:out.circleIds[0],diameter:mode==='empty-to-solid'?50:24});out.afterDiameter=snapshot();
      if(mode==='circle-union'){
       // The other circle has no previous diameter driver. D70 is representable
       // and consistent, but creates crossing source regions unsupported by
       // selected-profile preparation; rejection must preserve accepted state.
       phase='failed-downstream-edit';const prior=snapshot(),journal=k.inspectAuthoredEdits(),models=k.models$.value;let error;
       try{await k.applySketchDiameter({revision:k.inspectSketchTransitions().revision,faceId:b.faceId,id:out.circleIds[1],diameter:70});}catch(e){error={name:e.name,code:e.code||null,message:e.message,committed:e.committed===true};}
       const after=snapshot(),afterJournal=k.inspectAuthoredEdits(),{revision:beforeToken,...beforeIntent}=journal,{revision:afterToken,...afterIntent}=afterJournal;
       // The public revision also contains a document-currentness nonce that
       // deliberately rotates after a candidate epoch. Preserve authored
       // document/journal revision plus undo/redo metadata, not that nonce.
       const sameJournalVersion=beforeToken.split(':').slice(0,2).join(':')===afterToken.split(':').slice(0,2).join(':');
       out.refusal={error,stateExact:JSON.stringify(prior)===JSON.stringify(after),journalBefore:journal,journalAfter:afterJournal,journalVersionExact:sameJournalVersion,journalIntentExact:JSON.stringify(beforeIntent)===JSON.stringify(afterIntent)};
       if(!error||!out.refusal.stateExact||k.models$.value!==models||!sameJournalVersion||!out.refusal.journalIntentExact)throw Error('Unsupported downstream edit did not refuse atomically');
      }
     }
     phase='unrelated-plane';out.unrelated=await empty('XZ',7);phase='unrelated-primitive';out.point=await append(out.unrelated.faceId,'Point',{x:3,y:4});out.final=snapshot();
     phase='native-save';const saved=await c.projectManager.prepareHostSave();if(!saved.isCurrent())throw Error('Native save became stale');out.saved=saved.envelope;out.trace=dependencyTrace;return out;
    }catch(e){out.phase=phase;out.error={name:e.name,code:e.code||null,message:e.message,stack:e.stack};try{out.final=snapshot();}catch{}out.trace=dependencyTrace;return out;}
   },mode);
   receipt.cases.push(row);assert.equal(row.error,undefined,JSON.stringify({mode,phase:row.phase,error:row.error}));assert.equal(row.final.failure,null);
   const before=row.before.outputs[0],final=row.final.outputs[0];assert.equal(row.before.outputs.length,1);assert.equal(row.final.outputs.length,1);assert.equal(final.id,before.id,'Output identity survives regeneration');
   if(mode==='circle-union'){assert.equal(before.metrics.solidCount,2);near(before.metrics.nativeVolume,1000*Math.PI);assert.equal(final.metrics.solidCount,2);assert.equal(final.metrics.nativeValidity.valid,true);near(final.metrics.nativeVolume,1220*Math.PI);assert.deepEqual(final.metrics.nativeBounds,{min:[-12,-12,0],max:[40,12,5]});assert.equal(row.refusal.stateExact,true);}
   else if(mode==='empty-to-solid'){assert.equal(before.resultKind,'empty');assert.equal(before.metrics.solidCount,0);assert.equal(final.resultKind,'single-solid');assert.equal(final.metrics.nativeValidity.valid,true);const R=25,r=10,d=30,area=R*R*Math.acos((d*d+R*R-r*r)/(2*d*R))+r*r*Math.acos((d*d+r*r-R*R)/(2*d*r))-.5*Math.sqrt((-d+R+r)*(d+R-r)*(d-R+r)*(d+R+r));near(final.metrics.nativeVolume,area*5);row.independentLensVolume=area*5;}
   else{assert.equal(final.metrics.runtime.jsSha256,'a84b31900e58e61a1d7e3f8d04978408455764ad149923359e7fba19d3d07884');near(final.metrics.volumeMagnitude,6000);assert.deepEqual(final.metrics.nativeBounds,before.metrics.nativeBounds);}
   row.workerPins=[];for(const url of[...new Set(row.trace.map(t=>new URL(t.url,base).href))])row.workerPins.push(await pin(url));
   reopened=await fresh();const restored=await reopened.page.evaluate(async saved=>{const c=__CAD_APP;await c.projectManager.restoreSnapshotBytesInEmptyWorkspace(new Blob([JSON.stringify(saved)],{type:'application/json'}));return{history:JSON.stringify(c.craftService.modifications$.value),sources:c.sketchStorageService.getAllSketches().map(x=>({id:x.id,data:c.sketchStorageService.getSketchData(x.id)})),outputs:c.craftService.inspectWorkerSolids().outputs.map(o=>({id:o.outputId,engine:o.engine,resultKind:o.resultKind,metrics:o.metrics})),failure:c.craftService.pipelineFailure$.value,trace:dependencyTrace};},row.saved);
   assert.equal(restored.history,row.final.history);assert.deepEqual(restored.sources,row.final.sources.map(({id,data})=>({id,data})));assert.equal(restored.failure,null);assert.equal(restored.outputs.length,1);const restoredOutput=restored.outputs[0];assert.equal(restoredOutput.id,final.id);assert.equal(restoredOutput.resultKind,final.resultKind);assert.deepEqual(restoredOutput.metrics.runtime,final.metrics.runtime);assert.equal(restoredOutput.metrics.solidCount,final.metrics.solidCount);if(final.metrics.nativeVolume!==null)near(restoredOutput.metrics.nativeVolume,final.metrics.nativeVolume);else near(restoredOutput.metrics.volumeMagnitude,final.metrics.volumeMagnitude);assert.deepEqual(restoredOutput.metrics.nativeBounds,final.metrics.nativeBounds);
   row.restored=restored;row.reopenWorkerPins=[];for(const url of[...new Set(restored.trace.map(t=>new URL(t.url,base).href))])row.reopenWorkerPins.push(await pin(url));delete row.saved;console.log('PASS actual generic source dependencies',mode,JSON.stringify({resultKind:final.resultKind,nativeVolume:final.metrics.nativeVolume,nativeReopen:true}));
  }finally{await original.context.close();if(reopened)await reopened.context.close();}
 }
 receipt.result='PASS scoped public regeneration/native persistence';
}catch(e){receipt.result='FAIL';receipt.error={message:e.message,stack:e.stack};throw e;}
finally{if(process.env.CODI_RECEIPT)fs.writeFileSync(process.env.CODI_RECEIPT,JSON.stringify(receipt,null,2)+'\n');for(const c of contexts)await c.close().catch(()=>{});browser.disconnect();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
