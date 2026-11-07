const assert = require('node:assert/strict');
const puppeteer = require(process.env.PUPPETEER_CORE_PATH || 'puppeteer-core');

(async () => {
  const base = new URL(process.env.JSKETCHER_TEST_URL);
  const cdp = new URL(process.env.CODI_TEST_CDP);
  if (![base, cdp].every(u => ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname))) throw Error('Loopback only');
  const browser = await puppeteer.connect({browserURL: cdp.href});
  const context = await browser.createBrowserContext();
  try {
    const page = await context.newPage();
    await page.goto(new URL('index-webos.html?DEFAULT&webos=1', base));
    await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true', {timeout: 90000});
    await page.evaluate(() => {
      const c = __CAD_APP;
      c.projectService.bindHostLifetime({signal: new AbortController().signal, valid: () => true});
      c.surfacingService.addPlane();
      const e = c.surfacingService.view;
      e.currentTool.selectSurface(e.scene.surfaces[0]);
      window.beforeGroups = new Set(e.workingGroup.children);
      const original = e.commit.bind(e);
      window.commits = 0;
      e.commit = (...args) => { window.commits++; return original(...args); };
    });
    await page.waitForFunction('[...document.querySelectorAll("button")].some(b => b.textContent.includes("Push / Pull"))');
    await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.includes('Push / Pull')).click());
    await page.waitForFunction('[...document.querySelectorAll("label")].some(l => l.textContent === "distance")');
    const origin = await page.evaluate(async () => {
      const c = __CAD_APP, e = c.surfacingService.view;
      window.captureBefore = await c.projectManager.prepareHostSave();
      window.beforeScene = JSON.stringify(c.surfacingService.save());
      window.historyBefore = JSON.stringify(c.craftService.modifications$.value);
      const group = e.workingGroup.children.find(x => !window.beforeGroups.has(x));
      const rect = e.sceneSetup.renderer.domElement.getBoundingClientRect();
      const point = group.position.clone().project(e.sceneSetup.camera);
      return {x: rect.left + (point.x + 1) * rect.width / 2, y: rect.top + (1 - point.y) * rect.height / 2};
    });
    await page.mouse.move(origin.x, origin.y);
    await page.mouse.down();
    await page.mouse.move(origin.x + 50, origin.y - 50, {steps: 8});
    const mid = await page.evaluate(async () => {
      const c = __CAD_APP;
      window.captureDuring = await c.projectManager.prepareHostSave();
      return {changed: JSON.stringify(c.surfacingService.save()) !== window.beforeScene,
        current: window.captureBefore.isCurrent(), commits: window.commits,
        history: JSON.stringify(c.craftService.modifications$.value)};
    });
    assert.equal(mid.changed, true, 'actual pointer drag must move surface');
    assert.equal(mid.current, false, 'the pre-drag save must be stale while held');
    assert.equal(mid.commits, 0, 'notifications do not commit during the drag');
    assert.equal(mid.history, await page.evaluate(() => window.historyBefore));
    await page.mouse.up();
    const end = await page.evaluate(() => ({commits: window.commits, current: window.captureDuring.isCurrent(),
      history: JSON.stringify(__CAD_APP.craftService.modifications$.value), scene: JSON.stringify(__CAD_APP.surfacingService.save())}));
    assert.equal(end.commits, 1, 'release commits once');
    assert.equal(end.current, false, 'release invalidates captures made during the gesture');
    assert.equal(end.history, await page.evaluate(() => window.historyBefore), 'surfacing commits do not add craft history');
    await page.evaluate(async () => { window.captureAfter = await __CAD_APP.projectManager.prepareHostSave(); });
    const input = await page.evaluateHandle(() => [...document.querySelectorAll('label')].find(l => l.textContent === 'distance').nextElementSibling);
    await input.click({clickCount: 3});
    await input.type('999');
    await input.press('Escape');
    const cancelled = await page.evaluate(() => ({scene: JSON.stringify(__CAD_APP.surfacingService.save()),
      current: window.captureAfter.isCurrent(), commits: window.commits}));
    assert.equal(cancelled.scene, end.scene, 'Escape must discard an uncommitted distance edit');
    assert.equal(cancelled.current, true, 'discarding input must not stale the accepted surface');
    assert.equal(cancelled.commits, 1, 'discarding input must not commit');
    await input.click({clickCount: 3});
    await input.type('10');
    await input.press('Enter');
    const entered = await page.evaluate(() => ({scene: JSON.stringify(__CAD_APP.surfacingService.save()), commits: window.commits}));
    assert.notEqual(entered.scene, end.scene, 'Enter applies the new distance');
    assert.equal(entered.commits, 2, 'Enter followed by blur commits only once');
    await page.evaluate(() => [...document.querySelectorAll('label')].find(l => l.textContent === 'distance')
      .parentElement.querySelectorAll('button')[1].click());
    await page.evaluate(() => __CAD_APP.craftService.historyTravel.backward());
    const afterClose = await page.evaluate(() => JSON.stringify(__CAD_APP.surfacingService.save()));
    assert.equal(afterClose, entered.scene, 'closing the wizard and empty craft undo retain the applied surface');
    console.log('PASS real Push/Pull pointer drag, one commit, and input Escape');
  } finally {
    await context.close();
    browser.disconnect();
  }
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
