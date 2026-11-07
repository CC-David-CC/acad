const assert=require('node:assert/strict'),puppeteer=require('puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL||'http://127.0.0.1:19877/'),cdp=new URL(process.env.CODI_TEST_CDP||'http://127.0.0.1:19875');
if(![base,cdp].every(u=>['127.0.0.1','localhost','[::1]'].includes(u.hostname)))throw Error('Loopback required');
(async()=>{const b=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:120000}),c=await b.createBrowserContext();try{
 async function page(){const p=await c.newPage();if(process.env.CODI_PHONE)await p.setViewport({width:430,height:932,isMobile:true,hasTouch:true});const r=await p.goto(new URL('index-webos.html?DEFAULT&webos=1',base).href);assert.doesNotMatch(r.headers()['content-security-policy']||'',/'unsafe-eval'/);await p.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});return p}
 const p=await page();const result=await p.evaluate(async()=>{
  const ctx=__CAD_APP,s=ctx.services.blockLearning;let v=s.inspect(),stale=false,invalid=false,guarded=false;let step='init';try{
  try{await s.create(v.revision,{x:0,y:40,z:10})}catch{invalid=true}
  try{await s.create(v.revision,{x:60,y:40,z:10},{valid:()=>false})}catch{guarded=true}
  step='create';v=s.inspect();const block=await s.create(v.revision,{x:60,y:40,z:10});
  try{await s.scale(v.revision,2)}catch{stale=true}
  step='scale';const scaled=await s.scale(block.revision,2);step='undo';const undo=await s.travel(scaled.revision,'undo');step='redo';const redo=await s.travel(undo.revision,'redo');
  const snapshot=ctx.projectManager.snapshotCurrentProject();const getMetadata=ctx.projectManager.getManufacturingMetadata;ctx.projectManager.getManufacturingMetadata=()=>({});let materialRefused=false;try{s.inspect()}catch{materialRefused=true}finally{ctx.projectManager.getManufacturingMetadata=getMetadata}return {invalid,guarded,stale,block,scaled,undo,redo,snapshot,materialRefused};}catch(e){throw Error(step+': '+e.message)}
 });
 assert.equal(result.invalid,true);assert.equal(result.guarded,true);assert.equal(result.materialRefused,true);assert.equal(result.stale,true);assert.equal(result.block.block.unit,'millimeter');assert.equal(result.block.block.volumeUnit,'cubic-millimeter');
 for(const [item,expected] of [[result.block,[60,40,10]],[result.scaled,[120,80,20]],[result.undo,[60,40,10]],[result.redo,[120,80,20]]])for(const [i,k] of ['x','y','z'].entries())assert.ok(Math.abs(item.block.dimensions[k]-expected[i])<1e-6);
 const q=await page();const restored=await q.evaluate(async ({snapshot,oldToken})=>{await __CAD_APP.projectManager.restoreSnapshotInEmptyWorkspace(JSON.stringify(snapshot));const s=__CAD_APP.services.blockLearning;let foreign=false;try{await s.scale(oldToken,2)}catch{foreign=true}return {...s.inspect(),foreign}},{snapshot:result.snapshot,oldToken:result.redo.revision});assert.equal(restored.foreign,true);
 assert.deepEqual(restored.block.dimensions,result.redo.block.dimensions);assert.equal(restored.block.bodyId,result.redo.block.bodyId);assert.ok(Math.abs(result.block.block.volume-24000)<1e-6);assert.ok(Math.abs(result.redo.block.volume-192000)<1e-6);console.log('PASS empty-document block create, size change, undo/redo and snapshot reopen');
 }finally{await c.close();b.disconnect()}})().catch(e=>{console.error(e);process.exitCode=1});
