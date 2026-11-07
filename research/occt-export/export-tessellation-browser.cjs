// Research probe; require explicit loopback test runtime, Chrome and puppeteer.
const assert=require('node:assert/strict');
const puppeteer=require(process.env.PUPPETEER_CORE_PATH || 'puppeteer-core');
const url=new URL(process.env.CODI_OCC_TEST_URL),cdp=new URL(process.env.CODI_OCC_TEST_CDP || 'http://127.0.0.1:19255');
if(![url,cdp].every(u=>['localhost','127.0.0.1','[::1]'].includes(u.hostname))) throw Error('Loopback endpoints required');
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:120000}),context=await browser.createBrowserContext();try{
 const p=await context.newPage();await p.goto(url.href);await p.waitForFunction('window.__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});
 const results=await p.evaluate(()=>{
   const c=__CAD_APP;
   if(typeof Module._ExportTessellationCopy!=='function')throw Error('Prototype WASM not loaded');
   const shape=(type,params)=>c.operationService.get(type).run({...params,featureId:101,boolean:{kind:'NONE'}},c).created[0];
   const box=shape('BOX',{x:10,y:20,z:30});const sphere=shape('SPHERE',{radius:10});
   function ptr(s){return s.brepShell.data.externals.ptr}
   function exportMesh(s,def){const code=Module._ExportTessellationCopy(ptr(s),def);if(code!==0)throw Error('Export code '+code);return window.__OCI_EXCHANGE_VAL;}
   const before=JSON.stringify({id:box.id,faces:box.faces.map(f=>f.id),ptr:ptr(box)});
   const b=exportMesh(box,0.1),coarse=exportMesh(sphere,2),fine=exportMesh(sphere,0.05);
   const csys={origin:{x:3,y:4,z:5},x:{x:0,y:1,z:0},y:{x:-1,y:0,z:0},z:{x:0,y:0,z:1}};
   const placed=exportMesh(shape('BOX',{x:10,y:20,z:30,locations:{csys}}),0.1);
   const invalid=Module._ExportTessellationCopy(ptr(box),0);
   const after=JSON.stringify({id:box.id,faces:box.faces.map(f=>f.id),ptr:ptr(box)});
   function measure(data){let sum=0,lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];for(const [a,b,c] of data.triangles){sum+=(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;for(const v of [a,b,c])for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],v[k]);hi[k]=Math.max(hi[k],v[k]);}}return {deflection:data.deflection,count:data.triangles.length,volume:sum,lo,hi};}
   return {before,after,invalid,box:measure(b),placed:measure(placed),coarse:measure(coarse),fine:measure(fine)};
 });
 assert.equal(results.before,results.after);assert.notEqual(results.invalid,0);assert.equal(results.box.deflection,0.1);assert.deepEqual(results.box.lo,[0,0,0]);assert.deepEqual(results.box.hi,[10,20,30]);assert.ok(Math.abs(results.box.volume-6000)<1e-6,JSON.stringify(results));assert.deepEqual(results.placed.lo,[-17,4,5]);assert.deepEqual(results.placed.hi,[3,14,35]);assert.ok(Math.abs(results.placed.volume-6000)<1e-6);assert.ok(results.fine.count>results.coarse.count,JSON.stringify(results));assert.ok(results.fine.volume>0,JSON.stringify(results));
 console.log(JSON.stringify(results,null,2));
 }finally{await context.close();browser.disconnect();}})().catch(e=>{console.error(e);process.exitCode=1});
