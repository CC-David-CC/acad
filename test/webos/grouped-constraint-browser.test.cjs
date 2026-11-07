// Real sketcher action dispatch and solver; each case owns a browser context.
const assert = require('node:assert/strict');
const puppeteer = require(process.env.PUPPETEER_CORE_PATH || 'puppeteer-core');
const base = new URL(process.env.JSKETCHER_TEST_URL), cdp = new URL(process.env.CODI_TEST_CDP);
for (const url of [base, cdp]) if (!['127.0.0.1','localhost','[::1]'].includes(url.hostname)) throw Error('Loopback only');

(async () => {
  const browser = await puppeteer.connect({browserURL:cdp.href, protocolTimeout:120000});
  try {
    for (const action of ['EqualLength','EqualRadius','Coincident']) {
      const context = await browser.createBrowserContext();
      try {
        const page = await context.newPage();
        const errors=[]; page.on('pageerror',e=>errors.push(e.message));
        await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base).href);
        await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value === true',{timeout:90000});
        await page.addScriptTag({url:new URL('static/webosTest.bundle.js',base).href});
        const result = await page.evaluate(async action => {
          window.Cypress={$:s=>{const a=[...document.querySelectorAll(s)];a.index=n=>a.indexOf(n);return a}};
          const ui=webosTest.modellerUISubject(__CAD_APP), [sketch]=await webosTest.createPlaneAndOpenSketcher(ui);
          const ctx=__CAD_APP.services.sketcher.inPlaceEditor.sketcherAppContext, v=sketch.viewer;
          const selected=action==='EqualRadius' ? [0,1,2].map(i=>sketch.addCircle(i*30,0,5+i)) :
            [0,1,2].map(i=>sketch.addSegment(i*30,0,i*30+10,10));
          const objects=action==='Coincident' ? selected.map(s=>s.a) : selected;
          const snap=()=>v.io.serializeSketch(undefined,{strict:true});
          const before=snap(); sketch.select(objects);
          const globalAction=action==='Coincident' ? 'CoincidentGlobal' : 'EntityEqualityGlobal';
          if (!ctx.actions[globalAction]) throw Error('Missing global UI action');
          ctx.actions[globalAction].invoke(ctx);
          const after=snap(); v.historyManager.undo(); const undone=snap(); v.historyManager.redo(); const redone=snap();
          return {before,after,undone,redone};
        },action);
        assert.equal(result.undone,result.before,`${action} undo changed prior sketch`);
        assert.equal(result.redone,result.after,`${action} redo differs`);
        assert.notEqual(result.after,result.before,`${action} did not apply`);
        assert.deepEqual(errors,[]);
        console.log(`PASS ${action} selected UI action and undo/redo`);
      } finally { await context.close(); }
    }
    const context=await browser.createBrowserContext();
    try {
      const page=await context.newPage();
      await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base).href);
      await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value === true',{timeout:90000});
      await page.addScriptTag({url:new URL('static/webosTest.bundle.js',base).href});
      const result=await page.evaluate(async()=>{
        window.Cypress={$:s=>{const a=[...document.querySelectorAll(s)];a.index=n=>a.indexOf(n);return a}};
        const ui=webosTest.modellerUISubject(__CAD_APP),[sketch]=await webosTest.createPlaneAndOpenSketcher(ui);
        const ctx=__CAD_APP.services.sketcher.inPlaceEditor.sketcherAppContext,v=sketch.viewer;
        const circles=[sketch.addCircle(-30,0,2),sketch.addCircle(0,0,2),sketch.addCircle(30,0,7)];
        const diameter=ctx.actions.DiameterLength;
        for (const [circle,value] of [[circles[0],4],[circles[2],14]]) {
          const inspected=await diameter.inspect(ctx);
          await diameter.invokeById(ctx,circle.id,value,inspected.revision,{valid:()=>true});
        }
        const snapshot=()=>v.io.serializeSketch(undefined,{strict:true});
        const before=snapshot(), h=v.historyManager;
        const history=JSON.stringify({diffs:h.diffs,pointer:h.historyPointer,last:h.lastCheckpoint,counter:h._counter});
        let rejected=false;
        try { ctx.actions.EqualRadius.invoke(ctx,circles); } catch (_) { rejected=true; }
        const after=snapshot(), historyAfter=JSON.stringify({diffs:h.diffs,pointer:h.historyPointer,last:h.lastCheckpoint,counter:h._counter});
        h.undo(); const undone=snapshot(); h.redo(); const redone=snapshot();
        return {rejected,before,after,history,historyAfter,undone,redone};
      });
      assert.equal(result.rejected,true);
      assert.equal(result.after,result.before,'conflicting group changed sketch');
      assert.equal(result.historyAfter,result.history,'conflicting group changed history');
      assert.notEqual(result.undone,result.before,'undo did not restore the preceding state');
      assert.equal(result.redone,result.before,'redo did not restore the prior accepted state');
      console.log('PASS contradictory bulk group preserves geometry, constraints and history');
    } finally {await context.close()}
  } finally { browser.disconnect(); }
})().catch(e=>{console.error(e.stack);process.exitCode=1});
