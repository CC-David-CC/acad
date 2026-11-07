import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createEvaluationResourcePool} from '../../web/app/cad/craft/evaluationResources.mjs';

test('detaching accepted resources revokes native capability but preserves document and owner',()=>{
 const pool=createEvaluationResourcePool({maxMounts:2}),document=new AbortController();let guardCalls=0,ledgerCleanup=0;const closed=[];
 const owner=pool.begin({signal:document.signal,valid:()=>{guardCalls++;return true}});
 owner.signal.addEventListener('abort',()=>{assert.equal(pool.usage.mounts,0);ledgerCleanup++;},{once:true});
 for(const name of ['plate','enclosure'])owner.getOrCreateMount(name,()=>({close(){closed.push(name)}}));
 owner.seal();const before=guardCalls;owner.accept();assert.equal(guardCalls,before);
 owner.detach();assert.equal(owner.state,'detached');assert.equal(owner.signal.aborted,true);assert.equal(document.signal.aborted,false);assert.equal(ledgerCleanup,1);assert.deepEqual(closed,['plate','enclosure']);assert.equal(pool.usage.mounts,0);assert.equal(pool.usage.detached,1);assert.equal(pool.usage.owners,1);assert.throws(()=>owner.requireCurrent(),{name:'AbortError'});
 const candidate=pool.begin({signal:document.signal,valid:()=>true});candidate.getOrCreateMount('new',()=>({close(){closed.push('new')}}));pool.cancelCandidates();assert.equal(candidate.state,'closed');assert.equal(owner.state,'detached');assert.equal(document.signal.aborted,false);owner.detach();assert.equal(ledgerCleanup,1);
 document.abort();assert.equal(owner.state,'closed');assert.equal(pool.usage.owners,0);assert.deepEqual(closed,['plate','enclosure','new']);
});

test('only an accepted owner detaches; acceptance stays synchronous and callback-free',()=>{
 const pool=createEvaluationResourcePool(),document=new AbortController();let calls=0;
 const owner=pool.begin({signal:document.signal,valid:()=>{calls++;return true}});assert.throws(()=>owner.detach(),/accepted/);owner.seal();assert.throws(()=>owner.detach(),/accepted/);const n=calls;owner.accept();assert.equal(calls,n);assert.equal(owner.state,'accepted');owner.detach();assert.equal(calls,n);owner.close();assert.throws(()=>owner.detach(),/accepted/);
});

test('detachment cleanup failure is explicit and prevents all new engine work',()=>{
 const pool=createEvaluationResourcePool({maxMounts:2}),document=new AbortController(),bad=pool.begin({signal:document.signal,valid:()=>true}),candidate=pool.begin({signal:document.signal,valid:()=>true});let otherClosed=0;
 bad.getOrCreateMount('bad',()=>({close(){throw Error('test failure')}}));bad.getOrCreateMount('other',()=>({close(){otherClosed++}}));bad.seal();bad.accept();assert.throws(()=>bad.detach(),/cleanup failed/);assert.equal(bad.state,'detached');assert.equal(otherClosed,1);assert.equal(pool.usage.mounts,0);assert.equal(pool.usage.cleanupFailed,true);assert.equal(document.signal.aborted,false);assert.throws(()=>pool.begin({signal:document.signal,valid:()=>true}),/cleanup failed/);assert.throws(()=>candidate.getOrCreateMount('x',()=>({close(){}})),/cleanup failed/);document.abort();assert.equal(pool.usage.owners,0);
});

test('reentrant close keeps reservation charged until mount close finishes',()=>{
 const pool=createEvaluationResourcePool({maxTotalMounts:1}),document=new AbortController();let owner,closeCalls=0,allocations=0;
 owner=pool.begin({signal:document.signal,valid:()=>true});const waiting=pool.begin({signal:document.signal,valid:()=>true});
 owner.getOrCreateMount('a',()=>({close(){closeCalls++;assert.equal(pool.usage.mounts,1);assert.throws(()=>owner.detach(),/in progress/);owner.close();assert.throws(()=>waiting.getOrCreateMount('b',()=>{allocations++;return {close(){}}}),/budget/);}}));owner.seal();owner.accept();assert.throws(()=>owner.detach(),{name:'AbortError'});assert.equal(owner.state,'closed');assert.equal(closeCalls,1);assert.equal(allocations,0);assert.equal(pool.usage.mounts,0);waiting.close();document.abort();
});

test('document close during native detachment ends the owner and never detaches a new document',()=>{
 const pool=createEvaluationResourcePool({maxMounts:2}),document=new AbortController(),closed=[];const owner=pool.begin({signal:document.signal,valid:()=>true});
 owner.getOrCreateMount('a',()=>({close(){closed.push('a');document.abort()}}));owner.getOrCreateMount('b',()=>({close(){closed.push('b')}}));owner.seal();owner.accept();assert.throws(()=>owner.detach(),{name:'AbortError'});assert.equal(owner.state,'closed');assert.equal(pool.usage.owners,0);assert.equal(pool.usage.mounts,0);assert.deepEqual(closed,['a','b']);
});

test('detached accepted capability cannot reacquire a mount, while its copied display remains current',()=>{
 const pool=createEvaluationResourcePool(),document=new AbortController(),display=Object.freeze({revision:'r1',positions:Object.freeze([0,0,0,1,0,0,0,1,0])});let open=true,scrubbed=0;
 const owner=pool.begin({signal:document.signal,valid:()=>true});owner.getOrCreateMount('occ',()=>({close(){open=false}}));owner.signal.addEventListener('abort',()=>scrubbed++);owner.seal();owner.accept();owner.detach();
 assert.equal(owner.state,'detached');assert.equal(open,false);assert.equal(scrubbed,1);assert.equal(document.signal.aborted,false);assert.equal(display.revision,'r1');assert.deepEqual(display.positions,[0,0,0,1,0,0,0,1,0]);assert.throws(()=>owner.getOrCreateMount('occ',()=>({close(){}})),{name:'AbortError'});document.abort();
});
