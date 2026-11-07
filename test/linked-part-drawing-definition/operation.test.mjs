import test from 'node:test';
import assert from 'node:assert/strict';
import {captureLinkedPartDrawingDefinition as capture} from '../../modules/drawing/linkedPartDrawingDefinition.mjs';
import {captureLinkedPartDrawingRequest as captureRequest,captureLinkedPartDrawingOperationRecord as captureRecord,prepareLinkedPartDrawingOperation as prepare} from '../../modules/drawing/linkedPartDrawingOperation.mjs';
import {definition,request,binding} from './fixture.mjs';
const clone = v => JSON.parse(JSON.stringify(v));
const current = drawing => ({...binding(),drawing});
const code = (fn,code='INVALID_REQUEST') => assert.throws(fn,{code});
const apply = (op,drawing,def) => prepare({request:request(op,def),current:current(drawing)});
function charge(entry){const{byteSize,...base}=entry;const json=JSON.stringify(base);return Math.max(new TextEncoder().encode(json).byteLength,2*json.length);}
function sizedDefinition(size){
  const d=definition();d.dimensions=[];
  for(let i=0;i<4;i++)d.dimensions.push({dimensionId:'p'+i,viewId:'top-view',kind:'edge-length',edge:{kind:'native-edge',originFeatureId:1,selectionId:String(i)+'x'.repeat(14000),geometry:'line'},label:[0,0]});
  let remaining=size-new TextEncoder().encode(JSON.stringify(capture(d))).byteLength;
  assert.ok(remaining>=0);
  for(const row of d.dimensions){const extra=Math.min(remaining,16384-row.edge.selectionId.length);row.edge.selectionId+='x'.repeat(extra);remaining-=extra;}
  assert.equal(remaining,0);return d;
}

