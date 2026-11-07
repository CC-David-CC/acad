import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {proveInitialBox} from './prototype.mjs';
import {cases} from './cases.mjs';
const [input,output]=process.argv.slice(2),raw=readFileSync(input),r=JSON.parse(raw),sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(r.status,'PASS');for(const [name,hash]of Object.entries(r.sourcePins))assert.equal(sha(readFileSync(new URL(name,import.meta.url))),hash,name);
assert.equal(r.actual.rows.length,12);const rows=[];
for(const row of r.actual.rows){
 if(row.result){assert.deepEqual(proveInitialBox(row.captured,row.catalog,row.result.evidence),row.proof);assert.equal(row.proof.status,'available');const s=row.captured.source,spans=s.max.map((n,i)=>n-s.origin[i]),requested=s.dimensions.reduce((a,b)=>a*b,1),effective=spans.reduce((a,b)=>a*b,1),native=row.result.evidence.nativeVolume;
  assert(Number.isFinite(native)&&native>0);assert(Math.abs(native/effective-1)<1e-12);
  rows.push({id:row.id,request:cases.find(c=>c.id===row.id).request,naming:'unique-initial-construction',requestedDimensions:s.dimensions,effectiveBinary64Spans:spans,requestedVolume:requested,effectiveBoundsVolume:effective,nativeVolume:native,relativeNativeVolumeError:native/requested-1,displaySignedVolume:row.result.evidence.signedVolume,proof:row.proof.proof,requestPreserved:row.requestPreserved,workerPosts:row.creationPosts});
 }else rows.push({id:row.id,request:cases.find(c=>c.id===row.id).request,naming:'unproved',sourceStatus:row.captured.status,sourceReason:row.captured.reason??null,nativeError:row.error,requestPreserved:row.requestPreserved,workerPosts:row.creationPosts});
}
const report={status:'PASS',scope:'Independent replay of initial exact source/catalog identity proof and measurement audit; not a product feature qualification',receiptSHA256:sha(raw),available:rows.filter(r=>r.naming==='unique-initial-construction').length,unproved:rows.filter(r=>r.naming==='unproved').length,rows};
writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,available:report.available,unproved:report.unproved,receiptSHA256:report.receiptSHA256}));
