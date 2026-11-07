import test from 'node:test';
import assert from 'node:assert/strict';
import {captureOwnedHoleIntent as capture} from '../../modules/engine/solid/ownedHoleIntent.mjs';
import {solidBodyId} from '../../modules/engine/solid/solidIntent.mjs';
const commonKeys=['version','unit','engine','engineRevision','featureId','target','producerFeatureId','sourceFeatureId','sourceFaceId','sourceRegionId','kind','diameter'];
const revision='sha256:'+'a'.repeat(64)+':'+'b'.repeat(64);
const center=()=>({version:1,unit:'millimeter',engine:'occ',engineRevision:revision,featureId:3,target:solidBodyId(2),producerFeatureId:2,sourceFeatureId:2,sourceFaceId:'S:0/SURFACE',sourceRegionId:'actual-source-region',kind:'centered-through',diameter:10});
const corners=()=>({...center(),featureId:4,target:solidBodyId(3),producerFeatureId:3,kind:'four-corner-through',diameter:4,offsetX:10,offsetY:10});
const invalid=input=>assert.throws(()=>capture(input),{code:'INVALID_REQUEST'});

test('centered and four-corner capture exact canonical primitive replay inputs',()=>{
 for(const input of [center(),corners()]){
  const result=capture(input);assert.deepEqual(result,input);assert.notEqual(result,input);assert.ok(Object.isFrozen(result));
  assert.deepEqual(Object.keys(result),input.kind==='centered-through'?commonKeys:[...commonKeys,'offsetX','offsetY']);
  assert.ok(Object.values(result).every(value=>['string','number'].includes(typeof value)));
  assert.deepEqual(capture(JSON.parse(JSON.stringify(result))),result);
 }
});

test('detaches input and freezes returned union without freezing caller data',()=>{
 const input=corners(),result=capture(input);input.offsetX=77;input.sourceRegionId='changed';input.featureId=88;
 assert.equal(result.offsetX,10);assert.equal(result.sourceRegionId,'actual-source-region');assert.equal(result.featureId,4);
 assert.equal(Object.isFrozen(input),false);assert.throws(()=>{result.diameter=99;},TypeError);
 assert.throws(()=>{result.extra=1;},TypeError);
});

test('canonical output order is independent of input order; null-prototype/frozen data capture',()=>{
 const input=Object.create(null);for(const key of Object.keys(corners()).reverse())input[key]=corners()[key];
 assert.deepEqual(capture(Object.freeze(input)),corners());assert.deepEqual(Object.keys(capture(input)),[...commonKeys,'offsetX','offsetY']);
});

test('required data must be own and enumerable; no inherited fallback',()=>{
 for(const make of [center,corners])for(const key of Object.keys(make())){
  const missing=make();delete missing[key];invalid(missing);
  const hidden=make();Object.defineProperty(hidden,key,{enumerable:false});invalid(hidden);
  const inherited=make();const value=inherited[key];delete inherited[key];Object.setPrototypeOf(inherited,{[key]:value});invalid(inherited);
 }
 for(const input of [null,undefined,true,1,'intent',[],new Array(12),()=>center()])invalid(input);
});

test('all field accessors refuse without invoking getters',()=>{
 let calls=0;
 for(const make of [center,corners])for(const key of Object.keys(make())){
  const input=make();Object.defineProperty(input,key,{enumerable:true,get(){calls++;return make()[key];}});invalid(input);
 }
 assert.equal(calls,0);
});

test('extra/symbol/derived fields and setter-only data refuse without callbacks',()=>{
 let calls=0;
 for(const key of ['handle','nativeIndex','producer','depth','terminationDepth','frame','geometry','extent','source','extra']){
  const input=center();Object.defineProperty(input,key,{enumerable:true,get(){calls++;return 1;}});invalid(input);
 }
 const symbolic=center();symbolic[Symbol('hidden')]=1;invalid(symbolic);
 const replaced=center();delete replaced.diameter;replaced[Symbol('diameter')]=10;invalid(replaced);
 const setter=center();Object.defineProperty(setter,'diameter',{enumerable:true,set(){calls++;}});invalid(setter);
 assert.equal(calls,0);
});

