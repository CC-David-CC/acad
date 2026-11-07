import test from 'node:test';
import assert from 'node:assert/strict';
import {formatDisplayQuantity as format,captureDisplayUnitsMetadata as capture} from '../../web/app/cad/projectManager/displayUnits.mjs';
import {encodeProjectEnvelope as encode,decodeProjectEnvelope as decode} from '../../web/app/cad/projectManager/projectEnvelope.mjs';
import {geometryRevision,manufacturingSnapshotDigest} from '../../web/app/cad/projectManager/manufacturingMetadata.mjs';
import {evaluatePhysicalDefinitions} from '../../web/app/cad/parameters/physicalQuantities.mjs';
const inch=Object.freeze({version:1,lengthUnit:'inch'}),project=()=>({model:{history:[],expressions:'',counters:{featureId:0}},sketches:[]});
const close=(actual,expected)=>assert(Math.abs(actual-expected)<=Math.max(1e-12,Math.abs(expected)*1e-12),`${actual} != ${expected}`);
test('independent exact length/area/volume examples use distinct unit powers',()=>{
 for(const [value,dimension,expected,unit,text] of [[25.4,'length',1,'inch','1.00 in'],[-50.8,'length',-2,'inch','-2.00 in'],[645.16,'area',1,'square-inch','1.00 in²'],[2580.64,'area',4,'square-inch','4.00 in²'],[16387.064,'volume',1,'cubic-inch','1.00 in³'],[131096.512,'volume',8,'cubic-inch','8.00 in³']]){const r=format(value,dimension,inch);close(r.value,expected);assert.equal(r.canonicalValue,value);assert.equal(r.unit,unit);assert.equal(r.text,text);assert(Object.isFrozen(r));}
});
test('radians display in degrees independently of length presentation',()=>{
 for(const presentation of [null,inch]){const r=format(Math.PI/2,'angle',presentation);close(r.value,90);assert.equal(r.canonicalUnit,'radian');assert.equal(r.unit,'degree');assert.equal(r.text,'90.00°');assert.equal(r.canonicalValue,Math.PI/2);}
 assert.equal(format(-Math.PI,'angle',inch).text,'-180.00°');
});
test('default mm leaves canonical values intact and never accepts counts or strings as lengths',()=>{
 for(const dimension of ['length','area','volume']){const r=format(25.4,dimension);assert.equal(r.value,25.4);assert.equal(r.canonicalValue,25.4);}
 for(const [value,dimension] of [['25.4','length'],[NaN,'length'],[Infinity,'volume'],[1,'scalar'],[1,'count'],[1,'boolean']])assert.throws(()=>format(value,dimension,inch));
 for(const digits of [-1,13,.5,'2'])assert.throws(()=>format(1,'length',inch,digits));
 assert.throws(()=>format(Number.MIN_VALUE,'volume',inch));assert.throws(()=>format(Number.MAX_VALUE,'angle'));
});
test('optional metadata is exact detached immutable inch-only data, never a default-mm field',()=>{
 const source={version:1,lengthUnit:'inch'},r=capture(source);source.lengthUnit='millimeter';assert.deepEqual(r,inch);assert(Object.isFrozen(r));
 for(const value of [null,[],{version:2,lengthUnit:'inch'},{version:1,lengthUnit:'millimeter'},{version:1,lengthUnit:'inch',global:true}])assert.throws(()=>capture(value));let reads=0;const getter={version:1};Object.defineProperty(getter,'lengthUnit',{enumerable:true,get(){reads++;return 'inch';}});assert.throws(()=>capture(getter));assert.equal(reads,0);
});
test('native envelope preserves project/unit while default output retains exact original shape',()=>{
 const p=project(),mm=encode(p),imperial=encode(p,null,inch);assert.deepEqual(mm,{format:'codi-jsketcher-project',version:2,unit:'millimeter',project:p});assert.equal(JSON.stringify(encode(p)),JSON.stringify(mm));assert(!Object.hasOwn(mm,'presentation'));assert.deepEqual(decode(mm),{project:p,manufacturing:null});assert.deepEqual(decode(imperial).presentation,inch);assert.equal(imperial.unit,'millimeter');assert.equal(imperial.project,p);assert(Object.isFrozen(imperial.presentation));
 for(const presentation of [null,{version:1,lengthUnit:'millimeter'},{version:1,lengthUnit:'foot'},{version:1,lengthUnit:'inch',scale:25.4}])assert.throws(()=>decode({...mm,presentation}));
 assert.throws(()=>decode({...imperial,unit:'inch'}));
});
test('presentation remains outside geometry/manufacturing digest domains',async()=>{
 const p=project(),revision=await geometryRevision(p),metadata={version:1,unit:'millimeter',revision,materials:[],appearances:[],bindings:[],objects:[]};
 const mm=encode(p,metadata),imperial=encode(p,metadata,inch);assert.equal(await geometryRevision(mm.project),await geometryRevision(imperial.project));assert.equal(await manufacturingSnapshotDigest(mm.project,mm.manufacturing),await manufacturingSnapshotDigest(imperial.project,imperial.manufacturing));assert.deepEqual(mm.manufacturing,imperial.manufacturing);
});
test('physical expression constructors share constants without changing canonical results or source',()=>{
 const definitions=[{name:'L',dimension:'length',expression:'inch(1)'},{name:'A',dimension:'area',expression:'inch(1)*inch(1)'},{name:'V',dimension:'volume',expression:'inch(1)*inch(1)*inch(1)'},{name:'theta',dimension:'angle',expression:'deg(90)'}],before=JSON.stringify(definitions),r=evaluatePhysicalDefinitions({version:1,definitions});
 const values=Object.fromEntries(r.values.map(x=>[x.name,x.value]));close(values.L,25.4);close(values.A,645.16);close(values.V,16387.064);assert.equal(values.theta,Math.PI/2);assert.equal(JSON.stringify(definitions),before);
});
