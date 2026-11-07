// Controller doubles exercise bounded failure handling; real worker cancellation is separate.
const assert=require('node:assert/strict'),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL||'http://127.0.0.1:19970/'),cdp=new URL(process.env.CODI_TEST_CDP||'http://127.0.0.1:19971/');
if(![base,cdp].every(u=>['127.0.0.1','localhost','[::1]'].includes(u.hostname)))throw Error('Loopback only');
(async()=>{const b=await puppeteer.connect({browserURL:cdp.href}),c=await b.createBrowserContext();try{
 const p=await c.newPage();await p.goto(new URL('static/engine-test.html',base));const out=await p.evaluate(async()=>{
  const {createVerifiedOciMount}=await import('./oci-verified-mount.mjs');const {createVerifiedManifoldMount}=await import('./manifold-verified-mount.mjs');const base={jsPath:'/static/occ-portable.js',wasmPath:'/lib-assets/jsketcher-occ-engine/occt.wasm',timeoutMs:200};
  const frame={origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]},profile={version:1,unit:'millimeter',engine:'occ',revision:'r',sketchDigest:'0'.repeat(64),faceId:'face',regionId:'region',frame,depth:1,sketchJSON:'{}'},req={op:'solid.profile.extrude',version:1,profile};
  const make=(workerUrl,extra={})=>createVerifiedOciMount({...base,workerUrl,...extra});
  const m=make('/static/oci-lifecycle-double.js');await m.ready;const pre=new AbortController();pre.abort();let preResult;try{await m.execute(req,{signal:pre.signal})}catch(e){preResult=e.code}
  const work=m.execute(req).catch(e=>e.code);let busy;try{await m.execute(req)}catch(e){busy=e.code}const timeout=await work;m.close();
  const a=make('/static/oci-lifecycle-double.js');await a.ready;const ac=new AbortController(),aborted=a.execute(req,{signal:ac.signal}).catch(e=>e.code);ac.abort();const cancel=await aborted;a.close();
  const z=make('/static/oci-lifecycle-double.js');await z.ready;const pending=z.execute(req).catch(e=>e.code);z.close();const closed=await pending;
  const broken=make('/static/oci-crash-double.js');let startup;try{await broken.ready}catch(e){startup=e.code}broken.close();
  const crash=make('/static/oci-operation-crash-double.js');await crash.ready;let during;try{await crash.execute(req)}catch(e){during=e.code}crash.close();
  const fake=make('/static/forged-profile-worker.js');await fake.ready;let forged,afterForged;try{await fake.execute(req)}catch(e){forged=e.code}try{await fake.execute(req)}catch(e){afterForged=e.code}fake.close();
  // A real Worker message is altered at the boundary to retain sparse array
  // holes, exactly as structured cloning permits. No native kernel is faked.
  const OriginalWorker=window.Worker, ids=['face/a','face/b','face/c','face/d'];
  const sparseReq={...req,profile:{...profile,regionId:'sketch-region:'+JSON.stringify({faceId:'face',outer:ids,holes:[]})}};
  const sparseResults=[];
  for(const field of ['surfaceTypes','loopLengths','edgeUseCounts','edgeFaces','wrongSource']){
   window.Worker=class extends OriginalWorker {set onmessage(fn){super.onmessage=e=>{
    if(e.data?.kind!=='result'){fn(e);return;}
    const topologySummary={surfaceTypes:Array(6).fill('PLANE'),loopLengths:Array.from({length:6},()=>[4]),edgeFieldNames:['a','b','curve','curveBounds','inverted','tess'],curveTypes:['B-SPLINE'],uniqueEdgeGroups:12,edgeUseCounts:Array(12).fill(2)};
    const edgeFaces=ids.map((id,i)=>({sourceEdgeId:id,sourceReversed:false,baseEdgeReversed:false,faceInverted:false,faceOrdinal:i,binding:'kernel-history-and-geometric-match'}));
    if(field==='edgeFaces')delete edgeFaces[0];else if(field==='wrongSource')edgeFaces[0].sourceEdgeId='face/not-authored';else delete topologySummary[field][0];
    fn({data:{kind:'result',seq:e.data.seq,evidence:{faces:6,triangles:12,bounds:{min:[0,0,0],max:[1,1,1]},signedVolume:1,triangulatedClosed:true,triangleOrientationConsistent:true,topologySummary},provenance:{revision:'r',sketchDigest:'0'.repeat(64),faceId:'face',regionId:sparseReq.profile.regionId,edgeFaces}}});
   }} };
   const s=make('/static/forged-profile-worker.js');await s.ready;let first,second;
   try{await s.execute(sparseReq);first='ACCEPTED'}catch(e){first=e.code||e.name}
   try{await s.execute(sparseReq);second='ACCEPTED'}catch(e){second=e.code||e.name}
   sparseResults.push([field,first,second]);s.close();
  }
  window.Worker=OriginalWorker;
  const native=createVerifiedManifoldMount({...base,workerUrl:'/static/oci-lifecycle-double.js'});await native.ready;let nativeRefusal;try{await native.execute(req)}catch(e){nativeRefusal=e.code}native.close();
  const Native=window.Worker,realAbort=new AbortController();let started=0,terminated=0;
  window.Worker=class extends Native{constructor(...args){super(...args);started++}postMessage(msg,...args){super.postMessage(msg,...args);if(msg.kind==='profile-extrude')setTimeout(()=>realAbort.abort(),0)}terminate(){terminated++;return super.terminate()}};
  let realCancel;try{const real=make('/static/oci-verified-worker.js',{timeoutMs:30000});await real.ready;try{await real.execute(req,{signal:realAbort.signal})}catch(e){realCancel=e.code}real.close()}finally{window.Worker=Native}
  return {preResult,busy,timeout,cancel,closed,startup,during,forged,afterForged,nativeRefusal,realCancel,started,terminated,sparseResults};
 });
 assert.deepEqual(out,{preResult:'CANCELLED',busy:'BUSY',timeout:'TIMEOUT',cancel:'CANCELLED',closed:'MOUNT_CLOSED',startup:'ENGINE_FAILURE',during:'ENGINE_FAILURE',forged:'ENGINE_FAILURE',afterForged:'MOUNT_CLOSED',nativeRefusal:'UNSUPPORTED_OPERATION',realCancel:'CANCELLED',started:1,terminated:1,sparseResults:['surfaceTypes','loopLengths','edgeUseCounts','edgeFaces','wrongSource'].map(field=>[field,'ENGINE_FAILURE','MOUNT_CLOSED'])});
 const inspector=await b.target().createCDPSession(),deadline=Date.now()+5000;let targets;do{targets=(await inspector.send('Target.getTargets')).targetInfos.filter(t=>t.type==='worker'&&/(oci-(verified-worker|lifecycle-double|crash-double|operation-crash-double)|forged-profile-worker)/.test(t.url));if(targets.length)await new Promise(r=>setTimeout(r,20))}while(targets.length&&Date.now()<deadline);assert.equal(targets.length,0);
 console.log('PASS bounded profile cancellation, timeout, crash, close and Worker termination');
 }finally{await c.close();b.disconnect()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