test('exact kinds admit only their own field sets; through-all needs no saved depth',()=>{
 for(const kind of ['centered','four-corner-through-holes','through-all','CENTERED-THROUGH',null,{},new String('centered-through')])invalid({...center(),kind});
 invalid({...center(),offsetX:10});invalid({...center(),offsetX:10,offsetY:10});
 const one=corners();delete one.offsetY;invalid(one);
 assert.equal(Object.hasOwn(capture(center()),'depth'),false);
 // Parser preserves anchors; geometric admissibility belongs to evaluation.
 assert.equal(capture({...corners(),offsetY:10}).offsetY,10);
 assert.equal(capture({...corners(),offsetY:1e6}).offsetY,1e6);
});

test('exact version/unit/OCC and lowercase fixed-length SHA revision',()=>{
 for(const change of [{version:2},{version:'1'},{unit:'inch'},{unit:new String('millimeter')},{engine:'manifold'},{engine:'OCC'}])invalid({...center(),...change});
 for(const engineRevision of [undefined,{},new String(revision),'',revision+'\n',revision+'\r\n',' '+revision,revision+' ',revision.toUpperCase(),revision.slice(0,-1),revision.replace(':a',':g'),'sha256:'+'a'.repeat(63)+':'+'b'.repeat(65)])invalid({...center(),engineRevision});
 assert.equal(capture({...center(),engineRevision:'sha256:'+'0'.repeat(64)+':'+'f'.repeat(64)}).engineRevision.length,136);
});

test('feature IDs are positive safe numbers with exact body/producer relationship',()=>{
 for(const field of ['featureId','producerFeatureId','sourceFeatureId'])for(const value of [0,-0,-1,1.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1,'2',2n,new Number(2),null])invalid({...center(),[field]:value});
 invalid({...center(),featureId:2});invalid({...corners(),featureId:2});
 for(const target of [solidBodyId(1),'worker-prism:1:[2,"body"]','worker-solid:1:["2","body"]',' '+solidBodyId(2),solidBodyId(2)+'\n','x'.repeat(1025),null,{}])invalid({...center(),target});
 const max={...center(),featureId:Number.MAX_SAFE_INTEGER,producerFeatureId:Number.MAX_SAFE_INTEGER-1,sourceFeatureId:Number.MAX_SAFE_INTEGER-2,target:solidBodyId(Number.MAX_SAFE_INTEGER-1)};
 assert.equal(capture(max).featureId,Number.MAX_SAFE_INTEGER);
 // No chronological ordering is inferred; later runtime proves actual origin.
 assert.equal(capture({...center(),sourceFeatureId:99}).sourceFeatureId,99);
});

test('source IDs are bounded exact nonempty strings without fabricated legacy identities',()=>{
 for(const [key,limit]of [['sourceFaceId',256],['sourceRegionId',8192]]){
  assert.equal(capture({...center(),[key]:'x'.repeat(limit)})[key].length,limit);
  for(const value of ['',null,{},[],1,new String('source'),'x'.repeat(limit+1)])invalid({...center(),[key]:value});
  const raw=' genuine opaque '+key+' ';
  assert.equal(capture({...center(),[key]:raw})[key],raw);
 }
});

test('diameter and offsets accept finite positive millimeter values through exact maximum',()=>{
 for(const make of [center,corners])for(const field of make===center?['diameter']:['diameter','offsetX','offsetY']){
  for(const value of [0,-0,-1,NaN,Infinity,-Infinity,1e6+1,'4',new Number(4),4n,{},null])invalid({...make(),[field]:value});
  for(const value of [Number.MIN_VALUE,.001,1,1e6])assert.equal(capture({...make(),[field]:value})[field],value);
 }
});
