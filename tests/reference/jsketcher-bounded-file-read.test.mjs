import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readVersionedBytes} from '../apps/system/jsketcher/file-read.mjs';

const data=new TextEncoder().encode('{}');
const meta={bytes:data.length,version:'v1',sha256:'a'.repeat(64),status:'synced'};
function fixture(){let calls=0;return {files:{async stat(){return {...meta};},async readBounded(path,limit){calls++;assert.equal(path,'/model.jsketcher.json');assert.equal(limit,10);return {...meta,data};}},calls:()=>calls};}
const options={maximumBytes:10};
test('reads a bounded stable snapshot without copying the returned bytes',async()=>{const f=fixture(),r=await readVersionedBytes(f.files,'/model.jsketcher.json',options);assert.equal(r.data,data);assert.equal(f.calls(),1);});
test('oversize and conflict metadata refuse before reading content',async()=>{for(const change of [{bytes:11},{status:'conflict'}]){const f=fixture();f.files.stat=async()=>({...meta,...change});await assert.rejects(readVersionedBytes(f.files,'/model.jsketcher.json',options));assert.equal(f.calls(),0);}});
test('size or version changes during read fail without returning content',async()=>{for(const change of [{version:'v2'},{data:new Uint8Array(3)},{sha256:'b'.repeat(64)},{status:'conflict'}]){const f=fixture();f.files.readBounded=async()=>({...meta,data,...change});await assert.rejects(readVersionedBytes(f.files,'/model.jsketcher.json',options));}});
test('remote/local version change after the snapshot is rejected',async()=>{const f=fixture();let n=0;f.files.stat=async()=>({...meta,version:++n===1?'v1':'v2'});await assert.rejects(readVersionedBytes(f.files,'/model.jsketcher.json',options),/changed/);});
test('account invalidation after content read cannot return a stale account file',async()=>{const f=fixture();let valid=true;f.files.readBounded=async()=>{valid=false;return {...meta,data};};await assert.rejects(readVersionedBytes(f.files,'/model.jsketcher.json',{...options,valid:()=>valid}),/account changed/);});
test('pre-aborted operation never reads metadata or bytes',async()=>{const f=fixture(),c=new AbortController();c.abort();f.files.stat=()=>assert.fail('metadata must not be read');await assert.rejects(readVersionedBytes(f.files,'/model.jsketcher.json',{...options,signal:c.signal}),{name:'AbortError'});assert.equal(f.calls(),0);});
test('missing bounded reader fails before any unsafe full-file fallback',async()=>{const f=fixture();delete f.files.readBounded;f.files.read=()=>assert.fail('unbounded reader must not run');await assert.rejects(readVersionedBytes(f.files,'/model.jsketcher.json',options),/Bounded/);});
