import test from 'node:test';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {writeFileSync} from 'node:fs';
const rows=[];
for(const family of ['physical','semantic','sketch'])test(family+' already-queued job cannot allocate after cleanup failure',()=>{
 const child=spawnSync(process.execPath,['test/state-machine-audit-disposable-clients/probe.cjs',family,'queued','error'],{encoding:'utf8',timeout:10000});assert.equal(child.status,0,child.stderr);const row=JSON.parse(child.stdout);rows.push(row);assert.equal(row.settled,true);assert.equal(row.outcome.code,'WORKER_CLEANUP_FAILED');assert.deepEqual(row.queuedOutcome,{resolved:false,code:'WORKER_CLEANUP_FAILED',causeExact:true});assert.equal(row.posts,1);assert.equal(row.terminateCalls,1);assert.deepEqual(row.uncaught,[]);assert.equal(row.timers+row.intervals+row.abortListeners,0);
});
test.after(()=>{if(process.env.CODI_QUEUED_RECEIPT)writeFileSync(process.env.CODI_QUEUED_RECEIPT,JSON.stringify({scope:'Real production clients with serialized WebLock/Worker doubles',rows},null,2)+'\n');});
