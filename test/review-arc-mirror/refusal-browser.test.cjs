const assert = require('node:assert/strict');
const puppeteer = require('puppeteer-core');
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
  for(const [x,y] of [[setup.x,setup.y],[setup.x+40,setup.y],[setup.x,setup.y-40]]){await p.mouse.move(x,y);await p.mouse.click(x,y)}
  const result=await p.evaluate(async ({faceId})=>{
   const c=__CAD_APP,e=c.services.sketcher.inPlaceEditor,ctx=e.sketcherAppContext,v=ctx.viewer;v.toolManager.releaseControl();let arc;v.traverse(o=>{if(o.TYPE==='Arc')arc=o});if(!arc)throw Error('Arc tool produced no arc');
   ctx.actions.Mirror.invoke(ctx,{reflectionLine:[v.createIndex()['rect-0']],objects:[arc]});
   const draft=JSON.parse(v.io.serializeSketch(undefined,{strict:true}));let failure=null;try{await e.save()}catch(error){failure={name:error.name,message:error.message,code:error.code||null}};
   return {draft,failure,stored:c.sketchStorageService.getSketchData(faceId)};
  },setup);
  const gen=result.draft.stages.flatMap(s=>s.generators).find(g=>g.typeId==='Mirror');assert.ok(gen);
  assert.equal(result.draft.objects.find(o=>o.id===gen.params.objects[0]).type,'Arc');assert.equal(result.draft.objects.find(o=>o.id===gen.generatedObjects[0]).type,'Arc');
  assert.ok(result.failure,'Arc Mirror unexpectedly saved');assert.equal(result.stored,setup.prior,'refusal overwrote prior authored sketch');
  console.log('REFUSAL',JSON.stringify(result.failure)); console.log('PASS actual Arc Mirror created; installed Worker refuses Save and preserves prior sketch');
 }finally{await context.close();browser.disconnect()}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
