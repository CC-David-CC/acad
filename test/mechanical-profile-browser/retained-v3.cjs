// Test-only constructor retarget of the retained V3 driver; mathematical and refusal assertions unchanged.
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const required=name=>{assert(process.env[name],name+' required');return process.env[name];};
const pins=JSON.parse(fs.readFileSync(required('CODI_COMPONENT_PINS'),'utf8')),base=new URL(pins.baseURL),cdp=new URL(required('CODI_TEST_CDP'));
for(const u of[base,cdp])assert(['127.0.0.1','localhost'].includes(u.hostname));
const puppeteerRoot=required('PUPPETEER_CORE_PATH'),puppeteerPackage=JSON.parse(fs.readFileSync(path.join(puppeteerRoot,'package.json'),'utf8'));assert.equal(puppeteerPackage.name,'puppeteer-core');assert.equal(puppeteerPackage.version,'24.35.0');const puppeteer=require(puppeteerRoot);
const reviewSource=Object.fromEntries(['retained-v3.cjs','../polygon-profile-v3-browser/browser.cjs','../polygon-profile-v3-browser/cases.mjs','../polygon-profile-v3-browser/oracle.mjs'].map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,p))).digest('hex')]));
const receipt={status:'RUNNING',scope:'Retained unchanged eight-case V3 geometry/provenance corpus on actual mechanical-profile Chromium Worker; no public authored/sketch/history/Files qualification',node:process.version,puppeteer:puppeteerPackage.version,reviewSource,pins,assets:{},rows:[]};
(async()=>{
 const {cases,invalidRequests}=await import('../polygon-profile-v3-browser/cases.mjs'),{inspectAncestry,inspectSourceBindings,near}=await import('../polygon-profile-v3-browser/oracle.mjs');
 // Exact source-pinned assets before any browser context; no old build can be
 // silently relabeled. Caller supplies the final root-approved frozen pins.
 assert(Object.keys(pins.assets).length>=5);for(const [name,expected]of Object.entries(pins.assets)){
  const response=await fetch(new URL(name,base));assert.equal(response.status,200,name);const h=crypto.createHash('sha256');let bytes=0;
  for await(const part of response.body){h.update(part);bytes+=part.length;}
  const sha256=h.digest('hex');assert.equal(sha256,expected.sha256,name);if(expected.bytes!==undefined)assert.equal(bytes,expected.bytes,name);receipt.assets[name]={sha256,bytes};
 }
 const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:240000}),context=await browser.createBrowserContext();
 try{
  receipt.chromium=await browser.version();const page=await context.newPage();await page.evaluateOnNewDocument(()=>{window.probeCsp=[];document.addEventListener('securitypolicyviolation',e=>window.probeCsp.push({directive:e.violatedDirective,blockedURI:e.blockedURI}));});
  const response=await page.goto(new URL(pins.pagePath,base));assert.equal(response.status(),200);assert.doesNotMatch(response.headers()['content-security-policy']??'',/'unsafe-eval'/);assert.ok(response.headers()['content-security-policy'],'Actual CSP header required');
  receipt.observed=await page.evaluate(async({pins,cases,invalidRequests})=>{
   const {createMechanicalProfileOccMount}=await import(pins.constructorPath),GenuineWorker=window.Worker,workers=[];
   window.Worker=class extends GenuineWorker{constructor(...args){super(...args);this.record={url:String(args[0]),posts:0,terminated:false};workers.push(this.record);}postMessage(...args){this.record.posts++;return super.postMessage(...args);}terminate(){this.record.terminated=true;return super.terminate();}};
   const start=async()=>{const mount=createMechanicalProfileOccMount(pins.mountOptions);const t=performance.now();try{await mount.ready;return{mount,initMs:performance.now()-t};}catch(e){mount.close();throw e;}};
   const mesh=async(mount,handle)=>{const m=await mount.readSolidMesh({op:'solid.mesh.read',version:1,handle});return{...m,buffer:undefined,coordinates:Array.from(new Float64Array(m.buffer))};};
   const topology=(mount,handle)=>mount.execute({op:'solid.topology.read',version:1,handle});
   const classify=(mount,handle,point)=>mount.execute({op:'solid.point.classify',version:1,unit:'millimeter',handle,point});
   const rows=[];
   try{
    for(const c of cases){const f=await start(),row={id:c.id,initMs:f.initMs};try{
     const source=JSON.stringify(c.request),t=performance.now(),result=await f.mount.execute(c.request);row.operationMs=performance.now()-t;row.result=result;
     row.sourcePreserved=JSON.stringify(c.request)===source;row.topology=await topology(f.mount,result.handle);row.mesh=await mesh(f.mount,result.handle);
     row.classification=[];for(const [expected,points]of[['inside',c.material],['outside',c.void],['boundary',c.boundary]])for(const point of points)row.classification.push({point,expected,actual:await classify(f.mount,result.handle,point)});
     await f.mount.dispose({op:'solid.dispose',version:1,handle:result.handle});row.disposed=true;try{await topology(f.mount,result.handle);}catch(e){row.staleCode=e.code;}
    }catch(e){row.error={code:e.code??null,message:e.message};}finally{f.mount.close();}rows.push(row);}
    const aMount=await start();let bMount,foreign;try{bMount=await start();
     const a=await aMount.mount.execute(cases[0].request),b=await bMount.mount.execute(cases[2].request);const before=await topology(bMount.mount,b.handle);let error;
     try{await topology(bMount.mount,a.handle);}catch(e){error={code:e.code??null,message:e.message};}
     foreign={error,ownTopologyPreserved:JSON.stringify(before)===JSON.stringify(await topology(bMount.mount,b.handle))};
     await aMount.mount.dispose({op:'solid.dispose',version:1,handle:a.handle});await bMount.mount.dispose({op:'solid.dispose',version:1,handle:b.handle});
    }finally{aMount.mount.close();bMount?.mount.close();}
    const f=await start();let preservation;try{
     const original=await f.mount.execute(cases[0].request),beforeTopology=await topology(f.mount,original.handle),beforeMesh=await mesh(f.mount,original.handle),rejections=[];
     for(const c of invalidRequests){const source=JSON.stringify(c.request);let error;try{await f.mount.execute(c.request);}catch(e){error={code:e.code??null,message:e.message};}rejections.push({id:c.id,error,sourcePreserved:source===JSON.stringify(c.request)});}
     const afterTopology=await topology(f.mount,original.handle),afterMesh=await mesh(f.mount,original.handle);
     preservation={rejections,topologyPreserved:JSON.stringify(beforeTopology)===JSON.stringify(afterTopology),meshPreserved:JSON.stringify(beforeMesh)===JSON.stringify(afterMesh)};
     await f.mount.dispose({op:'solid.dispose',version:1,handle:original.handle});
    }finally{f.mount.close();}
    // Hold a genuine successful result message; no result values are replaced.
    const TrackingWorker=window.Worker;let held,acceptHeld;const heldReply=new Promise(resolve=>acceptHeld=resolve);window.Worker=class extends TrackingWorker{constructor(...args){super(...args);let listener;Object.defineProperty(this,'onmessage',{configurable:true,get(){return listener;},set(fn){listener=fn;}});this.addEventListener('message',event=>{if(event.data?.kind==='result'){held=()=>listener?.call(this,event);acceptHeld(event.data);}else listener?.call(this,event);});}};
    let late;try{const f=await start();try{const controller=new AbortController(),pending=f.mount.execute(cases[0].request,{signal:controller.signal}).then(()=>({ok:true}),e=>({ok:false,code:e.code})),genuine=await heldReply;controller.abort();const outcome=await pending;held();let retry;try{await f.mount.execute(cases[0].request);}catch(e){retry=e.code;}late={genuine,outcome,retry};}finally{f.mount.close();}}finally{window.Worker=TrackingWorker;}
    return{rows,preservation,foreign,late,workers,csp:window.probeCsp};
   }finally{window.Worker=GenuineWorker;}
  },{pins,cases,invalidRequests});
  for(const row of receipt.observed.rows){const expected=cases.find(c=>c.id===row.id);assert(!row.error,JSON.stringify(row.error));assert.equal(row.sourcePreserved,true);assert.equal(row.disposed,true);assert.equal(row.staleCode,'INVALID_HANDLE');const result=row.result;
   assert.equal(result.evidence.nativeValidity.valid,true);assert.equal(result.evidence.solidCount,1);near(result.evidence.nativeVolume,expected.volume);for(const k of['min','max'])for(let i=0;i<3;i++)near(result.evidence.nativeBounds[k][i],expected.bounds[k][i]);
   assert.deepEqual(Object.keys(row.topology).sort(),['catalog','contractVersion','op','unit']);assert.equal(row.topology.contractVersion,1);assert.equal(row.topology.op,'solid.topology.read');assert.equal(row.topology.unit,'millimeter');
   assert.equal(result.constructionProvenance.status,'available');const nativeRequest=inspectSourceBindings(expected.request,result.constructionProvenance);row.ancestry=inspectAncestry(nativeRequest,row.topology.catalog,result.constructionProvenance.data);
   if(row.id==='reversed-triangle')assert(result.constructionProvenance.sourceBinding.nativeSlotBindings[0].edges.every(e=>e.nativeReversed===true));
   for(const c of row.classification){assert.deepEqual(Object.keys(c.actual).sort(),['classification','contractVersion','op','unit']);assert.equal(c.actual.contractVersion,1);assert.equal(c.actual.op,'solid.point.classify');assert.equal(c.actual.unit,'millimeter');assert.equal(c.actual.classification,c.expected,JSON.stringify(c));}
   const coordinates=row.mesh.coordinates;assert.ok(coordinates.length>0&&coordinates.length%9===0&&coordinates.every(Number.isFinite));assert.equal(row.mesh.triangleCount,coordinates.length/9);
   let signedVolume=0;for(let i=0;i<coordinates.length;i+=9){const t=coordinates.slice(i,i+9);signedVolume+=(t[0]*(t[4]*t[8]-t[5]*t[7])+t[1]*(t[5]*t[6]-t[3]*t[8])+t[2]*(t[3]*t[7]-t[4]*t[6]))/6;for(let j=0;j<9;j++){const k=j%3;assert(t[j]>=expected.bounds.min[k]-1e-6&&t[j]<=expected.bounds.max[k]+1e-6);}}
   assert(signedVolume>0);if(!expected.request.region.holes.some(loop=>loop[0].kind==='circle')&&expected.request.region.outer[0].kind!=='circle')near(signedVolume,expected.volume);else assert(Math.abs(signedVolume-expected.volume)/expected.volume<0.01,'Circle display is only approximate');
   row.mesh.independentSignedVolume=signedVolume;row.mesh.float64SHA256=crypto.createHash('sha256').update(Buffer.from(new Float64Array(coordinates).buffer)).digest('hex');delete row.mesh.coordinates;
   receipt.rows.push({id:row.id,status:'PASS',nativeVolume:result.evidence.nativeVolume,ancestry:row.ancestry});
  }
  const p=receipt.observed.preservation;assert(p.topologyPreserved&&p.meshPreserved);for(const row of p.rejections){assert(row.error?.code,JSON.stringify(row));assert(row.sourcePreserved);}
  assert.equal(receipt.observed.foreign.error?.code,'INVALID_HANDLE');assert.equal(receipt.observed.foreign.ownTopologyPreserved,true);
  assert.equal(receipt.observed.late.outcome.code,'CANCELLED');assert.equal(receipt.observed.late.retry,'MOUNT_CLOSED');near(receipt.observed.late.genuine.evidence.nativeVolume,500);assert(receipt.observed.workers.every(w=>w.terminated));assert.deepEqual(receipt.observed.csp,[]);
  const session=await browser.target().createCDPSession();try{const until=Date.now()+5000;let live;do{live=(await session.send('Target.getTargets')).targetInfos.filter(t=>t.type==='worker'&&t.url.startsWith(base.href));if(live.length)await new Promise(r=>setTimeout(r,25));}while(live.length&&Date.now()<until);assert.equal(live.length,0);receipt.liveOwnedWorkerTargets=0;}finally{await session.detach();}
  receipt.status='PASS';console.log(JSON.stringify({status:receipt.status,rows:receipt.rows,workers:receipt.observed.workers.length}));
 }finally{await context.close();browser.disconnect();}
})().catch(e=>{receipt.status='FAIL';receipt.error={message:e.message,stack:e.stack};console.error(e.stack);process.exitCode=1;}).finally(()=>{if(process.env.CODI_RECEIPT)fs.writeFileSync(process.env.CODI_RECEIPT,JSON.stringify(receipt,null,2)+'\n');});
