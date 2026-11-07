const assert = require('node:assert/strict');
const puppeteer = require(process.env.PUPPETEER_CORE_PATH || 'puppeteer-core');
(async () => {
  const base = new URL(process.env.JSKETCHER_TEST_URL), cdp = new URL(process.env.CODI_TEST_CDP);
  if (![base, cdp].every(u => ['127.0.0.1', 'localhost', '[::1]'].includes(u.hostname))) throw Error('Loopback only');
  const browser = await puppeteer.connect({browserURL: cdp.href, protocolTimeout: 120000});
  const context = await browser.createBrowserContext();
  try {
    const page = await context.newPage();page.on('console',m=>{if(m.text().startsWith('DIAG'))console.log(m.text())});
    await page.goto(new URL('index-webos.html?DEFAULT&webos=1', base));
    await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true', {timeout: 90000});
    const other = await context.newPage();
    await other.goto(new URL('index-webos.html?DEFAULT&webos=1', base));
    await other.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true', {timeout: 90000});
    const otherBefore = await other.evaluate(async () => {const c=__CAD_APP;c.projectService.bindHostLifetime({signal:new AbortController().signal,valid:()=>true});await c.craftService.createRectangleSketch({revision:c.craftService.inspectRectangleCreation().revision,unit:'millimeter',origin:[0,0],width:20,height:10,depth:0});return JSON.stringify(c.projectManager.snapshotCurrentProject());});
    const result = await page.evaluate(async () => {
      const c = __CAD_APP, craft = c.craftService, host = new AbortController();
      c.projectService.bindHostLifetime({signal: host.signal, valid: () => true});
      await craft.createRectangleSketch({revision: craft.inspectRectangleCreation().revision, unit:'millimeter', origin:[0,0], width:100, height:50, depth:0});
      let inspect = craft.inspectWorkerFeatureCommands();
      await craft.createWorkerExtrusion({revision: inspect.revision, ...inspect.extrusionCandidates[0], depth:20});
      const staleRevision=craft.inspectWorkerHistory().revision;
      const wait = async () => { const end=Date.now()+90000; while(craft.isProcessing&&Date.now()<end) await new Promise(r=>setTimeout(r,10)); if(craft.isProcessing)throw Error('Replay timed out'); };
      craft.historyTravel.backward({noWizardFocus:true});await wait();
      const target=craft.inspectWorkerHistory(),feature=target.features[0],model=craft.models$.value[0],history=JSON.stringify(craft.modifications$.value);
      let stale=false;try{await craft.editWorkerExtrusion({revision:staleRevision,index:feature.index,featureId:feature.featureId,depth:35});}catch(e){stale=e.name==='AbortError';}if(!stale)throw Error('Stale revision was accepted');
      let invalid=false;try{await craft.editWorkerExtrusion({revision:target.revision,index:feature.index,featureId:feature.featureId,depth:-1});}catch{invalid=true;}
      if(!invalid||craft.models$.value[0]!==model||JSON.stringify(craft.modifications$.value)!==history)throw Error('Invalid edit changed state');
      const oldValid=craft.inspectWorkerHistory();const receipt=await craft.editWorkerExtrusion({revision:oldValid.revision,index:feature.index,featureId:feature.featureId,depth:35});
      const edited=craft.models$.value[0],z=Array.from(edited.brepShell.vertices,v=>v.point.z),bounds=[Math.min(...z),Math.max(...z)];
      craft.historyTravel.backward({noWizardFocus:true});await wait();
      const before=craft.models$.value[0],beforeHistory=JSON.stringify(craft.modifications$.value),guard=new AbortController(), Native=window.Worker;
      let held=false,terminated=0;window.Worker=class extends Native {postMessage(data,...args){if(data?.kind==='profile-extrude'){held=true;return;}return super.postMessage(data,...args);}terminate(){terminated++;return super.terminate();}};
      try {
        const current=craft.inspectWorkerHistory(),pending=craft.editWorkerExtrusion({revision:current.revision,index:feature.index,featureId:feature.featureId,depth:40},{signal:guard.signal}).then(()=>({ok:true}),e=>({ok:false,name:e.name}));
        const end=Date.now()+30000;while(!held&&Date.now()<end)await new Promise(r=>setTimeout(r,10));if(!held)throw Error('Edit worker not dispatched');
        const count=terminated;guard.abort();const cancelled=await pending,signalTerminated=terminated-count;
        held=false;let valid=true;const fresh=craft.inspectWorkerHistory();
        const next=craft.editWorkerExtrusion({revision:fresh.revision,index:feature.index,featureId:feature.featureId,depth:40},{valid:()=>valid}).then(()=>({ok:true}),e=>({ok:false,name:e.name}));
        const end2=Date.now()+30000;while(!held&&Date.now()<end2)await new Promise(r=>setTimeout(r,10));if(!held)throw Error('Second edit worker not dispatched');
        const count2=terminated;valid=false;const invalidated=await next;
        return {invalid,receipt,bounds,cancelled,terminated:signalTerminated,invalidated,invalidTerminated:terminated-count2,modelSame:craft.models$.value[0]===before,historySame:JSON.stringify(craft.modifications$.value)===beforeHistory,candidates:craft.engineResourceUsage.candidates};
      } finally {window.Worker=Native;}
    });
    assert.equal(result.invalid,true);assert.deepEqual(result.bounds,[0,35]);assert.equal(result.receipt.depth,35);
    assert.equal(result.cancelled.ok,false);assert.equal(result.cancelled.name,'AbortError');assert.ok(result.terminated>0);assert.equal(result.invalidated.name,'AbortError');assert.ok(result.invalidTerminated>0);assert.equal(result.modelSame,true);assert.equal(result.historySame,true);assert.equal(result.candidates,0);
    assert.equal(await other.evaluate(()=>JSON.stringify(__CAD_APP.projectManager.snapshotCurrentProject())),otherBefore,'other document survives cancellation');
    console.log('PASS real guarded extrusion history edit and in-flight cancellation');
  } finally {await context.close();browser.disconnect();}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
