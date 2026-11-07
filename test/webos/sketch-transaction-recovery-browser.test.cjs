// Real sketch model: injected stage rollback failure must retain a recovery checkpoint.
const assert=require('node:assert/strict'),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);for(const u of [base,cdp])if(!['127.0.0.1','localhost','[::1]'].includes(u.hostname))throw Error('Loopback only');
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href});try{for(const mode of ['length','distance']){const context=await browser.createBrowserContext();try{
 const page=await context.newPage();await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base));await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});await page.addScriptTag({url:new URL('static/webosTest.bundle.js',base).href});
 const result=await page.evaluate(async mode=>{window.Cypress={$:s=>{const a=[...document.querySelectorAll(s)];a.index=n=>a.indexOf(n);return a}};const ui=webosTest.modellerUISubject(__CAD_APP),[sketch]=await webosTest.createPlaneAndOpenSketcher(ui),c=__CAD_APP.services.sketcher.inPlaceEditor.sketcherAppContext,v=sketch.viewer,pm=v.parametricManager,h=v.historyManager;
  const a=sketch.addSegment(10,10,40,10),b=sketch.addSegment(10,30,20,30),ids=mode==='length'?[a.id,b.id]:[a.a.id,a.b.id],action=c.actions[mode==='length'?'LengthRelation':'SignedDistanceX'];
  const inspected=await action.inspect(c,{valid:()=>true}),before=v.io.serializeSketch(undefined,{strict:true}),sys=pm.stages[0].algNumSystem,originalAdd=pm._add,originalRollback=sys.rollbackTransaction;
  pm._add=function(x){originalAdd.call(this,x);throw Error('injected admission failure')};sys.rollbackTransaction=()=>{throw Error('injected rollback failure')};
  let rejected=false,held=false;try{if(mode==='length')await action.invokeByIds(c,ids,{factor:2,offset:0},inspected.revision,{valid:()=>true});else await action.invokeByIds(c,ids,30,inspected.revision,{valid:()=>true})}catch(e){rejected=/held for recovery/.test(e.message);held=!!h.recoverySnapshot}finally{pm._add=originalAdd;sys.rollbackTransaction=originalRollback}
  const recovered=h.recover(),restored=v.io.serializeSketch(undefined,{strict:true})===before;
  const next=await action.inspect(c,{valid:()=>true});let accepted=false;try{if(mode==='length')await action.invokeByIds(c,ids,{factor:2,offset:0},next.revision,{valid:()=>true});else await action.invokeByIds(c,ids,30,next.revision,{valid:()=>true});accepted=true}catch{}
  return {rejected,held,recovered,restored,accepted};},mode);
 assert.deepEqual(result,{rejected:true,held:true,recovered:true,restored:true,accepted:true},mode);console.log('PASS '+mode+' transaction failed rollback, recovery and subsequent edit');
 }finally{await context.close()}}}finally{browser.disconnect()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
