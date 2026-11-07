const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL||'http://127.0.0.1:20670/'),cdp=new URL(process.env.CODI_TEST_CDP||'http://127.0.0.1:19329/');for(const u of[base,cdp])assert.ok(['127.0.0.1','localhost'].includes(u.hostname));
(async()=>{
 const receipt={format:'selected-profile-kernel-component/2',result:'RUNNING',assets:{}};
 for(const name of['occ-portable.js','occ-profile.wasm','oci-verified-worker.js','worker-controller.mjs','selectedProfilePlan.mjs','occ-selected-profile-mount.mjs']){const res=await fetch(new URL('static/'+name,base));assert.equal(res.status,200);let bytes=0;const hash=crypto.createHash('sha256');for await(const chunk of res.body){bytes+=chunk.length;hash.update(chunk);}receipt.assets[name]={bytes,sha256:hash.digest('hex')};}
 assert.equal(receipt.assets['occ-portable.js'].sha256,'cbd49d63d0900f50dda7fc53518d5f06183e85b1dea720522cc2994b0876adc9');assert.equal(receipt.assets['occ-profile.wasm'].sha256,'a81af0b78dd585124f3f2d05d09b4a387b276bd1f655f0234002a6ab4646a637');
 const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:180000}),context=await browser.createBrowserContext();
 try{
 receipt.browserVersion=await browser.version();const page=await context.newPage();await page.evaluateOnNewDocument(()=>{window.csp=[];document.addEventListener('securitypolicyviolation',e=>csp.push(e.violatedDirective));});
 const response=await page.goto(new URL('static/engine-test.html',base));assert.doesNotMatch(response.headers()['content-security-policy'],/'unsafe-eval'/);
 receipt.controls=await page.evaluate(async()=>{
  const {createSelectedProfileOccMount}=await import('./occ-selected-profile-mount.mjs');
  const opts={workerUrl:'/static/oci-verified-worker.js',jsPath:'/static/occ-portable.js',wasmPath:'/static/occ-profile.wasm'},frame={origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]},rows=[];
  const GenuineWorker=window.Worker;let sentMessages=0;
  window.Worker=class extends GenuineWorker {postMessage(...args){sentMessages++;return super.postMessage(...args);}};
  const circle=(id,r,c=[0,0])=>[{kind:'circle',id,center:c,radius:r}],rectangle=(id,x,y,w,h)=>{const p=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];return p.map((a,i)=>({kind:'segment',id:id+i,a,b:p[(i+1)%4]}));};
  const request=(id,outer,holes=[],f=frame)=>({op:'solid.profile.extrude',version:2,unit:'millimeter',frame:f,depth:5,region:{id,outer,holes}});
  const run=async(name,requests)=>{
   const mount=createSelectedProfileOccMount(opts);try{await mount.ready;const descriptor=mount.descriptor,results=[],dispatch=[];
    const beforeDispatch=sentMessages;
    for(const field of ['op','version']){let reads=0;const data=request('accessor-refusal',circle('c',10));Object.defineProperty(data,field,{enumerable:true,get(){reads++;return field==='op'?'solid.profile.extrude':2;}});let code;try{await mount.execute(data);}catch(e){code=e.code;}if(code!=='INVALID_REQUEST'||reads!==0)throw Error('Dispatch accessor executed or accepted');dispatch.push({field,reads,code});}
    const inherited=Object.assign(Object.create({op:'solid.profile.extrude'}),request('inherited-refusal',circle('c',10)));delete inherited.op;let inheritedCode;try{await mount.execute(inherited);}catch(e){inheritedCode=e.code;}if(inheritedCode!=='INVALID_REQUEST'||sentMessages!==beforeDispatch)throw Error('Malformed dispatch sent a native job');dispatch.push({field:'inherited-op',code:inheritedCode,nativeJobsSent:0});
    for(const req of requests){const before=JSON.stringify(req),result=await mount.execute(req),mesh=await mount.readSolidMesh({op:'solid.mesh.read',version:1,handle:result.handle});if(JSON.stringify(req)!==before)throw Error('Source request mutated');
     results.push({request:req,result,mesh:{triangles:mesh.triangleCount,evidence:mesh.evidence,displayStatus:mesh.displayStatus,coordinates:Array.from(new Float64Array(mesh.buffer))}});
    }
    const before=await mount.readSolidMesh({op:'solid.mesh.read',version:1,handle:results[0].result.handle});let rejected;
    try{await mount.execute(request('outside',circle('o',10),[circle('h',5,[6,0])]))}catch(e){rejected={code:e.code,message:e.message};}
    const after=await mount.readSolidMesh({op:'solid.mesh.read',version:1,handle:results[0].result.handle});
    const preserved=JSON.stringify(before.evidence)===JSON.stringify(after.evidence)&&JSON.stringify(Array.from(new Uint8Array(before.buffer)))===JSON.stringify(Array.from(new Uint8Array(after.buffer)));
    const stale=[];for(const item of results){const handle=item.result.handle;await mount.execute({op:'solid.dispose',version:1,handle});try{mount.assertSolidBinding(handle);}catch(e){stale.push(e.code);}}
    rows.push({name,descriptor,results,rejected,preserved,stale,dispatch});
   }finally{mount.close();}
  };
  await run('rectangle',[request('rect',rectangle('r',0,0,10,10))]);
  await run('circle',[request('disk',circle('c',10))]);
  await run('nested-selected-regions',[request('outer-annulus',circle('o',30),[circle('m',20)]),request('inner-annulus',circle('m',20),[circle('i',10)]),request('inner-disk',circle('i',10))]);
  await run('disjoint-independent',[request('left',rectangle('a',0,0,10,10)),request('right',rectangle('b',20,0,10,10))]);
  await run('mixed-holes',[request('mixed',rectangle('a',-20,-20,40,40),[circle('b',2,[-5,0]),rectangle('c',2,-2,4,4)])]);
  const s=Math.SQRT1_2;await run('oblique-circle',[request('oblique',circle('c',10),[],{origin:[7,8,9],x:[s,s,0],y:[0,0,1],z:[s,-s,0]})]);
  // Additive native ABI / retained v1 transport smoke control only. This does
  // not substitute for the existing solved/history/signed rectangle workflows.
  const {createWorkerMount}=await import('./worker-controller.mjs');
  const legacy=createWorkerMount(opts,{engine:'legacy-ABI-control',representation:'occ-brep-worker-owned',mesh:false,profile:true,jsSha256:'cbd49d63d0900f50dda7fc53518d5f06183e85b1dea720522cc2994b0876adc9',wasmSha256:'a81af0b78dd585124f3f2d05d09b4a387b276bd1f655f0234002a6ab4646a637'});let legacyEvidence;
  try{await legacy.ready;const faceId='legacy-face',objects=rectangle('edge',0,0,10,10).map(e=>({id:e.id,type:'Segment',role:null,stage:0,data:{a:{x:e.a[0],y:e.a[1]},b:{x:e.b[0],y:e.b[1]}}})),sketchJSON=JSON.stringify({version:3,objects,stages:[{constraints:[],generators:[]}],metadata:{boundaryFrame:frame}}),sketchDigest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(sketchJSON)))].map(x=>x.toString(16).padStart(2,'0')).join(''),regionId='sketch-region:'+JSON.stringify({faceId,outer:objects.map(o=>faceId+'/'+o.id).sort(),holes:[]});
   const result=await legacy.execute({op:'solid.profile.extrude',version:1,profile:{version:2,unit:'millimeter',engine:'occ',revision:'legacy-ABI',sketchDigest,faceId,regionId,frame,depth:5,sketchJSON}});legacyEvidence=result.evidence;await legacy.dispose({op:'solid.dispose',version:1,handle:result.handle});
  }finally{legacy.close();}
  const mutationMount=createSelectedProfileOccMount(opts);let mutation;
  try{await mutationMount.ready;const source=request('mutation',circle('c',10)),mutable=structuredClone(source),task=mutationMount.execute(mutable);mutable.region.outer[0].radius=99;mutable.frame.origin[0]=999;const result=await task;mutation={source,mutatedCaller:mutable,result};}finally{mutationMount.close();}
  const boolMount=createSelectedProfileOccMount(opts);let genericBoolean;
  try{await boolMount.ready;const a=await boolMount.execute(request('boolean-input',circle('c',10))),b=await boolMount.execute({op:'solid.box.create',version:1,unit:'millimeter',origin:[0,0,0],dimensions:[10,10,5]}),before=await boolMount.readSolidMesh({op:'solid.mesh.read',version:1,handle:a.handle}),outputs=[];
   for(const kind of['common','union','subtract'])outputs.push(await boolMount.execute({op:'solid.boolean.'+kind,version:1,unit:'millimeter',a:a.handle,b:b.handle}));
   const disjoint=await boolMount.execute({op:'solid.box.create',version:1,unit:'millimeter',origin:[100,0,0],dimensions:[10,10,5]}),empty=await boolMount.execute({op:'solid.boolean.common',version:1,unit:'millimeter',a:a.handle,b:disjoint.handle}),emptyMesh=await boolMount.readSolidMesh({op:'solid.mesh.read',version:1,handle:empty.handle}),after=await boolMount.readSolidMesh({op:'solid.mesh.read',version:1,handle:a.handle});
   genericBoolean={evidence:outputs.map(x=>x.evidence),empty:empty.evidence,emptyMeshTriangles:emptyMesh.triangleCount,inputPreserved:JSON.stringify(before.evidence)===JSON.stringify(after.evidence)};
   for(const result of[a,b,...outputs,disjoint,empty])await boolMount.execute({op:'solid.dispose',version:1,handle:result.handle});
  }finally{boolMount.close();}
  const lifecycle={};
  // Hold an actual successful native reply before controller publication.
  const NativeWorker=window.Worker;let held,acceptHeld;const heldReply=new Promise(resolve=>acceptHeld=resolve);
  window.Worker=class extends NativeWorker {constructor(url){super(url);let listener;Object.defineProperty(this,'onmessage',{configurable:true,get(){return listener;},set(fn){listener=fn;}});this.addEventListener('message',event=>{if(event.data?.kind==='result'){held=()=>listener?.(event);acceptHeld(event.data);}else listener?.(event);});}};
  try{const late=createSelectedProfileOccMount(opts);try{await late.ready;const controller=new AbortController(),task=late.execute(request('late-native-success',circle('c',10)),{signal:controller.signal}).catch(e=>e.code);const actual=await heldReply;lifecycle.heldNativeVolume=actual.evidence.nativeVolume;controller.abort();lifecycle.cancelAfterNativeSuccess=await task;held();try{await late.execute(request('late-retry',circle('c',10)));}catch(e){lifecycle.afterHeldCancel=e.code;}}finally{late.close();}}finally{window.Worker=NativeWorker;}
  const cancelled=createSelectedProfileOccMount(opts);await cancelled.ready;const signal=new AbortController();const task=cancelled.execute(request('cancel',circle('c',10)),{signal:signal.signal}).catch(e=>e.code);signal.abort();lifecycle.cancel=await task;try{cancelled.assertSolidBinding(rows[0].results[0].result.handle)}catch(e){lifecycle.afterCancel=e.code}cancelled.close();
  const closed=createSelectedProfileOccMount(opts);await closed.ready;const pending=closed.execute(request('close',circle('c',10))).catch(e=>e.code);closed.close();lifecycle.close=await pending;
  return{rows,lifecycle,mutation,genericBoolean,legacyEvidence,csp:window.csp};
 });
 for(const row of receipt.controls.rows){assert.equal(row.rejected.code,'UNSUPPORTED_PROFILE');assert.equal(row.preserved,true);assert.deepEqual(row.stale,row.results.map(()=> 'INVALID_HANDLE'));assert.ok(row.descriptor.operations.some(op=>op.id==='solid.profile.extrude'&&op.version===2));
  for(const item of row.results){assert.equal(item.result.evidence.nativeValidity.valid,true);assert.equal(item.result.evidence.solidCount,1);assert.equal(item.result.handle.representation,'occ-brep-worker-owned');assert.doesNotMatch(JSON.stringify(item.result),/"(?:ptr|ref|edgeRef)"/);assert.equal(item.mesh.displayStatus,'available');assert.equal(item.mesh.triangles*9,item.mesh.coordinates.length);assert.deepEqual(item.result.evidence,item.mesh.evidence);}
 }
 receipt.controls.genericBoolean.evidence.forEach((e,i)=>assert.ok(Math.abs(e.nativeVolume-[125*Math.PI,375*Math.PI+500,375*Math.PI][i])<1e-6));assert.equal(receipt.controls.genericBoolean.empty.resultKind,'empty');assert.equal(receipt.controls.genericBoolean.emptyMeshTriangles,0);assert.equal(receipt.controls.genericBoolean.inputPreserved,true);
 assert.ok(Math.abs(receipt.controls.mutation.result.evidence.nativeVolume-500*Math.PI)<1e-6);assert.deepEqual(receipt.controls.mutation.result.evidence.nativeBounds,{min:[-10,-10,0],max:[10,10,5]});
 assert.ok(Math.abs(receipt.controls.legacyEvidence.signedVolume-500)<1e-6);assert.equal(receipt.controls.legacyEvidence.faces,6);
 const rows=receipt.controls.rows,volumes=[[500],[500*Math.PI],[2500*Math.PI,1500*Math.PI,500*Math.PI],[500,500],[(1600-4*Math.PI-16)*5],[500*Math.PI]];
 rows.forEach((row,i)=>row.results.forEach((item,j)=>assert.ok(Math.abs(item.result.evidence.nativeVolume-volumes[i][j])<Math.max(1e-6,volumes[i][j]*1e-9),row.name)));
 assert.deepEqual(rows[0].results[0].result.evidence.nativeBounds,{min:[0,0,0],max:[10,10,5]});
 assert.deepEqual(rows[3].results.map(x=>x.result.evidence.nativeBounds),[{min:[0,0,0],max:[10,10,5]},{min:[20,0,0],max:[30,10,5]}]);
 // Independent display opening control: no top cap triangle covers center;
 // a known interior annulus point lies on the top face. Not a mesh-validity oracle.
 const annulus=rows[2].results[1],caps=[];for(let i=0;i<annulus.mesh.coordinates.length;i+=9){const t=[0,1,2].map(j=>annulus.mesh.coordinates.slice(i+j*3,i+j*3+3));if(t.every(p=>Math.abs(p[2]-5)<1e-8))caps.push(t);}
 const covers=(p,t)=>{const cross=(a,b)=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]),v=t.map((a,i)=>cross(a,t[(i+1)%3]));return v.every(x=>x>=-1e-8)||v.every(x=>x<=1e-8);};assert.ok(caps.length);assert.equal(caps.some(t=>covers([0,0],t)),false);assert.equal(caps.some(t=>covers([15,0],t)),true);
 assert.ok(Math.abs(receipt.controls.lifecycle.heldNativeVolume-500*Math.PI)<1e-6);assert.deepEqual({...receipt.controls.lifecycle,heldNativeVolume:0},{heldNativeVolume:0,cancelAfterNativeSuccess:'CANCELLED',afterHeldCancel:'MOUNT_CLOSED',cancel:'CANCELLED',afterCancel:'MOUNT_CLOSED',close:'MOUNT_CLOSED'});assert.deepEqual(receipt.controls.csp,[]);
 // Keep receipt compact: hash actual transferred mesh bytes after geometry checks.
 for(const row of rows)for(const item of row.results){item.mesh.float64SHA256=crypto.createHash('sha256').update(Buffer.from(new Float64Array(item.mesh.coordinates).buffer)).digest('hex');delete item.mesh.coordinates;}
 const inspector=await browser.target().createCDPSession(),until=Date.now()+5000;let live;
 do{live=(await inspector.send('Target.getTargets')).targetInfos.filter(t=>t.type==='worker'&&t.url.startsWith(base.href));if(live.length)await new Promise(resolve=>setTimeout(resolve,20));}while(live.length&&Date.now()<until);assert.equal(live.length,0);receipt.liveOwnedWorkerTargets=0;await inspector.detach();
 receipt.result='PASS';console.log(JSON.stringify({result:'PASS',rows:rows.map(r=>({name:r.name,volumes:r.results.map(i=>i.result.evidence.nativeVolume)})),lifecycle:receipt.controls.lifecycle}));
 }catch(error){receipt.result='FAIL';receipt.error={message:error.message,stack:error.stack};throw error;}finally{if(process.env.CODI_RECEIPT)fs.writeFileSync(process.env.CODI_RECEIPT,JSON.stringify(receipt,null,2)+'\n');await context.close();browser.disconnect();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
