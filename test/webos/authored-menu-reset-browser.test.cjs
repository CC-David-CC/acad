// Reset a document synchronously from the new craft-update notification.
const assert=require('node:assert/strict');
const puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);
for(const url of [base,cdp])if(!['127.0.0.1','localhost','[::1]'].includes(url.hostname))throw Error('Loopback only');
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href}),context=await browser.createBrowserContext();try{
 const page=await context.newPage();await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base));
 await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});
 const result=await page.evaluate(async()=>{
  const c=__CAD_APP,controller=new AbortController();c.projectService.bindHostLifetime({signal:controller.signal,valid:()=>true});
  const call=req=>new Promise((resolve,reject)=>c.craftService.modify(req,resolve,reject));
  const wait=async()=>{const end=Date.now()+60000;while(c.craftService.isProcessing&&Date.now()<end)await new Promise(r=>setTimeout(r,10));if(c.craftService.isProcessing)throw Error('Processing did not drain')};
  await wait();let reset=false,resetError=null;
  c.streams.craft.update.attach(()=>{if(reset)return;reset=true;try{c.projectService.empty()}catch(e){resetError=String(e)}});
  let rejected=false;try{await call({type:'PLANE',params:{featureId:1}})}catch{rejected=true};await wait();
  const after={history:c.craftService.modifications$.value.history.length,models:c.craftService.models$.value.length,canUndo:c.craftService.inspectAuthoredEdits().canUndo,processing:c.craftService.isProcessing};
  const rect=await c.craftService.createRectangleSketch({revision:c.craftService.inspectRectangleCreation().revision,unit:'millimeter',origin:[0,0],width:100,height:50,depth:0});await wait();
  return {reset,rejected,resetError,after,newFace:!!c.cadRegistry.findFace(rect.faceId),processing:c.craftService.isProcessing};
 });
 assert.equal(result.reset,true);assert.equal(result.resetError,null);assert.equal(result.rejected,true);
 assert.deepEqual(result.after,{history:0,models:0,canUndo:false,processing:false});assert.equal(result.newFace,true);assert.equal(result.processing,false);
 console.log('PASS synchronous update observer reset rejects stale operation, drains, and accepts new document');
 }finally{await context.close();browser.disconnect()}})().catch(e=>{console.error(e);process.exitCode=1});
