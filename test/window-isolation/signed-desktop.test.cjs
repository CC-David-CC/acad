const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.CODI_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);
if(![base,cdp].every(x=>['127.0.0.1','localhost','[::1]'].includes(x.hostname)))throw Error('Loopback only');
(async()=>{
 const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:90000}),context=await browser.createBrowserContext();
 try{
  const page=await context.newPage(),events=[];
  page.on('console',message=>{if(message.text().startsWith('ISOLATION|'))events.push(message.text());});
  await page.evaluateOnNewDocument(()=>{
   const Native=window.Worker;
   window.Worker=class extends Native{
    constructor(...args){super(...args);console.log('ISOLATION|'+window.isolationId+'|created');this.addEventListener('message',e=>{if(this.watching&&e.data?.kind==='result')console.log('ISOLATION|'+window.isolationId+'|reply')});}
    postMessage(message,...args){const result=super.postMessage(message,...args);if(message?.kind==='research-four-corner-cut'){this.watching=true;console.log('ISOLATION|'+window.isolationId+'|dispatch')}return result;}
    terminate(){console.log('ISOLATION|'+window.isolationId+'|terminate');return super.terminate();}
   };
  });
  await page.goto(base.href);await page.waitForSelector('.login-toggle');await page.click('.login-toggle');
  const name='isolation'+crypto.randomBytes(7).toString('hex'),password=crypto.randomBytes(18).toString('base64url');
  await page.type('[aria-label=Username]',name);await page.type('[aria-label=Password]',password);await page.type('[aria-label="Confirm password"]',password);await page.click('.login-form button[type=submit]');
  await page.waitForFunction(()=>desktopLab?.session?.kind==='registered',{timeout:30000});
  await page.evaluate(()=>surfaces.get('Desktop').launch('jsketcher'));
  await page.waitForFunction(()=>document.querySelectorAll('.jsketcher-app iframe').length===1,{timeout:60000});
  await page.evaluate(()=>surfaces.get('Desktop').launch('jsketcher'));
  await page.waitForFunction(()=>document.querySelectorAll('.jsketcher-app iframe').length===2,{timeout:60000});
  await page.waitForFunction(()=>{const frames=[...document.querySelectorAll('.jsketcher-app iframe')];return frames.length===2&&frames.every(f=>f.contentWindow?.__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true&&f.contentWindow.__CAD_APP.projectService.hasHostLifetime===true)},{timeout:90000});
  const frames=await page.$$('.jsketcher-app iframe'),a=await frames[0].contentFrame(),b=await frames[1].contentFrame();
  for(const [i,frame] of [a,b].entries()){
   await frame.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true && __CAD_APP.projectService.hasHostLifetime===true',{timeout:90000});
   await frame.evaluate(id=>{window.isolationId=id},i?'B':'A');
  }
  async function makeBlock(frame,width){return frame.evaluate(async width=>{const c=__CAD_APP.craftService,rectangle=await c.createRectangleSketch({revision:c.inspectRectangleCreation().revision,unit:'millimeter',origin:[0,0],width,height:50,depth:0}),info=c.inspectWorkerFeatureCommands();await c.createWorkerExtrusion({revision:info.revision,faceId:rectangle.faceId,regionId:rectangle.regionId,depth:20});const points=Array.from(c.models$.value[0].brepShell.vertices,v=>v.point.x);return Math.max(...points)-Math.min(...points);},width)}
  assert.deepEqual(await Promise.all([makeBlock(a,100),makeBlock(b,120)]),[100,120]);
  await a.evaluate(async()=>{const c=__CAD_APP.craftService,i=c.inspectWorkerFeatureCommands();await c.createWorkerCenteredHole({revision:i.revision,...i.centeredHoleCandidates[0],diameter:10})});
  const bBefore=await b.evaluate(()=>{const c=__CAD_APP.craftService,m=c.models$.value[0];return {history:JSON.stringify(c.modifications$.value),geometry:JSON.stringify(m.brepShell.faces.map(f=>f.data.tessellation.data))}});
  const caption=await frames[0].evaluateHandle(el=>el.closest('.window').querySelector('.window-caption'));await caption.asElement().click();
  const close=await frames[0].evaluateHandle(el=>el.closest('.window').querySelector('[aria-label=Close]'));assert.ok(close.asElement());await close.asElement().click();
  await page.waitForFunction(()=>[...document.querySelectorAll('dialog[open] button')].some(b=>b.textContent.trim()==='Discard changes'));
  const discard=await page.evaluateHandle(()=>[...document.querySelectorAll('dialog[open] button')].find(b=>b.textContent.trim()==='Discard changes'));
  const pending=a.evaluate(async()=>{const c=__CAD_APP.craftService,i=c.inspectWorkerFeatureCommands();await c.createWorkerFourCornerHoles({revision:i.revision,...i.fourCornerCandidates[0],diameter:4,offsetX:10,offsetY:10})}).then(()=>true,()=>false);
  const deadline=Date.now()+30000;while(!events.includes('ISOLATION|A|dispatch')&&Date.now()<deadline)await new Promise(r=>setTimeout(r,10));
  assert.ok(events.includes('ISOLATION|A|dispatch'),'actual native operation was sent');
  const terminatedBefore=events.filter(x=>x==='ISOLATION|A|terminate').length;
  await discard.asElement().click();
  await page.waitForFunction(()=>document.querySelectorAll('.jsketcher-app iframe').length===1,{timeout:30000});assert.equal(await pending,false,'closed operation must not publish');
  assert.equal(events.includes('ISOLATION|A|reply'),false,'closed before the worker result');assert.ok(events.filter(x=>x==='ISOLATION|A|terminate').length>terminatedBefore,'host terminated the active worker after closing');
  const bAfter=await b.evaluate(()=>{const c=__CAD_APP.craftService,m=c.models$.value[0];return {history:JSON.stringify(c.modifications$.value),geometry:JSON.stringify(m.brepShell.faces.map(f=>f.data.tessellation.data))}});assert.deepEqual(bAfter,bBefore);
  const still=await b.evaluate(async()=>{const c=__CAD_APP.craftService,i=c.inspectWorkerFeatureCommands();await c.createWorkerCenteredHole({revision:i.revision,...i.centeredHoleCandidates[0],diameter:10});return {faces:c.models$.value[0].faces.length,aborted:__CAD_APP.projectService.documentSignal.aborted,usage:c.engineResourceUsage,locks:await navigator.locks.query()}});
  assert.equal(still.faces,7);assert.equal(still.aborted,false);assert.equal(still.usage.mounts,0);assert.deepEqual(still.locks.held.filter(x=>x.name.startsWith('codi-')),[]);assert.deepEqual(still.locks.pending.filter(x=>x.name.startsWith('codi-')),[]);
  for(let i=0;i<2;i++){
   await page.evaluate(()=>surfaces.get('Desktop').launch('jsketcher'));
   await page.waitForFunction(()=>{const f=[...document.querySelectorAll('.jsketcher-app iframe')];return f.length===2&&f.every(x=>x.contentWindow?.__CAD_APP?.projectService?.hasHostLifetime===true)},{timeout:90000});
   const current=await page.$$('.jsketcher-app iframe'),handle=current[1],frame=await handle.contentFrame();
   await frame.evaluate(id=>{window.isolationId=id},'C'+i);assert.equal(await makeBlock(frame,40+i*20),40+i*20);
   const depth=await frame.evaluate(async()=>{const craft=__CAD_APP.craftService,wait=async()=>{const end=Date.now()+60000;while(craft.isProcessing&&Date.now()<end)await new Promise(r=>setTimeout(r,10));if(craft.isProcessing)throw Error('History replay timed out')};craft.historyTravel.setPointer(0);await wait();const request=JSON.parse(JSON.stringify(craft.modifications$.value.history[1]));request.params.length=25;await new Promise((yes,no)=>craft.modifyInHistoryAndStep(request,yes,no));await wait();const points=Array.from(craft.models$.value[0].brepShell.vertices,v=>v.point.z);return Math.max(...points)-Math.min(...points);});assert.equal(depth,25);
   const title=await handle.evaluateHandle(el=>el.closest('.window').querySelector('.window-caption'));await title.asElement().click();
   const button=await handle.evaluateHandle(el=>el.closest('.window').querySelector('[aria-label=Close]'));await button.asElement().click();
   await page.waitForFunction(()=>[...document.querySelectorAll('dialog[open] button')].some(x=>x.textContent.trim()==='Discard changes'));
   const discardCycle=await page.evaluateHandle(()=>[...document.querySelectorAll('dialog[open] button')].find(x=>x.textContent.trim()==='Discard changes'));await discardCycle.asElement().click();
   await page.waitForFunction(()=>document.querySelectorAll('.jsketcher-app iframe').length===1,{timeout:30000});
   const count=kind=>events.filter(x=>x==='ISOLATION|C'+i+'|'+kind).length;
   assert.ok(count('created')>0);assert.equal(count('created'),count('terminate'),'repeated window workers must terminate');
  }
  const final=await b.evaluate(async()=>({faces:__CAD_APP.craftService.models$.value[0].faces.length,usage:__CAD_APP.craftService.engineResourceUsage,locks:await navigator.locks.query()}));
  assert.equal(final.faces,7);assert.equal(final.usage.mounts,0);assert.deepEqual(final.locks.held.filter(x=>x.name.startsWith('codi-')),[]);assert.deepEqual(final.locks.pending.filter(x=>x.name.startsWith('codi-')),[]);
  console.log(JSON.stringify({still,final,firstWindowTerminated:true,remainingWindows:1,cycles:2}));
 }finally{await context.close();browser.disconnect();}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
