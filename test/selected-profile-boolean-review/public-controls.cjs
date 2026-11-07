// Additional actual normal-app/public controls. No raw history/source seeds,
// private model writer, injected successful reply, or renderer/UI substitute.
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);for(const u of[base,cdp])assert(['127.0.0.1','localhost'].includes(u.hostname));assert.equal(base.port,'20683');
assert.equal(process.env.CODI_SOURCE_PIN,'32386643ab487de2ca40094549274b109822a6f4');assert.equal(process.env.CODI_EXPECT_APP_SHA,'a0e2ef4030f29d17e83b5290277480e80414bcb5a0ce10d907f73ed00d65ccc2');
async function pin(url){const r=await fetch(url);assert.equal(r.status,200);const hash=crypto.createHash('sha256');for await(const chunk of r.body)hash.update(chunk);return{url:String(url),sha256:hash.digest('hex')};}
const receipt={source:process.env.CODI_SOURCE_PIN,scope:'Additional actual public Boolean refusal/default-box/native-empty interaction controls; no signed Files/lifecycle/full Boolean corpus claim',result:'RUNNING',cases:[]};
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:180000});let context;
try{
 for(const mode of['default-box','selected-empty']){
  context=await browser.createBrowserContext();const page=await context.newPage();const response=await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base));assert.doesNotMatch(response.headers()['content-security-policy']||'',/'unsafe-eval'/);await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});receipt.app=await pin(new URL('static/index.bundle.js',base));assert.equal(receipt.app.sha256,process.env.CODI_EXPECT_APP_SHA);
  const row=await page.evaluate(async mode=>{
   const c=__CAD_APP,k=c.craftService,host=new AbortController();c.projectService.bindHostLifetime({signal:host.signal,valid:()=>true});const Native=Worker,trace=[];window.Worker=class extends Native{constructor(url,...args){super(url,...args);this.row={url:String(url),tasks:[],terminated:false};trace.push(this.row);}postMessage(data,...args){this.row.tasks.push(data?.task||data?.kind||data?.op||null);return super.postMessage(data,...args);}terminate(){this.row.terminated=true;return super.terminate();}};
   const error=e=>({name:e.name,code:e.code||null,message:e.message,committed:e.committed===true});let phase='start';const out={mode,refusals:[]};
   const snapshot=()=>({history:JSON.stringify(k.modifications$.value),sources:c.sketchStorageService.getAllSketches().map(x=>({id:x.id,bytes:c.sketchStorageService.getSketchData(x.id),version:c.storageService.versionOf(c.projectService.sketchStorageKey(x.id))})),outputs:k.inspectWorkerSolids().outputs.map(x=>({id:x.outputId,bodyId:x.bodyId,resultKind:x.resultKind,engine:x.engine,metrics:x.metrics})),streams:[k.models$.revision,k.modifications$.revision],failure:k.pipelineFailure$.value});
   const traceStamp=()=>JSON.stringify(trace);
   const reject=async(args,label)=>{const before=snapshot(),models=k.models$.value,beforeTrace=traceStamp();let refusal;try{await k.createWorkerSolidBoolean(args);}catch(e){refusal=error(e);}const after=snapshot();if(!refusal||JSON.stringify(before)!==JSON.stringify(after)||k.models$.value!==models||beforeTrace!==traceStamp())throw Error(label+' did not reject before dispatch with exact accepted state');out.refusals.push({label,error:refusal,stateExact:true,noWorkerDispatch:true});};
   try{
    if(mode==='default-box'){
     phase='public-default-box';const info=k.inspectWorkerSolids(),engine=info.engines.find(x=>x.id==='occ'),made=await k.createWorkerSolidBox({revision:info.revision,version:1,unit:'millimeter',engine:'occ',origin:[0,0,0],dimensions:[10,20,30]});out.created=made;out.advertisedDefaultRevision=engine.revision;out.final=snapshot();return out;
    }
    phase='public-three-circle-source';const plane=await k.createEmptySketchPlane({revision:k.inspectPrimitiveCreation().revision,unit:'millimeter',plane:'XY',depth:0}),faceId=plane.faceId,ids=[];
    for(const x of[0,30,60]){const made=await k.appendClosedSketchPrimitive({revision:k.inspectSketchTransitions().revision,faceId,kind:'Circle',data:{c:{x,y:0},r:10},role:null,stage:0});ids.push(made.primitive.id);}
    const source=c.sketchStorageService.getSketchData(faceId),created=[];
    for(const id of ids){const info=k.inspectSelectedProfileCommands(),d=await k.inspectSelectedProfileRegions({revision:info.revision,faceId,depth:5}),row=d.regions.find(r=>JSON.stringify(JSON.parse(r.regionId.slice(14)).outer)===JSON.stringify([faceId+'/'+id]));if(!row||row.support!=='supported')throw Error('Public circle region unavailable');created.push(await k.createSelectedProfileExtrusion({revision:info.revision,faceId,regionId:row.regionId,unit:'millimeter',engine:'occ',engineRevision:info.engineRevision,depth:5,bodyPolicy:'separate'}));}
    out.created=created;out.source=source;out.before=snapshot();
    phase='pre-dispatch-refusals';
    const request=()=>({revision:k.inspectWorkerSolids().revision,version:1,unit:'millimeter',engine:'occ',kind:'union',a:created[0].outputId,b:created[1].outputId});
    for(const[label,change]of[['unknown operand',{a:'not-a-current-output'}],['repeated operand',{b:created[0].outputId}],['wrong engine',{engine:'manifold'}],['stale revision',{revision:'stale'}],['caller cannot choose a runtime',{engineRevision:'caller-build'}]])await reject({...request(),...change},label);
    phase='public-empty-common';out.empty=await k.createWorkerSolidBoolean({...request(),kind:'common'});out.afterEmpty=snapshot();
    phase='consumed-id-refusal';await reject({...request(),a:created[0].outputId,b:created[2].outputId},'consumed earlier output');
    phase='public-empty-plus-solid';out.union=await k.createWorkerSolidBoolean({...request(),a:out.empty.outputId,b:created[2].outputId});out.final=snapshot();if(c.sketchStorageService.getSketchData(faceId)!==source)throw Error('Boolean changed authored sketch source');return out;
   }catch(e){out.phase=phase;out.error=error(e);try{out.final=snapshot();}catch{}return out;}
   finally{out.trace=trace;window.Worker=Native;}
  },mode);
  receipt.cases.push(row);assert.equal(row.error,undefined,JSON.stringify({phase:row.phase,error:row.error}));assert.equal(row.final.failure,null);
  row.workerPins=[];for(const url of[...new Set(row.trace.map(t=>new URL(t.url,base).href))])row.workerPins.push(await pin(url));
  if(mode==='default-box'){
   assert.equal(row.final.outputs.length,1);const m=row.final.outputs[0].metrics;assert.equal(row.advertisedDefaultRevision,'sha256:a84b31900e58e61a1d7e3f8d04978408455764ad149923359e7fba19d3d07884:07d763a05f35cd257501d339d9087df63c65bcaeb51a4f4f80832e333892e12e');assert.equal(m.runtime.jsSha256,'a84b31900e58e61a1d7e3f8d04978408455764ad149923359e7fba19d3d07884');assert.equal(m.runtime.wasmSha256,'07d763a05f35cd257501d339d9087df63c65bcaeb51a4f4f80832e333892e12e');assert(Math.abs(m.volumeMagnitude-6000)<1e-6);assert.deepEqual(m.bounds,{min:[0,0,0],max:[10,20,30]});
  }else{
   assert.equal(row.refusals.length,6);assert.equal(row.empty.bodyId,null);assert.equal(row.empty.resultKind,'empty');assert.equal(row.afterEmpty.outputs.length,2);const empty=row.afterEmpty.outputs.find(o=>o.id===row.empty.outputId);assert(empty);assert.equal(empty.bodyId,null);assert.equal(empty.metrics.nativeVolume,null);assert.equal(empty.metrics.nativeMeasurementQuality,null);assert.equal(empty.metrics.nativeBounds,null);assert.equal(empty.metrics.reportedVolume,0);assert.equal(empty.metrics.volumeMagnitude,0);assert.equal(empty.metrics.bounds,null);assert.equal(empty.metrics.triangleCount,0);assert.equal(empty.metrics.solidCount,0);assert.equal(empty.metrics.nativeValidity.valid,true);assert.equal(empty.metrics.nativeTopology.directChildren,0);for(const key of['solids','shells','faces','edges','vertices'])assert.equal(empty.metrics.nativeTopology.counts[key],0);
   assert.equal(row.final.outputs.length,1);const m=row.final.outputs[0].metrics;assert.equal(row.union.resultKind,'single-solid');assert.equal(m.nativeValidity.valid,true);assert.equal(m.solidCount,1);assert(Math.abs(m.nativeVolume-500*Math.PI)<1e-6);assert.deepEqual(m.nativeBounds,{min:[50,-10,0],max:[70,10,5]});
   for(const state of[row.before,row.afterEmpty,row.final])for(const output of state.outputs){assert.equal(output.metrics.runtime.jsSha256,'cbd49d63d0900f50dda7fc53518d5f06183e85b1dea720522cc2994b0876adc9');assert.equal(output.metrics.runtime.wasmSha256,'a81af0b78dd585124f3f2d05d09b4a387b276bd1f655f0234002a6ab4646a637');}
   for(const f of JSON.parse(row.final.history).history.filter(x=>x.type==='WORKER_SOLID_BOOLEAN_V1'))assert.equal(f.params.engineRevision,'sha256:cbd49d63d0900f50dda7fc53518d5f06183e85b1dea720522cc2994b0876adc9:a81af0b78dd585124f3f2d05d09b4a387b276bd1f655f0234002a6ab4646a637');
  }
  console.log('PASS actual public Boolean review',mode,JSON.stringify({refusals:row.refusals.length,resultKind:row.final.outputs[0].resultKind}));await context.close();context=null;
 }
 receipt.result='PASS scoped public controls';
}catch(e){receipt.result='FAIL';receipt.error={message:e.message,stack:e.stack};throw e;}
finally{if(process.env.CODI_RECEIPT)fs.writeFileSync(process.env.CODI_RECEIPT,JSON.stringify(receipt,null,2)+'\n');if(context)await context.close();browser.disconnect();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
