const assert = require('node:assert/strict');
const puppeteer = require('puppeteer-core');
const endOffset = process.env.CODI_ARC_MAJOR === '1' ? 40 : -40;
const base = new URL(process.env.JSKETCHER_TEST_URL), cdp = new URL(process.env.CODI_TEST_CDP);
if (![base,cdp].every(u=>['localhost','127.0.0.1','[::1]'].includes(u.hostname))) throw Error('loopback only');
(async()=>{
 const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:120000});
 const context=await browser.createBrowserContext();
 try{
  const p=await context.newPage(); await p.goto(new URL('index-webos.html?DEFAULT&webos=1',base));
  await p.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});
  const setup=await p.evaluate(async()=>{
   const c=__CAD_APP,k=c.craftService;window.h=new AbortController();c.projectService.bindHostLifetime({signal:h.signal,valid:()=>true});
   const r=await k.createRectangleSketch({revision:k.inspectRectangleCreation().revision,unit:'millimeter',origin:[0,0],width:100,height:50,depth:0});
   const prior=c.sketchStorageService.getSketchData(r.faceId);c.services.sketcher.sketchFace(c.cadRegistry.findFace(r.faceId));
   const ctx=c.services.sketcher.inPlaceEditor.sketcherAppContext;ctx.actions.ArcTool.invoke(ctx);const box=ctx.viewer.canvas.getBoundingClientRect();
   return {faceId:r.faceId,prior,x:box.x+box.width/2+80,y:box.y+box.height/2+70};
  });
  for(const [x,y] of [[setup.x,setup.y],[setup.x+40,setup.y],[setup.x,setup.y+endOffset]]){await p.mouse.move(x,y);await p.mouse.click(x,y)}
  if(process.env.CODI_OBLIQUE==='1'){
   await p.evaluate(()=>{const ctx=__CAD_APP.services.sketcher.inPlaceEditor.sketcherAppContext;ctx.viewer.toolManager.releaseControl();ctx.actions.SegmentTool.invoke(ctx)});
   for(const [x,y] of [[setup.x-80,setup.y-50],[setup.x-20,setup.y+10]]){await p.mouse.move(x,y);await p.mouse.click(x,y)}
  }
  const result=await p.evaluate(async ({faceId,oblique})=>{
   const c=__CAD_APP,e=c.services.sketcher.inPlaceEditor,ctx=e.sketcherAppContext,v=ctx.viewer;v.toolManager.releaseControl();let arc;v.traverse(o=>{if(o.TYPE==='Arc')arc=o});if(!arc)throw Error('Arc tool produced no arc');
   let axis=v.createIndex()['rect-0'];if(oblique){axis=null;v.traverse(o=>{if(o.TYPE==='Segment'&&!String(o.id).startsWith('rect-'))axis=o});if(!axis||Math.abs(axis.a.x-axis.b.x)<1e-6||Math.abs(axis.a.y-axis.b.y)<1e-6)throw Error('Oblique axis missing')}ctx.actions.Mirror.invoke(ctx,{reflectionLine:[axis],objects:[arc]});
   const draft=JSON.parse(v.io.serializeSketch(undefined,{strict:true}));let failure=null;try{await e.save()}catch(error){failure={name:error.name,message:error.message,code:error.code||null}};
   const stored=c.sketchStorageService.getSketchData(faceId);if(!failure)e.exit();return {draft,failure,stored,snapshot:failure?null:await c.projectManager.snapshotCurrentProject()};
  },{...setup,oblique:process.env.CODI_OBLIQUE==='1'});
  const gen=result.draft.stages.flatMap(s=>s.generators).find(g=>g.typeId==='Mirror');assert.ok(gen);
  assert.equal(result.draft.objects.find(o=>o.id===gen.params.objects[0]).type,'Arc');assert.equal(result.draft.objects.find(o=>o.id===gen.generatedObjects[0]).type,'Arc');
  assert.equal(result.failure,null,JSON.stringify(result.failure));assert.notEqual(result.stored,setup.prior);
  if(process.env.CODI_RECEIPT)require('node:fs').writeFileSync(process.env.CODI_RECEIPT,result.stored);
  const saved=JSON.parse(result.stored),sg=saved.stages.flatMap(s=>s.generators).find(g=>g.typeId==='Mirror');
  assert.ok(sg);const source=saved.objects.find(o=>o.id===sg.params.objects[0]),target=saved.objects.find(o=>o.id===sg.generatedObjects[0]);assert.equal(target.type,'Arc');
  const sweep=d=>{const angle=p=>Math.atan2(p.y-d.c.y,p.x-d.c.x);return (angle(d.b)-angle(d.a)+2*Math.PI)%(2*Math.PI)};
  assert.ok(process.env.CODI_ARC_MAJOR==='1'?sweep(source.data)>Math.PI:sweep(source.data)<Math.PI);
  assert.ok(Math.abs(sweep(source.data)-sweep(target.data))<1e-6);
  assert.ok(Math.abs(Math.hypot(source.data.a.x-source.data.c.x,source.data.a.y-source.data.c.y)-Math.hypot(target.data.a.x-target.data.c.x,target.data.a.y-target.data.c.y))<1e-6);
  const fresh=await browser.createBrowserContext();try{const q=await fresh.newPage();await q.goto(new URL('index-webos.html?DEFAULT&webos=1',base));await q.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});const restored=await q.evaluate(async({snapshot,faceId})=>{const c=__CAD_APP;window.h=new AbortController();c.projectService.bindHostLifetime({signal:h.signal,valid:()=>true});await c.projectManager.restoreSnapshotBytesInEmptyWorkspace(new Blob([JSON.stringify(snapshot)]));return c.sketchStorageService.getSketchData(faceId)},{snapshot:result.snapshot,faceId:setup.faceId});assert.equal(restored,result.stored);}finally{await fresh.close()}
  console.log('PASS actual Arc Mirror Save and fresh native replay');
 }finally{await context.close();browser.disconnect()}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
