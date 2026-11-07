const assert = require('node:assert/strict'),
      puppeteer = require(process.env.PUPPETEER_CORE_PATH || 'puppeteer-core');

const base = new URL(process.env.JSKETCHER_TEST_URL || 'http://127.0.0.1:19914/'),
      cdp = new URL(process.env.CODI_TEST_CDP || 'http://127.0.0.1:19875/');
if (![base, cdp].every(u => ['127.0.0.1', 'localhost', '[::1]'].includes(u.hostname))) throw Error('Loopback only');
(async () => {
  const b = await puppeteer.connect({
    browserURL: cdp.href
  }),
        c = await b.createBrowserContext();

  try {
    const p = await c.newPage();
    await p.goto(new URL('index-webos.html?DEFAULT&webos=1', base));
    await p.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true');
    const r = await p.evaluate(() => {
      const c = __CAD_APP,
            n = c.operationService.get('NATIVE_MESH_BOX').run({
        x: 0,
        y: 0,
        z: 0,
        width: 10,
        depth: 10,
        height: 10,
        featureId: 100
      }, c).created[0],
            before = JSON.stringify(n.brepShell.data.__meshWithOrigins.meshData);
      let error = '';

      try {
        c.operationService.get('FILLET_TOOL').run({
          edges: [n.faces[0]],
          size: 1,
          opperationType: 'Fillet'
        }, c);
      } catch (e) {
        error = String(e.message || e);
      }

      return {
        error,
        unchanged: before === JSON.stringify(n.brepShell.data.__meshWithOrigins.meshData)
      };
    });
    assert.match(r.error, /Native Mesh.*not supported/);
    assert.equal(r.unchanged, true);
    console.log('PASS Native Mesh fillet refused without conversion or mutation');
  } finally {
    await c.close();
    b.disconnect();
  }
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
