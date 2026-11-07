// A real isolated Worker, real sketch IO and CSP; no editor, canvas or DOM shim.
const assert = require('node:assert/strict');
const puppeteer = require(process.env.PUPPETEER_CORE_PATH || 'puppeteer-core');
const base = new URL(process.env.JSKETCHER_TEST_URL || 'http://127.0.0.1:19917/');
const cdp = new URL(process.env.CODI_TEST_CDP || 'http://127.0.0.1:19875/');
if (![base,cdp].every(u=>['127.0.0.1','localhost','[::1]'].includes(u.hostname))) throw Error('Loopback only');
(async()=>{
  const browser=await puppeteer.connect({browserURL:cdp.href}), context=await browser.createBrowserContext();
  try {
    const page=await context.newPage();await page.goto(base.href);
    const results=await page.evaluate(async()=>{
      const run=input=>new Promise((resolve,reject)=>{const worker=new Worker('/static/worker.js'),timer=setTimeout(()=>{worker.terminate();reject(Error('Worker timed out'));},15000);worker.onmessage=e=>{clearTimeout(timer);worker.terminate();resolve(e.data)};worker.onerror=e=>{clearTimeout(timer);worker.terminate();reject(Error(e.message))};worker.postMessage(input)});
      const xy={origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]},xz={origin:[0,0,0],x:[1,0,0],y:[0,0,-1],z:[0,1,0]},zy={origin:[0,0,0],x:[0,0,1],y:[0,1,0],z:[-1,0,0]};
      const valid=[];for(const frame of [xy,xz,zy])valid.push(await run({unit:'millimeter',frame}));
      const bad=[];for(const input of [{unit:'inch',frame:xy},{unit:'millimeter',frame:{...xy,x:[2,0,0]}},{unit:'millimeter',frame:{...xy,z:[0,0,-1]}},{unit:'millimeter',frame:{...xy,origin:[0,Infinity,0]}},{unit:'millimeter',frame:{...xy,extra:1}}])bad.push(await run(input));
      return {valid,bad};
    });
    for(const result of results.valid){
      assert.equal(result.ok,true,JSON.stringify(result));const s=result.sketch;
      assert.equal(s.version,3);assert.deepEqual(s.objects,[]);assert.deepEqual(s.dimensions,[]);assert.deepEqual(s.labels,[]);
      assert.deepEqual(s.boundary,{lines:[],arcs:[],circles:[],nurbses:[]});assert.equal(s.constants,'');
      assert.equal(s.stages.length,1);assert.deepEqual(s.stages[0].constraints,[]);assert.deepEqual(s.stages[0].generators,[]);
      assert.ok(s.metadata.boundaryFrame);assert.deepEqual(JSON.parse(JSON.stringify(s)),s);assert.deepEqual(result.reopened,s,'strict headless IO roundtrip must preserve intent');
    }
    for(const result of results.bad)assert.equal(result.ok,false,JSON.stringify(result));
    console.log('PASS strict empty sketch from real headless Worker for three frames; invalid units and frames rejected');
  } finally {await context.close();browser.disconnect();}
})().catch(error=>{console.error(error);process.exitCode=1});
