import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const receipt=JSON.parse(readFileSync(process.env.CODI_PROJECT_WORKER_OBSERVATION));assert.equal(receipt.rows.length,5);
for(const row of receipt.rows)test(row.kind+' cleanup='+row.fault,()=>{
 assert.equal(row.after.settled,true);assert.equal(row.lateSettled,true);assert.equal(row.after.termCalls,1);assert.deepEqual(row.uncaught,[]);assert.equal(row.after.projectAbortListeners,0);assert.equal(row.after.callerAbortListeners,0);assert.equal(row.before.material,row.after.material);assert.equal(row.after.workers.geometry,0);
 if(row.fault==='none')assert.equal(row.after.outcome.resolved,true);else{assert.equal(row.after.outcome.resolved,false);assert.equal(row.after.outcome.code,'WORKER_CLEANUP_FAILED');assert.equal(row.after.outcome.causeExact,true);assert.deepEqual(row.subsequent,{resolved:false,code:'WORKER_CLEANUP_FAILED',causeExact:true,newWorkers:0});}
});
