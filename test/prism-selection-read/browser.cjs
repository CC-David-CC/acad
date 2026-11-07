const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const required=name=>{assert(process.env[name],name+' required');return process.env[name];};
const pins=JSON.parse(fs.readFileSync(required('CODI_COMPONENT_PINS'),'utf8')),base=new URL(pins.baseURL);assert(['127.0.0.1','localhost'].includes(base.hostname));
const puppeteerRoot=required('PUPPETEER_CORE_PATH'),puppeteerPackage=JSON.parse(fs.readFileSync(path.join(puppeteerRoot,'package.json'),'utf8'));assert.equal(puppeteerPackage.name,'puppeteer-core');assert.equal(puppeteerPackage.version,'24.35.0');const puppeteer=require(puppeteerRoot);
const reviewSource=Object.fromEntries(['browser.cjs','../polygon-profile-v3-browser/cases.mjs','../polygon-profile-v3-browser/oracle.mjs'].map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,p))).digest('hex')]));
const receipt={status:'RUNNING',scope:'Actual isolated Chromium Worker prism-selection read component; no public ledger/authoring/Files or edge-treatment qualification',node:process.version,puppeteer:puppeteerPackage.version,reviewSource,pins,assets:{},rows:[]};
(async()=>{
 const {cases,invalidRequests}=await import('../polygon-profile-v3-browser/cases.mjs'),{inspectAncestry,inspectSourceBindings,near}=await import('../polygon-profile-v3-browser/oracle.mjs');
 const paired=structuredClone(cases[0]);paired.id='same-authored-IDs-reversed';paired.selectionFeatureId=100;paired.request.region.outer=paired.request.region.outer.slice().reverse().map(c=>({...c,a:c.b,b:c.a}));cases.push(paired);
 // Exact source-pinned assets before any browser context; no old build can be
 // silently relabeled. Caller supplies the final root-approved frozen pins.
 assert(Object.keys(pins.assets).length>=5);for(const [name,expected]of Object.entries(pins.assets)){
  const response=await fetch(new URL(name,base));assert.equal(response.status,200,name);const h=crypto.createHash('sha256');let bytes=0;
  for await(const part of response.body){h.update(part);bytes+=part.length;}
  const sha256=h.digest('hex');assert.equal(sha256,expected.sha256,name);if(expected.bytes!==undefined)assert.equal(bytes,expected.bytes,name);receipt.assets[name]={sha256,bytes};
 }
 const profile=fs.mkdtempSync('/path/to/workspace/snap/chromium/common/codi-prism-selection-');let browser;
 try{browser=await puppeteer.launch({executablePath:required('CODI_OWN_CHROME_EXECUTABLE'),headless:true,userDataDir:profile,args:['--no-sandbox','--disable-gpu','--use-angle=swiftshader-webgl'],protocolTimeout:240000});}catch(e){fs.rmSync(profile,{recursive:true,force:true});throw e;}
 receipt.ownedBrowserPID=browser.process().pid;const context=await browser.createBrowserContext();
 try{
  receipt.chromium=await browser.version();const page=await context.newPage();await page.evaluateOnNewDocument(()=>{window.probeCsp=[];document.addEventListener('securitypolicyviolation',e=>window.probeCsp.push({directive:e.violatedDirective,blockedURI:e.blockedURI}));});
  const response=await page.goto(new URL(pins.pagePath,base));assert.equal(response.status(),200);assert.doesNotMatch(response.headers()['content-security-policy']??'',/'unsafe-eval'/);assert.ok(response.headers()['content-security-policy'],'Actual CSP header required');
  receipt.observed=await page.evaluate(async({pins,cases,invalidRequests})=>{
   const {createPolygonProfileOccMount}=await import(pins.constructorPath),GenuineWorker=window.Worker,workers=[];
   window.Worker=class extends GenuineWorker{constructor(...args){super(...args);this.record={url:String(args[0]),posts:0,terminated:false};workers.push(this.record);}postMessage(...args){this.record.posts++;return super.postMessage(...args);}terminate(){this.record.terminated=true;return super.terminate();}};
   const start=async()=>{const mount=createPolygonProfileOccMount(pins.mountOptions);const t=performance.now();try{await mount.ready;return{mount,initMs:performance.now()-t};}catch(e){mount.close();throw e;}};
   const mesh=async(mount,handle)=>{const m=await mount.readSolidMesh({op:'solid.mesh.read',version:1,handle});return{...m,buffer:undefined,coordinates:Array.from(new Float64Array(m.buffer))};};
   const topology=(mount,handle)=>mount.execute({op:'solid.topology.read',version:1,handle});
   const classify=(mount,handle,point)=>mount.execute({op:'solid.point.classify',version:1,unit:'millimeter',handle,point});
   const rows=[];
   try{
    for(const c of cases){const f=await start(),row={id:c.id,initMs:f.initMs,selectionFeatureId:c.selectionFeatureId??100+cases.indexOf(c)};try{
     const source=JSON.stringify(c.request),t=performance.now(),result=await f.mount.execute(c.request);row.operationMs=performance.now()-t;row.result=result;
     row.sourcePreserved=JSON.stringify(c.request)===source;row.topology=await topology(f.mount,result.handle);row.mesh=await mesh(f.mount,result.handle);
     const query={op:'solid.prism.selections.read',version:1,handle:result.handle,featureId:row.selectionFeatureId};row.selection=await f.mount.execute(query);row.repeatedSelection=await f.mount.execute(query);row.topologyAfterSelection=await topology(f.mount,result.handle);
     row.classification=[];for(const [expected,points]of[['inside',c.material],['outside',c.void],['boundary',c.boundary]])for(const point of points)row.classification.push({point,expected,actual:await classify(f.mount,result.handle,point)});
     await f.mount.dispose({op:'solid.dispose',version:1,handle:result.handle});row.disposed=true;try{await topology(f.mount,result.handle);}catch(e){row.staleCode=e.code;}try{await f.mount.execute(query);}catch(e){row.staleSelectionCode=e.code;}
    }catch(e){row.error={code:e.code??null,message:e.message};}finally{f.mount.close();}rows.push(row);}
    const aMount=await start();let bMount,foreign;try{bMount=await start();
     const a=await aMount.mount.execute(cases[0].request),b=await bMount.mount.execute(cases[2].request);const before=await topology(bMount.mount,b.handle);let error;
     try{await bMount.mount.execute({op:'solid.prism.selections.read',version:1,handle:a.handle,featureId:700});}catch(e){error={code:e.code??null,message:e.message};}
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
    const non=await start();let nonprism;try{
     const a=await non.mount.execute({op:'solid.box.create',version:1,unit:'millimeter',origin:[0,0,0],dimensions:[10,10,10]}),b=await non.mount.execute({op:'solid.box.create',version:1,unit:'millimeter',origin:[20,0,0],dimensions:[10,10,10]}),before=await mesh(non.mount,a.handle),union=await non.mount.execute({op:'solid.boolean.union',version:1,unit:'millimeter',a:a.handle,b:b.handle});
     const read=(handle,featureId)=>non.mount.execute({op:'solid.prism.selections.read',version:1,handle,featureId});
     nonprism={box:a,union,boxSelection:await read(a.handle,500),unionSelection:await read(union.handle,502),inputPreserved:JSON.stringify(before)===JSON.stringify(await mesh(non.mount,a.handle))};
     for(const r of[a,b,union])await non.mount.dispose({op:'solid.dispose',version:1,handle:r.handle});
    }finally{non.mount.close();}
    // Hold a genuine successful selection read; no result values are replaced.
    const TrackingWorker=window.Worker;let held,acceptHeld;const heldReply=new Promise(resolve=>acceptHeld=resolve);window.Worker=class extends TrackingWorker{constructor(...args){super(...args);let listener;Object.defineProperty(this,'onmessage',{configurable:true,get(){return listener;},set(fn){listener=fn;}});this.addEventListener('message',event=>{if(event.data?.kind==='result'&&event.data.selection){held=()=>listener?.call(this,event);acceptHeld(event.data);}else listener?.call(this,event);});}};
    let late;try{const f=await start();try{const shape=await f.mount.execute(cases[0].request),query={op:'solid.prism.selections.read',version:1,handle:shape.handle,featureId:900},controller=new AbortController(),pending=f.mount.execute(query,{signal:controller.signal}).then(()=>({ok:true}),e=>({ok:false,code:e.code})),genuine=await heldReply;controller.abort();const outcome=await pending;held();let retry;try{await f.mount.execute(query);}catch(e){retry=e.code;}late={genuine,outcome,retry,nativeVolume:shape.evidence.nativeVolume};}finally{f.mount.close();}}finally{window.Worker=TrackingWorker;}
    return{rows,preservation,foreign,late,nonprism,workers,csp:window.probeCsp};
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
  const identities=row=>[...row.selection.selection.plan.edges,...row.selection.selection.plan.faces].map(x=>x.id).sort();
  for(const row of receipt.observed.rows){
   const request=cases.find(c=>c.id===row.id).request,read=row.selection;assert.equal(read.contractVersion,1);assert.equal(read.op,'solid.prism.selections.read');assert.equal(read.unit,'millimeter');assert.deepEqual(Object.keys(read).sort(),['contractVersion','op','selection','unit']);assert.equal(read.selection.status,'available');assert.deepEqual(read,row.repeatedSelection);assert.deepEqual(row.topology,row.topologyAfterSelection);assert.equal(row.staleSelectionCode,'INVALID_HANDLE');
   const plan=read.selection.plan;assert.equal(plan.version,1);assert.equal(plan.featureId,row.selectionFeatureId);assert.equal(plan.regionId,request.region.id);assert.equal(plan.scope,'authored-source');assert.equal(plan.source,'prism-construction-history');assert.doesNotMatch(JSON.stringify(plan),/"(?:index|nativeIndex|resultLocal|ptr|ref)"\s*:/);assert(new TextEncoder().encode(JSON.stringify(plan)).byteLength<=524288);
   const key=(kind,role,source)=>'worker-prism-selection:1:'+JSON.stringify([row.selectionFeatureId,request.region.id,kind,role,source]),edges=[],faces=[key('face','first-cap',null),key('face','last-cap',null)];let circles=0;
   for(const loop of[request.region.outer,...request.region.holes]){for(const c of loop){edges.push(key('edge','first-boundary',c.id),key('edge','last-boundary',c.id));faces.push(key('face','swept-boundary',c.id));}if(loop.length===1&&loop[0].kind==='circle')circles++;else for(let i=0;i<loop.length;i++)edges.push(key('edge','connector',[loop[(i+loop.length-1)%loop.length].id,loop[i].id].sort()));}
   assert.deepEqual(plan.edges.map(x=>x.id).sort(),edges.sort());assert.deepEqual(plan.faces.map(x=>x.id).sort(),faces.sort());assert.equal(new Set([...edges,...faces]).size,edges.length+faces.length);assert.deepEqual(plan.unresolved,circles?[{kind:'edge',count:circles,reason:'UNAUTHORED_KERNEL_EDGE'}]:[]);row.selectionSummary={edges:edges.length,faces:faces.length,unresolvedCircleSeams:circles};
  }
  assert.deepEqual(identities(receipt.observed.rows.find(r=>r.id==='triangle')),identities(receipt.observed.rows.find(r=>r.id==='same-authored-IDs-reversed')));
  const p=receipt.observed.preservation;assert(p.topologyPreserved&&p.meshPreserved);for(const row of p.rejections){assert(row.error?.code,JSON.stringify(row));assert(row.sourcePreserved);}
  assert.equal(receipt.observed.foreign.error?.code,'INVALID_HANDLE');assert.equal(receipt.observed.foreign.ownTopologyPreserved,true);
  assert.equal(receipt.observed.late.outcome.code,'CANCELLED');assert.equal(receipt.observed.late.retry,'MOUNT_CLOSED');assert.equal(receipt.observed.late.genuine.selection.status,'available');near(receipt.observed.late.nativeVolume,500);assert(receipt.observed.workers.every(w=>w.terminated));assert.deepEqual(receipt.observed.csp,[]);
  for(const read of[receipt.observed.nonprism.boxSelection,receipt.observed.nonprism.unionSelection])assert.deepEqual(read.selection,{status:'unavailable',reason:'NOT_A_PRISM_RESULT'});near(receipt.observed.nonprism.box.evidence.nativeVolume,1000);near(receipt.observed.nonprism.union.evidence.nativeVolume,2000);assert.equal(receipt.observed.nonprism.union.evidence.solidCount,2);assert.equal(receipt.observed.nonprism.inputPreserved,true);
  const session=await browser.target().createCDPSession();try{const until=Date.now()+5000;let live;do{live=(await session.send('Target.getTargets')).targetInfos.filter(t=>t.type==='worker'&&t.url.startsWith(base.href));if(live.length)await new Promise(r=>setTimeout(r,25));}while(live.length&&Date.now()<until);assert.equal(live.length,0);receipt.liveOwnedWorkerTargets=0;}finally{await session.detach();}
  receipt.status='PASS';console.log(JSON.stringify({status:receipt.status,rows:receipt.rows,workers:receipt.observed.workers.length}));
 }finally{await context.close();await browser.close();fs.rmSync(profile,{recursive:true,force:true});receipt.ownedBrowserClosed=true;receipt.ownedProfileRemoved=true;}
})().catch(e=>{receipt.status='FAIL';receipt.error={message:e.message,stack:e.stack};console.error(e.stack);process.exitCode=1;}).finally(()=>{if(process.env.CODI_RECEIPT)fs.writeFileSync(process.env.CODI_RECEIPT,JSON.stringify(receipt,null,2)+'\n');});
