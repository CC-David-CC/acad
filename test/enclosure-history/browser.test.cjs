const assert = require('node:assert/strict');
const puppeteer = require(process.env.PUPPETEER_CORE_PATH || 'puppeteer-core');
(async () => {
  const base = new URL(process.env.JSKETCHER_TEST_URL), cdp = new URL(process.env.CODI_TEST_CDP);
  if (![base, cdp].every(url => ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) throw Error('Loopback only');
  const browser = await puppeteer.connect({browserURL: cdp.href, protocolTimeout: 90000});
  const context = await browser.createBrowserContext(), errors = [];
  try {
    async function fresh() {
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(String(error)));
      await page.goto(new URL('index-webos.html?DEFAULT&webos=1', base));
      await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true', {timeout: 90000});
      await page.evaluate(() => { window.testHostController = new AbortController(); __CAD_APP.projectService.bindHostLifetime({signal:testHostController.signal, valid:()=>true}); });
      return page;
    }
    const page = await fresh();
    const initial = await page.evaluate(async () => {
      const c = __CAD_APP, craft = c.craftService;
      const request = {type:'WORKER_ENCLOSURE_V1',params:{featureId:1,width:100,length:70,height:30,wall:2,clearance:.3,lidThickness:2,lipDepth:3}};
      await new Promise((resolve,reject) => craft.modify(request,resolve,reject));
      return {models:craft.models$.value.map(m=>({id:m.id,role:m.outputRole,featureId:m.featureId,positions:m.copyDisplayPositions().length})),history:craft.modifications$.value.history,envelope:c.projectManager.snapshotCurrentProject()};
    });
    assert.deepEqual(initial.models.map(m=>m.role).sort(),['BODY','LID']);
    assert.ok(initial.models.every(m=>m.featureId===1 && m.positions>0));
    assert.equal(initial.history.at(-1).type,'WORKER_ENCLOSURE_V1');
    const edit = await page.evaluate(async () => {
      const craft=__CAD_APP.craftService, wait=async()=>{const end=Date.now()+60000;while(craft.isProcessing&&Date.now()<end)await new Promise(r=>setTimeout(r,10));if(craft.isProcessing)throw Error('Replay timed out')};
      craft.historyTravel.setPointer(-1);await wait();
      const request=JSON.parse(JSON.stringify(craft.modifications$.value.history.at(-1)));request.params.width=120;
      await new Promise((resolve,reject)=>craft.modifyInHistoryAndStep(request,resolve,reject));await wait();
      const edited=craft.models$.value.map(m=>({id:m.id,role:m.outputRole}));craft.historyTravel.setPointer(-1);await wait();const undo=craft.models$.value.length;craft.historyTravel.end();await wait();
      return {edited,undo,redo:craft.models$.value.map(m=>({id:m.id,role:m.outputRole})),envelope:__CAD_APP.projectManager.snapshotCurrentProject()};
    });
    assert.deepEqual(edit.edited.map(m=>m.id).sort(),initial.models.map(m=>m.id).sort());
    assert.equal(edit.undo,0);assert.deepEqual(edit.redo,edit.edited);
    assert.ok(!JSON.stringify(edit.envelope).includes('mountId'));
    const reopened=await fresh();
    const restored=await reopened.evaluate(async envelope=>{const c=__CAD_APP;await c.projectManager.restoreSnapshotInEmptyWorkspace(JSON.stringify(envelope));return {models:c.craftService.models$.value.map(m=>({id:m.id,role:m.outputRole,positions:m.copyDisplayPositions().length})),history:c.craftService.modifications$.value.history};},edit.envelope);
    assert.deepEqual(restored.models.map(m=>m.id).sort(),edit.edited.map(m=>m.id).sort());
    assert.ok(restored.models.every(m=>m.positions>0));assert.equal(restored.history.at(-1).params.width,120);assert.deepEqual(errors,[]);
    const invalid=await page.evaluate(async()=>{const c=__CAD_APP,craft=c.craftService,wait=async()=>{const end=Date.now()+60000;while(craft.isProcessing&&Date.now()<end)await new Promise(r=>setTimeout(r,10));if(craft.isProcessing)throw Error('Replay timed out')};craft.historyTravel.setPointer(-1);await wait();const before=JSON.stringify(craft.modifications$.value.history),request=JSON.parse(before).at(-1);request.params.wall=1000;let rejected=false;try{await new Promise((resolve,reject)=>craft.modifyInHistoryAndStep(request,resolve,reject))}catch{rejected=true}await wait();const retained=JSON.stringify(craft.modifications$.value.history)===before;craft.historyTravel.end();await wait();return {rejected,retained,roles:craft.models$.value.map(m=>m.outputRole).sort()};});
    assert.equal(invalid.rejected,true);assert.equal(invalid.retained,true);assert.deepEqual(invalid.roles,['BODY','LID']);
    const wizard=await fresh();await wizard.addScriptTag({url:new URL('static/webosTest.bundle.js',base).href});
    const wizardResult=await wizard.evaluate(async()=>{const c=__CAD_APP;window.Cypress={$:s=>{const a=[...document.querySelectorAll(s)];a.index=n=>a.indexOf(n);return a}};const ui=webosTest.modellerUISubject(c);ui.openWizard('WORKER_ENCLOSURE_V1');await ui.wizardOK();const end=Date.now()+60000;while(c.craftService.isProcessing&&Date.now()<end)await new Promise(r=>setTimeout(r,10));return {roles:c.craftService.models$.value.map(m=>m.outputRole).sort(),history:c.craftService.modifications$.value.history.map(h=>h.type)};});
    assert.deepEqual(wizardResult.roles,['BODY','LID']);assert.equal(wizardResult.history.at(-1),'WORKER_ENCLOSURE_V1');assert.deepEqual(errors,[]);
    const cancellation=await fresh();
    const cancelled=await cancellation.evaluate(async()=>{const c=__CAD_APP,craft=c.craftService,before=JSON.stringify(craft.modifications$.value.history),Native=window.Worker;let held=false,terminated=0;window.Worker=class extends Native{postMessage(data,...args){if(data?.kind==='enclosure-build'){held=true;return}return super.postMessage(data,...args)}terminate(){terminated++;return super.terminate()}};try{const request={type:'WORKER_ENCLOSURE_V1',params:{featureId:1,width:100,length:70,height:30,wall:2,clearance:.3,lidThickness:2,lipDepth:3}},pending=new Promise(resolve=>craft.modify(request,()=>resolve({ok:true}),e=>resolve({ok:false,name:e?.name})));const end=Date.now()+30000;while(!held&&Date.now()<end)await new Promise(r=>setTimeout(r,10));if(!held)throw Error('Enclosure worker was not dispatched');testHostController.abort();const result=await pending;return {result,terminated,historySame:JSON.stringify(craft.modifications$.value.history)===before,candidates:craft.engineResourceUsage.candidates};}finally{window.Worker=Native}});
    assert.equal(cancelled.result.ok,false);assert.ok(cancelled.terminated>0);assert.equal(cancelled.historySame,true);assert.equal(cancelled.candidates,0);
    console.log('PASS OCC enclosure create, edit, undo/redo fresh snapshot replay, rejected edit wizard and in-flight cancellation');
  } finally {await context.close();browser.disconnect();}
})().catch(error=>{console.error(error.stack);process.exitCode=1});
