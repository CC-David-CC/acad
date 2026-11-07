// Real dedicated workers, source-pinned WASM, no application UI or mock replies.
const assert=require('node:assert/strict');
const puppeteer=require('puppeteer-core');
const base=process.env.CODI_SOLID_MESH_URL||'http://127.0.0.1:20467/';
(async()=>{
 const browser=await puppeteer.connect({browserURL:process.env.CODI_TEST_CDP||'http://127.0.0.1:19329',protocolTimeout:60000});
 const context=await browser.createBrowserContext();
 try{
  const page=await context.newPage(),failures=[];
  page.on('pageerror',e=>failures.push(String(e)));
  const response=await page.goto(new URL('static/index.html',base).href);
  const csp=response.headers()['content-security-policy']||'';
  assert.match(csp,/'wasm-unsafe-eval'/);assert.doesNotMatch(csp,/(?:^|\s)'unsafe-eval'/);
  const result=await page.evaluate(async()=>{
   const NativeWorker=globalThis.Worker,workers=[];
   globalThis.Worker=class extends NativeWorker{constructor(...args){super(...args);workers.push(this);this.closed=false;}terminate(){this.closed=true;return super.terminate();}};
   const {createVerifiedOciMount}=await import('./oci-verified-mount.mjs');
   const {createVerifiedManifoldMount}=await import('./manifold-verified-mount.mjs');
   function check(value,message){if(!value)throw Error(message);}
   async function refused(fn,code){try{await fn();throw Error('unexpected acceptance');}catch(e){check(e.code===code,'expected '+code+', got '+String(e.code)+': '+e.message);}}
   function measure(buffer){
    const p=new Float64Array(buffer),min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];let volume=0;
    for(let i=0;i<p.length;i+=9){for(let j=0;j<9;j++){check(Number.isFinite(p[i+j]),'nonfinite mesh');min[j%3]=Math.min(min[j%3],p[i+j]);max[j%3]=Math.max(max[j%3],p[i+j]);}
     volume+=(p[i]*(p[i+4]*p[i+8]-p[i+5]*p[i+7])+p[i+1]*(p[i+5]*p[i+6]-p[i+3]*p[i+8])+p[i+2]*(p[i+3]*p[i+7]-p[i+4]*p[i+6]))/6;
    }return {volume,min:p.length?min:null,max:p.length?max:null};
   }
   const results=[];
   for(const engine of ['occ','manifold']){
    const make=engine==='occ'?createVerifiedOciMount:createVerifiedManifoldMount;
    const mount=make({workerUrl:'/static/'+(engine==='occ'?'oci':'manifold')+'-verified-worker.js',jsPath:'/static/'+(engine==='occ'?'occ-portable':'manifold')+'.js',wasmPath:'/static/'+engine+'.wasm',timeoutMs:30000});
    try{
     await mount.ready;
     const box=origin=>mount.execute({op:'solid.box.create',version:1,unit:'millimeter',origin,dimensions:[10,20,30]});
     const a=await box([0,0,0]),b=await box([5,0,0]);
     // Public response mutation cannot change the trusted binding evidence.
     a.evidence.triangles=999;a.evidence.bounds.min[0]=-123;
     await refused(()=>mount.readSolidMesh({op:'solid.mesh.read',version:1,handle:{...a.handle,id:'foreign'}}),'INVALID_HANDLE');
     const seen=[];
     for(const [operation,expected] of [['a',6000],['common',3000],['union',9000],['subtract',3000]]){
      const solid=operation==='a'?a:await mount.execute({op:'solid.boolean.'+operation,version:1,unit:'millimeter',a:a.handle,b:b.handle});
      check(mount.assertSolidBinding(solid.handle)===true,'binding');
      const mesh=await mount.readSolidMesh({op:'solid.mesh.read',version:1,handle:solid.handle});
      check(mesh.quality==='display-only'&&mesh.unit==='millimeter'&&mesh.buffer.byteLength===mesh.triangleCount*72,'mesh metadata');
      const measured=measure(mesh.buffer);check(Math.abs(measured.volume-expected)<1e-7,'volume '+engine+'/'+operation+': '+measured.volume);
      check(JSON.stringify(measured.min)===JSON.stringify(mesh.evidence.bounds.min)&&JSON.stringify(measured.max)===JSON.stringify(mesh.evidence.bounds.max),'bounds');
      seen.push({operation,triangles:mesh.triangleCount,...measured});
      if(operation==='a'){
       new Float64Array(mesh.buffer).fill(0);
       const reread=await mount.readSolidMesh({op:'solid.mesh.read',version:1,handle:solid.handle});
       check(Math.abs(measure(reread.buffer).volume-6000)<1e-7,'public display mutation reached kernel');
      }
     }
     await mount.execute({op:'solid.dispose',version:1,handle:a.handle});
     await refused(()=>mount.readSolidMesh({op:'solid.mesh.read',version:1,handle:a.handle}),'INVALID_HANDLE');
     check(mount.assertSolidBinding(b.handle)===true,'other operand lost');
     const abort=new AbortController();abort.abort();
     await refused(()=>mount.readSolidMesh({op:'solid.mesh.read',version:1,handle:b.handle},{signal:abort.signal}),'CANCELLED');
     results.push({engine,seen});
    }finally{mount.close();}
    await refused(()=>mount.assertSolidBinding({generation:1,id:'x',mountId:'x',representation:'x'}),'MOUNT_CLOSED');
   }
   check(workers.length===2&&workers.every(w=>w.closed),'worker termination imbalance');
   return {results,workersStarted:workers.length,workersTerminated:workers.filter(w=>w.closed).length};
  });
  assert.deepEqual(failures,[]);assert.equal(result.results.length,2);
  console.log(JSON.stringify(result));console.log('PASS real OCC/Manifold owned display mesh, operand preservation, refusal and worker termination');
 }finally{await context.close();browser.disconnect();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
