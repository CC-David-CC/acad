// Irrecoverable cleanup fault ONLY. Real source preparation, error-only submit.
// Controlled intrinsic/console faults are restored; no native success.
import assert from 'node:assert/strict';
import {getEventListeners} from 'node:events';
import {writeFile} from 'node:fs/promises';
const remove=EventTarget.prototype.removeEventListener,targets=new Map(),diagnostics=[],originalError=console.error;
EventTarget.prototype.removeEventListener=function(...args){if(targets.has(this))throw targets.get(this);return remove.apply(this,args);};
try{
 const {source,withSubmit,drain,lifecycle}=await import('./fixture.mjs'),text=await source(),rows=[];
 for(const loggerThrows of [false,true]){
  const primary=Object.assign(Error('controlled submit; native not run'),{code:'NATIVE_NOT_RUN',committed:true}),f=withSubmit(text,primary),caller=new AbortController(),projectCause={label:'project exact cleanup cause'},callerCause=null,discardCause=0;
  targets.set(f.ctx.projectService.documentSignal,projectCause);targets.set(caller.signal,callerCause);for(const signal of targets.keys())Object.defineProperty(signal,'removeEventListener',{value(){throw Error('own removal failed');},configurable:true});
  let discardAttempts=0;const prepare=f.ctx.storageService.prepareWrites;f.ctx.storageService.prepareWrites=function(...args){const workspace=prepare.apply(this,args);return{...workspace,discard(){discardAttempts++;throw discardCause;}};};
  const start=diagnostics.length;console.error=(message,cause)=>{diagnostics.push({message,cause});if(loggerThrows)throw Error('controlled logger fault');};
  await assert.rejects(f.api.editSourcePlaneDepth(f.request(12),{signal:caller.signal}),e=>e===primary);
  assert.equal(discardAttempts,1);assert.equal(diagnostics.length-start,3);assert.equal(diagnostics[start].cause,projectCause);assert.equal(diagnostics[start+1].cause,callerCause);assert.equal(diagnostics[start+2].cause,discardCause);assert(diagnostics.slice(start).every(r=>r.message.includes('release is unconfirmed')));assert.equal(f.events.commits,0);
  rows.push({loggerThrows,exactPrimaryPreserved:true,committedMarkerPreserved:true,attemptedAllRemovals:true,workspaceDiscardAttempted:true,exactOpaqueNullZeroCausesDiagnosed:true,releaseClaim:'unconfirmed',nativePublication:false});
  for(const signal of [f.ctx.projectService.documentSignal,caller.signal]){for(const listener of getEventListeners(signal,'abort'))remove.call(signal,'abort',listener);targets.delete(signal);assert.equal(getEventListeners(signal,'abort').length,0);}f.close();
 }
 console.error=originalError;await drain();assert.equal(lifecycle.started,lifecycle.terminated);const receipt={status:'PASS',scope:'controlled irrecoverable cleanup faults; actual source Workers and error-only submit, no native success',rows,workers:lifecycle};await writeFile(process.argv[2]||'/tmp/plane-cancel-intrinsic.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
}finally{EventTarget.prototype.removeEventListener=remove;console.error=originalError;}
