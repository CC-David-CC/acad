// Real project validator and craft replay, with deterministic holds at their async boundaries.
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
    return {context, page};
  }
  try {
    // Generate a real authored feature, rather than fabricate an operation request.
    const source = await fresh();
    await source.page.evaluate(() => {
      const c = __CAD_APP; c.actionService.run('BOX');
      for (const [key, value] of Object.entries({x: 10, y: 20, z: 30})) c.wizardService.updateParam(key, value);
      c.services.wizard.applyWorkingRequest();
    });
    await source.page.waitForFunction('__CAD_APP.craftService.modifications$.value.history.length===1 && !__CAD_APP.craftService.isProcessing', {timeout: 30000});
    const authored = await source.page.evaluate(() => __CAD_APP.projectManager.snapshotCurrentProject());
    authored.project.sketches.push({id: 'lifetime-fixture', data: {
      version: 3, objects: [], dimensions: [], labels: [],
      stages: [{constraints: [], generators: []}], constants: ''
    }});
    await source.context.close();

    // Hold the result of the actual validator worker; reset must terminate it.
    for (const reset of ['empty', 'loadData', 'loadStrict']) {
    const a = await fresh();
    await a.page.evaluate(envelope => {
      const Native = window.Worker;
      window.testWorkers = {started: 0, terminated: 0, held: null, handler: null};
      window.Worker = class extends Native {
        constructor(...args) { super(...args); window.testWorkers.started++; }
        set onmessage(handler) {
          window.testWorkers.handler = handler;
          super.onmessage = event => {
            if (event.data?.progress === 'started') return handler(event);
            window.testWorkers.held = event;
          };
        }
        terminate() { window.testWorkers.terminated++; return super.terminate(); }
      };
      window.oldRestore = __CAD_APP.projectManager.restoreSnapshotBytesInEmptyWorkspace(new Blob([JSON.stringify(envelope)]))
        .then(() => ({ok: true}), e => ({ok: false, name: e.name}));
    }, authored);
    await a.page.waitForFunction('window.testWorkers.held !== null', {timeout: 30000});
    const old = await a.page.evaluate(async reset => {
      const c = __CAD_APP, empty = {history: [], expressions: ''};
      if (reset === 'empty') c.projectService.empty();
      else if (reset === 'loadData') c.projectService.loadData(empty);
      else { c.services.storage.set(c.projectService.projectStorageKey(), JSON.stringify(empty)); c.projectService.loadStrict(); }
      return await window.oldRestore;
    }, reset);
    assert.equal(old.ok, false); assert.equal(old.name, 'AbortError');
    assert.equal(await a.page.evaluate(() => testWorkers.terminated), 1, 'reset terminates the real validator');
    await a.page.evaluate(envelope => __CAD_APP.projectManager.restoreSnapshotInEmptyWorkspace(JSON.stringify(envelope)), authored);
    const afterLate = await a.page.evaluate(() => {
      const before = JSON.stringify(__CAD_APP.projectManager.snapshotCurrentProject());
      testWorkers.handler(testWorkers.held); // simulate an already queued old reply after termination
      return {before, after: JSON.stringify(__CAD_APP.projectManager.snapshotCurrentProject()), terminated: testWorkers.terminated};
    });
    assert.equal(afterLate.after, afterLate.before, 'late validator reply must not affect new project');
    assert.equal(afterLate.terminated, 1);
    await a.context.close();
    }

    // The legacy kernel is serialized: release its noncooperative hold and wait
    // for drain before restoring again. This does not prove kernel interruption.
    const b = await fresh();
    await b.page.evaluate(envelope => {
      const c = __CAD_APP, op = c.operationService.get('BOX'), original = op.run;
      let release; const hold = new Promise(resolve => { release = resolve; });
      window.testReplay = {started: false, release, original, op};
      op.run = async function (...args) { window.testReplay.started = true; await hold; return original.apply(this, args); };
      window.oldReplay = c.projectManager.restoreSnapshotInEmptyWorkspace(JSON.stringify(envelope))
        .then(() => ({ok: true}), e => ({ok: false, name: e.name}));
    }, authored);
    await b.page.waitForFunction('window.testReplay.started', {timeout: 30000});
    assert.ok(await b.page.evaluate(() => __CAD_APP.services.storage.getAllKeysFromNamespace(__CAD_APP.projectService.sketchStorageNamespace).some(key => key.includes('lifetime-fixture'))), 'old sketch was actually staged before reset');
    await b.page.evaluate(() => { testReplay.op.run = testReplay.original; __CAD_APP.projectService.empty(); });
    assert.equal(await b.page.evaluate(() => __CAD_APP.services.storage.getAllKeysFromNamespace(__CAD_APP.projectService.sketchStorageNamespace).some(key => key.includes('lifetime-fixture'))), false, 'reset removes the old staged sketch');
    assert.equal(await b.page.evaluate(() => __CAD_APP.projectManager.getManufacturingMetadata()), null, 'reset clears project metadata');
    const oldReplay = await b.page.evaluate(async () => { testReplay.release(); return await window.oldReplay; });
    assert.equal(oldReplay.ok, false); assert.equal(oldReplay.name, 'AbortError');
    await b.page.waitForFunction('!__CAD_APP.craftService.isProcessing', {timeout: 30000});
    await b.page.evaluate(envelope => __CAD_APP.projectManager.restoreSnapshotBytesInEmptyWorkspace(new Blob([JSON.stringify(envelope)])), authored);
    const replay = await b.page.evaluate(async () => {
      const before = JSON.stringify(__CAD_APP.projectManager.snapshotCurrentProject());
      await new Promise(resolve => setTimeout(resolve, 100));
      return {before, after: JSON.stringify(__CAD_APP.projectManager.snapshotCurrentProject())};
    });
    assert.equal(replay.after, replay.before, 'cancelled replay must not change or poison new project');
    await b.context.close();
    console.log('PASS document reset cancels held validator and drains held replay before replacement');
  } finally { browser.disconnect(); }
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
