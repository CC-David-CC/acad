// Bounded observation after a genuine public selected-profile Boolean.
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);for(const u of[base,cdp])assert(['127.0.0.1','localhost'].includes(u.hostname));assert.equal(base.port,'20683');
const appSHA='a0e2ef4030f29d17e83b5290277480e80414bcb5a0ce10d907f73ed00d65ccc2',source='32386643ab487de2ca40094549274b109822a6f4';
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:180000});const context=await browser.createBrowserContext(),receipt={source,scope:'Actual post-Boolean source diameter/full-replay and unrelated-plane availability probe; no source/product edits',result:'RUNNING'};
try{
 const page=await context.newPage();await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base));await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});const response=await fetch(new URL('static/index.bundle.js',base));assert.equal(response.status,200);const hash=crypto.createHash('sha256');for await(const chunk of response.body)hash.update(chunk);receipt.appSHA256=hash.digest('hex');assert.equal(receipt.appSHA256,appSHA);
 receipt.actual=await page.evaluate(async()=>{
  const c=__CAD_APP,k=c.craftService,host=new AbortController();c.projectService.bindHostLifetime({signal:host.signal,valid:()=>true});let workers=0;const Native=Worker;window.Worker=class extends Native{constructor(...a){super(...a);workers++;}};
  const error=e=>({name:e.name,code:e.code||null,message:e.message,committed:e.committed===true});let faceId;const capture=()=>({history:JSON.stringify(k.modifications$.value),source:c.sketchStorageService.getSketchData(faceId),version:c.storageService.versionOf(c.projectService.sketchStorageKey(faceId)),outputs:k.inspectWorkerSolids().outputs.map(o=>({id:o.outputId,resultKind:o.resultKind,engine:o.engine,metrics:o.metrics})),models:k.models$.value.map(m=>m.id),streams:[k.models$.revision,k.modifications$.revision],failure:k.pipelineFailure$.value});
  try{
   faceId=(await k.createEmptySketchPlane({revision:k.inspectPrimitiveCreation().revision,unit:'millimeter',plane:'XY',depth:0})).faceId;const ids=[];
   for(const x of[0,30])ids.push((await k.appendClosedSketchPrimitive({revision:k.inspectSketchTransitions().revision,faceId,kind:'Circle',data:{c:{x,y:0},r:10},role:null,stage:0})).primitive.id);
   const outputs=[];for(const id of ids){const info=k.inspectSelectedProfileCommands(),d=await k.inspectSelectedProfileRegions({revision:info.revision,faceId,depth:5}),region=d.regions.find(r=>JSON.stringify(JSON.parse(r.regionId.slice(14)).outer)===JSON.stringify([faceId+'/'+id]));outputs.push(await k.createSelectedProfileExtrusion({revision:info.revision,faceId,regionId:region.regionId,unit:'millimeter',engine:'occ',engineRevision:info.engineRevision,depth:5,bodyPolicy:'separate'}));}
   const union=await k.createWorkerSolidBoolean({revision:k.inspectWorkerSolids().revision,version:1,unit:'millimeter',engine:'occ',kind:'union',a:outputs[0].outputId,b:outputs[1].outputId}),before=capture(),rows=[];
   for(const operation of['diameter','unrelated-plane']){
    const prior=capture(),info=operation==='diameter'?k.inspectSketchTransitions():k.inspectPrimitiveCreation(),count=workers;let value,refusal;
    try{value=operation==='diameter'?await k.applySketchDiameter({revision:info.revision,faceId,id:ids[0],diameter:24}):await k.createEmptySketchPlane({revision:info.revision,unit:'millimeter',plane:'XZ',depth:7});}catch(e){refusal=error(e);}
    const after=capture();rows.push({operation,readiness:info,...(refusal?{error:refusal,stateExact:JSON.stringify(prior)===JSON.stringify(after),noWorkerDispatch:workers===count}:{value,accepted:true}),before:prior,after});
   }
   return{faceId,circleIds:ids,union,before,rows,final:capture()};
  }finally{window.Worker=Native;}
 });
 const a=receipt.actual;assert.equal(a.before.outputs.length,1);const m=a.before.outputs[0].metrics;assert.equal(m.nativeValidity.valid,true);assert.equal(m.solidCount,2);assert(Math.abs(m.nativeVolume-1000*Math.PI)<1e-6);
 for(const row of a.rows)if(row.error){assert.equal(row.stateExact,true);assert.equal(row.noWorkerDispatch,true);assert.equal(row.error.committed,false);}
 receipt.gapConfirmed=a.rows.every(r=>r.error&&r.stateExact&&r.noWorkerDispatch);receipt.result='PASS bounded observation';console.log('PASS parametric boundary recorded',JSON.stringify({gapConfirmed:receipt.gapConfirmed,rows:a.rows.map(r=>({operation:r.operation,readiness:r.readiness,error:r.error,stateExact:r.stateExact}))}));
}catch(e){receipt.result='FAIL';receipt.error={message:e.message,stack:e.stack};throw e;}
finally{if(process.env.CODI_RECEIPT)fs.writeFileSync(process.env.CODI_RECEIPT,JSON.stringify(receipt,null,2)+'\n');await context.close();browser.disconnect();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
