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

    const p = await fresh(),
          queued = await p.evaluate(async () => {
      const craft = __CAD_APP.craftService,
            Native = window.Worker,
            live = new Set();
      let made = 0,
          ended = 0;
      window.Worker = class extends Native {
        constructor(u, o) {
          super(u, o);
          this.tracked = String(u).includes('oci-verified-worker');

          if (this.tracked) {
            live.add(this);
            made++;
          }
        }

        terminate() {
          if (this.tracked && live.delete(this)) ended++;
          return super.terminate();
        }

      };

      try {
        const req = {
          type: 'WORKER_ENCLOSURE_V1',
          params: {
            featureId: 1,
            width: 100,
            length: 70,
            height: 30,
            wall: 3,
            clearance: .3,
            lidThickness: 3,
            lipDepth: 2
          }
        };
        await new Promise((yes, no) => craft.modify(req, () => {
          craft.rebuild();
          yes();
        }, no));
        const end = Date.now() + 90000;

        while (craft.isProcessing && Date.now() < end) await new Promise(r => setTimeout(r, 10));

        await craft.runPipeline(craft.modifications$.value.history, 0, craft.modifications$.value.pointer);
        return {
          processing: craft.isProcessing,
          failure: craft.pipelineFailure$.value,
          usage: craft.engineResourceUsage,
          roles: craft.models$.value.map(m => m.outputRole).sort(),
          made,
          ended,
          live: live.size
        };
      } finally {
        window.Worker = Native;
      }
    });
    assert.equal(queued.processing, false);
    assert.equal(queued.failure, null);
    assert.deepEqual(queued.roles, ['BODY', 'LID']);
    assert.equal(queued.usage.mounts, 0);
    assert.ok(queued.made >= 2);
    assert.equal(queued.made, queued.ended);
    assert.equal(queued.live, 0);
    const q = await fresh(),
          cleanup = await q.evaluate(async () => {
      const c = __CAD_APP,
            craft = c.craftService,
            Native = window.Worker;
      let injected = false, beforeCleanupRevision;
      window.Worker = class extends Native {
        constructor(u, o) {
          super(u, o);
          this.tracked = String(u).includes('oci-verified-worker');
        }

        terminate() {
          const r = super.terminate();

          if (this.tracked && !injected) {
            injected = true;
            beforeCleanupRevision = craft.inspectRectangleCreation().revision;
            throw Error('injected terminate failure');
          }

          return r;
        }

      };

      try {
        const req = {
          type: 'WORKER_ENCLOSURE_V1',
          params: {
            featureId: 1,
            width: 100,
            length: 70,
            height: 30,
            wall: 3,
            clearance: .3,
            lidThickness: 3,
            lipDepth: 2
          }
        };
        await new Promise((yes, no) => craft.modify(req, yes, no));
        const end = Date.now() + 30000;

        while (craft.isProcessing && Date.now() < end) await new Promise(r => setTimeout(r, 10));

        const model = craft.models$.value.slice(),
              history = JSON.stringify(craft.modifications$.value.history),
              envelope = c.projectManager.snapshotCurrentProject();
        let next;

        try {
          await new Promise((yes, no) => craft.modify({ ...req,
            params: { ...req.params,
              featureId: 2
            }
          }, yes, no));
        } catch (e) {
          next = String(e);
        }

        return {
          injected,
          processing: craft.isProcessing,
          cleanup: craft.engineCleanupFailure$.value,
          failure: craft.pipelineFailure$.value,
          alert: document.body.innerText.includes('Engine cleanup failed.'),
          roles: model.map(m => m.outputRole).sort(),
          same: craft.models$.value.every((m, i) => m === model[i]) && JSON.stringify(craft.modifications$.value.history) === history,
          saved: !!envelope,
          beforeCleanupRevision,
          rectangleInspection: craft.inspectRectangleCreation(),
          featureInspection: craft.inspectWorkerFeatureCommands(),
          next
        };
      } finally {
        window.Worker = Native;
      }
    });
    assert.equal(cleanup.injected, true);
    assert.equal(cleanup.processing, false);
    assert.equal(cleanup.cleanup.code, 'ENGINE_CLEANUP_FAILED');
    assert.equal(cleanup.failure, null);
    assert.equal(cleanup.alert, true);
    assert.deepEqual(cleanup.roles, ['BODY', 'LID']);
    assert.equal(cleanup.same, true);
    assert.equal(cleanup.saved, true);
    assert.notEqual(cleanup.rectangleInspection.revision, cleanup.beforeCleanupRevision);
    assert.equal(cleanup.rectangleInspection.ready, false);
    assert.match(cleanup.rectangleInspection.reason, /Engine cleanup failed/);
    assert.equal(cleanup.featureInspection.ready, false);
    assert.match(cleanup.featureInspection.reason, /Engine cleanup failed/);
    assert.match(cleanup.next, /cleanup failed/i);
    const r = await fresh(),
          reentrant = await r.evaluate(async () => {
      const c = __CAD_APP,
            craft = c.craftService,
            Native = window.Worker;
      let injected = false,
          resets = 0;
      window.Worker = class extends Native {
        constructor(u, o) {
          super(u, o);
          this.tracked = String(u).includes('oci-verified-worker');
        }

        terminate() {
          const out = super.terminate();

          if (this.tracked && !injected) {
            injected = true;
            throw Error('injected cleanup');
          }

          return out;
        }

      };
      const off = craft.engineCleanupFailure$.attach(v => {
        if (v) {
          resets++;
          craft.reset([]);
        }
      });

      try {
        const req = {
          type: 'WORKER_ENCLOSURE_V1',
          params: {
            featureId: 1,
            width: 100,
            length: 70,
            height: 30,
            wall: 3,
            clearance: .3,
            lidThickness: 3,
            lipDepth: 2
          }
        };
        await new Promise(resolve => craft.modify(req, () => resolve(), () => resolve()));
        const end = Date.now() + 30000;

        while (craft.isProcessing && Date.now() < end) await new Promise(y => setTimeout(y, 10));

        return {
          resets,
          processing: craft.isProcessing,
          cleanup: craft.engineCleanupFailure$.value?.code,
          history: craft.modifications$.value.history.length,
          models: craft.models$.value.length
        };
      } finally {
        off();
        window.Worker = Native;
      }
    });
    assert.equal(reentrant.resets, 1);
    assert.equal(reentrant.processing, false);
    assert.equal(reentrant.cleanup, 'ENGINE_CLEANUP_FAILED');
    assert.equal(reentrant.models, 0);
    console.log('PASS queued replay, cleanup UI/accepted save, and synchronous cleanup-observer reset', JSON.stringify({
      queued,
      cleanup,
      reentrant
    }));
  } finally {
    await context.close();
    browser.disconnect();
  }
})().catch(e => {
  console.error(e.stack);
  process.exitCode = 1;
});
