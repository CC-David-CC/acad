import test from 'node:test';import assert from 'node:assert/strict';
import {validateCenteredHoleIntent as validate,centeredHoleIntentFromLid} from '../../modules/engine/extrusion/centeredHoleIntent.mjs';
const faceId='S:0/SURFACE',regionId='sketch-region:'+JSON.stringify({faceId,outer:[0,1,2,3].map(i=>`${faceId}/rect-${i}`),holes:[]}),parentFeatureId='42',stable=a=>'worker-prism:1:'+JSON.stringify(a);
const valid=()=>({version:1,kind:'centered-through-hole',unit:'millimeter',featureId:'43',target:{parentFeatureId,bodyId:stable([parentFeatureId,'body']),lidFaceId:stable([parentFeatureId,'face','LID',{regionId}]),regionId},placement:{kind:'rectangle-center'},diameter:10,extent:'through-all'});
test('captures explicit centered relationship and cannot be changed by caller',()=>{const source=valid(),out=validate(source);source.target.parentFeatureId='99';source.placement.kind='fixed';assert.equal(out.target.parentFeatureId,'42');assert.equal(out.placement.kind,'rectangle-center');assert.equal(Object.isFrozen(out.target),true);assert.equal('center' in out,false)});
test('refuses fixed center, bad version, diameter, extras, accessors, and stale targets',()=>{for(const change of [x=>x.version=2,x=>x.featureId='42',x=>x.featureId='01',x=>x.unit='inch',x=>x.placement.kind='point',x=>x.placement.center=[0,0],x=>x.extent='blind',x=>x.diameter=0,x=>x.diameter=NaN,x=>x.diameter=Infinity,x=>x.target.parentFeatureId='43',x=>x.target.lidFaceId+='x',x=>Object.defineProperty(x,'diameter',{get(){throw Error('getter called')},enumerable:true})]){const x=valid();change(x);assert.throws(()=>validate(x),{code:'INVALID_HOLE_INTENT'})}});
test('refuses sparse, duplicate, reordered, foreign, holed or noncanonical regions',()=>{for(const change of [r=>delete r.outer[1],r=>r.outer[1]=r.outer[0],r=>r.outer.reverse(),r=>r.outer[1]='else/edge',r=>r.holes.push(['x'])]){const x=valid(),region=JSON.parse(x.target.regionId.slice(14));change(region);x.target.regionId='sketch-region:'+JSON.stringify(region);x.target.lidFaceId=stable([parentFeatureId,'face','LID',{regionId:x.target.regionId}]);assert.throws(()=>validate(x),{code:'INVALID_HOLE_INTENT'})}});
test('selected LID produces serializable centered intent without result coordinates or handles',()=>{
 const expected=valid(),input={featureId:'43',lidFaceId:expected.target.lidFaceId,diameter:10};
 const intent=centeredHoleIntentFromLid(input);
 assert.deepEqual(JSON.parse(JSON.stringify(intent)),expected);
 input.lidFaceId='changed';input.diameter=20;
 assert.equal(intent.diameter,10);assert.equal(Object.isFrozen(intent),true);
 assert.deepEqual(validate(JSON.parse(JSON.stringify(intent))),intent);
});
test('LID selection refuses other roles, noncanonical references and engine/process tokens',()=>{
 const input={featureId:'43',lidFaceId:valid().target.lidFaceId,diameter:10};
 for(const lidFaceId of [stable([parentFeatureId,'face','BASE',{regionId}]),stable([parentFeatureId,'body']),
  stable([parentFeatureId,'face','LID',{regionId,ordinal:2}]),'worker-prism:1: '+JSON.stringify([parentFeatureId,'face','LID',{regionId}]),
  'occ:17','worker-prism:1:null','worker-prism:1:{}',stable([parentFeatureId,'face','LID',{regionId},0])]){
  assert.throws(()=>centeredHoleIntentFromLid({...input,lidFaceId}),{code:'INVALID_HOLE_INTENT'});
 }
 assert.throws(()=>centeredHoleIntentFromLid({...input,featureId:parentFeatureId}),{code:'INVALID_HOLE_INTENT'});
 assert.throws(()=>centeredHoleIntentFromLid({...input,handle:'native'}),{code:'INVALID_HOLE_INTENT'});
 let read=false;Object.defineProperty(input,'lidFaceId',{enumerable:true,get(){read=true;return valid().target.lidFaceId;}});
 assert.throws(()=>centeredHoleIntentFromLid(input),{code:'INVALID_HOLE_INTENT'});assert.equal(read,false);
});
