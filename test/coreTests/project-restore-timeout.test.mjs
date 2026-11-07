import {test} from 'node:test';
import assert from 'node:assert/strict';
import {restoreTimeout} from '../../web/app/cad/projectManager/restoreTimeout.mjs';

function fixture() {
 const controller=new AbortController(),state={generation:3,service:null,closed:0,rolledBack:0,published:false};
 const project={generation:3,signal:controller.signal,dispose(){state.closed++;controller.abort();}};
 state.service=project;let pending=true;const rollback=()=>{if(pending&&ownsDocument(job)){pending=false;state.rolledBack++}};controller.signal.addEventListener('abort',rollback);
 const job={project,generation:3,signal:controller.signal};
 const ownsDocument=j=>state.service===j.project&&state.generation===j.generation;
 const craft={modifications$:{value:{history:[{},{}],pointer:1}},isProcessing:true,
  engineResourceUsage:{owners:2,candidates:1,accepted:1,cleanupFailed:false}};
 return {controller,state,project,job,ownsDocument,craft,rollback};
}
test('timeout aborts only the current workspace before late work can publish',async()=>{
 const f=fixture();let release;const held=new Promise(resolve=>release=resolve);
 const replay=held.then(()=>{if(!f.job.signal.aborted&&f.ownsDocument(f.job))f.state.published=true});
 let diagnostic;const error=restoreTimeout({...f,expectedHistory:4,elapsedMs:30000.4,report:x=>diagnostic=x});
 assert.equal(error.message,'The project rebuild timed out.');assert.equal(error.code,'PROJECT_REBUILD_TIMEOUT');assert.equal(f.controller.signal.aborted,true);
 assert.equal(f.state.closed,1);assert.equal(f.state.rolledBack,1);
 assert.deepEqual(diagnostic,{expectedHistory:4,actualHistory:2,pointer:1,processing:true,allowedMs:null,elapsedMs:30000,
  resources:{owners:2,candidates:1,accepted:1,cleanupFailed:false}});
 assert.equal(error.diagnostic,diagnostic);assert.equal(Object.keys(error).includes('diagnostic'),false);
 release();await replay;assert.equal(f.state.published,false);
});
test('replacement during reporting is never disposed',()=>{
 const f=fixture(),replacement={dispose(){throw Error('must not dispose replacement')}};
 const error=restoreTimeout({...f,expectedHistory:2,elapsedMs:30000,report(){f.state.generation++;f.state.service=replacement}});
 assert.equal(error.message,'The project rebuild timed out.');assert.equal(f.state.closed,0);
 assert.equal(f.state.service,replacement);
});
test('replacement during rollback is not disposed',()=>{
 const f=fixture();f.rollback=()=>{f.state.rolledBack++;f.state.generation++};
 const error=restoreTimeout({...f,expectedHistory:2,elapsedMs:30000});
 assert.equal(error.message,'The project rebuild timed out.');assert.equal(f.state.rolledBack,1);assert.equal(f.state.closed,0);
});
test('rollback failure remains explicit and disposal is still attempted',()=>{
 const f=fixture(),cause=Error('rollback failed');f.rollback=()=>{throw cause};
 const error=restoreTimeout({...f,expectedHistory:2,elapsedMs:30000});
 assert.match(error.message,/^The project rebuild timed out\. Workspace cleanup failed/);assert.equal(error.cause,cause);assert.equal(f.state.closed,1);
});
test('latched engine resource cleanup failure remains explicit',()=>{
 const f=fixture(),dispose=f.project.dispose;
 f.project.dispose=()=>{dispose();f.craft.engineResourceUsage.cleanupFailed=true};
 const error=restoreTimeout({...f,expectedHistory:2,elapsedMs:30000});
 assert.match(error.message,/^The project rebuild timed out\. Workspace cleanup failed/);
 assert.equal(error.cause.message,'Engine resource cleanup failed.');
});
test('a new generation of the same service is not disposed',()=>{
 const f=fixture();f.state.generation++;
 const error=restoreTimeout({...f,expectedHistory:2,elapsedMs:30000});
 assert.equal(error.message,'The project rebuild timed out.');assert.equal(f.state.closed,0);
});
test('disposal or ownership-check failure retains timeout and reports cleanup failure',()=>{
 for(const kind of ['dispose','ownership']){
  const f=fixture(),cause=Error(kind);if(kind==='dispose')f.project.dispose=()=>{throw cause};
  const owns=kind==='ownership'?()=>{throw cause}:f.ownsDocument;
  const error=restoreTimeout({...f,ownsDocument:owns,expectedHistory:2,elapsedMs:30000});
  assert.match(error.message,/^The project rebuild timed out\. Workspace cleanup failed/);assert.equal(error.cause,cause);
 }
});
test('diagnostic and reporting failures cannot suppress cleanup',()=>{
 const f=fixture();Object.defineProperty(f.craft,'modifications$',{get(){throw Error('unavailable')}});
 const error=restoreTimeout({...f,expectedHistory:2,elapsedMs:30000,report(){throw Error('unavailable')}});
 assert.equal(error.message,'The project rebuild timed out.');assert.equal(f.state.closed,1);assert.equal(f.controller.signal.aborted,true);
 assert.equal(error.diagnostic.actualHistory,null);
});
