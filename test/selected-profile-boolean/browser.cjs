// Actual public authoring and Boolean commands; no native source seeds.
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);
for(const u of[base,cdp])assert(['localhost','127.0.0.1'].includes(u.hostname));
for(const key of['CODI_SOURCE_PIN','CODI_EXPECT_APP_SHA'])assert(new RegExp(key==='CODI_SOURCE_PIN'?'^[a-f0-9]{40}$':'^[a-f0-9]{64}$').test(process.env[key]||''));
assert(process.env.CODI_RUNTIME_PINS,'Supply the source-matched runtime pin file.');
const runtimePins=JSON.parse(fs.readFileSync(process.env.CODI_RUNTIME_PINS,'utf8'));
assert.equal(runtimePins.source,process.env.CODI_SOURCE_PIN);assert.equal(runtimePins.files['index.bundle.js'],process.env.CODI_EXPECT_APP_SHA);
const near=(a,b)=>assert(Math.abs(a-b)<=Math.max(1e-6,Math.abs(b)*1e-9),`${a} != ${b}`);
(async()=>{
 const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:180000}),contexts=[];
 const receipt={source:process.env.CODI_SOURCE_PIN,scope:'Public selected-profile operands and Boolean; independently measured geometry, owned rollback and native fresh replay. No signed Files or full CAD gate claim.',result:'RUNNING',cases:[],assets:[]};
 async function fresh(){const context=await browser.createBrowserContext();contexts.push(context);const page=await context.newPage();const response=await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base));assert.doesNotMatch(response.headers()['content-security-policy']||'',/'unsafe-eval'/);await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});
  const url=await page.evaluate(()=>[...document.scripts].map(s=>s.src).find(x=>/\/static\/index.bundle.js$/.test(x))),bytes=Buffer.from(await(await fetch(url)).arrayBuffer()),sha=crypto.createHash('sha256').update(bytes).digest('hex');assert.equal(sha,process.env.CODI_EXPECT_APP_SHA);receipt.app={url,sha256:sha};
  for(const [name,expected]of Object.entries(runtimePins.files)){
   const assetUrl=new URL('static/'+name,base),r=await fetch(assetUrl);assert.equal(r.status,200);const hash=crypto.createHash('sha256');let size=0;for await(const chunk of r.body){hash.update(chunk);size+=chunk.length;}const actual=hash.digest('hex');assert.equal(actual,expected,name);
   if(!receipt.assets.some(x=>x.url===assetUrl.href))receipt.assets.push({url:assetUrl.href,sha256:actual,bytes:size});
  }
  await page.evaluate(()=>{window.booleanHost=new AbortController();__CAD_APP.projectService.bindHostLifetime({signal:booleanHost.signal,valid:()=>true});});return{context,page};
 }
 try{
  for(const kind of(process.env.CODI_BOOLEAN_CASES||'union,subtract,common').split(',')){
   assert(['union','subtract','common'].includes(kind));const {context,page}=await fresh();
   const result=await page.evaluate(async kind=>{
    const c=__CAD_APP,k=c.craftService;
    const snapshot=()=>({history:JSON.stringify(k.modifications$.value),sources:c.sketchStorageService.getAllSketches().map(x=>({id:x.id,data:c.sketchStorageService.getSketchData(x.id)})),bodies:k.inspectWorkerSolids().bodies.map(x=>({id:x.id,featureId:x.featureId,engine:x.engine,metrics:x.metrics}))});
    async function disk(x){const plane=await k.createEmptySketchPlane({revision:k.inspectPrimitiveCreation().revision,unit:'millimeter',plane:'XY',depth:0});
     const primitive=await k.appendClosedSketchPrimitive({revision:k.inspectSketchTransitions().revision,faceId:plane.faceId,kind:'Circle',data:{c:{x,y:0},r:10},role:null,stage:0});
     const info=k.inspectSelectedProfileCommands(),regions=await k.inspectSelectedProfileRegions({revision:info.revision,faceId:plane.faceId,depth:5});
     if(regions.regions.length!==1||regions.regions[0].support!=='supported')throw Error('Expected one disk');
     const solid=await k.createSelectedProfileExtrusion({revision:info.revision,faceId:plane.faceId,regionId:regions.regions[0].regionId,unit:'millimeter',engine:'occ',engineRevision:info.engineRevision,depth:5,bodyPolicy:'separate'});
     return{plane:plane.faceId,primitive:primitive.primitive.id,solid};}
    const a=await disk(0),b=await disk(10),before=snapshot(),modelRef=k.models$.value;
    const args={revision:k.inspectWorkerSolids().revision,version:1,unit:'millimeter',engine:'occ',kind,a:a.solid.outputId,b:b.solid.outputId};
    let value,error;try{value=await k.createWorkerSolidBoolean(args);}catch(e){error={name:e.name,code:e.code,message:e.message};}
    const after=snapshot();if(error)return{kind,a,b,error,before,after,sameModels:k.models$.value===modelRef};
    const saved=await c.projectManager.prepareHostSave();if(!saved.isCurrent())throw Error('Native save became stale');
    return{kind,a,b,value,before,after,saved:saved.envelope};
   },kind);receipt.cases.push(result);
   for(const body of result.before.bodies){near(body.metrics.nativeVolume,500*Math.PI);assert.equal(body.metrics.nativeValidity.valid,true);}
   if(process.env.CODI_EXPECT_FAILURE){assert(result.error,'Expected baseline failure');assert.equal(result.error.code,process.env.CODI_EXPECT_FAILURE);assert.deepEqual(result.after,result.before);assert.equal(result.sameModels,true);console.log('BASELINE preserved rejection',kind,result.error.code);}
   else{
    assert(!result.error,JSON.stringify(result.error));assert.equal(result.after.bodies.length,1);const body=result.after.bodies[0],intersection=1000*Math.PI/3-250*Math.sqrt(3),volume=kind==='common'?intersection:kind==='union'?1000*Math.PI-intersection:500*Math.PI-intersection;
    near(body.metrics.nativeVolume,volume);assert.equal(body.metrics.nativeValidity.valid,true);assert.equal(body.metrics.solidCount,1);assert.deepEqual(result.after.sources,result.before.sources);
    const record=JSON.parse(result.after.history).history.at(-1);assert.equal(record.type,'WORKER_SOLID_BOOLEAN_V1');assert.equal(record.params.engineRevision,result.a.solid.engineRevision);assert.equal(record.params.engineRevision,result.b.solid.engineRevision);assert.equal(record.params.kind,kind);
    const expected=kind==='common'?{min:[0,-Math.sqrt(75),0],max:[10,Math.sqrt(75),5]}:kind==='union'?{min:[-10,-10,0],max:[20,10,5]}:{min:[-10,-10,0],max:[5,10,5]};
    for(const key of['min','max'])for(let i=0;i<3;i++)near(body.metrics.nativeBounds[key][i],expected[key][i]);
    const reopened=await fresh(),restored=await reopened.page.evaluate(async saved=>{const c=__CAD_APP;await c.projectManager.restoreSnapshotBytesInEmptyWorkspace(new Blob([JSON.stringify(saved)],{type:'application/json'}));return{history:JSON.stringify(c.craftService.modifications$.value),sources:c.sketchStorageService.getAllSketches().map(x=>({id:x.id,data:c.sketchStorageService.getSketchData(x.id)})),bodies:c.craftService.inspectWorkerSolids().bodies.map(x=>({id:x.id,metrics:x.metrics}))};},result.saved);
    assert.deepEqual(JSON.parse(restored.history),JSON.parse(result.after.history));assert.deepEqual(restored.sources,result.after.sources);assert.equal(restored.bodies.length,1);assert.equal(restored.bodies[0].id,body.id);near(restored.bodies[0].metrics.nativeVolume,volume);assert.equal(restored.bodies[0].metrics.nativeValidity.valid,true);result.reopened=restored;delete result.saved;
    console.log('PASS public profile Boolean and fresh native replay',kind,volume);await reopened.context.close();
   }
   await context.close();
  }receipt.result='PASS';
 }catch(e){receipt.result='FAIL';receipt.error={message:e.message,stack:e.stack};throw e;}
 finally{if(process.env.CODI_RECEIPT)fs.writeFileSync(process.env.CODI_RECEIPT,JSON.stringify(receipt,null,2)+'\n');for(const c of contexts)try{await c.close();}catch{}browser.disconnect();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
