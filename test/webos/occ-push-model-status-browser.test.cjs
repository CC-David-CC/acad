// Real OCC registration positive; a test-only nonzero adapter return probes
// wrapper/proxy propagation without feeding invalid pointers to the kernel.
const assert=require('node:assert/strict'),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL||'http://127.0.0.1:19982/'),cdp=new URL(process.env.CODI_TEST_CDP||'http://127.0.0.1:19983/');
if(![base,cdp].every(u=>['127.0.0.1','localhost','[::1]'].includes(u.hostname)))throw Error('Loopback only');
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:120000}),context=await browser.createBrowserContext();try{
 const page=await context.newPage();await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base));await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});
 const out=await page.evaluate(async()=>{const c=__CAD_APP;await new Promise((resolve,reject)=>c.craftService.modify({type:'BOX',params:{featureId:1,x:3,y:4,z:5}},resolve,reject));const box=c.craftService.models$.value[0],ptr=box.topology.data.externals.ptr,engine=c.occService.engineInterface.io,occ=c.occService.io,oci=c.occService.commandInterface;
  const status=engine.pushModel({name:'CodiDirectRegistration',operand:ptr}),actual=occ.getShell('CodiDirectRegistration');
  const originalPush=engine.pushModel,originalCall=Module._CallCommand;let calls=0,registrations=0,wrapper,proxy,second;
  try{Module._CallCommand=function(...a){calls++;return originalCall.apply(this,a)};engine.pushModel=()=>{registrations++;return 7};
   try{occ.pushModel(box,'CodiInjectedFailure');wrapper='accepted'}catch(e){wrapper=e.code||String(e)}
   try{oci.copy(box,'CodiShouldNotBeProduced');proxy='accepted'}catch(e){proxy=e.code||String(e)}
   try{oci.copy(box,'CodiShouldNotBeProduced');second='accepted'}catch(e){second=e.code||String(e)}
  }finally{engine.pushModel=originalPush;Module._CallCommand=originalCall;}
  const copyStatus=oci.copy(box,'CodiVerifiedCopy'),copyFaces=occ.getShell('CodiVerifiedCopy').faces.length;
  return {status,faces:actual.faces.length,wrapper,proxy,second,calls,registrations,copyStatus,copyFaces};});
 console.log('OCC_PUSH_STATUS',JSON.stringify(out));assert.equal(out.status,0);assert.equal(out.faces,6);assert.equal(out.wrapper,'LEGACY_GEOMETRY_UNAVAILABLE');assert.equal(out.proxy,'LEGACY_GEOMETRY_UNAVAILABLE');assert.equal(out.second,'LEGACY_GEOMETRY_UNAVAILABLE');assert.equal(out.calls,0);assert.equal(out.registrations,3);assert.equal(out.copyStatus,0);assert.equal(out.copyFaces,6);console.log('PASS real OCC registration status and injected nonzero wrapper/proxy refusal without cache reuse');
}finally{await context.close();browser.disconnect()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
