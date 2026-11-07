const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const puppeteer=require(process.env.PUPPETEER_CORE_PATH||'/tmp/codi-occt-release-control/node_modules/puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);
for(const url of [base,cdp])assert.ok(['127.0.0.1','localhost','[::1]'].includes(url.hostname),'loopback only');
const oldSource='base = 50\nW = base * 2\nH = base\nD = 20',newSource='base = 75\nW = base * 2\nH = base\nD = 25';
(async()=>{
 const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:120000}),context=await browser.createBrowserContext();
 try{
  async function fresh(){const page=await context.newPage();page.on('pageerror',e=>console.error('PAGE',e.message));await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base).href);await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});await page.evaluate(()=>{window.testHost=new AbortController();__CAD_APP.projectService.bindHostLifetime({signal:testHost.signal,valid:()=>true});});return page;}
  const seed=await fresh();
  const fixture=await seed.evaluate(async oldSource=>{const c=__CAD_APP,k=c.craftService;
   const main=await k.createRectangleSketch({revision:k.inspectRectangleCreation().revision,unit:'millimeter',origin:[0,0],width:100,height:50,depth:0});
   const extrusion=k.inspectWorkerFeatureCommands();await k.createWorkerExtrusion({revision:extrusion.revision,...extrusion.extrusionCandidates[0],depth:20});
   const local=await k.createRectangleSketch({revision:k.inspectRectangleCreation().revision,unit:'millimeter',origin:[200,0],width:30,height:10,depth:0});
   const snapshot=c.projectManager.snapshotCurrentProject();snapshot.project.model.expressions=oldSource;
   snapshot.project.model.history.find(row=>row.type==='WORKER_RECTANGLE_EXTRUDE_V1').params.length='D';
   for(const [id,width,height,constants]of[[main.faceId,'W','H',''],[local.faceId,'W','LH','W = 30\nLH = 5 * 2']]){const sketch=snapshot.project.sketches.find(row=>row.id===id).data;sketch.constants=constants;for(const row of sketch.stages[0].constraints){if(row.typeId==='SegmentLength')row.constants.length=row.objects[0]==='rect-0'?width:height;}}
   return {snapshot,mainId:main.faceId,localId:local.faceId};
  },oldSource);const emptySourceWithSketchesNoop=await require('./ownership.cjs').noOp(seed,'');await seed.close();
  const page=await fresh();await page.evaluate(async snapshot=>__CAD_APP.projectManager.restoreSnapshotBytesInEmptyWorkspace(new Blob([JSON.stringify(snapshot)])),fixture.snapshot);
  await page.evaluate(({mainId,localId})=>{window.fixtureIds={mainId,localId};const c=__CAD_APP,k=c.craftService;
   window.capture=()=>{const body=k.models$.value.find(m=>m.brepShell?.vertices),points=body?Array.from(body.brepShell.vertices,v=>v.point):[];
    const sketches=[mainId,localId].map(id=>({id,bytes:c.sketchStorageService.getSketchData(id)}));
    return {source:c.expressionService.script$.value,isTyped:c.expressionService.isTyped,table:{...c.expressionService.table$.value},history:JSON.stringify(k.modifications$.value.history),sketches,metadata:JSON.stringify(c.projectManager.getManufacturingMetadata()),bounds:['x','y','z'].map(a=>[Math.min(...points.map(p=>p[a])),Math.max(...points.map(p=>p[a]))]),localWidth:Math.hypot(...['x','y'].map(a=>{const data=JSON.parse(sketches[1].bytes).objects[0].data;return data.b[a]-data.a[a]})),journal:k.inspectAuthoredEdits()};};
   window.atomicObservations=[];const observe=()=>atomicObservations.push(capture());window.detachObservers=[c.expressionService.script$,c.expressionService.table$,k.models$].map(stream=>stream.attach(observe));
   window.canvasCreations=[];const create=document.createElement;document.createElement=function(tag,...args){if(String(tag).toLowerCase()==='canvas')canvasCreations.push(new Error().stack);return create.call(this,tag,...args)};
   window.testNativeWorker=Worker;window.workerRows=[];window.Worker=class extends testNativeWorker{constructor(url,...args){super(url,...args);this.testRow={url:String(url),task:null,closed:false,received:false};workerRows.push(this.testRow);this.addEventListener('message',()=>this.testRow.received=true);}postMessage(data,...args){this.testRow.task=data?.task||data?.kind||null;return super.postMessage(data,...args);}terminate(){this.testRow.closed=true;return super.terminate();}};
  },fixture);
  const before=await page.evaluate(()=>capture());assert.equal(before.source,oldSource);assert.deepEqual(before.bounds,[[0,100],[0,50],[0,20]]);assert.equal(before.localWidth,30);
  const applied=await page.evaluate(async source=>{const k=__CAD_APP.craftService,result=await k.applyLegacyExpressions({revision:k.inspectAuthoredEdits().revision,source});return {result,state:capture()};},newSource);
  assert.equal(applied.result.changed,true);assert.equal(applied.state.source,newSource);assert.equal(applied.state.isTyped,false);assert.deepEqual(applied.state.bounds,[[0,150],[0,75],[0,25]]);assert.equal(applied.state.localWidth,30);assert.deepEqual(JSON.parse(applied.state.history),JSON.parse(before.history));
  for(let i=0;i<2;i++){const old=JSON.parse(before.sketches[i].bytes),next=JSON.parse(applied.state.sketches[i].bytes);assert.deepEqual(next.stages,old.stages);assert.deepEqual(next.metadata,old.metadata);assert.equal(next.constants,old.constants);assert.deepEqual(next.objects.map(o=>[o.id,o.type,o.stage,o.role]),old.objects.map(o=>[o.id,o.type,o.stage,o.role]));}
  const atomic=await page.evaluate(()=>({observations:atomicObservations.map(row=>({source:row.source,bounds:row.bounds,width:JSON.parse(row.sketches[0].bytes).objects[0].data.b.x,tableW:row.table.W})),canvasCreations,workers:workerRows.filter(row=>row.task==='legacy-expression-transaction')}));
  for(const row of atomic.observations){const next=row.source===newSource;assert.ok(next||row.source===oldSource);assert.deepEqual(row.bounds,next?applied.state.bounds:before.bounds);assert.equal(row.width,next?150:100);assert.equal(row.tableW,next?150:100);}
  assert.ok(atomic.observations.length>0);assert.equal(atomic.workers.length,5);assert.ok(atomic.workers.every(row=>row.closed&&row.received));assert.ok(atomic.canvasCreations.every(stack=>!stack.includes('reevaluateSketch')&&!stack.includes('viewer2d')),'no hidden Canvas/Viewer solver');
  console.log('PASS legacy source edit, global formula, local shadowing, real Worker, atomic observations',JSON.stringify({result:applied.result,bounds:applied.state.bounds,localWidth:applied.state.localWidth,observations:atomic.observations.length,canvasCreations:atomic.canvasCreations.length}));
  const extra=await require('./finish.cjs')({page,fresh,fixture,before,applied,oldSource,newSource});
  console.log('PASS refusal/cancel/currentness, malformed private results, undo/redo, real Script UI and native save/reopen');
  const app=Buffer.from(await(await fetch(new URL('/static/index.bundle.js',base))).arrayBuffer());
  const receipt={emptySourceWithSketchesNoop,appSha256:crypto.createHash('sha256').update(app).digest('hex'),...extra,source:newSource,applied:applied.result,bounds:applied.state.bounds,localWidth:applied.state.localWidth,atomic,scope:'Actual app and genuine headless Worker command; component-local Script UI, cancellation/currentness/fault refusal, authored undo/redo, native host-save preparation and fresh restore. No signed Files/public deployment claim.'};
  if(process.env.CODI_RECEIPT)fs.writeFileSync(process.env.CODI_RECEIPT,JSON.stringify(receipt,null,2)+'\n');
 }finally{await context.close();browser.disconnect();}
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
