// Real sketch Worker supplies authored data; a second Worker prepares it.
const assert=require('node:assert/strict'),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const {createHash}=require('node:crypto');
if(!process.env.JSKETCHER_TEST_URL||!process.env.CODI_TEST_CDP)throw Error('Set explicit fixture and CDP URLs');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);
if(![base,cdp].every(u=>['127.0.0.1','localhost','[::1]'].includes(u.hostname)))throw Error('Loopback only');
(async()=>{
 const manifestResponse=await fetch(new URL('/fixture-manifest.json',base));assert.equal(manifestResponse.status,200);const manifest=await manifestResponse.json();
 for(const [route,digest] of Object.entries(manifest.sha256)){
  const response=await fetch(new URL(route,base));assert.equal(response.status,200);
  assert.equal(response.headers.get('content-security-policy'),manifest.policy);
  assert.equal(createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex'),digest);
 }
 assert.ok(manifest.policy.includes("script-src 'self' 'wasm-unsafe-eval'"));assert.ok(!manifest.policy.includes("'unsafe-eval'"));
 const browser=await puppeteer.connect({browserURL:cdp.href}),context=await browser.createBrowserContext();try{
 const p=await context.newPage();await p.goto(base.href);const out=await p.evaluate(async()=>{
  const frame={origin:[3,-4,7],x:[1,0,0],y:[0,1,0],z:[0,0,1]};
  const run=(path,data,options)=>new Promise((yes,no)=>{
   const w=new Worker(path,options),finish=(error,value)=>{clearTimeout(timer);w.terminate();error?no(error):yes(value)};
   const timer=setTimeout(()=>finish(Error('Worker timed out')),10000);
   w.onmessage=e=>finish(null,e.data);w.onerror=e=>finish(Error(e.message));w.onmessageerror=()=>finish(Error('Worker message failed'));w.postMessage(data);
  });
  const result=await run('/static/worker.js',{task:'rectangle',revision:'actual',unit:'millimeter',frame,origin:[10,20],width:100,height:50});
  if(!result.ok)throw Error(JSON.stringify(result));const faceId='S:0/SURFACE',ids=result.sketch.objects.map(o=>faceId+'/'+o.id).sort();
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(result.serializedSketch))),n=>n.toString(16).padStart(2,'0')).join('');
  const regionId='sketch-region:'+JSON.stringify({faceId,outer:ids,holes:[]});
  const request={version:1,unit:'millimeter',engine:'occ',revision:'accepted',sketchDigest:digest,faceId,regionId,frame,depth:10,sketchJSON:result.serializedSketch};
  const prepared=await run('/test/extrude/rectangle-profile-worker.mjs',request,{type:'module'});
  const stale=await run('/test/extrude/rectangle-profile-worker.mjs',{...request,sketchDigest:'0'.repeat(64)},{type:'module'});
  return {prepared,stale};
 });
 assert.equal(out.prepared.ok,true);assert.deepEqual(out.prepared.environment,{window:'undefined',document:'undefined',worker:true});
 assert.deepEqual(out.prepared.result.worldVertices,[[13,16,7],[113,16,7],[113,66,7],[13,66,7]]);assert.deepEqual(out.prepared.result.edges.map(e=>e.id),[0,1,2,3].map(i=>'S:0/SURFACE/rect-'+i));
 assert.deepEqual(out.stale,{ok:false,code:'STALE_SKETCH'});
 console.log(JSON.stringify({status:'PASS',scope:'actual sketch worker and data-only profile worker; no editor, kernel or publication',manifest}));
 }finally{await context.close();browser.disconnect()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
