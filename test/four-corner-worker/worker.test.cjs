// Production Worker source with a research native runtime; no host/model publication.
const assert=require('node:assert/strict');const puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const url=new URL(process.env.CODI_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);
if(![url,cdp].every(x=>x.protocol==='http:'&&['127.0.0.1','localhost','[::1]'].includes(x.hostname)))throw Error('Loopback endpoints required');
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href}),context=await browser.createBrowserContext(),page=await context.newPage();try{
 await page.exposeFunction('__probeWorkerCount',()=>page.workers().length);
 const response=await page.goto(url.href);assert.match(response.headers()['content-security-policy'],/script-src 'self' 'wasm-unsafe-eval'/);
 const glueHash='a8774acbbe3a90d7c82fe294c769096179eae351e5a8c854d4d0a31737a706ee';
 const wasmHash=process.env.CODI_TEST_WASM_SHA||'0e08888f09c34f79b858cefc2859cbb59fbea1af6505b04686343eac7f9efc5b';
 if(!['0e08888f09c34f79b858cefc2859cbb59fbea1af6505b04686343eac7f9efc5b','13617eda9a2118edfd1244b5d46523e7d9628a87ec995a0237b2b5cc58d532f2'].includes(wasmHash))throw Error('Unexpected native runtime pin');
 const cases=await page.evaluate(async({glueHash,wasmHash})=>{
  const frame={origin:[0,0,7],x:[1,0,0],y:[0,1,0],z:[0,0,1]},faceId='S:0/SURFACE',d='/static/';
  async function run(width,height,depth,partialMode=false){
   const sketchWorker=new Worker(d+'sketch-worker.js');const draft=await new Promise((yes,no)=>{sketchWorker.onmessage=e=>{sketchWorker.terminate();yes(e.data)};sketchWorker.onerror=e=>no(Error(e.message));sketchWorker.postMessage({task:'rectangle',revision:'r',unit:'millimeter',frame,origin:[10000,20000],width,height})});if(!draft.ok)throw Error('sketch failed');
   const sketchJSON=draft.serializedSketch,sketchDigest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(sketchJSON)))].map(x=>x.toString(16).padStart(2,'0')).join('');
   const regionId='sketch-region:'+JSON.stringify({faceId,outer:draft.sketch.objects.map(o=>faceId+'/'+o.id).sort(),holes:[]});
   const profile={version:2,unit:'millimeter',engine:'occ',revision:'r',sketchDigest,faceId,regionId,frame,depth,sketchJSON};
   const {prepareRectangleExtrusion}=await import(d+'rectangleProfileRequest.mjs');const prepared=await prepareRectangleExtrusion(profile),sideIds={};
   for(const edge of prepared.edges){const dx=edge.b.x-edge.a.x,dy=edge.b.y-edge.a.y;if(Math.abs(dx)>Math.abs(dy))sideIds[dx>0?'minY':'maxY']=edge.id;else sideIds[dy>0?'maxX':'minX']=edge.id;}
   const w=new Worker(d+(partialMode?'worker-partial.js':'worker.js'));let seq=0;const call=data=>new Promise((yes,no)=>{const timer=setTimeout(()=>no(Error('worker timeout')),45000);w.onmessage=e=>{clearTimeout(timer);yes(e.data)};w.onerror=e=>{clearTimeout(timer);no(Error(e.message))};w.postMessage({...data,seq:++seq})});
   try{
    let x=await call({kind:'init',manifest:{version:1,js:{path:d+'unused.js',sha256:glueHash},wasm:{path:d+'engine.wasm',sha256:wasmHash}}});if(x.kind!=='ready')throw Error('init '+JSON.stringify(x));
    x=await call({kind:'profile-extrude',token:'prism',profile});if(x.kind!=='result')throw Error('prism '+JSON.stringify(x));
    const centerRequest={version:1,unit:'millimeter',revision:'r',sketchDigest,faceId,regionId,diameter:10};x=await call({kind:'research-centered-cut',token:'center',parent:'prism',request:centerRequest});if(x.kind!=='result')throw Error('center '+JSON.stringify(x));
    const request={version:1,unit:'millimeter',featureId:'4',parentFeatureId:'2',centerFeatureId:'3',revision:'r',sketchDigest,faceId,regionId,sideIds,offsetX:10,offsetY:10,diameter:4};
    const wrongParent=await call({kind:'research-four-corner-cut',token:'four',parent:'prism',request});if(wrongParent.kind!=='error')throw Error('unqualified prism parent accepted');
    const stale=await call({kind:'research-four-corner-cut',token:'four',parent:'center',request:{...request,revision:'stale'}});if(stale.kind!=='refused')throw Error('stale not refused');
    if(height===30){const touching=await call({kind:'research-four-corner-cut',token:'four',parent:'center',request:{...request,diameter:10}});if(touching.kind!=='refused'||touching.code!=='HOLES_OVERLAP')throw Error('touching not refused');}
    const result=await call({kind:'research-four-corner-cut',token:'four',parent:'center',request});
    if(partialMode){if(result.kind!=='error')throw Error('partial cut was accepted');const ended=await new Promise(resolve=>{let timer=setTimeout(()=>resolve(true),1200);w.onmessage=()=>{clearTimeout(timer);resolve(false)};w.postMessage({kind:'box',origin:[0,0,0],dimensions:[1,1,1],seq:++seq})});const workerTargets=await globalThis.__probeWorkerCount();return {partialMode,ended,workerTargets};}
    if(result.kind!=='result'||result.portableTopology.operation!=='codi-four-corner-cut/1')throw Error('cut failed '+JSON.stringify(result));
    const disposed=await call({kind:'dispose',token:'center'});if(disposed.kind!=='disposed')throw Error('center disposal failed');const afterDispose=await call({kind:'research-four-corner-cut',token:'after-dispose',parent:'center',request});if(afterDispose.kind!=='error')throw Error('disposed centered parent accepted');
    return {width,height,depth,result};
   }finally{w.terminate()}
  }
  return [await run(100,50,20),await run(150,30,35),await run(100,50,20,true)];
 },{glueHash,wasmHash});
 for(const x of cases){if(x.partialMode){assert.equal(x.ended,true);assert.equal(x.workerTargets,0);continue;}const t=x.result.portableTopology,e=x.result.evidence,b=x.result.binding;assert.equal(t.valid,true);assert.equal(t.solidCount,1);assert.equal(t.faces.length,11);assert.equal(e.rimCount,10);assert.equal(e.parentFaceDescendants.length,7);assert.equal(b.centerDiameter,10);assert.equal(b.diameter,4);assert.ok(Math.abs(e.analyticVolume-(x.width*x.height-41*Math.PI)*x.depth)<1e-5);}
 console.log('PASS actual Worker full cuts, typed refusals and partial-cut termination');
 }finally{await context.close();browser.disconnect()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
