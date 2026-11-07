import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateFourCornerTopology as validate} from '../../modules/engine/mount/fourCornerHoleTopology.mjs';
const normal=JSON.parse(readFileSync(new URL('./fixtures/normal-lines.json',import.meta.url)));
const resized=JSON.parse(readFileSync(new URL('./fixtures/resized-lines.json',import.meta.url)));
function inputs(width,height,depth) {
 const faceId='S:0/SURFACE',ids=[0,1,2,3].map(i=>faceId+'/rect-'+i);
 const regionId='sketch-region:'+JSON.stringify({faceId,outer:[...ids].sort(),holes:[]}),sketchDigest='a'.repeat(64),points=[[0,0],[width,0],[width,height],[0,height]];
 const profile={version:2,op:'sketch.region.extrude.prepare',unit:'millimeter',engine:'occ',revision:'r',sketchDigest,faceId,regionId,frame:{origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]},depth,direction:[0,0,1],bodyPolicy:'separate',edges:points.map((p,i)=>({id:ids[i],a:{x:p[0],y:p[1]},b:{x:points[(i+1)%4][0],y:points[(i+1)%4][1]},reversed:false})),worldVertices:points.map(([x,y])=>[x,y,0])};
 const center={version:1,unit:'millimeter',revision:'r',sketchDigest,faceId,regionId,diameter:10};
 const request={version:1,unit:'millimeter',featureId:'4',parentFeatureId:'2',centerFeatureId:'3',revision:'r',sketchDigest,faceId,regionId,sideIds:{minX:ids[3],maxX:ids[1],minY:ids[0],maxY:ids[2]},offsetX:10,offsetY:10,diameter:4};return [profile,center,request];
}
const run=(data,dims)=>validate(data.result,data.center,...inputs(...dims));
test('actual original and resized native results pass independent volume and topology checks',()=>{
 for(const [fixture,dims] of [[normal,[100,50,20]],[resized,[150,30,35]]]){const result=run(fixture,dims),expected=(dims[0]*dims[1]-41*Math.PI)*dims[2];assert.ok(Math.abs(result.analyticVolume-expected)<1e-7);assert.equal(result.ancestry.tools.length,4);assert.equal(result.bounds.max[0],dims[0]);assert.equal(result.bounds.max[2],dims[2]);}
});
test('wrong geometry, winding, seam, manifold, provenance and limits fail',()=>{
 const changes=[x=>x.result.operation='wrong',x=>x.result.signedVolume++,x=>x.result.faces[6].radius++,x=>x.result.faces[3].loops[1][0].orientation=x.result.faces[3].loops[1][0].orientation==='FORWARD'?'REVERSED':'FORWARD',x=>x.result.faces[6].loops[0].pop(),x=>x.result.faces[3].loops.pop(),x=>x.result.faces[0].triangles[0][0][0]++,x=>x.result.vertices[0][0]=NaN,x=>x.result.fourCornerTools.pop(),x=>x.result.fourCornerTools[1].inputIndex=0,x=>x.result.parentFaces[3].generatedEdges.pop(),x=>x.result.faces[0].extra=true,x=>x.result.faces[0].triangles.length=4097];
 for(const [index,change] of changes.entries()){const fixture=structuredClone(normal);change(fixture);assert.throws(()=>run(fixture,[100,50,20]), `mutation ${index}`);}
});
test('rejects accessor payload without invoking it',()=>{const fixture=structuredClone(normal);let calls=0;Object.defineProperty(fixture.result.faces[0],'origin',{enumerable:true,get(){calls++;return [0,0,0]}});assert.throws(()=>run(fixture,[100,50,20]));assert.equal(calls,0);});

test('outer vertices, UV bounds and line ranges must match actual prism boundary',()=>{
 const mutations=[x=>x.vertices[0][0]+=1000,x=>x.faces[0].uv=[10,-10,20,-20],x=>{for(const f of x.faces)for(const l of f.loops)for(const e of l)if(e.type==='line')e.range=[5,-5]},x=>x.faces[0].uv[1]+=1,x=>{x.faces.find(f=>f.type==='cylinder').uv[0]+=1},x=>{const e=x.faces[0].loops[0][0];e.range=[0,19]}];
 for(const [fixture,dims] of [[normal,[100,50,20]],[resized,[150,30,35]]])for(const [i,mutate] of mutations.entries()){const x=structuredClone(fixture);mutate(x.result);assert.throws(()=>run(x,dims),`mutation ${i}`);}
});

test('native oriented line frames evaluate to both endpoints and cannot be silently shifted',()=>{
 for(const [fixture,dims] of [[normal,[100,50,20]],[resized,[150,30,35]]]) {
  for(const mutation of [e=>{e.lineOrigin[0]+=1},e=>{e.lineDirection[0]+=0.1},e=>{e.range[0]+=1;e.range[1]+=1},e=>{delete e.lineOrigin},e=>{e.orientation=e.orientation==='FORWARD'?'REVERSED':'FORWARD'}]) {
   const x=structuredClone(fixture),edge=x.result.faces.flatMap(f=>f.loops.flat()).find(e=>e.type==='line');
   mutation(edge);assert.throws(()=>run(x,dims));
  }
 }
});
test('partial cutter history is rejected',()=>{
 const x=structuredClone(normal);x.result.fourCornerTools.pop();assert.throws(()=>run(x,[100,50,20]));
 const y=structuredClone(normal);y.result.fourCornerTools[3].faces[0].modified=[];assert.throws(()=>run(y,[100,50,20]));
});
test('real partial native result and legacy line-free output are refused',()=>{
 const partial=JSON.parse(readFileSync(new URL('./fixtures/partial-lines.json',import.meta.url)));
 assert.equal(partial.result.faces.length,10);
 assert.throws(()=>run(partial,[100,50,20]));
 const legacy=JSON.parse(readFileSync(new URL('./fixtures/normal-versioned.json',import.meta.url)));
 assert.throws(()=>run(legacy,[100,50,20]));
});
