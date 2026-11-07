// Real SMLib history: a known native refusal must preserve the prior document.
const assert = require('node:assert/strict');
const puppeteer = require('puppeteer-core');
const base = new URL(process.env.JSKETCHER_TEST_URL);
const cdp = new URL(process.env.CODI_TEST_CDP);
if (![base, cdp].every(u => ['127.0.0.1', 'localhost', '[::1]'].includes(u.hostname))) throw Error('Expected loopback fixture');
(async () => {
  const browser = await puppeteer.connect({browserURL: cdp.href, protocolTimeout: 120000});
  const context = await browser.createBrowserContext();
  try {
    const p = await context.newPage();
    await p.goto(new URL('index-webos.html?DEFAULT&webos=1', base).href);
    await p.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true', {timeout: 90000});
    await p.evaluate(() => { window.hostLifetime = new AbortController(); __CAD_APP.projectService.bindHostLifetime({signal: hostLifetime.signal, valid: () => true}); });
    async function box(origin, dimensions) {
      return p.evaluate(async ({origin, dimensions}) => { const c = __CAD_APP.craftService, i = c.inspectWorkerSolids(); return c.createWorkerSolidBox({revision:i.revision, version:1, unit:'millimeter', engine:'smlib', origin, dimensions}); }, {origin, dimensions});
    }
    async function combine(kind, a, b) {
      return p.evaluate(async ({kind,a,b}) => { const c = __CAD_APP.craftService, i = c.inspectWorkerSolids(); return c.createWorkerSolidBoolean({revision:i.revision, version:1, unit:'millimeter', engine:'smlib', kind, a, b}); }, {kind,a,b});
    }
    async function state() { return p.evaluate(async () => ({outputs:__CAD_APP.craftService.inspectWorkerSolids().outputs, native:await __CAD_APP.projectManager.snapshotCurrentProject()})); }
    const a = await box([0,0,0], [10,10,10]);
    const b = await box([2,2,2], [6,6,6]);
    const hollow = await combine('subtract', a.outputId, b.outputId);
    const insert = await box([2,2,2], [6,6,6]);
    const before = await state();
    let failure;
    try { await combine('union', hollow.outputId, insert.outputId); } catch (e) { failure = {name:e.name, message:e.message}; }
    assert.ok(failure, 'expected native H union I refusal');
    assert.deepEqual(await state(), before, 'refusal changed native history or published outputs');
    // The normal native snapshot path must still succeed after the refusal.
    const saved = await p.evaluate(async () => __CAD_APP.projectManager.snapshotForHostSave());
    assert.ok(saved);
    const reverse = await combine('union', insert.outputId, hollow.outputId);
    const after = await state();
    const output = after.outputs.find(o => o.outputId === reverse.outputId);
    assert.ok(output && Math.abs(output.metrics.volumeMagnitude - 1000) < 0.1, 'explicit reverse union volume');
    console.log('REFUSAL', JSON.stringify(failure));
    console.log('PASS native refusal preserves document and explicit reverse union volume', output.metrics.volumeMagnitude);
  } finally { await context.close(); browser.disconnect(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
