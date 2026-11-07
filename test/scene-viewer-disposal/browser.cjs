// Real Viewer/SceneSetup/WebGL components in an owned Chromium context.
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);
for(const url of[base,cdp])assert.ok(['127.0.0.1','localhost','[::1]'].includes(url.hostname));
(async()=>{
 const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:90000}),context=await browser.createBrowserContext();
 try{
  const page=await context.newPage();await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base));
  await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});
  const rows=await page.evaluate(async()=>{
   const Viewer=__CAD_APP.viewer.constructor,wait=()=>new Promise(resolve=>setTimeout(resolve,120));
   function create(){const container=document.createElement('div');container.style.cssText='width:200px;height:200px';document.body.append(container);return{container,viewer:new Viewer(container)};}
   function watch(viewer){const s=viewer.sceneSetup,state={evaluations:0,renders:0,controls:0,renderer:0};
    for(const [object,key,field]of[[s.trackballControls,'evaluate','evaluations'],[s.renderer,'render','renders'],[s.trackballControls,'dispose','controls'],[s.renderer,'dispose','renderer']]){const original=object[key];object[key]=function(...args){state[field]++;return original.apply(this,args);};}return state;
   }
   const originalRAF=window.requestAnimationFrame,callbacks=[];
   window.requestAnimationFrame=function(callback){callbacks.push(callback);return originalRAF.call(this,callback);};
   let first;try{first=create();}finally{window.requestAnimationFrame=originalRAF;}
   const retained=callbacks[0];if(typeof retained!=='function')throw Error('No real constructor animation callback captured');
   const sibling={container:first.container,viewer:new Viewer(first.container)},state=watch(first.viewer),other=watch(sibling.viewer);await wait();
   const before={...state},siblingBefore=other.evaluations;first.viewer.dispose();await wait();
   const after={...state},canvasRemoved=!first.container.contains(first.viewer.sceneSetup.renderer.domElement);
   let scheduled=0;window.requestAnimationFrame=function(callback){scheduled++;return originalRAF.call(this,callback);};
   try{retained(performance.now());first.viewer.requestRender();first.viewer.sceneSetup.updateViewportSizeIfNeeded();}finally{window.requestAnimationFrame=originalRAF;}
   await wait();const late={...state},beforeSecondDispose={...state};first.viewer.dispose();
   const normal={before,after,late,afterSecondDispose:{...state},beforeSecondDispose,scheduled,canvasRemoved,siblingAdvanced:other.evaluations>siblingBefore,siblingCanvasPresent:sibling.container.contains(sibling.viewer.sceneSetup.renderer.domElement)};
   // Inject only AFTER genuine controls cleanup, testing owner coordination.
   const fault=create(),faultState=watch(fault.viewer),controls=fault.viewer.sceneSetup.trackballControls,disposeControls=controls.dispose,expected=Error('injected after genuine controls disposal');
   controls.dispose=function(){disposeControls.call(this);fault.viewer.requestRender();fault.viewer.sceneSetup.animate();throw expected;};
   let observed;try{fault.viewer.dispose();}catch(error){observed=error;}
   const faultBefore={...faultState};await wait();fault.viewer.dispose();
   const failedCleanup={expectedError:observed===expected,beforeWait:faultBefore,afterWait:{...faultState},canvasRemoved:!fault.container.contains(fault.viewer.sceneSetup.renderer.domElement)};
   sibling.viewer.dispose();return{normal,failedCleanup};
  });
  const response=await fetch(new URL('static/index.bundle.js',base)),hash=crypto.createHash('sha256');for await(const block of response.body)hash.update(block);const appSHA256=hash.digest('hex');
  if(process.env.CODI_EXPECT_APP_SHA)assert.equal(appSHA256,process.env.CODI_EXPECT_APP_SHA);
  const checks={activeBefore:rows.normal.before.evaluations>0,stoppedAfterDispose:rows.normal.after.evaluations===rows.normal.before.evaluations,controlsReleasedOnce:rows.normal.after.controls===1&&rows.normal.afterSecondDispose.controls===1,rendererReleasedOnce:rows.normal.after.renderer===1&&rows.normal.afterSecondDispose.renderer===1,canvasRemoved:rows.normal.canvasRemoved,lateWorkInert:rows.normal.scheduled===0&&rows.normal.late.evaluations===rows.normal.after.evaluations&&rows.normal.late.renders===rows.normal.after.renders,idempotent:JSON.stringify(rows.normal.afterSecondDispose)===JSON.stringify(rows.normal.beforeSecondDispose),siblingRetained:rows.normal.siblingAdvanced&&rows.normal.siblingCanvasPresent,failedCleanupContinues:rows.failedCleanup.expectedError&&rows.failedCleanup.beforeWait.controls===1&&rows.failedCleanup.beforeWait.renderer===1&&rows.failedCleanup.canvasRemoved&&JSON.stringify(rows.failedCleanup.beforeWait)===JSON.stringify(rows.failedCleanup.afterWait)};
  const receipt={format:'codi-scene-viewer-disposal/1',appSHA256,result:Object.values(checks).every(Boolean)?'PASS':'FAIL',checks,rows,scope:'Actual Viewer component teardown in a retained realm; genuine RAF/controls/renderer forwarding and one injected post-cleanup exception. No claim that normal host iframe removal leaks, no arbitrary child exception safety or forced GC evidence.'};
  if(process.env.CODI_RECEIPT)fs.writeFileSync(process.env.CODI_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));assert.ok(Object.values(checks).every(Boolean),'Viewer teardown requirements failed; see receipt');
 }finally{await context.close();browser.disconnect();}
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
