import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const receipt=JSON.parse(readFileSync(process.env.CODI_DISPOSABLE_OBSERVATION));
assert.equal(receipt.rows.length,48);
for(const row of receipt.rows)test(`${row.family} ${row.scenario} cleanup=${row.fault}`,()=>{
 assert.equal(row.settled,true,'Every terminal path must settle after its deadline');assert.equal(row.settlements,1);assert.equal(row.beforeLate.settlements,1,'Late reply cannot be needed for settlement');assert.equal(row.terminateCalls,1,'No blind termination retry');assert.deepEqual(row.uncaught,[]);assert.equal(row.timers,0);assert.equal(row.intervals,0);assert.equal(row.abortListeners,0);
 if(row.fault!=='none'){assert.equal(row.outcome.resolved,false);assert.equal(row.outcome.code,'WORKER_CLEANUP_FAILED');assert.equal(row.outcome.causeExact,true);if(row.scenario!=='success')assert(row.outcome.operationError,'Original operation error remains available');assert.deepEqual(row.subsequent,{resolved:false,code:'WORKER_CLEANUP_FAILED',causeExact:true,posts:0,terminations:0});}
 else if(row.scenario==='success')assert.equal(row.outcome.resolved,true);
 else {assert.equal(row.outcome.resolved,false);if(['abort','late'].includes(row.scenario))assert.equal(row.outcome.name,'AbortError');if(row.scenario==='timeout')assert.match(row.outcome.message,/timed out/);}
});
