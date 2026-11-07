// Actual production PM/Craft functions and genuine metadata Worker; only the
// required terminate() outcome is injected. Accepted geometry is a protocol fixture.
import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,snapshot,assign} from './harness.mjs';
test('successful metadata computation cannot publish after cleanup fails; subsequent assignment allocates no Workers',async()=>{
 const f=setup(),Original=f.publicationWorkers.Adapter,before=snapshot(f);
 class CleanupFault extends Original {terminate(){super.terminate();throw false;}}
 globalThis.Worker=CleanupFault;
 try{
  await assert.rejects(assign(f),error=>error.code==='WORKER_CLEANUP_FAILED'&&error.cause===false);
  const after=snapshot(f);for(const key of ['A','J','T','material','revision','history','models','epoch','counters','storageRevision'])assert.deepEqual(after[key],before[key]);
  const created=f.publicationWorkers.usage.created,hashes=f.workers.hash;
  await assert.rejects(assign(f),{code:'WORKER_CLEANUP_FAILED'});
  assert.equal(f.publicationWorkers.usage.created,created);assert.equal(f.workers.hash,hashes);
 }finally{await f.cleanup();assert.equal(f.publicationWorkers.usage.created,f.publicationWorkers.usage.terminated);assert.deepEqual(f.publicationWorkers.usage.errors,[]);}
});
