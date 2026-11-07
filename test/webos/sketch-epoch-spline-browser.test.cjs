// Full app, test-helper sketch setup; no production account or hosting.
const assert=require('node:assert/strict');
const puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);
const closed=process.env.CODI_SPLINE_MODE==='closed';
const mode=process.env.CODI_SPLINE_MODE==='cv'||closed?'BSplineCVTool':'BSplineInterpolateTool';
if(![base,cdp].every(u=>['127.0.0.1','localhost','[::1]'].includes(u.hostname)))throw Error('Loopback only');
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:120000}),context=await browser.createBrowserContext();try{
 const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base).href);await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});
 await page.addScriptTag({url:new URL('static/webosTest.bundle.js',base).href});
 await page.evaluate(async mode=>{window.Cypress={$:s=>{const a=[...document.querySelectorAll(s)];a.index=n=>a.indexOf(n);return a}};
  const ui=webosTest.modellerUISubject(__CAD_APP);window.testUI=ui;[window.testSketch,window.testFace]=await webosTest.createPlaneAndOpenSketcher(ui);
  window.testContext=__CAD_APP.services.sketcher.inPlaceEditor.sketcherAppContext;window.testViewer=testSketch.viewer;
  testContext.actions[mode].invoke(testContext);
 },mode);
 const box=await page.evaluate(()=>{const r=testViewer.canvas.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};});
 for(const [x,y] of [[.52,.3],[.60,.35],[.7,.27],[.8,.34]]){await page.mouse.move(box.x+x*box.w,box.y+y*box.h);await page.mouse.click(box.x+x*box.w,box.y+y*box.h);}
 if(closed){await page.mouse.move(box.x+.52*box.w,box.y+.30*box.h);await page.mouse.click(box.x+.52*box.w,box.y+.30*box.h,{clickCount:2});}
 else await page.mouse.click(box.x+.85*box.w,box.y+.32*box.h,{clickCount:2});
 if(closed)assert.equal(await page.evaluate(()=>testViewer.activeLayer.objects.some(o=>o.TYPE==='BSpline'&&o.type==='Closed')),true,'a closed CV spline was actually created');
 const result=await page.evaluate(async()=>{
  const segment=testSketch.addSegment(-100,-60,100,-30),action=testContext.actions.SignedDistanceX;
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  const current=await action.inspect(testContext);testViewer.refresh();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  let afterRedraw;try{afterRedraw=await action.invokeByIds(testContext,[segment.a.id,segment.b.id],100,current.revision,{valid:()=>true});}catch(e){afterRedraw={error:e.message};}
  const stale=await action.inspect(testContext);segment.params.t.set(segment.params.t.get()+1);segment.params.t.set(segment.params.t.get()-1);
  let abaRefused=false;try{await action.invokeByIds(testContext,[segment.a.id,segment.b.id],120,stale.revision,{valid:()=>true});}catch(_){abaRefused=true;}
  return {afterRedraw,abaRefused};
 });
 assert.equal(result.afterRedraw.status,'accepted',JSON.stringify(result.afterRedraw));assert.equal(result.abaRefused,true);assert.deepEqual(errors,[]);
 if(closed){
  const beforeDrag=await page.evaluate(()=>{const curve=testViewer.activeLayer.objects.find(o=>o.TYPE==='BSpline'&&o.type==='Closed'),p=curve.closedBasePoints[1];const screen=testViewer.screenToModelMatrix.invert().apply3([p.x,p.y,0]),r=testViewer.canvas.getBoundingClientRect();return {x:r.x+screen[0]/testViewer.retinaPxielRatio,y:r.y+(testViewer.canvas.height-screen[1])/testViewer.retinaPxielRatio,data:curve.write()};});
  await page.mouse.move(beforeDrag.x,beforeDrag.y);await page.mouse.down();await page.mouse.move(beforeDrag.x+18,beforeDrag.y+12,{steps:5});await page.mouse.up();
  const afterDrag=await page.evaluate(()=>testViewer.activeLayer.objects.find(o=>o.TYPE==='BSpline'&&o.type==='Closed').write());
  assert.notDeepEqual(afterDrag.closedBasePoints.map(p=>[p.x,p.y]),beforeDrag.data.closedBasePoints.map(p=>[p.x,p.y]),'real drag did not move the authored base');
  assert.deepEqual(afterDrag.cPoints.map(p=>p.id),beforeDrag.data.cPoints.map(p=>p.id),'derived identities changed on a geometry edit');
  assert.deepEqual(afterDrag.kValues,beforeDrag.data.kValues,'geometry drag changed periodic knots');
  const history=await page.evaluate(()=>{const h=testViewer.historyManager,before=testViewer.io.serializeSketch(undefined,{strict:true});h.undo();const undone=testViewer.io.serializeSketch(undefined,{strict:true});h.redo();return {before,undone,redone:testViewer.io.serializeSketch(undefined,{strict:true})};});
  assert.notEqual(history.undone,history.before,'closed spline drag did not undo');assert.equal(history.redone,history.before,'closed spline drag did not redo exactly');
  const baseId=await page.evaluate(()=>{const curve=testViewer.activeLayer.objects.find(o=>o.TYPE==='BSpline'&&o.type==='Closed'),point=curve.closedBasePoints[0];testContext.actions.Lock.invoke(testContext,[point]);return point.id;});
  await page.waitForFunction(()=>document.body.innerText.includes('APPLY'));
  await page.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='APPLY').click());
  await page.waitForFunction(id=>testViewer.parametricManager.stage.algNumSystem.allConstraints.some(c=>c.schema.id==='LockPoint'&&c.objects[0].id===id),{},baseId);
  const original=await page.evaluate(()=>({id:testFace.id,data:JSON.parse(testViewer.io.serializeSketch(undefined,{strict:true})).objects.find(o=>o.type==='BSpline').data}));
  await page.evaluate(async ()=>await testUI.commitSketch());const saved=await page.evaluate(()=>__CAD_APP.projectManager.snapshotCurrentProject());
  const fresh=await context.newPage();await fresh.goto(new URL('index-webos.html?DEFAULT&webos=1',base).href);
  await fresh.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});
  await fresh.evaluate(snapshot=>__CAD_APP.projectManager.restoreSnapshotInEmptyWorkspace(JSON.stringify(snapshot)),saved);
  await fresh.addScriptTag({url:new URL('static/webosTest.bundle.js',base).href});
  const reopened=await fresh.evaluate(async ({id,baseId})=>{
   window.Cypress={$:s=>{const a=[...document.querySelectorAll(s)];a.index=n=>a.indexOf(n);return a}};
   const c=__CAD_APP,face=c.cadRegistry.findFace(id);if(!face)throw Error('Saved sketch face missing');
   c.services.marker.clear();c.services.marker.markExclusively(face.TYPE,face.id);
   const ui=webosTest.modellerUISubject(c);ui.openSketcher();const v=c.services.sketcher.inPlaceEditor.viewer;
   v.refresh();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
   const model=JSON.parse(v.io.serializeSketch(undefined,{strict:true}));
   return {data:model.objects.find(o=>o.type==='BSpline').data,hasBaseConstraint:model.stages.some(stage=>stage.constraints.some(c=>c.typeId==='LockPoint'&&c.objects.includes(baseId)))};
  },{id:original.id,baseId});
  assert.deepEqual(reopened.data,original.data,'closed spline data and derived IDs changed after native save/reopen/redraw');
  assert.equal(reopened.hasBaseConstraint,true,'authored base-point constraint did not survive replay');
 }
 console.log(closed?'PASS closed CV redraw, base drag, undo/redo, native reopen and retained base constraint':`PASS ${mode} redraw permits current command; hidden polar ABA is rejected`);
}finally{await context.close();browser.disconnect();}})().catch(error=>{console.error(error.stack);process.exitCode=1});
