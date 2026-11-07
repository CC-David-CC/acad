const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);if(![base,cdp].every(u=>['127.0.0.1','localhost','[::1]'].includes(u.hostname)))throw Error('Loopback only');
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:120000}),context=await browser.createBrowserContext();try{
 const p=await context.newPage();await p.goto(new URL('test/selected-region-discovery/index.html',base));const rows=[];
 for(const name of['nested','disjoint','mixed','hole-cap','max-loops','utf8-over','arc','touch','digest']){
  const value=await p.evaluate(async name=>{const worker=new Worker('worker.mjs',{type:'module'});let value,terminated=false;try{value=await new Promise((resolve,reject)=>{worker.onmessage=e=>resolve(e.data);worker.onerror=e=>reject(Error(e.message));worker.postMessage({case:name});});}finally{worker.terminate();terminated=true;}return{...value,terminated};},name);
  assert.equal(value.case,name);assert.equal(value.dedicatedWorker,true);assert.equal(value.terminated,true);assert.equal(value.sourceUnchanged,true);assert.ok(!value.resources.some(url=>/[.]wasm(?:[?#]|$)/.test(url)));
  const positive={nested:[3,3],disjoint:[2,2],mixed:[3,3],'hole-cap':[10,9],'max-loops':[128,128]}[name];
  if(positive){assert.equal(value.error,undefined);assert.equal(value.deepFrozen,true);assert.equal(value.digests,1);assert.equal(value.result.regions.length,positive[0]);assert.equal(value.result.regions.filter(r=>r.support==='supported').length,positive[1]);}
  else{assert.equal(value.result,undefined);assert.equal(value.error.code,{'utf8-over':'INVALID_REQUEST',arc:'UNSUPPORTED_PROFILE',touch:'UNSUPPORTED_REGION_TOPOLOGY',digest:'STALE_SKETCH'}[name]);assert.equal(value.digests,name==='utf8-over'?0:1);}
  rows.push(value);
 }
 const files=['modules/engine/extrusion/selectedSketchProfile.mjs','modules/engine/mount/selectedProfilePlan.mjs','modules/workbenches/modeler/features/extrude/authoredRegions.mjs','modules/workbenches/modeler/features/extrude/profilePlan.mjs','test/selected-region-discovery/worker.mjs','test/selected-region-discovery/fixtures.mjs'],pins={};
 for(const file of files){const response=await fetch(new URL(file,base));assert.equal(response.status,200);pins[file]=crypto.createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex');}
 const receipt={source:process.env.CODI_SOURCE,rows,pins,scope:'Actual Chromium module Workers executing geometry-support discovery on explicit native-data fixtures; no sketch solver admission, native kernel, public desktop or Files proof'};if(process.env.CODI_RECEIPT)fs.writeFileSync(process.env.CODI_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log('PASS actual Chromium discovery Worker9/9, one digest per admitted source, frozen results, local caps and exact global refusals');
}finally{await context.close();browser.disconnect();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
