// Full application UI and ordinary sketch history, loopback fixture only.
const assert=require('node:assert/strict');
const puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);
if(![base,cdp].every(u=>['127.0.0.1','localhost','[::1]'].includes(u.hostname)))throw Error('Loopback only');
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:120000});try{
 for(const [globalAction,kind,value] of [['SignedDistanceXGlobal','SignedDistanceX','-25'],['SignedDistanceYGlobal','SignedDistanceY','-15'],['ProjectedDistanceGlobal','ProjectedDistance','20']]) {
  const context=await browser.createBrowserContext();try{
   const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base).href);
   await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value === true',{timeout:90000});
   await page.addScriptTag({url:new URL('static/webosTest.bundle.js',base).href});
   const before=await page.evaluate(async({globalAction,kind})=>{
    window.Cypress={$:s=>{const a=[...document.querySelectorAll(s)];a.index=n=>a.indexOf(n);return a}};
    window.testUI=webosTest.modellerUISubject(__CAD_APP);[window.testSketch]=await webosTest.createPlaneAndOpenSketcher(testUI);
    window.testContext=__CAD_APP.services.sketcher.inPlaceEditor.sketcherAppContext;
    window.testViewer=testSketch.viewer;
    const first=testSketch.addSegment(0,0,100,0),second=testSketch.addSegment(0,30,30,60);
    window.testObjects={first,second};
    testSketch.select(kind==='ProjectedDistance'?[second.a,second.b,first]:[second.a,second.b]);
    const before=testViewer.io.serializeSketch(undefined,{strict:true});
    testContext.actions[globalAction].invoke(testContext);return before;
   },{globalAction,kind});
   await page.waitForFunction(()=>document.body.innerText.includes('APPLY'));
   const input=await page.$('input:not([type=file])');assert.ok(input,'dimension field');await input.click({clickCount:3});await input.press('Backspace');await input.type(value);
   const applied=await page.evaluate(()=>{const button=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='APPLY');if(!button)throw Error('APPLY missing');button.click();return true;});assert.ok(applied);
   await page.waitForFunction(type=>testViewer.parametricManager.stage.algNumSystem.allConstraints.some(c=>c.schema.id===type),{},kind);
   const after=await page.evaluate(()=>testViewer.io.serializeSketch(undefined,{strict:true}));
   if(kind==='SignedDistanceX') {
    const historyBefore=await page.evaluate(()=>{const h=testViewer.historyManager;return JSON.stringify({diffs:h.diffs,pointer:h.historyPointer,last:h.lastCheckpoint,counter:h._counter});});
    await page.evaluate(()=>testContext.actions.SignedDistanceX.invoke(testContext,[testObjects.second.a,testObjects.second.b]));
    await page.waitForFunction(()=>document.body.innerText.includes('APPLY'));
    const field=await page.$('input:not([type=file])');await field.click({clickCount:3});await field.press('Backspace');await field.type('-35');
    await page.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='APPLY').click());
    await page.waitForFunction(()=>!document.body.innerText.includes('APPLY'));
    const refused=await page.evaluate(()=>{const h=testViewer.historyManager;return {sketch:testViewer.io.serializeSketch(undefined,{strict:true}),history:JSON.stringify({diffs:h.diffs,pointer:h.historyPointer,last:h.lastCheckpoint,counter:h._counter})};});
    assert.equal(refused.sketch,after,'contradictory UI action changed the sketch');assert.equal(refused.history,historyBefore,'contradictory UI action changed history');
   }
   const states=await page.evaluate(()=>{const h=testViewer.historyManager;h.undo();const undone=testViewer.io.serializeSketch(undefined,{strict:true});h.redo();const redone=testViewer.io.serializeSketch(undefined,{strict:true});return {undone,redone};});
   assert.equal(states.undone,before);assert.equal(states.redone,after);assert.deepEqual(errors,[]);
   await page.evaluate(async ()=>await testUI.commitSketch());
   const saved=await page.evaluate(()=>__CAD_APP.projectManager.snapshotCurrentProject());
   const fresh=await context.newPage();await fresh.goto(new URL('index-webos.html?DEFAULT&webos=1',base).href);
   await fresh.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value === true',{timeout:90000});
   await fresh.evaluate(snapshot=>__CAD_APP.projectManager.restoreSnapshotInEmptyWorkspace(JSON.stringify(snapshot)),saved);
   const replayed=await fresh.evaluate(()=>__CAD_APP.projectManager.snapshotCurrentProject());
   assert.deepEqual(replayed.project.sketches,saved.project.sketches,'fresh workspace preserves exact native sketch records');
   const sketchText=JSON.stringify(replayed.project.sketches);
   assert.ok(sketchText.includes(kind),`${kind} was not retained in native project replay`);
   console.log(`PASS ${kind} selected UI action, editor, undo/redo and fresh native project replay`);
  } finally {await context.close();}
 }
 const context=await browser.createBrowserContext();try {
  const page=await context.newPage();await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base).href);
  await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value === true',{timeout:90000});
  await page.addScriptTag({url:new URL('static/webosTest.bundle.js',base).href});
  const result=await page.evaluate(async()=>{
   window.Cypress={$:s=>{const a=[...document.querySelectorAll(s)];a.index=n=>a.indexOf(n);return a}};
   const ui=webosTest.modellerUISubject(__CAD_APP),[sketch]=await webosTest.createPlaneAndOpenSketcher(ui);
   const ctx=__CAD_APP.services.sketcher.inPlaceEditor.sketcherAppContext,segment=sketch.addSegment(0,0,30,20),action=ctx.actions.SignedDistanceX;
   const first=await action.inspect(ctx);const applied=await action.invokeByIds(ctx,[segment.a.id,segment.b.id],-9,first.revision,{valid:()=>true});
   const stale=await action.inspect(ctx);segment.b.y+=1;let refused=false;
   try{await action.invokeByIds(ctx,[segment.a.id,segment.b.id],-10,stale.revision,{valid:()=>true});}catch(_){refused=true;}
   return {status:applied.status,dx:segment.b.x-segment.a.x,refused};
  });
  assert.equal(result.status,'accepted');assert.ok(Math.abs(result.dx+9)<1e-6);assert.equal(result.refused,true);
  console.log('PASS ID/revision action and stale geometry refusal in full sketcher');
 }finally{await context.close();}
}finally{browser.disconnect();}})().catch(error=>{console.error(error.stack);process.exitCode=1});
