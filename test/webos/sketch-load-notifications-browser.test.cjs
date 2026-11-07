// Actual IO/solver/streams; no validation skip.
const assert=require('node:assert/strict'),fs=require('node:fs'),puppeteer=require('puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);if(![base,cdp].every(u=>['127.0.0.1','localhost','[::1]'].includes(u.hostname)))throw Error('Loopback only');
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href}),ctx=await browser.createBrowserContext();try{
 const p=await ctx.newPage();await p.goto(new URL('index-webos.html?DEFAULT&webos=1',base));await p.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});
 const r=await p.evaluate(async()=>{
  const c=__CAD_APP;window.hostJob=new AbortController();c.projectService.bindHostLifetime({signal:hostJob.signal,valid:()=>true});
  const rect=await c.craftService.createRectangleSketch({revision:c.craftService.inspectRectangleCreation().revision,unit:'millimeter',origin:[0,0],width:100,height:50,depth:0});c.services.sketcher.sketchFace(c.cadRegistry.findFace(rect.faceId));
  const v=c.services.sketcher.inPlaceEditor.sketcherAppContext.viewer,pm=v.parametricManager,source=v.io.serializeSketch(undefined,{strict:true}),count=pm.allConstraints.length,states=[];
  const stop=pm.$update.attach(()=>states.push(pm.allConstraints.length)),original=pm.notify;let calls=0;pm.notify=function(){calls++;return original.call(this);};
  try{v.io.loadSketch(source,{strict:true});return {calls,states,beforeCount:count,afterCount:pm.allConstraints.length,expectedIds:pm.stage.algNumSystem.allConstraints.map(c=>c.id).sort((a,b)=>a-b),actualIds:pm.allConstraints.map(c=>c.id),exactNative:source===v.io.serializeSketch(undefined,{strict:true})};}
  finally{pm.notify=original;if(typeof stop==='function')stop();}
 });assert.equal(r.calls,Number(process.env.CODI_EXPECT_NOTIFICATIONS||3));assert.ok(r.beforeCount>0);assert.equal(r.afterCount,r.beforeCount);assert.deepEqual(r.actualIds,r.expectedIds);assert.equal(r.exactNative,true);
 if(process.env.CODI_RECEIPT)fs.writeFileSync(process.env.CODI_RECEIPT,JSON.stringify(r,null,2)+'\n');console.log('PASS native load and constraint stream',JSON.stringify(r));
}finally{await ctx.close();browser.disconnect();}})().catch(e=>{console.error(e);process.exitCode=1;});
