// Real strict-CSP Chromium worker; see README for copying the four fixture assets.
const assert = require('node:assert/strict');
const puppeteer = require(process.env.PUPPETEER_CORE_PATH || 'puppeteer-core');
const base = new URL(process.env.JSKETCHER_TEST_URL || 'http://127.0.0.1:19353/');
const cdp = new URL(process.env.CODI_TEST_CDP || 'http://127.0.0.1:19352/');
for (const u of [base,cdp]) if (!['127.0.0.1','localhost','[::1]'].includes(u.hostname)) throw Error('Loopback only');
(async () => {
  const browser = await puppeteer.connect({browserURL:cdp.href}), ctx = await browser.createBrowserContext();
  try {
    const page = await ctx.newPage(), violations = [];
    await page.evaluateOnNewDocument(() => { window.cspViolations = []; document.addEventListener('securitypolicyviolation', e => cspViolations.push(e.violatedDirective)); });
    const response = await page.goto(new URL('static/engine-test.html', base).href);
    assert.match(response.headers()['content-security-policy'], /wasm-unsafe-eval/);
    assert.doesNotMatch(response.headers()['content-security-policy'], /'unsafe-eval'/);
    const hashes = await page.evaluate(async () => {
      const hash = async url => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await (await fetch(url)).arrayBuffer())), b => b.toString(16).padStart(2,'0')).join('');
      return {js:await hash('/static/occ-portable.js'), wasm:await hash('/lib-assets/jsketcher-occ-engine/occt.wasm')};
    });
    assert.deepEqual(hashes, {js:'4a53dec0dceb5715d070fa7293f6515ab681f6d3de979099526e616dbd052ddc',
      wasm:'a2b2f7daf6a4eb98b975f8aec136f6cbaf2720295ea32e71edb13ff4c5ceaecb'});
    const result = await page.evaluate(async () => {
      const {createOciBoxMount} = await import('./occ-worker-mount.mjs');
      const opts = {workerUrl:'/static/occ-portable-probe-worker.js',runtimeSha256:'a2b2f7daf6a4eb98b975f8aec136f6cbaf2720295ea32e71edb13ff4c5ceaecb'};
      const a = createOciBoxMount(opts), b = createOciBoxMount(opts);
      const request = {op:'solid.box.create',version:1,unit:'millimeter',dimensions:[10,20,30]};
      const actual = await a.createBox(request); let foreign, busy, invalid, stale, closed;
      try {b.dispose(actual.handle);} catch(e) {foreign=e.code;}
      try {await a.createBox(request);} catch(e) {busy=e.code;}
      try {await b.createBox({...request, dimensions:[0,20,30]});} catch(e) {invalid=e.code;}
      window.mountProbe = {a,b,actual,request};
      return {actual, foreign,busy,invalid,violations:window.cspViolations};
    });
    const inspector = await browser.target().createCDPSession();
    const targets = async () => (await inspector.send('Target.getTargets')).targetInfos.filter(t => t.type === 'worker' && t.url.includes('/occ-portable-probe-worker.js'));
    assert.equal((await targets()).length, 1, 'solid owns an actual dedicated worker');
    const disposed = await page.evaluate(async () => {
      const {a,b,actual,request} = mountProbe; let stale,closed;
      a.dispose(actual.handle);
      try {a.dispose(actual.handle);} catch(e) {stale=e.code;}
      a.close(); b.close();
      try {await a.createBox(request);} catch(e) {closed=e.code;}
      return {stale,closed};
    });
    const until = Date.now() + 5000;
    while ((await targets()).length && Date.now() < until) await new Promise(resolve => setTimeout(resolve,20));
    assert.equal((await targets()).length, 0, 'dispose terminates the dedicated worker target');
    assert.deepEqual(result.actual.evidence.bounds,{min:[0,0,0],max:[10,20,30]});
    assert.equal(result.actual.evidence.faceCount,6); assert.equal(result.actual.evidence.triangles,12);
    assert.deepEqual([result.foreign,result.busy,result.invalid,disposed.stale,disposed.closed],['INVALID_HANDLE','BUSY','INVALID_REQUEST','INVALID_HANDLE','MOUNT_CLOSED']);
    const cancelled = await page.evaluate(async () => {
      const {createOciBoxMount} = await import('./occ-worker-mount.mjs');
      const m=createOciBoxMount({workerUrl:'/static/occ-portable-probe-worker.js',runtimeSha256:'a2b2f7daf6a4eb98b975f8aec136f6cbaf2720295ea32e71edb13ff4c5ceaecb'});
      const controller=new AbortController();
      const p=m.createBox({op:'solid.box.create',version:1,unit:'millimeter',dimensions:[1,2,3]}, {signal:controller.signal}).catch(e=>e.code);
      let guessed; try {m.dispose({mountId:m.descriptor.mountId,generation:1,representation:'occ-brep-worker-owned',id:'1'});} catch(e) {guessed=e.code;}
      controller.abort(); const code=await p; m.close(); return {code,guessed};
    });
    assert.deepEqual(cancelled,{code:'CANCELLED',guessed:'INVALID_HANDLE'});
    violations.push(...result.violations); assert.deepEqual(violations,[]);
    console.log('PASS strict-CSP OCI box worker, independent bounds, owned disposal and refusal checks');
  } finally {await ctx.close(); browser.disconnect();}
})().catch(e => {console.error(e.stack);process.exitCode=1;});
