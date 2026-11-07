import test from 'node:test';
import assert from 'node:assert/strict';
import {createVolatileWorkspace, WORKSPACE_PREPARATION_LIMITS as limits} from '../../web/app/cad/storage/volatileWorkspace.mjs';

test('private writes are invisible until one complete installation', () => {
  const s=createVolatileWorkspace();s.set('sketch/old','old');s.set('unrelated','keep');
  const revision=s.revision;
  const prepared=s.prepareWrites([{key:'sketch/old',value:null},{key:'sketch/new',value:'new'}]);
  assert.equal(s.get('sketch/old'),'old');assert.equal(s.get('sketch/new'),null);
  assert.equal(prepared.get('sketch/old'),null);assert.equal(prepared.get('sketch/new'),'new');
  assert.deepEqual(prepared.getAllKeysFromNamespace('sketch/'),['sketch/new']);
  assert.equal(prepared.expectedRevision,revision);assert.equal(prepared.isCurrent(),true);
  assert.equal(prepared.commit(),revision+1);
  assert.equal(s.get('sketch/old'),null);assert.equal(s.get('sketch/new'),'new');assert.equal(s.get('unrelated'),'keep');
  assert.equal(prepared.isCurrent(),false);assert.equal(prepared.discard(),false);
  assert.throws(()=>prepared.commit());assert.throws(()=>prepared.get('sketch/new'));
});

test('equal writes, remove/recreate and absent removal invalidate preparation', () => {
  for(const replace of [s=>s.set('key','old'),s=>{s.remove('key');s.set('key','old');},s=>s.remove('absent')]) {
    const s=createVolatileWorkspace();s.set('key','old');
    const pending=s.prepareWrites([{key:'key',value:'candidate'},{key:'other',value:'new'}]);
    replace(s);assert.equal(pending.isCurrent(),false);assert.throws(()=>pending.commit());
    assert.equal(s.get('key'),'old');assert.equal(s.get('other'),null);
    // A normal write already discarded the retained candidate.
    assert.equal(pending.discard(),false);assert.throws(()=>pending.get('key'),/closed/);
  }
});

test('malformed input refuses before changes and does not execute accessors', () => {
  const s=createVolatileWorkspace();s.set('key','old');let calls=0;
  const slot=[];Object.defineProperty(slot,'0',{get(){calls++;return {key:'key',value:'bad'};},enumerable:true});
  const row={key:'key',get value(){calls++;return 'bad';}};
  for(const changes of [[],[{key:'key',value:'first'},,{key:'other',value:'bad'}],slot,[row],
      [{key:'key',value:'first'},{key:'key',value:'second'}],
      [{key:'key',value:'first'},{key:'other',value:123}],
      [{key:'key',value:'first',extra:true}]]) {
    const revision=s.revision;assert.throws(()=>s.prepareWrites(changes));
    assert.equal(s.revision,revision);assert.equal(s.get('key'),'old');assert.equal(s.get('other'),null);
  }
  assert.equal(calls,0);
});

test('caller mutation and another workspace cannot change a private candidate', () => {
  const a=createVolatileWorkspace(),b=createVolatileWorkspace(),input=[{key:'key',value:'candidate'}];
  const prepared=a.prepareWrites(input);input[0].value='changed';input.push({key:'extra',value:'changed'});
  b.set('key','other account');assert.equal(prepared.isCurrent(),true);
  prepared.commit();assert.equal(a.get('key'),'candidate');assert.equal(a.get('extra'),null);assert.equal(b.get('key'),'other account');
  const newer=a.set('key','candidate');assert.notEqual(newer,1);
});

test('discard releases the candidate without publishing any partial batch', () => {
  const s=createVolatileWorkspace();s.set('old','old');const rev=s.revision;
  const prepared=s.prepareWrites([{key:'old',value:null},{key:'new',value:'new'}]);
  assert.equal(prepared.discard(),true);assert.equal(prepared.isCurrent(),false);
  assert.throws(()=>prepared.commit());assert.throws(()=>prepared.getAllKeysFromNamespace(''));
  assert.equal(s.revision,rev);assert.equal(s.get('old'),'old');assert.equal(s.get('new'),null);
});

test('one retained candidate, bounded input and record index, and automatic invalidation release', () => {
  const s=createVolatileWorkspace();
  assert.throws(()=>s.prepareWrites(Array.from({length:limits.writes+1},(_,i)=>({key:String(i),value:'v'}))),/limits/);
  assert.throws(()=>s.prepareWrites([{key:'k'.repeat(limits.keyCharacters+1),value:'v'}]),/limits/);
  assert.throws(()=>s.prepareWrites([{key:'key',value:'v'.repeat(limits.valueCharacters+1)}]),/limits/);
  const first=s.prepareWrites([{key:'one',value:'one'}]);
  assert.throws(()=>s.prepareWrites([{key:'two',value:'two'}]),/pending/);
  s.set('other','new');assert.equal(first.isCurrent(),false);assert.throws(()=>first.get('one'),/closed/);
  const second=s.prepareWrites([{key:'two',value:'two'}]);second.discard();
  const third=s.prepareWrites([{key:'three',value:'three'}]);s.remove('absent');
  assert.equal(third.isCurrent(),false);assert.equal(s.prepareWrites([{key:'four',value:'four'}]).discard(),true);
  const full=createVolatileWorkspace();
  for(let i=0;i<limits.records;i++)full.set(String(i),'v');
  assert.throws(()=>full.prepareWrites([{key:'extra',value:'v'}]),/record limit/);
  assert.equal(full.prepareWrites([{key:'0',value:'replacement'}]).discard(),true);
  full.set('extra','legacy');
  assert.throws(()=>full.prepareWrites([{key:'0',value:'replacement'}]),/structural limits/);
});

test('validation reentrancy cannot create two owners or clear a newer reservation', () => {
  const s=createVolatileWorkspace();let denied=0;
  const row=new Proxy({key:'outer',value:'outer'}, {getPrototypeOf(target) {
    assert.throws(()=>s.prepareWrites([{key:'inner',value:'inner'}]),/pending/);denied++;
    return Object.getPrototypeOf(target);
  }});
  const first=s.prepareWrites([row]);assert.equal(denied,1);
  assert.throws(()=>s.prepareWrites([{key:'third',value:'third'}]),/pending/);first.discard();
  let newer;
  const replacement=new Proxy({key:'outer',value:'outer'}, {getPrototypeOf(target) {
    s.set('accepted','accepted');
    newer=s.prepareWrites([{key:'newer',value:'newer'}]);
    return Object.getPrototypeOf(target);
  }});
  assert.throws(()=>s.prepareWrites([replacement]),/superseded/);
  assert.equal(newer.isCurrent(),true);
  assert.throws(()=>s.prepareWrites([{key:'third',value:'third'}]),/pending/);
  newer.commit();assert.equal(s.get('newer'),'newer');assert.equal(s.get('outer'),null);
});
