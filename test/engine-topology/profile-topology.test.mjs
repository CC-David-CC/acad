import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {extractPrismTopology} from '../../modules/engine/mount/profile-topology.mjs';
const input=JSON.parse(readFileSync(new URL('./occ-prism-sanitized.json',import.meta.url),'utf8'));
const prepared={worldVertices:[[13,16,7],[113,16,7],[113,66,7],[13,66,7]]};
const ancestry=[0,1,2,3].map(i=>({sourceEdgeId:'edge-source-'+i,faceOrdinal:i,sourceReversed:false}));
const run=x=>extractPrismTopology(x,prepared,ancestry);
test('extracts bounded local topology without native references',()=>{const x=run(structuredClone(input));assert.equal(x.version,1);assert.equal(x.vertices.length,8);assert.equal(x.edges.length,12);assert.equal(x.faces.length,6);assert.equal(x.sourceEdges.length,4);assert.ok(!/"(ptr|ref|edgeRef)"/.test(JSON.stringify(x)));});
test('rejects malformed, disconnected, ambiguous and nonlinear payloads',()=>{for(const mutate of [x=>x.faces.pop(),x=>x.faces[0].surface.normal=[0,0,0],x=>x.faces[0].loops[0][0].edgeRef=x.faces[0].loops[0][1].edgeRef,x=>x.faces[0].loops[0][0].a[0]+=0.01,x=>x.faces[0].loops[0][0].curve.cp[0][0]+=1,x=>x.faces[0].loops[0][0].inverted=false,x=>x.faces[0].tess=[],x=>x.faces[0].tess[0][0][0][1]+=5,x=>x.faces[0].loops[0][0].tess[0][0]+=1,x=>x.faces[0].surface.TYPE='UNKNOWN']){const c=structuredClone(input);mutate(c);assert.throws(()=>run(c));}});

test('rejects sparse arrays in normals, loops, curve data and tessellation',()=>{
 const mutations=[x=>delete x.faces[0].surface.normal[0],x=>delete x.faces[0].surface.origin[0],x=>delete x.faces[0].loops[0][0],x=>delete x.faces[0].loops[0][0].curveBounds[0],x=>delete x.faces[0].loops[0][0].curve.weights[0],x=>delete x.faces[0].loops[0][0].curve.cp[0],x=>delete x.faces[0].loops[0][0].tess[0],x=>delete x.faces[0].tess[0],x=>delete x.faces[0].tess[0][0][0][0]];
 for(const mutate of mutations){const c=structuredClone(input);mutate(c);assert.throws(()=>run(c));}
});
test('rejects count and serialized byte budgets',()=>{
 const tooMany=structuredClone(input);tooMany.faces[0].tess=Array.from({length:33},()=>structuredClone(input.faces[0].tess[0]));assert.throws(()=>run(tooMany));
 const large=structuredClone(input);for(const face of large.faces){face.tess=Array.from({length:32},()=>structuredClone(face.tess[0]));for(const e of face.loops[0])e.tess=Array.from({length:64},(_,i)=>e.a.map((a,j)=>a+(e.b[j]-a)*i/63));}
 assert.throws(()=>run(large),/serialized topology exceeds/);
});
