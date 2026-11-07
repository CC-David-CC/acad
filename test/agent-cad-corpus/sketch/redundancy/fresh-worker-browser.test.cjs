// Source-authored (never hand-reclassified) native records -> installed Worker.
// Run after the root supplies a matching app/Worker; no fake replies or UI.
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const puppeteer=require(process.env.PUPPETEER_CORE_PATH||'/tmp/codi-occt-release-control/node_modules/puppeteer-core');
for(const k of ['JSKETCHER_TEST_URL','CODI_SKETCH_WORKER_URL','CODI_SKETCH_WORKER_SHA256','CODI_APP_SHA256','CODI_REDUCTION_BEFORE','CODI_REDUCTION_AFTER','CODI_BROWSER_RECEIPT'])assert.ok(process.env[k],'Provide '+k);
const base=new URL(process.env.JSKETCHER_TEST_URL),workerURL=new URL(process.env.CODI_SKETCH_WORKER_URL,base),cdp=new URL(process.env.CODI_TEST_CDP||'http://127.0.0.1:19329/');
for(const u of [base,workerURL,cdp])assert.ok(['127.0.0.1','localhost','[::1]'].includes(u.hostname));assert.equal(workerURL.origin,base.origin);
const before=JSON.parse(fs.readFileSync(process.env.CODI_REDUCTION_BEFORE)),after=JSON.parse(fs.readFileSync(process.env.CODI_REDUCTION_AFTER)),wrapper=fs.readFileSync('test/agent-cad-corpus/sketch/receipts/r2/client.bundle.js'),expectedRestart=process.env.CODI_EXPECT_PRIORITY_RESTART==='1';
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:120000}),context=await browser.createBrowserContext();try{
 const page=await context.newPage(),session=await page.createCDPSession(),url=new URL('static/redundancy-real-client-test-only.js',base).href;
 await session.send('Fetch.enable',{patterns:[{urlPattern:url,requestStage:'Request'}]});session.on('Fetch.requestPaused',event=>session.send('Fetch.fulfillRequest',{requestId:event.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'text/javascript'}],body:wrapper.toString('base64')}).catch(()=>{}));
 const response=await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base).href),csp=response.headers()['content-security-policy'];assert.ok(csp);assert.doesNotMatch(csp.split(';').find(p=>p.trim().startsWith('script-src')),/'unsafe-eval'|'unsafe-inline'/);
 const pins=await page.evaluate(async worker=>{const sha=async p=>{const r=await fetch(p,{cache:'no-store'});if(!r.ok)throw Error('Missing asset');return [...new Uint8Array(await crypto.subtle.digest('SHA-256',await r.arrayBuffer()))].map(v=>v.toString(16).padStart(2,'0')).join('');};return {worker:await sha(worker),app:await sha(new URL('static/index.bundle.js',location.href))};},workerURL.href);
 assert.equal(pins.worker,process.env.CODI_SKETCH_WORKER_SHA256);assert.equal(pins.app,process.env.CODI_APP_SHA256);await page.addScriptTag({url});
 const result=await page.evaluate(async({worker,newRequest,legacyRequest})=>{
  const Real=window.Worker;let started=0,terminated=0;window.Worker=class extends Real{constructor(url,...args){super(url,...args);this.owned=new URL(String(url),location.href).href===worker;if(this.owned)started++;}terminate(){if(this.owned){this.owned=false;terminated++;}return super.terminate();}};
  try{const run=async request=>{const r=structuredClone(request);r.revision=crypto.randomUUID();const before=JSON.stringify(r),output=await runSketchCorpusWorker(worker,r,{valid:()=>true});return {inputUnchanged:before===JSON.stringify(r),output};};
   const fresh=await run(newRequest),legacy=await run(legacyRequest);let reload=null,save=null;
   if(fresh.output.ok){reload=await run({revision:'reload',sketch:JSON.parse(JSON.stringify(fresh.output.sketch)),boundary:structuredClone(fresh.output.sketch.boundary),externalParameters:{}});save=await run({task:'sketch-save-validation',revision:'save',sketchJSON:JSON.stringify(fresh.output.sketch),frame:fresh.output.sketch.metadata.boundaryFrame,parameterSource:null,externalParameters:{}});}
   return {fresh,legacy,reload,save,started,terminated};
  }finally{window.Worker=Real;}
 },{worker:workerURL.href,newRequest:after.freshRoundtrip.workerRequest,legacyRequest:before.freshRoundtrip.workerRequest});
 assert.equal(result.started,result.terminated);assert.ok(result.fresh.inputUnchanged&&result.legacy.inputUnchanged);
 if(expectedRestart){assert.equal(result.fresh.output.ok,true,JSON.stringify(result.fresh.output));assert.equal(result.legacy.output.error.code,'INTENT_CHANGED');assert.ok(result.reload.output.ok&&result.save.output.validated);assert.deepEqual(result.fresh.output.sketch.stages,after.freshRoundtrip.workerRequest.sketch.stages);}
 else{assert.equal(result.fresh.output.error.code,'INTENT_CHANGED');assert.equal(result.legacy.output.ok,true);}
 const receipt={version:1,source:process.env.CODI_SOURCE||null,scope:'Actual production client/installed Worker; fresh native records originated through real nonvisual frontend model classes in the source controls, not app editor UI',expectedRestart,csp,pins,wrapperSha256:crypto.createHash('sha256').update(wrapper).digest('hex'),...result};fs.writeFileSync(process.env.CODI_BROWSER_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({expectedRestart,started:result.started,terminated:result.terminated,pass:true}));
}finally{await context.close();browser.disconnect();}})().catch(error=>{console.error(error.stack);process.exitCode=1;});
