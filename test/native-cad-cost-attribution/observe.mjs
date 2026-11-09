// Passive future-run instrumentation. No payload interception, production
// function wrapping, debugger pause, cache manipulation or native invocation.
import fs from 'node:fs';import path from 'node:path';import {performance} from 'node:perf_hooks';import {randomUUID} from 'node:crypto';
import {createProcessMemory} from './process-memory.mjs';
const MAX_EVENTS=100000,MAX_NETWORK=30000,MAX_TARGETS=4096;
async function boundedRead(promise){let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Passive observation timed out; product work is not cancelled')),1500);})]);}finally{clearTimeout(timer);}}
function install(key,installation){
 if(globalThis[key])return;const begin=performance.now(),state={installation,begin,timeOrigin:performance.timeOrigin,readyState:document.readyState,top:globalThis===globalThis.top,longTaskSupported:false,buffered:false,tasks:[],taskDropped:0,raf:{ticks:0,intervals:0,maxMS:0,gaps:[],dropped:0},last:null,observer:null,rafId:null,live:true};
 const task=e=>{if(state.tasks.length<2048)state.tasks.push({startMS:e.startTime,durationMS:e.duration,beforeInstall:e.startTime<begin});else state.taskDropped++;};
 try{if(PerformanceObserver.supportedEntryTypes.includes('longtask')){state.observer=new PerformanceObserver(list=>list.getEntries().forEach(task));state.observer.observe({type:'longtask',buffered:true});state.longTaskSupported=true;state.buffered=true;}}catch{}
 const tick=t=>{if(!state.live)return;state.raf.ticks++;if(state.last!==null){const d=t-state.last;state.raf.intervals++;state.raf.maxMS=Math.max(state.raf.maxMS,d);if(d>32){if(state.raf.gaps.length<2048)state.raf.gaps.push({startMS:state.last,durationMS:d});else state.raf.dropped++;}}state.last=t;state.rafId=requestAnimationFrame(tick);};
 state.drain=stop=>{for(const e of state.observer?.takeRecords()||[])task(e);const answer={installation:state.installation,begin,timeOrigin:state.timeOrigin,readyStateAtInstall:state.readyState,top:state.top,end:performance.now(),visibility:document.visibilityState,frameClass:globalThis.frameElement?.className??null,longTaskSupported:state.longTaskSupported,bufferedRequested:state.buffered,tasks:state.tasks,taskDropped:state.taskDropped,raf:state.raf};state.tasks=[];state.taskDropped=0;state.raf={ticks:0,intervals:0,maxMS:0,gaps:[],dropped:0};if(stop){state.live=false;cancelAnimationFrame(state.rafId);state.observer?.disconnect();delete globalThis[key];}return answer;};
 globalThis[key]=state;state.rafId=requestAnimationFrame(tick);
}
function capacityExpression(){
 const own=(value,key)=>{try{const d=Object.getOwnPropertyDescriptor(value,key);return d&&Object.prototype.hasOwnProperty.call(d,'value')?d.value:undefined;}catch{return undefined;}};
 const module=own(globalThis,'Module'),heap=own(globalThis,'HEAPU8')||own(globalThis,'HEAP8')||(module&&(own(module,'HEAPU8')||own(module,'HEAP8')));
 if(!heap)return {available:false,reason:'Native heap is not exposed as existing own data'};
 try{const buffer=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Uint8Array.prototype),'buffer').get.call(heap);const bytes=Object.getOwnPropertyDescriptor(ArrayBuffer.prototype,'byteLength').get.call(buffer);return {available:true,bufferCapacityBytes:bytes,meaning:'WASM/heap ArrayBuffer capacity only; not used bytes or physical RAM'};}catch{return {available:false,reason:'Existing heap did not expose an intrinsic ArrayBuffer'};}
}
export function ordinaryPageLease(browser){
 const context=browser.defaultBrowserContext();return{async createBrowserContext(){let closed=false;const owned=new Set();return{async newPage(){if(closed)throw Error('Owned ordinary page lease closed');const p=await context.newPage();owned.add(p);return p;},async close(){if(closed)return;closed=true;for(const p of owned)await p.close();owned.clear();}};}};
}
export async function createAttribution({browser,out,base,profileMode,pid,profilePath,cdpURL,intervalMS}){
 if(!['ordinary','private'].includes(profileMode))throw Error('Choose explicit ordinary/private profile mode');
 const pages=await browser.pages();if(pages.some(page=>page.url()!=='about:blank'))throw Error('Attribution requires a dedicated owned Chrome process without existing live pages');
 const key='__cadCost_'+randomUUID().replaceAll('-',''),fd=fs.openSync(path.join(out,'cost-events.ndjson'),'wx'),startMS=performance.now(),origin=new URL(base).origin;
 let phase='setup',sequence=0,dropped=0,closed=false,sampling=false,timer=null,pageSequence=0,targetSequence=0,networkCount=0;
 const errors=[],pageRecords=new Map(),targetRecords=new Map(),pending=new Set(),observedContexts=new Set(),phases=[];
 function emit(kind,data={}){if(closed)return;if(sequence>=MAX_EVENTS){dropped++;return;}try{const text=JSON.stringify({seq:++sequence,atMS:performance.now(),phase,...data,kind})+'\n';if(fs.writeSync(fd,text)!==Buffer.byteLength(text))throw Error('Incomplete observation ledger write');}catch(error){dropped++;if(errors.length<64)errors.push('Observation log: '+String(error.message).slice(0,256));}}
 let memory;try{memory=await createProcessMemory({pid,profilePath,cdpURL,intervalMS,emit,phase:()=>phase});}catch(error){closed=true;fs.closeSync(fd);throw error;}
 function track(promise){pending.add(promise);promise.finally(()=>pending.delete(promise)).catch(()=>{});return promise;}
 async function attachTarget(target,kind='worker',pageId=null){
  if(targetRecords.has(target)||targetRecords.size>=MAX_TARGETS){if(!targetRecords.has(target))emit('target-overflow',{limit:MAX_TARGETS});return;}
  let context;try{context=target.browserContext();}catch{return;}if(!observedContexts.has(context))return;
  const row={id:++targetSequence,kind,pageId,url:target.url(),createdAtMS:performance.now(),destroyed:false,session:null,network:new Map()};targetRecords.set(target,row);emit('target-observed',{id:row.id,targetKind:kind,pageId,url:row.url,passiveAttachMayMissStartup:true});
  try{
   const session=await target.createCDPSession();row.session=session;
   session.on('Network.requestWillBeSent',event=>{if(networkCount++>=MAX_NETWORK){emit('network-overflow',{scope:row.id,limit:MAX_NETWORK});return;}let url;try{url=new URL(event.request.url);}catch{return;}const r={id:event.requestId,path:url.origin===origin?url.pathname:'other-origin',type:event.type,requestMS:event.timestamp,requestEpochMS:event.wallTime*1000,cacheEvent:false,response:null,redirect:event.redirectResponse?{status:event.redirectResponse.status,encodedDataLength:event.redirectResponse.encodedDataLength}:null};if(row.network.has(event.requestId))emit('network-redirect',{scope:row.id,request:row.network.get(event.requestId),redirect:r.redirect});row.network.set(event.requestId,r);});
   session.on('Network.requestServedFromCache',event=>{const r=row.network.get(event.requestId);if(r)r.cacheEvent=true;});
   session.on('Network.responseReceived',event=>{const r=row.network.get(event.requestId);if(r)r.response={status:event.response.status,fromDiskCache:event.response.fromDiskCache===true,fromServiceWorker:event.response.fromServiceWorker===true,fromPrefetchCache:event.response.fromPrefetchCache===true,mimeType:event.response.mimeType};});
   session.on('Network.loadingFinished',event=>{const r=row.network.get(event.requestId);if(r){emit('network-completed',{scope:row.id,request:r,completedMS:event.timestamp,encodedTransferBytes:event.encodedDataLength});row.network.delete(event.requestId);}else emit('network-completed-missing-request',{scope:row.id,id:event.requestId,encodedTransferBytes:event.encodedDataLength});});
   session.on('Network.loadingFailed',event=>{const r=row.network.get(event.requestId);emit('network-failed',{scope:row.id,request:r??null,id:event.requestId,errorText:event.errorText,canceled:event.canceled===true});row.network.delete(event.requestId);});
   const networkBuffers={maxTotalBufferSize:65536,maxResourceBufferSize:16384,maxPostDataSize:1};await session.send('Network.enable',networkBuffers);emit('network-enabled',{scope:row.id,targetKind:kind,url:row.url,networkBuffers,meaning:'Bounded diagnostic retention; no response-body reads or durable body buffer'});
  }catch(error){emit('target-observation-error',{id:row.id,message:error.message});}
 }
 const onTarget=target=>{if(target.type()==='worker')track(attachTarget(target));};
 const onChanged=target=>{const row=targetRecords.get(target);if(row){const url=target.url();if(url!==row.url){row.url=url;emit('target-url-changed',{id:row.id,url});}}else onTarget(target);};
 const onDestroyed=target=>{const row=targetRecords.get(target);if(!row)return;row.destroyed=true;emit('target-destroyed',{id:row.id,url:row.url,createdAtMS:row.createdAtMS});for(const request of row.network.values())emit('network-unfinished',{scope:row.id,request,reason:'target destroyed; encoded bytes unknown'});row.network.clear();};
 browser.on('targetcreated',onTarget);browser.on('targetchanged',onChanged);browser.on('targetdestroyed',onDestroyed);
 async function attachPage(page){
  observedContexts.add(page.browserContext());const row={id:++pageSequence,page,frames:new Map(),hook:null,closed:false};pageRecords.set(page,row);
  row.hook=await page.evaluateOnNewDocument(install,key,'new-document-hook');await page.evaluate(install,key,'existing-after-login');emit('page-attached',{pageId:row.id,url:page.url(),outerBootstrapBlindSpot:true});
  page.on('frameattached',frame=>{row.frames.set(frame,{id:row.id+':'+row.frames.size,url:null,lastDrainMS:null});});
  page.on('framedetached',frame=>{const info=row.frames.get(frame);emit('frame-detached',{pageId:row.id,frame:info??null,lastIntervalMayBeUnavailable:true});});
  page.on('close',()=>{row.closed=true;emit('page-closed',{pageId:row.id});});
  await attachTarget(page.target(),'page',row.id);
  for(const target of browser.targets())if(target.type()==='worker')track(attachTarget(target));
 }
 async function sample(){
  if(sampling||closed)return;sampling=true;
  try{
   for(const row of pageRecords.values())if(!row.closed)for(const frame of row.page.frames()){
    try{if(new URL(frame.url()).origin!==origin)continue;}catch{continue;}
    let info=row.frames.get(frame);if(!info){info={id:row.id+':'+row.frames.size,url:null,lastDrainMS:null};row.frames.set(frame,info);}info.url=frame.url();
    try{const data=await frame.evaluate(key=>{
     const observation=globalThis[key]?.drain(false)??{unavailable:true};
     try{const craft=globalThis.__CAD_APP?.craftService;if(craft){const value=craft.engineResourceUsage,resources={};for(const name of ['owners','accepted','candidates','detached','mounts','cleanupFailed'])resources[name]=value[name];observation.logicalResources={resources,processing:craft.isProcessing,epoch:craft.evaluationEpoch,modelCount:craft.models$?.value?.length??null,historyLength:craft.modifications$?.value?.history?.length??null,pointer:craft.modifications$?.value?.pointer??null};}}catch(error){observation.logicalResourceUnavailable=String(error.message).slice(0,256);}return observation;
    },key);info.lastDrainMS=performance.now();emit('main-scope',{pageId:row.id,frameId:info.id,url:info.url,observation:data});}catch(error){emit('main-observation-error',{pageId:row.id,frameId:info.id,message:error.message});}
   }
   for(const row of targetRecords.values())if(row.session&&!row.destroyed){
    const observationStartedMS=performance.now();
    try{const heap=await boundedRead(row.session.send('Runtime.getHeapUsage'));emit('v8-heap',{scope:row.id,targetKind:row.kind,url:row.url,observationStartedMS,heap,meaning:'CDP isolate heap; usedSize and totalSize distinct; page frames can share an isolate'});}catch(error){emit('heap-unavailable',{scope:row.id,observationStartedMS,message:error.message});}
    if(row.kind==='worker')try{const result=await boundedRead(row.session.send('Runtime.evaluate',{expression:'('+capacityExpression.toString()+')()',returnByValue:true,silent:true}));emit('native-capacity',{scope:row.id,url:row.url,observationStartedMS,value:result.exceptionDetails?{available:false,reason:'read-only capacity expression unavailable'}:result.result.value});}catch(error){emit('native-capacity-unavailable',{scope:row.id,observationStartedMS,message:error.message});}
   }
  }catch(error){errors.push(error.message);emit('observation-error',{message:error.message});}finally{sampling=false;}
 }
 timer=setInterval(()=>{void sample();},1000);
 async function run(label,work,{role='public-command'}={}){
  const previous=phase;phase=label;await memory.sample();await sample();const row={label,role,startMS:performance.now()};emit('phase-start',row);
  try{return await work();}catch(error){row.error={name:error.name,code:error.code??null,message:error.message,committed:error.committed===true,possiblyCommitted:error.possiblyCommitted===true};throw error;}
  finally{row.endMS=performance.now();row.wallMS=row.endMS-row.startMS;phases.push(row);emit('phase-end',row);await memory.sample();await sample();phase=previous;}
 }
 async function beforeClose(page){await sample();const row=pageRecords.get(page);if(!row)return;for(const frame of page.frames()){const info=row.frames.get(frame);try{const result=await frame.evaluate(key=>globalThis[key]?.drain(true)??{unavailable:true},key);emit('main-final-drain',{pageId:row.id,frameId:info?.id??null,url:frame.url(),observation:result});}catch(error){emit('main-final-unavailable',{pageId:row.id,message:error.message});}}try{await page.removeScriptToEvaluateOnNewDocument(row.hook.identifier);}catch(error){emit('hook-remove-error',{pageId:row.id,message:error.message});}}
 async function stop(){
  clearInterval(timer);browser.off('targetcreated',onTarget);browser.off('targetchanged',onChanged);browser.off('targetdestroyed',onDestroyed);while(sampling)await new Promise(r=>setTimeout(r,10));await Promise.allSettled([...pending]);await sample();const processSummary=await memory.stop();
  for(const row of targetRecords.values()){for(const request of row.network.values())emit('network-unfinished',{scope:row.id,request,reason:'observer finished; encoded bytes unknown'});if(row.session)try{await row.session.detach();}catch(error){emit('session-detach',{scope:row.id,alreadyDestroyed:row.destroyed,message:error.message});}}
  emit('observer-finished',{processSummary,eventDropped:dropped});const summary={profileMode,process:memory.metadata,processSummary,timeOrigin:performance.timeOrigin,startMS,endMS:performance.now(),phases,eventCount:sequence,eventDropped:dropped,networkObserved:networkCount,targets:[...targetRecords.values()].map(({id,kind,pageId,url,createdAtMS,destroyed})=>({id,kind,pageId,url,createdAtMS,destroyed})),errors,limits:['Instrumented whole run, not uninstrumented latency','Main/CDP/network/passive Worker startup coverage may be incomplete; missing is not zero','Process samples are lower bounds on continuous maxima; no forced GC','No exact codec CPU/hydration/file integrity subphase timing is inferred','No Native capacity => used RAM inference; heap isolates must not be summed as physical memory']};closed=true;fs.closeSync(fd);fs.writeFileSync(path.join(out,'cost-summary.json'),JSON.stringify(summary,null,2)+'\n');return summary;
 }
 return {attachPage,run,beforeClose,sample,stop,emit,get phases(){return phases;}};
}
