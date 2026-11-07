// Actual worker replay, separate from feature-timeline cursor navigation.
const assert=require('node:assert/strict'),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);
for(const u of [base,cdp])if(!['127.0.0.1','localhost','[::1]'].includes(u.hostname))throw Error('Loopback only');
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:300000}),context=await browser.createBrowserContext();try{
 const page=await context.newPage();await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base));
 await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});
 const out=await page.evaluate(async()=>{
  const c=__CAD_APP,controller=new AbortController();c.projectService.bindHostLifetime({signal:controller.signal,valid:()=>true});
  const call=req=>new Promise((ok,no)=>c.craftService.modify(req,ok,no));
  const wait=async()=>{const end=Date.now()+60000;while(c.craftService.isProcessing&&Date.now()<end)await new Promise(r=>setTimeout(r,10));if(c.craftService.isProcessing)throw Error('Replay timeout')};
  const rectangle=await c.craftService.createRectangleSketch({revision:c.craftService.inspectRectangleCreation().revision,unit:'millimeter',origin:[10,20],width:100,height:50,depth:7});
  const face=c.cadRegistry.findFace(rectangle.faceId),region=face.sketchRegions[0];
  await call({type:'WORKER_RECTANGLE_EXTRUDE_V1',params:{featureId:2,length:20,face:face.id,regions:[region.id]}});await wait();
  const features=c.craftService.inspectWorkerFeatureCommands(),hole=features.centeredHoleCandidates[0];
  if(!hole)throw Error('Centered-hole candidate unavailable');
  await c.craftService.createWorkerCenteredHole({revision:features.revision,bodyId:hole.bodyId,lidFaceId:hole.lidFaceId,diameter:10});await wait();
  const cornerFeatures=c.craftService.inspectWorkerFeatureCommands(),corners=cornerFeatures.fourCornerCandidates[0];
  if(!corners)throw Error('Four-corner candidate unavailable');
  await c.craftService.createWorkerFourCornerHoles({revision:cornerFeatures.revision,bodyId:corners.bodyId,centerWallId:corners.centerWallId,sideIds:corners.sideIds,diameter:4,offsetX:10,offsetY:10});await wait();
  await new Promise(r=>setTimeout(r,1600));
  const saved=await c.projectManager.prepareHostSave();if(!saved.isCurrent())throw Error('Save preparation was stale');
  const snapshot=()=>{const body=c.craftService.models$.value[0],points=Array.from(body.brepShell.vertices,v=>v.point);return {history:c.craftService.modifications$.value.history.map(x=>({type:x.type,featureId:x.params.featureId,length:x.params.length,diameter:x.params.diameter,offsetX:x.params.offsetX,offsetY:x.params.offsetY})),pointer:c.craftService.modifications$.value.pointer,faces:body.faces.length,z:Math.max(...points.map(p=>p.z))}};
  const initial=snapshot(),info=()=>c.craftService.inspectAuthoredEdits(),run=async options=>{const result=options.direction
    ? await c.craftService.authoredEditTravel({revision:info().revision,direction:options.direction})
    : await c.craftService.authoredDepthOperation({...options,revision:info().revision,index:1,featureId:2});await wait();return result};
  await run({depth:35});const edited=snapshot();
  await new Promise(r=>setTimeout(r,1600));const editedSave=await c.projectManager.prepareHostSave();if(!editedSave.isCurrent())throw Error('Edited save preparation was stale');
  await run({direction:'undo'});const undone=snapshot();
  await run({direction:'redo'});const redone=snapshot();
  const before=JSON.stringify(snapshot()),journal=JSON.stringify(info());let invalid=false;
  try {await run({depth:-1})} catch (_) {invalid=true}
  const preserved=before===JSON.stringify(snapshot())&&journal===JSON.stringify(info());
  const historyInfo=c.craftService.inspectWorkerHistory();
  const priorController=new AbortController();
  await c.craftService.editWorkerExtrusion({revision:historyInfo.revision,index:1,featureId:2,depth:45},{signal:priorController.signal});await wait();const agent=snapshot();
  await run({direction:'undo'});const undoAgent=snapshot();await run({direction:'redo'});const redoAgent=snapshot();
  c.craftService.historyTravel.setPointer(0);await wait();
  if(c.wizardService.workingRequest?.type!=='WORKER_RECTANGLE_EXTRUDE_V1')throw Error('Extrusion wizard not opened');
  c.wizardService.updateParam('length',55);c.wizardService.applyWorkingRequest();
  const deadline=Date.now()+60000;
  while(Date.now()<deadline&&(c.craftService.isProcessing||c.craftService.modifications$.value.pointer!==3||c.craftService.modifications$.value.history[1].params.length!==55))await new Promise(r=>setTimeout(r,20));
  if(c.craftService.modifications$.value.history[1].params.length!==55)throw Error('Wizard edit did not commit');
  const wizard=snapshot();await run({direction:'undo'});const undoWizard=snapshot();await run({direction:'redo'});const redoWizard=snapshot();
  let holeHistory=c.craftService.inspectWorkerHistory();
  await c.craftService.editWorkerCenteredHole({revision:holeHistory.revision,index:2,featureId:3,diameter:8});await wait();const centeredEdited=snapshot();
  await run({direction:'undo'});const centeredUndo=snapshot();await run({direction:'redo'});const centeredRedo=snapshot();
  holeHistory=c.craftService.inspectWorkerHistory();
  await c.craftService.editWorkerFourCornerHoles({revision:holeHistory.revision,index:3,featureId:4,diameter:5,offsetX:11,offsetY:11});await wait();const cornersEdited=snapshot();
  const holeGeometry=c.craftService.inspectPublishedWorkerGeometry().bodies[0].holes;
  await run({direction:'undo'});const cornersUndo=snapshot();await run({direction:'redo'});const cornersRedo=snapshot();
  c.craftService.historyTravel.setPointer(1);await wait();
  if(c.wizardService.workingRequest?.type!=='WORKER_CENTERED_THROUGH_HOLE_V1')throw Error('Centered-hole wizard not opened');
  c.wizardService.updateParam('diameter','9');c.wizardService.applyWorkingRequest();
  const holeDeadline=Date.now()+60000;
  while(Date.now()<holeDeadline&&(c.craftService.isProcessing||c.craftService.modifications$.value.pointer!==3||c.craftService.modifications$.value.history[2].params.diameter!==9))await new Promise(r=>setTimeout(r,20));
  if(c.craftService.modifications$.value.history[2].params.diameter!==9)throw Error('Centered-hole wizard did not commit');
  const wizardHole=snapshot();await run({direction:'undo'});const undoWizardHole=snapshot();await run({direction:'redo'});const redoWizardHole=snapshot();
  const priorNoop=JSON.stringify(info());holeHistory=c.craftService.inspectWorkerHistory();
  const noop=await c.craftService.editWorkerFourCornerHoles({revision:holeHistory.revision,index:3,featureId:4,diameter:5,offsetX:11,offsetY:11});
  const noopPreserved=noop.changed===false&&priorNoop===JSON.stringify(info());
  const priorInvalid=JSON.stringify(snapshot()),journalContents=()=>{const {revision,...rest}=info();return JSON.stringify(rest)},priorJournal=journalContents();let invalidCorners=false;
  try{holeHistory=c.craftService.inspectWorkerHistory();await c.craftService.editWorkerFourCornerHoles({revision:holeHistory.revision,index:3,featureId:4,diameter:5,offsetX:50,offsetY:25})}catch(_){invalidCorners=true}
  await wait();const invalidCornersPreserved=priorInvalid===JSON.stringify(snapshot())&&priorJournal===journalContents();
  const concurrentRevision=info().revision;
  const simultaneous=await Promise.allSettled([56,57].map(depth=>c.craftService.authoredDepthOperation({revision:concurrentRevision,index:1,featureId:2,depth})));
  await wait();const simultaneousSuccesses=simultaneous.filter(x=>x.status==='fulfilled').length;
  const NativeWorker=window.Worker;let releaseCache,cacheResult,concurrentRejected=false;
  window.Worker=class extends NativeWorker {postMessage(data,...args){if(data?.task==='rectangle-extrusion-solve')releaseCache=()=>super.postMessage(data,...args);else super.postMessage(data,...args)}};
  try {
    const inspected=info().revision,request={revision:inspected,index:1,featureId:2,depth:60};
    const pending=c.craftService.authoredDepthOperation(request).then(()=>true,()=>false);
    request.depth=65;
    const end=Date.now()+10000;while(!releaseCache&&Date.now()<end)await new Promise(r=>setTimeout(r,10));if(!releaseCache)throw Error('Cache-write solver was not dispatched');
    priorController.abort();
    try {await c.craftService.authoredDepthOperation({revision:inspected,index:1,featureId:2,depth:75})} catch (_) {concurrentRejected=true}
    c.projectService.save();releaseCache();cacheResult=await pending;await wait();
  } finally {window.Worker=NativeWorker}
  const cacheSnapshot=snapshot();
  const bytes=c.sketchStorageService.getSketchData(face.id);c.sketchStorageService.setSketchData(face.id,bytes);
  const sameByteStale=!info().canUndo;c.sketchStorageService.removeSketchData(face.id);c.sketchStorageService.setSketchData(face.id,bytes);
  const abaStale=!info().canUndo;c.craftService.rebuild();await wait();
  const callbackBefore=JSON.stringify(snapshot());let callbackRejected=false;
  try {await c.craftService.authoredDepthOperation({revision:info().revision,index:1,featureId:2,depth:60},{beforePublish:()=>{c.sketchStorageService.setSketchData(face.id,c.sketchStorageService.getSketchData(face.id));return true}})}catch(_){callbackRejected=true}
  const callbackPreserved=callbackBefore===JSON.stringify(snapshot());
  c.craftService.rebuild();await wait();
  let materialRejected=false;
  try {await c.craftService.authoredDepthOperation({revision:info().revision,index:1,featureId:2,depth:60},{beforePublish:()=>{c.projectManager.resetDocumentState(c.projectService.documentGeneration);return true}})}catch(_){materialRejected=true}
  const materialPreserved=callbackBefore===JSON.stringify(snapshot());
  c.craftService.rebuild();await wait();
  let surfaceRejected=false;
  try {await c.craftService.authoredDepthOperation({revision:info().revision,index:1,featureId:2,depth:60},{beforePublish:()=>{c.surfacingService.notifyChange();return true}})}catch(_){surfaceRejected=true}
  const surfacePreserved=callbackBefore===JSON.stringify(snapshot());
  c.craftService.rebuild();await wait();
  const stream=c.craftService.modifications$, next=stream.next;let submitRejected=false;
  stream.next=function(value){c.surfacingService.notifyChange();return next.call(this,value)};
  try {await c.craftService.authoredDepthOperation({revision:info().revision,index:1,featureId:2,depth:64})}catch(_){submitRejected=true}finally{stream.next=next}
  const submitPreserved=callbackBefore===JSON.stringify(snapshot());
  c.craftService.rebuild();await wait();
  const beforeHeld=JSON.stringify(snapshot()), heldJournal=JSON.stringify(info()), Original=window.Worker;
  let release,terminated=0;
  window.Worker=class extends Original {postMessage(data,...args){if(data?.task==='rectangle-extrusion-solve')release=()=>super.postMessage(data,...args);else super.postMessage(data,...args)}terminate(){terminated++;return super.terminate()}};
  let interrupted;
  try {
    const pending=c.craftService.authoredDepthOperation({revision:info().revision,index:1,featureId:2,depth:65}).then(()=>({ok:true}),e=>({ok:false,name:e.name}));
    const end=Date.now()+10000;while(!release&&Date.now()<end)await new Promise(r=>setTimeout(r,10));if(!release)throw Error('Held solver was not dispatched');
    c.sketchStorageService.setSketchData(face.id,c.sketchStorageService.getSketchData(face.id));
    release();interrupted=await pending;await wait();
  } finally {window.Worker=Original}
  const heldPreserved=beforeHeld===JSON.stringify(snapshot()),journalCursorPreserved=JSON.parse(heldJournal).canUndo===info().canUndo;
  c.craftService.rebuild();await wait();
  const beforeAbort=JSON.stringify(snapshot()), aborter=new AbortController();release=null;terminated=0;
  window.Worker=class extends Original {postMessage(data,...args){if(data?.task==='rectangle-extrusion-solve')release=()=>super.postMessage(data,...args);else super.postMessage(data,...args)}terminate(){terminated++;return super.terminate()}};
  let aborted;
  try {
    const pending=c.craftService.authoredDepthOperation({revision:info().revision,index:1,featureId:2,depth:65},{signal:aborter.signal}).then(()=>({ok:true}),e=>({ok:false,name:e.name}));
    const end=Date.now()+10000;while(!release&&Date.now()<end)await new Promise(r=>setTimeout(r,10));if(!release)throw Error('Abort solver was not dispatched');
    aborter.abort();aborted=await pending;await wait();
  } finally {window.Worker=Original}
  return {initial,edited,undone,redone,invalid,preserved,agent,undoAgent,redoAgent,wizard,undoWizard,redoWizard,centeredEdited,centeredUndo,centeredRedo,cornersEdited,cornersUndo,cornersRedo,wizardHole,undoWizardHole,redoWizardHole,noopPreserved,holeGeometry,invalidCorners,invalidCornersPreserved,simultaneousSuccesses,cacheResult,cacheSnapshot,concurrentRejected,sameByteStale,abaStale,callbackRejected,callbackPreserved,materialRejected,materialPreserved,surfaceRejected,surfacePreserved,submitRejected,submitPreserved,interrupted,heldPreserved,journalCursorPreserved,aborted,abortTerminated:terminated,abortPreserved:beforeAbort===JSON.stringify(snapshot())};
 });
 assert.equal(out.initial.z,27);assert.equal(out.initial.faces,11);assert.equal(out.edited.z,42);assert.equal(out.edited.faces,11);assert.deepEqual(out.undone,out.initial);assert.deepEqual(out.redone,out.edited);assert.ok(out.invalid&&out.preserved);
 assert.equal(out.agent.z,52);assert.deepEqual(out.undoAgent,out.edited);assert.deepEqual(out.redoAgent,out.agent);
 assert.equal(out.wizard.z,62);assert.deepEqual(out.undoWizard,out.agent);assert.deepEqual(out.redoWizard,out.wizard);
 assert.equal(out.centeredEdited.history[2].diameter,8);assert.deepEqual(out.centeredUndo,out.wizard);assert.deepEqual(out.centeredRedo,out.centeredEdited);
 assert.equal(out.cornersEdited.history[3].diameter,5);assert.deepEqual(out.cornersUndo,out.centeredEdited);assert.deepEqual(out.cornersRedo,out.cornersEdited);
 assert.equal(out.wizardHole.history[2].diameter,9);assert.deepEqual(out.undoWizardHole,out.cornersEdited);assert.deepEqual(out.redoWizardHole,out.wizardHole);
 assert.ok(out.noopPreserved);
 assert.equal(out.holeGeometry.length,5);
 const center=out.holeGeometry.find(h=>h.role==='HOLE_WALL'),cornerHoles=out.holeGeometry.filter(h=>h.role==='CORNER_WALL');
 assert.ok(Math.abs(center.radius-4)<1e-6&&Math.abs(center.center[0]-60)<1e-6&&Math.abs(center.center[1]-45)<1e-6);
 for(const [x,y] of [[21,31],[99,31],[99,59],[21,59]])assert.ok(cornerHoles.some(h=>Math.abs(h.center[0]-x)<1e-6&&Math.abs(h.center[1]-y)<1e-6&&Math.abs(h.radius-2.5)<1e-6));
 assert.ok(out.invalidCorners&&out.invalidCornersPreserved,`invalid corner rejected=${out.invalidCorners} preserved=${out.invalidCornersPreserved}`);
 assert.equal(out.simultaneousSuccesses,1);assert.ok(out.cacheResult&&out.concurrentRejected);assert.equal(out.cacheSnapshot.z,67);assert.equal(out.cacheSnapshot.faces,11);
 assert.ok(out.sameByteStale&&out.abaStale);
 assert.ok(out.callbackRejected&&out.callbackPreserved);
 assert.ok(out.materialRejected&&out.materialPreserved);
 assert.ok(out.surfaceRejected&&out.surfacePreserved);
 assert.ok(out.submitRejected&&out.submitPreserved,`submit reentrancy: rejected=${out.submitRejected} preserved=${out.submitPreserved}`);
 assert.equal(out.interrupted.ok,false);assert.ok(out.heldPreserved&&out.journalCursorPreserved);
 assert.equal(out.aborted.ok,false);assert.ok(out.abortTerminated>0&&out.abortPreserved);
 await page.addScriptTag({url:new URL('static/webosTest.bundle.js',base).href});
 const editorRefusal=await page.evaluate(async()=>{
  const c=__CAD_APP;c.craftService.historyTravel.setPointer(0);
  const end=Date.now()+60000;while(c.craftService.isProcessing&&Date.now()<end)await new Promise(r=>setTimeout(r,10));
  const face=c.cadRegistry.shells[0].faces[0];c.services.marker.clear();c.services.marker.markExclusively(face.TYPE,face.id);
  window.Cypress={$:s=>{const a=[...document.querySelectorAll(s)];a.index=n=>a.indexOf(n);return a}};
  const ui=webosTest.modellerUISubject(c);ui.openSketcher();
  try{await c.craftService.authoredDepthOperation({revision:c.craftService.inspectAuthoredEdits().revision,index:1,featureId:2,depth:65});return false}catch{return c.services.sketcher.inPlaceEditor.inEditMode===true}
 });
 assert.equal(editorRefusal,true);
 console.log('PASS real worker depth edit, agent/wizard routes, authored undo/redo and failed-edit preservation');
}finally{await context.close();browser.disconnect()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
