// Exercises the production Worker entry through the unchanged production client.
const assert=require('node:assert/strict'),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL||'http://127.0.0.1:19931/'),cdp=new URL(process.env.CODI_TEST_CDP||'http://127.0.0.1:19875/');
if(![base,cdp].every(u=>['127.0.0.1','localhost','[::1]'].includes(u.hostname)))throw Error('Loopback only');
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href}),context=await browser.createBrowserContext();try{
 const page=await context.newPage();await page.goto(base.href);await page.addScriptTag({url:new URL('static/client.js',base).href});
 const out=await page.evaluate(async()=>{
  const frame={origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]};
  const request={task:'rectangle',revision:'draft-1',unit:'millimeter',frame,origin:[10,20],width:100,height:50};
  const run=r=>window.testHeadlessSketchClient('/static/worker.js',r);
  const before=JSON.stringify(request),success=await run(request),again=await run(request);
  const variants=[{width:0},{height:-1},{width:Infinity},{origin:[1,,]},{frame:{...frame,x:[1,,0]}},{frame:{...frame,z:[0,0,-1]}},{unit:'inch'},{extra:'bad'},{origin:[-1e8,-1e8],width:0.001,height:0.001},{origin:[1e8,0],width:0.001,height:0.001},{task:'other'}];
  const invalid=[];for(const variant of variants)invalid.push(await run({...request,...variant}));
  const edit={revision:'edit',sketch:structuredClone(success.sketch),boundary:structuredClone(success.sketch.boundary),externalParameters:{}};
  const lengths=edit.sketch.stages[0].constraints.filter(c=>c.typeId==='SegmentLength');lengths[0].constants.length='150';lengths[1].constants.length='30';
  const edited=await run(edit); // task absent means existing solve contract
  const pre=new AbortController();pre.abort();let preError='';try{await window.testHeadlessSketchClient('/static/worker.js',request,{signal:pre.signal})}catch(e){preError=e.name}
  const Native=window.Worker,controller=new AbortController();let started=0,terminated=0;
  window.Worker=class extends Native{constructor(...args){super(...args);started++;setTimeout(()=>controller.abort(),0)}terminate(){terminated++;return super.terminate()}};
  let activeError='';try{await window.testHeadlessSketchClient('/static/worker.js',request,{signal:controller.signal})}catch(e){activeError=e.name}finally{window.Worker=Native}
  let invalidGuard='';try{await window.testHeadlessSketchClient('/static/worker.js',request,{valid:()=>false})}catch(e){invalidGuard=e.name}
  return {success,again,invalid,edited,preError,activeError,invalidGuard,started,terminated,unchanged:before===JSON.stringify(request)};
 });
 assert.equal(out.success.ok,true,JSON.stringify(out.success));assert.equal(out.success.revision,'draft-1');assert.equal(out.unchanged,true);assert.deepEqual(out.again,out.success);
 assert.deepEqual(JSON.parse(out.success.serializedSketch),out.success.sketch);assert.equal(out.success.evidence.length,11);
 for(const row of out.success.evidence){assert.equal(row.state,'accepted');assert.ok(row.residuals.every(n=>Number.isFinite(n)&&Math.abs(n)<=row.tolerance));}
 const vertices=[[10,20],[110,20],[110,70],[10,70]];
 out.success.sketch.objects.forEach((o,i)=>{assert.equal(o.id,'rect-'+i);for(const [a,b] of [[o.data.a,vertices[i]],[o.data.b,vertices[(i+1)%4]]])assert.ok(Math.hypot(a.x-b[0],a.y-b[1])<1e-6)});
 assert.ok(out.invalid.every(x=>x.ok===false));assert.equal(out.invalid.at(-1).error.code,'UNSUPPORTED');assert.deepEqual(out.invalid.slice(0,-1).map(x=>x.error.code),['RECTANGLE_DOMAIN','RECTANGLE_DOMAIN','RECTANGLE_DOMAIN','RECTANGLE_DOMAIN','INVALID','INVALID','INVALID','INVALID','RECTANGLE_PRECISION','RECTANGLE_DOMAIN']);assert.equal(out.invalid[6].error.message,'Rectangle request could not be prepared.');assert.equal(out.invalid[8].error.message,'Rectangle dimensions exceed numerical precision at this origin.');assert.equal(out.invalid[9].error.message,'Rectangle corners must remain within the local coordinate limit.');
 assert.equal(out.edited.ok,true,JSON.stringify(out.edited));assert.equal(out.edited.revision,'edit');assert.equal(out.edited.sketch.objects[0].data.b.x,160);assert.equal(out.edited.sketch.objects[1].data.b.y,50);
 assert.equal(out.preError,'AbortError');assert.equal(out.activeError,'AbortError');assert.equal(out.invalidGuard,'AbortError');assert.equal(out.started,1);assert.equal(out.terminated,1);
 console.log('PASS production rectangle Worker task, strict serialized sketch, legacy solve, malformed requests and real-worker cancellation');
 }finally{await context.close();browser.disconnect()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
