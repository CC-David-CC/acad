import {cases as retained,refusals} from '../owned-loft-worker/cases.mjs';
import {request} from '../owned-loft-worker/fixtures.mjs';
const r=request('circle');r.sections[0].region.outer[0].radius=3;r.sections[1].region.outer[0].radius=4;r.correspondence.startB=Math.PI/2;
export const cases=[...retained,{name:'genuine-r3-r4-quarter-metrology-regression',request:r,expected:{volume:250*Math.PI,bounds:{min:[-4,-4,0],max:[4,4,30]}},points:[[[2,0,15],0],[[2.6,0,15],1],[[3,0,0],2]]}];
export{refusals};
