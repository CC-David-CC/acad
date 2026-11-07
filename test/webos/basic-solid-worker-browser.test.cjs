const assert = require('node:assert/strict');
const puppeteer = require(process.env.PUPPETEER_CORE_PATH || 'puppeteer-core');
const base = new URL(process.env.JSKETCHER_TEST_URL), cdp = new URL(process.env.CODI_TEST_CDP);
if (![base, cdp].every(url => ['127.0.0.1','localhost','[::1]'].includes(url.hostname))) throw Error('Loopback fixture required');
(async()=>{
 const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:90000});
 const ctx=await browser.createBrowserContext();let other;
 try {
  async function fresh(context=ctx){const p=await context.newPage();await p.goto(new URL('index-webos.html?DEFAULT&webos=1',base).href);await p.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});await p.evaluate(()=>{window.testHostController=new AbortController();__CAD_APP.projectService.bindHostLifetime({signal:testHostController.signal,valid:()=>true})});return p;}
  const p=await fresh();
  const result=await p.evaluate(async()=>{
   const c=__CAD_APP,craft=c.craftService,r=craft.inspectRectangleCreation(),rect=await craft.createRectangleSketch({revision:r.revision,unit:'millimeter',origin:[0,0],width:100,height:50,depth:0}),i=craft.inspectWorkerFeatureCommands();
   const block=await craft.createWorkerExtrusion({revision:i.revision,faceId:rect.faceId,regionId:rect.regionId,depth:20});
   const model=craft.models$.value.find(m=>m.id===block.bodyId),state=JSON.stringify(craft.modifications$.value),ids=craft.models$.value.map(m=>m.id),beforeGeometry=JSON.stringify(model.brepShell.faces.map(f=>f.data.tessellation.data));let invalid=false;
   try{const now=craft.inspectWorkerFeatureCommands();await craft.createWorkerExtrusion({revision:now.revision,faceId:rect.faceId,regionId:rect.regionId,depth:-1})}catch{invalid=true}
   const tris=model.brepShell.faces.flatMap(f=>f.data.tessellation.data.map(item=>item[0])),points=tris.flat(),bounds={min:[0,1,2].map(i=>Math.min(...points.map(p=>p[i]))),max:[0,1,2].map(i=>Math.max(...points.map(p=>p[i])))};const volume=Math.abs(tris.reduce((sum,[a,b,c])=>sum+(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6,0));return {rect,block,bounds,volume,invalid,historySame:state===JSON.stringify(craft.modifications$.value),idsSame:JSON.stringify(ids)===JSON.stringify(craft.models$.value.map(m=>m.id)),geometrySame:beforeGeometry===JSON.stringify(model.brepShell.faces.map(f=>f.data.tessellation.data)),models:craft.models$.value.map(m=>({id:m.id,faces:m.faces.length,engine:m.ext?.workerGeometry?.engine,topologyKeys:Object.keys(m.brepShell||{}),faceKeys:Object.keys(m.faces[0]?.topology||{})})),snapshot:await c.projectManager.snapshotCurrentProject()};
  });
  assert.deepEqual(result.bounds,{min:[0,0,0],max:[100,50,20]});assert.ok(Math.abs(result.volume-100000)<1e-5);assert.equal(result.invalid,true);assert.equal(result.historySame,true);assert.equal(result.idsSame,true);assert.equal(result.geometrySame,true);assert.equal(result.models.filter(x=>x.engine==='occ').length,1);assert.equal(result.models.find(x=>x.engine==='occ').faces,6);
  other=await browser.createBrowserContext();
  const reopened=await fresh(other),again=await reopened.evaluate(async snapshot=>{await __CAD_APP.projectManager.restoreSnapshotInEmptyWorkspace(JSON.stringify(snapshot));return __CAD_APP.craftService.models$.value.map(m=>({id:m.id,faces:m.faces.length,engine:m.ext?.workerGeometry?.engine}));},result.snapshot);
  assert.deepEqual(again.map(x=>x.id),result.models.map(x=>x.id));assert.deepEqual(again.map(x=>x.faces),result.models.map(x=>x.faces));
  delete result.snapshot;console.log(JSON.stringify({result,again}));
 }finally{if(other)await other.close();await ctx.close();browser.disconnect();}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
