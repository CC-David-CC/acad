/* Real craft replay and real pinned OCC mounts. The injected PLANE wrapper
 * exercises ownership, not worker-prism model publication or persistent IDs. */
const assert = require('node:assert/strict');
const puppeteer = require(process.env.PUPPETEER_CORE_PATH || 'puppeteer-core');
const base = new URL(process.env.JSKETCHER_TEST_URL || 'http://127.0.0.1:19982/');
const cdp = new URL(process.env.CODI_TEST_CDP || 'http://127.0.0.1:19983/');
for (const u of [base, cdp]) if (!['127.0.0.1', 'localhost', '[::1]'].includes(u.hostname)) throw Error('Loopback only');
(async () => {
  const browser = await puppeteer.connect({browserURL:cdp.href, protocolTimeout:120000});
  const context = await browser.createBrowserContext(), errors = [];
  try {
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto(new URL('index-webos.html?DEFAULT&webos=1', base));
    await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true', {timeout:90000});
    const result = await page.evaluate(async () => {
      const {createVerifiedOciMount} = await import('/static/oci-verified-mount.mjs');
      const c = __CAD_APP, mounts = [], observations = [], operation = c.operationService.get('PLANE');
      const original = operation.run;
      const request = (featureId, depth) => ({type:'PLANE', params:{featureId, orientation:'XY', depth}});
      const call = request => new Promise((resolve, reject) => c.craftService.modify(request, resolve, reject));
      const wait = async () => {
        const deadline = Date.now() + 30000;
        while (c.craftService.isProcessing && Date.now() < deadline) await new Promise(r => setTimeout(r, 10));
        if (c.craftService.isProcessing) throw Error('Craft did not finish');
      };
      let releaseHeld, announceHeld;
      const held = new Promise(resolve => {announceHeld = resolve;});
      const pause = new Promise(resolve => {releaseHeld = resolve;});
      const box = () => ({op:'solid.box.create', version:1, unit:'millimeter', origin:[0,0,0], dimensions:[2,3,4]});
      operation.run = async (params, ctx, raw) => {
        const owner = ctx.engineEvaluation;
        const record = owner.getOrCreateMount('occ', () => {
          const mount = createVerifiedOciMount({workerUrl:'/static/oci-verified-worker.js',
            jsPath:'/static/occ-portable.js', wasmPath:'/lib-assets/jsketcher-occ-engine/occt.wasm'});
          const entry = {mount, closed:0, owner, close() {this.closed++; mount.close();}};
          mounts.push(entry); return entry;
        });
        await record.mount.ready;
        const solid = await record.mount.box(box(), {signal:owner.signal});
        if (Math.abs(Math.abs(solid.evidence.signedVolume) - 24) > 1e-8) throw Error('OCC volume control failed');
        owner.requireCurrent();
        if (params.depth === 42) throw Error('rejected resource candidate');
        if (params.depth === 77) {announceHeld(); await pause; owner.requireCurrent();}
        return original(params, ctx, raw);
      };
      const usage = () => c.craftService.engineResourceUsage;
      try {
        await call(request(1, 1)); await call(request(2, 2));
        const tip = mounts[1], tipModels = c.craftService.models$.value;
        const tipHistory = c.craftService.modifications$.value.history;
        observations.push({phase:'tip', usage:usage(), previousClosed:mounts[0].closed, tipClosed:tip.closed});
        c.craftService.historyTravel.setPointer(0); await wait();
        const rollback = mounts[2], rollbackModels = c.craftService.models$.value;
        const rollbackHistory = c.craftService.modifications$.value;
        const rejected = await call(request(3, 42)).then(() => null, error => error.message);
        observations.push({phase:'rejected-rollback', usage:usage(), rejected,
          retained:c.craftService.models$.value === rollbackModels && c.craftService.modifications$.value === rollbackHistory,
          tipClosed:tip.closed, rollbackClosed:rollback.closed, candidateClosed:mounts[3].closed});
        // Failed history replay may display the full last-valid tip; a rejected
        // new command must retain the deliberate rollback state instead.
        c.craftService.modifications$.next({history:[...tipHistory, request(4, 42)], pointer:2}); await wait();
        observations.push({phase:'failed-replay', usage:usage(), retainedTip:c.craftService.models$.value === tipModels,
          failure:c.craftService.pipelineFailure$.value?.message, tipClosed:tip.closed,
          rollbackClosed:rollback.closed, candidateClosed:mounts[4].closed});
        c.craftService.modifications$.next({history:tipHistory, pointer:1}); await wait();
        observations.push({phase:'recovered', usage:usage(), oldTipClosed:tip.closed});

        const registryFactory = c.cadRegistry.createEvaluationRegistry, accepted = c.craftService.models$.value;
        c.cadRegistry.createEvaluationRegistry = () => {throw Error('injected registry preparation failure');};
        let setupError;
        try {setupError = await call(request(5, 3)).then(() => null, error => error.message);}
        finally {c.cadRegistry.createEvaluationRegistry = registryFactory;}
        observations.push({phase:'setup-failure', usage:usage(), setupError,
          retained:c.craftService.models$.value === accepted, mounts:mounts.length});

        const pending = call(request(6, 77)).then(() => ({accepted:true}), error => ({name:error.name, committed:error.committed}));
        await held;
        observations.push({phase:'held', usage:usage()});
        c.projectService.empty(); releaseHeld();
        const cancelled = await pending; await wait();
        observations.push({phase:'document-reset', usage:usage(), cancelled,
          closed:mounts.map(m => m.closed), models:c.craftService.models$.value.length,
          history:c.craftService.modifications$.value.history.length});

        let didReset = false;
        const detach = c.craftService.models$.attach(models => {
          if (models.length && !didReset) {didReset = true; c.projectService.empty();}
        });
        let observerReset;
        try {observerReset = await call(request(1, 1)).then(() => ({accepted:true}), error => ({name:error.name, committed:error.committed}));}
        finally {detach();}
        await wait();
        observations.push({phase:'observer-reset', usage:usage(), observerReset,
          closed:mounts.map(m => m.closed), models:c.craftService.models$.value.length});
        return observations;
      } finally {releaseHeld(); operation.run = original; c.projectService.empty(); await wait();}
    });
    const u = (owners, candidates = 0) => ({owners, candidates, accepted:owners-candidates, cleanupFailed:false});
    assert.deepEqual(result, [
      {phase:'tip', usage:u(1), previousClosed:1, tipClosed:0},
      {phase:'rejected-rollback', usage:u(2), rejected:'rejected resource candidate', retained:true, tipClosed:0, rollbackClosed:0, candidateClosed:1},
      {phase:'failed-replay', usage:u(1), retainedTip:true, failure:'rejected resource candidate', tipClosed:0, rollbackClosed:1, candidateClosed:1},
      {phase:'recovered', usage:u(1), oldTipClosed:1},
      {phase:'setup-failure', usage:u(1), setupError:'injected registry preparation failure', retained:true, mounts:6},
      {phase:'held', usage:u(2, 1)},
      {phase:'document-reset', usage:u(1), cancelled:{name:'AbortError', committed:false}, closed:Array(7).fill(1), models:0, history:0},
      {phase:'observer-reset', usage:u(1), observerReset:{name:'AbortError', committed:true}, closed:Array(8).fill(1), models:0}
    ]);
    const inspector = await browser.target().createCDPSession();
    const workers = async () => (await inspector.send('Target.getTargets')).targetInfos.filter(t => t.type === 'worker' && t.url.endsWith('/static/oci-verified-worker.js'));
    const deadline = Date.now() + 5000;
    while ((await workers()).length && Date.now() < deadline) await new Promise(r => setTimeout(r, 20));
    assert.equal((await workers()).length, 0, 'owned OCC Workers must be terminated');
    await inspector.detach(); assert.deepEqual(errors, []);
    console.log('PASS real craft replay with OCC resource retention, rejection, rollback, setup failure, reset and worker cleanup', JSON.stringify(result));
  } finally {await context.close(); browser.disconnect();}
})().catch(error => {console.error(error.stack); process.exitCode = 1;});
