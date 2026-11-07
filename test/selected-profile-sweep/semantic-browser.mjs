// Actual production semantic Worker; hand-authored source data, no GUI/kernel.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {sweepSourceFixture} from './source-fixture.mjs';
const require=createRequire(import.meta.url),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.CODI_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP),evidence=process.env.CODI_EVIDENCE;
assert(evidence);for(const url of [base,cdp])assert(['127.0.0.1','localhost','[::1]'].includes(url.hostname));
const fixture=await sweepSourceFixture(),workerBytes=new Uint8Array(await(await fetch(new URL('worker.js',base))).arrayBuffer());
const workerSHA256=createHash('sha256').update(workerBytes).digest('hex'),browser=await puppeteer.connect({browserURL:cdp.href}),context=await browser.createBrowserContext();
const report={scope:'Production semantic Worker component only; hand-authored data, no solver/native/app qualification',workerSHA256,rows:[]};
try{
 const page=await context.newPage();await page.evaluateOnNewDocument(()=>{window.csp=[];document.addEventListener('securitypolicyviolation',event=>window.csp.push(event.violatedDirective));});
 const response=await page.goto(base.href);assert(response.ok());assert.doesNotMatch(response.headers()['content-security-policy'],/'unsafe-eval'|'unsafe-inline'/);
 const result=await page.evaluate(async fixture=>{
  const worker=new Worker('/worker.js');let current=null;
  worker.onmessage=event=>{const pending=current;current=null;pending?.resolve(event.data);};worker.onerror=event=>{current?.reject(Error(event.message));current=null;};
  const run=sweep=>new Promise((resolve,reject)=>{const jobId=crypto.randomUUID(),timer=setTimeout(()=>{current=null;reject(Error('Worker timed out'));},10000);current={resolve:value=>{clearTimeout(timer);if(value.jobId!==jobId)return reject(Error('Changed job identity'));resolve(value);},reject:error=>{clearTimeout(timer);reject(error);}};worker.postMessage({kind:'prepare-sweep',jobId,sweep});});
  try{
   const positive=await run(fixture),refusals=[];
   for(const [name,patch] of [['different-source-state',x=>x.path.revision='other'],['wrong-path-digest',x=>x.path.sketchDigest='0'.repeat(64)],['missing-path-id',x=>x.path.pathCurves[0].curveId='missing'],['stale-path-frame',x=>x.path.frame.origin[0]=1],['changed-region',x=>x.profile.regionId='sketch-region:missing']]){const value=structuredClone(fixture);patch(value);refusals.push({name,reply:await run(value)});}
   return{positive,refusals,afterRefusals:await run(fixture)};
  }finally{worker.terminate();}
 },fixture);
 for(const reply of [result.positive,result.afterRefusals]){
  assert.equal(reply.ok,true);assert.equal(reply.value.request.op,'solid.profile.sweep');
  assert.equal(reply.value.request.source.sourceSha256,fixture.profile.sketchDigest);assert.equal(reply.value.request.path.source.sourceSha256,fixture.path.sketchDigest);
  assert.deepEqual(reply.value.request.path.curves,[{kind:'segment',id:'line',a:[0,0],b:[0,10],reversed:false}]);
  assert.deepEqual(reply.value.request.path.frame,fixture.path.frame);assert.equal(reply.value.binding.pathFaceId,'spine');
 }
 const expected=['STALE_SOURCE','STALE_SKETCH','STALE_PATH','STALE_FRAME','STALE_REGION'];
 result.refusals.forEach((row,index)=>{assert.equal(row.reply.ok,false);assert.equal(row.reply.code,expected[index]);report.rows.push({name:row.name,status:'PASS',code:row.reply.code});});
 report.rows.unshift({name:'actual-worker-two-source-prepare',status:'PASS'});report.rows.push({name:'valid-prepare-after-refusals',status:'PASS'});
 assert.deepEqual(await page.evaluate(()=>window.csp),[]);report.status='PASS';
}catch(error){report.status='FAIL';report.error=String(error.stack||error);throw error;}
finally{await context.close();report.ownedContextClosed=true;browser.disconnect();fs.mkdirSync(evidence,{recursive:true});fs.writeFileSync(evidence+'/semantic-browser.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report));
