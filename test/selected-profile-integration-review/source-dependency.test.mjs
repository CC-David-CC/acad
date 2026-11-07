import test from 'node:test';
import assert from 'node:assert/strict';
import {hasOnlyUnconsumedSketchHistory} from '../../web/app/cad/craft/unconsumedSketchSave.mjs';
import {OCC_SELECTED_PROFILE_BUILD} from '../../modules/engine/mount/engineCatalog.mjs';
const plane={type:'PLANE',params:{featureId:1,orientation:'XY',depth:0}};
const selected=()=>({type:'WORKER_SELECTED_PROFILE_EXTRUDE_V2',params:{version:1,unit:'millimeter',engine:'occ',engineRevision:OCC_SELECTED_PROFILE_BUILD.revision,featureId:2,faceId:'source-A',regionId:'sketch-region:test',depth:5,bodyPolicy:'separate'}});
test('selected profile is a real dependency despite retaining its plane',()=>{
 const history=[plane,selected()];
 assert.equal(hasOnlyUnconsumedSketchHistory(history,'source-A'),false);
 assert.equal(hasOnlyUnconsumedSketchHistory(history,'source-B'),true);
 assert.equal(hasOnlyUnconsumedSketchHistory(history,'\0'),true);
});
test('multiple selected regions retain independent declared source dependencies',()=>{
 const b=selected();b.params.featureId=3;b.params.faceId='source-B';
 const history=[plane,selected(),b];
 for(const face of ['source-A','source-B'])assert.equal(hasOnlyUnconsumedSketchHistory(history,face),false);
 assert.equal(hasOnlyUnconsumedSketchHistory(history,'source-C'),true);
});
test('unknown or malformed selected histories never widen the ancestry allowlist',()=>{
 for(const change of [p=>p.version=2,p=>p.unit='inch',p=>p.engine='manifold',p=>p.engineRevision='unknown',p=>p.featureId='2',p=>p.faceId='',p=>p.faceId='a'.repeat(257),p=>p.regionId='unknown',p=>p.regionId='sketch-region:'+'a'.repeat(8192),p=>p.depth=0,p=>p.depth=Infinity,p=>p.depth='5',p=>p.bodyPolicy='join',p=>p.extra=true,p=>delete p.unit]){
  const row=selected();change(row.params);assert.equal(hasOnlyUnconsumedSketchHistory([plane,row],'source-B'),false);
 }
 for(const type of ['UNKNOWN','WORKER_SOLID_BOX_V1','WORKER_SOLID_BOOLEAN_V1']){
  const row=selected();row.type=type;assert.equal(hasOnlyUnconsumedSketchHistory([plane,row],'source-B'),false);
 }
});
test('selected ancestry reads no accessors and rejects hidden/symbol fields',()=>{
 for(const field of Object.keys(selected().params)){
  let reads=0;const row=selected();Object.defineProperty(row.params,field,{enumerable:true,get(){reads++;return 5;}});
  assert.equal(hasOnlyUnconsumedSketchHistory([plane,row],'source-B'),false);assert.equal(reads,0,field);
 }
 const hidden=selected();Object.defineProperty(hidden.params,'depth',{value:5,enumerable:false});assert.equal(hasOnlyUnconsumedSketchHistory([plane,hidden],'source-B'),false);
 const symbol=selected();symbol.params[Symbol('x')]=1;assert.equal(hasOnlyUnconsumedSketchHistory([plane,symbol],'source-B'),false);
});
