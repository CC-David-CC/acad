// Integration regression: typed parameters must not break ordinary sketch entry.
const assert=require('node:assert/strict');
const puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);
if(![base,cdp].every(u=>['127.0.0.1','localhost','[::1]'].includes(u.hostname)))throw Error('Loopback only');
(async()=>{
 const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:120000}),context=await browser.createBrowserContext();let passed=false;
 try{
  const page=await context.newPage();page.on('pageerror',e=>console.error('PAGE',e.message));
  await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base));
  await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});
  const initial=await page.evaluate(async()=>{
   const c=__CAD_APP,k=c.craftService;window.testHost=new AbortController();c.projectService.bindHostLifetime({signal:testHost.signal,valid:()=>true});
   const rect=await k.createRectangleSketch({revision:k.inspectRectangleCreation().revision,unit:'millimeter',origin:[0,0],width:100,height:50,depth:0});
   let info=k.inspectWorkerFeatureCommands();await k.createWorkerExtrusion({revision:info.revision,...info.extrusionCandidates[0],depth:20});
   const params=k.inspectPhysicalParameters();await k.applyPhysicalDepth({revision:params.revision,index:params.targets[0].index,featureId:params.targets[0].featureId,parameter:'depth',definitions:[{name:'depth',dimension:'length',expression:'inch(1)'}]});
   const source=c.sketchStorageService.getSketchData(rect.faceId);k.historyTravel.setPointer(0);return {faceId:rect.faceId,source};
  });
  await page.waitForFunction(()=>!__CAD_APP.craftService.isProcessing,{timeout:90000});
  await page.waitForFunction(id=>!!__CAD_APP.cadRegistry.findFace(id)?.ext?.view,{timeout:30000},initial.faceId);
  const result=await page.evaluate(({faceId,source})=>{
   const c=__CAD_APP;try{
    c.services.sketcher.sketchFace(c.cadRegistry.findFace(faceId));const editor=c.services.sketcher.inPlaceEditor;
    return {error:null,open:editor.inEditMode,objects:editor.viewer.layers.flatMap(l=>l.objects).filter(o=>o.TYPE==='Segment').length,sourceUnchanged:c.sketchStorageService.getSketchData(faceId)===source};
   }catch(error){return {error:error.message,sourceUnchanged:c.sketchStorageService.getSketchData(faceId)===source};}
  },initial);
  console.log('TYPED_SKETCH_ENTRY',JSON.stringify(result));assert.equal(result.error,null);assert.equal(result.open,true);assert.equal(result.objects,4);assert.equal(result.sourceUnchanged,true);
  passed=true;console.log('PASS typed parameter document enters its original sketch without changing authored bytes');
 }finally{if(passed)await context.close();else console.error('Retained failing typed-sketch context',context.id);browser.disconnect();}
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
