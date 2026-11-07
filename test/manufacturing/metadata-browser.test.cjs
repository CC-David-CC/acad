const assert = require('node:assert/strict');
const puppeteer = require(process.env.PUPPETEER_CORE_PATH || 'puppeteer-core');
(async () => {
  const browser = await puppeteer.connect({browserURL: process.env.CODI_TEST_CDP || 'http://127.0.0.1:19255'});
  const context = await browser.createBrowserContext();
  try {
    const page = await context.newPage();
    await page.goto(process.env.JSKETCHER_URL || 'http://127.0.0.1:19771/index-webos.html?DEFAULT&webos=1');
    await page.waitForFunction(() => window.__CAD_APP?.streams?.lifecycle?.projectLoaded?.value === true, {timeout: 90000});
    await page.evaluate(() => {
      const c = window.__CAD_APP;
      c.actionService.run('NATIVE_MESH_BOX');
      for (const [key, value] of Object.entries({x:0,y:0,z:0,width:10,depth:20,height:30})) c.wizardService.updateParam(key, value);
      c.services.wizard.applyWorkingRequest();
    });
    await page.waitForFunction(() => __CAD_APP.craftService.modifications$.value.history.length === 1 && !__CAD_APP.craftService.isProcessing, {timeout:30000});
    const initial = await page.evaluate(() => __CAD_APP.craftService.modifications$.value.history[0].params.featureId);
    await page.evaluate(() => __CAD_APP.craftService.historyTravel.backward());
    await page.waitForFunction(() => __CAD_APP.craftService.modifications$.value.pointer === -1 && !__CAD_APP.craftService.isProcessing, {timeout:30000});
    await page.evaluate(() => { __CAD_APP.wizardService.updateParam('width', 15); __CAD_APP.services.wizard.applyWorkingRequest(); });
    await page.waitForFunction(() => __CAD_APP.craftService.modifications$.value.pointer === 0 && !__CAD_APP.craftService.isProcessing, {timeout:30000});
    const result = await page.evaluate(async feature => {
      const c = __CAD_APP, history = c.craftService.modifications$.value.history;
      const m = await import('/manufacturingMetadata.mjs'); // test fixture served separately, never product route
      const metadata = {version:1, unit:'millimeter', revision:'r1', materials:[{id:'p',name:'PLA'}], appearances:[{id:'red',name:'Red',color:'#ff0000'}], bindings:[{id:'body',featureId:Number(feature),operationType:'NATIVE_MESH_BOX'}], objects:[{id:'part',name:'Part',regions:[{id:'r',bodyId:'body',materialId:'p',appearanceId:'red',transform:[1,0,0,0,1,0,0,0,1,0,0,0]}]}]};
      const proposal = m.proposeManufacturingRebind(metadata, history, c.cadRegistry.shells, 'r2');
      return {width:history[0].params.width, feature:history[0].params.featureId, origin:proposal.objects[0].regions[0].body.originatingOperation};
    }, initial);
    assert.equal(+result.width, 15); assert.equal(result.feature, initial); assert.equal(result.origin, 0);
    console.log('PASS: real native box parameter change produces a cautious rebind proposal');
  } finally { await context.close(); browser.disconnect(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
