// Real pointer control for an existing projected-distance axis. Loopback only.
const assert=require('node:assert/strict'),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);
if(![base,cdp].every(u=>['127.0.0.1','localhost','[::1]'].includes(u.hostname)))throw Error('Loopback only');
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:120000}),context=await browser.createBrowserContext();try{
 const page=await context.newPage();await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base).href);await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});await page.addScriptTag({url:new URL('static/webosTest.bundle.js',base).href});
 const before=await page.evaluate(async()=>{
  window.Cypress={$:s=>{const a=[...document.querySelectorAll(s)];a.index=n=>a.indexOf(n);return a}};
  const ui=webosTest.modellerUISubject(__CAD_APP);[window.sketch]=await webosTest.createPlaneAndOpenSketcher(ui);window.ctx=__CAD_APP.services.sketcher.inPlaceEditor.sketcherAppContext;window.v=sketch.viewer;
  window.axis=sketch.addSegment(-80,0,80,0);const points=sketch.addSegment(-25,35,45,55),action=ctx.actions.ProjectedDistance,inspection=await action.inspect(ctx);
  await action.invokeByIds(ctx,[points.a.id,points.b.id,axis.id],70,inspection.revision,{valid:()=>true});
  const screen=p=>{const s=v.screenToModelMatrix.invert().apply3([p.x,p.y,0]),r=v.canvas.getBoundingClientRect();return {x:r.x+s[0]/v.retinaPxielRatio,y:r.y+(v.canvas.height-s[1])/v.retinaPxielRatio};};
  return {a:screen(axis.a),b:screen(axis.b),id:axis.b.id,coords:[axis.a.x,axis.a.y,axis.b.x,axis.b.y]};
 });
 await page.mouse.move(before.b.x,before.b.y);await new Promise(r=>setTimeout(r,100));await page.mouse.down();
 const selected=await page.evaluate(()=>({tool:v.toolManager.tool?.name,selected:v.selected.map(o=>o.id)}));
 await page.mouse.move(before.b.x-10,before.b.y,{steps:2});
 const intermediate=await page.evaluate(()=>({status:v.parametricManager.stage.algNumSystem.solveStatus,coords:[axis.a.x,axis.a.y,axis.b.x,axis.b.y]}));
 await page.mouse.up();assert.equal(selected.tool,'drag');assert.ok(selected.selected.includes(before.id),'the axis endpoint must be selected');
 assert.notDeepEqual(intermediate.coords,before.coords,`valid drag was restored: ${JSON.stringify(intermediate)}`);
 assert.equal(intermediate.status.success,true,JSON.stringify(intermediate));
 console.log('PASS projected-distance axis endpoint moves during a real nondegenerate pointer drag');
}finally{await context.close();browser.disconnect();}})().catch(error=>{console.error(error.stack);process.exitCode=1});
