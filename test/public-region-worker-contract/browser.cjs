// Public authoring/feature commands only. Internal reads below are passive
// preservation/geometry oracles; never seeds, model publication or UI commands.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL||'http://127.0.0.1:20645/');
const cdp=new URL(process.env.CODI_TEST_CDP||'http://127.0.0.1:19329/');
const reference=process.env.CODI_REFERENCE_TEST_URL?new URL(process.env.CODI_REFERENCE_TEST_URL):null;
for(const u of[base,cdp,...(reference?[reference]:[])])assert.ok(['127.0.0.1','localhost','[::1]'].includes(u.hostname),'Loopback fixtures only');
const expected=process.env.CODI_EXPECT_APP_SHA;
assert.match(expected||'',/^[a-f0-9]{64}$/,'Bind the exact actual app before running');
async function pin(url,expectedSHA){
 const response=await fetch(new URL('static/index.bundle.js',url));assert.equal(response.status,200);
 const hash=crypto.createHash('sha256');let bytes=0;
 for await(const chunk of response.body){hash.update(chunk);bytes+=chunk.length;}
 const sha256=hash.digest('hex');assert.equal(sha256,expectedSHA);return{base:url.href,sha256,bytes};
}
const segment=(a,b)=>({kind:'Segment',role:null,data:{a:{x:a[0],y:a[1]},b:{x:b[0],y:b[1]}}});
function rectangle(x,y,w,h){const p=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];return p.map((a,i)=>segment(a,p[(i+1)%4]));}
const circle=r=>({kind:'Circle',role:null,data:{c:{x:0,y:0},r}});
(async()=>{
 const receipt={format:'codi-public-region-worker-counterexample/1',sourceBase:'6170a501616ea711df242d7c86331cfe53ff864a',scope:'Actual public authoring/discovery/feature request; passive model/source oracles. No source seeds, private operation dispatch, builds, signed Files or native suite reruns.',result:'RUNNING',rows:[]};
 const write=()=>{if(process.env.CODI_RECEIPT)fs.writeFileSync(process.env.CODI_RECEIPT,JSON.stringify(receipt,null,2)+'\n');};
 let browser;
 try{
  receipt.runtime=await pin(base,expected);
  if(reference){assert.match(process.env.CODI_REFERENCE_APP_SHA||'',/^[a-f0-9]{64}$/);receipt.referenceRuntime=await pin(reference,process.env.CODI_REFERENCE_APP_SHA);}
  browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:180000});receipt.browserVersion=await browser.version();
  async function run(name,primitives,mode,url=base){
   const context=await browser.createBrowserContext();
   try{
    const page=await context.newPage();await page.goto(new URL('index-webos.html?DEFAULT&webos=1',url));
    await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});
    const row=await page.evaluate(async({name,primitives,mode})=>{
     const c=__CAD_APP,k=c.craftService;window.regionAuditHost=new AbortController();
     c.projectService.bindHostLifetime({signal:regionAuditHost.signal,valid:()=>true});
     const errorRecord=e=>({name:e?.name||null,code:e?.code||null,message:String(e?.message||e),committed:e?.committed===true});
     const plain=value=>JSON.parse(JSON.stringify(value));
     const created=await k.createEmptySketchPlane({revision:k.inspectPrimitiveCreation().revision,unit:'millimeter',plane:'XY',depth:0}),faceId=created.faceId;
     let authoringError=null,completed=0;
     for(const primitive of primitives){try{await k.appendClosedSketchPrimitive({revision:k.inspectSketchTransitions().revision,faceId,stage:0,...primitive});completed++;}catch(e){authoringError={index:completed,error:errorRecord(e)};break;}}
     const face=c.cadRegistry.findFace(faceId),source=c.sketchStorageService.getSketchData(faceId),native=JSON.parse(source);
     const primitiveProjection=()=>face.sketchObjects.map(object=>{const p=object.sketchPrimitive,points={};for(const key of['a','b','c','p'])if(p[key]&&typeof p[key].x==='number')points[key]={x:p[key].x,y:p[key].y};return{id:object.id,construction:object.construction===true,points,...(typeof p.r==='number'?{r:p.r}:{})};});
     const regions=face.sketchRegions.map(region=>({id:region.id,descriptor:plain(region.descriptor)}));
     const advertised=k.inspectWorkerFeatureCommands();
     const row={name,mode,faceId,inputs:primitives,completed,authoringError,source,nativeObjects:native.objects,primitiveProjection:primitiveProjection(),regions,regionError:face.sketchRegionError,advertised:plain(advertised),advertisedForFace:advertised.extrusionCandidates.filter(choice=>choice.faceId===faceId)};
     if(mode==='inspect')return row;
     const request={revision:advertised.revision,faceId,regionId:row.advertisedForFace[0]?.regionId,depth:5};
     const beforeModels=k.models$.value,beforeObjects=beforeModels.slice(),beforeIndex=c.cadRegistry.modelIndex,beforeEntries=[...beforeIndex],beforeHistory=k.modifications$.value,beforeHistoryText=JSON.stringify(beforeHistory),beforeNative=JSON.stringify(c.projectManager.snapshotCurrentProject()),key=c.projectService.sketchStorageKey(faceId),beforeVersion=c.storageService.versionOf(key),beforeResources=plain(k.engineResourceUsage);
     row.request=request;row.before={native:JSON.parse(beforeNative),history:JSON.parse(beforeHistoryText),modelIds:beforeModels.map(m=>m.id),registryIds:beforeEntries.map(([id])=>id),sourceVersion:beforeVersion,resources:beforeResources};
     try{row.featureReceipt=plain(await k.createWorkerExtrusion(request));row.commandError=null;}catch(e){row.commandError=errorRecord(e);}
     const deadline=performance.now()+10000;while(k.engineResourceUsage.candidates){if(performance.now()>deadline)throw Error('Candidate cleanup did not settle');await new Promise(resolve=>setTimeout(resolve,10));}
     const afterNative=JSON.stringify(c.projectManager.snapshotCurrentProject()),afterModels=k.models$.value,afterIndex=c.cadRegistry.modelIndex;
     row.after={native:JSON.parse(afterNative),history:plain(k.modifications$.value),modelIds:afterModels.map(m=>m.id),registryIds:[...afterIndex.keys()],source:c.sketchStorageService.getSketchData(faceId),sourceVersion:c.storageService.versionOf(key),resources:plain(k.engineResourceUsage),pipelineFailure:k.pipelineFailure$.value?String(k.pipelineFailure$.value.message||k.pipelineFailure$.value):null};
     row.preservation={sourceExact:row.after.source===source,sourceVersionExact:row.after.sourceVersion===beforeVersion,historyExact:JSON.stringify(k.modifications$.value)===beforeHistoryText,historyObjectExact:k.modifications$.value===beforeHistory,modelsArrayExact:afterModels===beforeModels,modelsObjectExact:afterModels.length===beforeObjects.length&&afterModels.every((m,i)=>m===beforeObjects[i]),registryMapExact:afterIndex===beforeIndex,registryEntriesExact:afterIndex.size===beforeEntries.length&&beforeEntries.every(([id,object])=>afterIndex.get(id)===object)};
     if(row.featureReceipt)row.published=plain(k.inspectPublishedWorkerGeometry());
     // Detached owners retain accepted document ownership after releasing mounts.
     // Only in-flight candidates must settle before observation; abort releases all.
     regionAuditHost.abort();
     row.afterHostAbortResources=plain(k.engineResourceUsage);
     return row;
    },{name,primitives,mode});
    receipt.rows.push(row);write();return row;
   }finally{await context.close();}
  }
  await run('one-rectangle-positive',rectangle(0,0,10,10),'extrude');
  await run('disjoint-advertised-then-refused',[...rectangle(0,0,10,10),...rectangle(20,0,10,10)],'extrude');
  await run('circle-region-not-advertised',[circle(10)],'inspect');
  await run('three-nested-regions-not-advertised',[circle(30),circle(20),circle(10)],'inspect');
  if(reference){await run('thin-reference-projection',rectangle(0,0,.0005,1),'inspect',reference);await run('thin-fixed-projection',rectangle(0,0,.0005,1),'inspect');}
  // Independent source/region identities from the known public authored inputs.
  for(const row of receipt.rows){
   if(row.name==='thin-reference-projection')continue;
   assert.equal(row.authoringError,null,row.name);assert.equal(row.completed,row.inputs.length,row.name);
   assert.deepEqual(row.nativeObjects.map(o=>({kind:o.type,role:o.role,data:o.data})),row.inputs,row.name);
   assert.equal(row.regionError,null,row.name);
   assert.equal(row.advertised.ready,true,row.name);assert.equal(row.advertised.capabilities.extrusion,true,row.name);
   for(const region of row.regions)assert.equal(region.id,'sketch-region:'+JSON.stringify(region.descriptor));
  }
  for(const row of receipt.rows.filter(r=>r.mode==='extrude')){assert.equal(row.after.resources.candidates,0);assert.equal(row.after.resources.cleanupFailed,false);assert.deepEqual(row.afterHostAbortResources,{owners:0,mounts:0,candidates:0,accepted:0,detached:0,cleanupFailed:false});}
  const positive=receipt.rows[0];assert.equal(positive.regions.length,1);assert.equal(positive.advertisedForFace.length,1);assert.equal(positive.commandError,null);assert.ok(positive.featureReceipt?.bodyId);assert.equal(positive.preservation.sourceExact,true);assert.equal(positive.preservation.sourceVersionExact,true);
  assert.equal(positive.after.history.history.length,positive.before.history.history.length+1);
  assert.equal(positive.after.history.history.at(-1).type,'WORKER_RECTANGLE_EXTRUDE_V1');
  const body=positive.published.bodies.find(b=>b.bodyId===positive.featureReceipt.bodyId);assert.ok(body);assert.deepEqual(body.bounds,[[0,10],[0,10],[0,5]]);
  const disjoint=receipt.rows[1];assert.equal(disjoint.regions.length,2);assert.equal(disjoint.advertisedForFace.length,2);
  assert.deepEqual(disjoint.advertisedForFace.map(x=>x.regionId).sort(),disjoint.regions.map(x=>x.id).sort());
  assert.ok(disjoint.commandError);assert.equal(disjoint.commandError.code,'UNSUPPORTED_PROFILE');assert.equal(disjoint.after.pipelineFailure,null);assert.match(disjoint.commandError.message,/Four ordinary rectangle edges|Exactly four|rectangle/i);assert.equal(disjoint.commandError.committed,false);
  for(const [name,value] of Object.entries(disjoint.preservation))assert.equal(value,true,name);
  const before=structuredClone(disjoint.before.native),after=structuredClone(disjoint.after.native),beforeId=before.project.model.counters.featureId,afterId=after.project.model.counters.featureId;
  assert.equal(afterId,beforeId+1,'The attempted operation deliberately consumes one never-reused allocator ID');
  before.project.model.counters.featureId=0;after.project.model.counters.featureId=0;assert.deepEqual(after,before,'Every other native authored field must stay exact');
  disjoint.refusalStage='Semantic Worker profile preflight after public discovery/admission and feature-ID allocation; before native OCC mount allocation or publication.';
  disjoint.allocator={before:beforeId,after:afterId,policy:'One attempted feature ID is permanently skipped; this is the only native-envelope exception.'};
  assert.deepEqual(disjoint.after.resources,disjoint.before.resources,'Failed candidate resources must be released');
  assert.equal(disjoint.regions.every(r=>r.descriptor.holes.length===0&&r.descriptor.outer.length===4),true);
  for(const [index,count,holes]of[[2,1,[0]],[3,3,[1,1,0]]]){const row=receipt.rows[index];assert.equal(row.regions.length,count);assert.equal(row.advertisedForFace.length,0);assert.deepEqual(row.regions.map(r=>r.descriptor.holes.length).sort((a,b)=>b-a),holes);}
  const nested=receipt.rows[3],ids=nested.nativeObjects.map(o=>nested.faceId+'/'+o.id);
  assert.deepEqual(nested.regions.map(r=>r.descriptor),[{faceId:nested.faceId,outer:[ids[0]],holes:[[ids[1]]]},{faceId:nested.faceId,outer:[ids[1]],holes:[[ids[2]]]},{faceId:nested.faceId,outer:[ids[2]],holes:[]}]);
  if(reference){const old=receipt.rows[4],fixed=receipt.rows[5];assert.equal(fixed.regions.length,1);const match=row=>row.nativeObjects.every(o=>{const p=row.primitiveProjection.find(p=>p.id===row.faceId+'/'+o.id);return p&&['a','b'].every(k=>p.points[k]?.x===o.data[k].x&&p.points[k]?.y===o.data[k].y)});assert.equal(match(fixed),true);assert.ok(old.authoringError||old.regions.length!==1||!match(old),'Old reference must expose the reader regression');receipt.thinProjectionScope='Public authoring/projection control only; no thin-solid extrusion claim.';}
  await pin(base,expected);if(reference)await pin(reference,process.env.CODI_REFERENCE_APP_SHA);
  receipt.result='PASS';write();console.log(JSON.stringify({result:receipt.result,app:receipt.runtime.sha256,rows:receipt.rows.map(r=>({name:r.name,regions:r.regions.length,candidates:r.advertisedForFace.length,error:r.commandError||r.authoringError||null})),allocator:disjoint.allocator}));
 }catch(error){receipt.result='FAIL';receipt.error={name:error.name,message:error.message,stack:error.stack};write();throw error;}finally{browser?.disconnect();}
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
