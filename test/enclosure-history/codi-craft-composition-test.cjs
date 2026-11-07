const assert = require('node:assert/strict'),
      puppeteer = require('puppeteer-core');

(async () => {
  const base = new URL(process.env.JSKETCHER_TEST_URL),
        cdp = new URL(process.env.CODI_TEST_CDP);
  if (![base, cdp].every(x => ['localhost', '127.0.0.1', '[::1]'].includes(x.hostname))) throw Error('Loopback only');
  const browser = await puppeteer.connect({
    browserURL: cdp.href,
    protocolTimeout: 120000
  }),
        context = await browser.createBrowserContext();

  try {
    async function fresh() {
      const p = await context.newPage();
      const response = await p.goto(new URL('index-webos.html?DEFAULT&webos=1', base));
      const policy = response.headers()['content-security-policy'];
      assert.match(policy, /script-src 'self' 'wasm-unsafe-eval'/);
      assert.doesNotMatch(policy, /script-src[^;]*blob:|'unsafe-eval'/);
      await p.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true', {
        timeout: 90000
      });
      await p.evaluate(() => {
        window.testHostController = new AbortController();

        __CAD_APP.projectService.bindHostLifetime({
          signal: testHostController.signal,
          valid: () => true
        });
      });
      return p;
    }

    const p = await fresh();
    const out = await p.evaluate(async () => {
      const c = __CAD_APP,
            craft = c.craftService,
            Native = window.Worker,
            live = new Set(),
            counts = {
        made: 0,
        ended: 0,
        max: 0
      };
      window.Worker = class extends Native {
        constructor(url, opts) {
          super(url, opts);
          this.tracked = String(url).includes('oci-verified-worker');

          if (this.tracked) {
            live.add(this);
            counts.made++;
            counts.max = Math.max(counts.max, live.size);
          }
        }

        terminate() {
          if (this.tracked && live.delete(this)) counts.ended++;
          return super.terminate();
        }

      };

      const wait = async () => {
        const end = Date.now() + 90000;

        while (craft.isProcessing && Date.now() < end) await new Promise(r => setTimeout(r, 10));

        if (craft.isProcessing) throw Error('replay timeout');
      };

      const modify = req => new Promise((yes, no) => craft.modify(req, yes, no));

      const capture = () => ({
        models: craft.models$.value.map(m => ({
          id: m.id,
          role: m.outputRole,
          faces: m.faces?.length
        })),
        history: JSON.stringify(craft.modifications$.value.history),
        failure: craft.pipelineFailure$.value,
        cleanup: craft.engineCleanupFailure$.value,
        usage: craft.engineResourceUsage,
        active: live.size
      });

      try {
        await craft.createRectangleSketch({
          revision: craft.inspectRectangleCreation().revision,
          unit: 'millimeter',
          origin: [0, 0],
          width: 100,
          height: 50,
          depth: 0
        });
        let a = craft.inspectWorkerFeatureCommands();
        await craft.createWorkerExtrusion({
          revision: a.revision,
          ...a.extrusionCandidates[0],
          depth: 20
        });
        await wait();
        const plate = capture();
        const enclosureRequest = {
          type: 'WORKER_ENCLOSURE_V1',
          params: {
            featureId: 5,
            width: 100,
            length: 70,
            height: 30,
            wall: 3,
            clearance: .3,
            lidThickness: 3,
            lipDepth: 2
          }
        };
        // Queue a full two-mount replay synchronously inside acceptance, before
        // the current pipeline has reached its post-commit detachment.
        await new Promise((yes, no) => craft.modify(enclosureRequest, () => {
          craft.rebuild();
          yes();
        }, no));
        await wait();
        const combined = capture(),
              beforeModels = craft.models$.value.slice(),
              beforeHistory = combined.history;
        let invalid;

        try {
          await modify({
            type: 'WORKER_ENCLOSURE_V1',
            params: {
              featureId: 6,
              width: 100,
              length: 70,
              height: 30,
              wall: 100,
              clearance: .3,
              lidThickness: 3,
              lipDepth: 2
            }
          });
        } catch (e) {
          invalid = String(e);
        }

        await wait();
        const preserved = craft.models$.value.length === beforeModels.length && craft.models$.value.every((m, i) => m === beforeModels[i]) && JSON.stringify(craft.modifications$.value.history) === beforeHistory;
        craft.historyTravel.setPointer(craft.modifications$.value.history.length - 2);
        await wait();
        const undo = capture();
        const edit = JSON.parse(beforeHistory).at(-1);
        edit.params.width = 120;
        await new Promise((yes, no) => craft.modifyInHistoryAndStep(edit, yes, no));
        await wait();
        const edited = capture();
        craft.historyTravel.setPointer(craft.modifications$.value.history.length - 2);
        await wait();
        craft.historyTravel.end();
        await wait();
        const redo = capture();
        const envelope = c.projectManager.snapshotCurrentProject();
        return {
          plate,
          combined,
          invalid,
          preserved,
          undo,
          edited,
          redo,
          counts,
          envelope
        };
      } finally {
        window.Worker = Native;
      }
    });
    assert.equal(out.plate.active, 0);
    assert.equal(out.combined.active, 0);
    assert.equal(out.combined.models.filter(x => x.role === 'BODY' || x.role === 'LID').length, 2);
    assert.ok(out.combined.models.some(x => x.faces === 6));
    assert.equal(out.combined.usage.mounts, 0);
    assert.equal(out.combined.failure, null);
    assert.equal(out.combined.cleanup, null);
    assert.ok(out.invalid);
    assert.equal(out.preserved, true);
    assert.equal(out.undo.models.filter(x => x.role).length, 0);
    assert.equal(out.edited.models.filter(x => x.role).length, 2);
    assert.deepEqual(out.redo.models, out.edited.models);
    assert.equal(JSON.parse(out.redo.history).at(-1).params.width, 120);
    assert.equal(out.counts.made, out.counts.ended);
    assert.ok(out.counts.max <= 2);
    assert.ok(!JSON.stringify(out.envelope).includes('mountId'));
    const q = await fresh();
    const restored = await q.evaluate(async envelope => {
      const c = __CAD_APP;
      await c.projectManager.restoreSnapshotInEmptyWorkspace(JSON.stringify(envelope));
      return {
        models: c.craftService.models$.value.map(m => ({
          id: m.id,
          role: m.outputRole,
          faces: m.faces?.length
        })),
        usage: c.craftService.engineResourceUsage
      };
    }, out.envelope);
    assert.deepEqual(restored.models, out.redo.models);
    assert.equal(restored.usage.mounts, 0);
    console.log('PASS composed plate/enclosure edit, invalid preservation, undo/redo, reopen and worker termination', JSON.stringify({
      counts: out.counts,
      usage: out.redo.usage
    }));
  } finally {
    await context.close();
    browser.disconnect();
  }
})().catch(e => {
  console.error(e.stack);
  process.exitCode = 1;
});
