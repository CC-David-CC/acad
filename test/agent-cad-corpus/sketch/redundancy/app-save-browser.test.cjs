// Actual application model/action/installed Worker/Save and fresh native replay.
// Test helpers seed geometry through existing tools; no trusted UI gesture claim.
const fs=require('node:fs'),assert=require('node:assert/strict');
const puppeteer=require(process.env.PUPPETEER_CORE_PATH||'/tmp/codi-occt-release-control/node_modules/puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP||'http://127.0.0.1:19329');
for(const u of [base,cdp])assert.ok(['127.0.0.1','localhost','[::1]'].includes(u.hostname));
const expected={app:process.env.CODI_APP_SHA256,worker:process.env.CODI_SKETCH_WORKER_SHA256,helper:process.env.CODI_HELPER_SHA256};
for(const pin of Object.values(expected))assert.match(pin||'',/^[0-9a-f]{64}$/);
const workerURL=new URL(process.env.CODI_SKETCH_WORKER_URL,base).href;
(async()=>{
 const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:120000}),context=await browser.createBrowserContext();
 const report={version:1,source:process.env.CODI_SOURCE,expected,scope:'Real application actions/model + installed Worker Save + fresh native project replay; no trusted UI/canvas or signed host Files claim'};
 async function open(){
  const p=await context.newPage(),response=await p.goto(new URL('index-webos.html?DEFAULT&webos=1',base).href);
  const csp=response.headers()['content-security-policy']||'';assert.match(csp,/script-src[^;]*'self'/);assert.doesNotMatch(csp.split(';').find(x=>x.trim().startsWith('script-src')),/'unsafe-eval'|'unsafe-inline'|blob:/);assert.match(csp,/worker-src 'self'/);report.csp=csp;
  await p.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});
  const pins=await p.evaluate(async worker=>{
   const hash=async path=>{const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw Error('Missing pinned asset');return [...new Uint8Array(await crypto.subtle.digest('SHA-256',await r.arrayBuffer()))].map(x=>x.toString(16).padStart(2,'0')).join('');};
   return {app:await hash('static/index.bundle.js'),helper:await hash('static/webosTest.bundle.js'),worker:await hash(worker)};
  },workerURL);assert.deepEqual(pins,expected);
  await p.addScriptTag({url:new URL('static/webosTest.bundle.js',base).href});
  await p.evaluate(worker=>{
   window.Cypress={$:s=>{const a=[...document.querySelectorAll(s)];a.index=n=>a.indexOf(n);return a;}};
   window.redundancyHost=new AbortController();__CAD_APP.projectService.bindHostLifetime({signal:redundancyHost.signal,valid:()=>true});
   const Native=window.Worker;window.redundancyWorkerEvidence={started:0,terminated:0,replies:[]};
   window.Worker=class extends Native{constructor(url,...args){super(url,...args);this.owned=new URL(String(url),location.href).href===worker;if(this.owned){redundancyWorkerEvidence.started++;this.addEventListener('message',({data})=>redundancyWorkerEvidence.replies.push(data));}}terminate(){if(this.owned){this.owned=false;redundancyWorkerEvidence.terminated++;}return super.terminate();}};
  },workerURL);
  return p;
 }
 async function enter(p,faceId){
  await p.waitForFunction(id=>!!__CAD_APP.cadRegistry.findFace(id)?.ext?.view,{timeout:30000},faceId);
  return p.evaluate(id=>{const c=__CAD_APP,face=c.cadRegistry.findFace(id);c.services.marker.markExclusively(face.TYPE,face.id);window.redundancyUI=webosTest.modellerUISubject(c);window.redundancySketch=redundancyUI.openSketcher();window.redundancyEditor=c.services.sketcher.inPlaceEditor;window.redundancyViewer=redundancyEditor.viewer;return {source:c.storageService.get(redundancyEditor.sketchStorageKey),guarded:!!redundancyEditor.authoredSaveGuard};},faceId);
 }
 try{
  report.browser=await browser.version();const p=await open();
  const faceId=await p.evaluate(async()=>{const c=__CAD_APP,r=await c.craftService.createRectangleSketch({revision:c.craftService.inspectRectangleCreation().revision,unit:'millimeter',origin:[0,0],width:100,height:50,depth:0});return r.faceId;});
  report.initial=await enter(p,faceId);assert.equal(report.initial.guarded,true);
  report.authored=await p.evaluate(async()=>{
   const ctx=redundancyEditor.sketcherAppContext,v=redundancyViewer,key=redundancyEditor.sketchStorageKey;
   const s=redundancySketch.addSegment(15,15,65,20);window.redundancySegmentId=s.id;
   ctx.actions.Horizontal.invoke(ctx,[s]);
   const before=JSON.parse(v.io.serializeSketch(undefined,{strict:true})),inspection=await ctx.actions.SignedDistanceY.inspect(ctx);
   const accepted=await ctx.actions.SignedDistanceY.invokeByIds(ctx,[s.a.id,s.b.id],0,inspection.revision,{valid:()=>true});
   const after=JSON.parse(v.io.serializeSketch(undefined,{strict:true}));
   const relevant=after.stages.flatMap(stage=>stage.constraints).filter(c=>c.typeId==='Horizontal'&&c.objects[0]===s.id||c.typeId==='SignedDistanceY'&&c.objects.includes(s.a.id)&&c.objects.includes(s.b.id));
   const h=v.historyManager;h.undo();const undo=JSON.parse(v.io.serializeSketch(undefined,{strict:true}));h.redo();const redo=JSON.parse(v.io.serializeSketch(undefined,{strict:true}));
   const start=performance.now();await __CAD_APP.actionService.run('sketchSaveAndExit');const saveMs=performance.now()-start;
   return {accepted,relevant,before,after,undo,redo,saveMs,active:redundancyEditor.inEditMode,stored:__CAD_APP.storageService.get(key),workers:redundancyWorkerEvidence};
  });
  assert.equal(report.authored.accepted.status,'redundant');
  assert.deepEqual(report.authored.relevant.map(c=>[c.typeId,c.admission.state]),[['Horizontal','accepted'],['SignedDistanceY','redundant']]);
  assert.deepEqual(report.authored.before.objects,report.authored.after.objects);
  assert.deepEqual(report.authored.undo,report.authored.before);assert.deepEqual(report.authored.redo,report.authored.after);
  assert.equal(report.authored.active,false);assert.ok(report.authored.workers.started>=1);assert.equal(report.authored.workers.started,report.authored.workers.terminated);
  assert.ok(report.authored.workers.replies.some(r=>r.validated===true));
  const native=await p.evaluate(()=>__CAD_APP.projectManager.snapshotForHostSave());
  report.native=native;
  const fresh=await open();await fresh.evaluate(snapshot=>__CAD_APP.projectManager.restoreSnapshotInEmptyWorkspace(JSON.stringify(snapshot)),native);
  const restored=await fresh.evaluate(()=>__CAD_APP.projectManager.snapshotCurrentProject());
  assert.deepEqual(restored.project.sketches,native.project.sketches);assert.deepEqual(restored.project.model.history,native.project.model.history);
  report.reopened=await enter(fresh,faceId);
  report.roundtrip=await fresh.evaluate(async()=>{
   const c=__CAD_APP,e=redundancyEditor,v=redundancyViewer,key=e.sketchStorageKey,source=c.storageService.get(key),before=JSON.parse(v.io.serializeSketch(undefined,{strict:true}));
   const relevant=before.stages.flatMap(stage=>stage.constraints).filter(c=>['Horizontal','SignedDistanceY'].includes(c.typeId));
   await c.actionService.run('sketchSaveAndExit');return {relevant,sourceUnchanged:c.storageService.get(key)===source,closed:!e.inEditMode,workers:redundancyWorkerEvidence};
  });
  assert.ok(report.roundtrip.relevant.some(c=>c.typeId==='SignedDistanceY'&&c.admission.state==='redundant'));
  assert.equal(report.roundtrip.sourceUnchanged,true);assert.equal(report.roundtrip.closed,true);assert.equal(report.roundtrip.workers.started,report.roundtrip.workers.terminated);
  report.status='pass';fs.writeFileSync(process.env.CODI_BROWSER_RECEIPT,JSON.stringify(report,null,2)+'\n');console.log('PASS actual fresh action authoring, redundant hint, undo/redo, installed Worker Save and fresh native reopen/no-op Save');
 }catch(error){report.status='fail';report.error={name:error.name,message:error.message,stack:error.stack};if(process.env.CODI_BROWSER_RECEIPT)fs.writeFileSync(process.env.CODI_BROWSER_RECEIPT,JSON.stringify(report,null,2)+'\n');throw error;}
 finally{await context.close();browser.disconnect();}
})().catch(e=>{console.error(e);process.exitCode=1;});
