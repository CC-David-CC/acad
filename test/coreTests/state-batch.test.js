// Initialize the library through the same entry point as the application;
// its legacy base/derived stream modules have circular imports.
import '../../modules/lstream/index';
import assert from 'node:assert/strict';
import {StateStream} from '../../modules/lstream/state';
import {prepareStateBatch} from '../../modules/lstream/stateBatch';
import {createVolatileWorkspace} from '../../web/app/cad/storage/volatileWorkspace.mjs';

async function run() {
const a=new StateStream('old-a'), b=new StateStream('old-b'), seen=[];
a.attach(v=>seen.push([v,a.value,b.value]));
b.attach(v=>seen.push([v,a.value,b.value]));
seen.length=0;
const batch=prepareStateBatch([{stream:a,value:'new-a'},{stream:b,value:'new-b'}]);
assert.deepEqual([a.value,b.value],['old-a','old-b']);
batch.commit();
assert.deepEqual(seen,[]);
assert.deepEqual([a.value,b.value],['new-a','new-b']);
batch.notify();
assert.deepEqual(seen,[['new-a','new-a','new-b'],['new-b','new-a','new-b']]);
assert.throws(()=>batch.commit());assert.throws(()=>batch.notify());

const stale=prepareStateBatch([{stream:a,value:'lost-a'},{stream:b,value:'lost-b'}]);
a.next(a.value); // equal bytes are a different write
assert.equal(stale.isCurrent(),false);assert.throws(()=>stale.commit());
assert.equal(b.value,'new-b');
assert.throws(()=>prepareStateBatch([{stream:a,value:1},,{stream:b,value:2}]));
assert.throws(()=>prepareStateBatch([{stream:a,value:1},{stream:a,value:2}]));
const exhausted=new StateStream(0);exhausted._revision=Number.MAX_SAFE_INTEGER;
assert.throws(()=>prepareStateBatch([{stream:b,value:'lost'},{stream:exhausted,value:1}]).commit());
assert.equal(b.value,'new-b');

const c=new StateStream(0),d=new StateStream(0),reentrant=[];
c.attach(v=>{if(v===1){
  const reset=prepareStateBatch([{stream:d,value:7},{stream:c,value:7}]);
  reset.commit();reset.notify();
  assert.deepEqual([c.value,d.value],[7,7]);
}});
c.attach(v=>reentrant.push([v,c.value,d.value]));reentrant.length=0;
c.next(1);assert.equal(d.value,7);assert.deepEqual(reentrant,[]);
await new Promise(resolve=>setTimeout(resolve,0));assert.deepEqual(reentrant,[[7,7,7]]);

const coalesced=new StateStream(0),latest=[];
coalesced.attach(v=>{if(v===1)for(const value of [2,3,4]){
  const reset=prepareStateBatch([{stream:coalesced,value}]);reset.commit();reset.notify();
}});
coalesced.attach(v=>latest.push(v));latest.length=0;
coalesced.next(1);await new Promise(resolve=>setTimeout(resolve,0));assert.deepEqual(latest,[4]);

const ordinary=new StateStream(0),ordinaryEvents=[];
ordinary.attach(v=>{if(v===1)ordinary.next(2);});
ordinary.attach(v=>ordinaryEvents.push(v));ordinaryEvents.length=0;
ordinary.next(1);await new Promise(resolve=>setTimeout(resolve,0));
assert.deepEqual(ordinaryEvents,[2]);assert.equal(ordinary.value,2);
const subscription=new StateStream(0),subscriptionEvents=[];
const detach=subscription.attach(v=>{subscriptionEvents.push(v);if(v===0)subscription.next(1);});
assert.deepEqual(subscriptionEvents,[0,1]);detach();subscription.next(2);
assert.deepEqual(subscriptionEvents,[0,1]);

const attaching=new StateStream(0),newSubscriberEvents=[];
attaching.attach(v=>{if(v===1)attaching.attach(n=>newSubscriberEvents.push(n));});
attaching.next(1);assert.deepEqual(newSubscriberEvents,[1]);
attaching.next(2);assert.deepEqual(newSubscriberEvents,[1,2]);
let removeLate;const detaching=new StateStream(0),removedEvents=[];
detaching.attach(v=>{if(v===1)removeLate();});
removeLate=detaching.attach(v=>removedEvents.push(v));removedEvents.length=0;
detaching.next(1);assert.deepEqual(removedEvents,[]);

const e=new StateStream(0),f=new StateStream(0),events=[];
let current=true;
e.attach(v=>{if(v===1){events.push('first');current=false;}});
e.attach(v=>{if(v===1)events.push('stale-second');});
f.attach(v=>{if(v===1)events.push('stale-other-stream');});
const replacing=prepareStateBatch([{stream:e,value:1},{stream:f,value:1}]);
replacing.commit();replacing.notify(()=>current);
assert.deepEqual(events,['first']);

const g=new StateStream(0),h=new StateStream(0),hEvents=[];
g.attach(v=>{if(v===1)h.next(2);});h.attach(v=>hEvents.push(v));hEvents.length=0;
const newer=prepareStateBatch([{stream:g,value:1},{stream:h,value:1}]);
newer.commit();newer.notify();assert.deepEqual(hEvents,[2]);assert.equal(h.value,2);

// A coordinator preflights both participants, installs both without callbacks,
// then notifies. This uses the actual data core without a fake browser or UI.
const workspace=createVolatileWorkspace(),document=new StateStream('old'),views=[];
document.attach(value=>views.push([value,workspace.get('sketch')]));views.length=0;
const storage=workspace.prepareWrites([{key:'sketch',value:'prepared sketch'}]);
const model=prepareStateBatch([{stream:document,value:'new'}]);
assert.equal(storage.isCurrent()&&model.isCurrent(),true);
storage.commit();model.commit();model.notify();
assert.deepEqual(views,[['new','prepared sketch']]);
const staleStorage=workspace.prepareWrites([{key:'sketch',value:'lost'}]);
const staleModel=prepareStateBatch([{stream:document,value:'lost'}]);
workspace.set('sketch','newer');
assert.equal(staleStorage.isCurrent()&&staleModel.isCurrent(),false);
staleStorage.discard();assert.equal(document.value,'new');assert.equal(workspace.get('sketch'),'newer');
console.log('PASS state publication: consistent values, equal-byte CAS, dense inputs, exhaustion, reentrant reset/coalescing and stale notification refusal');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
