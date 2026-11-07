// Gate 1 negative control: original sketch resize must regenerate edge-relative cuts.
const assert = require('node:assert/strict');

const puppeteer = require(process.env.PUPPETEER_CORE_PATH || 'puppeteer-core');

const base = new URL(process.env.JSKETCHER_TEST_URL || 'http://127.0.0.1:19910/'),
      cdp = new URL(process.env.CODI_TEST_CDP || 'http://127.0.0.1:19875');

for (const u of [base, cdp]) if (!['127.0.0.1', 'localhost', '[::1]'].includes(u.hostname)) throw Error('Loopback only');

async function apply(page, id, index, value) {
  await page.evaluate(({
    id,
    index
  }) => ctx.actions[id].invoke(ctx, [window.parts[index]]), {
    id,
    index
  });
  await page.waitForFunction(() => document.body.innerText.includes('SEGMENT LENGTH'));
  const input = (await page.$$('input[type=text]'))[0];
  await input.click({
    clickCount: 3
  });
  await input.press('Backspace');
  await input.type(value);
  await input.press('Enter');
  await page.waitForFunction(() => !document.body.innerText.includes('SEGMENT LENGTH'));
}

(async () => {
  const browser = await puppeteer.connect({
    browserURL: cdp.href
  }),
        context = await browser.createBrowserContext();

  try {
    const page = await context.newPage(),
          masses = [];
    page.on('console', m => {
      const match = /Mass\s*:\s*([\d.eE+-]+)/.exec(m.text());
      if (match) masses.push(Number(match[1]));
    });
    page.on('console', m => {
      if (['EDGES', 'CURRENT_FACE', 'REGIONS', 'FOUR_CUT_HISTORY', 'BASE_EDITED', 'AFTER_EDIT', 'BASE_SELECTION'].some(x => m.text().startsWith(x))) console.log(m.text());
    });
    await page.goto(new URL('index-webos.html?DEFAULT&webos=1', base).href, {
      waitUntil: 'domcontentloaded'
    });
    await page.waitForFunction('window.__CAD_APP?.streams?.lifecycle?.projectLoaded?.value === true', {
      timeout: 90000
    });
    await page.addScriptTag({
      url: new URL('static/webosTest.bundle.js', base).href
    });
    await page.evaluate(async () => {
      window.Cypress = {
        $: s => {
          const a = [...document.querySelectorAll(s)];

          a.index = n => a.indexOf(n);

          return a;
        }
      };
      const ui = webosTest.modellerUISubject(__CAD_APP),
            [sketch] = await webosTest.createPlaneAndOpenSketcher(ui);
      window.ctx = __CAD_APP.services.sketcher.inPlaceEditor.sketcherAppContext;
      window.parts = sketch.addRectangle(0, 0, 100, 50);
      window.pm = ctx.viewer.parametricManager;

      for (let i = 0; i < 4; i++) ctx.actions.Coincident.invoke(ctx, [parts[i].b, parts[(i + 1) % 4].a]);

      ctx.actions.Horizontal.invoke(ctx, [parts[0], parts[2]]);
      ctx.actions.Vertical.invoke(ctx, [parts[1], parts[3]]);
      pm.applyConstantDefinition('width = 100\nheight = width / 2');
      ctx.actions.Lock.invoke(ctx, [parts[0].a]);
    });
    await page.waitForFunction(() => document.body.innerText.includes('LOCK POINT'));
    await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'APPLY').click());
    await page.waitForFunction(() => !document.body.innerText.includes('LOCK POINT'));
    await apply(page, 'Length', 0, 'width');
    await apply(page, 'Length', 1, 'height');
    await page.evaluate(async () => {
      const ui = webosTest.modellerUISubject(__CAD_APP);
      await ui.commitSketch();
      await new Promise(r => setTimeout(r, 300));
      ui.selectFaces([10, 10, -10], [10, 10, 10]);
      ui.openWizard('EXTRUDE');
      ui.wizardContext.updateParam('length', 20);
      await ui.wizardOK();
      ui.selectFaces([50, 25, 30], [50, 25, 10]);
      const top = ui.openSketcher();
      const sc = __CAD_APP.services.sketcher.inPlaceEditor.sketcherAppContext;
      top.changeToConstructionLayer();
      const a = top.addSegment(0, 0, 100, 50),
            b = top.addSegment(100, 0, 0, 50);
      top.changeToDefaultLayer();
      const hole = top.addCircle(50, 25, 5);
      sc.actions.PointOnLine.invoke(sc, [hole.c, a]);
      sc.actions.PointOnLine.invoke(sc, [hole.c, b]);
      sc.viewer.parametricManager.applyConstantDefinition('holeRadius = 5');
      sc.actions.RadiusLength.invoke(sc, [hole]);
    });
    await page.waitForFunction(() => document.body.innerText.includes('RADIUS LENGTH'));
    const radiusInput = (await page.$$('input[type=text]'))[0];
    await radiusInput.click({
      clickCount: 3
    });
    await radiusInput.press('Backspace');
    await radiusInput.type('holeRadius');
    await radiusInput.press('Enter');
    await page.waitForFunction(() => !document.body.innerText.includes('RADIUS LENGTH'));
    await page.evaluate(async () => {
      const ui = webosTest.modellerUISubject(__CAD_APP);
      await ui.commitSketch();
      await new Promise(r => setTimeout(r, 300));
      ui.selectFaces([20, 20, 30], [20, 20, 10]);
      ui.openWizard('CUT');
      ui.wizardContext.updateParam('length', 20);
      await ui.wizardOK();
    });
    const seedSnapshot = await page.evaluate(() => __CAD_APP.projectManager.snapshotCurrentProject());

    for (const mode of ['document', 'history']) {
      const other = await context.newPage();
      await other.goto(new URL('index-webos.html?DEFAULT&webos=1', base).href);
      await other.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value === true', {
        timeout: 90000
      });
      await other.evaluate(async snap => __CAD_APP.projectManager.restoreSnapshotBytesInEmptyWorkspace(new Blob([JSON.stringify(snap)], {
        type: 'application/json'
      })), seedSnapshot);
      await other.click('[aria-label="Linear cut pattern"]');
      await other.waitForFunction(() => document.querySelector('[aria-label="Pattern seed"]')?.textContent.includes('Previous circular cut'));
      await other.evaluate(mode => {
        if (mode === 'document') __CAD_APP.projectService.empty();else __CAD_APP.craftService.historyTravel.backward({
          noWizardFocus: true
        });
      }, mode);
      await other.waitForFunction(() => !document.querySelector('[data-operation-id="PATTERN_CUT_LINEAR"]'), {
        timeout: 30000
      });
      assert.equal(await other.evaluate(() => __CAD_APP.craftService.modifications$.value.history.some(op => op.type === 'PATTERN_CUT_LINEAR')), false, mode + ' must not create a pattern');
      await other.close();
    } // Simulate a concurrent sketch replacement after the picker is already
    // open. The core must reject it rather than bind to the new authored ID.


    const race = await context.newPage();
    await race.goto(new URL('index-webos.html?DEFAULT&webos=1', base).href);
    await race.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value === true', {
      timeout: 90000
    });
    await race.evaluate(async snap => __CAD_APP.projectManager.restoreSnapshotBytesInEmptyWorkspace(new Blob([JSON.stringify(snap)], {
      type: 'application/json'
    })), seedSnapshot);
    await race.click('[aria-label="Linear cut pattern"]');
    await race.waitForFunction(() => document.querySelector('[aria-label="Pattern seed"]')?.textContent.includes('Previous circular cut'));
    await race.evaluate(() => {
      const c = __CAD_APP,
            seed = c.craftService.modifications$.value.history.at(-1),
            data = JSON.parse(c.sketchStorageService.getSketchData(seed.params.face));
      data.objects.find(o => o.type === 'Circle').id = '99999';
      c.sketchStorageService.setSketchData(seed.params.face, JSON.stringify(data));
    });
    const raceWizard = await race.$('[data-operation-id="PATTERN_CUT_LINEAR"]');
    await (await raceWizard.$('.dialog-ok')).click();
    await race.waitForFunction(() => !__CAD_APP.craftService.isProcessing && !!__CAD_APP.wizardService.state$.value.error, {
      timeout: 30000
    });
    assert.equal(await race.evaluate(() => __CAD_APP.craftService.modifications$.value.history.some(op => op.type === 'PATTERN_CUT_LINEAR')), false, 'changed seed must not create a pattern');
    await race.close();
    const original = await page.evaluate(() => JSON.stringify(__CAD_APP.craftService.modifications$.value.history));
    await page.click('[aria-label="Linear cut pattern"]');
    let wizard = await page.waitForSelector('[data-operation-id="PATTERN_CUT_LINEAR"]', {
      visible: true
    });
    await page.waitForFunction(() => document.querySelector('[aria-label="Pattern seed"]')?.textContent.includes('Previous circular cut'));
    const selected = await page.evaluate(() => ({ ...__CAD_APP.wizardService.workingRequest.params
    }));
    assert.ok(Number.isSafeInteger(selected.seedFeatureId));
    assert.ok(Number.isSafeInteger(selected.seedObjectId));
    await (await wizard.$('.dialog-cancel')).click();
    assert.equal(await page.evaluate(() => JSON.stringify(__CAD_APP.craftService.modifications$.value.history)), original, 'cancel must preserve history');
    await page.click('[aria-label="Linear cut pattern"]');
    wizard = await page.waitForSelector('[data-operation-id="PATTERN_CUT_LINEAR"]', {
      visible: true
    });
    await page.waitForFunction(() => document.querySelector('[aria-label="Pattern seed"]')?.textContent.includes('Previous circular cut'));
    await (await wizard.$('.dialog-ok')).click();
    await page.waitForFunction(() => !__CAD_APP.wizardService.workingRequest && !__CAD_APP.craftService.isProcessing, {
      timeout: 30000
    });
    const created = await page.evaluate(() => __CAD_APP.craftService.modifications$.value.history.at(-1));
    assert.equal(created.type, 'PATTERN_CUT_LINEAR');
    assert.equal(created.params.seedFeatureId, selected.seedFeatureId);
    assert.equal(created.params.seedObjectId, selected.seedObjectId);
    const snapshot = await page.evaluate(() => __CAD_APP.projectManager.snapshotCurrentProject());
    const restored = await context.newPage();
    await restored.goto(new URL('index-webos.html?DEFAULT&webos=1', base).href);
    await restored.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value === true', {
      timeout: 90000
    });
    await restored.evaluate(async snap => __CAD_APP.projectManager.restoreSnapshotBytesInEmptyWorkspace(new Blob([JSON.stringify(snap)], {
      type: 'application/json'
    })), snapshot);
    await restored.evaluate(() => __CAD_APP.craftService.historyTravel.backward({
      noWizardFocus: true
    }));
    wizard = await restored.waitForSelector('[data-operation-id="PATTERN_CUT_LINEAR"]', {
      visible: true
    });
    await restored.waitForFunction(() => document.querySelector('[aria-label="Pattern seed"]')?.textContent.includes('Previous circular cut'));
    const editSeed = await restored.evaluate(() => ({ ...__CAD_APP.wizardService.workingRequest.params
    }));
    assert.equal(editSeed.seedFeatureId, selected.seedFeatureId);
    assert.equal(editSeed.seedObjectId, selected.seedObjectId);
    const inputs = await wizard.$$('input[type="text"]');
    assert.equal(inputs.length, 2);
    await inputs[1].click({
      clickCount: 3
    });
    await inputs[1].press('Backspace');
    await inputs[1].type('-20');
    await (await wizard.$('.dialog-ok')).click();
    await restored.waitForFunction(() => !__CAD_APP.craftService.isProcessing && __CAD_APP.craftService.modifications$.value.pointer === __CAD_APP.craftService.modifications$.value.history.length - 1, {
      timeout: 30000
    });
    const edited = await restored.evaluate(() => __CAD_APP.craftService.modifications$.value.history.at(-1));
    assert.equal(edited.params.seedFeatureId, selected.seedFeatureId);
    assert.equal(edited.params.seedObjectId, selected.seedObjectId);
    assert.equal(Number(edited.params.spacing), -20); // Replace the seed via the actual sketch editor. Editing the existing
    // pattern must keep its old reference until the user chooses repair.

    await restored.addScriptTag({
      url: new URL('static/webosTest.bundle.js', base).href
    });
    await restored.evaluate(async () => {
      const c = __CAD_APP,
            ui = webosTest.modellerUISubject(c);
      c.craftService.historyTravel.setPointer(1);

      while (c.craftService.isProcessing) await new Promise(r => setTimeout(r, 20));

      c.services.marker.clear();
      const face = c.cadRegistry.findFace('F:LID[S:0/SURFACE/12]');
      c.services.marker.markExclusively(face.TYPE, face.id);
      const sketch = ui.openSketcher(),
            old = sketch.viewer.layers.flatMap(layer => layer.objects).find(o => String(o.id) === String(c.craftService.modifications$.value.history.at(-1).params.seedObjectId));
      if (!old) throw Error('missing seed circle');
      sketch.viewer.removeAll([old]);
      sketch.addCircle(50, 25, 5);
      await ui.commitSketch();
      await new Promise(r => setTimeout(r, 300));
      c.craftService.historyTravel.end();

      while (c.craftService.isProcessing) await new Promise(r => setTimeout(r, 20));
    });
    assert.equal(await restored.evaluate(() => __CAD_APP.craftService.pipelineFailure$.value?.code), 'PATTERN_SEED_CHANGED');
    await restored.evaluate(() => __CAD_APP.craftService.historyTravel.backward({
      noWizardFocus: true
    }));
    wizard = await restored.waitForSelector('[data-operation-id="PATTERN_CUT_LINEAR"]', {
      visible: true
    });
    await restored.waitForFunction(() => document.querySelector('[aria-label="Pattern seed"]')?.textContent.includes('unavailable or changed'));
    const beforeRepair = await restored.evaluate(() => ({
      working: __CAD_APP.wizardService.workingRequest.params.seedObjectId,
      saved: __CAD_APP.craftService.modifications$.value.history.at(-1).params.seedObjectId
    }));
    assert.equal(beforeRepair.working, selected.seedObjectId);
    assert.equal(beforeRepair.saved, selected.seedObjectId);
    const repair = await restored.$$('button');
    let repairButton;

    for (const button of repair) {
      if ((await restored.evaluate(el => el.textContent, button)).trim() === 'Use preceding circular cut') repairButton = button;
    }

    assert.ok(repairButton, 'explicit repair button must be visible');
    await repairButton.click();
    const chosen = await restored.evaluate(() => ({
      working: __CAD_APP.wizardService.workingRequest.params.seedObjectId,
      saved: __CAD_APP.craftService.modifications$.value.history.at(-1).params.seedObjectId
    }));
    assert.notEqual(chosen.working, selected.seedObjectId);
    assert.equal(chosen.saved, selected.seedObjectId, 'repair is not persisted before OK');
    await (await wizard.$('.dialog-ok')).click();
    await restored.waitForFunction(() => !__CAD_APP.craftService.isProcessing && __CAD_APP.craftService.modifications$.value.pointer === __CAD_APP.craftService.modifications$.value.history.length - 1, {
      timeout: 30000
    });
    assert.equal(await restored.evaluate(() => __CAD_APP.craftService.pipelineFailure$.value), null);
    console.log('PASS visible seed wizard create, cancel, edit and reopen');
  } finally {
    await context.close();
    browser.disconnect();
  }
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
