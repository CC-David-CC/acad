const assert=require('node:assert/strict'),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);
if(![base,cdp].every(u=>['127.0.0.1','localhost','[::1]'].includes(u.hostname)))throw Error('Loopback only');
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href}),context=await browser.createBrowserContext(),page=await context.newPage();
try{await page.goto(base.href);const out=await page.evaluate(async()=>{
 const d='/node_modules/jsketcher-build/static/',glue='f74142622c9ced56b8f2e7955301ace5902f811734a71128767fb05de4159972',wasm='c39793b8aff34dc548b57fee1d901219e372702a5005ef92dfdf94994c012897';
 const policy=(await fetch(d+'oci-verified-worker.js')).headers.get('content-security-policy');
 async function init(workerName,wasmName,jsHash=glue){const w=new Worker(d+workerName);const result=await new Promise(ok=>{const timer=setTimeout(()=>ok({kind:'timeout'}),30000);w.onmessage=e=>{clearTimeout(timer);ok(e.data)};w.onerror=e=>{clearTimeout(timer);ok({kind:'error',error:e.message})};w.postMessage({kind:'init',manifest:{version:1,js:{path:d+'occ-portable.js',sha256:jsHash},wasm:{path:d+wasmName,sha256:wasm}}})});return {w,result};}
 const bad=await init('oci-verified-worker.js','wasm-bad.wasm');bad.w.terminate();
 const wrong=await init('oci-verified-worker.js','c39793b8aff34dc548b5.wasm','0'.repeat(64));wrong.w.terminate();
 const good=await init('oci-growth-test.js','c39793b8aff34dc548b5.wasm');if(good.result.kind!=='ready')throw Error(JSON.stringify(good.result));
 const growth=await new Promise(ok=>{good.w.onmessage=e=>ok(e.data);good.w.postMessage({kind:'test-heap-growth'})});
 const frame={origin:[3,-4,7],x:[1,0,0],y:[0,1,0],z:[0,0,1]},faceId='S:0/SURFACE';
 const draft=await new Promise((ok,no)=>{const w=new Worker(d+'sketch-worker.js');w.onmessage=e=>{w.terminate();ok(e.data)};w.onerror=e=>no(Error(e.message));w.postMessage({task:'rectangle',revision:'r',unit:'millimeter',frame,origin:[10,20],width:100,height:50})});
 const sketchJSON=draft.serializedSketch,sketchDigest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(sketchJSON))),v=>v.toString(16).padStart(2,'0')).join(''),regionId='sketch-region:'+JSON.stringify({faceId,outer:draft.sketch.objects.map(o=>faceId+'/'+o.id).sort(),holes:[]});
 const result=await new Promise(ok=>{good.w.onmessage=e=>ok(e.data);good.w.postMessage({kind:'profile-extrude',seq:1,token:'one',researchTopology:{version:1},profile:{version:2,unit:'millimeter',engine:'occ',revision:'r',sketchDigest,faceId,regionId,frame,depth:10,sketchJSON}})});good.w.terminate();return {policy,bad:bad.result,wrong:wrong.result,growth,result};
 });
 assert.match(out.policy,/script-src 'self' 'wasm-unsafe-eval'/);assert.doesNotMatch(out.policy,/script-src[^;]*blob:/);
 assert.equal(out.bad.kind,'error');assert.match(out.bad.error,/digest mismatch/);assert.equal(out.wrong.kind,'error');assert.match(out.wrong.error,/embedded JS identity/);
 assert.equal(out.growth.grown,true);assert.equal(out.growth.live,true);assert.ok(out.growth.after>out.growth.before);
 assert.equal(out.result.kind,'result');assert.deepEqual(out.result.evidence.bounds,{min:[13,16,7],max:[113,66,17]});assert.ok(Math.abs(out.result.evidence.signedVolume-50000)<1e-5);assert.equal(out.result.portableTopology.faces.length,6);
 console.log('PASS self-only CSP, tampered WASM and JS identity refusal, live heap after growth, authored OCC prism');
}finally{await context.close();browser.disconnect()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
