// Integrated app/Worker/history test; signed host Files is a separate gate.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const puppeteer = require('puppeteer-core');
const base = new URL(process.env.JSKETCHER_TEST_URL), cdp = new URL(process.env.CODI_TEST_CDP);
if (![base, cdp].every(u => ['127.0.0.1', 'localhost', '[::1]'].includes(u.hostname))) throw Error('Loopback only');
const appSha = 'd45e4a51cdad02d8627d36fa444132186b3f718441927c232e635ce9c5ccfe50';
const wasmSha = 'f33f19cd0098b610756db70ae0d25ac1dcba315e9af9eb90e387d0668be90daa';
(async () => {
  const browser = await puppeteer.connect({browserURL: cdp.href, protocolTimeout: 120000});
  const contexts = [];
  const evidence = {source: '3bd196f3102db48ddeca5db458f6fb7969706c4c', appSha, wasmSha};
  async function open() {
    const ctx = await browser.createBrowserContext(); contexts.push(ctx);
    const p = await ctx.newPage();
    await p.goto(new URL('index-webos.html?DEFAULT&webos=1', base).href);
    await p.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true', {timeout: 90000});
    await p.evaluate(() => {
      window.hostLifetime = new AbortController();
      __CAD_APP.projectService.bindHostLifetime({signal: hostLifetime.signal, valid: () => true});
    });
    return p;
  }
  const box = (p, origin, dimensions) => p.evaluate(async ({origin, dimensions}) => {
    const c = __CAD_APP.craftService;
    return c.createWorkerSolidBox({revision: c.inspectWorkerSolids().revision, version: 1, unit: 'millimeter', engine: 'smlib', origin, dimensions});
  }, {origin, dimensions});
  const combine = (p, kind, a, b) => p.evaluate(async ({kind, a, b}) => {
    const c = __CAD_APP.craftService;
    return c.createWorkerSolidBoolean({revision: c.inspectWorkerSolids().revision, version: 1, unit: 'millimeter', engine: 'smlib', kind, a, b});
  }, {kind, a, b});
  const state = p => p.evaluate(async () => ({outputs: __CAD_APP.craftService.inspectWorkerSolids().outputs, native: await __CAD_APP.projectManager.snapshotCurrentProject()}));
  const travel = (p, direction) => p.evaluate(async direction => {
    const c = __CAD_APP.craftService;
    await c.authoredEditTravel({revision: c.inspectAuthoredEdits().revision, direction});
  }, direction);
  async function hollow(p) {
    const a = await box(p, [0,0,0], [10,10,10]);
    const i = await box(p, [2,2,2], [6,6,6]);
    const h = await combine(p, 'subtract', a.outputId, i.outputId);
    return {a, i, h};
  }
  try {
    const p = await open();
    const actualSha = await p.evaluate(async () => {
      const r = await fetch('/static/index.bundle.js');
      if (!r.ok) throw Error('Missing app');
      return [...new Uint8Array(await crypto.subtle.digest('SHA-256', await r.arrayBuffer()))].map(v => v.toString(16).padStart(2,'0')).join('');
    });
    assert.equal(actualSha, appSha);
    const {a, h} = await hollow(p);
    // The graph consumes Boolean operands; author a new insert output.
    const i = await box(p, [2,2,2], [6,6,6]), before = await state(p);
    const fill = await combine(p, 'union', h.outputId, i.outputId), after = await state(p);
    assert.equal(after.outputs.length, 1);
    assert.equal(after.outputs[0].outputId, fill.outputId);
    assert.equal(after.outputs[0].metrics.volumeMagnitude, 1000);
    assert.ok(after.native.project.model.history.filter(v => v.type.startsWith('WORKER_SOLID_')).every(v => v.params.engineRevision.endsWith(':' + wasmSha)));
    // Authored-edit travel operates on parameter edits, not creation records.
    await p.evaluate(async featureId => {
      const c = __CAD_APP.craftService, info = c.inspectWorkerSolidHistory();
      const t = info.features.find(v => v.featureId === featureId);
      await c.editWorkerSolidBox({revision: info.revision, index: t.index, featureId, engine: t.engine,
        x: t.x, y: t.y, z: t.z, width: t.width, depth: t.depth, height: 12});
    }, a.featureId);
    const edited = await state(p);
    assert.equal(edited.outputs[0].outputId, fill.outputId);
    assert.equal(edited.outputs[0].metrics.volumeMagnitude, 1200);
    await travel(p, 'undo'); assert.deepEqual((await state(p)).outputs, after.outputs);
    await travel(p, 'redo'); assert.deepEqual((await state(p)).outputs, edited.outputs);
    const q = await open();
    await q.evaluate(async value => __CAD_APP.projectManager.restoreSnapshotInEmptyWorkspace(JSON.stringify(value)), edited.native);
    const reopened = await state(q);
    assert.deepEqual(reopened.outputs, edited.outputs);
    assert.deepEqual(reopened.native.project.model.history, edited.native.project.model.history);
    evidence.fill = {volume: 1000, editedVolume: 1200, outputId: fill.outputId, editTravelAndFreshReplay: true};
    const r = await open(), parts = await hollow(r);
    const partial = await box(r, [2,2,2], [3,6,6]), accepted = await state(r);
    let failure;
    try { await combine(r, 'union', parts.h.outputId, partial.outputId); }
    catch (e) { failure = {name: e.name, message: e.message}; }
    assert.ok(failure, 'Known native-invalid partial fill must refuse');
    const refused = await state(r);
    assert.deepEqual(refused.outputs, accepted.outputs);
    const counter = accepted.native.project.model.counters.featureId;
    assert.equal(refused.native.project.model.counters.featureId, counter + 1);
    const normalized = structuredClone(refused.native);
    normalized.project.model.counters.featureId = counter;
    assert.deepEqual(normalized, accepted.native, 'Only the never-reused ID counter may advance');
    await r.evaluate(async () => __CAD_APP.projectManager.snapshotForHostSave());
    const explicitReverse = await combine(r, 'union', partial.outputId, parts.h.outputId);
    assert.equal(explicitReverse.featureId, counter + 2);
    assert.equal((await state(r)).outputs[0].metrics.volumeMagnitude, 892);
    evidence.partial = {failure, preservedExceptSkippedId: true, explicitReverseVolume: 892};
    if (process.env.CODI_RECEIPT) fs.writeFileSync(process.env.CODI_RECEIPT, JSON.stringify(evidence, null, 2) + '\n');
    console.log('PASS pinned cavity fill, shared travel/replay, invalid partial refusal and explicit reverse');
  } finally {
    for (const c of contexts) await c.close().catch(() => {});
    browser.disconnect();
  }
})().catch(e => {console.error(e); process.exitCode = 1;});
