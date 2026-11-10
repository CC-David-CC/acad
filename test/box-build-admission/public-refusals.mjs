// Source-only grouped regression fragment: called by a complete signed whole.
// No product imports, private writes, altered catalog or synthetic Native result.
import assert from 'node:assert/strict';

export async function recordBoxBuildAdmissionRefusals({command,capture,record,phase,unstagedRevision}){
 assert(['empty','continuation'].includes(phase));
 assert(/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/.test(unstagedRevision));
 const rows=[];
 for(const test of [
  {label:'unregistered explicit box build',engineRevision:'sha256:'+ '0'.repeat(64)+':'+ '0'.repeat(64),code:'ENGINE_REVISION_MISMATCH'},
  {label:'registered unstaged explicit box build',engineRevision:unstagedRevision,code:phase==='empty'?'ENGINE_BUILD_UNAVAILABLE':'ENGINE_REVISION_MISMATCH'}
 ]){
  const before=await capture(),native=before.capture.native,solids=before.capture.solids;
  assert(Array.isArray(native.history)&&Array.isArray(solids.outputs));
  if(phase==='empty'){assert.equal(native.history.length,0);assert.equal(solids.outputs.length,0);}
  else{
   assert(solids.outputs.length>0);
   for(const out of solids.outputs)assert.notEqual('sha256:'+out.metrics.runtime.jsSha256+':'+out.metrics.runtime.wasmSha256,unstagedRevision);
  }
  const args={revision:solids.revision,version:1,unit:'millimeter',engine:'occ',engineRevision:test.engineRevision,origin:[0,0,0],dimensions:[2,3,4]};
  let error=null;
  try{await command('create-worker-solid-box',args);}catch(e){error={name:e.name,code:e.code??null,message:e.message,committed:e.committed===true,possiblyCommitted:e.possiblyCommitted===true};}
  const after=await capture(),row={phase,label:test.label,command:'create-worker-solid-box',args,error,before,after};
  rows.push(row);record('Box build preflight '+phase+' '+test.label,row);
  assert(error,'Required actual public refusal');assert.equal(error.code,test.code);
  assert(!error.committed&&!error.possiblyCommitted);assert.deepEqual(after,before,'Pre-candidate refusal preserves ALL state, issued tokens, counters and ownership');
 }
 return rows;
}
