// Exercise the actual service initializer through a test-only bundle export.
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
  async function box(page, size) {
    await page.evaluate(size => {
      const c = __CAD_APP; c.actionService.run('BOX');
      for (const [key, value] of Object.entries({x: size, y: 20, z: 30})) c.wizardService.updateParam(key, value);
      c.services.wizard.applyWorkingRequest();
    }, size);
    await page.waitForFunction('__CAD_APP.craftService.modifications$.value.history.length===1 && !__CAD_APP.craftService.isProcessing', {timeout: 30000});
  }
  try {
    // First replace an occupied service and verify scene, model, and new save/reopen.
    const old = await fresh();
    await box(old.page, 10);
    const reset = await old.page.evaluate(() => {
      const c = __CAD_APP, previous = c.projectService;
      c.surfacingService.addPlane(100, 100);
      const hadScene = !!c.surfacingService.save(), hadModel = c.craftService.modifications$.value.history.length === 1;
      webosTest.initProjectService(c, 'replacement-project', {});
      return {hadScene, hadModel, oldAborted: previous.documentSignal.aborted,
        oldCurrent: previous.isDocumentCurrent(previous.documentGeneration), newId: c.projectService.id};
    });
    assert.deepEqual(reset, {hadScene: true, hadModel: true, oldAborted: true, oldCurrent: false, newId: 'replacement-project'});
    await old.page.waitForFunction('!__CAD_APP.craftService.isProcessing', {timeout: 30000});
    const clean = await old.page.evaluate(() => ({scene: __CAD_APP.surfacingService.save(), history: __CAD_APP.craftService.modifications$.value.history.length}));
    assert.deepEqual(clean, {scene: null, history: 0});
    await box(old.page, 15);
    const saved = await old.page.evaluate(() => __CAD_APP.projectManager.snapshotCurrentProject());
    const reopened = await fresh();
    await reopened.page.evaluate(e => __CAD_APP.projectManager.restoreSnapshotBytesInEmptyWorkspace(new Blob([JSON.stringify(e)])), saved);
    const loaded = await reopened.page.evaluate(() => __CAD_APP.projectManager.snapshotCurrentProject());
    assert.deepEqual(loaded.project.model.history, saved.project.model.history);
    await reopened.context.close(); await old.context.close();

    // The old validator runs for real, but its completed message is held until
    // after replacement and a new successful restore have both occurred.
    const pending = await fresh();
    await pending.page.evaluate(saved => {
      const Native = window.Worker;
      window.probe = {terminated: 0, held: null, handler: null};
      window.Worker = class extends Native {
        set onmessage(handler) {
          probe.handler = handler;
          super.onmessage = event => { if (event.data?.progress === 'started') handler(event); else probe.held = event; };
        }
        terminate() { probe.terminated++; return super.terminate(); }
      };
      window.oldOpen = __CAD_APP.projectManager.restoreSnapshotBytesInEmptyWorkspace(new Blob([JSON.stringify(saved)]))
        .then(() => ({ok: true}), e => ({ok: false, name: e.name}));
    }, saved);
    await pending.page.waitForFunction('window.probe.held !== null', {timeout: 30000});
    const outcome = await pending.page.evaluate(async () => {
      const previous = __CAD_APP.projectService;
      webosTest.initProjectService(__CAD_APP, 'replacement-after-validator', {});
      return {old: await oldOpen, aborted: previous.documentSignal.aborted, terminated: probe.terminated};
    });
    assert.deepEqual(outcome, {old: {ok: false, name: 'AbortError'}, aborted: true, terminated: 1});
    await pending.page.waitForFunction('!__CAD_APP.craftService.isProcessing', {timeout: 30000});
    await pending.page.evaluate(e => __CAD_APP.projectManager.restoreSnapshotInEmptyWorkspace(JSON.stringify(e)), saved);
    const unchanged = await pending.page.evaluate(() => {
      const before = JSON.stringify(__CAD_APP.projectManager.snapshotCurrentProject());
      probe.handler(probe.held);
      return before === JSON.stringify(__CAD_APP.projectManager.snapshotCurrentProject());
    });
    assert.equal(unchanged, true, 'terminated old validator cannot publish into the replacement');
    await pending.context.close();
    console.log('PASS service replacement isolates old model, surfacing and held validator');
  } finally { browser.disconnect(); }
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
