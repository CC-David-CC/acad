const assert = require('node:assert/strict');
const puppeteer = require(process.env.PUPPETEER_CORE_PATH || 'puppeteer-core');
const base = new URL(process.env.JSKETCHER_TEST_URL), cdp = new URL(process.env.CODI_TEST_CDP);
if (![base, cdp].every(x => ['127.0.0.1','localhost','[::1]'].includes(x.hostname))) throw Error('Loopback fixture required');

(async () => {
  const browser = await puppeteer.connect({browserURL:cdp.href,protocolTimeout:90000});
  const context = await browser.createBrowserContext();
  const pages = new Set();
  const trackers = [];
  try {
    async function open() {
      const page=await context.newPage(), active=new Set(), counts={created:0,destroyed:0};
      pages.add(page);trackers.push({active,counts});
      page.on('workercreated',worker=>{active.add(worker);counts.created++;});
      page.on('workerdestroyed',worker=>{active.delete(worker);counts.destroyed++;});
      await page.evaluateOnNewDocument(()=>{
        const Native=window.Worker;
        window.Worker=class extends Native {
          constructor(...args) {
            super(...args);
            this.addEventListener('message',message=>{if(this.observedFourCut && message.data?.kind==='result')console.log('ISOLATION_NATIVE_REPLY');});
          }
          postMessage(message,...args) {
            const result=super.postMessage(message,...args);
            if(message?.kind==='research-four-corner-cut') {this.observedFourCut=true;console.log('ISOLATION_NATIVE_DISPATCH');}
            return result;
          }
        };
      });
      await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base).href);
      await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});
      await page.evaluate(()=>{window.isolationHost=new AbortController();__CAD_APP.projectService.bindHostLifetime({signal:isolationHost.signal,valid:()=>true});});
      return {page,active,counts};
    }
    async function rectangle(page,width) {
      return await page.evaluate(async width=>{
        const craft=__CAD_APP.craftService;
        return await craft.createRectangleSketch({revision:craft.inspectRectangleCreation().revision,unit:'millimeter',origin:[0,0],width,height:50,depth:0});
      },width);
    }
    async function block(page,rectangle) {
      return await page.evaluate(async rectangle=>{
        const craft=__CAD_APP.craftService,info=craft.inspectWorkerFeatureCommands();
        return await craft.createWorkerExtrusion({revision:info.revision,faceId:rectangle.faceId,regionId:rectangle.regionId,depth:20});
      },rectangle);
    }
    async function waitEmpty(tracker) {
      const until=Date.now()+10000;
      while(tracker.active.size&&Date.now()<until)await new Promise(r=>setTimeout(r,25));
      assert.equal(tracker.active.size,0,'all actual worker targets must close');
      assert.equal(tracker.counts.created,tracker.counts.destroyed,'worker lifecycle counts must balance');
    }
    const a=await open(),b=await open();
    const [ra,rb]=await Promise.all([rectangle(a.page,100),rectangle(b.page,120)]);
    await Promise.all([block(a.page,ra),block(b.page,rb)]);
    const widths=await Promise.all([a.page,b.page].map(page=>page.evaluate(()=>{
      const points=Array.from(__CAD_APP.craftService.models$.value[0].brepShell.vertices,v=>v.point.x);
      return Math.max(...points)-Math.min(...points);
    })));
    assert.deepEqual(widths,[100,120]);
    await a.page.evaluate(async()=>{
      const craft=__CAD_APP.craftService,info=craft.inspectWorkerFeatureCommands();
      await craft.createWorkerCenteredHole({revision:info.revision,...info.centeredHoleCandidates[0],diameter:10});
    });
    const before=await b.page.evaluate(()=>({history:JSON.stringify(__CAD_APP.craftService.modifications$.value),id:__CAD_APP.craftService.models$.value[0].id}));
    let dispatchedResolve,replyObserved=false;
    const dispatched=new Promise(resolve=>{dispatchedResolve=resolve});
    a.page.on('console',message=>{if(message.text()==='ISOLATION_NATIVE_DISPATCH')dispatchedResolve();if(message.text()==='ISOLATION_NATIVE_REPLY')replyObserved=true;});
    const task=a.page.evaluate(async()=>{
      const craft=__CAD_APP.craftService,info=craft.inspectWorkerFeatureCommands();
      await craft.createWorkerFourCornerHoles({revision:info.revision,...info.fourCornerCandidates[0],diameter:4,offsetX:10,offsetY:10});
    }).then(()=>({ok:true}),error=>({ok:false,message:String(error)}));
    let deadline;try{await Promise.race([dispatched,new Promise((_,reject)=>{deadline=setTimeout(()=>reject(Error('Native dispatch was not observed')),30000);})]);}finally{clearTimeout(deadline);}
    await a.page.close();pages.delete(a.page);await task;
    assert.equal(replyObserved,false,'instance must close before the real native result arrives');
    await waitEmpty(a);
    const continued=await b.page.evaluate(async()=>{
      const craft=__CAD_APP.craftService,info=craft.inspectWorkerFeatureCommands(),candidate=info.centeredHoleCandidates[0];
      if(!candidate)throw Error('Other instance lost its hole candidate');
      await craft.createWorkerCenteredHole({revision:info.revision,...candidate,diameter:10});
      return {history:craft.modifications$.value.history.map(h=>h.type),faces:craft.models$.value[0].faces.length,aborted:__CAD_APP.projectService.documentSignal.aborted,usage:craft.engineResourceUsage};
    });
    assert.equal(continued.faces,7);assert.equal(continued.aborted,false);assert.equal(continued.history.at(-1),'WORKER_CENTERED_THROUGH_HOLE_V1');
    for(const width of [40,60,80]) {
      const t=await open(),r=await rectangle(t.page,width);await block(t.page,r);
      await t.page.close();pages.delete(t.page);await waitEmpty(t);
    }
    const after=await b.page.evaluate(async()=>({locks:await navigator.locks.query(),id:__CAD_APP.craftService.models$.value[0].id,faces:__CAD_APP.craftService.models$.value[0].faces.length,aborted:__CAD_APP.projectService.documentSignal.aborted,usage:__CAD_APP.craftService.engineResourceUsage}));
    assert.equal(after.id,before.id);assert.equal(after.faces,7);assert.equal(after.aborted,false);assert.equal(after.usage.mounts,0);assert.deepEqual(after.locks.held.filter(x=>x.name.startsWith('codi-')),[]);assert.deepEqual(after.locks.pending.filter(x=>x.name.startsWith('codi-')),[]);
    await b.page.close();pages.delete(b.page);await waitEmpty(b);
    assert.equal((await context.pages()).length,0);
    console.log(JSON.stringify({before,continued,after,workers:trackers.map(t=>t.counts)}));
  } finally {
    for(const page of pages)await page.close().catch(()=>{});
    await context.close();browser.disconnect();
  }
})().catch(error=>{console.error(error.stack);process.exitCode=1});
