// Diagnostic, not a speed gate: reports local browser timings and fixture size.
const puppeteer = require(process.env.PUPPETEER_CORE_PATH || 'puppeteer-core');
const base = new URL(process.env.JSKETCHER_TEST_URL || 'http://127.0.0.1:19734/');
const cdp = new URL(process.env.CODI_TEST_CDP || 'http://127.0.0.1:19367/');
if (![base,cdp].every(u=>['127.0.0.1','localhost','[::1]'].includes(u.hostname))) throw Error('Loopback only');
(async()=>{
  const browser=await puppeteer.connect({browserURL:cdp.href}),context=await browser.createBrowserContext();
  try {
    const page=await context.newPage();await page.goto(base.href);
    await page.addScriptTag({url:new URL('static/cost.js',base).href});
    for(const count of [100,1000,5000]) {
      const result=await page.evaluate(n=>({serialization:window.measureSignedDistanceSnapshot(n),rollback:window.measureProjectedSnapshot(n)}),count);
      console.log(JSON.stringify(result));
    }
  } finally {await context.close();browser.disconnect();}
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
