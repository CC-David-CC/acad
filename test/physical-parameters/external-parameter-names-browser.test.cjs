// Actual installed disposable Worker; no injected solver or successful replies.
const assert = require('node:assert/strict');
const puppeteer = require(process.env.PUPPETEER_CORE_PATH || 'puppeteer-core');
const base = new URL(process.env.JSKETCHER_TEST_URL), cdp = new URL(process.env.CODI_TEST_CDP);
if (![base, cdp].every(u => ['localhost','127.0.0.1','[::1]'].includes(u.hostname))) throw Error('Loopback only');
if (!process.env.CODI_SKETCH_WORKER_URL) throw Error('Provide the exact built sketch Worker URL');
const workerURL=new URL(process.env.CODI_SKETCH_WORKER_URL,base);
if(workerURL.origin!==base.origin) throw Error('Worker must come from the same private fixture');
(async () => {
  const browser = await puppeteer.connect({browserURL: cdp.href});
  const context = await browser.createBrowserContext();
  try {
    const page = await context.newPage();
    await page.goto(base.href);
    const rows = await page.evaluate(async workerURL => {
      const send = request => new Promise((resolve,reject) => {
        const worker = new Worker(workerURL);
        const timer = setTimeout(() => { worker.terminate(); reject(Error('Worker timeout')); },30000);
        worker.onmessage = e => { clearTimeout(timer); worker.terminate(); resolve(e.data); };
        worker.onerror = e => { clearTimeout(timer); worker.terminate(); reject(Error(e.message)); };
        worker.postMessage(request);
      });
      const frame={origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]},boundary={lines:[],arcs:[],circles:[],nurbses:[]};
      const rows=[];
      for(const name of ['E','Math']) {
        const sketch={version:3,objects:[{id:'c',type:'Circle',role:null,stage:0,data:{c:{x:3,y:4},r:8}}],dimensions:[],labels:[],
          stages:[{constraints:[{typeId:'DiameterLength',objects:['c'],constants:{diameter:name},stage:0,
            annotations:[{angle:Math.PI/4}],admission:{version:1,state:'accepted'}}],generators:[]}],
          constants:'',metadata:{boundaryFrame:frame},boundary};
        const source=value=>'codi-physical-parameters:1\n'+JSON.stringify([{name,dimension:'length',expression:`mm(${value})`}]);
        const saved=await send({task:'sketch-save-validation',revision:'save',sketchJSON:JSON.stringify(sketch),frame,parameterSource:source(16),externalParameters:{}});
        const changed=await send({task:'typed-sketch-transaction',revision:'edit',sketchJSON:JSON.stringify(sketch),frame,parameterSource:source(18),verifyCurrent:false});
        rows.push({name,saved,changed});
      }
      return rows;
    },workerURL.href);
    for(const {name,saved,changed} of rows) {
      assert.equal(saved.ok,true,`${name}: ${JSON.stringify(saved)}`);
      assert.equal(saved.validated,true);
      assert.equal(changed.ok,true,`${name}: ${JSON.stringify(changed)}`);
      const sketch=JSON.parse(changed.serializedSketch);
      assert.ok(Math.abs(sketch.objects[0].data.r-9)<1e-6);
      assert.equal(sketch.stages[0].constraints[0].constants.diameter,name);
    }
    console.log('PASS real Worker typed E/Math Save and 16→18 regeneration retain authored names');
  } finally { await context.close(); browser.disconnect(); }
})().catch(e => { console.error(e.stack); process.exitCode=1; });
