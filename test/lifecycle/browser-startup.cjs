const assert=require('node:assert/strict');
const puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);
if(![base,cdp].every(u=>['127.0.0.1','localhost','[::1]'].includes(u.hostname)))throw Error('Loopback only');
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href});try{
 for(const mode of ['normal','script-503','wasm-503','wasm-invalid']){
  const context=await browser.createBrowserContext(),page=await context.newPage(),session=await page.createCDPSession();let intercepted=0;const errors=[];
  try{
   await page.evaluateOnNewDocument(()=>{window.startupUnhandled=[];addEventListener('unhandledrejection',e=>window.startupUnhandled.push(String(e.reason)));});
   page.on('pageerror',e=>errors.push(String(e)));
   if(mode!=='normal'){
    const filename=mode==='script-503'?'occt.js':'occt.wasm';await session.send('Fetch.enable',{patterns:[{urlPattern:`*/lib-assets/jsketcher-occ-engine/${filename}`,requestStage:'Request'}]});
    session.on('Fetch.requestPaused',async event=>{intercepted++;try{await session.send('Fetch.fulfillRequest',{requestId:event.requestId,responseCode:mode==='wasm-invalid'?200:503,responseHeaders:[{name:'Content-Type',value:mode==='wasm-invalid'?'application/wasm':'text/plain'}],body:Buffer.from(mode==='wasm-invalid'?'invalid wasm':'unavailable').toString('base64')});}catch(e){errors.push(String(e));}});
   }
   await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base).href,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(mode=>mode==='normal'?__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true:!!__CAD_APP?.streams?.lifecycle?.initializationFailure?.value,{timeout:60000},mode);
   await new Promise(resolve=>setTimeout(resolve,500));
   const result=await page.evaluate(()=>({failure:__CAD_APP.streams.lifecycle.initializationFailure.value,loaded:__CAD_APP.streams.lifecycle.projectLoaded.value,pending:__CAD_APP.services.lifecycle.pendingInitializingJobs(),unhandled:window.startupUnhandled}));
   if(mode==='normal'){assert.equal(result.loaded,true);assert.equal(result.failure,null);assert.equal(intercepted,0)}else{assert.equal(intercepted,1);assert.equal(result.failure.job,'e0:loader');assert.equal(result.loaded,false);assert.ok(result.pending.includes('e0:loader'));}
   assert.deepEqual(result.unhandled,[]);assert.deepEqual(errors,[]);console.log(JSON.stringify({mode,intercepted,...result}));
  }finally{await context.close();}
 }
 }finally{browser.disconnect()}})().catch(e=>{console.error(e);process.exitCode=1});
