// Real pinned engines, explicit zero/one/multiple results, independent box
// volume/bounds oracles, and input-mesh preservation. No fake Worker or canvas.
const assert=require('node:assert/strict'),puppeteer=require('puppeteer-core');
const base=new URL(process.env.CODI_SOLID_MESH_URL),cdp=process.env.CODI_TEST_CDP||'http://127.0.0.1:19329';
(async()=>{const browser=await puppeteer.connect({browserURL:cdp,protocolTimeout:120000}),context=await browser.createBrowserContext();try{
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const response=await page.goto(new URL('static/index.html',base).href);assert.match(response.headers()['content-security-policy'],/worker-src 'self'/);
 const result=await page.evaluate(async()=>{
  const modules={occ:await import('./oci-verified-mount.mjs'),manifold:await import('./manifold-verified-mount.mjs')},workers=[];const NativeWorker=Worker;
  globalThis.Worker=class extends NativeWorker{constructor(...args){super(...args);workers.push(this)}terminate(){this.stopped=true;return super.terminate()}};
  const check=(v,message)=>{if(!v)throw Error(message)},same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const cases=[
   {id:'overlap-union',kind:'union',b:[5,0,0],volume:1500,count:1},
   {id:'face-union',kind:'union',b:[10,0,0],volume:2000,count:1},
   {id:'edge-union',kind:'union',b:[10,10,0],volume:2000,count:2},
   {id:'point-union',kind:'union',b:[10,10,10],volume:2000,count:2},
   {id:'disjoint-union',kind:'union',b:[20,0,0],volume:2000,count:2},
   {id:'disjoint-common',kind:'common',b:[20,0,0],volume:0,count:0},
   {id:'identical-subtract',kind:'subtract',b:[0,0,0],volume:0,count:0}
  ],results=[];
  for(const engine of ['occ','manifold'])for(const c of cases){
   const mount=(engine==='occ'?modules.occ.createVerifiedOciMount:modules.manifold.createVerifiedManifoldMount)({workerUrl:'/static/'+(engine==='occ'?'oci':'manifold')+'-verified-worker.js',jsPath:'/static/'+(engine==='occ'?'occ-portable':'manifold')+'.js',wasmPath:'/static/'+engine+'.wasm'});
   try{await mount.ready;const box=origin=>mount.execute({op:'solid.box.create',version:1,unit:'millimeter',origin,dimensions:[10,10,10]});
    const a=await box([0,0,0]),b=await box(c.b),read=s=>mount.readSolidMesh({op:'solid.mesh.read',version:1,handle:s.handle});
    const before=await Promise.all([read(a)]);const beforeB=await read(b);
    const r=await mount.execute({op:'solid.boolean.'+c.kind,version:1,unit:'millimeter',a:a.handle,b:b.handle}),m=await read(r);
    const e=r.evidence,volume=engine==='occ'?e.signedVolume:e.volume;
    check(Math.abs(volume-c.volume)<1e-7,engine+'/'+c.id+' volume');check(e.resultKind===(c.count===0?'empty':engine==='occ'?(c.count===1?'single-solid':'multi-solid'):'mesh-container'),engine+'/'+c.id+' kind');
    const p=new Float64Array(m.buffer);let integrated=0;
    for(let i=0;i<p.length;i+=9)integrated+=(p[i]*(p[i+4]*p[i+8]-p[i+5]*p[i+7])+p[i+1]*(p[i+5]*p[i+6]-p[i+3]*p[i+8])+p[i+2]*(p[i+3]*p[i+7]-p[i+4]*p[i+6]))/6;
    check(Math.abs(integrated-c.volume)<1e-7,engine+'/'+c.id+' independent mesh volume');
    const expectedBounds=c.count===0?null:{min:[0,0,0],max:c.b.map(n=>n+10)};
    check(same(e.bounds,expectedBounds),engine+'/'+c.id+' expected bounds');
    if(engine==='occ')check(e.solidCount===c.count&&e.nativeValidity.valid===true,engine+'/'+c.id+' native classification');
    check(e.materialRegions===null&&e.voidRegions===null,'unknown material census must stay unknown');
    check(m.displayStatus==='available'&&m.displayReason===null&&m.displayBuffer.byteLength===m.triangleCount*36,'worker display projection');
    check(same(Array.from(new Float32Array(m.displayBuffer)),Array.from(new Float64Array(m.buffer))),'display coordinates');
    if(c.count===0){check(e.bounds===null&&m.triangleCount===0,'empty metadata');const reused=await mount.execute({op:'solid.boolean.union',version:1,unit:'millimeter',a:r.handle,b:a.handle}),rm=await read(reused);check(Math.abs((engine==='occ'?rm.evidence.signedVolume:rm.evidence.volume)-1000)<1e-7,'empty reuse');}
    check(same(Array.from(new Float64Array((await read(a)).buffer)),Array.from(new Float64Array(before[0].buffer))),'A mutated');check(same(Array.from(new Float64Array((await read(b)).buffer)),Array.from(new Float64Array(beforeB.buffer))),'B mutated');
    await mount.execute({op:'solid.dispose',version:1,handle:r.handle});let refused=false;try{mount.assertSolidBinding(r.handle)}catch(e){refused=e.code==='INVALID_HANDLE'}check(refused,'disposed handle admitted');
    results.push({engine,id:c.id,kind:e.resultKind,volume,solidCount:e.solidCount,meshComponents:e.meshComponents??null,triangles:m.triangleCount});
   }finally{mount.close()}
  }
  check(workers.length===cases.length*2&&workers.every(w=>w.stopped),'worker cleanup');return {results,workersStarted:workers.length,workersTerminated:workers.filter(w=>w.stopped).length};
 });assert.deepEqual(errors,[]);console.log(JSON.stringify(result,null,2));console.log('PASS actual OCC/Manifold zero/one/multiple result semantics, empty reuse and operand preservation');
}finally{await context.close();browser.disconnect()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
