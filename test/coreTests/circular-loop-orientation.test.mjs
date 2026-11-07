import {test} from 'node:test';
import assert from 'node:assert/strict';
import {closedCircleOrientation} from '../../modules/engine/projection/circularLoopOrientation.mjs';
const input=()=>({axis:[0,0,1],x:[1,0,0],y:[0,1,0],planeNormal:[0,0,1],start:0,end:2*Math.PI,reversed:false});
test('oriented full circle uses its analytic frame and directed coedge',()=>{
 assert.equal(closedCircleOrientation(input()),1);
 assert.equal(closedCircleOrientation({...input(),reversed:true}),-1);
 assert.equal(closedCircleOrientation({...input(),planeNormal:[0,0,-1]}),-1);
 assert.equal(closedCircleOrientation({...input(),start:2*Math.PI,end:0}),-1);
});
test('rejects partial circles, malformed frames and ambiguous orientation',()=>{
 for(const value of [{...input(),end:Math.PI},{...input(),axis:[0,0,0]},{...input(),y:[0,-1,0]},{...input(),planeNormal:[1,0,0]},{...input(),start:NaN},{...input(),reversed:0},{...input(),x:[1,,0]}]) assert.throws(()=>closedCircleOrientation(value));
});

test('tilted circle orientation stays meaningful when face or traversal reverses',()=>{
 const q=Math.SQRT1_2;
 // This circle lies on a tilted plane, with a nonzero angular origin.
 const tilted={axis:[q,0,q],x:[0,1,0],y:[-q,0,q],planeNormal:[q,0,q],start:.375,end:.375+2*Math.PI,reversed:false};
 assert.equal(closedCircleOrientation(tilted),1);
 assert.equal(closedCircleOrientation({...tilted,reversed:true}),-1);
 assert.equal(closedCircleOrientation({...tilted,planeNormal:[-q,0,-q]}),-1);
 assert.equal(closedCircleOrientation({...tilted,planeNormal:[-q,0,-q],reversed:true}),1);
 assert.throws(()=>closedCircleOrientation({...tilted,end:tilted.start+4*Math.PI}));
 assert.throws(()=>closedCircleOrientation({...tilted,planeNormal:[q,0,q+.01]}));
});
