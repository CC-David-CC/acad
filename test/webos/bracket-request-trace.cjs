const fs = require('fs'),
      puppeteer = require(process.env.PUPPETEER_CORE_PATH || 'puppeteer-core');

(async () => {
  for (const value of [process.env.CODI_TEST_CDP, process.env.CODI_TEST_APP_URL]) {
    const url = new URL(value);
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) throw Error('Loopback fixture required.');
  }
  const x = JSON.parse(fs.readFileSync(process.env.CODI_BRACKET_INPUT || require('path').join(__dirname, 'fixtures/bracket-trace-input.json'), 'utf8'));
  x.doc.project.model.history = x.history;
  x.doc.project.model.counters.featureId = 4;
  const browser = await puppeteer.connect({
    browserURL: process.env.CODI_TEST_CDP,
    protocolTimeout: 90000
  }),
        context = await browser.createBrowserContext();

  try {
    const page = await context.newPage();
    await page.evaluateOnNewDocument(() => {
      const Native = window.Worker,
            start = performance.now();
      window.Worker = class extends Native {
        constructor(url, ...args) {
          super(url, ...args);
          this._u = String(url);
          this._start = performance.now();
          console.log('TRACE worker-created', JSON.stringify({
            url: this._u,
            t: performance.now() - start
          }));
          this.addEventListener('message', e => console.log('TRACE worker-message', JSON.stringify({
            url: this._u,
            t: performance.now() - start,
            dt: performance.now() - this._start,
            kind: e.data?.kind,
            ok: e.data?.ok,
            code: e.data?.code,
            error: e.data?.error
          })));
          this.addEventListener('error', e => console.log('TRACE worker-error', JSON.stringify({
            url: this._u,
            t: performance.now() - start,
            message: e.message
          })));
        }

        postMessage(m, ...args) {
          console.log('TRACE worker-post', JSON.stringify({
            url: this._u,
            t: performance.now() - start,
            kind: m?.kind,
            task: m?.task,
            op: m?.op
          }));
          return super.postMessage(m, ...args);
        }

        terminate() {
          console.log('TRACE worker-terminate', JSON.stringify({
            url: this._u,
            t: performance.now() - start,
            dt: performance.now() - this._start
          }));
          return super.terminate();
        }

      };
    });
    page.on('console', m => {
      if (m.text().startsWith('TRACE')) console.log(m.text());
    });
    page.on('response', r => {
      if (/\.mjs|\.wasm|worker.*\.js/.test(r.url())) console.log('TRACE response', Date.now(), r.status(), r.url());
    });

    if (process.env.CODI_TRACE_INTERCEPTION === 'scoped') {
      const session = await page.target().createCDPSession();
      await session.send('Fetch.enable', {
        patterns: [{
          urlPattern: new URL('/test-only-helper.js', process.env.CODI_TEST_APP_URL).href,
          requestStage: 'Request'
        }]
      });
      session.on('Fetch.requestPaused', async e => {
        await session.send('Fetch.fulfillRequest', {
          requestId: e.requestId,
          responseCode: 200,
          responseHeaders: [{
            name: 'Content-Type',
            value: 'text/javascript'
          }],
          body: fs.readFileSync(process.env.JSKETCHER_HELPER_PATH).toString('base64')
        });
      });
    } else if (process.env.CODI_TRACE_INTERCEPTION === 'blanket') {
      await page.setRequestInterception(true);
      page.on('request', r => {
        if (r.url().endsWith('/test-only-helper.js')) return r.respond({
          status: 200,
          contentType: 'text/javascript',
          body: fs.readFileSync(process.env.JSKETCHER_HELPER_PATH)
        });
        const watch = /\.mjs|prism-semantic|\.wasm/.test(r.url());
        if (watch) console.log('TRACE continue-start', Date.now(), r.url());
        r.continue().then(() => {
          if (watch) console.log('TRACE continue-ok', Date.now(), r.url());
        }, e => console.log('TRACE continue-error', Date.now(), r.url(), String(e)));
      });
    } else throw Error('Set CODI_TRACE_INTERCEPTION to scoped or blanket');

    page.on('request', r => {
      if (/\.mjs/.test(r.url())) console.log('TRACE request', Date.now(), r.url());
    });
    await page.goto(process.env.CODI_TEST_APP_URL);
    await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true', {
      timeout: 90000
    });
    await page.evaluate(() => {
      window.tc = new AbortController();

      __CAD_APP.projectService.bindHostLifetime({
        signal: tc.signal,
        valid: () => true
      });
    });
    const outcome = await page.evaluate(async doc => {
      const start = performance.now();

      try {
        await __CAD_APP.projectManager.restoreSnapshotInEmptyWorkspace(JSON.stringify(doc));
        return {
          ok: true,
          ms: performance.now() - start,
          history: __CAD_APP.craftService.modifications$.value.history.map(h => h.type),
          faces: __CAD_APP.craftService.models$.value[0]?.faces.length
        };
      } catch (e) {
        return {
          ok: false,
          ms: performance.now() - start,
          name: e.name,
          message: e.message,
          code: e.code,
          failure: __CAD_APP.craftService.pipelineFailure$.value
        };
      }
    }, x.doc);
    console.log('TRACE initial-outcome', JSON.stringify(outcome));
    if (!outcome.ok) throw Error('Initial restore failed');
    await page.addScriptTag({
      url: new URL('/test-only-helper.js', process.env.CODI_TEST_APP_URL).href
    });
    await page.evaluate(async () => {
      const c = __CAD_APP;
      c.craftService.historyTravel.setPointer(0);

      while (c.craftService.isProcessing) await new Promise(r => setTimeout(r, 10));

      const face = c.cadRegistry.shells[0].faces[0];
      c.services.marker.clear();
      c.services.marker.markExclusively(face.TYPE, face.id);
      window.Cypress = {
        $: s => {
          const a = [...document.querySelectorAll(s)];

          a.index = n => a.indexOf(n);

          return a;
        }
      };
      window.editUI = webosTest.modellerUISubject(c);
      editUI.openSketcher();
    });

    for (const [index, value] of [[0, '170'], [1, '60']]) {
      await page.waitForFunction(() => [...document.querySelectorAll('span')].filter(e => e.textContent.includes('Segment Length')).length >= 2);
      await page.evaluate(index => [...document.querySelectorAll('span')].filter(e => e.textContent.includes('Segment Length'))[index].parentElement.click(), index);
      await page.waitForFunction(() => document.body.innerText.includes('SEGMENT LENGTH'));
      const input = (await page.$$('input[type=text]'))[0];
      await input.click();
      await input.evaluate(e => e.select());
      await input.type(value);
      await input.press('Enter');
      await page.waitForFunction(() => !document.body.innerText.includes('SEGMENT LENGTH'));
    }

    console.log('TRACE start edit replay');
    const edited = await page.evaluate(async () => {
      const start = performance.now(),
            c = __CAD_APP,
            craft = c.craftService;
      await editUI.commitSketch();
      await new Promise(r => setTimeout(r, 300));
      craft.historyTravel.end();

      while (craft.isProcessing && performance.now() - start < 90000) await new Promise(r => setTimeout(r, 10));

      const f = craft.pipelineFailure$.value;
      return {
        ms: performance.now() - start,
        processing: craft.isProcessing,
        failure: f && {
          code: f.code,
          message: f.message
        },
        faces: craft.models$.value[0]?.faces.length
      };
    });
    console.log('TRACE edited-outcome', JSON.stringify(edited));
    if (edited.processing || edited.failure || edited.faces !== 11) throw Error('Edited replay did not complete with the expected model.');
  } finally {
    await context.close();
    browser.disconnect();
  }
})().catch(e => {
  console.error(e.stack);
  process.exitCode = 1;
});
