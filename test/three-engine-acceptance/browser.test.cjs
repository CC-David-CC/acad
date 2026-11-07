// Runs real supplied same-origin mount factories in a fresh browser context.
// No app Viewer, canvas, fake storage, replacement Worker or kernel fallback.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const config=JSON.parse(fs.readFileSync(process.env.THREE_ENGINE_CONFIG,'utf8'));
const localModules=new Map();
for(const name of ['matrix.mjs','cases.mjs']){
 const url='/static/__three_engine_tests__/'+name,body=fs.readFileSync(path.join(__dirname,name));
 localModules.set(url,body);config.pinnedModules.push({url,sha256:crypto.createHash('sha256').update(body).digest('hex')});
}
config.matrixUrl='/static/__three_engine_tests__/matrix.mjs';
const base=new URL(config.fixture),cdp=new URL(process.env.CODI_TEST_CDP||'http://127.0.0.1:19329/');
for(const u of [base,cdp])assert.ok(['127.0.0.1','localhost','[::1]'].includes(u.hostname),'Loopback only');
assert.deepEqual(config.engines.map(e=>e.slot).sort(),process.env.THREE_ENGINE_SUBSET?process.env.THREE_ENGINE_SUBSET.split(',').sort():['native','occ','smlib']);
for(const p of [config.matrixUrl,...config.pinnedModules.map(m=>m.url),...config.engines.map(e=>e.moduleUrl)])assert.equal(new URL(p,base).origin,base.origin);
(async()=>{
 const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:120000}),context=await browser.createBrowserContext();
 try{
  const page=await context.newPage();
  const session=await page.createCDPSession();
  await session.send('Fetch.enable',{patterns:[{urlPattern:base.origin+'/static/__three_engine_tests__/*',requestStage:'Request'}]});
  session.on('Fetch.requestPaused',event=>{
   const body=localModules.get(new URL(event.request.url).pathname);
   if(!body){session.send('Fetch.failRequest',{requestId:event.requestId,errorReason:'BlockedByClient'});return;}
   session.send('Fetch.fulfillRequest',{requestId:event.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'text/javascript'}],body:body.toString('base64')}).catch(()=>{});
  });
  await page.evaluateOnNewDocument(()=>{window.engineCspViolations=[];document.addEventListener('securitypolicyviolation',e=>window.engineCspViolations.push(e.violatedDirective));});
  const response=await page.goto(base.href,{waitUntil:'domcontentloaded'}),csp=response.headers()['content-security-policy'];
  assert.ok(csp,'Missing response CSP');assert.doesNotMatch(csp,/(?:^|\s)'unsafe-eval'(?:\s|;|$)/);
  const receipt=await page.evaluate(async config=>{
   const sha=async url=>{
    const response=await fetch(url,{cache:'no-store'});if(!response.ok)throw Error(`Fetch ${url}: ${response.status}`);
    return [...new Uint8Array(await crypto.subtle.digest('SHA-256',await response.arrayBuffer()))].map(x=>x.toString(16).padStart(2,'0')).join('');
   };
   const modules=[];
   for(const p of config.pinnedModules){const actual=await sha(p.url);if(actual!==p.sha256)throw Error(`Module pin mismatch ${p.url}`);modules.push({url:p.url,sha256:actual});}
   for(const url of [config.matrixUrl,...config.engines.map(e=>e.moduleUrl)])if(!modules.some(m=>new URL(m.url,location.href).href===new URL(url,location.href).href))throw Error(`Unpinned entry module ${url}`);
   const {runNumericMatrix}=await import(new URL(config.matrixUrl,location.href).href),engines=[];
   for(const engine of config.engines){
    const api=await import(new URL(engine.moduleUrl,location.href).href),factory=api[engine.exportName];
    if(typeof factory!=='function')throw Error(`Missing factory ${engine.exportName}`);
    engines.push({slot:engine.slot,...await runNumericMatrix(()=>factory(engine.options),engine.expected)});
   }
   return {engines,modules};
  },config);
  const deadline=Date.now()+5000;
  while(page.workers().length&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,20));
  assert.equal(page.workers().length,0,'Owned page Workers survived mount close');
  assert.deepEqual(await page.evaluate(()=>window.engineCspViolations),[]);
  const report={source:config.source,csp,fixture:base.href,browserVersion:await browser.version(),
   cacheScope:'Fresh owned browser context in an already running shared Chrome process; no browser/process cache cleared; assets prefetched for SHA checks with cache:no-store; first mount is first within this run, not proven cold compilation; later mounts reuse the same process',...receipt,
   qualifiedAllNumericCases:receipt.engines.every(e=>e.rows.every(r=>r.status==='pass')),
   scope:'Actual supplied Worker/kernel numerical and caller-boundary controls. History/native/agent/in-flight-stale controls remain separate.'};
  if(process.env.THREE_ENGINE_RECEIPT)fs.writeFileSync(process.env.THREE_ENGINE_RECEIPT,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
 }finally{await context.close();browser.disconnect();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
