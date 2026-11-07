// Actual native restore APIs, including the Blob validation-worker path.
const assert=require('node:assert/strict'),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL||'http://127.0.0.1:19982/'),cdp=new URL(process.env.CODI_TEST_CDP||'http://127.0.0.1:19983/');
if(![base,cdp].every(u=>['127.0.0.1','localhost','[::1]'].includes(u.hostname)))throw Error('Loopback only');
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:120000}),context=await browser.createBrowserContext();try{
 for(const bytes of [false,true])for(const length of [1024,1025]){const page=await context.newPage();try{
  await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base));await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});
  const result=await page.evaluate(async({bytes,length})=>{const m=__CAD_APP.projectManager,before=JSON.stringify(m.snapshotCurrentProject()),e=JSON.parse(before),prefix='worker-prism:1:["feature","face","LID","',suffix='"]',id=prefix+'a'.repeat(length-prefix.length-suffix.length)+suffix;e.project.sketches=[{id,data:{version:3,objects:[],dimensions:[],labels:[],stages:[{constraints:[],generators:[]}],constants:''}}];try{if(bytes)await m.restoreSnapshotBytesInEmptyWorkspace(new Blob([JSON.stringify(e)]));else await m.restoreSnapshotInEmptyWorkspace(JSON.stringify(e));return {ok:true,id,ids:m.snapshotCurrentProject().project.sketches.map(x=>x.id)};}catch(err){return {ok:false,error:String(err),unchanged:before===JSON.stringify(m.snapshotCurrentProject())};}}, {bytes,length});
  if(length===1024){assert.equal(result.ok,true,result.error);assert.equal(result.id.length,1024);assert.deepEqual(result.ids,[result.id]);}else{assert.equal(result.ok,false);assert.match(result.error,/invalid sketch/i);assert.equal(result.unchanged,true);}
 }finally{await page.close();}}
 console.log('PASS actual native JSON/Blob restore preserves 1024-character sketch IDs and rejects 1025 before import');
}finally{await context.close();browser.disconnect()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
