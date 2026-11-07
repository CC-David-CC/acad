// Each case uses a fresh volatile workspace and the rendered application's real service.
const assert = require('node:assert/strict');
const puppeteer = require(process.env.PUPPETEER_CORE_PATH || 'puppeteer-core');
const base = new URL(process.env.JSKETCHER_TEST_URL || 'http://127.0.0.1:19341/');
const cdp = new URL(process.env.CODI_TEST_CDP || 'http://127.0.0.1:19331/');
for (const u of [base, cdp]) if (!['127.0.0.1', 'localhost', '[::1]'].includes(u.hostname)) throw Error('Loopback only');

(async () => {
  const browser = await puppeteer.connect({browserURL: cdp.href, protocolTimeout: 120000});
  try {
    const outcomes = [];
    for (const reset of ['empty', 'loadData', 'loadStrict']) {
      const context = await browser.createBrowserContext();
      try {
        const page = await context.newPage();
        await page.goto(new URL('index-webos.html?DEFAULT&webos=1', base).href);
        await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true', {timeout: 90000});
        const before = await page.evaluate(reset => {
          const c = __CAD_APP;
          c.surfacingService.addPlane(100, 100);
          const before = c.surfacingService.save();
          const model = {history: [], expressions: ''};
          if (reset === 'empty') c.projectService.empty();
          else if (reset === 'loadData') c.projectService.loadData(model);
          else { c.services.storage.set(c.projectService.projectStorageKey(), JSON.stringify(model)); c.projectService.loadStrict(); }
          return !!before;
        }, reset);
        assert.equal(before, true, `${reset}: real plane exists before replacement`);
        await page.waitForFunction('!__CAD_APP.craftService.isProcessing', {timeout: 30000});
        // The prior plane scheduled a two-second autosave before the reset.
        await new Promise(resolve => setTimeout(resolve, 2300));
        const result = await page.evaluate(() => {
          const c = __CAD_APP, snapshot = c.projectManager.snapshotCurrentProject();
          return {after: c.surfacingService.save(), hasSurfacing: Object.hasOwn(snapshot.project, 'surfacing'),
            stored: c.services.storage.get(c.projectService.projectStorageKey() + '.surfacing')};
        });
        outcomes.push({reset, ...result});
      } finally { await context.close(); }
    }
    console.log('Surfacing reset observations:', JSON.stringify(outcomes.map(({reset, after, hasSurfacing, stored}) => ({reset, scene: !!after, hasSurfacing, stored: stored !== null}))));
    for (const result of outcomes) {
      assert.equal(result.after, null, `${result.reset}: prior scene must be discarded`);
      assert.equal(result.hasSurfacing, false, `${result.reset}: new snapshot must not contain prior scene`);
      assert.equal(result.stored, null, `${result.reset}: old autosave must not recreate the surfacing key`);
    }
    const source = await browser.createBrowserContext(), destination = await browser.createBrowserContext();
    try {
      const open = async context => {
        const page = await context.newPage();
        await page.goto(new URL('index-webos.html?DEFAULT&webos=1', base).href);
        await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true', {timeout: 90000});
        return page;
      };
      const from = await open(source);
      const authored = await from.evaluate(() => {
        __CAD_APP.surfacingService.addPlane(100, 50);
        return __CAD_APP.projectManager.snapshotCurrentProject();
      });
      assert.ok(authored.project.surfacing, 'source project contains a scene');
      const to = await open(destination);
      await to.evaluate(e => __CAD_APP.projectManager.restoreSnapshotBytesInEmptyWorkspace(new Blob([JSON.stringify(e)])), authored);
      const restored = await to.evaluate(() => __CAD_APP.surfacingService.save());
      const expected = structuredClone(authored.project.surfacing);
      assert.ok(restored, 'native restore loads the authored scene');
      delete expected.scene.idCounters; delete restored.scene.idCounters;
      assert.deepEqual(restored, expected, 'authored surfacing survives native restore');
    } finally { await source.close(); await destination.close(); }
    console.log('PASS surfacing scenes are cleared on empty, loadData and loadStrict');
  } finally { browser.disconnect(); }
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
