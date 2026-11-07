const assert=require('node:assert/strict'), puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL||'http://127.0.0.1:19353/'), cdp=new URL(process.env.CODI_TEST_CDP||'http://127.0.0.1:19352/');
for(const u of [base,cdp])if(!['127.0.0.1','localhost','[::1]'].includes(u.hostname))throw Error('Loopback only');
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:120000}), context=await browser.createBrowserContext();
try{const page=await context.newPage();
await page.evaluateOnNewDocument(()=>{window.cspViolations=[];document.addEventListener('securitypolicyviolation',e=>cspViolations.push(e.violatedDirective));});
const response=await page.goto(new URL('static/engine-test.html',base));
assert.match(response.headers()['content-security-policy'],/blob:/);assert.doesNotMatch(response.headers()['content-security-policy'],/'unsafe-eval'/);
const result=await page.evaluate(async()=>{
 const {createVerifiedOciMount}=await import('./oci-verified-mount.mjs');
 const opts={workerUrl:'/static/oci-verified-worker.js',jsPath:'/static/occ-portable.js',wasmPath:'/lib-assets/jsketcher-occ-engine/occt.wasm'};
 const m=createVerifiedOciMount(opts);await m.ready;
 const {operationSchemasV1}=await import('./inventory.mjs');
 const schemasValid=m.descriptor.operations.every(op=>operationSchemasV1[op.input]&&operationSchemasV1[op.output]);
 const box=(origin,dimensions)=>({op:'solid.box.create',version:1,unit:'millimeter',origin,dimensions});
 const bool=(kind,a,b)=>({op:'solid.boolean.'+kind,version:1,unit:'millimeter',a,b});
 const dispose=handle=>({op:'solid.dispose',version:1,handle});
 const mutableBox=box([0,0,0],[10,10,10]), aPending=m.box(mutableBox);mutableBox.op='changed';const a=await aPending;
 const b=await m.box(box([5,0,0],[10,10,10]));
 const mutableCommon=bool('common',a.handle,b.handle), commonPending=m.boolean(mutableCommon);mutableCommon.op='changed';const common=await commonPending;
 const union=await m.boolean(bool('union',a.handle,b.handle));
 const subtract=await m.boolean(bool('subtract',a.handle,b.handle));
 const other=createVerifiedOciMount(opts);await other.ready;
 let foreign,stale,identical,budget,nonfinite,malformed,unsupported,badSignal;
 try{await m.execute({op:'solid.fillet',version:1})}catch(e){unsupported=e.code}
 try{await m.box(box([0,0,0],[Infinity,1,1]))}catch(e){nonfinite=e.code}
 try{await m.box({...box([0,0,0],[1,1,1]),extra:true})}catch(e){malformed=e.code}
 let sparseOrigin,sparseDimensions;
 const sparse=[0,,0];try{await m.box(box(sparse,[1,1,1]))}catch(e){sparseOrigin=e.code}
 try{await m.box(box([0,0,0],[1,,1]))}catch(e){sparseDimensions=e.code}
 try{await m.box(box([0,0,0],[1,1,1]),{signal:null})}catch(e){badSignal=e.code}
 try{await other.boolean(bool('common',a.handle,b.handle))}catch(e){foreign=e.code}
 try{await m.boolean(bool('common',a.handle,a.handle))}catch(e){identical=e.code}
 const originalA=structuredClone(a.handle),mutableDispose=dispose(a.handle),disposal=m.dispose(mutableDispose);
 mutableDispose.op='changed';mutableDispose.handle.id='changed';const disposeResult=await disposal;
 try{await m.boolean(bool('common',originalA,b.handle))}catch(e){stale=e.code}
 await m.dispose(dispose(b.handle));await m.dispose(dispose(common.handle));await m.dispose(dispose(union.handle));await m.dispose(dispose(subtract.handle));
 for(let i=0;i<3;i++){const x=await m.box(box([0,0,0],[1,1,1]));await m.dispose(dispose(x.handle));}
 try{await m.box(box([0,0,0],[1,1,1]))}catch(e){budget=e.code}
 m.close();other.close();
 const bad=createVerifiedOciMount({...opts,wasmPath:'/static/occ-portable.js'});let tampered;
 try{await bad.ready}catch(e){tampered=e.code}bad.close();
 const badJs=createVerifiedOciMount({...opts,jsPath:'/static/engine-test.html'});let tamperedJs;
 try{await badJs.ready}catch(e){tamperedJs=e.code}badJs.close();
 const emptyMount=createVerifiedOciMount(opts);await emptyMount.ready;
 const ea=await emptyMount.box(box([0,0,0],[1,1,1])), eb=await emptyMount.box(box([10,0,0],[1,1,1]));let emptyResult,emptySubtract;
 try {emptyResult={value:await emptyMount.boolean(bool('common',ea.handle,eb.handle))};} catch(e) {emptyResult={code:e.code,message:e.message};}
 const ec=await emptyMount.box(box([0,0,0],[1,1,1]));
 try {await emptyMount.boolean(bool('subtract',ea.handle,ec.handle));} catch(e) {emptySubtract=e.code;}
 let preserved;try{const u=await emptyMount.boolean(bool('subtract',eb.handle,ea.handle));preserved=!!u.handle}catch(e){preserved=e.code}emptyMount.close();
 return {a:a.evidence,b:b.evidence,common:common.evidence,union:union.evidence,subtract:subtract.evidence,foreign,stale,identical,tampered,tamperedJs,budget,nonfinite,malformed,unsupported,badSignal,schemasValid,emptyResult,emptySubtract,preserved,sparseOrigin,sparseDimensions,boxOp:a.op,booleanOp:common.op,disposeOp:disposeResult.op};
});
console.log('OCI workflow:',JSON.stringify(result));
assert.deepEqual(result.a.bounds,{min:[0,0,0],max:[10,10,10]});
assert.deepEqual(result.b.bounds,{min:[5,0,0],max:[15,10,10]});
assert.deepEqual(result.common.bounds,{min:[5,0,0],max:[10,10,10]});
assert.ok(Math.abs(Math.abs(result.common.signedVolume)-500)<1e-6, 'intersection volume must be 500 cubic mm');
assert.deepEqual(result.union.bounds,{min:[0,0,0],max:[15,10,10]});
assert.ok(Math.abs(Math.abs(result.union.signedVolume)-1500)<1e-6, 'union volume must be 1500 cubic mm');
assert.deepEqual(result.subtract.bounds,{min:[0,0,0],max:[5,10,10]});
assert.ok(Math.abs(Math.abs(result.subtract.signedVolume)-500)<1e-6, 'difference volume must be 500 cubic mm');
assert.deepEqual([result.foreign,result.stale,result.identical,result.tampered,result.tamperedJs,result.budget,result.nonfinite,result.malformed,result.unsupported,result.badSignal],
 ['INVALID_HANDLE','INVALID_HANDLE','INVALID_REQUEST','ENGINE_FAILURE','ENGINE_FAILURE','RESOURCE_LIMIT','INVALID_REQUEST','INVALID_REQUEST','UNSUPPORTED_OPERATION','INVALID_REQUEST']);
assert.equal(result.schemasValid,true,'each discovered operation has declared input and output schemas');
assert.equal(result.emptyResult.code,'EMPTY_OR_NON_SOLID_UNSUPPORTED');assert.equal(result.emptySubtract,'EMPTY_OR_NON_SOLID_UNSUPPORTED');
assert.equal(result.preserved,true,'empty-result refusal preserves both input handles and the mount');
assert.deepEqual([result.sparseOrigin,result.sparseDimensions],['INVALID_REQUEST','INVALID_REQUEST']);
assert.deepEqual([result.boxOp,result.booleanOp,result.disposeOp],['solid.box.create','solid.boolean.common','solid.dispose']);
const lifecycle=await page.evaluate(async()=>{
 const {createVerifiedOciMount}=await import('./oci-verified-mount.mjs');
 const options={workerUrl:'/static/oci-lifecycle-double.js',jsPath:'/static/occ-portable.js',wasmPath:'/lib-assets/jsketcher-occ-engine/occt.wasm',timeoutMs:200};
 const request={op:'solid.box.create',version:1,unit:'millimeter',origin:[0,0,0],dimensions:[1,1,1]};
 const timed=createVerifiedOciMount(options);await timed.ready;let timeout;
 try{await timed.box(request)}catch(e){timeout=e.code}timed.close();
 const aborted=createVerifiedOciMount(options);await aborted.ready;const c=new AbortController();
 const work=aborted.box(request,{signal:c.signal}).catch(e=>e.code);c.abort();const cancel=await work;aborted.close();
 const closed=createVerifiedOciMount(options);await closed.ready;
 const pending=closed.box(request).catch(e=>e.code);let busy;try{await closed.box(request)}catch(e){busy=e.code}
 const queuedController=new AbortController();queuedController.abort();let queuedCancel;
 try{await closed.box(request,{signal:queuedController.signal})}catch(e){queuedCancel=e.code}
 closed.close();const close=await pending;
 const broken=createVerifiedOciMount({...options,workerUrl:'/static/oci-crash-double.js'});let crash;
 try{await broken.ready}catch(e){crash=e.code}broken.close();
 const crashesDuringWork=createVerifiedOciMount({...options,workerUrl:'/static/oci-operation-crash-double.js'});await crashesDuringWork.ready;let operationCrash;
 try{await crashesDuringWork.box(request)}catch(e){operationCrash=e.code}crashesDuringWork.close();
 return {timeout,cancel,close,crash,operationCrash,busy,queuedCancel};
});
assert.deepEqual(lifecycle,{timeout:'TIMEOUT',cancel:'CANCELLED',close:'MOUNT_CLOSED',crash:'ENGINE_FAILURE',operationCrash:'ENGINE_FAILURE',busy:'BUSY',queuedCancel:'CANCELLED'});
const inspector=await browser.target().createCDPSession(), until=Date.now()+5000;
const live=async()=>(await inspector.send('Target.getTargets')).targetInfos.filter(x=>x.type==='worker'&&/oci-(verified-worker|lifecycle-double|crash-double|operation-crash-double)/.test(x.url));
while((await live()).length&&Date.now()<until)await new Promise(resolve=>setTimeout(resolve,20));
assert.equal((await live()).length,0,'closed, timed-out and crashed worker targets must disappear');
assert.deepEqual(await page.evaluate(()=>window.cspViolations),[]);
console.log('PASS verified OCI worker Boolean workflow, independent bounds/volume and lifecycle/refusal controls');
}finally{await context.close();browser.disconnect();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
