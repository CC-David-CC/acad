// Explicit native fixtures -> real preparation Worker -> native OCC component.
// Not public authoring, constraint admission, history or signed Files proof.
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);
for(const u of [base,cdp])assert.ok(['127.0.0.1','localhost'].includes(u.hostname));
(async()=>{
 const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:120000}),context=await browser.createBrowserContext(),receipt={scope:'Seeded source -> genuine preparation Worker -> native OCC component only',result:'RUNNING'};
 try{
  const page=await context.newPage();await page.goto(new URL('static/engine-test.html',base));
  const productionWorker=process.env.CODI_PREPARE_WORKER_PATH||null;
  if(productionWorker)assert.match(productionWorker,/^\/static\/[A-Za-z0-9_.-]+\.js$/);
  receipt.productionPreparationWorker=productionWorker;
  receipt.rows=await page.evaluate(async productionWorker=>{
   const {createSelectedProfileOccMount}=await import('/static/occ-selected-profile-mount.mjs');
   const frame={origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]},faceId='source';
   const rectangle=(id,x)=>{const p=[[x,0],[x+10,0],[x+10,10],[x,10]];return p.map((a,i)=>({id:id+i,type:'Segment',role:null,stage:0,data:{a:{x:a[0],y:a[1]},b:{x:p[(i+1)%4][0],y:p[(i+1)%4][1]}}}));};
   const circle=(id,r)=>({id,type:'Circle',role:null,stage:0,data:{c:{x:0,y:0},r}});
   const region=(outer,holes=[])=>'sketch-region:'+JSON.stringify({faceId,outer:outer.map(id=>faceId+'/'+id).sort(),holes:holes.map(ids=>ids.map(id=>faceId+'/'+id).sort()).sort((a,b)=>JSON.stringify(a)<JSON.stringify(b)?-1:1)});
   const prepare=async(objects,regionId)=>{
    const sketchJSON=JSON.stringify({version:3,objects,stages:[{constraints:[],generators:[]}],metadata:{boundaryFrame:frame}}),sketchDigest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(sketchJSON))),b=>b.toString(16).padStart(2,'0')).join('');
    const worker=productionWorker?new Worker(productionWorker):new Worker('/static/source-worker.mjs',{type:'module'});
    try{return await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Preparation Worker timeout')),15000);worker.onmessage=e=>{clearTimeout(timer);e.data.ok?resolve(productionWorker?e.data.value:e.data.prepared):reject(Object.assign(Error(productionWorker?e.data.error:e.data.error.message),{code:productionWorker?e.data.code:e.data.error.code}));};worker.onerror=e=>{clearTimeout(timer);reject(Error(e.message));};const profile={unit:'millimeter',engine:'occ',revision:'current-source',sketchDigest,faceId,regionId,frame,depth:5,sketchJSON};worker.postMessage(productionWorker?{jobId:'source-qualification',kind:'prepare-selected',profile}:profile);});}
    finally{worker.terminate();}
   };
   const cases=[
    ['disjoint-a',[...rectangle('a',0),...rectangle('b',20)],region(['a0','a1','a2','a3'])],
    ['disjoint-b',[...rectangle('a',0),...rectangle('b',20)],region(['b0','b1','b2','b3'])],
    ['outer-annulus',[circle('outer',30),circle('middle',20),circle('inner',10)],region(['outer'],[['middle']])],
    ['middle-annulus',[circle('outer',30),circle('middle',20),circle('inner',10)],region(['middle'],[['inner']])],
    ['inner-disk',[circle('outer',30),circle('middle',20),circle('inner',10)],region(['inner'])]
   ],rows=[];
   for(const[name,objects,regionId]of cases){
    const prepared=await prepare(objects,regionId),mount=createSelectedProfileOccMount({workerUrl:'/static/oci-verified-worker.js',jsPath:'/static/occ-portable.js',wasmPath:'/static/occ-profile.wasm'});
    try{await mount.ready;const result=await mount.execute(prepared.request);mount.assertSolidBinding(result.handle);rows.push({name,binding:prepared.binding,prepared:prepared.expected,native:result.evidence});await mount.execute({op:'solid.dispose',version:1,handle:result.handle});}
    finally{mount.close();}
   }
   return rows;
  },productionWorker);
  const volumes=[500,500,2500*Math.PI,1500*Math.PI,500*Math.PI];
  receipt.rows.forEach((row,i)=>{assert.ok(Math.abs(row.native.nativeVolume-volumes[i])<1e-6);assert.ok(Math.abs(row.prepared.volume-volumes[i])<1e-9);assert.equal(row.native.nativeValidity.valid,true);assert.equal(row.native.solidCount,1);});
  assert.deepEqual(receipt.rows[0].native.nativeBounds,{min:[0,0,0],max:[10,10,5]});assert.deepEqual(receipt.rows[1].native.nativeBounds,{min:[20,0,0],max:[30,10,5]});
  const inspector=await browser.target().createCDPSession(),until=Date.now()+5000;let live;
  do{live=(await inspector.send('Target.getTargets')).targetInfos.filter(t=>t.type==='worker'&&t.url.startsWith(base.href));if(live.length)await new Promise(r=>setTimeout(r,20));}while(live.length&&Date.now()<until);
  assert.equal(live.length,0);await inspector.detach();receipt.liveOwnedWorkers=0;
  receipt.assets={};for(const name of ['modules/engine/extrusion/selectedSketchProfile.mjs',productionWorker?productionWorker.slice(1):'static/source-worker.mjs','static/worker-controller.mjs']){const response=await fetch(new URL(name,base));assert.equal(response.status,200);receipt.assets[name]=crypto.createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex');}
  receipt.result='PASS';console.log('PASS genuine source preparation Worker -> native OCC',JSON.stringify(receipt.rows.map(r=>({name:r.name,nativeVolume:r.native.nativeVolume}))));
 }catch(error){receipt.result='FAIL';receipt.error={message:error.message,stack:error.stack};throw error;}
 finally{if(process.env.CODI_RECEIPT)fs.writeFileSync(process.env.CODI_RECEIPT,JSON.stringify(receipt,null,2)+'\n');await context.close();browser.disconnect();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
