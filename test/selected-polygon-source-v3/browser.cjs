const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);if(![base,cdp].every(u=>['127.0.0.1','localhost','[::1]'].includes(u.hostname)))throw Error('Private loopback only');
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:120000}),context=await browser.createBrowserContext();try{
 const page=await context.newPage();await page.goto(new URL('test/selected-polygon-source-v3/index.html',base));const rows=[];
 for(const name of ['triangle','rotated','L','mixed','nested-disjoint','xz','legacy-rectangle','legacy-triangle','gap','intersect','arc','aggregate-cap','capture']){
  const value=await page.evaluate(async name=>{const worker=new Worker('worker.mjs',{type:'module'});try{return await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Preparation Worker timeout')),30000);worker.onmessage=e=>{clearTimeout(timer);resolve(e.data)};worker.onerror=e=>{clearTimeout(timer);reject(Error(e.message))};worker.postMessage({case:name});});}finally{worker.terminate();}},name);
  assert.equal(value.case,name);assert.equal(value.dedicatedWorker,true);assert.equal(value.sourceUnchanged,true);assert.ok(!value.resources.some(u=>/[.]wasm(?:[?#]|$)/.test(u)));
  const expected={'legacy-triangle':'UNSUPPORTED_PROFILE',gap:'OPEN_OR_AMBIGUOUS_PROFILE',intersect:'UNSUPPORTED_REGION_TOPOLOGY',arc:'UNSUPPORTED_PROFILE','aggregate-cap':'UNSUPPORTED_PROFILE'}[name];
  if(expected){assert.equal(value.error?.code,expected);assert.equal(value.plan,undefined);assert.equal(value.digests,1);}
  else{
   assert.equal(value.error,undefined);assert.equal(value.deepFrozen,true);assert.equal(value.plan.version,name==='legacy-rectangle'?2:3);assert.equal(value.digests,name==='capture'?1:2);
   const volume={triangle:1500,rotated:1000,L:12000,mixed:(2300-9*Math.PI)*5,'nested-disjoint':(10000-900*Math.PI)*5,xz:1500,'legacy-rectangle':500,capture:1500}[name];assert.ok(Math.abs(value.plan.expected.volume-volume)<1e-8);
   if(name!=='capture')assert.equal(value.inspection.regions.length,{mixed:3,'nested-disjoint':4}[name]||1);
   if(name==='capture')assert.equal(value.plan.frame.origin[0],0);
   if(name==='xz')assert.deepEqual(value.plan.expected.bounds,{min:[3,-1,5],max:[33,4,25]});
  }rows.push(value);
 }
 const pins={};for(const file of ['modules/engine/extrusion/selectedSketchProfile.mjs','modules/engine/mount/polygonProfilePlan.mjs','modules/engine/extrusion/simplePolygon.mjs','modules/engine/mount/selectedProfilePlan.mjs','modules/workbenches/modeler/features/extrude/authoredRegions.mjs','modules/workbenches/modeler/features/extrude/profilePlan.mjs','test/selected-polygon-source-v3/worker.mjs','test/selected-polygon-source-v3/fixtures.mjs','test/selected-region-discovery/fixtures.mjs']){const response=await fetch(new URL(file,base));assert.equal(response.status,200);pins[file]=crypto.createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex');}
 const receipt={source:process.env.CODI_SOURCE,status:'PASS',rows,pins,scope:'Actual Chromium dedicated module Workers executing source preparation; explicit native-v3 fixtures, no solver/native/public CAD/Files qualification'};fs.writeFileSync(process.env.CODI_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log('PASS13 actual Chromium preparation Workers: V3 polygons/mixed/nested/frame/domain/capture and V2 retention');
}finally{await context.close();browser.disconnect();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
