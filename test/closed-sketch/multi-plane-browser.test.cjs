// Actual app/Workers. Distinct source planes and a consumed sketch share travel.
const assert=require('node:assert/strict'),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);
if(![base,cdp].every(u=>['localhost','127.0.0.1','[::1]'].includes(u.hostname)))throw Error('Loopback only');
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:120000}),context=await browser.createBrowserContext();try{
 const page=await context.newPage();await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base));await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});
 const result=await page.evaluate(async()=>{
  const c=__CAD_APP,k=c.craftService,host=new AbortController();c.projectService.bindHostLifetime({signal:host.signal,valid:()=>true});
  const Native=window.Worker;let starts=0,terminated=0;window.Worker=class extends Native{constructor(...args){super(...args);starts++}terminate(){terminated++;return super.terminate()}};
  try{
   const rectangle=(width,height,depth)=>k.createRectangleSketch({revision:k.inspectRectangleCreation().revision,unit:'millimeter',origin:[0,0],width,height,depth});
   const a=await rectangle(100,50,0),b=await rectangle(30,20,5),read=()=>c.sketchStorageService.getSketchData(a.faceId),before=read();
   const apply=(ids,factor)=>k.applySketchLengthRelation({revision:k.inspectSketchTransitions().revision,faceId:a.faceId,ids,factor,offset:0});
   const travel=direction=>k.authoredEditTravel({revision:k.inspectAuthoredEdits().revision,direction});
   await apply(['rect-0','rect-1'],2);const relation=read();await travel('undo');if(read()!==before)throw Error('Open plane undo');await travel('redo');if(read()!==relation)throw Error('Open plane redo');
   let f=k.inspectWorkerFeatureCommands();await k.createWorkerExtrusion({revision:f.revision,...f.extrusionCandidates.find(x=>x.faceId===a.faceId),depth:20});
   await apply(['rect-0','rect-2'],1);const twoRelations=read();
   await k.editRectangleDimensions({revision:k.inspectRectangleDimensions().revision,faceId:a.faceId,width:120,height:60});const edited=read();
   const geometry=k.inspectPublishedWorkerGeometry();await travel('undo');if(read()!==twoRelations)throw Error('Consumed dimension undo');await travel('undo');if(read()!==relation)throw Error('Consumed relation undo');await travel('redo');await travel('redo');if(read()!==edited)throw Error('Consumed redo');
   return {candidates:k.inspectSketchTransitions().candidates,otherPlane:!!c.cadRegistry.findFace(b.faceId),geometry,starts,terminated};
  }finally{window.Worker=Native}
 });
 assert.equal(result.candidates.length,2);assert.equal(result.otherPlane,true);assert.deepEqual(result.geometry.bodies[0].bounds,[[0,120],[0,60],[0,20]]);assert.equal(result.starts,result.terminated);console.log('PASS actual consumed/unconsumed multi-plane source frames, downstream edit and exact travel',JSON.stringify(result));
 }finally{await context.close();browser.disconnect()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
