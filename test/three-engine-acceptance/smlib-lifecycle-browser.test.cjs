// Actual SMLib Worker, with explicitly injected delivery timing/faults.
// No replacement kernel, fake successful response, Viewer or storage.
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const config=JSON.parse(fs.readFileSync(process.env.THREE_ENGINE_CONFIG,'utf8')),base=new URL(config.fixture);
const baseline=process.env.THREE_ENGINE_BASELINE_MOUNT?fs.readFileSync(process.env.THREE_ENGINE_BASELINE_MOUNT):null;
if(baseline){
 const entry=config.engines.find(e=>e.slot==='smlib').moduleUrl;
 assert.equal(crypto.createHash('sha256').update(baseline).digest('hex'),config.pinnedModules.find(p=>p.url===entry).sha256,'Historical mount must match original pin');
}
const cdp=new URL(process.env.CODI_TEST_CDP||'http://127.0.0.1:19329/');
for(const u of [base,cdp])assert.ok(['127.0.0.1','localhost','[::1]'].includes(u.hostname));
(async()=>{
 const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:120000}),context=await browser.createBrowserContext();
 try{
  const page=await context.newPage();
  if(baseline){
   const session=await page.createCDPSession(),url=new URL(config.engines.find(e=>e.slot==='smlib').moduleUrl,base).href;
   await session.send('Fetch.enable',{patterns:[{urlPattern:url,requestStage:'Request'}]});
   session.on('Fetch.requestPaused',event=>session.send('Fetch.fulfillRequest',{requestId:event.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'text/javascript'}],body:baseline.toString('base64')}).catch(()=>{}));
  }
  const response=await page.goto(base.href);
  const csp=response.headers()['content-security-policy'];assert.ok(csp);assert.doesNotMatch(csp,/'unsafe-eval'/);
  const result=await page.evaluate(async config=>{
   const require=(v,m)=>{if(!v)throw Error(m);},rows=[],pins=[];
   for(const p of config.pinnedModules){const r=await fetch(p.url,{cache:'no-store'});require(r.ok,'Asset fetch failed');const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',await r.arrayBuffer()))].map(v=>v.toString(16).padStart(2,'0')).join('');require(hash===p.sha256,'Asset pin mismatch '+p.url);pins.push({url:p.url,sha256:hash});}
   const engine=config.engines.find(e=>e.slot==='smlib'),{[engine.exportName]:factory}=await import(new URL(engine.moduleUrl,location.href).href);
   const RealWorker=globalThis.Worker,workers=[];
   globalThis.Worker=class extends RealWorker{
    constructor(...args){super(...args);workers.push(this);this.hold=null;this.held=[];this.closed=false;
     this.addEventListener('message',event=>{if(this.hold===event.data?.kind){this.held.push(event);return;}this.callback?.call(this,event);this.afterDelivery?.(event);});}
    set onmessage(callback){this.callback=callback;}get onmessage(){return this.callback;}
    terminate(){this.closed=true;return super.terminate();}
    release(){for(const event of this.held.splice(0))this.callback?.call(this,event);}
   };
   const make=timeoutMs=>{const mount=factory({...engine.options,...(timeoutMs?{timeoutMs}:{})});return {mount,worker:workers.at(-1)};};
   const box=()=>({op:'solid.box.create',version:1,unit:'millimeter',origin:[0,0,0],dimensions:[1,1,1]});
   const settle=promise=>promise.then(value=>({accepted:true,value}),error=>({accepted:false,code:error.code}));
   const until=async predicate=>{const end=performance.now()+5000;while(!predicate()){require(performance.now()<end,'Held actual response not observed');await new Promise(resolve=>setTimeout(resolve,5));}};
   const row=async(id,work)=>{try{rows.push({id,status:'pass',...await work()});}catch(error){rows.push({id,status:'failure',message:error.message});}};
   for(const operation of ['box','mesh','dispose'])await row('ordinary-microtask-abort-before-dispatch/'+operation,async()=>{
    const {mount}=make();try{await mount.ready;const existing=operation==='box'?null:await mount.execute(box());
     const request=operation==='box'?box():{op:operation==='mesh'?'solid.mesh.read':'solid.dispose',version:1,handle:existing.handle};
     const c=new AbortController(),work=settle(mount.execute(request,{signal:c.signal}));queueMicrotask(()=>c.abort());const r=await work;
     require(!r.accepted&&r.code==='CANCELLED',`Aborted signal accepted=${r.accepted}, code=${r.code}, volume=${r.value?.evidence?.volume}`);return {scope:'Ordinary queued microtask, no response timing injection'};
    }finally{mount.close();}
   });
   for(const operation of ['box','mesh','dispose'])await row('post-native-response-abort/'+operation,async()=>{
    const {mount,worker}=make();try{await mount.ready;const existing=operation==='box'?null:await mount.execute(box());
     const request=operation==='box'?box():{op:operation==='mesh'?'solid.mesh.read':'solid.dispose',version:1,handle:existing.handle},kind=operation==='box'?'result':operation==='mesh'?'mesh':'disposed';
     const c=new AbortController();worker.afterDelivery=event=>{if(event.data.kind===kind)c.abort();};const r=await settle(mount.execute(request,{signal:c.signal}));
     require(!r.accepted&&r.code==='CANCELLED','Post-response cancellation accepted');require(worker.closed,'Cancelled Worker survived');
     return {scope:'Injected callback immediately after genuine native response delivery, before Promise continuation'};
    }finally{mount.close();}
   });
   await row('initialization-deadline-before-delayed-timer',async()=>{
    const start=performance.now(),{mount,worker}=make(1000);worker.hold='ready';
    try{const work=settle(mount.ready);await until(()=>worker.held.length===1);while(performance.now()<start+1100){}
     worker.release();const r=await work;require(!r.accepted&&r.code==='TIMEOUT','Expired initialization accepted before timer callback');require(worker.closed,'Expired initializing Worker survived');
     return {scope:'Genuine ready response held; main-thread busy wait prevents timer dispatch',code:r.code};
    }finally{mount.close();}
   });
   const accepted=make();await accepted.mount.ready;const saved=await accepted.mount.execute(box());
   try{
    await row('private-handle-and-frozen-evidence-binding',async()=>{
     require(Object.isFrozen(saved.evidence)&&Object.isFrozen(saved.evidence.bounds)&&Object.isFrozen(saved.evidence.bounds.min),'Public proof is mutable');
     let code;try{accepted.mount.assertSolidBinding(structuredClone(saved.handle));}catch(error){code=error.code;}
     require(code==='INVALID_HANDLE','Structurally copied handle was accepted');
     require(accepted.mount.assertSolidBinding(saved.handle)===true,'Genuine owned handle lost');
     return {scope:'Real owned solid; structural-copy refusal and immutable proof, no response injection'};
    });
    await row('held-real-response-busy-abort-stale-and-accepted-survival',async()=>{
     const {mount,worker}=make();try{await mount.ready;const basis=await mount.execute(box()),c=new AbortController();worker.hold='result';const work=settle(mount.execute(box(),{signal:c.signal}));await until(()=>worker.held.length===1);
      const busy=await settle(mount.execute(box()));require(!busy.accepted&&busy.code==='BUSY','Concurrent operation was not BUSY');
      let bindingCode;try{mount.assertSolidBinding(basis.handle);}catch(error){bindingCode=error.code;}require(bindingCode==='BUSY','Binding check admitted a busy mount');
      c.abort();const r=await work;require(!r.accepted&&r.code==='CANCELLED','Held cancellation failed');
      worker.release();const after=await settle(mount.execute(box()));require(!after.accepted&&after.code==='MOUNT_CLOSED','Late response reopened cancelled mount');
      require(worker.closed,'Cancelled Worker was not terminated');
      const survivor=await accepted.mount.readSolidMesh({op:'solid.mesh.read',version:1,handle:saved.handle});require(Math.abs(survivor.evidence.volume-1)<1e-8,'Accepted owner lost');
      return {scope:'Actual response delivery held/released; payload unchanged',busy:busy.code,binding:bindingCode,cancelled:r.code};
     }finally{mount.close();}
    });
    await row('operation-deadline-before-delayed-timer',async()=>{
     const {mount,worker}=make(1000);try{await mount.ready;worker.hold='result';const start=performance.now(),work=settle(mount.execute(box()));await until(()=>worker.held.length===1);
      while(performance.now()<start+1100){} // Prevent timer dispatch; release genuine response after deadline.
      worker.release();const r=await work;require(!r.accepted&&r.code==='TIMEOUT','Expired response accepted before timer callback');require(worker.closed,'Expired Worker survived');
      return {scope:'Main-thread busy wait and genuine response delivery timing injection',code:r.code};
     }finally{mount.close();}
    });
    await row('actual-mesh-proof-mismatch-closes-candidate-only',async()=>{
     const {mount,worker}=make();try{await mount.ready;const a=await mount.execute(box());worker.hold='mesh';const work=settle(mount.readSolidMesh({op:'solid.mesh.read',version:1,handle:a.handle}));await until(()=>worker.held.length===1);
      worker.held[0].data.evidence.volume+=1;worker.release();const r=await work;require(!r.accepted&&r.code==='ENGINE_FAILURE','Changed proof accepted');require(worker.closed,'Proof mismatch Worker survived');
      const survivor=await accepted.mount.readSolidMesh({op:'solid.mesh.read',version:1,handle:saved.handle});require(Math.abs(survivor.evidence.volume-1)<1e-8,'Accepted owner lost');
      return {scope:'Injected volume-field fault in genuine mesh response; not an ordinary kernel result'};
     }finally{mount.close();}
    });
   }finally{accepted.mount.close();}
   const allWorkersTerminated=workers.every(worker=>worker.closed);
   for(const worker of workers)worker.terminate();globalThis.Worker=RealWorker;
   return {rows,pins,allWorkersTerminated,forcedCleanupRequired:!allWorkersTerminated};
  },config);
  const deadline=Date.now()+5000;while(page.workers().length&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,20));assert.equal(page.workers().length,0);
  const receipt={source:config.source,fixture:base.href,csp,historicalMountViaCdp:!!baseline,testSha256:crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),...result};
  if(process.env.THREE_ENGINE_RECEIPT)fs.writeFileSync(process.env.THREE_ENGINE_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt,null,2));
 }finally{await context.close();browser.disconnect();}
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
