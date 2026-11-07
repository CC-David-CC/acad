// Full sketcher selected-action and native workspace controls, loopback only.
const assert=require('node:assert/strict'),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);
if(![base,cdp].every(u=>['127.0.0.1','localhost','[::1]'].includes(u.hostname)))throw Error('Loopback only');
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:120000});try{
 for(const type of ['Segment','Circle','Arc']){
  const context=await browser.createBrowserContext();try{
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base).href);await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});
   await page.addScriptTag({url:new URL('static/webosTest.bundle.js',base).href});
   const initial=await page.evaluate(async type=>{
    window.Cypress={$:s=>{const a=[...document.querySelectorAll(s)];a.index=n=>a.indexOf(n);return a}};
    window.testUI=webosTest.modellerUISubject(__CAD_APP);[window.testSketch]=await webosTest.createPlaneAndOpenSketcher(testUI);
    window.testContext=__CAD_APP.services.sketcher.inPlaceEditor.sketcherAppContext;window.testViewer=testSketch.viewer;
    window.shape=type==='Segment'?testSketch.addSegment(-80,0,80,20):type==='Circle'?testSketch.addCircle(80,40,30):testSketch.addArc(80,40,110,40,80,70);
    const before=testViewer.io.serializeSketch(undefined,{strict:true});testSketch.select([shape]);testContext.actions.FixEntityGlobal.invoke(testContext);return before;
   },type);
   await page.waitForFunction(type=>testViewer.parametricManager.stage.algNumSystem.allConstraints.some(c=>c.schema.id==='Fix'+type),{},type);
   const actual=await page.evaluate(type=>{
    const c=testViewer.parametricManager.stage.algNumSystem.allConstraints.find(c=>c.schema.id==='Fix'+type),h=testViewer.historyManager;
    const after=testViewer.io.serializeSketch(undefined,{strict:true}),constants={...c.constants},objectId=c.objects[0].id;
    h.undo();const undone=testViewer.io.serializeSketch(undefined,{strict:true});h.redo();return {after,undone,redone:testViewer.io.serializeSketch(undefined,{strict:true}),constants,objectId};
   },type);
   assert.equal(actual.undone,initial);assert.equal(actual.redone,actual.after);assert.ok(actual.objectId);assert.deepEqual(errors,[]);
   if(type==='Segment')assert.ok(Number(actual.constants.length)>0&&Number.isFinite(Number(actual.constants.direction)));
   if(type==='Circle')assert.ok(Number(actual.constants.radius)>0);
   if(type==='Arc')assert.ok(Number(actual.constants.radius)>0&&Number(actual.constants.sweep)>0);
   const drag=await page.evaluate(({type,id})=>{
    let object;testViewer.traverse(o=>{if(o.id===id)object=o});
    if(!object)throw Error('Fixed object missing after redo');
    const point=type==='Segment'?object.b:type==='Circle'?object.c:object.a;
    const position=testViewer.screenToModelMatrix.invert().apply3([point.x,point.y,0]),rect=testViewer.canvas.getBoundingClientRect();
    return {x:rect.x+position[0]/testViewer.retinaPxielRatio,y:rect.y+(testViewer.canvas.height-position[1])/testViewer.retinaPxielRatio,before:JSON.stringify(object.write()),id,pointId:point.id};
   },{type,id:actual.objectId});
   await page.mouse.move(drag.x,drag.y);await new Promise(resolve=>setTimeout(resolve,100));await page.mouse.down();
   const selection=await page.evaluate(()=>({tool:testViewer.toolManager.tool?.name,selected:testViewer.selected.map(o=>o.id)}));
   assert.equal(selection.tool,'drag');assert.ok(selection.selected.includes(drag.pointId),`pointer must select fixed point ${drag.pointId}; selected ${selection.selected.join(',')}`);
   await page.mouse.move(drag.x+20,drag.y+15,{steps:5});await page.mouse.up();
   const dragged=await page.evaluate(id=>{let object;testViewer.traverse(o=>{if(o.id===id)object=o});return JSON.stringify(object.write());},drag.id);
   assert.equal(dragged,drag.before,`${type} fixed geometry changed during pointer drag`);
   await page.evaluate(async ()=>await testUI.commitSketch());const saved=await page.evaluate(()=>__CAD_APP.projectManager.snapshotCurrentProject());
   const fresh=await context.newPage();await fresh.goto(new URL('index-webos.html?DEFAULT&webos=1',base).href);await fresh.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});
   await fresh.evaluate(snapshot=>__CAD_APP.projectManager.restoreSnapshotInEmptyWorkspace(JSON.stringify(snapshot)),saved);
   const restored=await fresh.evaluate(()=>__CAD_APP.projectManager.snapshotCurrentProject());assert.deepEqual(restored.project.sketches,saved.project.sketches);assert.ok(JSON.stringify(restored.project.sketches).includes('Fix'+type));
   console.log(`PASS ${type} selected fix, undo/redo and fresh native workspace replay`);
  }finally{await context.close();}
 }
 const context=await browser.createBrowserContext();try{
  const page=await context.newPage();await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base).href);await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});await page.addScriptTag({url:new URL('static/webosTest.bundle.js',base).href});
  const result=await page.evaluate(async()=>{
   window.Cypress={$:s=>{const a=[...document.querySelectorAll(s)];a.index=n=>a.indexOf(n);return a}};
   const ui=webosTest.modellerUISubject(__CAD_APP),[sketch]=await webosTest.createPlaneAndOpenSketcher(ui),ctx=__CAD_APP.services.sketcher.inPlaceEditor.sketcherAppContext;
   const s=sketch.addSegment(0,0,50,20),action=ctx.actions.FixEntity,first=await action.inspect(ctx),accepted=await action.invokeById(ctx,s.id,first.revision,{valid:()=>true});
   const second=await action.inspect(ctx),duplicate=await action.invokeById(ctx,s.id,second.revision,{valid:()=>true}),stale=await action.inspect(ctx);
   s.params.t.set(s.params.t.get()+1);s.params.t.set(s.params.t.get()-1);let refused=false;try{await action.invokeById(ctx,s.id,stale.revision,{valid:()=>true});}catch(_){refused=true;}
   const released=await action.inspect(ctx);action.releaseInspection(ctx,released.revision);let releasedRefused=false;try{await action.invokeById(ctx,s.id,released.revision,{valid:()=>true});}catch(_){releasedRefused=true;}
   return {accepted:accepted.status,duplicate:duplicate.status,refused,releasedRefused};
  });assert.deepEqual(result,{accepted:'accepted',duplicate:'redundant',refused:true,releasedRefused:true});console.log('PASS fixed-entity ID path, duplicate, ABA and explicit inspection disposal');
 }finally{await context.close();}
}finally{browser.disconnect();}})().catch(error=>{console.error(error.stack);process.exitCode=1});
