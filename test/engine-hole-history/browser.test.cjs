// Real authored parent/registry/OCC; controlled second prism stands in for a cut.
const assert=require('node:assert/strict'),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);if(![base,cdp].every(u=>['127.0.0.1','localhost','[::1]'].includes(u.hostname)))throw Error('Loopback only');
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href}),context=await browser.createBrowserContext(),page=await context.newPage();try{
 const response=await page.goto(new URL('static/engine-test.html',base));assert.match(response.headers()['content-security-policy'],/script-src 'self' 'wasm-unsafe-eval'/);assert.doesNotMatch(response.headers()['content-security-policy'],/script-src[^;]*blob:/);await page.addScriptTag({url:new URL('static/hole-history-entry.js',base).href,type:'module'});
 const result=await page.evaluate(async()=>{
  const {runWorkerRectangleExtrusion:run,createWorkerCenteredHoleOperation:factory,createEvaluationResourcePool,activate,state}=window.holeHistoryFixture;
  const frame={origin:[3,-4,7],x:[1,0,0],y:[0,1,0],z:[0,0,1]},faceId='S:0/SURFACE';
  const draft=await new Promise((yes,no)=>{const w=new Worker('/static/sketch-worker.js');w.onmessage=e=>{w.terminate();yes(e.data)};w.onerror=e=>no(Error(e.message));w.postMessage({task:'rectangle',revision:'r',unit:'millimeter',frame,origin:[10,20],width:100,height:50})});
  const sketchJSON=draft.serializedSketch,sketchDigest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(sketchJSON))),x=>x.toString(16).padStart(2,'0')).join(''),regionId='sketch-region:'+JSON.stringify({faceId,outer:draft.sketch.objects.map(o=>faceId+'/'+o.id).sort(),holes:[]});
  const profile={version:2,unit:'millimeter',engine:'occ',revision:'r',sketchDigest,faceId,regionId,frame,depth:10,sketchJSON},doc=new AbortController(),pool=createEvaluationResourcePool(),owner=pool.begin({signal:doc.signal,valid:()=>true});
  const args={evaluation:owner,profile,bodyPolicy:'separate',booleanKind:'NONE',occupiedIds:new Set(),valid:()=>true,assets:{workerUrl:'/static/oci-verified-worker.js',jsPath:'/static/occ-portable.js',wasmPath:'/lib-assets/jsketcher-occ-engine/occt.wasm',semanticWorkerUrl:'/static/rectangle-semantic-worker.js'}};
  try {
   const parent=(await run({...args,featureId:'42'})).model,standin=(await run({...args,featureId:'44'})).model;
   const modelStream=state([]),baseCtx={streams:{craft:{models:modelStream}},services:{},sketchStorageService:{getSketchData:()=>null,readSketch:()=>null}};activate(baseCtx);const registry=baseCtx.cadRegistry.createEvaluationRegistry();registry.setModels([parent,standin]);
   const lid=parent.faces.find(f=>f.topology.data.portableIdentity?.key?.role==='LID'),baseFace=parent.faces.find(f=>f.topology.data.portableIdentity?.key?.role==='BASE'),wrongLid=standin.faces.find(f=>f.topology.data.portableIdentity?.key?.role==='LID');
   const script=state(''),list=state([]),errors=state([]),table=state({}),history=state({history:[],pointer:-1}),project={hasHostLifetime:true,documentGeneration:1,isDocumentCurrent:n=>n===1};
   const ctx={engineEvaluation:owner,cadRegistry:registry,projectService:project,storageService:{revision:1},craftService:{evaluationEpoch:1,modifications$:history},projectManager:{unit:'millimeter'},expressionService:{script$:script,list$:list,errors$:errors,table$:table}};
   const params={face:lid,featureId:43,diameter:10},reject=(fn)=>{try{fn();return false}catch{return true}},refusals=[];let calls=0,captured;
   const op=factory(async input=>{calls++;captured=input;return {model:standin,requireCurrent:()=>{if(!input.valid())throw Error('stale')},publicationCheck:()=>{if(!input.valid())throw Error('stale publication')}}});
   op.admitGeometry(params,ctx);refusals.push(reject(()=>op.admitGeometry({...params,face:baseFace},ctx)));refusals.push(reject(()=>op.admitGeometry({...params,face:{...lid}},ctx)));refusals.push(reject(()=>op.admitGeometry({...params,diameter:0},ctx)));refusals.push(reject(()=>op.admitGeometry({...params,face:wrongLid,featureId:44},ctx)));registry.setModels([standin]);refusals.push(reject(()=>op.admitGeometry(params,ctx)));registry.setModels([parent,standin]);
   const bad=factory(async()=>({model:standin,requireCurrent:()=>{}}));let missing=false;try{await bad.run(params,ctx)}catch{missing=true}
   const value=await op.run(params,ctx),validResult=value.created[0]===standin&&value.consumed[0]===parent&&captured.intent.diameter===10&&captured.intent.target.lidFaceId===lid.id&&captured.intent.target.regionId===regionId;
   ctx.storageService.revision++;const stale=reject(()=>owner.requireCurrent());ctx.storageService.revision--;owner.close();const closed=reject(()=>op.admitGeometry(params,ctx));
   return {refusals,missing,validResult,stale,closed,calls,parentFaces:parent.faces.length,parentEdges:parent.edges.length};
  }finally{owner.close()}
 });assert.deepEqual(result,{refusals:[true,true,true,true,true],missing:true,validResult:true,stale:true,closed:true,calls:1,parentFaces:6,parentEdges:12});console.log('PASS actual parent prism/owner/registry with controlled cut adapter',JSON.stringify(result));
 }finally{await context.close();browser.disconnect()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
