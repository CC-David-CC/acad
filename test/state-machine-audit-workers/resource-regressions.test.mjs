// These exercise the real resource-pool implementation with controlled mount
// cleanup failures. They do not claim any native kernel failed cleanup.
import test from 'node:test';
import assert from 'node:assert/strict';
const modulePath=process.env.CODI_RESOURCE_CANDIDATE||new URL('../../web/app/cad/craft/evaluationResources.mjs',import.meta.url).href;
const {createEvaluationResourcePool}=await import(modulePath);
for(const [label,reason]of [['undefined',undefined],['null',null],['zero',0],['false',false],['empty-string','']])test('any thrown cleanup value permanently fences pool: '+label,()=>{
 const pool=createEvaluationResourcePool({maxTotalMounts:1}),document=new AbortController(),bad=pool.begin({signal:document.signal,valid:()=>true}),alreadyAdmitted=pool.begin({signal:document.signal,valid:()=>true});let closes=0,allocations=0;
 bad.getOrCreateMount('bad',()=>({close(){closes++;throw reason;}}));bad.seal();bad.accept();bad.close();
 assert.equal(closes,1);assert.equal(pool.usage.cleanupFailed,true,'Every thrown value must latch cleanup failure');
 assert.throws(()=>alreadyAdmitted.getOrCreateMount('next',()=>{allocations++;return{close(){}};}),/cleanup failed/,'Existing candidate must be fenced');
 assert.throws(()=>pool.begin({signal:document.signal,valid:()=>true}),/cleanup failed/,'New owner must be fenced');assert.equal(allocations,0);alreadyAdmitted.close();
});
test('invalid cleanup accessor cannot orphan a native-mount reservation',()=>{
 const pool=createEvaluationResourcePool({maxTotalMounts:1}),document=new AbortController(),owner=pool.begin({signal:document.signal,valid:()=>true});let reads=0;
 assert.throws(()=>owner.getOrCreateMount('invalid',()=>Object.defineProperty({},'close',{get(){reads++;throw Error('cleanup accessor failed');}})),/cleanup accessor failed/);
 owner.close();assert.equal(pool.usage.owners,0);assert.equal(pool.usage.mounts,0,'Failed factory must not leave unreachable reservations');assert(reads>=1);
});
test('ordinary Error cleanup already fences current and new owners',()=>{
 const pool=createEvaluationResourcePool(),document=new AbortController(),a=pool.begin({signal:document.signal,valid:()=>true}),b=pool.begin({signal:document.signal,valid:()=>true});a.getOrCreateMount('a',()=>({close(){throw Error('ordinary failure');}}));a.close();assert(pool.usage.cleanupFailed);assert.throws(()=>b.requireCurrent(),/cleanup failed/);assert.throws(()=>pool.begin({signal:document.signal,valid:()=>true}),/cleanup failed/);b.close();
});
