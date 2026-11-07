const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const need=n=>{assert(process.env[n],n+' required');return process.env[n];},hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const pins=JSON.parse(fs.readFileSync(need('CODI_COMPONENT_PINS'))),base=new URL(pins.baseURL),cdp=new URL(need('CODI_TEST_CDP'));for(const u of[base,cdp])assert(['127.0.0.1','localhost'].includes(u.hostname));
const ppRoot=need('PUPPETEER_CORE_PATH'),pkg=JSON.parse(fs.readFileSync(path.join(ppRoot,'package.json')));assert.equal(pkg.name,'puppeteer-core');assert.equal(pkg.version,'24.35.0');const puppeteer=require(ppRoot);
const sourceNames=['browser.cjs','cases.mjs','exercise.mjs','oracle.mjs','pins.mjs','../polygon-profile-v3-browser/oracle.mjs'],sourcePins=Object.fromEntries(sourceNames.map(p=>[p,hash(fs.readFileSync(path.join(__dirname,p)))]));
const receipt={status:'RUNNING',scope:'Genuine Chromium source-bound through-hole Worker component; sourceFaceId is a fixture label, not public authoring binding. No app/history/save qualification.',sourcePins,pins,assets:{},rows:[]};
(async()=>{
 const {fixtures:sourceFixtures,holeIntent,filletPairs,chamferPairs,native}=await import('./cases.mjs'),{runThroughHoleComponent}=await import('./exercise.mjs'),{checkFixture,checkControls,checkWork}=await import('./oracle.mjs');
 const fixtures=sourceFixtures.map(f=>({...f,centerIntent:holeIntent(f,'centered-through'),cornersIntent:holeIntent(f,'four-corner-through')}));
 assert.equal(pins.constructorPath,'/modules/engine/mount/occ-boolean-history-mount.mjs');assert.equal(pins.assets[pins.mountOptions.jsPath.slice(1)].sha256,native.js);assert.equal(pins.assets[pins.mountOptions.wasmPath.slice(1)].sha256,native.wasm);
 for(const [name,want]of Object.entries(pins.assets)){const r=await fetch(new URL(name,base));assert.equal(r.status,200,name);const h=crypto.createHash('sha256');let bytes=0;for await(const b of r.body){h.update(b);bytes+=b.length;}const sha256=h.digest('hex');assert.equal(sha256,want.sha256,name);assert.equal(bytes,want.bytes,name);receipt.assets[name]={sha256,bytes};}
 const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:240000}),context=await browser.createBrowserContext();
 try{
  receipt.chromium=await browser.version();const page=await context.newPage();await page.evaluateOnNewDocument(()=>{window.componentCsp=[];document.addEventListener('securitypolicyviolation',e=>window.componentCsp.push({directive:e.violatedDirective,blockedURI:e.blockedURI}));});
  const response=await page.goto(new URL(pins.pagePath,base));assert.equal(response.status(),200);assert(response.headers()['content-security-policy']);assert.doesNotMatch(response.headers()['content-security-policy'],/'unsafe-eval'/);
  receipt.actual=await page.evaluate(runThroughHoleComponent,{pins,fixtures,filletPairs,chamferPairs});
  for(const row of receipt.actual.rows)receipt.rows.push({...checkFixture(row,fixtures.find(f=>f.id===row.id),filletPairs,chamferPairs),status:'PASS'});
  receipt.controls=checkControls(receipt.actual.controls,fixtures[0]);checkWork(receipt.actual.workers,fixtures);assert.deepEqual(receipt.actual.csp,[]);
  const session=await browser.target().createCDPSession();try{const until=Date.now()+5000;let live;do{live=(await session.send('Target.getTargets')).targetInfos.filter(t=>t.type==='worker'&&t.url.startsWith(base.href));if(live.length)await new Promise(r=>setTimeout(r,25));}while(live.length&&Date.now()<until);assert.equal(live.length,0);receipt.liveOwnedWorkerTargets=0;}finally{await session.detach();}
  receipt.sourcePinsAfter=Object.fromEntries(sourceNames.map(p=>[p,hash(fs.readFileSync(path.join(__dirname,p)))]));assert.deepEqual(receipt.sourcePinsAfter,sourcePins);receipt.status='PASS';console.log(JSON.stringify({status:'PASS',rows:receipt.rows,controls:receipt.controls,workers:receipt.actual.workers.length}));
 }finally{await context.close();browser.disconnect();}
})().catch(e=>{receipt.status='FAIL';receipt.error={message:e.message,stack:e.stack};console.error(e.stack);process.exitCode=1;}).finally(()=>{if(process.env.CODI_RECEIPT)fs.writeFileSync(process.env.CODI_RECEIPT,JSON.stringify(receipt,null,2)+'\n');});
