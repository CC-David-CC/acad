import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
const root=new URL('../../',import.meta.url),dir=new URL('./evidence/after-r1/',import.meta.url),read=n=>fs.readFileSync(new URL(n,root)),digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const r=JSON.parse(fs.readFileSync(new URL('receipt.json',dir)));
for(const [name,sha]of Object.entries(r.sourceHashes))assert.equal(digest(read(name)),sha,name);
for(const row of r.rows){assert.equal(row.status,row.expected,row.name);assert.equal(row.error,null,row.name);}
assert.equal(r.rows.length,9);const log=n=>fs.readFileSync(new URL(n+'.log',dir),'utf8');
for(const [name,count,pass,fail]of [['focused',27,27,0],['retained',171,170,1],['retained-base-source',4,3,1],['readonly-service',6,6,0]]){const text=log(name);for(const [key,n]of [['tests',count],['pass',pass],['fail',fail]])assert(text.includes('ℹ '+key+' '+n),name+' '+key);}
assert(log('retained').includes('source, services, runtime-bearing history and expression table are currentness-bound'));
assert(log('retained-base-source').includes('source, services, runtime-bearing history and expression table are currentness-bound'));
assert.equal(log('tsc'),'');assert.equal(r.relocations.assertionsChanged,false);
for(const [name,pin]of Object.entries(r.bundles)){const url=new URL(name,root);if(fs.existsSync(url)){const bytes=fs.readFileSync(url);assert.equal(bytes.byteLength,pin.bytes,name);assert.equal(digest(bytes),pin.sha256,name);}}
console.log('PASS: source/bundle pins,27 focused,170 retained +1 same baseline failure,6 readonly groups,TSC0; component scope only');
