import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createEvaluationResourcePool} from '../../web/app/cad/craft/evaluationResources.mjs';

test('two feature mounts share one candidate without exceeding the pool ceiling', () => {
  const pool=createEvaluationResourcePool({maxMounts:2}), document=new AbortController(), closed=[];
  const begin=()=>pool.begin({signal:document.signal,valid:()=>true});
  const put=(owner,key)=>owner.getOrCreateMount(key,()=>({close(){closed.push(key)}}));
  const accepted=begin();put(accepted,'accepted');accepted.seal();accepted.accept();
  const candidate=begin();put(candidate,'plate');put(candidate,'enclosure');
  assert.equal(pool.usage.mounts,3);
  const another=begin();let allocations=0;
  assert.throws(()=>another.getOrCreateMount('excess',()=>{allocations++;return {close(){}}}),/budget/);
  assert.equal(allocations,0);pool.cancelCandidates();
  assert.deepEqual(closed,['plate','enclosure']);assert.equal(pool.usage.mounts,1);
  assert.equal(accepted.state,'accepted');document.abort();assert.equal(pool.usage.mounts,0);
});

test('cancelled in-flight factory reservation cannot be reused reentrantly', () => {
  const pool=createEvaluationResourcePool({maxMounts:2,maxTotalMounts:1}), document=new AbortController();
  const begin=()=>pool.begin({signal:document.signal,valid:()=>true});
  const a=begin(),b=begin();let closed=0, allocations=0;
  assert.throws(()=>a.getOrCreateMount('first',()=>{
    a.close();assert.equal(pool.usage.mounts,1);
    assert.throws(()=>b.getOrCreateMount('second',()=>{allocations++;return {close(){}}}),/budget/);
    return {close(){closed++;}};
  }),{name:'AbortError'});
  assert.equal(allocations,0);assert.equal(closed,1);assert.equal(pool.usage.mounts,0);
  b.getOrCreateMount('second',()=>({close(){closed++;}}));b.close();
  assert.equal(closed,2);assert.equal(pool.usage.mounts,0);
});

test('failed factory releases its reservation and limits reject invalid configuration', () => {
  for(const options of [{maxMounts:3},{maxMounts:0},{maxTotalMounts:4},{maxTotalMounts:0},{maxTotalMounts:1.5}])
    assert.throws(()=>createEvaluationResourcePool(options),/Invalid/);
  const pool=createEvaluationResourcePool({maxMounts:2,maxTotalMounts:1}), document=new AbortController();
  const owner=pool.begin({signal:document.signal,valid:()=>true});
  assert.throws(()=>owner.getOrCreateMount('bad',()=>{throw Error('factory failed')}),/factory failed/);
  assert.equal(pool.usage.mounts,0);owner.getOrCreateMount('good',()=>({close(){}}));
  owner.close();assert.equal(pool.usage.mounts,0);
});

test('failed replacement closes only its resources, retaining both accepted revisions', () => {
  const pool = createEvaluationResourcePool(), document = new AbortController(), closed = [];
  const candidate = name => { const owner = pool.begin({signal:document.signal, valid:() => true});
    owner.getOrCreateMount('occ', () => ({close() { closed.push(name); }})); return owner; };
  const tip = candidate('tip'); tip.seal(); tip.accept();
  const rollback = candidate('rollback'); rollback.seal(); rollback.accept();
  const replacement = candidate('replacement'); pool.cancelCandidates();
  assert.equal(replacement.signal.aborted, true); assert.deepEqual(closed, ['replacement']);
  assert.equal(tip.signal.aborted, false); assert.equal(rollback.signal.aborted, false);
  document.abort(); assert.deepEqual(closed, ['replacement', 'tip', 'rollback']);
  assert.equal(pool.usage.owners, 0);
});

test('admission precedes allocation and stale factory results are closed', () => {
  const pool = createEvaluationResourcePool(), document = new AbortController();
  let valid = true, allocations = 0, closed = 0;
  const owner = pool.begin({signal:document.signal, valid:() => valid});
  const factory = () => { allocations++; return {close() { closed++; }}; };
  assert.equal(owner.getOrCreateMount('occ', factory), owner.getOrCreateMount('occ', factory));
  assert.throws(() => owner.getOrCreateMount('other', factory), /budget/); assert.equal(allocations, 1);
  owner.close();
  const stale = pool.begin({signal:document.signal, valid:() => valid});
  assert.throws(() => stale.getOrCreateMount('occ', () => { valid = false; return factory(); }), {name:'AbortError'});
  assert.equal(closed, 2); stale.close(); assert.equal(pool.usage.owners, 0);
});

test('sealing forbids allocation and publication acceptance invokes no external guard', () => {
  const pool = createEvaluationResourcePool(), document = new AbortController(); let calls = 0;
  const owner = pool.begin({signal:document.signal, valid:() => { calls++; return true; }});
  owner.seal(); assert.throws(() => owner.getOrCreateMount('occ', () => {}), /sealed/);
  const before = calls; owner.accept(); assert.equal(calls, before);
  pool.cancelCandidates(); assert.equal(owner.signal.aborted, false);
  assert.throws(() => owner.requireCurrent(), {name:'AbortError'});
  owner.close(); owner.close(); assert.equal(pool.usage.owners, 0);
});

