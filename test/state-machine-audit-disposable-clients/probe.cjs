// Actual production clients and imported admission helpers; explicit transport,
// lock and termination doubles. No solver, native geometry or math claim.
const path=require('node:path'),{setTimeout:wait}=require('node:timers/promises');
const api=require(path.resolve('.build/disposable-client-audit/clients.cjs'));
const [family,scenario,fault='none']=process.argv.slice(2),failures={error:Error('injected termination failure'),null:null,undefined:undefined,zero:0,false:false,empty:''};
let settled=false,settlements=0,terminateCalls=0,posts=0,lateCalls=0,worker,requested,savedHandler;
const uncaught=[],fail=failures[fault],realSetTimeout=global.setTimeout,realClearTimeout=global.clearTimeout,realSetInterval=global.setInterval,realClearInterval=global.clearInterval;
const timers=new Set(),intervals=new Set(),listeners=new Map(),realAdd=AbortSignal.prototype.addEventListener,realRemove=AbortSignal.prototype.removeEventListener;
global.setTimeout=(callback,ms,...args)=>{let handle=realSetTimeout(()=>{timers.delete(handle);callback(...args);},ms);timers.add(handle);return handle;};global.clearTimeout=handle=>{timers.delete(handle);return realClearTimeout(handle);};
global.setInterval=(...args)=>{const handle=realSetInterval(...args);intervals.add(handle);return handle;};global.clearInterval=handle=>{intervals.delete(handle);return realClearInterval(handle);};
AbortSignal.prototype.addEventListener=function(type,fn,...rest){if(type==='abort'){let set=listeners.get(this);if(!set)listeners.set(this,set=new Set());set.add(fn);}return realAdd.call(this,type,fn,...rest);};
AbortSignal.prototype.removeEventListener=function(type,fn,...rest){if(type==='abort')listeners.get(this)?.delete(fn);return realRemove.call(this,type,fn,...rest);};
process.on('uncaughtException',error=>uncaught.push(error?.message||String(error)));
global.location={href:'http://fixture.local/',origin:'http://fixture.local'};global.window={location:global.location};
let lockTail=Promise.resolve();
Object.defineProperty(global,'navigator',{configurable:true,value:{locks:{request:(_name,{signal},callback)=>{const job=lockTail.then(()=>{if(signal.aborted)throw signal.reason;return callback();});lockTail=job.catch(()=>{});return job;}}}});
const response=request=>family==='physical'?{revision:request.revision,ok:true,result:{version:1,values:[]}}:family==='semantic'?{jobId:request.jobId,ok:true,value:{transportOnly:true}}:{revision:request.revision,ok:true,sketch:{},evidence:[]};
global.Worker=class{
 constructor(){worker=this;}
 postMessage(request){posts++;requested=request;savedHandler=this.onmessage;if(scenario==='timeout'||scenario==='abort'||scenario==='late')return;
  queueMicrotask(()=>{if(scenario==='operation-error')this.onerror?.({message:'injected operation failure'});else if(scenario==='message-error')this.onmessageerror?.({});else if(scenario==='malformed')this.onmessage?.({data:{invalid:true}});else this.onmessage?.({data:response(request)});});}
 terminate(){terminateCalls++;if(fault!=='none')throw fail;}
};
const controller=new AbortController(),options={signal:controller.signal,valid:()=>true,timeoutMs:15};
let outcome;
(async()=>{
 const promise=family==='physical'?api.evaluatePhysicalInWorker('/worker.js','',options):family==='semantic'?api.runPrismSemantic('/worker.js',{value:'transport-only'},options):api.runSketchSolve('/worker.js',{revision:'r1'},options);
 let queuedOutcome,queuedJob;if(scenario==='queued'){const nextOptions={signal:new AbortController().signal,valid:()=>true,timeoutMs:15};queuedJob=family==='physical'?api.evaluatePhysicalInWorker('/worker.js','',nextOptions):family==='semantic'?api.runPrismSemantic('/worker.js',{value:'transport-only'},nextOptions):api.runSketchSolve('/worker.js',{revision:'r2'},nextOptions);queuedJob=queuedJob.then(()=>{queuedOutcome={resolved:true};},error=>{queuedOutcome={resolved:false,code:error.code,causeExact:error.cause===fail};});}
 promise.then(value=>{settled=true;settlements++;outcome={resolved:true};},error=>{settled=true;settlements++;outcome={resolved:false,code:error?.code,name:error?.name,message:error?.message,causeExact:error?.cause===fail,operationError:error?.operationError?{name:error.operationError.name,message:error.operationError.message}:null};});
 if(scenario==='abort'||scenario==='late'){await wait(2);controller.abort();}
 await wait(55);const beforeLate={settled,settlements,terminateCalls};
 if(worker&&requested){lateCalls++;savedHandler?.({data:response(requested)});}
 await wait(5);
 let subsequent;if(fault!=='none'&&settled){const postsBefore=posts,terminateBefore=terminateCalls,newOptions={signal:new AbortController().signal,valid:()=>true,timeoutMs:15};const next=family==='physical'?api.evaluatePhysicalInWorker('/worker.js','',newOptions):family==='semantic'?api.runPrismSemantic('/worker.js',{value:'transport-only'},newOptions):api.runSketchSolve('/worker.js',{revision:'r2'},newOptions);subsequent=await next.then(()=>({resolved:true}),error=>({resolved:false,code:error.code,causeExact:error.cause===fail}));subsequent.posts=posts-postsBefore;subsequent.terminations=terminateCalls-terminateBefore;}
 console.log(JSON.stringify({family,scenario,fault,settled,settlements,outcome,subsequent,queuedOutcome,terminateCalls,posts,lateCalls,beforeLate,uncaught,timers:timers.size,intervals:intervals.size,abortListeners:[...listeners.values()].reduce((n,x)=>n+x.size,0)}));
 process.exit(0);
})().catch(error=>{console.error(error);process.exit(1);});
