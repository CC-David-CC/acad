// Standalone research control: serve the pinned WASM and derived JS on loopback.
const assert = require('node:assert/strict');
const puppeteer = require(process.env.PUPPETEER_CORE_PATH || 'puppeteer-core');
const base = new URL(process.env.JSKETCHER_TEST_URL || 'http://127.0.0.1:19351/');
const cdp = new URL(process.env.CODI_TEST_CDP || 'http://127.0.0.1:19352/');
for (const u of [base,cdp]) if (!['127.0.0.1','localhost','[::1]'].includes(u.hostname)) throw Error('Loopback only');
(async () => {
  const browser = await puppeteer.connect({browserURL:cdp.href}); const ctx = await browser.createBrowserContext();
  try {
    const page = await ctx.newPage(); await page.goto(base.href);
    const result = await page.evaluate(() => new Promise((resolve,reject) => {
      const w = new Worker('/static/occ-portable-probe-worker.js');
      const timer = setTimeout(() => {w.terminate(); reject(Error('worker timed out'));}, 30000);
      w.onerror = e => {clearTimeout(timer);w.terminate();reject(Error(e.message));};
      w.onmessage = e => {clearTimeout(timer);w.terminate();resolve(e.data);}; w.postMessage({dimensions:[10,20,30]});
    }));
    console.log('OCC portable worker probe:', JSON.stringify(result));
    assert.equal(result.ok,true); assert.equal(result.windowType,'undefined'); assert.equal(result.faceCount,6);
    assert.equal(result.triangles,12); assert.deepEqual(result.bounds,{min:[0,0,0],max:[10,20,30]});
  } finally {await ctx.close();browser.disconnect();}
})().catch(e => {console.error(e.stack);process.exitCode=1;});
