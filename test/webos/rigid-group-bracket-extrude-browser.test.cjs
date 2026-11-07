const assert=require('node:assert/strict'),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);if(![base,cdp].every(u=>['127.0.0.1','localhost','[::1]'].includes(u.hostname)))throw Error('Loopback only');
(async()=>{const b=await puppeteer.connect({browserURL:cdp.href}),context=await b.createBrowserContext();try{
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base).href);await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});await page.addScriptTag({url:new URL('static/webosTest.bundle.js',base).href});
 const grouped=process.env.CODI_RIGID_UNGROUPED!=='1';
 const result=await page.evaluate(async grouped=>{
  window.Cypress={$:s=>{const a=[...document.querySelectorAll(s)];a.index=n=>a.indexOf(n);return a}};const ui=webosTest.modellerUISubject(__CAD_APP),[sketch]=await webosTest.createPlaneAndOpenSketcher(ui),ctx=__CAD_APP.services.sketcher.inPlaceEditor.sketcherAppContext;
  const pts=[[-60,-40],[60,-40],[60,-20],[-40,-20],[-40,40],[-60,40],[-60,-40]],lines=pts.slice(0,-1).map((p,i)=>sketch.addSegment(...p,...pts[i+1]));
  if(grouped){sketch.select(lines);ctx.actions.CreateRigidGroupGlobal.invoke(ctx);if(!sketch.viewer.parametricManager.stage.algNumSystem.allConstraints.some(c=>c.schema.id==='RigidGroup'))throw Error('Group not created');}
  await ui.commitSketch();await new Promise(resolve=>setTimeout(resolve,300));ui.selectFaces([-50,0,-10],[-50,0,10]);
  const face=__CAD_APP.services.selection.face.single;if(!face)throw Error('No bracket source face selected');
  const regions={count:face.sketchRegions?.length,error:face.sketchRegionError};ui.openWizard('EXTRUDE');ui.wizardContext.updateParam('length',5);await ui.wizardOK();
  return {regions,shells:__CAD_APP.cadRegistry.shells.map(s=>({id:s.id,faces:s.faces.length})),rays:[[-50,0],[0,-30],[0,0]].map(([x,y])=>ui.rayCastFaces([x,y,20],[x,y,-10]).map(f=>f.id)),history:__CAD_APP.craftService.modifications$.value.history.map(h=>h.type),text:document.body.innerText.slice(-500)};
 },grouped);
 assert.equal(result.regions.count,0);assert.match(result.regions.error,/Multiple profiles/);assert.ok(result.shells.some(s=>s.faces===8),JSON.stringify(result));assert.ok(result.rays[0].length>=2&&result.rays[1].length>=2&&result.rays[2].length===0,JSON.stringify(result));assert.deepEqual(errors,[]);console.log(`PASS ${grouped?'grouped':'ungrouped'} L-profile legacy extrusion and independent inside/outside rays; generic worker region remains unsupported`,JSON.stringify(result));
}finally{await context.close();b.disconnect();}})().catch(error=>{console.error(error.stack);process.exitCode=1});
