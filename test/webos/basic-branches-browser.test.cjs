// Real sketch commands; loopback-only fixture and disposable browser context.
const assert=require('node:assert/strict');
const puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL||'http://127.0.0.1:19332/'),cdp=new URL(process.env.CODI_TEST_CDP||'http://127.0.0.1:19331/');
for(const u of [base,cdp])if(!['127.0.0.1','localhost','[::1]'].includes(u.hostname))throw Error('Loopback only');
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href}),context=await browser.createBrowserContext();try{
 const page=await context.newPage();await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base).href,{waitUntil:'domcontentloaded'});await page.waitForFunction('window.__CAD_APP?.streams?.lifecycle?.projectLoaded?.value === true',{timeout:90000});await page.addScriptTag({url:new URL('static/webosTest.bundle.js',base).href});
 const result=await page.evaluate(async()=>{window.Cypress={$:s=>{const a=[...document.querySelectorAll(s)];a.index=n=>a.indexOf(n);return a}};const ui=webosTest.modellerUISubject(__CAD_APP),[sketch]=await webosTest.createPlaneAndOpenSketcher(ui),ctx=__CAD_APP.services.sketcher.inPlaceEditor.sketcherAppContext;
  const run=(id,a,b)=>{const first=sketch.addSegment(...a),second=sketch.addSegment(...b),before=[second.a.x,second.a.y,second.b.x,second.b.y];ctx.actions[id].invoke(ctx,[first,second]);return {before,after:[second.a.x,second.a.y,second.b.x,second.b.y]}};
  const cases={parallelSame:run('Parallel',[-100,-150,0,-150],[10,-120,110,-120]),parallelOpposite:run('Parallel',[-100,-80,0,-80],[110,-50,10,-50]),perpendicularPositive:run('Perpendicular',[-100,0,0,0],[10,10,10,110]),perpendicularNegative:run('Perpendicular',[-100,150,0,150],[110,120,110,20])};
  const before=JSON.parse(ctx.viewer.io.serializeSketch(undefined,{strict:true}));ctx.viewer.io.loadSketch(JSON.stringify(before),{strict:true});const after=JSON.parse(ctx.viewer.io.serializeSketch(undefined,{strict:true}));
  return {cases,before,after};
 });
 for(const [name,item] of Object.entries(result.cases))for(let i=0;i<4;i++)assert.ok(Math.abs(item.after[i]-item.before[i])<1e-7,`${name} changed already-satisfied geometry: ${JSON.stringify(item)}`);
 assert.deepEqual(result.after,result.before,'strict sketch save/reload preserves geometry and authored intent');
 console.log('PASS rendered parallel/perpendicular preserve both already-satisfied directions and strict sketch reload',JSON.stringify(result.cases));
 }finally{await context.close();browser.disconnect()}})().catch(e=>{console.error(e);process.exitCode=1});
