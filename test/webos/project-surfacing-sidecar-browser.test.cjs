// Saved same-project sidecars and explicit replacement have different semantics.
const assert = require('node:assert/strict');
const puppeteer = require(process.env.PUPPETEER_CORE_PATH || 'puppeteer-core');
const base = new URL(process.env.JSKETCHER_TEST_URL || 'http://127.0.0.1:19341/');
const cdp = new URL(process.env.CODI_TEST_CDP || 'http://127.0.0.1:19331/');
for (const u of [base, cdp]) if (!['127.0.0.1', 'localhost', '[::1]'].includes(u.hostname)) throw Error('Loopback only');

(async () => {
  const browser = await puppeteer.connect({browserURL: cdp.href, protocolTimeout: 120000});
  async function fresh() {
    const context = await browser.createBrowserContext(), page = await context.newPage();
    await page.goto(new URL('index-webos.html?DEFAULT&webos=1', base).href);
    await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true', {timeout: 90000});
    await page.addScriptTag({url: new URL('static/webosTest.bundle.js', base).href});
    return {context, page};
  }
  function sameScene(actual, expected) {
    assert.ok(actual && expected, 'both saved and loaded scenes exist');
    delete actual.scene.idCounters; delete expected.scene.idCounters;
    assert.deepEqual(actual, expected);
  }
  try {
    const same = await fresh();
    const sameResult = await same.page.evaluate(() => {
      const c = __CAD_APP, key = c.projectService.projectStorageKey();
      c.surfacingService.addPlane(64, 32);
      const authored = c.surfacingService.save(), text = JSON.stringify(authored);
      c.services.storage.set(key, JSON.stringify({history: [], expressions: ''}));
      c.services.storage.set(key + '.surfacing', text);
      c.projectService.loadStrict();
      return {authored, loaded: c.surfacingService.save(), stored: c.services.storage.get(key + '.surfacing'), text};
    });
    sameScene(sameResult.loaded, sameResult.authored);
    assert.equal(sameResult.stored, sameResult.text, 'same-project load preserves the saved sidecar');
    await same.context.close();

    const blank = await fresh();
    await blank.page.evaluate(() => {
      const c = __CAD_APP, key = c.projectService.projectStorageKey();
      c.surfacingService.addPlane(64, 32);
      c.services.storage.set(key + '.surfacing', JSON.stringify(c.surfacingService.save()));
      c.projectService.empty();
    });
    await blank.page.waitForFunction('!__CAD_APP.craftService.isProcessing', {timeout: 30000});
    await new Promise(resolve => setTimeout(resolve, 2300));
    const blankResult = await blank.page.evaluate(() => ({scene: __CAD_APP.surfacingService.save(),
      stored: __CAD_APP.services.storage.get(__CAD_APP.projectService.projectStorageKey() + '.surfacing')}));
    assert.deepEqual(blankResult, {scene: null, stored: null}, 'explicit empty removes the prior scene and sidecar after its old autosave deadline');
    await blank.context.close();

    const switched = await fresh();
    const preseed = await switched.page.evaluate(() => {
      const c = __CAD_APP, destination = 'sidecar-destination', key = 'TCAD.projects.' + destination;
      c.surfacingService.addPlane(80, 40);
      const authored = c.surfacingService.save(), text = JSON.stringify(authored);
      c.services.storage.set(key, JSON.stringify({history: [], expressions: ''}));
      c.services.storage.set(key + '.surfacing', text);
      const previous = c.projectService;
      webosTest.initProjectService(c, destination, {});
      return {authored, text, oldAborted: previous.documentSignal.aborted,
        keyAfterSwitch: c.services.storage.get(key + '.surfacing'), cleared: c.surfacingService.save()};
    });
    assert.equal(preseed.oldAborted, true);
    assert.equal(preseed.cleared, null, 'switch starts with an empty view');
    assert.equal(preseed.keyAfterSwitch, preseed.text, 'switch must not delete destination sidecar');
    const loaded = await switched.page.evaluate(() => {
      __CAD_APP.projectService.loadStrict();
      return {scene: __CAD_APP.surfacingService.save(), stored: __CAD_APP.services.storage.get(__CAD_APP.projectService.projectStorageKey() + '.surfacing')};
    });
    assert.equal(loaded.stored, preseed.text);
    sameScene(loaded.scene, preseed.authored);
    await switched.context.close();
    console.log('PASS saved surfacing sidecar reload, empty removal and destination preservation');
  } finally { browser.disconnect(); }
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
