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
    const page = await context.newPage();
    page.on('console', m => {
      if (['EDGES', 'CURRENT_FACE', 'REGIONS', 'FOUR_CUT_HISTORY', 'FILLET_RESULT', 'PLATE_EDGES', 'BASE_EDITED', 'AFTER_EDIT', 'BASE_SELECTION'].some(x => m.text().startsWith(x))) console.log(m.text());
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
      await ui.commitSketch();
      await new Promise(r => setTimeout(r, 300));
      ui.selectFaces([20, 20, 30], [20, 20, 10]);
      ui.openWizard('CUT');
      ui.wizardContext.updateParam('length', 20);
      await ui.wizardOK();
    });
    await page.evaluate(() => {
      const ui = webosTest.modellerUISubject(__CAD_APP);
      ui.selectFaces([10, 10, 30], [10, 10, 10]);
      window.cornerSketch = ui.openSketcher();
      window.cornerCtx = __CAD_APP.services.sketcher.inPlaceEditor.sketcherAppContext;
      window.circles = [[10, 10], [90, 10], [90, 40], [10, 40]].map(([x, y]) => cornerSketch.addCircle(x, y, 3));
      console.log('EDGES', JSON.stringify(cornerSketch.viewer.layers.flatMap(l => l.objects).filter(o => String(o.id).startsWith('boundary/')).map(o => ({
        id: o.id,
        a: o.a && {
          x: o.a.x,
          y: o.a.y
        },
        b: o.b && {
          x: o.b.x,
          y: o.b.y
        }
      }))));
    });

    for (const [i, edge] of [[0, 3], [0, 30], [1, 3], [1, 12], [2, 21], [2, 12], [3, 21], [3, 30]]) {
      await page.evaluate(({
        i,
        edge
      }) => {
        const e = cornerSketch.viewer.layers.flatMap(l => l.objects).find(o => o.id === 'boundary/E:LID[S:0/SURFACE/' + edge + ']');
        cornerCtx.actions.DistancePL.invoke(cornerCtx, [circles[i].c, e]);
      }, {
        i,
        edge
      });
      await page.waitForFunction(() => document.body.innerText.includes('DISTANCE BETWEEN POINT AND LINE'));
      await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'APPLY').click());
      await page.waitForFunction(() => !document.body.innerText.includes('DISTANCE BETWEEN POINT AND LINE'));
    }

    const summary = await page.evaluate(() => ({
      ids: circles.map(c => c.id),
      centers: circles.map(c => ({
        x: c.c.x,
        y: c.c.y
      })),
      constraints: JSON.parse(cornerSketch.viewer.io.serializeSketch(undefined, {
        strict: true
      })).stages.flatMap(s => s.constraints).filter(c => c.typeId === 'DistancePL')
    }));
    console.log('CORNER', JSON.stringify(summary));
    await page.evaluate(async () => {
      const ui = webosTest.modellerUISubject(__CAD_APP);
      await ui.commitSketch();
      await new Promise(r => setTimeout(r, 300));
      ui.selectFaces([10, 10, 30], [10, 10, 10]);
      ui.openWizard('CUT');
      window.cutFace = __CAD_APP.cadRegistry.findFace(__CAD_APP.wizardService.workingRequest.params.face);
      console.log('CURRENT_FACE', __CAD_APP.wizardService.workingRequest.params.face);
      console.log('REGIONS', JSON.stringify(cutFace.sketchRegions.map(r => r.descriptor)));
      ui.wizardContext.updateParam('regions', cutFace.sketchRegions.map(r => r.id));
      ui.wizardContext.updateParam('bodyPolicy', 'separate');
      ui.wizardContext.updateParam('length', 20);
      await ui.wizardOK();
      const edgeId = 'E:SWEEP[S:0/SURFACE/12/A]';
      if (!__CAD_APP.cadRegistry.findEdge(edgeId)) throw Error('Missing original corner edge');

      const featureId = __CAD_APP.projectService.counterGenerator.generateFeatureId();

      await new Promise((ok, no) => __CAD_APP.craftService.modify({
        type: 'FILLET_TOOL',
        params: {
          featureId,
          edges: [edgeId],
          size: 2,
          opperationType: 'Fillet'
        }
      }, ok, no));
      const beforeFillet = {
        removed: ui.rayCastFaces([99.75, 0.25, 30], [99.75, 0.25, -10]).length,
        inside: ui.rayCastFaces([98.5, 1.5, 30], [98.5, 1.5, -10]).length
      };
      console.log('FILLET_RESULT', JSON.stringify(beforeFillet));
      if (beforeFillet.removed !== 0 || beforeFillet.inside !== 2) throw Error('Fillet geometry incorrect');
      console.log('FOUR_CUT_HISTORY', JSON.stringify(__CAD_APP.craftService.modifications$.value.history));
      console.log('PLATE_EDGES', JSON.stringify(__CAD_APP.cadRegistry.shells[0].edges.map(e => ({
        id: e.id,
        a: e.brepEdge.halfEdge1.vertexA.point,
        b: e.brepEdge.halfEdge1.vertexB.point
      }))));

      __CAD_APP.craftService.historyTravel.setPointer(0);

      for (let n = 0; n < 200 && (!__CAD_APP.cadRegistry.findFace('S:0/SURFACE') || __CAD_APP.craftService.isProcessing); n++) await new Promise(r => setTimeout(r, 50));

      __CAD_APP.services.marker.clear();

      const original = __CAD_APP.cadRegistry.findFace('S:0/SURFACE');

      __CAD_APP.services.marker.markExclusively(original.TYPE, original.id);

      await new Promise(r => setTimeout(r, 300));
      console.log('BASE_SELECTION', JSON.stringify({
        face: __CAD_APP.services.selection.face.single?.id,
        pointer: __CAD_APP.craftService.modifications$.value.pointer,
        processing: __CAD_APP.craftService.isProcessing
      }));
      const base = ui.openSketcher();
      const before = base.viewer.io.serializeSketch(undefined, {
        strict: true
      });
      base.viewer.parametricManager.applyConstantDefinition('width = 150\nheight = 30');

      const geometry = () => JSON.parse(base.viewer.io.serializeSketch(undefined, {
        strict: true
      })).objects.filter(o => o.type === 'Segment').map(o => o.data);

      const expectedEdited = geometry();
      base.viewer.historyManager.undo();
      const undone = geometry();
      if (!undone.some(s => Math.abs(s.b.x - 100) < 1e-6) || !undone.some(s => Math.abs(s.b.y - 50) < 1e-6)) throw Error('Sketch undo failed to restore 100×50');
      base.viewer.historyManager.redo();
      if (JSON.stringify(geometry()) !== JSON.stringify(expectedEdited)) throw Error('Sketch redo did not restore 150×30');
      console.log('BASE_EDITED', base.viewer.io.serializeSketch(undefined, {
        strict: true
      }));
      await ui.commitSketch();
      await new Promise(r => setTimeout(r, 300));

      __CAD_APP.craftService.historyTravel.end();

      await new Promise(r => setTimeout(r, 2000));
      console.log('AFTER_EDIT', JSON.stringify({
        rays: [[10, 10], [90, 10], [140, 10], [140, 20], [10, 20], [50, 25], [75, 15]].map(([x, y]) => ({
          x,
          y,
          hits: ui.rayCastFaces([x, y, 30], [x, y, -10]).map(f => f.id)
        })),
        corners: JSON.parse(__CAD_APP.sketchStorageService.getSketchData('F:LID[S:0/SURFACE/12]/$1')).objects.filter(o => o.type === 'Circle').map(o => o.data),
        history: __CAD_APP.craftService.modifications$.value.history,
        shells: __CAD_APP.cadRegistry.shells.map(s => ({
          id: s.id,
          faces: s.faces.length
        })),
        failure: {
          message: __CAD_APP.craftService.pipelineFailure$.value?.userMessage || __CAD_APP.craftService.pipelineFailure$.value?.message
        },
        processing: __CAD_APP.craftService.isProcessing,
        text: document.body.innerText.slice(-500)
      }));
    });

    const verify = async p => p.evaluate(() => {
      const c = __CAD_APP,
            ui = webosTest.modellerUISubject(c);
      return {
        failure: c.craftService.pipelineFailure$.value?.userMessage || c.craftService.pipelineFailure$.value?.message,
        history: c.craftService.modifications$.value.history.length,
        rays: [[10, 10], [140, 10], [140, 20], [10, 20], [75, 15]].map(([x, y]) => ui.rayCastFaces([x, y, 30], [x, y, -10]).length),
        oldLocations: [[90, 10], [50, 25]].map(([x, y]) => ui.rayCastFaces([x, y, 30], [x, y, -10]).length),
        fillet: [ui.rayCastFaces([149.75, .25, 30], [149.75, .25, -10]).length, ui.rayCastFaces([148.5, 1.5, 30], [148.5, 1.5, -10]).length]
      };
    });

    const verification = await verify(page);
    assert.equal(verification.failure, undefined, verification.failure);
    assert.equal(verification.history, 5);
    assert.deepEqual(verification.fillet, [0, 2], 'fillet must track the changed corner');
    assert.deepEqual(verification.rays, [0, 0, 0, 0, 0], 'all four edge-relative holes and centered hole must be present');
    assert.ok(verification.oldLocations.every(n => n >= 2), 'old moved-hole locations must contain solid');
    const snapshot = await page.evaluate(() => __CAD_APP.projectManager.snapshotCurrentProject());
    const reopened = await context.newPage();
    await reopened.goto(new URL('index-webos.html?DEFAULT&webos=1', base).href);
    await reopened.waitForFunction('window.__CAD_APP?.streams?.lifecycle?.projectLoaded?.value === true', {
      timeout: 90000
    });
    await reopened.addScriptTag({
      url: new URL('static/webosTest.bundle.js', base).href
    });
    await reopened.evaluate(async snapshot => __CAD_APP.projectManager.restoreSnapshotBytesInEmptyWorkspace(new Blob([JSON.stringify(snapshot)], {
      type: 'application/json'
    })), snapshot);
    assert.deepEqual(await verify(reopened), verification);
    if (process.env.CODI_NATIVE_SNAPSHOT_OUT) {
      require('node:fs').writeFileSync(process.env.CODI_NATIVE_SNAPSHOT_OUT, JSON.stringify(snapshot));
    }
    const invalid = await reopened.evaluate(async () => {
      const c = __CAD_APP,
            edge = c.cadRegistry.shells[0].edges.find(e => e.id === 'E:SWEEP[S:0/SURFACE/3/A]'),
            before = c.craftService.modifications$.value.history.length;
      const geometry = () => JSON.stringify(c.cadRegistry.shells.map(shell => ({
        id: shell.id, faces: shell.faces.map(face => ({id: face.id, mesh: face.topology.data.tessellation.data}))
      })));
      const beforeGeometry = geometry();
      let error = '';

      try {
        await new Promise((ok, no) => c.craftService.modify({
          type: 'FILLET_TOOL',
          params: {
            featureId: c.projectService.counterGenerator.generateFeatureId(),
            edges: [edge.id],
            size: 0,
            opperationType: 'Fillet'
          }
        }, ok, no));
      } catch (e) {
        error = String(e);
      }

      return {
        error,
        before,
        after: c.craftService.modifications$.value.history.length,
        geometryUnchanged: geometry() === beforeGeometry,
        failure: !!c.craftService.pipelineFailure$.value
      };
    });
    console.log('INVALID_FILLET', JSON.stringify(invalid));
    assert.match(invalid.error, /positive finite number/, 'zero-radius fillet must report its invalid size');
    assert.equal(invalid.after, invalid.before, 'invalid fillet must not add history');
    assert.equal(invalid.geometryUnchanged, true, 'invalid fillet must preserve accepted geometry');
    console.log('PASS filleted centered plate regeneration and saved reopen');
  } finally {
    await context.close();
    browser.disconnect();
  }
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
