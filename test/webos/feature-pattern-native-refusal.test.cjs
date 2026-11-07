const assert = require('node:assert/strict');
const puppeteer = require(process.env.PUPPETEER_CORE_PATH || 'puppeteer-core');
const base = new URL(process.env.JSKETCHER_TEST_URL || 'http://127.0.0.1:19915/');
const cdp = new URL(process.env.CODI_TEST_CDP || 'http://127.0.0.1:19875/');
if (![base, cdp].every(u => ['127.0.0.1', 'localhost', '[::1]'].includes(u.hostname))) throw Error('Loopback only');
(async () => {
  const browser = await puppeteer.connect({browserURL: cdp.href}), context = await browser.createBrowserContext();
  try {
    const page = await context.newPage();
    await page.goto(new URL('index-webos.html?DEFAULT&webos=1', base));
    await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true', {timeout: 90000});
    const result = await page.evaluate(async () => {
      const c = __CAD_APP, run = request => new Promise((ok, no) => c.craftService.modify(request, ok, no));
      await run({type:'NATIVE_MESH_BOX', params:{featureId:1,x:0,y:0,z:0,width:100,depth:50,height:20}});
      const before = JSON.stringify(c.cadRegistry.shells[0].brepShell.data.__meshWithOrigins.meshData);
      let code = '';
      try { await run({type:'PATTERN_CUT_LINEAR',params:{featureId:2,seedFeatureId:1,seedObjectId:1,count:2,spacing:20,axis:'X'}}); }
      catch (error) { code = error.code || ''; }
      return {code, unchanged: before === JSON.stringify(c.cadRegistry.shells[0].brepShell.data.__meshWithOrigins.meshData),history:c.craftService.modifications$.value.history.map(op=>op.type)};
    });
    assert.equal(result.code,'PATTERN_NATIVE_UNSUPPORTED');
    assert.equal(result.unchanged,true);
    assert.deepEqual(result.history,['NATIVE_MESH_BOX']);
    console.log('PASS Native Mesh cut pattern explicitly refused without conversion or mutation');
  } finally { await context.close(); browser.disconnect(); }
})().catch(error => { console.error(error); process.exitCode=1; });
