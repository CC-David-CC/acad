// Real browser SPI boundary. Serve contract.mjs as static/codi-engine-contract.mjs
// next to the exact source-built CAD app; never point at public or production hosts.
const assert = require('node:assert/strict');
const puppeteer = require(process.env.PUPPETEER_CORE_PATH || 'puppeteer-core');
const base = new URL(process.env.JSKETCHER_TEST_URL || 'http://127.0.0.1:19351/');
const cdp = new URL(process.env.CODI_TEST_CDP || 'http://127.0.0.1:19352/');
for (const u of [base, cdp]) if (!['127.0.0.1','localhost','[::1]'].includes(u.hostname)) throw Error('Loopback only');
(async () => {
  const browser = await puppeteer.connect({browserURL:cdp.href, protocolTimeout:120000});
  const context = await browser.createBrowserContext();
  try {
    const page = await context.newPage();
    await page.goto(new URL('index-webos.html?DEFAULT&webos=1', base).href);
    await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true', {timeout:90000});
    const result = await page.evaluate(async () => {
      const {createEngineMount} = await import('./static/codi-engine-contract.mjs');
      const engine = __CAD_APP.craftEngine.modellingEngine;
      const boxExport = typeof window.Module._SPI_box === 'function', disposeExport = typeof window.Module._SPI_dispose === 'function';
      const runtime = {spiBoxBound:boxExport && disposeExport, createBox:p => engine.createBox(p), dispose:p => engine.dispose(p)};
      const mount = createEngineMount({engine:'occ-spi-v1', runtime,
        provenance:{runtimeSha256:'a2b2f7daf6a4eb98b975f8aec136f6cbaf2720295ea32e71edb13ff4c5ceaecb'}});
      let error; try { await mount.execute({op:'solid.box.create',version:1,unit:'millimeter',dimensions:[10,20,30],deflection:0.1}); }
      catch (e) { error=e.code; }
      const binding=mount.descriptor.operations[0].binding; mount.close();
      return {boxExport, disposeExport, binding, error};
    });
    assert.deepEqual(result, {boxExport:false, disposeExport:false, binding:'unbound', error:'UNBOUND_OPERATION'});
    console.log('PASS source-built OCC runtime lacks legacy SPI box/dispose and mount refuses them');
  } finally { await context.close(); browser.disconnect(); }
})().catch(error => {console.error(error.stack); process.exitCode=1;});