test('synthetic create→replace→remove proposals preserve exact before/after; no publication or real journal claimed',()=>{
  const source=definition(),created=apply('drawing.create',null,source);
  assert.equal(created.changed,true);assert.equal(created.before,null);assert.equal(created.after.drawingId,source.drawingId);
  assert.deepEqual(created.binding,binding());assert.equal(created.journalRecord.kind,'document-metadata');assert.equal(created.journalRecord.domain,'linked-part-drawing');
  const changed=clone(source);changed.title='Edited paper title';changed.sheet.scale={numerator:1,denominator:3};
  const edited=apply('drawing.replace',created.after,changed);
  assert.equal(edited.before.title,source.title);assert.equal(edited.after.title,changed.title);
  assert.equal(edited.journalRecord.byteSize,charge(edited.journalRecord));
  assert.equal(JSON.stringify(captureRecord(edited.journalRecord)),JSON.stringify(edited.journalRecord));
  const removed=apply('drawing.remove',edited.after,changed);assert.equal(removed.after,null);assert.equal(removed.journalRecord.before.title,changed.title);
  // Reversing an entry supplies exact definitions to a future shared travel
  // dispatcher. This is metadata equality, not an executed Undo/Redo proof.
  assert.equal(JSON.stringify(edited.journalRecord.before),JSON.stringify(created.journalRecord.after));
});
test('canonical no-op creates no record; caller key order is irrelevant',()=>{
  const d=definition(),r=JSON.parse(JSON.stringify(d), (k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).reverse()):v);
  const out=apply('drawing.replace',d,r);assert.equal(out.changed,false);assert.equal(out.journalRecord,null);
});
test('stale full or geometry revisions refuse and leave caller metadata unchanged',()=>{
  for(const name of ['revision','geometryRevision']){
    const c=current(definition()),r=request('drawing.replace'),before=JSON.stringify({c,r});c[name]='other';
    code(()=>prepare({request:r,current:c}),'STALE_DOCUMENT');assert.equal(r.definition.title,definition().title);assert.equal(JSON.stringify(r),JSON.stringify(JSON.parse(before).r));
  }
});
test('identity/existence, explicit ref repair and dimension ordering are exact metadata operations',()=>{
  code(()=>apply('drawing.create',definition()),'DRAWING_ALREADY_EXISTS');code(()=>apply('drawing.remove',null),'DRAWING_NOT_FOUND');
  const r=request('drawing.replace');r.drawingId='renamed';code(()=>prepare({request:r,current:current(definition())}));
  const missing=request('drawing.remove');missing.drawingId='other';code(()=>prepare({request:missing,current:current(definition())}),'DRAWING_NOT_FOUND');
  const d=definition();d.dimensions.reverse();assert.equal(apply('drawing.replace',definition(),d).changed,true);
  const repair=definition();repair.dimensions[2].first.selectionId='explicit replacement fixture';assert.equal(apply('drawing.replace',definition(),repair).changed,true);
  // Admitting an opaque replacement does not prove its native membership.
});
test('all returned proposals/records detach caller containers and are recursively immutable',()=>{
  const d=definition(),c=current(null),r=request('drawing.create',d),out=prepare({request:r,current:c});
  function frozen(v){if(v&&typeof v==='object'){assert.ok(Object.isFrozen(v));for(const child of Object.values(v))frozen(child);}}frozen(out);
  d.dimensions[3].hole.featureId=999;c.revision='caller-mutated';r.definition.title='caller changed';
  assert.equal(out.after.dimensions[3].hole.featureId,2);assert.equal(out.binding.revision,binding().revision);
  assert.equal(out.journalRecord.after,out.after);
});
test('64KiB public request includes wrapper and multibyte revision bytes',()=>{
  const raw=definition(),overhead=new TextEncoder().encode(JSON.stringify(request('drawing.create',capture(raw)))).byteLength-new TextEncoder().encode(JSON.stringify(capture(raw))).byteLength;
  const d=sizedDefinition(65536-overhead),r=request('drawing.create',d);assert.equal(new TextEncoder().encode(JSON.stringify(captureRequest(r))).byteLength,65536);
  r.definition.dimensions.find(x=>x.edge.selectionId.length<16384).edge.selectionId+='x';code(()=>captureRequest(r),'RESOURCE_LIMIT');
  const max=sizedDefinition(65536);capture(max);code(()=>captureRequest(request('drawing.create',max)),'RESOURCE_LIMIT');
  const u=request('drawing.create',d);u.revision='é'.repeat(binding().revision.length);code(()=>captureRequest(u),'RESOURCE_LIMIT');
});
test('journal capture checks exact domain/identity/null/no-op/derived charge and retained cap',()=>{
  const e=apply('drawing.create',null).journalRecord;
  for(const mutate of [r=>r.byteSize++,r=>r.kind='separate-drawing-stack',r=>r.domain='material',r=>r.key='other',r=>r.before=null,r=>r.after=null]){
    const x=clone(e);mutate(x);if(JSON.stringify(x)===JSON.stringify(e))continue;code(()=>captureRecord(x));
  }
  const noop=clone(e);noop.before=clone(noop.after);code(()=>captureRecord(noop));
  const both=clone(e);both.before=null;both.after=null;code(()=>captureRecord(both));
  const before=sizedDefinition(65536),after=clone(before);after.title=after.title.replace('Synthetic','SYNTHETIC');
  const large={kind:'document-metadata',version:1,domain:'linked-part-drawing',key:before.drawingId,before:capture(before),after:capture(after),byteSize:0};
  code(()=>captureRecord(large),'RESOURCE_LIMIT');
});
test('operation records require exact own data and cannot execute accessor/toJSON hooks',()=>{
  let calls=0;const r=request('drawing.create');Object.defineProperty(r,'op',{enumerable:true,get(){calls++;return 'drawing.create';}});code(()=>captureRequest(r));
  const input={request:request('drawing.create'),current:current(null)};Object.defineProperty(input.current,'drawing',{enumerable:true,get(){calls++;return definition();}});code(()=>prepare(input));
  const extra=request('drawing.create');extra.handle='private';code(()=>captureRequest(extra));
  const e=clone(apply('drawing.create',null).journalRecord);e[Symbol('hidden')]=1;code(()=>captureRecord(e));
  const forged={...request('drawing.create'),op:'drawing.patch'};code(()=>captureRequest(forged));assert.equal(calls,0);
  let reads=0;const changing=new Proxy(request('drawing.create'),{getOwnPropertyDescriptor(target,key){const d=Reflect.getOwnPropertyDescriptor(target,key);return key==='op'?{...d,value:++reads===1?'drawing.create':'drawing.remove'}:d;}});
  code(()=>captureRequest(changing));assert.equal(reads,2);
});
