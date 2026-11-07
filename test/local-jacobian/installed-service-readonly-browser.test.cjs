// Uses only the installed service and public core model operations. No helper route.
const assert = require('node:assert/strict');
const puppeteer = require(process.env.PUPPETEER_CORE_PATH || '/tmp/codi-occt-release-control/node_modules/puppeteer-core');
const base = new URL(process.env.JSKETCHER_TEST_URL), cdp = new URL(process.env.CODI_TEST_CDP);
if (![base, cdp].every(u => ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname))) throw Error('Loopback only');
(async () => {
  const browser = await puppeteer.connect({browserURL: cdp.href, protocolTimeout: 120000});
  const context = await browser.createBrowserContext();
  try {
    const page = await context.newPage();
    await page.goto(new URL('index-webos.html?DEFAULT&webos=1', base));
    await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true', {timeout: 90000});
    const observed = await page.evaluate(async () => {
      const app = __CAD_APP, craft = app.craftService, life = new AbortController();
      app.projectService.bindHostLifetime({signal: life.signal, valid: () => true});
      const rectangle = await craft.createRectangleSketch({revision: craft.inspectRectangleCreation().revision,
        unit: 'millimeter', origin: [10, 20], width: 100, height: 50, depth: 0});
      const service = app.sketchDiagnosticService;
      const savedBefore = JSON.stringify(app.projectManager.snapshotCurrentProject());
      let info = service.inspect();
      const saved = await service.analyze({revision: info.revision, mode: 'saved', faceId: rectangle.faceId});
      const savedUnchanged = JSON.stringify(app.projectManager.snapshotCurrentProject()) === savedBefore;
      app.services.sketcher.sketchFace(app.cadRegistry.findFace(rectangle.faceId));
      const editor = app.services.sketcher.inPlaceEditor, viewer = editor.viewer;
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const activeBefore = viewer.io.serializeSketch(undefined, {strict: true});
      info = service.inspect();
      const active = await service.analyze({revision: info.revision, mode: 'active', faceId: rectangle.faceId});
      const activeUnchanged = viewer.io.serializeSketch(undefined, {strict: true}) === activeBefore;
      editor.exit();
      info = craft.inspectWorkerFeatureCommands();
      const target = info.extrusionCandidates.find(item => item.faceId === rectangle.faceId);
      await craft.createWorkerExtrusion({revision: info.revision, ...target, depth: 20});
      info = service.inspect();
      const consumed = info.saved.find(item => item.faceId === rectangle.faceId);
      let refusal;
      try { await service.analyze({revision: info.revision, mode: 'saved', faceId: rectangle.faceId}); }
      catch (error) { refusal = error.code; }
      return {saved, active, savedUnchanged, activeUnchanged, consumed, refusal};
    });
    assert.equal(observed.savedUnchanged, true);
    assert.equal(observed.activeUnchanged, true);
    for (const value of [observed.saved, observed.active]) {
      assert.equal(value.scope, 'current-sketch-local-estimate');
      assert.ok(['estimated', 'ambiguous', 'zero-gradient', 'near-zero-gradient', 'unavailable'].includes(value.status));
      assert.ok(Array.isArray(value.admission));
    }
    assert.equal(observed.consumed.availability, 'consumed-source-unavailable');
    assert.equal(observed.refusal, 'CONSUMED_SOURCE_UNAVAILABLE');
    console.log('PASS installed diagnostics use actual saved/active data without publication and explicitly refuse consumed source faces.');
  } finally { await context.close(); browser.disconnect(); }
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
