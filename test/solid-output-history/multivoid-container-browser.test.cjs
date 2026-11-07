// Whole-container experimental SMLib admission. Mesh winding is NOT qualified.
const assert = require('node:assert/strict'), fs = require('node:fs'), puppeteer = require('puppeteer-core');
const base = new URL(process.env.JSKETCHER_TEST_URL), cdp = new URL(process.env.CODI_TEST_CDP);
const expectedAppSha = process.env.CODI_APP_SHA256;
if (![base,cdp].every(u => ['127.0.0.1','localhost','[::1]'].includes(u.hostname)) || !/^[a-f0-9]{64}$/.test(expectedAppSha || '')) throw Error('Pinned loopback app required');
(async () => {
  const browser = await puppeteer.connect({browserURL: cdp.href, protocolTimeout: 120000}), contexts = [], rows = [];
  async function open() {
    const ctx = await browser.createBrowserContext(); contexts.push(ctx);
    const p = await ctx.newPage(); await p.goto(new URL('index-webos.html?DEFAULT&webos=1',base).href);
    await p.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});
    await p.evaluate(() => {window.hostLifetime = new AbortController(); __CAD_APP.projectService.bindHostLifetime({signal:hostLifetime.signal,valid:()=>true});});
    return p;
  }
  const box = (p,origin,dimensions) => p.evaluate(async ({origin,dimensions}) => {
    const c = __CAD_APP.craftService;
    return c.createWorkerSolidBox({revision:c.inspectWorkerSolids().revision,version:1,unit:'millimeter',engine:'smlib',origin,dimensions});
  },{origin,dimensions});
  const op = (p,kind,a,b) => p.evaluate(async ({kind,a,b}) => {
    const c = __CAD_APP.craftService;
    return c.createWorkerSolidBoolean({revision:c.inspectWorkerSolids().revision,version:1,unit:'millimeter',engine:'smlib',kind,a:a.outputId,b:b.outputId});
  },{kind,a,b});
  const state = p => p.evaluate(async () => ({outputs:__CAD_APP.craftService.inspectWorkerSolids().outputs,native:await __CAD_APP.projectManager.snapshotCurrentProject()}));
  function checkHidden(s,volume,id) {
    assert.equal(s.outputs.length,1);const o=s.outputs[0];
    assert.equal(o.outputId,id);assert.equal(o.resultKind,'multi-material');
    assert.equal(o.metrics.materialRegions,2);assert.equal(o.metrics.voidRegions,1);assert.equal(o.metrics.volumeMagnitude,volume);
    assert.deepEqual(o.displayProjection,{status:'unavailable',reason:'material-orientation-unqualified',sourceTriangleCount:o.metrics.triangleCount,renderTriangleCount:0});
    assert.doesNotMatch(JSON.stringify(s.native),/material-orientation-unqualified|volumeMagnitude|worker-owned|"handle"/);
  }
  async function hollow(p) {
    const a=await box(p,[0,0,0],[10,10,10]), i=await box(p,[2,2,2],[6,6,6]);
    return {a,h:await op(p,'subtract',a,i)};
  }
  try {
    for (const reverse of [false,true]) {
      const p=await open();
      if (!rows.length) {
        const sha=await p.evaluate(async()=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',await (await fetch('/static/index.bundle.js')).arrayBuffer()))].map(v=>v.toString(16).padStart(2,'0')).join(''));
        assert.equal(sha,expectedAppSha);
      }
      const {h}=await hollow(p),far=await box(p,[20,0,0],[10,10,10]),d=await op(p,'union',h,far),saved=await state(p);
      checkHidden(saved,1784,d.outputId);
      const q=await open(); await q.evaluate(async n=>__CAD_APP.projectManager.restoreSnapshotInEmptyWorkspace(JSON.stringify(n)),saved.native);
      assert.deepEqual((await state(q)).outputs,saved.outputs);
      const insert=await box(p,[2,2,2],[6,6,6]);
      const filled=await op(p,'union',...(reverse?[insert,d]:[d,insert])),result=await state(p);
      assert.equal(result.outputs[0].outputId,filled.outputId);assert.equal(result.outputs[0].metrics.volumeMagnitude,2000);
      assert.equal(result.outputs[0].metrics.materialRegions,2);assert.equal(result.outputs[0].metrics.voidRegions,0);
      assert.equal(result.outputs[0].displayProjection.status,'available');
      rows.push({case:reverse?'insert-union-D':'D-union-insert',wholeContainerReplay:true,initialVolume:1784,finalVolume:2000});
    }
    const p=await open(),{a,h}=await hollow(p),island=await box(p,[3,3,3],[2,2,2]),joined=await op(p,'union',h,island),before=await state(p);
    checkHidden(before,792,joined.outputId);
    await p.evaluate(async featureId=>{const c=__CAD_APP.craftService,info=c.inspectWorkerSolidHistory(),t=info.features.find(v=>v.featureId===featureId);await c.editWorkerSolidBox({revision:info.revision,index:t.index,featureId,engine:t.engine,x:t.x,y:t.y,z:t.z,width:t.width,depth:t.depth,height:12});},a.featureId);
    const edited=await state(p);checkHidden(edited,992,joined.outputId);
    for (const [direction,expected] of [['undo',before],['redo',edited]]) {
      await p.evaluate(async direction=>{const c=__CAD_APP.craftService;await c.authoredEditTravel({revision:c.inspectAuthoredEdits().revision,direction});},direction);
      assert.deepEqual((await state(p)).outputs,expected.outputs);
    }
    const q=await open();await q.evaluate(async n=>__CAD_APP.projectManager.restoreSnapshotInEmptyWorkspace(JSON.stringify(n)),edited.native);
    assert.deepEqual((await state(q)).outputs,edited.outputs);
    rows.push({case:'island',volume:792,editedVolume:992,hiddenPreview:true,editTravelAndFreshReplay:true});
    if(process.env.CODI_RECEIPT)fs.writeFileSync(process.env.CODI_RECEIPT,JSON.stringify({appSha256:expectedAppSha,rows,scope:'bounded exact-box native/container evidence; no material-side tessellation or manufacturing qualification'},null,2)+'\n');
    console.log('PASS whole multi-material/void container, explicit unavailable preview, reuse, edit travel and fresh replay');
  } finally {for(const ctx of contexts)await ctx.close().catch(()=>{});browser.disconnect();}
})().catch(e=>{console.error(e);process.exitCode=1});
