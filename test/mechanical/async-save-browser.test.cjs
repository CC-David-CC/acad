// Actual installed editor/actions/Workers. The host lifetime is a test binding;
// signed account and Files persistence qualification is a separate test.
const assert = require('node:assert/strict');
const puppeteer = require(process.env.PUPPETEER_CORE_PATH || 'puppeteer-core');
const base = new URL(process.env.JSKETCHER_TEST_URL);
const cdp = new URL(process.env.CODI_TEST_CDP);
if (![base, cdp].every(u => ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname))) throw Error('Loopback only');

(async () => {
  const browser = await puppeteer.connect({browserURL: cdp.href, protocolTimeout: 120000});
  const context = await browser.createBrowserContext();
  try {
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(new URL('index-webos.html?DEFAULT&webos=1', base));
    await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value === true', {timeout: 90000});
    await page.addScriptTag({url: new URL('static/webosTest.bundle.js', base).href});
    const result = await page.evaluate(async () => {
      const c = __CAD_APP;
      window.testLifetime = new AbortController();
      c.projectService.bindHostLifetime({signal: testLifetime.signal, valid: () => true});
      const created = await c.craftService.createRectangleSketch({revision: c.craftService.inspectRectangleCreation().revision,
        unit: 'millimeter', origin: [0, 0], width: 100, height: 50, depth: 0});
      const stored = () => c.sketchStorageService.getSketchData(created.faceId);
      const storedVersion = () => c.storageService.versionOf(c.projectService.sketchStorageKey(created.faceId));
      const snapshot = () => JSON.stringify(c.projectManager.snapshotCurrentProject());
      const before = {source: stored(), native: snapshot(), storage: storedVersion()};
      const open = () => c.services.sketcher.sketchFace(c.cadRegistry.findFace(created.faceId));
      open();
      const editor = c.services.sketcher.inPlaceEditor;
      const Native = window.Worker;
      let workerCount = 0;
      window.Worker = class extends Native { constructor(...args) { super(...args); workerCount++; } };
      try {
        const first = editor.save();
        const duplicate = await editor.save().then(() => '', e => e.message);
        const receipt = await first;
        receipt.verifyBeforeExit();
        const duplicateProof = {duplicate, pending: editor.savePending, inEditMode: editor.inEditMode};
        await c.actionService.run('sketchSaveAndExit');
        const noop = {source: stored(), native: snapshot(), storage: storedVersion(), workerCount};
        open();
        const ctx = editor.sketcherAppContext;
        ctx.actions.RectangleTool.invoke(ctx);
        const activeTool = await c.actionService.run('sketchSaveAndExit').then(() => '', e => e.message);
        const toolProof = {activeTool, open: editor.inEditMode, unchanged: stored() === before.source};
        editor.viewer.toolManager.releaseControl();
        await c.actionService.run('sketchSaveAndExit');
        return {created, before, noop, duplicateProof, toolProof,
          after: {source: stored(), native: snapshot(), storage: storedVersion(), workerCount}};
      } finally { window.Worker = Native; }
    });
    assert.match(result.duplicateProof.duplicate, /already in progress/);
    assert.equal(result.duplicateProof.pending, false);
    assert.equal(result.duplicateProof.inEditMode, true);
    for (const saved of [result.noop, result.after]) {
      assert.equal(saved.source, result.before.source, 'no-op retains exact stored source');
      assert.equal(saved.native, result.before.native, 'no-op retains exact native document');
      assert.equal(saved.storage, result.before.storage, 'no-op does not publish a storage revision');
      assert.equal(saved.workerCount, 0, 'no-op never launches a Worker');
    }
    assert.match(result.toolProof.activeTool, /Finish the current sketch operation/);
    assert.equal(result.toolProof.open, true);
    assert.equal(result.toolProof.unchanged, true);
    assert.deepEqual(errors, []);
    console.log('PASS actual editor no-op bytes/native/storage, duplicate Save, active-tool refusal and no Worker');

    // A changed sketch uses the real disposable validator.
    await page.evaluate(() => {
      const c = __CAD_APP;
      c.services.sketcher.sketchFace(c.cadRegistry.findFace(c.cadRegistry.shells[0].faces[0].id));
      window.Cypress = {$: selector => { const a = [...document.querySelectorAll(selector)]; a.index = n => a.indexOf(n); return a; }};
    });
    // Use the native constraint list to edit an actual driving length.
    await page.waitForFunction(() => [...document.querySelectorAll('span')].some(e => e.textContent.includes('Segment Length')));
    await page.evaluate(() => [...document.querySelectorAll('span')].find(e => e.textContent.includes('Segment Length')).parentElement.click());
    await page.waitForFunction(() => document.body.innerText.includes('SEGMENT LENGTH'));
    const field = (await page.$$('input[type=text]'))[0];
    await field.click({clickCount: 3}); await field.press('Backspace'); await field.type('140'); await field.press('Enter');
    await page.waitForFunction(() => !document.body.innerText.includes('SEGMENT LENGTH'));
    const changed = await page.evaluate(async () => {
      const c = __CAD_APP, e = c.services.sketcher.inPlaceEditor, id = e.face.id;
      const before = c.sketchStorageService.getSketchData(id), Native = window.Worker;
      let validated = 0, terminated = 0;
      window.Worker = class extends Native {
        postMessage(message, ...args) { if (message?.task === 'sketch-save-validation') validated++; return super.postMessage(message, ...args); }
        terminate() { terminated++; return super.terminate(); }
      };
      try { await c.actionService.run('sketchSaveAndExit'); return {before, after: c.sketchStorageService.getSketchData(id), validated, terminated, open: e.inEditMode}; }
      finally { window.Worker = Native; }
    });
    assert.notEqual(changed.after, changed.before);
    assert.equal(changed.validated, 1);
    assert.equal(changed.terminated, 1);
    assert.equal(changed.open, false);
    const authored = JSON.parse(changed.after);
    const dimension = authored.stages.flatMap(s => s.constraints).find(r => r.typeId === 'SegmentLength' && Number(r.constants.length) === 140);
    assert.ok(dimension, 'the authored driving value is saved');
    const segment = authored.objects.find(o => o.id === dimension.objects[0]);
    assert.ok(Math.abs(Math.hypot(segment.data.b.x-segment.data.a.x, segment.data.b.y-segment.data.a.y)-140) < 1e-6,
      'stored geometry satisfies the saved dimension');
    assert.deepEqual(errors, []);
    console.log('PASS actual driving length edit independently validated in Worker before Save-and-Exit');

    await page.evaluate(() => {
      const c = __CAD_APP;
      window.beforeCancelledSave = JSON.stringify(c.projectManager.snapshotCurrentProject());
      c.services.sketcher.sketchFace(c.cadRegistry.shells[0].faces[0]);
    });
    await page.waitForFunction(() => [...document.querySelectorAll('span')].some(e => e.textContent.includes('Segment Length')));
    await page.evaluate(() => [...document.querySelectorAll('span')].find(e => e.textContent.includes('Segment Length')).parentElement.click());
    await page.waitForFunction(() => document.body.innerText.includes('SEGMENT LENGTH'));
    const nextField = (await page.$$('input[type=text]'))[0];
    await nextField.click({clickCount: 3}); await nextField.press('Backspace'); await nextField.type('160'); await nextField.press('Enter');
    await page.waitForFunction(() => !document.body.innerText.includes('SEGMENT LENGTH'));
    await page.evaluate(() => {
      const c = __CAD_APP, editor = c.services.sketcher.inPlaceEditor;
      window.cancelledSaveControl = {held: false, terminated: 0, source: c.sketchStorageService.getSketchData(editor.face.id),
        faceId: editor.face.id, history: editor.viewer.historyManager, Native: window.Worker};
      const control = cancelledSaveControl;
      window.Worker = class extends control.Native {
        postMessage(message, ...args) {
          if (message?.task === 'sketch-save-validation') { control.held = true; return; }
          return super.postMessage(message, ...args);
        }
        terminate() { control.terminated++; return super.terminate(); }
      };
      control.pending = c.actionService.run('sketchSaveAndExit').then(() => ({ok: true}), e => ({ok: false, name: e.name}));
    });
    await page.waitForFunction(() => cancelledSaveControl.held, {timeout: 30000});
    const cancelled = await page.evaluate(async () => {
      const c = __CAD_APP, control = cancelledSaveControl;
      try {
        c.services.sketcher.inPlaceEditor.exit();
        return {outcome: await control.pending, terminated: control.terminated,
          sourceUnchanged: c.sketchStorageService.getSketchData(control.faceId) === control.source,
          nativeUnchanged: JSON.stringify(c.projectManager.snapshotCurrentProject()) === beforeCancelledSave,
          historyEntries: control.history.diffs.length, lastCheckpoint: control.history.lastCheckpoint,
          open: c.services.sketcher.inPlaceEditor.inEditMode};
      } finally { window.Worker = control.Native; }
    });
    assert.deepEqual(cancelled.outcome, {ok: false, name: 'AbortError'});
    assert.equal(cancelled.terminated, 1);
    assert.equal(cancelled.sourceUnchanged, true);
    assert.equal(cancelled.nativeUnchanged, true);
    assert.equal(cancelled.historyEntries, 0);
    assert.equal(cancelled.lastCheckpoint, '');
    assert.equal(cancelled.open, false);
    assert.deepEqual(errors, []);
    console.log('PASS closing during a held validation terminates Worker and preserves stored/native bytes');
  } finally { await context.close(); browser.disconnect(); }
})().catch(e => { console.error(e.stack); process.exitCode = 1; });
