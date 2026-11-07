const assert=require('node:assert/strict'),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);
if(![base,cdp].every(u=>['127.0.0.1','localhost','[::1]'].includes(u.hostname)))throw Error('Loopback only');
(async()=>{
 const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:90000}),context=await browser.createBrowserContext();
 try {
  async function fresh(bind=true){
   const page=await context.newPage();page.on('pageerror',e=>console.error('PAGE',String(e)));
   await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base));
   await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});
   // The real binding uses this test host's signal; no signed WebOS parent is involved.
   if (bind) await page.evaluate(()=>{window.testHostController=new AbortController();__CAD_APP.projectService.bindHostLifetime({signal:testHostController.signal,valid:()=>true});});
   return page;
  }
  const page=await fresh();
  const result=await page.evaluate(async()=>{
   const c=__CAD_APP,call=req=>new Promise((ok,no)=>c.craftService.modify(req,ok,no));
   const wait=async()=>{const end=Date.now()+60000;while(c.craftService.isProcessing&&Date.now()<end)await new Promise(r=>setTimeout(r,10));if(c.craftService.isProcessing)throw Error('Replay timeout');};
   const created=await c.craftService.createRectangleSketch({revision:c.craftService.inspectRectangleCreation().revision,unit:'millimeter',origin:[10,20],width:100,height:50,depth:7});
   const face=c.cadRegistry.findFace(created.faceId),region=face.sketchRegions[0];
   const request={type:'WORKER_RECTANGLE_EXTRUDE_V1',params:{featureId:2,length:20,face:face.id,regions:[region.id]}};
   await call(request);await wait();
   const measure=()=>{const body=c.craftService.models$.value[0],points=Array.from(body.brepShell.vertices,v=>v.point);return {id:body.id,faces:body.faces.length,edges:body.edges.length,vertices:points.length,bounds:[Math.min(...points.map(p=>p.x)),Math.max(...points.map(p=>p.x)),Math.min(...points.map(p=>p.y)),Math.max(...points.map(p=>p.y)),Math.min(...points.map(p=>p.z)),Math.max(...points.map(p=>p.z))],worker:!!body.ext.workerGeometry};};
   const accepted=measure(),before=JSON.stringify(c.craftService.modifications$.value),sketchBefore=c.sketchStorageService.getSketchData(face.id);
   const unknown=await call({type:'WORKER_RECTANGLE_EXTRUDE_V2',params:request.params}).then(()=>null,e=>String(e.message||e));
   const rejected=await call({type:'WORKER_RECTANGLE_EXTRUDE_V1',params:{...request.params,featureId:3,length:-1}}).then(()=>null,e=>String(e.message||e));await wait();
   const after=measure(),afterSnapshot=JSON.stringify(c.craftService.modifications$.value);
   c.craftService.historyTravel.setPointer(0);await wait();const undo=c.craftService.models$.value[0].faces[0].id;
   c.craftService.historyTravel.end();await wait();const redo=measure();
   return {accepted,rejected,unknown,after,unchanged:before===afterSnapshot&&sketchBefore===c.sketchStorageService.getSketchData(face.id),undo,redo,envelope:c.projectManager.snapshotCurrentProject()};
  });
  assert.deepEqual(result.accepted.bounds,[10,110,20,70,7,27]);assert.deepEqual([result.accepted.vertices,result.accepted.edges,result.accepted.faces],[8,12,6]);assert.equal(result.accepted.worker,true);assert.ok(result.rejected);assert.match(result.unknown,/not registered/i);assert.deepEqual(result.after,result.accepted);assert.equal(result.unchanged,true);assert.ok(result.undo);assert.deepEqual(result.redo,result.accepted);
  const encoded=JSON.stringify(result.envelope);assert.ok(!encoded.includes('oci-verified-worker'));assert.ok(!encoded.includes('occ-portable'));assert.ok(!encoded.includes('workerGeometry'));assert.ok(!encoded.includes('mountId'));
  const reopen=await fresh();const restored=await reopen.evaluate(async envelope=>{const c=__CAD_APP;await c.projectManager.restoreSnapshotInEmptyWorkspace(JSON.stringify(envelope));const end=Date.now()+60000;while(c.craftService.isProcessing&&Date.now()<end)await new Promise(r=>setTimeout(r,10));const b=c.craftService.models$.value[0];return {id:b.id,worker:!!b.ext.workerGeometry,faces:b.faces.length,history:c.craftService.modifications$.value.history.length};},result.envelope);
  assert.deepEqual(restored,{id:result.accepted.id,worker:true,faces:6,history:2});
  await reopen.addScriptTag({url:new URL('static/webosTest.bundle.js',base).href});
  await reopen.evaluate(async()=>{
   const c=__CAD_APP;c.craftService.historyTravel.setPointer(0);
   const end=Date.now()+30000;while(c.craftService.isProcessing&&Date.now()<end)await new Promise(r=>setTimeout(r,10));
   const face=c.cadRegistry.shells[0].faces[0];c.services.marker.clear();c.services.marker.markExclusively(face.TYPE,face.id);
   window.Cypress={$:s=>{const a=[...document.querySelectorAll(s)];a.index=n=>a.indexOf(n);return a}};
   window.editUI=webosTest.modellerUISubject(c);window.editSketch=editUI.openSketcher();
  });
  await reopen.waitForFunction(()=>[...document.querySelectorAll('span')].some(e=>e.textContent.includes('Segment Length')),{timeout:10000});
  await reopen.evaluate(()=>[...document.querySelectorAll('span')].find(e=>e.textContent.includes('Segment Length')).parentElement.click());
  await reopen.waitForFunction(()=>document.body.innerText.includes('SEGMENT LENGTH'));
  const input=(await reopen.$$('input[type=text]'))[0];await input.click({clickCount:3});await input.press('Backspace');await input.type('150');await input.press('Enter');
  await reopen.waitForFunction(()=>!document.body.innerText.includes('SEGMENT LENGTH'));
  const edited=await reopen.evaluate(async()=>{
   const c=__CAD_APP;await editUI.commitSketch();await new Promise(r=>setTimeout(r,300));c.craftService.historyTravel.end();
   const end=Date.now()+60000;while(c.craftService.isProcessing&&Date.now()<end)await new Promise(r=>setTimeout(r,10));
   const b=c.craftService.models$.value[0],points=Array.from(b.brepShell.vertices,v=>v.point);
   return {bounds:[Math.min(...points.map(p=>p.x)),Math.max(...points.map(p=>p.x)),Math.min(...points.map(p=>p.z)),Math.max(...points.map(p=>p.z))],failure:c.craftService.pipelineFailure$.value,envelope:c.projectManager.snapshotCurrentProject()};
  });
  assert.deepEqual(edited.bounds,[10,160,7,27]);assert.equal(edited.failure,null);
  const editedReopen=await fresh();const editedBounds=await editedReopen.evaluate(async envelope=>{const c=__CAD_APP;await c.projectManager.restoreSnapshotInEmptyWorkspace(JSON.stringify(envelope));const p=Array.from(c.craftService.models$.value[0].brepShell.vertices,v=>v.point);return [Math.min(...p.map(x=>x.x)),Math.max(...p.map(x=>x.x))]},edited.envelope);assert.deepEqual(editedBounds,[10,160]);
  const depthEdit=await editedReopen.evaluate(async()=>{
   const c=__CAD_APP,wait=async()=>{const end=Date.now()+60000;while(c.craftService.isProcessing&&Date.now()<end)await new Promise(r=>setTimeout(r,10));if(c.craftService.isProcessing)throw Error('Replay timeout')};
   c.craftService.historyTravel.setPointer(0);await wait();
   const request=JSON.parse(JSON.stringify(c.craftService.modifications$.value.history[1])),prior=JSON.stringify(c.craftService.modifications$.value);
   const invalid={...request,params:{...request.params,length:-1}};
   const failure=await new Promise(resolve=>c.craftService.modifyInHistoryAndStep(invalid,()=>resolve(null),e=>resolve(String(e.message||e))));await wait();
   const preserved=JSON.stringify(c.craftService.modifications$.value)===prior && c.craftService.models$.value[0].faces[0].id===request.params.face;
   request.params.length=30;await new Promise((yes,no)=>c.craftService.modifyInHistoryAndStep(request,yes,no));await wait();
   const points=Array.from(c.craftService.models$.value[0].brepShell.vertices,v=>v.point);
   return {failure,preserved,bounds:[Math.min(...points.map(p=>p.z)),Math.max(...points.map(p=>p.z))],envelope:c.projectManager.snapshotCurrentProject()};
  });
  assert.ok(depthEdit.failure);assert.equal(depthEdit.preserved,true);assert.deepEqual(depthEdit.bounds,[7,37]);
  const depthReopen=await fresh();const reopenedDepth=await depthReopen.evaluate(async envelope=>{const c=__CAD_APP;await c.projectManager.restoreSnapshotInEmptyWorkspace(JSON.stringify(envelope));const p=Array.from(c.craftService.models$.value[0].brepShell.vertices,v=>v.point);return [Math.min(...p.map(x=>x.z)),Math.max(...p.map(x=>x.z))]},depthEdit.envelope);assert.deepEqual(reopenedDepth,[7,37]);
  console.log('PASS real editor width change, depth history edit, failed edit retention and native reopen');
  const wizardPage=await fresh();await wizardPage.addScriptTag({url:new URL('static/webosTest.bundle.js',base).href});
  const wizardResult=await wizardPage.evaluate(async()=>{
   const c=__CAD_APP,created=await c.craftService.createRectangleSketch({revision:c.craftService.inspectRectangleCreation().revision,unit:'millimeter',origin:[0,0],width:24,height:12,depth:0});
   const face=c.cadRegistry.findFace(created.faceId),region=face.sketchRegions[0];
   window.Cypress={$:s=>{const a=[...document.querySelectorAll(s)];a.index=n=>a.indexOf(n);return a}};
   const ui=webosTest.modellerUISubject(c);ui.openWizard('WORKER_RECTANGLE_EXTRUDE_V1');
   ui.wizardContext.updateParam('face',face.id);ui.wizardContext.updateParam('regions',[region.id]);ui.wizardContext.updateParam('length',8);
   await ui.wizardOK();const end=Date.now()+60000;while(c.craftService.isProcessing&&Date.now()<end)await new Promise(r=>setTimeout(r,10));
   const body=c.craftService.models$.value[0];return {history:c.craftService.modifications$.value.history,worker:!!body.ext.workerGeometry,faces:body.faces.length};
  });
  assert.equal(wizardResult.history.at(-1).type,'WORKER_RECTANGLE_EXTRUDE_V1');assert.equal(wizardResult.worker,true);assert.equal(wizardResult.faces,6);
  console.log('PASS visible wizard and API use the same registered operation');
  const noHost=await fresh(false);const hostRefusal=await noHost.evaluate(async()=>{
   const c=__CAD_APP,item=await c.craftService.createRectangleSketch({revision:c.craftService.inspectRectangleCreation().revision,unit:'millimeter',origin:[0,0],width:10,height:10,depth:0});
   const face=c.cadRegistry.findFace(item.faceId),region=face.sketchRegions[0];
   return await new Promise(resolve=>c.craftService.modify({type:'WORKER_RECTANGLE_EXTRUDE_V1',params:{featureId:2,face:face.id,regions:[region.id],length:5}},()=>resolve(null),e=>resolve(String(e.message||e))));
  });assert.match(hostRefusal,/host-bound/);console.log('PASS missing trusted host lifetime refuses worker extrusion');
  const contradictionPage=await fresh();
  const contradiction=await contradictionPage.evaluate(async()=>{
   const c=__CAD_APP,item=await c.craftService.createRectangleSketch({revision:c.craftService.inspectRectangleCreation().revision,unit:'millimeter',origin:[0,0],width:30,height:10,depth:0});
   let face=c.cadRegistry.findFace(item.faceId),id=face.sketchRegions[0].id;
   const sketch=JSON.parse(c.sketchStorageService.getSketchData(face.id));
   const original=sketch.stages[0].constraints.find(x=>x.typeId==='SegmentLength');
   const conflicting=JSON.parse(JSON.stringify(original));conflicting.constants.length='99';conflicting.admission={version:1,state:'accepted'};
   sketch.stages[0].constraints.push(conflicting);c.sketchStorageService.setSketchData(face.id,JSON.stringify(sketch));
   await new Promise(r=>setTimeout(r,200));const before=c.craftService.modifications$.value.history.length;
   const result=await new Promise(resolve=>c.craftService.modify({type:'WORKER_RECTANGLE_EXTRUDE_V1',params:{featureId:2,face:face.id,regions:[id],length:5}},()=>resolve(null),e=>resolve(String(e.message||e))));
   return {result,before,after:c.craftService.modifications$.value.history.length,worker:c.craftService.models$.value.some(m=>!!m.ext.workerGeometry)};
  });
  assert.ok(contradiction.result);assert.equal(contradiction.after,contradiction.before);assert.equal(contradiction.worker,false);
  console.log('PASS accepted flags do not bypass contradictory-constraint solve');
  for(const mode of ['reset','host-abort']) {
  const interrupted=await fresh();
  const stale=await interrupted.evaluate(async mode=>{
   const c=__CAD_APP,call=req=>new Promise((ok,no)=>c.craftService.modify(req,ok,no));
   const item=await c.craftService.createRectangleSketch({revision:c.craftService.inspectRectangleCreation().revision,unit:'millimeter',origin:[0,0],width:30,height:10,depth:0});
   const f=c.cadRegistry.findFace(item.faceId),region=f.sketchRegions[0],Original=window.Worker;let release,terminated=0;
   window.Worker=class extends Original {postMessage(data,...args){if(data?.task==='rectangle-extrusion-solve')release=()=>super.postMessage(data,...args);else super.postMessage(data,...args)}terminate(){terminated++;return super.terminate()}};
   try {
    const pending=call({type:'WORKER_RECTANGLE_EXTRUDE_V1',params:{featureId:2,length:5,face:f.id,regions:[region.id]}}).then(()=>({ok:true}),e=>({ok:false,name:e.name}));
    const end=Date.now()+10000;while(!release&&Date.now()<end)await new Promise(r=>setTimeout(r,10));if(!release)throw Error('Solve was not dispatched');
    if(mode==='reset')c.projectService.empty();else testHostController.abort();release();const outcome=await pending;return {outcome,terminated,history:c.craftService.modifications$.value.history.length,models:c.craftService.models$.value.length,worker:c.craftService.models$.value.some(m=>!!m.ext.workerGeometry)};
   }finally{window.Worker=Original}
  },mode);
  assert.equal(stale.outcome.ok,false);assert.equal(stale.outcome.name,'AbortError');assert.ok(stale.terminated>=1);assert.equal(stale.worker,false);if(mode==='reset'){assert.equal(stale.history,0);assert.equal(stale.models,0);}
  }
  console.log('PASS data-only solver, actual OCC worker prism, bounds/topology, rejected operation, undo/redo, native reopen and held-solve document reset and host abort; real binding to a test host');
 } finally {await context.close();browser.disconnect();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
