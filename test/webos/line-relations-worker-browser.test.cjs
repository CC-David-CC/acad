const assert=require('node:assert/strict'),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);
if(![base,cdp].every(u=>['127.0.0.1','localhost','[::1]'].includes(u.hostname)))throw Error('Loopback only');
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href}),context=await browser.createBrowserContext();try{
 const page=await context.newPage();page.on('console',m=>{if(m.type()==='error')console.error(m.text());});
 await page.goto(base.href);await page.addScriptTag({url:new URL('static/client.js',base).href});
 const result=await page.evaluate(async()=>{
  const run=input=>window.testHeadlessSketchClient('/static/worker.js',input),frame={origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]};
  const draft=await run({task:'rectangle',revision:'draft',unit:'millimeter',frame,origin:[10,20],width:100,height:50});if(!draft.ok)return {draft};
  const solve=async(typeId,objects)=>{const sketch=structuredClone(draft.sketch);sketch.stages[0].constraints=[{typeId,objects,stage:0,annotations:[],admission:{version:1,state:'accepted'}}];return run({revision:typeId,sketch,boundary:structuredClone(sketch.boundary),externalParameters:{}});};
  const invalid=await solve('Collinear',['rect-0','rect-0']);
  const broken=structuredClone(draft.sketch);broken.objects.find(o=>o.id==='rect-0').data.b=structuredClone(broken.objects.find(o=>o.id==='rect-0').data.a);
  broken.stages[0].constraints=[{typeId:'AxisSymmetry',objects:['rect-1:A','rect-1:B','rect-0'],stage:0,annotations:[],admission:{version:1,state:'accepted'}}];
  const degenerate=await run({revision:'degenerate',sketch:broken,boundary:structuredClone(broken.boundary),externalParameters:{}});
  return {collinear:await solve('Collinear',['rect-0','rect-2']),symmetry:await solve('AxisSymmetry',['rect-1:A','rect-1:B','rect-0']),invalid,degenerate};
 });
 assert.equal(result.invalid.ok,false);assert.equal(result.invalid.error.code,'INVALID');delete result.invalid;
 assert.equal(result.degenerate.ok,false);assert.equal(result.degenerate.error.code,'INVALID');delete result.degenerate;
 for(const [name,out] of Object.entries(result)){assert.equal(out.ok,true,`${name}: ${JSON.stringify(out.error)}`);assert.ok(out.evidence.every(e=>e.residuals.every(n=>Number.isFinite(n)&&Math.abs(n)<=e.tolerance)));}
 const segment=(out,id)=>out.sketch.objects.find(o=>o.id===id).data;
 const cross=(a,b,p)=>(b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);
 const axis=segment(result.collinear,'rect-0'),other=segment(result.collinear,'rect-2'),length=Math.hypot(axis.b.x-axis.a.x,axis.b.y-axis.a.y);
 assert.ok(Math.abs(cross(axis.a,axis.b,other.a))/length<1e-6&&Math.abs(cross(axis.a,axis.b,other.b))/length<1e-6);
 const s=segment(result.symmetry,'rect-0'),points=segment(result.symmetry,'rect-1'),dx=s.b.x-s.a.x,dy=s.b.y-s.a.y,n=Math.hypot(dx,dy);
 const midpoint={x:(points.a.x+points.b.x)/2,y:(points.a.y+points.b.y)/2};
 assert.ok(Math.abs(cross(s.a,s.b,midpoint))/n<1e-6);assert.ok(Math.abs(dx*(points.b.x-points.a.x)+dy*(points.b.y-points.a.y))/n<1e-6);
 console.log('PASS real Chromium sketch Worker collinear and independent-axis symmetry');
}finally{await context.close();browser.disconnect();}})().catch(error=>{console.error(error.stack);process.exitCode=1});
