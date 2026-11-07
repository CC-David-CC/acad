// Copy occ-headless-worker.js to /static/occ-headless-worker.js in the test app.
const assert = require('node:assert/strict');
const puppeteer = require(process.env.PUPPETEER_CORE_PATH || 'puppeteer-core');
const base = new URL(process.env.JSKETCHER_TEST_URL || 'http://127.0.0.1:19351/');
const cdp = new URL(process.env.CODI_TEST_CDP || 'http://127.0.0.1:19352/');
for (const u of [base, cdp]) if (!['127.0.0.1','localhost','[::1]'].includes(u.hostname)) throw Error('Loopback only');
(async () => {
  const browser = await puppeteer.connect({browserURL:cdp.href});
  const context = await browser.createBrowserContext();
  try {
    const page = await context.newPage(); await page.goto(base.href);
    const result = await page.evaluate(() => new Promise((resolve, reject) => {
      const worker = new Worker('/static/occ-headless-worker.js');
      const timer = setTimeout(() => {worker.terminate(); reject(Error('worker timed out'));}, 15000);
      worker.onerror = e => {clearTimeout(timer); worker.terminate(); reject(Error(e.message));};
      worker.onmessage = e => { if (e.data.importReturned) return; clearTimeout(timer); worker.terminate(); resolve(e.data); };
      worker.postMessage({});
    }));
    assert.equal(result.initialized, false); assert.equal(result.windowType, 'undefined');
    assert.match(result.error, /window is not defined/);
    console.log('PASS unmodified source-built OCC interpreter explicitly requires window during dedicated-worker load');
  } finally { await context.close(); browser.disconnect(); }
})().catch(error => {console.error(error.stack); process.exitCode=1;});
