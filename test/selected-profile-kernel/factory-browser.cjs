const assert=require('node:assert/strict'),fs=require('node:fs'),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);for(const u of[base,cdp])assert.ok(['127.0.0.1','localhost'].includes(u.hostname));
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:120000}),context=await browser.createBrowserContext();try{
 const page=await context.newPage();const response=await page.goto(new URL('engine-test.html',base));assert.doesNotMatch(response.headers()['content-security-policy'],/'unsafe-eval'|blob:/);
 await page.addScriptTag({url:new URL('factory.bundle.js',base).href});
 const result=await page.evaluate(async()=>{
  const{createCatalogMount,validateEngineMount,CAD_ENGINES,OCC_SELECTED_PROFILE_BUILD}=globalThis.__profileFactoryControl,rows=[];
  let created=0;const GenuineWorker=Worker;window.Worker=class extends GenuineWorker{constructor(...args){super(...args);created++;}};
  for(const spec of[OCC_SELECTED_PROFILE_BUILD,CAD_ENGINES.occ]){
   const mount=createCatalogMount('occ',spec.revision);try{await mount.ready;validateEngineMount('occ',mount,spec.revision);
    const request=spec===OCC_SELECTED_PROFILE_BUILD?{op:'solid.profile.extrude',version:2,unit:'millimeter',frame:{origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]},depth:5,region:{id:'circle-region',outer:[{kind:'circle',id:'circle',center:[0,0],radius:10}],holes:[]}}:{op:'solid.box.create',version:1,unit:'millimeter',origin:[0,0,0],dimensions:[10,10,5]};
    const output=await mount.execute(request);mount.assertSolidBinding(output.handle);const mesh=await mount.readSolidMesh({op:'solid.mesh.read',version:1,handle:output.handle});rows.push({revision:spec.revision,descriptor:mount.descriptor,evidence:output.evidence,triangles:mesh.triangleCount});await mount.execute({op:'solid.dispose',version:1,handle:output.handle});
   }finally{mount.close();}
  }
  const before=created;let refused;try{createCatalogMount('occ','unknown');}catch(e){refused=e.code;}return{rows,unknownRevisionCode:refused,unknownCreatedWorkers:created-before};
 });
 assert.ok(Math.abs(result.rows[0].evidence.nativeVolume-500*Math.PI)<1e-6);assert.equal(result.rows[0].evidence.nativeValidity.valid,true);assert.ok(Math.abs(result.rows[1].evidence.signedVolume-500)<1e-6);assert.equal(result.rows[1].triangles,12);assert.equal(result.unknownRevisionCode,'ENGINE_REVISION_MISMATCH');assert.equal(result.unknownCreatedWorkers,0);
 const inspector=await browser.target().createCDPSession(),until=Date.now()+5000;let live;do{live=(await inspector.send('Target.getTargets')).targetInfos.filter(t=>t.type==='worker'&&t.url.startsWith(base.href));if(live.length)await new Promise(r=>setTimeout(r,20));}while(live.length&&Date.now()<until);assert.equal(live.length,0);await inspector.detach();
 const receipt={scope:'Actual compiled shared catalog factory, explicit profile revision and retained default; no Craft/history/public app claim',result:'PASS',...result,liveOwnedWorkers:0};if(process.env.CODI_RECEIPT)fs.writeFileSync(process.env.CODI_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log('PASS actual catalog explicit profile + retained default + unknown revision refusal');
}finally{await context.close();browser.disconnect();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
