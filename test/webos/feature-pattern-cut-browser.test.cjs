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
    const seedIdentity = await page.evaluate(() => {
      const s = __CAD_APP.cadRegistry.shells[0];
      return {
        id: s.id,
        faces: s.faces.map(f => f.id),
        edges: s.edges.map(e => e.id)
      };
    });
    const capturedIdentity = await page.evaluate(async () => {
      const c = __CAD_APP,
            seedRequest = c.craftService.modifications$.value.history.at(-1),
            seed = seedRequest.params.featureId,
            seedObjectId = Number(JSON.parse(c.sketchStorageService.getSketchData(seedRequest.params.face)).objects.find(o => o.type === 'Circle').id),
            op = c.operationService.get('EXTRUDE'),
            original = op.run;
      let captured;

      op.run = async (...args) => {
        const result = await original(...args);

        if (Number(args[2]?.featureId) === Number(seed)) {
          const s = result.created[0];
          captured = {
            id: s.id,
            faces: s.faces.map(f => f.id),
            edges: s.edges.map(e => e.id)
          };
        }

        return result;
      };

      try {
        await new Promise((ok, no) => c.craftService.modify({
          type: 'PATTERN_CUT_LINEAR',
          params: {
            featureId: c.projectService.counterGenerator.generateFeatureId(),
            seedFeatureId: seed,
            seedObjectId,
            count: 3,
            spacing: 20,
            axis: 'X'
          }
        }, ok, no));
        return captured;
      } finally {
        op.run = original;
      }
    });
    assert.deepEqual(capturedIdentity, seedIdentity, 'capturing the seed tool must not change generated seed IDs');

    const testRays = async (p, xs, y) => p.evaluate(({
      xs,
      y
    }) => xs.map(x => webosTest.modellerUISubject(__CAD_APP).rayCastFaces([x, y, 30], [x, y, -10]).length), {
      xs,
      y
    });

    assert.deepEqual(await testRays(page, [50, 70, 90, 60], 25), [0, 0, 0, 2]);
    await page.evaluate(() => {
      const c = __CAD_APP;
      c.occService.io.pushModel(c.cadRegistry.shells[0], 'patternMass');
      c.occService.commandInterface.vprops('patternMass');
    });
    await new Promise(r => setTimeout(r, 100));
    assert.ok(Math.abs(masses.at(-1) - (100 * 50 * 20 - 3 * Math.PI * 25 * 20)) < 1, 'analytic volume must include exactly three through-cuts');
    await page.evaluate(async () => {
      const c = __CAD_APP;
      c.craftService.historyTravel.backward({
        noWizardFocus: true
      });

      while (c.craftService.isProcessing) await new Promise(r => setTimeout(r, 20));
    });
    const afterUndo = await page.evaluate(() => {
      const s = __CAD_APP.cadRegistry.shells[0];
      return {
        id: s.id,
        faces: s.faces.map(f => f.id),
        edges: s.edges.map(e => e.id)
      };
    });
    assert.deepEqual(afterUndo, seedIdentity, 'seed topology identity must survive capture and undo');
    await page.evaluate(async () => {
      const c = __CAD_APP;
      c.craftService.historyTravel.forward({
        noWizardFocus: true
      });

      while (c.craftService.isProcessing) await new Promise(r => setTimeout(r, 20));
    });
    assert.deepEqual(await testRays(page, [50, 70, 90, 60], 25), [0, 0, 0, 2]);
    const removeSnapshot = await page.evaluate(() => __CAD_APP.projectManager.snapshotCurrentProject());
    const removed = await context.newPage();
    await removed.goto(new URL('index-webos.html?DEFAULT&webos=1', base).href);
    await removed.waitForFunction('window.__CAD_APP?.streams?.lifecycle?.projectLoaded?.value === true',{timeout:90000});
    await removed.evaluate(async snap => __CAD_APP.projectManager.restoreSnapshotBytesInEmptyWorkspace(new Blob([JSON.stringify(snap)], {type:'application/json'})), removeSnapshot);
    const afterRemove = await removed.evaluate(async () => {
      const c=__CAD_APP;
      c.streams.craft.modifications.update(({history})=>({history:history.slice(0,-1),pointer:history.length-2}));
      while(c.craftService.isProcessing) await new Promise(r=>setTimeout(r,20));
      const shell=c.cadRegistry.shells[0];
      return {id:shell.id,faces:shell.faces.map(f=>f.id),edges:shell.edges.map(e=>e.id)};
    });
    assert.deepEqual(afterRemove,seedIdentity,'removing a pattern must restore original seed IDs');
    await removed.close();
    await page.evaluate(async () => {
      const c = __CAD_APP,
            ui = webosTest.modellerUISubject(c);
      c.craftService.historyTravel.setPointer(0);

      while (c.craftService.isProcessing) await new Promise(r => setTimeout(r, 20));

      c.services.marker.clear();
      const face = c.cadRegistry.findFace('S:0/SURFACE');
      c.services.marker.markExclusively(face.TYPE, face.id);
      const base = ui.openSketcher();
      base.viewer.parametricManager.applyConstantDefinition('width = 150\nheight = 30');
      await ui.commitSketch();
      await new Promise(r => setTimeout(r, 300));
      c.craftService.historyTravel.end();

      while (c.craftService.isProcessing) await new Promise(r => setTimeout(r, 20));

      if (c.craftService.pipelineFailure$.value) throw Error(c.craftService.pipelineFailure$.value.userMessage || 'replay failed');
    });
    assert.deepEqual(await testRays(page, [75, 95, 115, 85, 50], 15), [0, 0, 0, 2, 2]);
    const ids = await page.evaluate(() => {
      const s = __CAD_APP.cadRegistry.shells[0];
      return [...s.faces, ...s.edges].map(o => o.id);
    });
    assert.equal(new Set(ids).size, ids.length, 'generated topology IDs must not collide');
    const snapshot = await page.evaluate(() => __CAD_APP.projectManager.snapshotCurrentProject());
    const inactive = await context.newPage();
    await inactive.goto(new URL('index-webos.html?DEFAULT&webos=1', base).href);
    await inactive.waitForFunction('window.__CAD_APP?.streams?.lifecycle?.projectLoaded?.value === true', {
      timeout: 90000
    });
    await inactive.evaluate(async snap => __CAD_APP.projectManager.restoreSnapshotBytesInEmptyWorkspace(new Blob([JSON.stringify(snap)], {
      type: 'application/json'
    })), snapshot);
    const inactiveResult = await inactive.evaluate(async () => {
      const c = __CAD_APP,
            req = structuredClone(c.craftService.modifications$.value.history[2]);
      c.craftService.historyTravel.setPointer(1);

      while (c.craftService.isProcessing) await new Promise(r => setTimeout(r, 20));

      req.params.length = 10;
      let error = '';

      try {
        await new Promise((ok, no) => c.craftService.modifyInHistoryAndStep(req, ok, no));
      } catch (e) {
        error = String(e);
      }

      const seedValid = !c.craftService.pipelineFailure$.value && c.craftService.modifications$.value.pointer === 2;
      c.craftService.historyTravel.end();

      while (c.craftService.isProcessing) await new Promise(r => setTimeout(r, 20));

      return {
        error,
        seedValid,
        patternCode: c.craftService.pipelineFailure$.value?.code
      };
    });
    assert.equal(inactiveResult.error, '');
    assert.equal(inactiveResult.seedValid, true, 'inactive later pattern must not qualify the seed');
    assert.equal(inactiveResult.patternCode, 'PATTERN_SEED_UNSUPPORTED', 'active pattern must refuse the shortened blind seed');
    await inactive.close();
    // Replace the authored circle through the sketch editor, rather than merely
  // corrupting a saved reference. The pattern must not follow the new circle.
  const replaced = await context.newPage();
  await replaced.goto(new URL('index-webos.html?DEFAULT&webos=1', base).href);
  await replaced.waitForFunction('window.__CAD_APP?.streams?.lifecycle?.projectLoaded?.value === true', {timeout: 90000});
  await replaced.addScriptTag({url: new URL('static/webosTest.bundle.js', base).href});
  await replaced.evaluate(async snap => __CAD_APP.projectManager.restoreSnapshotBytesInEmptyWorkspace(new Blob([JSON.stringify(snap)], {type:'application/json'})), snapshot);
  const replacedResult = await replaced.evaluate(async () => {
    const c=__CAD_APP, ui=webosTest.modellerUISubject(c), oldId=String(c.craftService.modifications$.value.history.at(-1).params.seedObjectId);
    const before=JSON.stringify(c.cadRegistry.shells[0].faces.map(f=>({id:f.id,mesh:f.topology.data.tessellation.data})));
    c.craftService.historyTravel.setPointer(1);
    while(c.craftService.isProcessing) await new Promise(r=>setTimeout(r,20));
    c.services.marker.clear();
    const face=c.cadRegistry.findFace('F:LID[S:0/SURFACE/12]');
    c.services.marker.markExclusively(face.TYPE,face.id);
    const sketch=ui.openSketcher();
    const old=sketch.viewer.layers.flatMap(layer=>layer.objects).find(object=>String(object.id)===oldId);
    if (!old) throw Error('Original seed circle not found in editor');
    sketch.viewer.removeAll([old]);
    const replacement=sketch.addCircle(75,15,5);
    if (String(replacement.id)===oldId) throw Error('Replacement must have its own authored ID');
    await ui.commitSketch();
    await new Promise(r=>setTimeout(r,300));
    c.craftService.historyTravel.end();
    while(c.craftService.isProcessing) await new Promise(r=>setTimeout(r,20));
    return {code:c.craftService.pipelineFailure$.value?.code,unchanged:before===JSON.stringify(c.cadRegistry.shells[0].faces.map(f=>({id:f.id,mesh:f.topology.data.tessellation.data})))};
  });
  assert.equal(replacedResult.code,'PATTERN_SEED_CHANGED');
  assert.equal(replacedResult.unchanged,true,'changed seed must retain the last accepted geometry');
  await replaced.close();
  const reopened = await context.newPage(), reopenedMasses = [];
  reopened.on('console', message => { const m=/Mass\s*:\s*([\d.eE+-]+)/.exec(message.text()); if(m) reopenedMasses.push(Number(m[1])); });
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
    assert.deepEqual(await testRays(reopened, [75, 95, 115, 85, 50], 15), [0, 0, 0, 2, 2]);
    const reopenedIds = await reopened.evaluate(() => {
      const s = __CAD_APP.cadRegistry.shells[0];
      return [...s.faces, ...s.edges].map(o => o.id);
    });
    assert.deepEqual(reopenedIds, ids, 'patterned topology IDs must survive reopen');
    await reopened.evaluate(() => {
      window.patternAcceptedSignature = () => {
        const c=__CAD_APP, mods=c.craftService.modifications$.value;
        return JSON.stringify({history:mods.history,pointer:mods.pointer,failure:c.craftService.pipelineFailure$.value,
          faces:c.cadRegistry.shells[0].faces.map(f=>({id:f.id,mesh:f.topology.data.tessellation.data}))});
      };
    });
    await reopened.evaluate(async () => {
      const c = __CAD_APP,
            req = structuredClone(c.craftService.modifications$.value.history.at(-1));
      c.craftService.historyTravel.backward({
        noWizardFocus: true
      });

      while (c.craftService.isProcessing) await new Promise(r => setTimeout(r, 20));

      req.params.count = 2;
      req.params.spacing = -20;
      await new Promise((ok, no) => c.craftService.modifyInHistoryAndStep(req, ok, no));
    });
    assert.deepEqual(await testRays(reopened, [75, 55, 95, 65], 15), [0, 0, 2, 2], 'count and signed spacing must change the actual cuts');
    await reopened.evaluate(async () => {
      const c = __CAD_APP,
            ui = webosTest.modellerUISubject(c);
      c.craftService.historyTravel.setPointer(1);

      while (c.craftService.isProcessing) await new Promise(r => setTimeout(r, 20));

      c.services.marker.clear();
      const face = c.cadRegistry.findFace('F:LID[S:0/SURFACE/12]');
      c.services.marker.markExclusively(face.TYPE, face.id);
      const sketch = ui.openSketcher();
      sketch.viewer.parametricManager.applyConstantDefinition('holeRadius = 7');
      await ui.commitSketch();
      await new Promise(r => setTimeout(r, 300));
      c.craftService.historyTravel.end();

      while (c.craftService.isProcessing) await new Promise(r => setTimeout(r, 20));

      if (c.craftService.pipelineFailure$.value) throw Error(c.craftService.pipelineFailure$.value.userMessage || 'seed replay failed');
    });
    assert.deepEqual(await testRays(reopened, [81, 61, 83, 63], 15), [0, 0, 2, 2], 'changing seed radius must rebuild each patterned tool');
    const invalid = await reopened.evaluate(async () => {
      const c = __CAD_APP,
            req = structuredClone(c.craftService.modifications$.value.history.at(-1));
      c.craftService.historyTravel.backward({
        noWizardFocus: true
      });

      while (c.craftService.isProcessing) await new Promise(r => setTimeout(r, 20));

      // Rejection preserves the accepted rollback revision, not geometry from
      // the later history tip paired with this earlier pointer.
      const before = window.patternAcceptedSignature();
      req.params.spacing = 5;
      let code = '';

      try {
        await new Promise((ok, no) => c.craftService.modifyInHistoryAndStep(req, ok, no));
      } catch (e) {
        code = e.code || '';
      }

      return {
        code,
        unchanged: before === window.patternAcceptedSignature(),
        request: req
      };
    });
    assert.equal(invalid.code, 'PATTERN_PARAMETERS_INVALID');
    assert.equal(invalid.unchanged, true, 'invalid pattern must retain prior valid geometry');
    await reopened.evaluate(async req => {
      const c = __CAD_APP;
      req.params.spacing = -20;
      await new Promise((ok, no) => c.craftService.modifyInHistoryAndStep(req, ok, no));
    }, invalid.request);
    assert.deepEqual(await testRays(reopened, [81, 61, 83, 63], 15), [0, 0, 2, 2]);
    const changed = await reopened.evaluate(async () => {
      const c = __CAD_APP,
            req = structuredClone(c.craftService.modifications$.value.history.at(-1));
      c.craftService.historyTravel.backward({
        noWizardFocus: true
      });

      while (c.craftService.isProcessing) await new Promise(r => setTimeout(r, 20));

      const before=window.patternAcceptedSignature();
      req.params.seedObjectId++;
      let code = '';

      try {
        await new Promise((ok, no) => c.craftService.modifyInHistoryAndStep(req, ok, no));
      } catch (e) {
        code = e.code || '';
      }

      return {
        code,
        unchanged:before===window.patternAcceptedSignature(),
        req
      };
    });
    assert.equal(changed.code, 'PATTERN_SEED_CHANGED');
    assert.equal(changed.unchanged,true,'rejected seed change must preserve history, validity and matching geometry');
    assert.deepEqual(await testRays(reopened, [81, 61, 83, 63], 15), [0, 2, 2, 2], 'rollback contains the seed cut only');
    await reopened.evaluate(async req => {
      req.params.seedObjectId--;
      await new Promise((ok, no) => __CAD_APP.craftService.modifyInHistoryAndStep(req, ok, no));
    }, changed.req);
    // Force the pattern Boolean itself to fail, after a real seed replay. An
    // old global OCC result must not be accepted as the new result.
    const failedBoolean = await reopened.evaluate(async () => {
      const c=__CAD_APP, req=structuredClone(c.craftService.modifications$.value.history.at(-1));
      c.craftService.historyTravel.backward({noWizardFocus:true});
      while(c.craftService.isProcessing) await new Promise(r=>setTimeout(r,20));
      const before=window.patternAcceptedSignature();
      const oci=c.occService.commandInterface, original=oci.bapibop;
      oci.bapibop=(...args)=>args[0]==='CodiPatternResult' ? 1 : original(...args);
      let code='';
      try { await new Promise((ok,no)=>c.craftService.modifyInHistoryAndStep(req,ok,no)); }
      catch (error) { code=error.code||''; }
      finally { delete oci.bapibop; }
      return {code,unchanged:before===window.patternAcceptedSignature(),req};
    });
    assert.equal(failedBoolean.code,'PATTERN_BOOLEAN_FAILED');
    assert.equal(failedBoolean.unchanged,true,'failed Boolean must preserve accepted geometry');
    await reopened.evaluate(async req=>new Promise((ok,no)=>__CAD_APP.craftService.modifyInHistoryAndStep(req,ok,no)),failedBoolean.req);
    // A success return without writing the output must not accept stale OCC data.
    const missingOutput = await reopened.evaluate(async () => {
      const c=__CAD_APP, req=structuredClone(c.craftService.modifications$.value.history.at(-1));
      c.craftService.historyTravel.backward({noWizardFocus:true});
      while(c.craftService.isProcessing) await new Promise(r=>setTimeout(r,20));
      const before=window.patternAcceptedSignature();
      req.params.spacing=20;
      const oci=c.occService.commandInterface, original=oci.bapibop;
      oci.bapibop=(...args)=>args[0]==='CodiPatternResult' ? 0 : original(...args);
      let code='';
      try { await new Promise((ok,no)=>c.craftService.modifyInHistoryAndStep(req,ok,no)); }
      catch (error) { code=error.code||''; }
      finally { delete oci.bapibop; }
      return {code,unchanged:before===window.patternAcceptedSignature(),req};
    });
    assert.equal(missingOutput.code,'PATTERN_BOOLEAN_FAILED','a no-output success must not accept a previous result');
    assert.equal(missingOutput.unchanged,true);
    missingOutput.req.params.spacing=-20;
    await reopened.evaluate(async req=>new Promise((ok,no)=>__CAD_APP.craftService.modifyInHistoryAndStep(req,ok,no)),missingOutput.req);
    // The qualified seed and copied instance also use bounded names: neither
    // may silently reuse a prior shape if an OCC command succeeds without output.
    for (const phase of ['seedBoolean','seedCopy','instanceCopy']) {
      const fault=await reopened.evaluate(async phase=>{
        const c=__CAD_APP,req=structuredClone(c.craftService.modifications$.value.history.at(-1));
        c.craftService.historyTravel.backward({noWizardFocus:true});
        while(c.craftService.isProcessing) await new Promise(r=>setTimeout(r,20));
        const before=window.patternAcceptedSignature();
        const oci=c.occService.commandInterface, command=phase==='seedBoolean'?'bapibop':'copy', original=oci[command];
        oci[command]=(...args)=>((phase==='seedBoolean'&&args[0]==='CodiPatternSeedResult') ||
          (phase==='seedCopy'&&args[1]==='CodiPatternSeed') ||
          (phase==='instanceCopy'&&args[1]==='CodiPatternInstance1')) ? 0 : original(...args);
        let code='';try{await new Promise((ok,no)=>c.craftService.modifyInHistoryAndStep(req,ok,no));}
        catch(error){code=error.code||'';}finally{delete oci[command];}
        return {code,unchanged:before===window.patternAcceptedSignature(),req};
      },phase);
      assert.equal(fault.code,phase==='seedBoolean'?'PATTERN_BOOLEAN_FAILED':'PATTERN_COPY_FAILED',phase);
      assert.equal(fault.unchanged,true,phase+' must preserve accepted geometry');
      await reopened.evaluate(async req=>new Promise((ok,no)=>__CAD_APP.craftService.modifyInHistoryAndStep(req,ok,no)),fault.req);
    }
    // Fault injection: the second bfillds (pattern, after a real seed cut)
    // returns success without preparing the changed Boolean inputs.
    const stalePreprocessing = await reopened.evaluate(async () => {
      const c=__CAD_APP, req=structuredClone(c.craftService.modifications$.value.history.at(-1));
      c.craftService.historyTravel.backward({noWizardFocus:true});
      while(c.craftService.isProcessing) await new Promise(r=>setTimeout(r,20));
      const before=window.patternAcceptedSignature();
      req.params.spacing=20;
      const oci=c.occService.commandInterface, original=oci.bfillds;
      let calls=0, code='', accepted=false;
      oci.bfillds=(...args)=>++calls===2 ? 0 : original(...args);
      try {await new Promise((ok,no)=>c.craftService.modifyInHistoryAndStep(req,ok,no));accepted=true;}
      catch(error){code=error.code||String(error);} finally {delete oci.bfillds;}
      const ui=webosTest.modellerUISubject(c);
      return {calls,accepted,code,unchanged:before===window.patternAcceptedSignature(),rays:[55,75,85,95].map(x=>ui.rayCastFaces([x,15,30],[x,15,-10]).length),req};
    });
    console.log('STALE_PREPROCESSING',JSON.stringify(stalePreprocessing));
    assert.equal(stalePreprocessing.calls,2);
    if(stalePreprocessing.accepted) {
      assert.deepEqual(stalePreprocessing.rays,[2,0,2,0],'accepted geometry must reflect the requested pattern');
      await reopened.evaluate(()=>{const c=__CAD_APP;c.occService.io.pushModel(c.cadRegistry.shells[0],'patternFreshnessMass');c.occService.commandInterface.vprops('patternFreshnessMass')});
      await new Promise(r=>setTimeout(r,100));
      assert.ok(Math.abs(reopenedMasses.at(-1)-(150*30*20-2*Math.PI*49*20))<1,'accepted volume must reflect exactly two radius-7 cuts');
    }
    else assert.equal(stalePreprocessing.unchanged,true,'failed preprocessing must retain the last accepted model');
    // Restore the previous -20 spacing for subsequent controls.
    if(stalePreprocessing.accepted){await reopened.evaluate(async()=>{const c=__CAD_APP;c.craftService.historyTravel.backward({noWizardFocus:true});while(c.craftService.isProcessing)await new Promise(r=>setTimeout(r,20));});}
    stalePreprocessing.req.params.spacing=-20;
    await reopened.evaluate(async req=>new Promise((ok,no)=>__CAD_APP.craftService.modifyInHistoryAndStep(req,ok,no)),stalePreprocessing.req);
    const missing = await page.evaluate(async () => {
      const c = __CAD_APP,
            history = c.craftService.modifications$.value.history,
            seed = history[2].params.featureId,
            seedObjectId = Number(JSON.parse(c.sketchStorageService.getSketchData(history[2].params.face)).objects.find(o => o.type === 'Circle').id);

      try {
        await new Promise((ok, no) => c.craftService.modify({
          type: 'PATTERN_CUT_LINEAR',
          params: {
            featureId: c.projectService.counterGenerator.generateFeatureId(),
            seedFeatureId: seed,
            seedObjectId,
            count: 2,
            spacing: 20,
            axis: 'X'
          }
        }, ok, no));
        return 'unexpected success';
      } catch (e) {
        return e.code || String(e);
      }
    });
    assert.equal(missing, 'PATTERN_SEED_UNSUPPORTED', 'a seed that is not immediately preceding must not be reused');
    const cancelled = await reopened.evaluate(async () => {
      const c = __CAD_APP,
            op = c.operationService.get('PATTERN_CUT_LINEAR'),
            original = op.run,
            req = structuredClone(c.craftService.modifications$.value.history.at(-1));
      c.craftService.historyTravel.backward({
        noWizardFocus: true
      });

      while (c.craftService.isProcessing) await new Promise(r => setTimeout(r, 20));

      let entered = false,
          release;
      const gate = new Promise(r => release = r);

      op.run = async (...args) => {
        entered = true;
        await gate;
        return original(...args);
      };

      try {
        const pending = new Promise((ok, no) => c.craftService.modifyInHistoryAndStep(req, ok, no)).then(() => ({
          status: 'fulfilled'
        }), e => ({
          status: 'rejected',
          name: e.name
        }));

        for (let i = 0; !entered && i < 1000; i++) await new Promise(r => setTimeout(r, 10));

        if (!entered) throw Error('pattern did not reach held callback');
        c.craftService.reset([]);
        release();
        const result = await pending;

        while (c.craftService.isProcessing) await new Promise(r => setTimeout(r, 20));

        return {
          result,
          models: c.craftService.models$.value.length,
          history: c.craftService.modifications$.value.history.length
        };
      } finally {
        release?.();
        op.run = original;
      }
    });
    assert.deepEqual(cancelled, {
      result: {
        status: 'rejected',
        name: 'AbortError'
      },
      models: 0,
      history: 0
    }, 'cancelled pattern cannot publish across document reset');
    console.log('PASS associative cut pattern, seed identity, resize, undo/redo and reopen');
  } finally {
    await context.close();
    browser.disconnect();
  }
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
