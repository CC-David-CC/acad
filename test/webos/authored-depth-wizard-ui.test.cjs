// Programmatic feature setup and timeline selection; actual wizard input/click.
const assert=require('node:assert/strict'),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);
for(const u of [base,cdp])if(!['127.0.0.1','localhost','[::1]'].includes(u.hostname))throw Error('Loopback only');
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:120000}),context=await browser.createBrowserContext();try{
 const page=await context.newPage();await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base));
 await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});
 await page.evaluate(async()=>{
  const c=__CAD_APP,controller=new AbortController();c.projectService.bindHostLifetime({signal:controller.signal,valid:()=>true});
  const item=await c.craftService.createRectangleSketch({revision:c.craftService.inspectRectangleCreation().revision,unit:'millimeter',origin:[0,0],width:100,height:50,depth:0});
  const face=c.cadRegistry.findFace(item.faceId),region=face.sketchRegions[0];
  await new Promise((ok,no)=>c.craftService.modify({type:'WORKER_RECTANGLE_EXTRUDE_V1',params:{featureId:2,face:face.id,regions:[region.id],length:20}},ok,no));
  c.craftService.historyTravel.setPointer(0);
 });
 await page.waitForFunction("__CAD_APP.wizardService.workingRequest?.type==='WORKER_RECTANGLE_EXTRUDE_V1'&&!__CAD_APP.craftService.isProcessing",{timeout:60000});
 const wizard=await page.waitForSelector('[data-operation-id="WORKER_RECTANGLE_EXTRUDE_V1"]',{timeout:10000});
 const input=await wizard.$('input:not([type="checkbox"])');if(!input)throw Error('Depth input missing');
 await input.click({clickCount:3});await input.press('Backspace');await input.type('35');
 const ok=await wizard.$('button.dialog-ok');if(!ok)throw Error('Wizard OK button missing');await ok.click();
 await page.waitForFunction('__CAD_APP.craftService.modifications$.value.pointer===1&&__CAD_APP.craftService.modifications$.value.history[1].params.length===35&&!__CAD_APP.craftService.isProcessing',{timeout:90000});
 const depths=await page.evaluate(async()=>{const c=__CAD_APP,inspect=()=>c.craftService.inspectAuthoredEdits();await c.craftService.authoredEditTravel({revision:inspect().revision,direction:'undo'});const undo=c.craftService.modifications$.value.history[1].params.length;await c.craftService.authoredEditTravel({revision:inspect().revision,direction:'redo'});return [undo,c.craftService.modifications$.value.history[1].params.length]});
 assert.deepEqual(depths,[20,35]);console.log('PASS typed wizard depth and actual OK click with authored undo/redo');
}finally{await context.close();browser.disconnect()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
