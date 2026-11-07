// Prepared actual rendered-control assertion; not executed by the source lane.
// Geometry setup uses the existing helper; the conflicting action uses a real click.
const assert=require('node:assert/strict');
const puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);
if(![base,cdp].every(url=>['127.0.0.1','localhost','[::1]'].includes(url.hostname)))throw Error('Owned loopback fixture required.');
(async()=>{
 const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:120000});
 const context=await browser.createBrowserContext();let passed=false;
 try{
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  if(process.env.CODI_PHONE)await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
  const response=await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base).href);
  const csp=response.headers()['content-security-policy']||'';
  assert.match(csp,/wasm-unsafe-eval/);assert.doesNotMatch(csp,/'unsafe-eval'/);
  await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});
  await page.addScriptTag({url:new URL('static/webosTest.bundle.js',base).href});
  await page.evaluate(async()=>{
   window.Cypress={$:selector=>{const nodes=[...document.querySelectorAll(selector)];nodes.index=node=>nodes.indexOf(node);return nodes;}};
   const ui=webosTest.modellerUISubject(__CAD_APP),[subject]=await webosTest.createPlaneAndOpenSketcher(ui);
   const first=subject.addCircle(-35,0,20),second=subject.addCircle(35,0,10);
   const ctx=__CAD_APP.services.sketcher.inPlaceEditor.sketcherAppContext,viewer=ctx.viewer;
   // Set up actual conflicting geometry; no model mutation replaces the click below.
   ctx.actions.FixEntity.invoke(ctx,[first]);ctx.actions.FixEntity.invoke(ctx,[second]);
   const systems=viewer.parametricManager.stages.map(stage=>stage.algNumSystem);
   if(systems.flatMap(system=>system.allConstraints).filter(c=>c.schema.id==='FixCircle').length!==2)throw Error('Two fixed circles are required.');
   subject.select([first,second]);
   window.concentricSnapshot=()=>{
    const h=viewer.historyManager;
    return {source:viewer.io.serializeSketch(undefined,{strict:true}),history:JSON.stringify({diffs:h.diffs,pointer:h.historyPointer,last:h.lastCheckpoint,counter:h._counter,recovery:h.recoverySnapshot}),
     geometry:[first.c.x,first.c.y,first.r.get(),second.c.x,second.c.y,second.r.get()],
     relations:systems.map(system=>system.allConstraints.map(c=>({id:c.id,type:c.schema.id,conflicting:system.conflicting.has(c),redundant:system.redundant.has(c)}))),
     backlinks:[first,second].map(object=>[...object.constraints].map(c=>c.id))};
   };
  });
  const button='button[title="Make the centers of two circles or arcs coincide"]';
  await page.waitForSelector(button,{visible:true});const before=await page.evaluate(()=>concentricSnapshot());
  await page.click(button);
  await page.waitForFunction(()=>[...document.querySelectorAll('.Toastify__toast-body,[role="alert"]')].some(node=>{
   const bounds=node.getBoundingClientRect(),style=getComputedStyle(node);
   return /concentric.*conflicts with existing constraints/i.test(node.textContent||'')&&bounds.width>0&&bounds.height>0&&style.visibility!=='hidden'&&style.display!=='none';
  }),{timeout:10000});
  assert.deepEqual(await page.evaluate(()=>concentricSnapshot()),before,'UI refusal must preserve authored source, geometry, membership, backlinks and real history.');
  assert.deepEqual(errors,[],'The event handler must show a toast rather than escaping as an uncaught UI error.');
  passed=true;console.log('PASS actual Concentric contextual-button click shows visible refusal toast and preserves exact source/history/model.');
 }finally{
  if(passed)await context.close();else console.error('FAIL: retained only this test-owned browser context for inspection.');
  browser.disconnect();
 }
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
