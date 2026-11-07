const assert=require('node:assert/strict'),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);if(![base,cdp].every(u=>['127.0.0.1','localhost','[::1]'].includes(u.hostname)))throw Error('Loopback only');
(async()=>{const b=await puppeteer.connect({browserURL:cdp.href}),context=await b.createBrowserContext();try{
 const page=await context.newPage();await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base).href);await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});await page.addScriptTag({url:new URL('static/webosTest.bundle.js',base).href});
 await page.evaluate(async()=>{
  window.Cypress={$:s=>{const a=[...document.querySelectorAll(s)];a.index=n=>a.indexOf(n);return a}};
  const ui=webosTest.modellerUISubject(__CAD_APP);[window.sketch]=await webosTest.createPlaneAndOpenSketcher(ui);
  window.ctx=__CAD_APP.services.sketcher.inPlaceEditor.sketcherAppContext;window.v=sketch.viewer;
  const pts=[[-60,-40],[60,-40],[60,-20],[-40,-20],[-40,40],[-60,40],[-60,-40]];
  window.lines=pts.slice(0,-1).map((p,i)=>sketch.addSegment(...p,...pts[i+1]));
  ctx.actions.Horizontal.invoke(ctx,[lines[0]]);ctx.actions.Lock.invoke(ctx,[lines[0].a]);
 });
 await page.waitForFunction(()=>document.body.innerText.includes('APPLY'));await page.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='APPLY').click());await page.waitForFunction(()=>!document.body.innerText.includes('APPLY'));
 await page.evaluate(()=>{sketch.select(lines);ctx.actions.CreateRigidGroupGlobal.invoke(ctx)});await page.waitForFunction(()=>v.parametricManager.stage.algNumSystem.allConstraints.some(c=>c.schema.id==='RigidGroup'));
 const beforeDelete=await page.evaluate(()=>{sketch.select([lines[0]]);v.canvas.focus();const h=v.historyManager;return {sketch:v.io.serializeSketch(undefined,{strict:true}),history:JSON.stringify([h.diffs,h.historyPointer,h.lastCheckpoint,h._counter])};});
 await page.keyboard.press('Delete');
 await page.waitForFunction(()=>/dissolve the rigid group/i.test(document.body.innerText),{timeout:5000});
 const afterDelete=await page.evaluate(()=>{const h=v.historyManager;return {sketch:v.io.serializeSketch(undefined,{strict:true}),history:JSON.stringify([h.diffs,h.historyPointer,h.lastCheckpoint,h._counter]),text:document.body.innerText};});
 assert.equal(afterDelete.sketch,beforeDelete.sketch);assert.equal(afterDelete.history,beforeDelete.history);assert.match(afterDelete.text,/dissolve the rigid group/i);
 const result=await page.evaluate(async()=>{
  const relation=v.parametricManager.stage.algNumSystem.allConstraints.find(c=>c.schema.id==='RigidGroup'),group=relation.objects[0],before=v.io.serializeSketch(undefined,{strict:true}),view=ctx.actions.PoseRigidGroup.inspect(ctx);
  let rejected=false,message='';try{await ctx.actions.PoseRigidGroup.invokeById(ctx,group.id,view.revision,{x:group.tx.get()+10,y:group.ty.get(),angle:group.angle.get()});}catch(e){rejected=true;message=e.message;}
  return {rejected,message,before,after:v.io.serializeSketch(undefined,{strict:true}),memberIds:relation.objects.slice(1).map(o=>o.id)};
 });assert.equal(result.rejected,true);assert.equal(result.after,result.before);assert.equal(result.memberIds.length,6);
 await page.evaluate(()=>{const relation=v.parametricManager.stage.algNumSystem.allConstraints.find(c=>c.schema.id==='RigidGroup');sketch.select([relation.objects[1]]);ctx.actions.DissolveRigidGroupGlobal.invoke(ctx);});
 await page.waitForFunction(()=>!v.parametricManager.stage.algNumSystem.allConstraints.some(c=>c.schema.id==='RigidGroup'));
 const history=await page.evaluate(()=>{const after=v.io.serializeSketch(undefined,{strict:true}),h=v.historyManager;h.undo();const undo=v.io.serializeSketch(undefined,{strict:true});h.redo();return {after,undo,redo:v.io.serializeSketch(undefined,{strict:true}),ids:v.parametricManager.stage.algNumSystem.allConstraints.map(c=>c.schema.id)};});
 assert.equal(history.undo,result.before);assert.equal(history.redo,history.after);assert.ok(history.ids.includes('Horizontal')&&history.ids.includes('LockPoint'));console.log('PASS mounted L-profile: locked/horizontal constraints reject pose atomically; selected dissolve and undo/redo preserve geometry and constraints');
}finally{await context.close();b.disconnect();}})().catch(error=>{console.error(error.stack);process.exitCode=1});
