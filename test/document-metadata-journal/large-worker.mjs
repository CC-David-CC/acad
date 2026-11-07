import {parentPort} from 'node:worker_threads';
import assert from 'node:assert/strict';
import {emptyAuthoredEditJournal,recordDocumentMetadataEdit as edit,captureDocumentMetadataRecord as capture,recordExtrusionEdit} from '../../web/app/cad/craft/authoredEditJournal.mjs';
import {manufacturing} from './fixture.mjs';
const LIMIT=8388608,base=()=>emptyAuthoredEditJournal(3,0);
const charge=r=>{const{byteSize,...b}=r,s=JSON.stringify(b);return Math.max(new TextEncoder().encode(s).length,2*s.length);};
const entry=(before,after)=>({kind:'document-metadata',version:1,domain:'manufacturing',key:'manufacturing',before,after});
const record=(s,before,after)=>edit(s,{document:3,revision:s.revision,domain:'manufacturing',key:'manufacturing',before,after});
// Existing v1 permits10000 definitions and more than32 objects/regions. Do not
// apply the narrower generic-assignment request's128/32/256KiB ceilings here.
const legacy=manufacturing(10000);for(const m of legacy.materials)m.name='x'.repeat(256);
legacy.objects=Array.from({length:33},(_,i)=>({...legacy.objects[0],id:'part-'+i}));
legacy.objects[0].regions=Array.from({length:33},(_,i)=>({...legacy.objects[0].regions[0],id:'region-'+i}));
const big=record(base(),null,legacy);assert.equal(big.entries[0].after.materials.length,10000);assert.equal(big.entries[0].after.objects.length,33);assert.equal(big.entries[0].after.objects[0].regions.length,33);assert.ok(big.entries[0].byteSize>262144);
const before=manufacturing(8000),after=manufacturing(8000);
for(const m of before.materials)m.name='B'.repeat(200);for(const m of after.materials)m.name='A'.repeat(200);
let need=(LIMIT-charge(entry(before,after)))/2;assert.ok(Number.isInteger(need)&&need>0);
for(const payload of [before,after])for(const m of payload.materials){const add=Math.min(need,256-m.name.length);m.name+='x'.repeat(add);need-=add;}
assert.equal(need,0);const exact=entry(before,after);exact.byteSize=charge(exact);assert.equal(exact.byteSize,LIMIT);
const captured=capture(exact);assert.equal(captured.byteSize,LIMIT);
const slot=after.materials.find(m=>m.name.length<256);slot.name+='x';const over=entry(before,after);over.byteSize=charge(over);assert.throws(()=>capture(over),{code:'RESOURCE_LIMIT'});slot.name=slot.name.slice(0,-1);
let s=recordExtrusionEdit(base(),{document:3,revision:0,index:0,featureId:1,before:1,after:2});s=record(s,before,after);
assert.equal(s.entries.length,1);assert.equal(s.entries[0].byteSize,LIMIT);
s=recordExtrusionEdit(s,{document:3,revision:s.revision,index:0,featureId:1,before:2,after:3});assert.equal(s.entries.length,1);assert.equal(s.entries[0].kind,'extrusion-depth');
let mixed=base(),expected=[];
for(let i=0;i<20;i++){
 mixed=i%2?recordExtrusionEdit(mixed,{document:3,revision:mixed.revision,index:0,featureId:1,before:i,after:i+1}):record(mixed,null,legacy);
 const last=mixed.entries.at(-1);expected.push(last);expected=expected.slice(-64);while(expected.reduce((n,e)=>n+(e.kind==='document-metadata'?e.byteSize:256),0)>LIMIT&&expected.length>1)expected.shift();
 assert.deepEqual(mixed.entries,expected);
}
parentPort.postMessage({legacyCompatible:true,exactCharge:captured.byteSize,oversizeRefused:true,evictionExact:true,geometryPreserved:true});
