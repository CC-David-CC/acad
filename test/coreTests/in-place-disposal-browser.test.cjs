// Actual Chromium teardown; the source-method unit is a separate fault control.
const assert = require('node:assert/strict');
const puppeteer = require(process.env.PUPPETEER_CORE_PATH || '/tmp/codi-occt-release-control/node_modules/puppeteer-core');
const base = new URL(process.env.JSKETCHER_TEST_URL), cdp = new URL(process.env.CODI_TEST_CDP);
if (![base, cdp].every(u => ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname))) throw Error('Loopback only');
(async () => {
  const browser = await puppeteer.connect({browserURL: cdp.href, protocolTimeout: 120000});
  const context = await browser.createBrowserContext();
  try {
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(new URL('index-webos.html?DEFAULT&webos=1', base));
    await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true', {timeout: 90000});
    const result = await page.evaluate(async () => {
      const app = __CAD_APP, craft = app.craftService, life = new AbortController();
      app.projectService.bindHostLifetime({signal: life.signal, valid: () => true});
      const rect = await craft.createRectangleSketch({revision: craft.inspectRectangleCreation().revision,
        unit: 'millimeter', origin: [10, 20], width: 100, height: 50, depth: 0});
      const editor = app.services.sketcher.inPlaceEditor;
      app.services.sketcher.sketchFace(app.cadRegistry.findFace(rect.faceId));
      const ctx = editor.sketcherAppContext, viewer = ctx.viewer, canvas = viewer.canvas;
      const key = editor.sketchStorageKey, saved = app.services.storage.get(key);
      const segment = viewer.createIndex()['rect-0'], action = ctx.actions.SignedDistanceX;
      const info = await action.inspect(ctx);
      await action.invokeByIds(ctx, [segment.a.id, segment.b.id], 100, info.revision);
      viewer.historyManager._checkpoint();
      const entriesBefore = viewer.historyManager.diffs.length, token = editor.pickControlToken, released = [];
      const release = app.pickControlService.releasePickControl;
      app.pickControlService.releasePickControl = function (value) { released.push(value); return release.call(this, value); };
      const disposeTool = viewer.toolManager.dispose.bind(viewer.toolManager), injected = new Error('injected tool cleanup');
      let reentryRefused = false;
      viewer.toolManager.dispose = () => {
        disposeTool();
        try { editor.enter(app.cadRegistry.findFace(rect.faceId)); }
        catch (error) { reentryRefused = /still closing/.test(error.message); }
        throw injected;
      };
      let sameError = false;
      try { editor.exit(); } catch (error) { sameError = error === injected; }
      finally { app.pickControlService.releasePickControl = release; }
      const result = {sameError, reentryRefused, entriesBefore, token, released, detached: !canvas.isConnected,
        faceCleared: editor.face === null, contextCleared: editor.sketcherAppContext === null, disposersCleared: editor.disposers === null, tokenCleared: editor.pickControlToken === null,
        faceStreamCleared: app.streams.sketcher.sketchingFace.value === null, contextStreamCleared: app.streams.sketcher.sketcherAppContext.value === null,
        entries: viewer.historyManager.diffs.length, checkpoint: viewer.historyManager.lastCheckpoint,
        recovery: viewer.historyManager.recoverySnapshot, savedUnchanged: app.services.storage.get(key) === saved};
      editor.exit();
      app.services.viewer.requestRender();
      app.services.sketcher.sketchFace(app.cadRegistry.findFace(rect.faceId));
      result.reopened = editor.inEditMode && editor.viewer !== viewer;
      editor.exit();
      return result;
    });
    assert.ok(result.entriesBefore > 0);
    assert.deepEqual(result.released, [result.token]);
    for (const key of ['sameError', 'reentryRefused', 'detached', 'savedUnchanged', 'reopened', 'faceCleared', 'contextCleared', 'disposersCleared', 'tokenCleared', 'faceStreamCleared', 'contextStreamCleared']) assert.equal(result[key], true, key);
    assert.equal(result.recovery, null);
    assert.equal(result.entries, 0); assert.equal(result.checkpoint, '');
    await page.setViewport({width: 1100, height: 800});
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.deepEqual(errors, []);
    console.log('PASS actual editor cleanup failure releases ownership/history, refuses reentry, preserves saved bytes and permits reopen/resize.');
  } finally { await context.close(); browser.disconnect(); }
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
