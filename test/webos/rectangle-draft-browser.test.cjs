// Real strict-CSP Worker, real IO and solver. No editor or simulated canvas.
const assert=require('node:assert/strict');
const puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL||'http://127.0.0.1:19917/');
const cdp=new URL(process.env.CODI_TEST_CDP||'http://127.0.0.1:19875/');
if(![base,cdp].every(u=>['127.0.0.1','localhost','[::1]'].includes(u.hostname)))throw Error('Loopback only');
(async()=>{
 const browser=await puppeteer.connect({browserURL:cdp.href}),context=await browser.createBrowserContext();
 try{
  const page=await context.newPage(); await page.goto(base.href);
  const r=await page.evaluate(async()=>{
   const run=input=>new Promise((resolve,reject)=>{const w=new Worker('/static/worker.js'),t=setTimeout(()=>{w.terminate();reject(Error('timeout'))},15000);w.onmessage=e=>{clearTimeout(t);w.terminate();resolve(e.data)};w.onerror=e=>{clearTimeout(t);w.terminate();reject(Error(e.message))};w.postMessage(input)});
   const xy={origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]};
   const rectangle={kind:'rectangle',unit:'millimeter',frame:xy,origin:[10,20],width:100,height:50};
   const good=await run(rectangle),again=await run(rectangle),accessor=await run({kind:'accessor'});
   const sparse=[1,,0], originSparse=[10,,];
   const badFrames=[{...xy,x:sparse},{...xy,x:[1,0]},{...xy,x:[1,0,0,0]},{...xy,x:[1+2e-9,0,0]},{...xy,x:[NaN,0,0]},{...xy,origin:[1e9+1,0,0]}];
   const bad=[]; for(const frame of badFrames)bad.push(await run({unit:'millimeter',frame}));
   const near=await run({unit:'millimeter',frame:{...xy,x:[1+2e-10,0,0]}});
   const badRects=[{width:0},{height:-1},{width:Infinity},{height:NaN},{origin:originSparse},{origin:[1,2,3]},{origin:[1e8,0],width:1},{unit:'inch'},{frame:{...xy,x:[0,0,1],z:[-1,0,0]}}];
   for(const change of badRects)bad.push(await run({...rectangle,...change}));
   const mutable={...rectangle,frame:structuredClone(xy),origin:[10,20]};const pending=run(mutable);mutable.origin[0]=999;mutable.frame.x[0]=999;const isolated=await pending;
   return {good,again,accessor,bad,near,isolated};
  });
  assert.equal(r.good.ok,true,JSON.stringify(r.good));assert.equal(r.near.ok,true,JSON.stringify(r.near));
  assert.equal(r.accessor.rejected,true);assert.equal(r.accessor.touched,false);
  for(const b of r.bad)assert.equal(b.ok,false,JSON.stringify(b));
  assert.deepEqual(r.good.sketch,r.again.sketch,'IDs and geometry are deterministic');
  assert.deepEqual(r.good.reopened,r.good.sketch,'strict IO roundtrip');
  assert.deepEqual(r.good.decoded.project.sketches[0].data,r.good.sketch,'native JSON envelope roundtrip');
  assert.deepEqual(r.isolated.sketch,r.good.sketch,'caller mutation after dispatch cannot alter the draft');
  const objects=r.good.sketch.objects;assert.deepEqual(objects.map(o=>o.id),['rect-0','rect-1','rect-2','rect-3']);
  const vertices=[[10,20],[110,20],[110,70],[10,70]];
  for(let i=0;i<4;i++){
   const {a,b}=objects[i].data, expected=vertices[i],next=vertices[(i+1)%4];
   assert.ok(Math.hypot(a.x-expected[0],a.y-expected[1])<1e-6);
   assert.ok(Math.hypot(b.x-next[0],b.y-next[1])<1e-6);
   assert.ok(Math.abs(Math.hypot(b.x-a.x,b.y-a.y)-(i%2?50:100))<1e-6);
  }
  const rows=r.good.sketch.stages[0].constraints;assert.equal(rows.length,11);assert.ok(rows.every(c=>c.admission.state==='accepted'));
  assert.equal(r.good.evidence.length,11);
  for(const e of r.good.evidence){
   assert.equal(e.state,'accepted');
   assert.ok(['millimeter','radian'].includes(e.unit));
   assert.ok(e.residuals.every(n=>Number.isFinite(n)&&Math.abs(n)<=e.tolerance));
  }
  console.log('PASS dimensioned XY rectangle, strict native roundtrip, deterministic IDs, independent geometry, invalid and isolated inputs');
 }finally{await context.close();browser.disconnect()}
})().catch(e=>{console.error(e);process.exitCode=1});
