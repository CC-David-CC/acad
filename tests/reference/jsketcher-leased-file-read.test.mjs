import {test} from 'node:test';
import assert from 'node:assert/strict';
import {acquireVersionedSnapshot} from "../../webos/file-read.mjs";

function fixture(){
 const data=new Blob(['{}']),meta={bytes:2,version:'v1',sha256:'a'.repeat(64),status:'synced'};
 let released=0,acquired=0;
 const lease={data,version:meta.version,sha256:meta.sha256,status:meta.status,release(){released++;}};
 return {meta,lease,files:{async stat(){return {...meta};},async acquireSnapshot(path,options){assert.equal(path,'/model');assert.equal(options.expected,'v1');acquired++;return lease;}},counts:()=>({released,acquired})};
}
const options={maximumBytes:10};
test('hands the same verified Blob lease to its consuming worker without materializing bytes',async()=>{
 const f=fixture();f.lease.data.arrayBuffer=()=>assert.fail('host must not materialize bytes');
 const lease=await acquireVersionedSnapshot(f.files,'/model',options);
 assert.equal(lease,f.lease);assert.equal(lease.data,f.lease.data);assert.deepEqual(f.counts(),{released:0,acquired:1});
 lease.release();assert.equal(f.counts().released,1);
});
test('oversize and conflicting metadata refuse before acquiring a lease',async()=>{
 for(const change of [{bytes:11},{status:'conflict'}]){const f=fixture();Object.assign(f.meta,change);await assert.rejects(acquireVersionedSnapshot(f.files,'/model',options));assert.deepEqual(f.counts(),{released:0,acquired:0});}
});
test('changed or conflicting snapshot releases its acquired lease',async()=>{
 for(const change of [{version:'v2'},{sha256:'b'.repeat(64)},{status:'conflict'},{data:new Blob(['longer'])}]){const f=fixture();Object.assign(f.lease,change);await assert.rejects(acquireVersionedSnapshot(f.files,'/model',options));assert.equal(f.counts().released,1);}
});
test('a later metadata change or failed stat releases the lease',async()=>{
 for(const fail of [false,true]){const f=fixture();let n=0;f.files.stat=async()=>{if(++n===1)return {...f.meta};if(fail)throw Error('storage unavailable');return {...f.meta,version:'v2'};};await assert.rejects(acquireVersionedSnapshot(f.files,'/model',options));assert.equal(f.counts().released,1);}
});
test('account invalidation or cancellation after acquisition releases the lease',async()=>{
 for(const abort of [false,true]){const f=fixture(),controller=new AbortController();let valid=true;f.files.acquireSnapshot=async()=>{if(abort)controller.abort();else valid=false;return f.lease;};await assert.rejects(acquireVersionedSnapshot(f.files,'/model',{...options,valid:()=>valid,signal:controller.signal}));assert.equal(f.counts().released,1);}
});
test('missing snapshot service fails without falling back to a full byte read',async()=>{
 const f=fixture();delete f.files.acquireSnapshot;f.files.read=()=>assert.fail('full read must not run');await assert.rejects(acquireVersionedSnapshot(f.files,'/model',options),/snapshots/);
});
