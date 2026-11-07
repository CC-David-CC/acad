const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const required=n=>{assert(process.env[n],n+' required');return process.env[n];},sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const pins=JSON.parse(fs.readFileSync(required('CODI_COMPONENT_PINS'))),base=new URL(pins.baseURL),cdp=new URL(required('CODI_TEST_CDP'));
for(const u of [base,cdp])assert(['127.0.0.1','localhost'].includes(u.hostname));
const ppRoot=required('PUPPETEER_CORE_PATH'),ppPackage=JSON.parse(fs.readFileSync(path.join(ppRoot,'package.json')));assert.equal(ppPackage.name,'puppeteer-core');assert.equal(ppPackage.version,'24.35.0');const puppeteer=require(ppRoot);
const sourceNames=['browser.cjs','exercise.mjs','cases.mjs','oracle.mjs','pins.mjs','../polygon-profile-v3-browser/oracle.mjs'];
const sourcePins=Object.fromEntries(sourceNames.map(n=>[n,sha(fs.readFileSync(path.join(__dirname,n)))]));
const receipt={status:'RUNNING',scope:'Genuine Chromium two-source Boolean-history Worker component; fixture solved source IDs only, no public authoring/through-all/history/save/UI qualification',sourcePins,pins,assets:{},rows:[]};
(async()=>{
 const {fixtures,filletPairs,chamferPairs,controls}=await import('./cases.mjs'),{checkPlate,checkControls}=await import('./oracle.mjs'),{runBooleanComponent}=await import('./exercise.mjs');
 assert.equal(pins.constructorPath,'/modules/engine/mount/occ-boolean-history-mount.mjs');
 assert.equal(pins.assets[pins.mountOptions.jsPath.slice(1)].sha256,'dd666902fe926d69cc3c8843f5568c2a3e569f38ff49291baa2f248165b5ea99');
 assert.equal(pins.assets[pins.mountOptions.wasmPath.slice(1)].sha256,'8d5e537e0d7f9e12b8ae0eaf239c0be1080934ed12a24bf6e7f849c9135ed5a2');
 for(const [name,expected]of Object.entries(pins.assets)){
  const r=await fetch(new URL(name,base));assert.equal(r.status,200,name);const hash=crypto.createHash('sha256');let bytes=0;
  for await(const part of r.body){hash.update(part);bytes+=part.length;}const sha256=hash.digest('hex');assert.equal(sha256,expected.sha256,name);assert.equal(bytes,expected.bytes,name);receipt.assets[name]={sha256,bytes};
 }
 const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:240000}),context=await browser.createBrowserContext();
 try{
  receipt.chromium=await browser.version();const page=await context.newPage();await page.evaluateOnNewDocument(()=>{window.componentCsp=[];document.addEventListener('securitypolicyviolation',e=>window.componentCsp.push({directive:e.violatedDirective,blockedURI:e.blockedURI}));});
  const response=await page.goto(new URL(pins.pagePath,base));assert.equal(response.status(),200);assert(response.headers()['content-security-policy']);assert.doesNotMatch(response.headers()['content-security-policy'],/'unsafe-eval'/);
  receipt.actual=await page.evaluate(runBooleanComponent,{pins,fixtures,filletPairs,chamferPairs,controls});
  for(const row of receipt.actual.rows)receipt.rows.push({...checkPlate(row,fixtures.find(f=>f.id===row.id),filletPairs,chamferPairs),status:'PASS'});
  assert.deepEqual(receipt.actual.rows[0].originalConnectors,receipt.actual.rows[1].originalConnectors);
  receipt.controls=checkControls(receipt.actual.controls);
  assert(receipt.actual.workers.every(w=>w.terminated));assert.deepEqual(receipt.actual.csp,[]);
  const session=await browser.target().createCDPSession();try{const until=Date.now()+5000;let live;do{live=(await session.send('Target.getTargets')).targetInfos.filter(t=>t.type==='worker'&&t.url.startsWith(base.href));if(live.length)await new Promise(r=>setTimeout(r,25));}while(live.length&&Date.now()<until);assert.equal(live.length,0);receipt.liveOwnedWorkerTargets=0;}finally{await session.detach();}
  receipt.sourcePinsAfter=Object.fromEntries(sourceNames.map(n=>[n,sha(fs.readFileSync(path.join(__dirname,n)))]));assert.deepEqual(receipt.sourcePinsAfter,sourcePins);
  receipt.status='PASS';console.log(JSON.stringify({status:receipt.status,rows:receipt.rows,controls:receipt.controls,workers:receipt.actual.workers.length}));
 }finally{await context.close();browser.disconnect();}
})().catch(e=>{receipt.status='FAIL';receipt.error={message:e.message,stack:e.stack};console.error(e.stack);process.exitCode=1;}).finally(()=>{if(process.env.CODI_RECEIPT)fs.writeFileSync(process.env.CODI_RECEIPT,JSON.stringify(receipt,null,2)+'\n');});
