// Invoked twice by the COMPLETE signed Boolean/.cad/STEP whole.
import assert from 'node:assert/strict';
export async function recordBoxBuildAdmissionRefusals({command,capture,record,phase,unstagedRevision}){
 assert(['empty','continuation'].includes(phase));
 assert(/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/.test(unstagedRevision));
 const rows=[],tests=[
  {label:'unregistered explicit box build',revision:'sha256:'+'0'.repeat(64)+':'+'0'.repeat(64),code:'ENGINE_REVISION_MISMATCH'},
  {label:'registered unstaged explicit box build',revision:unstagedRevision,code:phase==='empty'?'ENGINE_BUILD_UNAVAILABLE':'ENGINE_REVISION_MISMATCH'},
  ...(phase==='empty'?[{label:'unstaged declared default box build',code:'ENGINE_BUILD_UNAVAILABLE'}]:[])
 ];
 for(const test of tests){
  const before=await capture(),native=before.capture.native,solids=before.capture.solids;
  const engine=solids.engines.find(e=>e.id==='occ');assert(engine);assert.equal(engine.revision,unstagedRevision);
  assert.equal(engine.defaultAvailable,false);assert.equal(engine.defaultReason.code,'ENGINE_BUILD_UNAVAILABLE');
  assert(!engine.availableBuilds.some(b=>b.engineRevision===unstagedRevision));
  const binding=solids.boxEngineBindings.find(e=>e.engine==='occ');assert(binding);
  if(phase==='empty'){assert.equal(native.history.length,0);assert.equal(solids.outputs.length,0);assert.equal(binding.compatible,false);assert.equal(binding.engineRevision,null);assert.equal(binding.reason,'ENGINE_BUILD_UNAVAILABLE');}
  else{assert(solids.outputs.length>0);assert.equal(binding.compatible,true);for(const out of solids.outputs)assert.equal(binding.engineRevision,'sha256:'+out.metrics.runtime.jsSha256+':'+out.metrics.runtime.wasmSha256);}
  const args={revision:solids.revision,version:1,unit:'millimeter',engine:'occ',...(test.revision?{engineRevision:test.revision}:{}),origin:[0,0,0],dimensions:[2,3,4]};
  let error=null;try{await command('create-worker-solid-box',args);}catch(e){error={name:e.name,code:e.code??null,message:e.message,committed:e.committed===true,possiblyCommitted:e.possiblyCommitted===true};}
  const after=await capture(),row={phase,label:test.label,command:'create-worker-solid-box',args,error,before,after};
  rows.push(row);record('Box admission '+phase+' '+test.label,row);assert(error);assert.equal(error.name,'Error');assert.equal(error.code,test.code);assert(!error.committed&&!error.possiblyCommitted);assert.deepEqual(after,before,'ALL exact source/counter/J/token/lifecycle/resource state survives preflight');
 }
 return rows;
}
