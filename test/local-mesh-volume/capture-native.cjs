// Own strict-CSP native Worker component observation only; no public CAD UI,
// source seeds, fake native mesh/catalog or active shared-browser connection.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const ppRoot='/path/to/workspace/CodiServer/desktop-preview/SIMPLIFIED/tests/node_modules/puppeteer-core',pp=require(ppRoot);
const component=process.env.CODI_COMPONENT_ROOT,base=new URL(process.env.CODI_COMPONENT_URL),output=process.env.CODI_RECEIPT;
assert(component&&output);assert.equal(base.hostname,'127.0.0.1');assert.equal(JSON.parse(fs.readFileSync(path.join(ppRoot,'package.json'))).version,'24.35.0');
const manifestRaw=fs.readFileSync(path.join(component,'component.json')),manifest=JSON.parse(manifestRaw),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.equal(manifest.jsSha256,'b3d91cbb02f90ba56732039283d787b92eda97c51091fafbd933ecf4db30dd97');assert.equal(manifest.wasmSha256,'28e8e2c2752cef100a98e24ec487f7d90021edb98fb060fdd1160fe63501bbe2');
const receipt={status:'RUNNING',scope:'Fresh owned Chromium observation of actual frozen native component mesh; no public app qualification',manifestSHA256:sha(manifestRaw),assetPins:manifest.files,driverSHA256:sha(fs.readFileSync(__filename)),rows:[]};
(async()=>{
 for(const [name,pin]of Object.entries(manifest.files)){const r=await fetch(new URL(name,base));assert.equal(r.status,200);const hash=crypto.createHash('sha256');let bytes=0;for await(const chunk of r.body){hash.update(chunk);bytes+=chunk.length}assert.equal(hash.digest('hex'),pin.sha256,name);assert.equal(bytes,pin.bytes,name)}
 const profile=fs.mkdtempSync('/path/to/workspace/snap/chromium/common/codi-volume-component-');receipt.profile=profile;
 let browser;try{
  browser=await pp.launch({executablePath:'/snap/bin/chromium',headless:true,userDataDir:profile,args:['--no-sandbox','--disable-gpu','--use-angle=swiftshader-webgl']});receipt.chromium=await browser.version();receipt.ownedPid=browser.process().pid;
  const page=await browser.newPage();await page.evaluateOnNewDocument(()=>{window.componentCsp=[];document.addEventListener('securitypolicyviolation',e=>window.componentCsp.push({directive:e.violatedDirective,blockedURI:e.blockedURI}))});const r=await page.goto(new URL('index.html',base));assert(r.headers()['content-security-policy']);
  const observed=await page.evaluate(async()=>{
   const {createMechanicalProfileOccMount}=await import('/modules/engine/mount/occ-mechanical-profile-mount.mjs'),rows=[];
   for(const c of[{id:'tiny-large-origin',origin:[1e6,1e6,1e6],dimensions:[1e-6,2e-6,3e-6]},{id:'tiny-origin',origin:[0,0,0],dimensions:[1e-6,2e-6,3e-6]},{id:'ordinary-translated',origin:[-13,7,2],dimensions:[11,17,23]}]){
    const mount=createMechanicalProfileOccMount({workerUrl:'/modules/engine/mount/mechanical-profile-worker.js',jsPath:'/mechanical-profile-occ-portable.js',wasmPath:'/mechanical-profile-occ.wasm'}),request={op:'solid.box.create',version:1,unit:'millimeter',origin:c.origin,dimensions:c.dimensions},before=JSON.stringify(request);
    try{await mount.ready;const result=await mount.execute(request),mesh=await mount.execute({op:'solid.mesh.read',version:1,handle:result.handle});rows.push({id:c.id,request,evidence:result.evidence,meshEvidence:mesh.evidence,triangleCount:mesh.triangleCount,positions:Array.from(new Float64Array(mesh.buffer)),requestPreserved:before===JSON.stringify(request)});await mount.dispose({op:'solid.dispose',version:1,handle:result.handle});rows.at(-1).disposed=true}finally{mount.close()}
   }return{rows,csp:window.componentCsp};
  });receipt.rows=observed.rows;assert.deepEqual(observed.csp,[]);receipt.csp=observed.csp;
  for(const row of receipt.rows){assert(row.requestPreserved&&row.disposed);assert(row.evidence.nativeValidity.valid);assert.equal(row.evidence.solidCount,1);assert.equal(row.positions.length,row.triangleCount*9);assert.equal(row.triangleCount,12)}
  const session=await browser.target().createCDPSession();let live=[];try{const deadline=Date.now()+5000;do{live=(await session.send('Target.getTargets')).targetInfos.filter(t=>t.type==='worker'&&t.url.startsWith(base.href));if(live.length)await new Promise(r=>setTimeout(r,25))}while(live.length&&Date.now()<deadline);assert.equal(live.length,0);receipt.liveOwnedWorkers=0}finally{await session.detach()}
  receipt.status='PASS';
 }finally{if(browser)await browser.close();fs.rmSync(profile,{recursive:true,force:true});receipt.ownedBrowserClosed=true;receipt.profileRemoved=!fs.existsSync(profile)}
})().catch(error=>{receipt.status='FAIL';receipt.error={message:error.message,stack:error.stack};process.exitCode=1}).finally(()=>{fs.writeFileSync(output,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({status:receipt.status,rows:receipt.rows.map(r=>({id:r.id,native:r.evidence.nativeVolume,oldIntegral:r.evidence.signedVolume})),error:receipt.error}))});
