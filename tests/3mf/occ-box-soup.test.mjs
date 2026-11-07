import {test} from 'node:test';
import assert from 'node:assert/strict';
import {indexOccAxisBox} from '../../web/app/cad/export/occBoxSoup3mf.mjs';
import {writeCore3mf} from '../../web/app/cad/export/core3mf.mjs';
function box(){const v=[[0,0,0],[1,0,0],[1,2,0],[0,2,0],[0,0,3],[1,0,3],[1,2,3],[0,2,3]],t=[[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]];return {triangles:t.map(tr=>tr.map(i=>v[i].slice()))};}
test('only exact axis box is indexed; never silently weld close points',async()=>{
 const soup=box(),mesh=indexOccAxisBox(soup,{minimumSeparation:1e-7});assert.equal(mesh.vertices.length,8);assert.equal(mesh.triangles.length,12);
 assert.ok((await writeCore3mf({unit:'millimeter',revision:'r',materials:[],objects:[{id:'box',name:'Box',...mesh}]})).length);
 const near=box();near.triangles[0][0][0]+=1e-8;assert.throws(()=>indexOccAxisBox(near,{minimumSeparation:1e-7}));
 const tiny=box();for(const t of tiny.triangles)for(const v of t)v[0]*=1e-8;assert.throws(()=>indexOccAxisBox(tiny,{minimumSeparation:1e-7}));
 const missing=box();missing.triangles.pop();assert.throws(()=>indexOccAxisBox(missing,{minimumSeparation:1e-7}));
 assert.throws(()=>indexOccAxisBox(soup,{}));
});
test('downstream writer rejects box with opposite triangle winding',async()=>{
 const soup=box();soup.triangles[0].reverse();const mesh=indexOccAxisBox(soup,{minimumSeparation:1e-7});
 await assert.rejects(writeCore3mf({unit:'millimeter',revision:'r',materials:[],objects:[{id:'box',name:'Box',...mesh}]}),/winding|open/);
});
