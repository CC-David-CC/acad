// Internal timeout boundary for an owned temporary restore workspace.
// Diagnostics are bounded counters only; no project or account data is kept.
// Derive one finite rebuild budget from the validated authored history. A
// supported large part must not inherit a small-demo deadline. Progress never
// restarts this budget; cancellation and pipeline failure still settle early.
export const PROJECT_REBUILD_WAIT=Object.freeze({baseMs:60000,perHistoryEntryMs:5000,maximumMs:600000,maximumHistoryEntries:10000});
export function projectRebuildWaitMs(historyLength){
 if(!Number.isSafeInteger(historyLength)||historyLength<0||historyLength>PROJECT_REBUILD_WAIT.maximumHistoryEntries)throw Object.assign(new TypeError('Invalid validated project history length.'),{code:'INVALID_REQUEST'});
 return Math.min(PROJECT_REBUILD_WAIT.maximumMs,PROJECT_REBUILD_WAIT.baseMs+historyLength*PROJECT_REBUILD_WAIT.perHistoryEntryMs);
}
export function restoreTimeout({job, ownsDocument, craft, expectedHistory, elapsedMs, allowedMs=null, report, rollback}) {
 const integer=value=>Number.isSafeInteger(value)&&value>=0?value:null;
 let actualHistory=null,pointer=null,processing=null,resources=null;
 try {
  const mods=craft.modifications$.value;
  actualHistory=Array.isArray(mods?.history)?integer(mods.history.length):null;
  pointer=Number.isSafeInteger(mods?.pointer)?mods.pointer:null;
  processing=typeof craft.isProcessing==='boolean'?craft.isProcessing:null;
  const usage=craft.engineResourceUsage;
  if(usage)resources={owners:integer(usage.owners),candidates:integer(usage.candidates),accepted:integer(usage.accepted),cleanupFailed:typeof usage.cleanupFailed==='boolean'?usage.cleanupFailed:null};
 } catch (_) { /* Diagnostics must never prevent cancellation. */ }
 const diagnostic=Object.freeze({expectedHistory:integer(expectedHistory),actualHistory,pointer,processing,
  allowedMs:integer(allowedMs),elapsedMs:Number.isFinite(elapsedMs)&&elapsedMs>=0?Math.round(elapsedMs):null,resources:resources&&Object.freeze(resources)});
 const error=new Error('The project rebuild timed out.');
 Object.defineProperty(error,'code',{value:'PROJECT_REBUILD_TIMEOUT',enumerable:true});
 Object.defineProperty(error,'diagnostic',{value:diagnostic});
 try { if(typeof report==='function')report(diagnostic); } catch (_) { /* Reporting has no authority over cleanup. */ }
 // A diagnostic getter or reporter may synchronously replace the document.
 // Never dispose a newer service or a newer generation of this service.
 let cleanupFailure=null;
 try { if(ownsDocument(job))rollback(); } catch (cause) { cleanupFailure=cause; }
 // Receipt rollback can synchronously notify code that changes the document.
 try {
  if(ownsDocument(job)) {
   job.project.dispose();
   // Owner close records a failed mount cleanup rather than throwing it.
   if(craft.engineResourceUsage?.cleanupFailed)cleanupFailure ||= new Error('Engine resource cleanup failed.');
  }
 } catch (cause) { cleanupFailure ||= cause; }
 if(cleanupFailure) {
  error.message+=' Workspace cleanup failed; close and reopen this window.';
  Object.defineProperty(error,'cause',{value:cleanupFailure});
 }
 return error;
}
