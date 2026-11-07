import {test} from 'node:test';import assert from 'node:assert/strict';
import {deriveAuthoredRegions,resolveAuthoredRegions} from '../../modules/workbenches/modeler/features/extrude/authoredRegions.mjs';
const c=(x,y,r)=>({kind:'circle',x,y,r}), face='face/17', contours=[['outer-B','outer-A'],['inner']],profiles=[c(0,0,15),c(0,0,5)];
test('each bounded region has authored boundary identity, not index or winding',()=>{
 const regions=deriveAuthoredRegions(face,contours,profiles);
 assert.deepEqual(regions,[{faceId:face,outer:['outer-A','outer-B'],holes:[['inner']]},{faceId:face,outer:['inner'],holes:[]}]);
 const reordered=deriveAuthoredRegions(face,[['inner'],['outer-A','outer-B']],[profiles[1],profiles[0]]);
 assert.deepEqual(reordered,[regions[1],regions[0]]);
 assert.deepEqual(resolveAuthoredRegions(face,[['inner'],['outer-A','outer-B']],[profiles[1],profiles[0]],[regions[0]],'separate').regions[0].index,1);
});
test('annulus, disk and both require explicit selection and body policy',()=>{
 const [annulus,disk]=deriveAuthoredRegions(face,contours,profiles);
 assert.equal(resolveAuthoredRegions(face,contours,profiles,[annulus],'separate').regions.length,1);
 assert.equal(resolveAuthoredRegions(face,contours,profiles,[disk],'separate').regions[0].index,1);
 assert.equal(resolveAuthoredRegions(face,contours,profiles,[annulus,disk],'union').bodyPolicy,'union');
 for(const [selected,policy] of [[[], 'union'],[[annulus,annulus],'union'],[[annulus],undefined]])assert.throws(()=>resolveAuthoredRegions(face,contours,profiles,selected,policy));
});
test('edits preserve identity only while the authored boundary and child set still agree',()=>{
 const [annulus]=deriveAuthoredRegions(face,contours,profiles);
 assert.doesNotThrow(()=>resolveAuthoredRegions(face,contours,[c(0,0,20),c(1,0,5)],[annulus],'separate'));
 assert.throws(()=>resolveAuthoredRegions(face,contours,[c(0,0,20),c(40,0,5)],[annulus],'separate'),/changed/);
 assert.throws(()=>resolveAuthoredRegions(face,[['outer-A','replacement'],['inner']],profiles,[annulus],'separate'),/changed/);
 assert.throws(()=>resolveAuthoredRegions('other-face',contours,profiles,[annulus],'separate'),/changed/);
 assert.throws(()=>deriveAuthoredRegions(face,[['same'],['same']],profiles),/Ambiguous/);
});
