// Actual authored-history menu and keyboard controls on the full CAD app.
const assert = require('node:assert/strict');
const puppeteer = require(process.env.PUPPETEER_CORE_PATH || 'puppeteer-core');
const base = new URL(process.env.JSKETCHER_TEST_URL), cdp = new URL(process.env.CODI_TEST_CDP);
for (const u of [base, cdp]) if (!['127.0.0.1','localhost','[::1]'].includes(u.hostname)) throw Error('Loopback only');
(async () => {
  const browser = await puppeteer.connect({browserURL:cdp.href,protocolTimeout:300000});
  const context = await browser.createBrowserContext();
  try {
    const page = await context.newPage(), errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base));
    await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});
    await page.evaluate(async () => {
      const c=__CAD_APP, controller=new AbortController();
      c.projectService.bindHostLifetime({signal:controller.signal,valid:()=>true});
      const call=req=>new Promise((ok,no)=>c.craftService.modify(req,ok,no));
      const rect=await c.craftService.createRectangleSketch({revision:c.craftService.inspectRectangleCreation().revision,unit:'millimeter',origin:[10,20],width:100,height:50,depth:7});
      const face=c.cadRegistry.findFace(rect.faceId);
      await call({type:'WORKER_RECTANGLE_EXTRUDE_V1',params:{featureId:2,length:20,face:face.id,regions:[face.sketchRegions[0].id]}});
      let f=c.craftService.inspectWorkerFeatureCommands(), h=f.centeredHoleCandidates[0];
      await c.craftService.createWorkerCenteredHole({revision:f.revision,bodyId:h.bodyId,lidFaceId:h.lidFaceId,diameter:10});
      f=c.craftService.inspectWorkerFeatureCommands();h=f.fourCornerCandidates[0];
      await c.craftService.createWorkerFourCornerHoles({revision:f.revision,bodyId:h.bodyId,centerWallId:h.centerWallId,sideIds:h.sideIds,diameter:4,offsetX:10,offsetY:10});
      window.menuFaceId=rect.faceId;
    });
    const enabled=async id=>page.evaluate(id=>__CAD_APP.streams.action.state[id].value.enabled,id);
    const waitState=async(id,value)=>page.waitForFunction((id,value)=>__CAD_APP.streams.action.state[id].value.enabled===value,{timeout:90000},id,value);
    const menu=async id=>{await page.click('[data-action-id="menu.edit"]');await page.waitForSelector(`[data-action-id="${id}"]`,{visible:true});await page.click(`[data-action-id="${id}"]`);};
    const history=async()=>page.evaluate(()=>__CAD_APP.craftService.modifications$.value.history.map(x=>({...x.params})));
    const dimensions=async()=>page.evaluate(()=>{const p=Array.from(__CAD_APP.craftService.models$.value[0].brepShell.vertices,v=>v.point);return ['x','y','z'].map(k=>Math.max(...p.map(v=>v[k]))-Math.min(...p.map(v=>v[k])))});
    assert.equal(await enabled('AuthoredUndo'),false);
    await page.evaluate(async()=>{const c=__CAD_APP,r=c.craftService.inspectRectangleDimensions();await c.craftService.editRectangleDimensions({revision:r.revision,faceId:window.menuFaceId,width:150,height:30})});
    await waitState('AuthoredUndo',true);assert.equal(await enabled('AuthoredRedo'),false);
    await menu('AuthoredUndo');await waitState('AuthoredRedo',true);
    assert.equal((await history()).length,4);assert.deepEqual(await dimensions(),[100,50,20]);
    await menu('AuthoredRedo');await waitState('AuthoredUndo',true);assert.deepEqual(await dimensions(),[150,30,20]);
    await page.evaluate(async()=>{const c=__CAD_APP,r=c.craftService.inspectWorkerHistory();await c.craftService.editWorkerExtrusion({revision:r.revision,index:1,featureId:2,depth:35})});
    await waitState('AuthoredUndo',true);
    // A focused editable input retains its own browser undo and cannot undo the model.
    await page.evaluate(()=>{const input=document.createElement('input');input.id='undo-focus-control';document.body.append(input);input.focus()});
    await page.type('#undo-focus-control','abc');await page.keyboard.down('Control');await page.keyboard.press('z');await page.keyboard.up('Control');
    assert.equal((await history())[1].length,35);assert.equal(await page.$eval('#undo-focus-control',e=>e.value),'');
    await page.evaluate(()=>document.querySelector('#undo-focus-control').remove());
    // Hold a real OCC worker request to check busy availability and single dispatch.
    await page.evaluate(()=>{const original=Worker.prototype.postMessage;window.undoHeld=false;Worker.prototype.postMessage=function(msg,...rest){if(msg?.kind==='profile-extrude'&&!window.undoHeld){window.undoHeld=true;window.releaseUndo=()=>original.call(this,msg,...rest);return;}return original.call(this,msg,...rest)}});
    await page.keyboard.down('Control');await page.keyboard.press('z');await page.keyboard.up('Control');
    await page.waitForFunction('window.undoHeld===true',{timeout:90000});
    assert.equal(await enabled('AuthoredUndo'),false);assert.equal(await enabled('AuthoredRedo'),false);
    await page.keyboard.down('Control');await page.keyboard.press('z');await page.keyboard.up('Control');
    await page.evaluate(()=>window.releaseUndo());await waitState('AuthoredRedo',true);
    assert.equal((await history())[1].length,20);
    await page.keyboard.down('Control');await page.keyboard.down('Shift');await page.keyboard.press('z');await page.keyboard.up('Shift');await page.keyboard.up('Control');
    await page.waitForFunction('__CAD_APP.craftService.modifications$.value.history[1].params.length===35',{timeout:90000});
    await page.evaluate(async()=>{const c=__CAD_APP,r=c.craftService.inspectWorkerHistory();await c.craftService.editWorkerFourCornerHoles({revision:r.revision,index:3,featureId:4,diameter:5,offsetX:11,offsetY:11})});
    await waitState('AuthoredUndo',true);await menu('AuthoredUndo');
    await page.waitForFunction('__CAD_APP.craftService.modifications$.value.history[3].params.diameter===4',{timeout:90000});
    await menu('AuthoredRedo');await page.waitForFunction('__CAD_APP.craftService.modifications$.value.history[3].params.diameter===5',{timeout:90000});
    assert.equal((await history()).length,4);
    // Deliberate command failure exercises action error containment, without modifying model.
    await page.evaluate(()=>{const c=__CAD_APP;window.savedTravel=c.craftService.authoredEditTravel;c.craftService.authoredEditTravel=()=>Promise.reject(Error('injected'))});
    const before=JSON.stringify(await history());await menu('AuthoredUndo');await waitState('AuthoredUndo',true);
    assert.equal(JSON.stringify(await history()),before);assert.deepEqual(errors,[]);
    await page.evaluate(()=>{__CAD_APP.craftService.authoredEditTravel=window.savedTravel});
    await page.addScriptTag({url:new URL('static/webosTest.bundle.js',base).href});
    await page.evaluate(async()=>{const c=__CAD_APP;c.craftService.historyTravel.setPointer(0);while(c.craftService.isProcessing)await new Promise(r=>setTimeout(r,10));const face=c.cadRegistry.shells[0].faces[0];c.services.marker.clear();c.services.marker.markExclusively(face.TYPE,face.id);window.Cypress={$:s=>{const a=[...document.querySelectorAll(s)];a.index=n=>a.indexOf(n);return a}};webosTest.modellerUISubject(c).openSketcher()});
    await page.waitForFunction('__CAD_APP.services.sketcher.inPlaceEditor.inEditMode===true',{timeout:30000});
    await waitState('AuthoredUndo',false);await waitState('AuthoredRedo',false);
    const sketchHistory=JSON.stringify(await history());
    await page.keyboard.down('Control');await page.keyboard.press('z');await page.keyboard.up('Control');
    assert.equal(JSON.stringify(await history()),sketchHistory);
    console.log('PASS actual menu and keyboard authored history, focused input, held OCC worker and contained failure');
  } finally {await context.close();browser.disconnect()}
})().catch(e=>{console.error(e);process.exitCode=1});
