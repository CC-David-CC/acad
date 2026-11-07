// Real app, real pinned Workers and actual Canvas. No canvas/solver stand-ins.
const assert=require('node:assert/strict'),fs=require('node:fs'),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);for(const url of [base,cdp])assert.ok(['127.0.0.1','localhost','[::1]'].includes(url.hostname));
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:120000}),context=await browser.createBrowserContext();try{
 const page=await context.newPage();await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base));await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});
 const result=await page.evaluate(async()=>{
  const c=__CAD_APP,k=c.craftService,host=new AbortController();c.projectService.bindHostLifetime({signal:host.signal,valid:()=>true});
  const Native=window.Worker;let starts=0,terminated=0;window.Worker=class extends Native{constructor(...args){super(...args);starts++}terminate(){terminated++;return super.terminate()}};
  try{
   const empty=await k.createEmptySketchPlane({revision:k.inspectPrimitiveCreation().revision,unit:'millimeter',plane:'XY',depth:0});
   const append=(kind,data)=>k.appendClosedSketchPrimitive({revision:k.inspectSketchTransitions().revision,faceId:empty.faceId,kind,role:null,stage:0,data});
   const first=await append('Circle',{c:{x:0,y:0},r:10}),second=await append('Circle',{c:{x:30,y:10},r:4});
   const read=()=>c.sketchStorageService.getSketchData(empty.faceId),before=read(),ids=[first.primitive.id,second.primitive.id];
   const view=await k.openWorkerSketchView({revision:k.inspectSketchTransitions().revision,faceId:empty.faceId});
   const selected=await k.selectWorkerSketchView({revision:view.revision,ids});
   const canvas=document.querySelector('[data-worker-sketch-view] canvas'),pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;let colored=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]>100||pixels[i+1]>100||pixels[i+2]>100)colored++;
   const unchanged=read()===before,noLegacyEditor=c.services.sketcher.inPlaceEditor.inEditMode===false;
   k.closeWorkerSketchView();
   const models=k.models$.value,history=JSON.stringify(k.modifications$.value),invalid=await k.applySketchConcentric({revision:k.inspectSketchTransitions().revision,faceId:empty.faceId,ids:[ids[0],'missing-curve']}).then(()=>({ok:true}),error=>({ok:false,name:error.name,code:error.code,committed:error.committed===true}));
   const rejectedIntact=read()===before&&k.models$.value===models&&JSON.stringify(k.modifications$.value)===history;
   const relation=await k.applySketchConcentric({revision:k.inspectSketchTransitions().revision,faceId:empty.faceId,ids}),after=read();
   const objects=JSON.parse(after).objects,centers=objects.filter(row=>ids.includes(row.id)).map(row=>row.data.c);
   await k.authoredEditTravel({revision:k.inspectAuthoredEdits().revision,direction:'undo'});const undo=read();await k.authoredEditTravel({revision:k.inspectAuthoredEdits().revision,direction:'redo'});const redo=read();
   await k.openWorkerSketchView({revision:k.inspectSketchTransitions().revision,faceId:empty.faceId});
   const resizeBefore=document.querySelector('[data-worker-sketch-view] canvas').width;window.dispatchEvent(new Event('resize'));await new Promise(r=>setTimeout(r,100));
   host.abort();await new Promise(r=>setTimeout(r,150));
   return {view,selected,colored,unchanged,noLegacyEditor,invalid,rejectedIntact,relation,centers,before,after,undo,redo,closed:k.inspectWorkerSketchView(),views:document.querySelectorAll('[data-worker-sketch-view]').length,resizeBefore,starts,terminated};
  }finally{window.Worker=Native}
 });
 assert.equal(result.view.numericalCache,'absent');assert.equal(result.view.dof,null);assert.equal(result.selected.selection.length,2);assert.ok(result.colored>20);assert.equal(result.unchanged,true);assert.equal(result.noLegacyEditor,true);assert.equal(result.invalid.ok,false);assert.equal(result.invalid.committed,false);assert.equal(result.rejectedIntact,true);assert.ok(Math.hypot(result.centers[0].x-result.centers[1].x,result.centers[0].y-result.centers[1].y)<1e-6);assert.equal(result.undo,result.before);assert.equal(result.redo,result.after);assert.equal(result.closed.open,false);assert.equal(result.views,0);assert.equal(result.starts,result.terminated);
 if(process.env.CODI_RECEIPT)fs.writeFileSync(process.env.CODI_RECEIPT,JSON.stringify(result,null,2)+'\n');console.log('PASS actual Worker view/drawing/selection, public concentric, exact travel and host cleanup',JSON.stringify({colored:result.colored,starts:result.starts,terminated:result.terminated}));
}finally{await context.close();browser.disconnect()}})().catch(error=>{console.error(error.stack);process.exitCode=1});
