/* Isolated test only: compares an OCCT screw STEP fixture against known npm-engine metrics. */
const assert = require('assert/strict');
const fs = require('fs');
const {createHash} = require('crypto');
const puppeteer = require('puppeteer-core');
const base = new URL(process.env.JSKETCHER_TEST_URL || 'http://127.0.0.1:19733/');
const cdp = new URL(process.env.CODI_TEST_CDP || 'http://127.0.0.1:19255');
const local = hostname => ['127.0.0.1','localhost','[::1]'].includes(hostname);
if (!local(base.hostname) || !local(cdp.hostname)) throw new Error('Only loopback test endpoints are supported.');
if (!process.env.OCCT_STEP_FIXTURE) throw new Error('Set OCCT_STEP_FIXTURE to upstream occt/data/step/screw.step.');
const bytes = fs.readFileSync(process.env.OCCT_STEP_FIXTURE);
assert.equal(createHash('sha256').update(bytes).digest('hex'), '4b3649a4f5c4f05c7a06a402a91fe2fd7e3cba1615520fbd8c62a62610ad3e69');
(async () => {
  const browser = await puppeteer.connect({browserURL:cdp.href, protocolTimeout:90000});
  const context = await browser.createBrowserContext();
  try {
    const page = await context.newPage(), logs = [];
    page.on('console', message => { const text = message.text(); if (/mass|valid|error|fail/i.test(text)) logs.push(text); });
    const response = await page.goto(new URL('index-webos.html?DEFAULT&webos=1', base).href);
    const csp = response.headers()['content-security-policy'] || '';
    assert.match(csp, /wasm-unsafe-eval/);
    assert.doesNotMatch(csp, /['"]unsafe-eval['"]/);
    await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true', {timeout:60000});
    const result = await page.evaluate(input => {
      const ctx = __CAD_APP;
      FS.writeFile('codi_test_screw.step', Uint8Array.from(input));
      function cstr(value) { const ptr = Module._malloc(value.length + 1); writeAsciiToMemory(value, ptr); return ptr; }
      // These two tiny strings remain alive for this disposable page, matching
      // the command interface's conservative object-name lifetime.
      const importStatus = Module._ImportStepFile(cstr('codi_screw'), cstr('codi_test_screw.step'), true);
      const shell = ctx.occService.io.getShell('codi_screw');
      const points = [...shell.brepShell.vertices].map(vertex => vertex.point.data());
      const bounds = [0,1,2].map(i => [Math.min(...points.map(point=>point[i])),Math.max(...points.map(point=>point[i]))]);
      const check = ctx.occService.commandInterface.checkshape('codi_screw');
      const vprops = ctx.occService.commandInterface.vprops('codi_screw');
      return {importStatus, faces:shell.faces.length, edges:shell.edges.length, vertices:points.length, bounds, check, vprops};
    }, [...bytes]);
    assert.equal(result.importStatus, -1); // This API uses -1 for the one-shape success path.
    assert.equal(result.faces,10); assert.equal(result.edges,22); assert.equal(result.vertices,14);
    const expected = [[-27.819681,-7.976546],[-10.826297,0.423703],[-34.56367,7.73145]];
    for (let i=0;i<3;i++) for (let j=0;j<2;j++) assert.ok(Math.abs(result.bounds[i][j]-expected[i][j])<1e-6);
    assert.equal(result.check,0); assert.equal(result.vprops,0);
    assert.ok(logs.some(text => /shape seems to be valid/i.test(text)));
    assert.ok(logs.some(text => /Mass\s*:\s*3788\.27/.test(text)));
    console.log('PASS: STEP screw topology, bounds, validity and volume under strict CSP', JSON.stringify(result));
  } finally { await context.close(); browser.disconnect(); }
})().catch(error => { console.error(error.stack); process.exitCode=1; });
