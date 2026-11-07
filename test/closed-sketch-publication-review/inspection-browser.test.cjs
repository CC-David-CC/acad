// Transport-only doubles, real Chromium and Web Locks. No solver/model proof.
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),puppeteer=require(process.env.PUPPETEER_CORE_PATH);
const base=new URL(process.env.JSKETCHER_TEST_URL||'http://127.0.0.1:20584'),cdp=new URL(process.env.CODI_TEST_CDP||'http://127.0.0.1:19329');
for(const u of [base,cdp])assert.ok(['localhost','127.0.0.1','[::1]'].includes(u.hostname));
const buffer=fs.readFileSync(process.env.CODI_INSPECTION_CLIENT),sha256=crypto.createHash('sha256').update(buffer).digest('hex');assert.equal(sha256,process.env.CODI_INSPECTION_SHA256);
const sourcePin=process.env.CODI_SOURCE_PIN||'467a145c1a620b36dcf8160287a9b449b5a3990d';assert.match(sourcePin,/^[0-9a-f]{40}$/);
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href}),context=await browser.createBrowserContext();try{
 const p=await context.newPage(),session=await p.createCDPSession(),url=new URL('/static/independent-inspection-client.js',base).href;
 await session.send('Fetch.enable',{patterns:[{urlPattern:url,requestStage:'Request'}]});session.on('Fetch.requestPaused',e=>session.send('Fetch.fulfillRequest',{requestId:e.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'text/javascript'}],body:buffer.toString('base64')}));
 const response=await p.goto(new URL('/static/index.html',base)),csp=response.headers()['content-security-policy'];assert.match(csp,/worker-src 'self'/);assert.doesNotMatch(csp,/'unsafe-eval'|blob:/);await p.addScriptTag({url});
 const result=await p.evaluate(async()=>{
  const Native=window.Worker,created=[],out=[],violations=[];let phase='idle';document.addEventListener('securitypolicyviolation',e=>violations.push(e.violatedDirective));
  const object=(i=0)=>({id:'s'+i,type:'Segment',role:null,stage:0}),constraint=()=>({stage:0,index:0,typeId:'LockPoint',objects:['s0:A'],constants:{x:'0',y:'0'},admission:{version:1,state:'accepted'}});
  const reply=r=>({revision:r.revision,ok:true,objects:[object()],constraints:[constraint()],boundaryFrame:{origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]},emptyBoundary:true});
  window.Worker=class{constructor(){this.terminated=false;this.terminations=0;created.push(this)}terminate(){this.terminated=true;this.terminations++}postMessage(value){const r=structuredClone(value);this.request=r;if(['active-hold','deadline'].includes(r.revision))return;let data=reply(r);
   if(r.revision.startsWith('validation-')){data.objects=Array.from({length:1000},(_,i)=>object(i));data.constraints=[]}
   switch(r.revision){
    case 'foreign':data.revision='wrong';break;
    case 'sparse-objects':data.objects=Array(1);break;
    case 'sparse-constraints':data.constraints=Array(1);break;
    case 'sparse-references':data.constraints[0].objects=Array(1);break;
    case 'sparse-frame':data.boundaryFrame.origin=Array(3);break;
    case 'nonfinite-frame':data.boundaryFrame.origin[0]=Infinity;break;
    case 'duplicate-objects':data.objects.push(object());break;
    case 'duplicate-constraints':data.constraints.push(constraint());break;
    case 'bad-admission':data.constraints[0].admission.version=2;break;
    case 'nonfinite-constant':data.constraints[0].constants.x=NaN;break;
    case 'oversized-constant':data.constraints[0].constants.x='x'.repeat(1048577);break;
    case 'objects-limit':data.objects=Array(10001);break;
    case 'stage-limit':data.objects[0].stage=10001;break;
    case 'extra-key':data.extra=true;break;
    case 'boundary-type':data.emptyBoundary='true';break;
    case 'typed-refusal':data={revision:r.revision,ok:false,error:{code:'UNSUPPORTED',message:'Controlled refusal'}};break;
   }
   setTimeout(()=>{phase='response';this.onmessage?.({data:structuredClone(data)});phase='after-response'},10);
  }};
  const req=id=>({revision:id,sketchJSON:'{}',externalParameters:{N:3}}),call=(id,options={},input=req(id))=>runClosedSketchInspection('/static/labeled-inspection-double.js',input,options);
  const settle=async(id,job)=>{try{const value=await job();const row={id,status:'fulfilled',ok:value.ok,error:value.error,frozen:Object.isFrozen(value)&&Object.isFrozen(value.objects||value.error),value};out.push(row);return row}catch(e){const row={id,status:'rejected',name:e.name,message:e.message};out.push(row);return row}};
  try{
   let release,acquired;const ready=new Promise(r=>acquired=r),lock=navigator.locks.request('codi-sketch-solve-v1',async()=>{acquired();await new Promise(r=>release=r)});await ready;
   const input=req('queued-capture'),options={timeoutMs:1000,valid:()=>true},first=settle('queued-capture',()=>call('queued-capture',options,input));input.externalParameters.N=9;input.sketchJSON='{"changed":true}';input.revision='changed';options.timeoutMs=1;options.valid=()=>false;
   const aborter=new AbortController(),second=settle('queued-abort',()=>call('queued-abort',{signal:aborter.signal,timeoutMs:1000}));await settle('third-pending',()=>call('third-pending'));aborter.abort();await second;release();await lock;const capture=await first;
   capture.posted=created.find(w=>w.request?.revision==='queued-capture').request;capture.deepFrozen=Object.isFrozen(capture.value.constraints[0].constants)&&Object.isFrozen(capture.value.boundaryFrame.origin)&&Object.isFrozen(capture.value.constraints[0].objects);
   const controller=new AbortController(),active=settle('active-abort',()=>call('active-hold',{signal:controller.signal}));while(!created.some(w=>w.request?.revision==='active-hold'))await new Promise(r=>setTimeout(r,0));controller.abort();await active;
   await settle('deadline',()=>call('deadline',{timeoutMs:35}));await settle('typed-refusal',()=>call('typed-refusal'));
   for(const id of ['foreign','sparse-objects','sparse-constraints','sparse-references','sparse-frame','nonfinite-frame','duplicate-objects','duplicate-constraints','bad-admission','nonfinite-constant','oversized-constant','objects-limit','stage-limit','extra-key','boundary-type'])await settle(id,()=>call(id));
   let epoch=0,changed=false,source='original';phase='idle';await settle('response-ABA',()=>call('response-ABA',{valid:()=>{if(phase==='response'&&!changed){changed=true;queueMicrotask(()=>{source='changed';epoch++;source='original';epoch++})}return epoch===0}}));
   const disposeSignal=new AbortController(),beforeDispose=created.length;await settle('guard-sync-dispose',()=>call('guard-sync-dispose',{signal:disposeSignal.signal,valid:()=>{disposeSignal.abort();return true}}));const disposalWorkers=created.length-beforeDispose;
   let reads=0;const bad=req('accessor');Object.defineProperty(bad.externalParameters,'getter',{enumerable:true,get(){reads++;return 1}});const beforeAccessor=created.length;await settle('accessor',()=>call('accessor',{},bad));const accessorWorkers=created.length-beforeAccessor;
   const nativeTimeout=window.setTimeout;async function hold(action){const pending=[];window.setTimeout=(fn,delay,...args)=>delay===0?(pending.push(()=>fn(...args)),0):nativeTimeout(fn,delay,...args);const wait=async n=>{const end=performance.now()+2000;while(pending.length<n){if(performance.now()>end)throw Error('Validation hold not reached');await new Promise(r=>nativeTimeout(r,1))}};const release=()=>{window.setTimeout=nativeTimeout;pending.splice(0).forEach(fn=>fn())};try{return await action(wait,release)}finally{release()}}
   let validationWorkersEnded=false;
   await hold(async(wait,release)=>{const a=settle('validation-budget-A',()=>call('validation-budget-A'));await wait(1);const b=settle('validation-budget-B',()=>call('validation-budget-B'));await wait(2);validationWorkersEnded=created.filter(w=>w.request?.revision.startsWith('validation-budget-')).every(w=>w.terminated);await settle('validation-third',()=>call('validation-third'));release();await Promise.all([a,b])});
   await hold(async(wait,release)=>{const c=new AbortController(),job=settle('validation-abort',()=>call('validation-abort',{signal:c.signal}));await wait(1);c.abort();release();await job});
   await hold(async(wait,release)=>{const job=settle('validation-deadline',()=>call('validation-deadline',{timeoutMs:500}));await wait(1);await new Promise(r=>nativeTimeout(r,550));release();await job});
   for(const row of out)delete row.value;
   return {out,epoch,authoredSourceAfterABA:source,disposalWorkers,reads,accessorWorkers,validationWorkersEnded,created:created.length,terminated:created.filter(w=>w.terminated).length,maxTerminateCalls:Math.max(...created.map(w=>w.terminations)),violations};
  }finally{window.Worker=Native;}
 });
 const rows=Object.fromEntries(result.out.map(r=>[r.id,r]));assert.equal(rows['queued-capture'].ok,true);assert.equal(rows['queued-capture'].posted.externalParameters.N,3);assert.equal(rows['queued-capture'].posted.sketchJSON,'{}');assert.equal(rows['queued-capture'].posted.revision,'queued-capture');assert.equal(rows['queued-capture'].deepFrozen,true);
 for(const id of ['queued-abort','active-abort','response-ABA','guard-sync-dispose','validation-abort'])assert.equal(rows[id].name,'AbortError',JSON.stringify(rows[id]));
 for(const id of ['third-pending','validation-third'])assert.match(rows[id].message,/Too many pending sketch inspections/);
 assert.equal(rows['typed-refusal'].status,'fulfilled');assert.equal(rows['typed-refusal'].ok,false);assert.equal(rows['typed-refusal'].frozen,true);assert.equal(rows['typed-refusal'].error.code,'UNSUPPORTED');
 for(const id of ['deadline','validation-deadline']){assert.equal(rows[id].name,'Error');assert.match(rows[id].message,/timed out/)}
 for(const id of ['foreign','sparse-objects','sparse-constraints','sparse-references','sparse-frame','nonfinite-frame','duplicate-objects','duplicate-constraints','bad-admission','nonfinite-constant','oversized-constant','objects-limit','stage-limit','extra-key','boundary-type','accessor'])assert.equal(rows[id].status,'rejected',id);
 assert.equal(rows['validation-budget-A'].ok,true);assert.equal(rows['validation-budget-B'].ok,true);assert.equal(result.validationWorkersEnded,true);assert.equal(result.disposalWorkers,0);assert.equal(result.reads,0);assert.equal(result.accessorWorkers,0);assert.equal(result.epoch,2);assert.equal(result.authoredSourceAfterABA,'original');assert.equal(result.created,result.terminated);assert.equal(result.maxTerminateCalls,1);assert.deepEqual(result.violations,[]);
 const receipt={version:1,source:sourcePin,inspectionIntroducedAt:'a42a81c8944309b41a8383f9802e2e7d0a47ba7a',clientSha256:sha256,layer:'real-Chromium-Web-Locks-with-labeled-Worker-double',fixture:base.href,targetId:p.target()._targetId,browser:await browser.version(),csp,...result};fs.writeFileSync(process.env.CODI_RECEIPT||'test/closed-sketch-publication-review/inspection-receipt.json',JSON.stringify(receipt,null,2)+'\n');console.log('PASS independent inspection transport',JSON.stringify({cases:result.out.length,doubles:result.created}));
}finally{await context.close();browser.disconnect()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
