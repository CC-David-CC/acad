// Isolated production sketch worker; no host or account access.
const assert = require('node:assert/strict');
const puppeteer = require(process.env.PUPPETEER_CORE_PATH || 'puppeteer-core');
const base = new URL(process.env.JSKETCHER_TEST_URL || 'http://127.0.0.1:19734/');
const cdp = new URL(process.env.CODI_TEST_CDP || 'http://127.0.0.1:19367/');
if (![base, cdp].every(u => ['127.0.0.1', 'localhost', '[::1]'].includes(u.hostname))) throw Error('Loopback only');
(async () => {
  const browser = await puppeteer.connect({browserURL: cdp.href});
  const context = await browser.createBrowserContext();
  try {
    const page = await context.newPage();
    page.on('console', message => console.error('browser:', message.type(), message.text()));
    page.on('pageerror', error => console.error('browser error:', error.message));
    await page.goto(base.href);
    await page.addScriptTag({url: new URL('static/client.js', base).href});
    const result = await page.evaluate(async () => {
      const NativeWorker=window.Worker;
      window.Worker=class extends NativeWorker { constructor(...args){super(...args);this.addEventListener('error',e=>console.error('worker error',e.message,e.filename,e.lineno));} };
      const run = input => window.testHeadlessSketchClient('/static/worker.js', input);
      const frame = {origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]};
      const initial = await run({task:'rectangle',revision:'draft',unit:'millimeter',frame,origin:[10,20],width:100,height:50});
      if (!initial.ok) return {initial};
      const solve = async (typeId, objects, distance) => {
        const sketch = structuredClone(initial.sketch);
        sketch.stages[0].constraints = [{typeId, objects, constants:{distance:String(distance)}, stage:0, annotations:[{offset:20}], admission:{version:1,state:'accepted'}}];
        return run({revision:typeId,sketch,boundary:structuredClone(sketch.boundary),externalParameters:{}});
      };
      return {x:await solve('SignedDistanceX',['rect-0:A','rect-0:B'],-20),
        y:await solve('SignedDistanceY',['rect-0:A','rect-1:B'],-15),
        projected:await solve('ProjectedDistance',['rect-1:A','rect-1:B','rect-0'],20)};
    });
    for (const [kind, output] of Object.entries(result)) {
      assert.equal(output.ok, true, `${kind}: ${JSON.stringify(output.error)}`);
      assert.ok(output.evidence.every(e => e.residuals.every(n => Number.isFinite(n) && Math.abs(n) <= e.tolerance)));
    }
    const segment = (output, id) => output.sketch.objects.find(object => object.id === id).data;
    const x = segment(result.x, 'rect-0');
    const y1 = segment(result.y, 'rect-0').a, y2 = segment(result.y, 'rect-1').b;
    const direction = segment(result.projected, 'rect-0'), displacement = segment(result.projected, 'rect-1');
    const dx = direction.b.x-direction.a.x, dy = direction.b.y-direction.a.y;
    const projected = ((displacement.b.x-displacement.a.x)*dx+(displacement.b.y-displacement.a.y)*dy)/Math.hypot(dx,dy);
    assert.ok(Math.abs((x.b.x-x.a.x)+20)<1e-6);
    assert.ok(Math.abs((y2.y-y1.y)+15)<1e-6);
    assert.ok(Math.abs(projected-20)<1e-6);
    console.log('PASS signed X/Y and directed projected distances through real Chromium sketch workers');
  } finally { await context.close(); browser.disconnect(); }
})().catch(error => { console.error(error.stack); process.exitCode=1; });
