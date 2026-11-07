const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const required=n=>{assert(process.env[n],n+' required');return process.env[n];},sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const pins=JSON.parse(fs.readFileSync(required('CODI_COMPONENT_PINS'))),base=new URL(pins.baseURL),cdp=new URL(required('CODI_TEST_CDP'));
for(const u of [base,cdp])assert(['127.0.0.1','localhost'].includes(u.hostname));
const ppRoot=required('PUPPETEER_CORE_PATH'),ppPackage=JSON.parse(fs.readFileSync(path.join(ppRoot,'package.json')));assert.equal(ppPackage.name,'puppeteer-core');assert.equal(ppPackage.version,'24.35.0');const puppeteer=require(ppRoot);
const sourcePins=Object.fromEntries(['browser.cjs','exercise.mjs','cases.mjs','oracle.mjs','../polygon-profile-v3-browser/oracle.mjs'].map(n=>[n,sha(fs.readFileSync(path.join(__dirname,n)))]));
const receipt={status:'RUNNING',scope:'Actual Chromium mechanical-profile Worker component, explicit solved requests/source IDs; no public authoring/history/save/UI/Files qualification',sourcePins,pins,assets:{},rows:[]};
(async()=>{
 const {fixtures,pairs,circle,splitTangent}=await import('./cases.mjs'),{checkChain,near}=await import('./oracle.mjs'),{runComponent}=await import('./exercise.mjs');
 assert.equal(pins.constructorPath,'/modules/engine/mount/occ-mechanical-profile-mount.mjs');
 assert.equal(pins.assets[pins.mountOptions.jsPath.slice(1)].sha256,'b3d91cbb02f90ba56732039283d787b92eda97c51091fafbd933ecf4db30dd97');
 assert.equal(pins.assets[pins.mountOptions.wasmPath.slice(1)].sha256,'28e8e2c2752cef100a98e24ec487f7d90021edb98fb060fdd1160fe63501bbe2');
 assert(Object.keys(pins.assets).length>=8);for(const [name,expected]of Object.entries(pins.assets)){
  const r=await fetch(new URL(name,base));assert.equal(r.status,200,name);const hash=crypto.createHash('sha256');let bytes=0;
  for await(const part of r.body){hash.update(part);bytes+=part.length;}const sha256=hash.digest('hex');assert.equal(sha256,expected.sha256,name);assert.equal(bytes,expected.bytes,name);receipt.assets[name]={sha256,bytes};
 }
 const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:240000}),context=await browser.createBrowserContext();
 try{
  receipt.chromium=await browser.version();const page=await context.newPage();await page.evaluateOnNewDocument(()=>{window.componentCsp=[];document.addEventListener('securitypolicyviolation',e=>window.componentCsp.push({directive:e.violatedDirective,blockedURI:e.blockedURI}));});
  const response=await page.goto(new URL(pins.pagePath,base));assert.equal(response.status(),200);assert(response.headers()['content-security-policy']);assert.doesNotMatch(response.headers()['content-security-policy'],/'unsafe-eval'/);
  receipt.actual=await page.evaluate(runComponent,{pins,fixtures,pairs,circle,splitTangent});
  for(const row of receipt.actual.rows)receipt.rows.push({...checkChain(row,fixtures.find(f=>f.id===row.id),pairs),status:'PASS'});
  assert.deepEqual(receipt.actual.rows[0].base.plan.edges.map(e=>e.id),receipt.actual.rows[1].base.plan.edges.map(e=>e.id));
  assert.deepEqual(receipt.actual.rows[0].fillet.plan.edges.map(e=>e.id),receipt.actual.rows[1].fillet.plan.edges.map(e=>e.id));
  const c=receipt.actual.controls,expected={excessive:'EDGE_TREATMENT_FAILED',duplicate:'INVALID_REQUEST',unknown:'UNRESOLVED_SELECTION','producer-mismatch':'INVALID_SELECTION_BINDING'};
  for(const r of c.refusals){assert.equal(r.outcome?.code,expected[r.id],JSON.stringify(r.outcome));assert(r.requestPreserved);assert.deepEqual(r.inputBefore,r.inputAfter);if(r.id==='duplicate')assert.equal(r.posts,0);}
  for(const r of [c.stale,c.foreign]){assert.equal(r.outcome?.code,'INVALID_HANDLE');assert.equal(r.posts,0);}assert.deepEqual(c.foreign.inputBefore,c.foreign.inputAfter);
  for(const name of ['circle-edge','tangent-expansion']){assert(!c[name].setupError,JSON.stringify(c[name]));assert.equal(c[name].outcome?.code,'EDGE_TREATMENT_UNSUPPORTED');assert.deepEqual(c[name].inputBefore,c[name].inputAfter);}
  assert.equal(c.cancel.outcome.code,'CANCELLED');assert.equal(c.cancel.retry.code,'MOUNT_CLOSED');assert(c.cancel.terminated);near(c.cancel.genuine.evidence.nativeVolume,100000-180*(1-Math.PI/4));
  assert.equal(c.budget.results.length,31);for(const r of c.budget.results){assert(r.evidence.nativeValidity.valid);near(r.evidence.nativeVolume,99990);}assert.equal(c.budget.outcome?.code,'RESOURCE_LIMIT');assert.equal(c.budget.posts,0);assert.deepEqual(c.budget.inputBefore,c.budget.inputAfter);
  assert(receipt.actual.workers.every(w=>w.terminated));assert.deepEqual(receipt.actual.csp,[]);
  const session=await browser.target().createCDPSession();try{const until=Date.now()+5000;let live;do{live=(await session.send('Target.getTargets')).targetInfos.filter(t=>t.type==='worker'&&t.url.startsWith(base.href));if(live.length)await new Promise(r=>setTimeout(r,25));}while(live.length&&Date.now()<until);assert.equal(live.length,0);receipt.liveOwnedWorkerTargets=0;}finally{await session.detach();}
  receipt.status='PASS';console.log(JSON.stringify({status:receipt.status,rows:receipt.rows,controls:Object.keys(c),workers:receipt.actual.workers.length}));
 }finally{await context.close();browser.disconnect();}
})().catch(e=>{receipt.status='FAIL';receipt.error={message:e.message,stack:e.stack};console.error(e.stack);process.exitCode=1;}).finally(()=>{if(process.env.CODI_RECEIPT)fs.writeFileSync(process.env.CODI_RECEIPT,JSON.stringify(receipt,null,2)+'\n');});
