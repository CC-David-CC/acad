// Full sketcher selection actions and native workspace replay, loopback only.
const assert=require('node:assert/strict'),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);
if(![base,cdp].every(u=>['127.0.0.1','localhost','[::1]'].includes(u.hostname)))throw Error('Loopback only');
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:120000});try{
 for(const [action,type] of [['CollinearGlobal','Collinear'],['AxisSymmetryGlobal','AxisSymmetry']]){
  const context=await browser.createBrowserContext();try{
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base).href);await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});
   await page.addScriptTag({url:new URL('static/webosTest.bundle.js',base).href});
   const initial=await page.evaluate(async({action,type})=>{
    window.Cypress={$:s=>{const a=[...document.querySelectorAll(s)];a.index=n=>a.indexOf(n);return a}};
    window.testUI=webosTest.modellerUISubject(__CAD_APP);[window.testSketch]=await webosTest.createPlaneAndOpenSketcher(testUI);
    window.testContext=__CAD_APP.services.sketcher.inPlaceEditor.sketcherAppContext;window.testViewer=testSketch.viewer;
    const first=testSketch.addSegment(-80,0,80,0),second=testSketch.addSegment(-25,35,45,55);
    window.testObjects={first,second};testSketch.select(type==='Collinear'?[first,second]:[second.a,second.b,first]);
    const before=testViewer.io.serializeSketch(undefined,{strict:true});testContext.actions[action].invoke(testContext);return before;
   },{action,type});
   await page.waitForFunction(type=>testViewer.parametricManager.stage.algNumSystem.allConstraints.some(c=>c.schema.id===type),{},type);
   const actual=await page.evaluate(type=>{
    const c=testViewer.parametricManager.stage.algNumSystem.allConstraints.find(c=>c.schema.id===type),eq=[];c.collectPolynomials(eq);
    const h=testViewer.historyManager,after=testViewer.io.serializeSketch(undefined,{strict:true});h.undo();const undone=testViewer.io.serializeSketch(undefined,{strict:true});h.redo();
    return {residuals:eq.map(e=>e.value()),after,undone,redone:testViewer.io.serializeSketch(undefined,{strict:true})};
   },type);
   assert.ok(actual.residuals.length===2&&actual.residuals.every(n=>Number.isFinite(n)&&Math.abs(n)<1e-6));
   assert.equal(actual.undone,initial);assert.equal(actual.redone,actual.after);assert.deepEqual(errors,[]);
   await page.evaluate(async ()=>await testUI.commitSketch());const saved=await page.evaluate(()=>__CAD_APP.projectManager.snapshotCurrentProject());
   const fresh=await context.newPage();await fresh.goto(new URL('index-webos.html?DEFAULT&webos=1',base).href);await fresh.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});
   await fresh.evaluate(snapshot=>__CAD_APP.projectManager.restoreSnapshotInEmptyWorkspace(JSON.stringify(snapshot)),saved);
   const restored=await fresh.evaluate(()=>__CAD_APP.projectManager.snapshotCurrentProject());assert.deepEqual(restored.project.sketches,saved.project.sketches);assert.ok(JSON.stringify(restored.project.sketches).includes(type));
   console.log(`PASS ${type} selected UI action, solver, undo/redo and fresh native workspace replay`);
  }finally{await context.close();}
 }
 const context=await browser.createBrowserContext();try{
  const page=await context.newPage();await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base).href);await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});await page.addScriptTag({url:new URL('static/webosTest.bundle.js',base).href});
  const result=await page.evaluate(async()=>{
   window.Cypress={$:s=>{const a=[...document.querySelectorAll(s)];a.index=n=>a.indexOf(n);return a}};
   const ui=webosTest.modellerUISubject(__CAD_APP),[sketch]=await webosTest.createPlaneAndOpenSketcher(ui),ctx=__CAD_APP.services.sketcher.inPlaceEditor.sketcherAppContext;
   const first=sketch.addSegment(-80,0,80,0),second=sketch.addSegment(-25,35,45,55),action=ctx.actions.Collinear;
   let inspected=await action.inspect(ctx);const accepted=await action.invokeByIds(ctx,[first.id,second.id],inspected.revision,{valid:()=>true});
   inspected=await action.inspect(ctx);const duplicate=await action.invokeByIds(ctx,[second.id,first.id],inspected.revision,{valid:()=>true});
   inspected=await action.inspect(ctx);first.params.t.set(first.params.t.get()+1);first.params.t.set(first.params.t.get()-1);let stale=false;
   try{await action.invokeByIds(ctx,[first.id,second.id],inspected.revision,{valid:()=>true});}catch(_){stale=true;}
   return {accepted:accepted.status,duplicate:duplicate.status,stale};
  });assert.deepEqual(result,{accepted:'accepted',duplicate:'redundant',stale:true});console.log('PASS ID path, duplicate no-op and hidden-parameter ABA refusal');
 }finally{await context.close();}
 for(const kind of ['Collinear','AxisSymmetry','ProjectedDistance']){
 const dragContext=await browser.createBrowserContext();try{
  const page=await dragContext.newPage();await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base).href);await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});await page.addScriptTag({url:new URL('static/webosTest.bundle.js',base).href});
  const coordinates=await page.evaluate(async kind=>{
   window.Cypress={$:s=>{const a=[...document.querySelectorAll(s)];a.index=n=>a.indexOf(n);return a}};
   const ui=webosTest.modellerUISubject(__CAD_APP);[window.sketch]=await webosTest.createPlaneAndOpenSketcher(ui);window.ctx=__CAD_APP.services.sketcher.inPlaceEditor.sketcherAppContext;window.v=sketch.viewer;
   window.axis=sketch.addSegment(-80,0,80,0);const points=sketch.addSegment(-25,35,45,55),action=ctx.actions[kind],inspection=await action.inspect(ctx);
   if(kind==='Collinear')await action.invokeByIds(ctx,[axis.id,points.id],inspection.revision,{valid:()=>true});
   else if(kind==='ProjectedDistance')await action.invokeByIds(ctx,[points.a.id,points.b.id,axis.id],70,inspection.revision,{valid:()=>true});
   else await action.invokeByIds(ctx,[points.a.id,points.b.id,axis.id],inspection.revision,{valid:()=>true});
   const screen=p=>{const s=v.screenToModelMatrix.invert().apply3([p.x,p.y,0]),r=v.canvas.getBoundingClientRect();return {x:r.x+s[0]/v.retinaPxielRatio,y:r.y+(v.canvas.height-s[1])/v.retinaPxielRatio};};return {a:screen(axis.a),b:screen(axis.b),ids:[axis.a.id,axis.b.id],before:[axis.a.x,axis.a.y,axis.b.x,axis.b.y]};
  },kind);
  await page.mouse.move(coordinates.b.x,coordinates.b.y);await new Promise(r=>setTimeout(r,100));const hit=await page.evaluate(({x,y})=>({element:document.elementFromPoint(x,y)?.tagName,tool:v.toolManager.tool?.name}),coordinates.b);await page.mouse.down();const during=await page.evaluate(()=>({tool:v.toolManager.tool?.name,selected:v.selected.map(o=>o.id)}));await page.mouse.move(coordinates.b.x-10,coordinates.b.y,{steps:2});const intermediate=await page.evaluate(()=>({status:v.parametricManager.stage.algNumSystem.solveStatus,coords:[axis.a.x,axis.a.y,axis.b.x,axis.b.y]}));await page.mouse.move(coordinates.a.x,coordinates.a.y,{steps:12});await page.mouse.up();
  const result=await page.evaluate(kind=>{const relation=v.parametricManager.stage.algNumSystem.allConstraints.find(c=>c.schema.id===kind),eq=[];relation.collectPolynomials(eq);return {length:Math.hypot(axis.b.x-axis.a.x,axis.b.y-axis.a.y),angle:axis.params.ang.get(),t:axis.params.t.get(),coords:[axis.a.x,axis.a.y,axis.b.x,axis.b.y],residuals:eq.map(e=>e.value())};},kind);
  assert.equal(during.tool,'drag');assert.ok(during.selected.includes(coordinates.ids[1]),'drag must select the intended axis endpoint');
  assert.notDeepEqual(result.coords,coordinates.before,`pointer drag did not move the axis: ${JSON.stringify({coordinates,hit,during,intermediate,result})}`);
  assert.ok(result.length>1e-9,'axis became degenerate after a real drag');assert.ok(result.residuals.every(n=>Number.isFinite(n)&&Math.abs(n)<1e-6));
  const tolerance=Math.max(1e-7,result.length*1e-8);
  assert.ok(Math.abs(result.coords[2]-result.coords[0]-result.t*Math.cos(result.angle))<=tolerance);
  assert.ok(Math.abs(result.coords[3]-result.coords[1]-result.t*Math.sin(result.angle))<=tolerance);
  console.log(`PASS real ${kind} direction drag moves and cannot leave the axis degenerate`);
 }finally{await dragContext.close();}
 }
 for(const kind of ['Collinear','AxisSymmetry']){
  const context=await browser.createBrowserContext();try{
   const page=await context.newPage();await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base).href);await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});await page.addScriptTag({url:new URL('static/webosTest.bundle.js',base).href});
   await page.evaluate(async()=>{
    window.Cypress={$:s=>{const a=[...document.querySelectorAll(s)];a.index=n=>a.indexOf(n);return a}};
    const ui=webosTest.modellerUISubject(__CAD_APP);[window.testSketch]=await webosTest.createPlaneAndOpenSketcher(ui);
    window.testContext=__CAD_APP.services.sketcher.inPlaceEditor.sketcherAppContext;window.testViewer=testSketch.viewer;
    window.first=testSketch.addSegment(-80,0,80,0);window.second=testSketch.addSegment(-25,35,45,55);
   });
   for(const name of ['first.a','first.b','second.a','second.b']){
    await page.evaluate(name=>{const [object,key]=name.split('.');testContext.actions.Lock.invoke(testContext,[window[object][key]]);},name);
    await page.waitForFunction(()=>document.body.innerText.includes('APPLY'));
    await page.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='APPLY').click());
    await page.waitForFunction(()=>!document.body.innerText.includes('APPLY'));
   }
   const result=await page.evaluate(kind=>{
    const h=testViewer.historyManager,snapshot=()=>testViewer.io.serializeSketch(undefined,{strict:true});
    const history=()=>JSON.stringify({diffs:h.diffs,pointer:h.historyPointer,last:h.lastCheckpoint,counter:h._counter});
    const before=snapshot(),prior=history();testContext.actions[kind].invoke(testContext,kind==='Collinear'?[first,second]:[second.a,second.b,first]);
    return {before,after:snapshot(),prior,history:history(),recovery:h.recoverySnapshot};
   },kind);
   assert.equal(result.after,result.before,`${kind} conflict changed sketch`);assert.equal(result.history,result.prior,`${kind} conflict changed history`);assert.equal(result.recovery,null);
   console.log(`PASS ${kind} contradictory fixed UI relation preserves geometry and history`);
  }finally{await context.close();}
 }
 const recoveryContext=await browser.createBrowserContext();try{
  const page=await recoveryContext.newPage();await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base).href);await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});await page.addScriptTag({url:new URL('static/webosTest.bundle.js',base).href});
  const result=await page.evaluate(async()=>{
   window.Cypress={$:s=>{const a=[...document.querySelectorAll(s)];a.index=n=>a.indexOf(n);return a}};
   const ui=webosTest.modellerUISubject(__CAD_APP),[sketch]=await webosTest.createPlaneAndOpenSketcher(ui),ctx=__CAD_APP.services.sketcher.inPlaceEditor.sketcherAppContext,v=sketch.viewer;
   const first=sketch.addSegment(-80,0,80,0),second=sketch.addSegment(-25,35,45,55),pm=v.parametricManager,system=pm.stage.algNumSystem;
   const before=v.io.serializeSketch(undefined,{strict:true}),originalFinish=pm.finishTransaction,originalRollback=system.rollbackTransaction;
   pm.finishTransaction=function(validate,refresh){return originalFinish.call(this,stages=>{validate(stages);throw Error('injected admission failure');},refresh);};
   system.rollbackTransaction=()=>{throw Error('injected rollback failure');};
   try{ctx.actions.Collinear.invoke(ctx,[first,second]);}finally{pm.finishTransaction=originalFinish;system.rollbackTransaction=originalRollback;}
   const pending=v.historyManager.recoverySnapshot===before;let refused=false;
   try{await ctx.actions.Collinear.inspect(ctx);}catch(_){refused=true;}
   const recovered=v.historyManager.recover();return {pending,refused,recovered,after:v.io.serializeSketch(undefined,{strict:true}),before};
  });
  assert.equal(result.pending,true);assert.equal(result.refused,true);assert.equal(result.recovered,true);assert.equal(result.after,result.before);
  console.log('PASS failed admission plus failed rollback requires and completes native sketch recovery');
 }finally{await recoveryContext.close();}
}finally{browser.disconnect();}})().catch(error=>{console.error(error.stack);process.exitCode=1});
