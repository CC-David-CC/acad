// A failed import owns a disposable empty workspace. Roll back receipts while
// their lifetime can still be current, then revoke its replay in the same turn.
export function failOwnedRestore({job,currentProject,rollback,error}) {
 let cleanupFailure=null;
 try{rollback();}catch(cause){cleanupFailure=cause;}
 try {
  // Receipt callbacks may replace the service or generation. Passive identity
  // also permits closing this exact owner after host validity went false.
  if(!job.signal.aborted&&currentProject()===job.project&&job.project.documentGeneration===job.generation&&job.project.documentSignal===job.signal)job.project.dispose();
 } catch(cause){cleanupFailure ||= cause;}
 if(!cleanupFailure)return error;
 const failure=new Error('Project restore failed and workspace cleanup failed. Close and reopen this window.');
 Object.defineProperties(failure,{cause:{value:error},cleanupFailure:{value:cleanupFailure}});
 return failure;
}
