// Real pinned Manifold worker with independent analytic box/Boolean oracles.
const assert=require('node:assert/strict'),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL||'http://127.0.0.1:19363/'),cdp=new URL(process.env.CODI_TEST_CDP||'http://127.0.0.1:19364/');
for(const u of [base,cdp])if(!['127.0.0.1','localhost','[::1]'].includes(u.hostname))throw Error('Loopback only');
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:120000}),context=await browser.createBrowserContext();
try{const page=await context.newPage();await page.evaluateOnNewDocument(()=>{window.cspViolations=[];document.addEventListener('securitypolicyviolation',e=>cspViolations.push(e.violatedDirective));});
const response=await page.goto(new URL('static/engine-test.html',base));assert.match(response.headers()['content-security-policy'],/blob:/);assert.doesNotMatch(response.headers()['content-security-policy'],/'unsafe-eval'/);
const hashes=await page.evaluate(async()=>{const h=async p=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await(await fetch(p)).arrayBuffer())),x=>x.toString(16).padStart(2,'0')).join('');return {js:await h('/static/manifold.js'),wasm:await h('/static/manifold.wasm')};});
assert.deepEqual(hashes,{js:'cd2031fd75cbbc812b550dd228f95b9fd666ae4da6557f840e3d3ed4cbed268b',wasm:'7bb5f8ee10fcafdab78799b1e5dd2cdc7c282ea0bf8e7939c43f3ad34b823e3d'});
const result=await page.evaluate(async()=>{
 const {createVerifiedManifoldMount}=await import('./manifold-verified-mount.mjs');
 const {createVerifiedOciMount}=await import('./oci-verified-mount.mjs');
 const {operationSchemasV1}=await import('./inventory.mjs');
 const opts={workerUrl:'/static/manifold-verified-worker.js',jsPath:'/static/manifold.js',wasmPath:'/static/manifold.wasm'};
 const occOpts={workerUrl:'/static/oci-verified-worker.js',jsPath:'/static/occ-portable.js',wasmPath:'/lib-assets/jsketcher-occ-engine/occt.wasm'};
 const box=(origin,dimensions)=>({op:'solid.box.create',version:1,unit:'millimeter',origin,dimensions});
 const bool=(kind,a,b)=>({op:'solid.boolean.'+kind,version:1,unit:'millimeter',a,b});
 const dispose=handle=>({op:'solid.dispose',version:1,handle});
 const m=createVerifiedManifoldMount(opts),other=createVerifiedManifoldMount(opts),occ=createVerifiedOciMount(occOpts);await Promise.all([m.ready,other.ready,occ.ready]);
 const first=box([0,0,0],[10,10,10]),aPromise=m.box(first);first.op='changed';first.dimensions[0]=999;const a=await aPromise;
 const b=await m.box(box([5,0,0],[10,10,10]));
 const request=bool('common',a.handle,b.handle),commonPromise=m.boolean(request);request.op='changed';const common=await commonPromise;
 const union=await m.boolean(bool('union',a.handle,b.handle)),subtract=await m.boolean(bool('subtract',a.handle,b.handle));
 const o=await occ.box(box([0,0,0],[1,1,1]));let foreign,cross,identical,malformed,sparse,nonfinite,unit;
 try{await other.boolean(bool('union',a.handle,b.handle))}catch(e){foreign=e.code}
 try{await m.boolean(bool('union',a.handle,o.handle))}catch(e){cross=e.code}
 try{await m.boolean(bool('common',a.handle,a.handle))}catch(e){identical=e.code}
 try{await m.box({...box([0,0,0],[1,1,1]),extra:true})}catch(e){malformed=e.code}
 try{await m.box(box([0,,0],[1,1,1]))}catch(e){sparse=e.code}
 try{await m.box(box([0,0,0],[1,NaN,1]))}catch(e){nonfinite=e.code}
 try{await m.box({...box([0,0,0],[1,1,1]),unit:'inch'})}catch(e){unit=e.code}
 const original=structuredClone(a.handle),d=dispose(a.handle),pending=m.dispose(d);d.op='changed';d.handle.id='changed';const disposed=await pending;
 let stale;try{await m.boolean(bool('union',original,b.handle))}catch(e){stale=e.code}
 const stillUsable=await m.boolean(bool('common',b.handle,common.handle));
 const schemas=m.descriptor.operations.every(x=>operationSchemasV1[x.input]&&operationSchemasV1[x.output]);
 for(const h of [b.handle,common.handle,union.handle,subtract.handle,stillUsable.handle])await m.dispose(dispose(h));
 await occ.dispose(dispose(o.handle));m.close();other.close();occ.close();
 const e=createVerifiedManifoldMount(opts);await e.ready;
 const ea=await e.box(box([0,0,0],[1,1,1])),eb=await e.box(box([10,0,0],[1,1,1]));
 const empty=await e.boolean(bool('common',ea.handle,eb.handle)),disconnected=await e.boolean(bool('union',ea.handle,eb.handle));
 const ec=await e.box(box([0,0,0],[1,1,1])),emptyDiff=await e.boolean(bool('subtract',ea.handle,ec.handle));
 const preserved=await e.boolean(bool('subtract',eb.handle,ea.handle));
 for(const x of [ea,eb,ec,empty,disconnected,emptyDiff,preserved])await e.dispose(dispose(x.handle));
 const eighth=await e.box(box([0,0,0],[1,1,1]));await e.dispose(dispose(eighth.handle));let budget;
 try{await e.box(box([0,0,0],[1,1,1]))}catch(e){budget=e.code}e.close();
 const bad=createVerifiedManifoldMount({...opts,wasmPath:'/static/manifold.js'});let badWasm;try{await bad.ready}catch(e){badWasm=e.code}bad.close();
 const badjs=createVerifiedManifoldMount({...opts,jsPath:'/static/engine-test.html'});let badJs;try{await badjs.ready}catch(e){badJs=e.code}badjs.close();
 return {a:a.evidence,b:b.evidence,common:common.evidence,union:union.evidence,subtract:subtract.evidence,empty:empty.evidence,emptyDiff:emptyDiff.evidence,disconnected:disconnected.evidence,preserved:preserved.evidence,
 boxOp:a.op,boolOp:common.op,disposeOp:disposed.op,representation:a.handle.representation,foreign,cross,identical,malformed,sparse,nonfinite,unit,stale,schemas,badWasm,badJs,budget};
});
console.log('Manifold workflow:',JSON.stringify(result));
assert.deepEqual(result.a.bounds,{min:[0,0,0],max:[10,10,10]});assert.equal(result.a.volume,1000);
assert.deepEqual(result.common.bounds,{min:[5,0,0],max:[10,10,10]});assert.equal(result.common.volume,500);
assert.deepEqual(result.union.bounds,{min:[0,0,0],max:[15,10,10]});assert.equal(result.union.volume,1500);
assert.deepEqual(result.subtract.bounds,{min:[0,0,0],max:[5,10,10]});assert.equal(result.subtract.volume,500);
for(const e of [result.empty,result.emptyDiff])assert.deepEqual(e,{empty:true,triangles:0,vertices:0,volume:0,components:0,bounds:null});
assert.equal(result.disconnected.components,2);assert.ok(Math.abs(result.disconnected.volume-2)<1e-9);assert.ok(Math.abs(result.preserved.volume-1)<1e-9);
assert.deepEqual([result.foreign,result.cross,result.identical,result.malformed,result.sparse,result.nonfinite,result.unit,result.stale,result.badWasm,result.badJs,result.budget],
['INVALID_HANDLE','INVALID_HANDLE','INVALID_REQUEST','INVALID_REQUEST','INVALID_REQUEST','INVALID_REQUEST','INVALID_REQUEST','INVALID_HANDLE','ENGINE_FAILURE','ENGINE_FAILURE','RESOURCE_LIMIT']);
assert.deepEqual([result.boxOp,result.boolOp,result.disposeOp,result.representation],['solid.box.create','solid.boolean.common','solid.dispose','manifold-mesh-worker-owned']);assert.equal(result.schemas,true);
const lifecycle=await page.evaluate(async()=>{
 const {createVerifiedManifoldMount}=await import('./manifold-verified-mount.mjs');
 const options={workerUrl:'/static/oci-lifecycle-double.js',jsPath:'/static/manifold.js',wasmPath:'/static/manifold.wasm',timeoutMs:200};
 const request={op:'solid.box.create',version:1,unit:'millimeter',origin:[0,0,0],dimensions:[1,1,1]};
 const timed=createVerifiedManifoldMount(options);await timed.ready;let timeout;try{await timed.box(request)}catch(e){timeout=e.code}timed.close();
 const aborted=createVerifiedManifoldMount(options);await aborted.ready;const c=new AbortController();const work=aborted.box(request,{signal:c.signal}).catch(e=>e.code);c.abort();const cancel=await work;aborted.close();
 const closed=createVerifiedManifoldMount(options);await closed.ready;const pending=closed.box(request).catch(e=>e.code);let busy,queuedCancel;try{await closed.box(request)}catch(e){busy=e.code}
 const pre=new AbortController();pre.abort();try{await closed.box(request,{signal:pre.signal})}catch(e){queuedCancel=e.code}
 closed.close();const close=await pending;
 const broken=createVerifiedManifoldMount({...options,workerUrl:'/static/oci-crash-double.js'});let crash;try{await broken.ready}catch(e){crash=e.code}broken.close();
 const crashes=createVerifiedManifoldMount({...options,workerUrl:'/static/oci-operation-crash-double.js'});await crashes.ready;let operationCrash;try{await crashes.box(request)}catch(e){operationCrash=e.code}crashes.close();
 const df=createVerifiedManifoldMount({...options,workerUrl:'/static/manifold-delete-failure-double.js'});await df.ready;const obj=await df.box(request);let failedDelete,afterDelete;
 try{await df.dispose({op:'solid.dispose',version:1,handle:obj.handle})}catch(e){failedDelete=e.code}
 try{await df.box(request)}catch(e){afterDelete=e.code}df.close();
 return {timeout,cancel,close,busy,queuedCancel,crash,operationCrash,failedDelete,afterDelete};
});
assert.deepEqual(lifecycle,{timeout:'TIMEOUT',cancel:'CANCELLED',close:'MOUNT_CLOSED',busy:'BUSY',queuedCancel:'CANCELLED',crash:'ENGINE_FAILURE',operationCrash:'ENGINE_FAILURE',failedDelete:'ENGINE_FAILURE',afterDelete:'MOUNT_CLOSED'});
const inspector=await browser.target().createCDPSession(),until=Date.now()+5000;
const live=async()=>(await inspector.send('Target.getTargets')).targetInfos.filter(x=>x.type==='worker'&&/manifold-verified-worker|oci-verified-worker|oci-lifecycle-double|oci-crash-double|oci-operation-crash-double|manifold-delete-failure-double/.test(x.url));
while((await live()).length&&Date.now()<until)await new Promise(resolve=>setTimeout(resolve,20));assert.equal((await live()).length,0);
assert.deepEqual(await page.evaluate(()=>window.cspViolations),[]);
console.log('PASS verified Manifold mesh worker box/Boolean/empty/components and owned cleanup');
}finally{await context.close();browser.disconnect();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
