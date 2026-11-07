// Loopback-only rendered command, project persistence and old-reader check.
const assert=require('node:assert/strict');
const puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const newer=new URL(process.env.JSKETCHER_TEST_URL||'http://127.0.0.1:19332/');
const older=new URL(process.env.JSKETCHER_OLD_URL||'http://127.0.0.1:19333/');
const cdp=new URL(process.env.CODI_TEST_CDP||'http://127.0.0.1:19331');
for(const u of [newer,older,cdp])if(!['127.0.0.1','localhost','[::1]'].includes(u.hostname))throw Error('Loopback only');
async function open(page,base){await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base).href,{waitUntil:'domcontentloaded'});await page.waitForFunction('window.__CAD_APP?.streams?.lifecycle?.projectLoaded?.value === true',{timeout:90000});}
async function helper(page,base){await page.addScriptTag({url:new URL('static/webosTest.bundle.js',base).href});await page.evaluate(()=>{window.Cypress={$:s=>{const a=[...document.querySelectorAll(s)];a.index=n=>a.indexOf(n);return a}};window.ui=webosTest.modellerUISubject(__CAD_APP)});}
async function applyLock(page,x,y){
 await page.evaluate(()=>{const ctx=__CAD_APP.services.sketcher.inPlaceEditor.sketcherAppContext;ctx.actions.Lock.invoke(ctx,[window.point])});
 await page.waitForFunction(()=>document.body.innerText.includes('LOCK POINT'));
 const inputs=await page.$$('input[type=text]');assert.equal(inputs.length,2);
 for(const [field,value] of inputs.map((v,i)=>[v,[x,y][i]])){await field.click({clickCount:3});await field.press('Backspace');await field.type(String(value));}
 const clicked=await page.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='APPLY');if(!b)return false;b.click();return true});assert.ok(clicked);
 await page.waitForFunction(()=>!document.body.innerText.includes('LOCK POINT'));
}
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:120000}),context=await browser.createBrowserContext();try{
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await open(page,newer);await helper(page,newer);
 await page.evaluate(async()=>{const [sketch]=await webosTest.createPlaneAndOpenSketcher(ui);const line=sketch.addSegment(-100,0,100,0);window.point=line.a;window.viewer=__CAD_APP.services.sketcher.inPlaceEditor.viewer});
 await applyLock(page,-100,0);await applyLock(page,50,20);
 const before=await page.evaluate(()=>{const s=viewer.parametricManager.stage.algNumSystem;return {x:point.x,y:point.y,status:s.allConstraints.filter(c=>c.schema.id==='LockPoint').map(c=>({id:c.schema.id,conflicting:s.isConflicting(c),hint:c.admissionHint,linked:point.constraints.has(c)}))}});
 assert.equal(before.x,-100);assert.equal(before.y,0);assert.deepEqual(before.status.map(s=>s.conflicting),[false,true]);assert.ok(before.status.every(s=>s.linked));
 await page.evaluate(async ()=>await ui.commitSketch());await page.waitForFunction(()=>!__CAD_APP.services.sketcher.inPlaceEditor.inEditMode,{timeout:30000});
 const envelope=await page.evaluate(()=>__CAD_APP.projectManager.snapshotCurrentProject());assert.equal(envelope.format,'codi-jsketcher-project');assert.equal(envelope.version,2);assert.equal(envelope.unit,'millimeter');assert.equal(Object.hasOwn(envelope,'model'),false);
 assert.equal(await page.evaluate(()=>__CAD_APP.projectManager.unit),'millimeter');
 assert.deepEqual(await page.evaluate(()=>__CAD_APP.projectManager.snapshotForHostSave()),envelope);
 const row=envelope.project.sketches[0].data.stages[0].constraints.filter(c=>c.typeId==='LockPoint');assert.deepEqual(row.map(c=>c.admission.state),['accepted','rejected']);
 const malformed=structuredClone(envelope);malformed.project.sketches[0].data.stages[0].constraints.find(c=>c.typeId==='LockPoint').objects[0]='missing-reference';
 const invalidPage=await context.newPage();await open(invalidPage,newer);
 const invalid=await invalidPage.evaluate(async e=>{const before=JSON.stringify(__CAD_APP.projectManager.snapshotCurrentProject());try{await __CAD_APP.projectManager.restoreSnapshotInEmptyWorkspace(JSON.stringify(e));return {error:'',unchanged:before===JSON.stringify(__CAD_APP.projectManager.snapshotCurrentProject())}}catch(err){return {error:String(err),unchanged:before===JSON.stringify(__CAD_APP.projectManager.snapshotCurrentProject())}}},malformed);
 assert.match(invalid.error,/reference/i);assert.equal(invalid.unchanged,true,'bad unopened sketch is rejected before workspace import');
 const invalidWorker=await invalidPage.evaluate(async e=>{const before=JSON.stringify(__CAD_APP.projectManager.snapshotCurrentProject());try{await __CAD_APP.projectManager.restoreSnapshotBytesInEmptyWorkspace(new Blob([JSON.stringify(e)]));return {error:'',unchanged:before===JSON.stringify(__CAD_APP.projectManager.snapshotCurrentProject())}}catch(err){return {error:String(err),unchanged:before===JSON.stringify(__CAD_APP.projectManager.snapshotCurrentProject())}}},malformed);
 assert.match(invalidWorker.error,/reference/i);assert.equal(invalidWorker.unchanged,true,'worker rejects invalid references before import');
 const overflow=await invalidPage.evaluate(async e=>{const before=JSON.stringify(__CAD_APP.projectManager.snapshotCurrentProject()),bad=structuredClone(e);bad.project.model.history[0].params.testOverflow='OVERFLOW_NUMBER';const json=JSON.stringify(bad).replace('"OVERFLOW_NUMBER"','1e309');try{await __CAD_APP.projectManager.restoreSnapshotBytesInEmptyWorkspace(new Blob([json]));return {error:'',unchanged:false}}catch(err){return {error:String(err),unchanged:before===JSON.stringify(__CAD_APP.projectManager.snapshotCurrentProject())}}},envelope);
 assert.match(overflow.error,/non-finite/i);assert.equal(overflow.unchanged,true,'non-finite operation values fail before import');
 const aborted=await invalidPage.evaluate(async e=>{const controller=new AbortController();controller.abort();try{await __CAD_APP.projectManager.restoreSnapshotBytesInEmptyWorkspace(new Blob([JSON.stringify(e)]),{signal:controller.signal});return ''}catch(err){return err.name}},envelope);assert.equal(aborted,'AbortError');
 const invalidSession=await invalidPage.evaluate(async e=>{try{await __CAD_APP.projectManager.restoreSnapshotBytesInEmptyWorkspace(new Blob([JSON.stringify(e)]),{valid:()=>false});return ''}catch(err){return err.name}},envelope);assert.equal(invalidSession,'AbortError');
 const host=await context.newPage();await open(host,newer);
 await host.evaluate(url=>{const f=document.createElement('iframe');f.id='cad-child';f.src=new URL('index-webos.html?DEFAULT&webos=1',url).href;document.body.appendChild(f)},newer.href);
 await host.waitForFunction(()=>document.querySelector('#cad-child')?.contentWindow?.__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true,{timeout:90000});
 const crossRealm=await host.evaluate(async e=>{const child=document.querySelector('#cad-child').contentWindow;const blob=new Blob([JSON.stringify(e)]);await child.__CAD_APP.projectManager.restoreSnapshotBytesInEmptyWorkspace(blob);return {differentRealm:!(blob instanceof child.Blob),format:child.__CAD_APP.projectManager.snapshotCurrentProject().format}},envelope);
 assert.deepEqual(crossRealm,{differentRealm:true,format:'codi-jsketcher-project'},'parent Blob loads in iframe');
 for(const mode of ['signal','session']){
  const cancelContext=await browser.createBrowserContext(),cancelPage=await cancelContext.newPage();await open(cancelPage,newer);
  const result=await cancelPage.evaluate(async ({e,mode})=>{
   const Native=window.Worker;let started=0,terminated=0,valid=true;const controller=new AbortController(),before=JSON.stringify(__CAD_APP.projectManager.snapshotCurrentProject());
   window.Worker=class extends Native {constructor(...a){super(...a);started++;this.addEventListener('message',event=>{if(event.data?.progress==='started'){if(mode==='signal')controller.abort();else valid=false}})}terminate(){terminated++;return super.terminate()}};
   try{const chunk=' '.repeat(1024*1024),blob=new Blob([JSON.stringify(e),...Array(32).fill(chunk)]);
    try{await __CAD_APP.projectManager.restoreSnapshotBytesInEmptyWorkspace(blob,{signal:controller.signal,valid:()=>valid});return {error:'',started,terminated}}catch(err){return {error:err.name,started,terminated,unchanged:before===JSON.stringify(__CAD_APP.projectManager.snapshotCurrentProject())}}
   }finally{window.Worker=Native}
  },{e:envelope,mode});
  await cancelContext.close();
  assert.deepEqual(result,{error:'AbortError',started:1,terminated:1,unchanged:true},`${mode} cancels an active validation worker`);
 }
 const old=await context.newPage();await open(old,older);const oldResult=await old.evaluate(async e=>{let before=JSON.stringify(__CAD_APP.projectManager.snapshotCurrentProject());try{await __CAD_APP.projectManager.restoreSnapshotInEmptyWorkspace(JSON.stringify(e));return {error:'',unchanged:before===JSON.stringify(__CAD_APP.projectManager.snapshotCurrentProject())}}catch(err){return {error:String(err),unchanged:before===JSON.stringify(__CAD_APP.projectManager.snapshotCurrentProject())}}},envelope);
 assert.ok(oldResult.error,'old guarded reader rejected revision 2');assert.equal(oldResult.unchanged,true);
 const page2=await context.newPage();page2.on('pageerror',e=>errors.push(e.message));await open(page2,newer);await helper(page2,newer);await page2.evaluate(e=>__CAD_APP.projectManager.restoreSnapshotBytesInEmptyWorkspace(new Blob([JSON.stringify(e)])),envelope);
 await page2.evaluate(()=>{ui.selectFaces([0,0,-10],[0,0,10]);window.sketch=ui.openSketcher();window.viewer=__CAD_APP.services.sketcher.inPlaceEditor.viewer});
 const restored=await page2.evaluate(()=>{const s=viewer.parametricManager.stage.algNumSystem;const c=s.allConstraints.filter(c=>c.schema.id==='LockPoint');window.point=c[0].objects[0];return {x:point.x,y:point.y,status:c.map(x=>({conflicting:s.isConflicting(x),linked:point.constraints.has(x)}))}});
 assert.equal(restored.x,-100);assert.equal(restored.y,0);assert.deepEqual(restored.status.map(s=>s.conflicting),[false,true]);assert.ok(restored.status.every(s=>s.linked));
 const recovered=await page2.evaluate(()=>{const pm=viewer.parametricManager,s=pm.stage.algNumSystem,c=s.allConstraints.filter(c=>c.schema.id==='LockPoint');pm.remove(c[0]);return {x:point.x,y:point.y,conflicting:s.isConflicting(c[1]),linked:point.constraints.has(c[1])}});
 assert.equal(recovered.x,50);assert.equal(recovered.y,20);assert.equal(recovered.conflicting,false);assert.equal(recovered.linked,true);
 const dragged=await page2.evaluate(()=>{const pm=viewer.parametricManager,s=pm.stage.algNumSystem,c=s.allConstraints.find(c=>c.schema.id==='LockPoint');pm.remove(c);viewer.deselectAll();sketch.move(50,20,60,30);return {x:point.x,y:point.y}});
 assert.ok(Math.abs(dragged.x-60)<1e-6&&Math.abs(dragged.y-30)<1e-6,'real drag tool moves the released point');assert.deepEqual(errors,[]);
 console.log('PASS rendered constraint dialogs, conflicting lock, native project roundtrip, old guarded-reader refusal and constraint recovery');
 }finally{await context.close();browser.disconnect()}})().catch(e=>{console.error(e);process.exitCode=1});
