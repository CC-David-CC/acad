// Actual app/craft and research Worker. Test-only abort immediately after dispatch;
// it does not claim the native Boolean had begun executing.
const assert=require('node:assert/strict'),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);if(![base,cdp].every(x=>['127.0.0.1','localhost','[::1]'].includes(x.hostname)))throw Error('Loopback only');
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href}),context=await browser.createBrowserContext(),page=await context.newPage();try{
 await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base));await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});
 const result=await page.evaluate(async()=>{
  const c=__CAD_APP,host=new AbortController();c.projectService.bindHostLifetime({signal:host.signal,valid:()=>true});
  const call=req=>new Promise((yes,no)=>c.craftService.modify(req,yes,no)),wait=async()=>{let end=Date.now()+60000;while(c.craftService.isProcessing&&Date.now()<end)await new Promise(r=>setTimeout(r,10));if(c.craftService.isProcessing)throw Error('replay did not drain')};
  const item=await c.craftService.createRectangleSketch({revision:c.craftService.inspectRectangleCreation().revision,unit:'millimeter',origin:[0,0],width:100,height:50,depth:0}),face=c.cadRegistry.findFace(item.faceId);
  await call({type:'WORKER_RECTANGLE_EXTRUDE_V1',params:{featureId:2,length:20,face:face.id,regions:[face.sketchRegions[0].id]}});await wait();
  const parent=c.craftService.models$.value[0],lid=parent.faces.find(f=>f.topology.data.portableIdentity?.key?.role==='LID'),before=JSON.stringify(c.craftService.modifications$.value),post=Worker.prototype.postMessage,terminate=Worker.prototype.terminate;let target=null,dispatches=0,terminations=0;
  Worker.prototype.postMessage=function(message,...rest){const value=post.call(this,message,...rest);if(message?.kind==='research-centered-cut'){target=this;dispatches++;setTimeout(()=>host.abort(),0)}return value};
  Worker.prototype.terminate=function(...args){if(this===target)terminations++;return terminate.apply(this,args)};
  try{
   const settled=await Promise.race([new Promise(resolve=>c.craftService.modify({type:'WORKER_CENTERED_THROUGH_HOLE_V1',params:{featureId:3,face:lid.id,diameter:10}},()=>resolve('accepted'),e=>resolve('rejected:'+String(e?.name||e)))),new Promise((_,reject)=>setTimeout(()=>reject(Error('operation callback did not settle')),30000))]);
   await wait();await new Promise(r=>setTimeout(r,250));return {settled,dispatches,terminations,aborted:host.signal.aborted,historyUnchanged:JSON.stringify(c.craftService.modifications$.value)===before,faceCount:c.craftService.models$.value[0]?.faces.length||0,processing:c.craftService.isProcessing};
  }finally{Worker.prototype.postMessage=post;Worker.prototype.terminate=terminate;host.abort()}
 });
 assert.equal(result.dispatches,1);assert.equal(result.aborted,true);assert.ok(result.terminations>=1);assert.match(result.settled,/^rejected:/);assert.equal(result.historyUnchanged,true);assert.equal(result.faceCount,6);assert.equal(result.processing,false);console.log('PASS actual craft host abort after dispatched cut',JSON.stringify(result));
 }finally{await context.close();browser.disconnect()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
