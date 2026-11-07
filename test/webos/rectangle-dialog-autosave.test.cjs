// Actual desktop app dialog with an in-memory test host; no signed server.
const assert=require('node:assert/strict'),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_HOST_URL),cdp=new URL(process.env.CODI_TEST_CDP);
for(const u of [base,cdp])if(!['127.0.0.1','localhost','[::1]'].includes(u.hostname))throw Error('Loopback only');
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:120000}),context=await browser.createBrowserContext();try{
 const page=await context.newPage();await page.goto(base.href);await page.waitForFunction('window.launch');await page.evaluate(()=>launch());
 await page.waitForFunction(()=>document.querySelector('.app-status')?.textContent.startsWith('New model.'),{timeout:90000});
 const frame=await(await page.$('.jsketcher-app iframe')).contentFrame();
 const cap=await page.evaluate(()=>registry.execute({windowId:'w0',command:'inspect-rectangle-creation',args:{}}));
 await page.evaluate(args=>registry.execute({windowId:'w0',command:'create-rectangle-sketch',args}),{revision:cap.revision,unit:'millimeter',origin:[10,20],width:100,height:50,depth:7});
 const open=async()=>{
  await frame.evaluate(()=>document.querySelector('[data-action-id="menu.craft"]').click());
  await frame.waitForFunction(()=>/Edit rectangle dimensions/i.test(document.body.innerText));
  await frame.evaluate(()=>[...document.querySelectorAll('*')].find(e=>e.children.length===0&&/^Edit rectangle dimensions$/i.test(e.textContent.trim())).click());
  await page.waitForSelector('dialog.jsketcher-rectangle-dialog[open]');
 };
 const cancel=()=>page.evaluate(()=>[...document.querySelectorAll('dialog button')].find(b=>b.textContent==='Cancel').click());
 await open();
 const initial=await frame.evaluate(()=>({storage:__CAD_APP.storageService.revision,revision:__CAD_APP.craftService.inspectRectangleDimensions().revision}));
 for(let i=0;i<2;i++){
  await frame.evaluate(()=>__CAD_APP.projectService.scheduleSave());
  await new Promise(r=>setTimeout(r,2300));
 }
 const later=await frame.evaluate(()=>({storage:__CAD_APP.storageService.revision,revision:__CAD_APP.craftService.inspectRectangleDimensions().revision}));
 assert.ok(later.storage>=initial.storage+2,'two scheduled project autosaves must actually write');
 assert.equal(later.revision,initial.revision,'project cache autosaves changed the authored token');
 for(const [name,value] of [['width','120'],['height','45']]){const input=await page.$(`dialog input[name=${name}]`);await input.click({clickCount:3});await input.press('Backspace');await input.type(value)}
 await page.click('dialog button[type=submit]');
 await page.waitForFunction(()=>!document.querySelector('dialog.jsketcher-rectangle-dialog'),{timeout:90000});
 const edited=await page.evaluate(()=>registry.execute({windowId:'w0',command:'inspect-rectangle-dimensions',args:{}}));
 assert.equal(edited.candidates[0].width,120);assert.equal(edited.candidates[0].height,45);
 const faceId=edited.candidates[0].faceId;
 for(const mode of ['same-byte','aba']){
  await open();
  await frame.evaluate(({faceId,mode})=>{const s=__CAD_APP.sketchStorageService,data=s.getSketchData(faceId);if(mode==='aba')s.removeSketchData(faceId);s.setSketchData(faceId,data)},{faceId,mode});
  await page.$eval('dialog input[name=width]',e=>e.value='130');await page.click('dialog button[type=submit]');
  await page.waitForFunction(()=>document.querySelector('dialog [role=alert]')?.textContent.length>0,{timeout:30000});
  const unchanged=await page.evaluate(()=>registry.execute({windowId:'w0',command:'inspect-rectangle-dimensions',args:{}}));
  assert.equal(unchanged.candidates[0].width,120,`${mode} stale dialog changed the sketch`);
  await cancel();
 }
 console.log('PASS real rectangle dialog survives two autosaves; same-byte rewrite and ABA reject stale token');
}finally{await context.close();browser.disconnect()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