test('document abort during factory creation closes the returned mount', () => {
  const pool = createEvaluationResourcePool(), document = new AbortController(); let closed = 0;
  const owner = pool.begin({signal:document.signal, valid:() => true});
  assert.throws(() => owner.getOrCreateMount('occ', () => {
    document.abort(); return {close() { closed++; }};
  }), {name:'AbortError'});
  assert.equal(closed, 1); assert.equal(pool.usage.owners, 0);
});

test('a cleanup failure cannot silently admit another engine', () => {
  const pool = createEvaluationResourcePool(), document = new AbortController();
  const owner = pool.begin({signal:document.signal, valid:() => true});
  owner.getOrCreateMount('occ', () => ({close() { throw Error('termination failed'); }}));
  owner.close(); assert.equal(pool.usage.cleanupFailed, true);
  assert.throws(() => pool.begin({signal:document.signal, valid:() => true}), /cleanup failed/);
});

test('three retained/candidate owners are the per-document ceiling', () => {
  const pool = createEvaluationResourcePool(), document = new AbortController();
  const owners = [0,1,2].map(() => pool.begin({signal:document.signal, valid:() => true}));
  assert.throws(() => pool.begin({signal:document.signal, valid:() => true}), /Too many/);
  owners[2].close(); pool.begin({signal:document.signal, valid:() => true});
  document.abort(); assert.equal(pool.usage.owners, 0);
});

test('cleanup failure also blocks an already-admitted candidate', () => {
  const pool = createEvaluationResourcePool(), document = new AbortController();
  const a = pool.begin({signal:document.signal, valid:() => true});
  const b = pool.begin({signal:document.signal, valid:() => true});
  let allocated = 0;
  a.getOrCreateMount('occ', () => ({close() {throw Error('termination failed');}}));
  a.close();
  assert.throws(() => b.getOrCreateMount('occ', () => {allocated++; return {close() {}};}), /cleanup failed/);
  assert.equal(allocated, 0); b.close();
});

test('cleanup failure during allocation discards the returned mount', () => {
  const pool = createEvaluationResourcePool(), document = new AbortController();
  const a = pool.begin({signal:document.signal, valid:() => true});
  const b = pool.begin({signal:document.signal, valid:() => true});
  let closed = 0;
  a.getOrCreateMount('occ', () => ({close() {throw Error('termination failed');}}));
  assert.throws(() => b.getOrCreateMount('occ', () => {a.close(); return {close() {closed++;}};}), /cleanup failed/);
  assert.equal(closed, 1); b.close();
});

test('a guard cancelling its own owner cannot start a new mount', () => {
  const pool = createEvaluationResourcePool(), document = new AbortController();
  let owner, allocate = 0;
  owner = pool.begin({signal:document.signal, valid:() => { if (owner) owner.close(); return true; }});
  assert.throws(() => owner.getOrCreateMount('occ', () => { allocate++; }), {name:'AbortError'});
  assert.equal(allocate, 0);
});

test('registered source and handle guards are rechecked before publication', () => {
  const pool=createEvaluationResourcePool(), document=new AbortController();
  const owner=pool.begin({signal:document.signal,valid:()=>true}); let valid=true, calls=0;
  owner.addPublicationCheck('handle',()=>{calls++;if(!valid)throw Error('source changed');});
  owner.seal();const before=calls;valid=false;
  assert.throws(()=>owner.requireCurrent(),/source changed/);assert.ok(calls>before);
  assert.equal(owner.state,'candidate');owner.close();
});

test('publication guards cannot recurse, await or cancel unnoticed', () => {
  const pool=createEvaluationResourcePool(), document=new AbortController();
  const owner=pool.begin({signal:document.signal,valid:()=>true});
  assert.throws(()=>owner.addPublicationCheck('recursive',()=>owner.requireCurrent()),/Recursive/);
  assert.throws(()=>owner.addPublicationCheck('async',()=>Promise.resolve()),/synchronous/);
  assert.throws(()=>owner.addPublicationCheck('cancel',()=>owner.close()),{name:'AbortError'});
  assert.equal(pool.usage.owners,0);
});

test('publication check count is bounded and accepted phase invokes no callbacks', () => {
  const pool=createEvaluationResourcePool(), document=new AbortController();let checks=0;
  const owner=pool.begin({signal:document.signal,valid:()=>true});
  for(let i=0;i<256;i++)owner.addPublicationCheck(String(i),()=>{checks++;});
  assert.throws(()=>owner.addPublicationCheck('257',()=>{}),/excessive/);
  owner.seal();const before=checks;owner.accept();assert.equal(checks,before);owner.close();
});
