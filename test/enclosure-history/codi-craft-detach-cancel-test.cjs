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
    async function run(mode) {
      const p = await context.newPage();
      const response = await p.goto(new URL('index-webos.html?DEFAULT&webos=1', base));
      const policy = response.headers()['content-security-policy'];
      assert.match(policy, /script-src 'self' 'wasm-unsafe-eval'/);
      assert.doesNotMatch(policy, /script-src[^;]*blob:|'unsafe-eval'/);
      await p.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true', {
        timeout: 90000
      });
      return p.evaluate(async mode => {
        const c = __CAD_APP,
              craft = c.craftService,
              host = new AbortController();
        c.projectService.bindHostLifetime({
          signal: host.signal,
          valid: () => true
        });

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
        },
              wait = async () => {
          const end = Date.now() + 60000;

          while (craft.isProcessing && Date.now() < end) await new Promise(r => setTimeout(r, 10));

          if (craft.isProcessing) throw Error('replay timed out');
        };

        await new Promise((yes, no) => craft.modify(req, yes, no));
        await wait();
        const models = craft.models$.value.slice(),
              history = JSON.stringify(craft.modifications$.value.history),
              Native = window.Worker;
        let held = false,
            ended = 0;
        window.Worker = class extends Native {
          postMessage(data, ...args) {
            if (data?.kind === 'enclosure-build') {
              held = true;
              return;
            }

            return super.postMessage(data, ...args);
          }

          terminate() {
            ended++;
            return super.terminate();
          }

        };

        try {
          const pending = new Promise(resolve => craft.modify({ ...req,
            params: { ...req.params,
              featureId: 2
            }
          }, () => resolve({
            ok: true
          }), e => resolve({
            ok: false,
            name: e?.name
          })));
          const end = Date.now() + 30000;

          while (!held && Date.now() < end) await new Promise(r => setTimeout(r, 10));

          if (!held) throw Error('worker not held');
          if (mode === 'host') host.abort();else craft.reset([]);
          const result = await pending;
          await wait();
          return {
            held,
            ended,
            result,
            same: craft.models$.value.length === models.length && craft.models$.value.every((m, i) => m === models[i]) && JSON.stringify(craft.modifications$.value.history) === history,
            models: craft.models$.value.length,
            history: craft.modifications$.value.history.length,
            usage: craft.engineResourceUsage,
            processing: craft.isProcessing
          };
        } finally {
          window.Worker = Native;
        }
      }, mode);
    }

    const host = await run('host'),
          reset = await run('reset');
    assert.equal(host.held, true);
    assert.equal(host.result.ok, false);
    assert.equal(host.result.name, 'AbortError');
    assert.ok(host.ended >= 1);
    assert.equal(host.same, true);
    assert.equal(host.usage.mounts, 0);
    assert.equal(host.processing, false);
    assert.equal(reset.held, true);
    assert.equal(reset.result.ok, false);
    assert.equal(reset.result.name, 'AbortError');
    assert.ok(reset.ended >= 1);
    assert.equal(reset.models, 0);
    assert.equal(reset.history, 0);
    assert.equal(reset.usage.mounts, 0);
    assert.equal(reset.processing, false);
    console.log('PASS held worker host cancellation and document reset', JSON.stringify({
      host,
      reset
    }));
  } finally {
    await context.close();
    browser.disconnect();
  }
})().catch(e => {
  console.error(e.stack);
  process.exitCode = 1;
});
