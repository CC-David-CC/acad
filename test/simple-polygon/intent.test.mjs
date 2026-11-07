import test from 'node:test';
import assert from 'node:assert/strict';
import {captureSolidProfile} from '../../modules/engine/solid/solidIntent.mjs';
import {OCC_POLYGON_PROFILE_BUILD} from '../../modules/engine/mount/engineCatalog.mjs';
const make=()=>({version:1,unit:'millimeter',engine:'occ',engineRevision:OCC_POLYGON_PROFILE_BUILD.revision,featureId:7,profile:{op:'solid.profile.extrude',version:3,unit:'millimeter',frame:{origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]},depth:5,region:{id:'region:triangle',outer:[{kind:'segment',id:'a',a:[0,0],b:[20,0]},{kind:'segment',id:'b',a:[20,0],b:[0,10]},{kind:'segment',id:'c',a:[0,10],b:[0,0]}],holes:[]}}});
test('V3 retains runtime and detached source identities',()=>{
 const input=make(),value=captureSolidProfile(input);input.profile.region.outer[0].a[0]=99;input.profile.frame.origin[0]=99;
 assert.equal(value.engineRevision,OCC_POLYGON_PROFILE_BUILD.revision);assert.equal(value.featureId,7);assert.equal(value.profile.version,3);
 assert.deepEqual(value.profile.region.outer.map(c=>c.id),['a','b','c']);assert.equal(value.profile.region.outer[0].a[0],0);assert.equal(value.profile.frame.origin[0],0);
 assert.ok(Object.isFrozen(value.profile.region.outer[0].a));assert.ok(Object.isFrozen(value.profile.frame.origin));
});
test('shape handles and wrong units/versions are not authored profiles',()=>{
 const extra=make();extra.profile.handle={id:'not-authored'};assert.throws(()=>captureSolidProfile(extra),{code:'INVALID_REQUEST'});
 const unit=make();unit.profile.unit='inch';assert.throws(()=>captureSolidProfile(unit),{code:'INVALID_REQUEST'});
 const version=make();version.profile.version=4;assert.throws(()=>captureSolidProfile(version),{code:'INVALID_REQUEST'});
});
