// Genuine source extraction controls using hand-authored data fixtures only.
// These do not claim sketch solving, native execution or public app acceptance.
import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareSolvedSweep} from '../../modules/engine/extrusion/selectedSketchSweep.mjs';
import {sweepSourceFixture as fixture} from './source-fixture.mjs';
test('two independently captured source frames/digests reach the same ephemeral request',async()=>{
 const input=await fixture(),result=await prepareSolvedSweep(input);
 assert.equal(result.request.source.faceId,'section');assert.equal(result.request.path.source.faceId,'spine');
 assert.equal(result.request.region.outer[0].id,'section/circle');assert.equal(result.request.path.curves[0].id,'line');
 assert.equal(result.request.source.sourceSha256,input.profile.sketchDigest);assert.equal(result.request.path.source.sourceSha256,input.path.sketchDigest);
 assert.deepEqual(result.request.path.frame,input.path.frame);assert.equal(result.binding.revision,'same-state');
});
test('both mutable sources capture before either digest suspends',async()=>{
 const input=await fixture(),pending=prepareSolvedSweep(input);input.profile.frame.origin[0]=40;input.path.frame.origin[0]=80;input.path.pathCurves[0].reversed=true;
 const result=await pending;assert.equal(result.request.frame.origin[0],0);assert.equal(result.request.path.frame.origin[0],0);assert.equal(result.request.path.curves[0].reversed,false);
});
test('different source revision or invalid region refuses instead of choosing a replacement',async()=>{
 const a=await fixture();a.path.revision='later-state';await assert.rejects(prepareSolvedSweep(a),{code:'STALE_SOURCE'});
 const b=await fixture();b.profile.regionId='sketch-region:missing';await assert.rejects(prepareSolvedSweep(b),{code:'STALE_REGION'});
});
