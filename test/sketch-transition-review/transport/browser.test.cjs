// Real Chromium/Web Locks; labeled Worker double for transport-only replies.
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const puppeteer=require(process.env.PUPPETEER_CORE_PATH);
const base=new URL(process.env.JSKETCHER_TEST_URL||'http://127.0.0.1:20584'),cdp=new URL(process.env.CODI_TEST_CDP||'http://127.0.0.1:19329');
for(const u of [base,cdp])assert.ok(['127.0.0.1','localhost','[::1]'].includes(u.hostname));
const bytes=fs.readFileSync(process.env.CODI_TRANSITION_CLIENT),pin=crypto.createHash('sha256').update(bytes).digest('hex');
assert.equal(pin,process.env.CODI_CLIENT_SHA256||'cba9eec2cdbe90c2a1b1461921f31f6f5ee93dabe66155176a71f64ba899b63d');
const sourcePin=process.env.CODI_SOURCE_PIN||'4d6f7343c08bc7bfbace79adc139c174fc02ac30';assert.match(sourcePin,/^[0-9a-f]{40}$/);
(async()=>{
 const browser=await puppeteer.connect({browserURL:cdp.href}),context=await browser.createBrowserContext();
 try{
  const page=await context.newPage(),session=await page.createCDPSession(),url=new URL('/static/independent-transition-client.js',base).href;
  await session.send('Fetch.enable',{patterns:[{urlPattern:url,requestStage:'Request'}]});
  session.on('Fetch.requestPaused',e=>session.send('Fetch.fulfillRequest',{requestId:e.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'text/javascript'}],body:bytes.toString('base64')}));
  const response=await page.goto(new URL('/static/index.html',base)),csp=response.headers()['content-security-policy'];assert.match(csp,/worker-src 'self'/);assert.doesNotMatch(csp,/'unsafe-eval'|blob:/);await page.addScriptTag({url});
  const result=await page.evaluate(async()=>{
   const Native=window.Worker,created=[],violations=[];let phase='idle';
   document.addEventListener('securitypolicyviolation',e=>violations.push(e.violatedDirective));
   const row=()=>({typeId:'LengthRelation',state:'accepted',residuals:[0],tolerances:[1e-6],units:['millimeter'],tolerance:1e-6,unit:'millimeter'});
   const reply=request=>({revision:request.revision,ok:true,serializedSketch:JSON.stringify(request),evidence:[row()],...(request.intent?{relation:{objects:[...request.intent.ids],status:'accepted'}}:{})});
   window.Worker=class{
    constructor(){this.terminated=false;this.terminateCalls=0;created.push(this)}
    terminate(){this.terminated=true;this.terminateCalls++}
    postMessage(input){
     const request=structuredClone(input);this.request=request;if(['active-hold','deadline'].includes(request.revision))return;let response=reply(request);
     if(request.revision.startsWith('validation-'))response.serializedSketch=' '.repeat(100000);
     switch(request.revision){
      case 'wrong-revision':response.revision='foreign';break;
      case 'sparse-outer':response.evidence=Array(1);break;
      case 'sparse-residual':response.evidence[0].residuals=Array(1);break;
      case 'sparse-tolerance':response.evidence[0].tolerances=Array(1);break;
      case 'sparse-units':response.evidence[0].units=Array(1);break;
      case 'nonfinite':response.evidence[0].residuals=[Infinity];break;
      case 'exceeds-residual':response.evidence[0].residuals=[2e-6];break;
      case 'bad-unit':response.evidence[0].units=['meter'];break;
      case 'extra-row-key':response.evidence[0].extra=true;break;
      case 'bad-relation':response.relation.objects=['foreign','b'];break;
      case 'sparse-relation':response.relation.objects=Array(2);break;
      case 'error-too-long':response={revision:request.revision,ok:false,error:{code:'X',message:'x'.repeat(513)}};break;
      case 'typed-refusal':response={revision:request.revision,ok:false,error:{code:'RESIDUAL',message:'Controlled refusal'}};break;
      case 'utf8-response':response.serializedSketch='é'.repeat(600000);break;
     }
     setTimeout(()=>{phase='response';this.onmessage?.({data:structuredClone(response)});phase='after-response'},10);
    }
   };
   const output=[],request=(revision,length=false)=>({revision,sketchJSON:'{}',externalParameters:{N:3},...(length?{intent:{ids:['a','b'],factor:2,offset:0}}:{})});
   async function settle(id,operation){try{const value=await operation();const r={id,status:'fulfilled',ok:value.ok,error:value.error,revision:value.revision,frozen:Object.isFrozen(value)&&Object.isFrozen(value.evidence||value.error),value};output.push(r);return r}catch(e){const r={id,status:'rejected',name:e.name,message:e.message};output.push(r);return r}}
   const call=(id,options={},length=false,source=request(id,length))=>runSketchTransition('/static/labeled-worker-double.js',length?'sketch-transition-length-relation':'sketch-transition-replay',source,options);
   try{
    let release,acquired;const ready=new Promise(r=>acquired=r),lock=navigator.locks.request('codi-sketch-solve-v1',async()=>{acquired();await new Promise(r=>release=r)});await ready;
    const input=request('queued-capture',true),options={timeoutMs:1000,valid:()=>true},pending=settle('queued-capture',()=>call('queued-capture',options,true,input));
    input.externalParameters.N=9;input.intent.ids[0]='foreign';input.intent.factor=7;input.intent.ids[0]='a';input.intent.factor=2;options.timeoutMs=1;options.valid=()=>false;
    const aborter=new AbortController(),queued=settle('queued-abort',()=>call('queued-abort',{signal:aborter.signal,timeoutMs:1000}));
    await settle('third-pending',()=>call('third-pending'));aborter.abort();await queued;
    await new Promise(r=>setTimeout(r,35));release();await lock;const captured=await pending;
    captured.captured=JSON.parse(captured.value.serializedSketch);captured.deepFrozen=Object.isFrozen(captured.value.evidence[0])&&Object.isFrozen(captured.value.evidence[0].residuals)&&Object.isFrozen(captured.value.relation.objects);
    const controller=new AbortController(),active=settle('active-abort',()=>call('active-hold',{signal:controller.signal,timeoutMs:1000}));
    while(!created.some(w=>w.request?.revision==='active-hold'))await new Promise(r=>setTimeout(r,0));controller.abort();await active;
    await settle('after-abort-slot-reuse',()=>call('after-abort-slot-reuse'));
    await settle('typed-refusal',()=>call('typed-refusal'));await settle('deadline',()=>call('deadline',{timeoutMs:35}));
    for(const id of ['wrong-revision','sparse-outer','sparse-residual','sparse-tolerance','sparse-units','nonfinite','exceeds-residual','bad-unit','extra-row-key','error-too-long','utf8-response'])await settle(id,()=>call(id));
    for(const id of ['bad-relation','sparse-relation'])await settle(id,()=>call(id,{},true));
    let queuedAbort=false;const lateAborter=new AbortController();
    await settle('response-microtask-abort',()=>call('response-microtask-abort',{signal:lateAborter.signal,valid:()=>{if(phase==='response'&&!queuedAbort){queuedAbort=true;queueMicrotask(()=>lateAborter.abort())}return true}}));
    let epoch=0,queuedABA=false,authored='original';
    await settle('response-microtask-ABA',()=>call('response-microtask-ABA',{valid:()=>{if(phase==='response'&&!queuedABA){queuedABA=true;queueMicrotask(()=>{authored='changed';epoch++;authored='original';epoch++})}return epoch===0}}));
    phase='idle';let afterResponseChecks=0;const finalController=new AbortController();
    await settle('final-valid-sync-abort',()=>call('final-valid-sync-abort',{signal:finalController.signal,valid:()=>{if(phase==='after-response'&&++afterResponseChecks===2)finalController.abort();return true}}));
    let getterReads=0;const getter=request('input-getter');Object.defineProperty(getter.externalParameters,'X',{enumerable:true,get(){getterReads++;return 1}});
    const beforeGetter=created.length;await settle('input-getter',()=>call('input-getter',{},false,getter));const workersForGetter=created.length-beforeGetter;
    const utf=request('utf8-input');utf.sketchJSON='é'.repeat(600000);const beforeUtf=created.length;await settle('utf8-input',()=>call('utf8-input',{},false,utf));const workersForUtf=created.length-beforeUtf;
    // Deliberately hold only validation's zero-delay yields. Worker replies
    // and Web Locks remain asynchronous; this is injected transport timing.
    const nativeTimeout=window.setTimeout;
    async function heldValidation(action){const callbacks=[];window.setTimeout=(fn,delay,...args)=>delay===0?(callbacks.push(()=>fn(...args)),0):nativeTimeout(fn,delay,...args);const wait=async n=>{const limit=performance.now()+2000;while(callbacks.length<n){if(performance.now()>limit)throw Error('Validation hold not reached');await new Promise(r=>nativeTimeout(r,1))}};try{return await action(wait,()=>{window.setTimeout=nativeTimeout;callbacks.splice(0).forEach(fn=>fn())})}finally{window.setTimeout=nativeTimeout;callbacks.splice(0).forEach(fn=>fn())}}
    const validationFacts={};
    await heldValidation(async(wait,release)=>{
     const first=settle('validation-budget-A',()=>call('validation-budget-A',{timeoutMs:3000}));await wait(1);
     const second=settle('validation-budget-B',()=>call('validation-budget-B',{timeoutMs:3000}));await wait(2);
     validationFacts.bothWorkersEndedBeforeBudgetCheck=created.filter(w=>w.request?.revision.startsWith('validation-budget-')).every(w=>w.terminated);
     await settle('validation-third-pending',()=>call('validation-third-pending'));release();await Promise.all([first,second]);
    });
    await heldValidation(async(wait,release)=>{const aborter=new AbortController(),job=settle('validation-abort',()=>call('validation-abort',{signal:aborter.signal,timeoutMs:3000}));await wait(1);aborter.abort();release();await job});
    await heldValidation(async(wait,release)=>{const job=settle('validation-deadline',()=>call('validation-deadline',{timeoutMs:500}));await wait(1);await new Promise(r=>nativeTimeout(r,550));release();await job});
    for(const entry of output){if(entry.value){entry.serializedLength=entry.value.serializedSketch?.length;delete entry.value}}
    return {output,queuedAbort,queuedABA,epoch,authored,getterReads,workersForGetter,workersForUtf,validationFacts,finalControllerAborted:finalController.signal.aborted,afterResponseChecks,created:created.length,terminated:created.filter(w=>w.terminated).length,maxTerminateCalls:Math.max(...created.map(w=>w.terminateCalls)),violations};
   }finally{window.Worker=Native;}
  });
  const cases=Object.fromEntries(result.output.map(x=>[x.id,x]));
  assert.equal(cases['queued-capture'].status,'fulfilled');assert.equal(cases['queued-capture'].captured.externalParameters.N,3);assert.deepEqual(cases['queued-capture'].captured.intent,{ids:['a','b'],factor:2,offset:0});assert.equal(cases['queued-capture'].deepFrozen,true);
  for(const name of ['queued-abort','active-abort','response-microtask-abort','response-microtask-ABA'])assert.equal(cases[name].name,'AbortError',JSON.stringify(cases[name]));
  assert.match(cases['third-pending'].message,/Too many pending/);assert.equal(cases['after-abort-slot-reuse'].ok,true);
  assert.equal(cases['typed-refusal'].status,'fulfilled');assert.deepEqual(cases['typed-refusal'].error,{code:'RESIDUAL',message:'Controlled refusal'});assert.equal(cases['typed-refusal'].frozen,true);
  assert.equal(cases.deadline.name,'Error');assert.match(cases.deadline.message,/timed out/);
  for(const name of ['wrong-revision','sparse-outer','sparse-residual','sparse-tolerance','sparse-units','nonfinite','exceeds-residual','bad-unit','extra-row-key','bad-relation','sparse-relation','error-too-long','utf8-response','utf8-input'])assert.equal(cases[name].status,'rejected',name);
  assert.equal(result.epoch,2);assert.equal(result.authored,'original');assert.equal(result.getterReads,0);assert.equal(result.workersForGetter,0);assert.equal(result.workersForUtf,1);assert.equal(result.created,result.terminated);assert.equal(result.maxTerminateCalls,1);assert.deepEqual(result.violations,[]);
  assert.equal(result.validationFacts.bothWorkersEndedBeforeBudgetCheck,true);
  for(const name of ['validation-budget-A','validation-budget-B'])assert.equal(cases[name].ok,true);
  assert.match(cases['validation-third-pending'].message,/Too many pending sketch transitions/);
  assert.equal(cases['validation-abort'].name,'AbortError');assert.equal(cases['validation-deadline'].name,'Error');assert.match(cases['validation-deadline'].message,/transition timed out/);
  assert.equal(result.finalControllerAborted,true);assert.equal(result.afterResponseChecks,2);
  if(process.env.CODI_EXPECT_FINAL_ABORT_FIX==='1')assert.equal(cases['final-valid-sync-abort'].name,'AbortError');else assert.equal(cases['final-valid-sync-abort'].status,'fulfilled');
  const receipt={version:1,source:sourcePin,clientSha256:pin,layer:'real-Chromium-Web-Locks-with-labeled-Worker-double',fixture:base.href,cdp:cdp.href,targetId:page.target()._targetId,browser:await browser.version(),csp,...result};
  fs.writeFileSync(process.env.CODI_RECEIPT||'test/sketch-transition-review/transport/receipt.json',JSON.stringify(receipt,null,2)+'\n');console.log('PASS directed transport controls',JSON.stringify({cases:result.output.length,workers:result.created}));
 }finally{await context.close();browser.disconnect();}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
