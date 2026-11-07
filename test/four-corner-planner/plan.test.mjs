import {test} from 'node:test';
import assert from 'node:assert/strict';
import {planFourCornerHoles} from '../../modules/engine/mount/fourCornerHolePlan.mjs';
const faceId='S:0/SURFACE',ids=[0,1,2,3].map(i=>faceId+'/rect-'+i),regionId='sketch-region:'+JSON.stringify({faceId,outer:[...ids].sort(),holes:[]}),digest='a'.repeat(64);
function fixture(width=100,height=50,depth=20,origin=[0,0,0],points=[[0,0],[width,0],[width,height],[0,height]]){
 const profile={version:2,op:'sketch.region.extrude.prepare',unit:'millimeter',engine:'occ',revision:'r',sketchDigest:digest,faceId,regionId,frame:{origin:[...origin],x:[1,0,0],y:[0,1,0],z:[0,0,1]},depth,direction:[0,0,1],bodyPolicy:'separate',edges:points.map((p,i)=>({id:ids[i],a:{x:p[0],y:p[1]},b:{x:points[(i+1)%4][0],y:points[(i+1)%4][1]},reversed:false})),worldVertices:points.map(p=>[origin[0]+p[0],origin[1]+p[1],origin[2]])};
 const center={version:1,unit:'millimeter',revision:'r',sketchDigest:digest,faceId,regionId,diameter:10};
 const request={version:1,unit:'millimeter',featureId:'4',parentFeatureId:'2',centerFeatureId:'3',revision:'r',sketchDigest:digest,faceId,regionId,sideIds:{minX:ids[3],maxX:ids[1],minY:ids[0],maxY:ids[2]},offsetX:10,offsetY:10,diameter:4};return {profile,center,request};
}
const run=x=>planFourCornerHoles(x.profile,x.center,x.request);
test('four authored corners track resized parent and retain side identities',()=>{
 const a=fixture(),before=JSON.stringify(a),r=run(a),s=run(fixture(150,30,35));assert.deepEqual(r.corners.map(c=>c.center),[[10,10,0],[90,10,0],[90,40,0],[10,40,0]]);assert.deepEqual(s.corners.map(c=>c.center),[[10,10,0],[140,10,0],[140,20,0],[10,20,0]]);assert.deepEqual(s.corners.map(c=>c.role),['MIN_X_MIN_Y','MAX_X_MIN_Y','MAX_X_MAX_Y','MIN_X_MAX_Y']);assert.deepEqual(s.corners.map(c=>c.sides),[{x:ids[3],y:ids[0]},{x:ids[1],y:ids[0]},{x:ids[1],y:ids[2]},{x:ids[3],y:ids[2]}]);assert.deepEqual(s.existingHole,{center:[75,15,0],radius:5});assert.ok(Math.abs(s.expectedVolume-(4500-25*Math.PI-16*Math.PI)*35)<1e-8);assert.equal(s.clearance,1e-5);assert.deepEqual(s.direction,[0,0,1]);assert.throws(()=>{s.sideIds.minX='changed'});assert.equal(JSON.stringify(a),before);assert.throws(()=>{s.corners[0].center[0]=5});assert.throws(()=>{s.corners[0].sides.x='changed'});
});
test('translated source and reordered cycle preserve physical corners and side identity',()=>{
 const a=fixture(150,30,35,[999000,-999000,123]),baseline=run(a),b=structuredClone(a);b.profile.edges.push(b.profile.edges.shift());b.profile.worldVertices.push(b.profile.worldVertices.shift());const shifted=run(b);assert.deepEqual(shifted.corners,baseline.corners);assert.deepEqual(baseline.corners[0].center,[999010,-998990,123]);assert.deepEqual(baseline.existingHole.center,[999075,-998985,123]);
});
test('unsnapped source uses actual offset supporting lines and polygon area',()=>{
 const points=[[0,0],[100,0],[100,50],[4e-7,50]],r=run(fixture(100,50,20,[0,0,0],points));assert.ok(Math.abs(r.corners[0].center[0]-(10+8e-8))<1e-9);assert.ok(Math.abs(r.corners[3].center[0]-(10+3.2e-7))<1e-9);const area=(100+99.9999996)*50/2;assert.ok(Math.abs(r.expectedVolume-(area-25*Math.PI-16*Math.PI)*20)<1e-8);assert.notEqual(r.corners[0].center[0],10);
});
test('touching and overlapping corners or existing hole fail closed',()=>{
 const touching=fixture(150,30,35);touching.request.diameter=10;assert.throws(()=>run(touching),e=>e.code==='HOLES_OVERLAP');const centerOverlap=fixture(30,30);centerOverlap.request.offsetX=13;centerOverlap.request.offsetY=13;assert.throws(()=>run(centerOverlap),e=>e.code==='HOLES_OVERLAP');for(const [key,value] of [['offsetX',2+1e-5],['offsetY',1],['offsetX',200]]){const x=fixture();x.request[key]=value;assert.throws(()=>run(x),e=>e.code==='HOLE_OUTSIDE_PROFILE');}
});
test('unsupported frames, geometry, identities, stale source and invalid dimensions refuse',()=>{
 const cases=[x=>x.request.diameter=0,x=>x.request.diameter=2e-5,x=>x.request.offsetX=Infinity,x=>x.request.offsetY=-1,x=>x.request.featureId='04',x=>x.request.centerFeatureId='2',x=>x.request.revision='stale',x=>x.center.diameter=NaN,x=>x.profile.depth=0,x=>x.profile.direction=[0,1,0],x=>x.profile.frame.x=[0,1,0],x=>{x.profile.frame.x=[1,8e-10,0];x.profile.frame.y=[8e-10,1,0]},x=>x.profile.edges[0].id=x.profile.edges[1].id,x=>x.profile.edges[0].a.x+=.01,x=>x.profile.worldVertices[3][0]+=.01,x=>x.profile.worldVertices[0].splice(1,1),x=>x.request.regionId='sketch-region:{}',x=>x.profile.engine='manifold',x=>x.request.extra=true];
 for(const change of cases){const x=fixture();change(x);assert.throws(()=>run(x));}
});
test('planner refuses accessors and extra/sparse data without executing getters',()=>{
 let calls=0;const x=fixture();Object.defineProperty(x.request,'diameter',{enumerable:true,get(){calls++;return 4}});assert.throws(()=>run(x));assert.equal(calls,0);const y=fixture();Object.defineProperty(y.profile.edges[0].a,'x',{enumerable:true,get(){calls++;return 0}});assert.throws(()=>run(y));assert.equal(calls,0);const z=fixture();Object.defineProperty(z.request,Symbol('hidden'),{value:1});assert.throws(()=>run(z));const q=fixture();q.profile.edges[0].a.extra=1;assert.throws(()=>run(q));
});

test('consumes the actual reversed-solver prepared profile without snapping',async()=>{
 const {readFile}=await import('node:fs/promises'),{createHash}=await import('node:crypto'),{prepareRectangleExtrusion}=await import('../../modules/workbenches/modeler/features/extrude/rectangleProfileRequest.mjs');
 const sketch=JSON.parse(await readFile(new URL('../engine-extrude/fixtures/reversed-solver-output.json',import.meta.url),'utf8')),sketchJSON=JSON.stringify(sketch),sketchDigest=createHash('sha256').update(sketchJSON).digest('hex'),face='S:0/SURFACE',region='sketch-region:'+JSON.stringify({faceId:face,outer:sketch.objects.map(o=>face+'/'+o.id).sort(),holes:[]}),frame=sketch.metadata.boundaryFrame;
 const p=await prepareRectangleExtrusion({version:2,unit:'millimeter',engine:'occ',revision:'actual-solved',sketchDigest,faceId:face,regionId:region,frame,depth:20,sketchJSON}),center={version:1,unit:'millimeter',revision:'actual-solved',sketchDigest,faceId:face,regionId:region,diameter:10},request={version:1,unit:'millimeter',featureId:'4',parentFeatureId:'2',centerFeatureId:'3',revision:'actual-solved',sketchDigest,faceId:face,regionId:region,sideIds:{minX:face+'/rect-3',maxX:face+'/rect-1',minY:face+'/rect-0',maxY:face+'/rect-2'},offsetX:10,offsetY:10,diameter:4},result=planFourCornerHoles(p,center,request);
 for(const [i,want] of [[23,26],[153,26],[153,56],[23,56]].entries()){assert.ok(Math.abs(result.corners[i].center[0]-want[0])<1e-8);assert.ok(Math.abs(result.corners[i].center[1]-want[1])<1e-8);}assert.deepEqual(new Set(result.corners.flatMap(c=>[c.sides.x,c.sides.y])),new Set(p.edges.map(e=>e.id)));
});
test('independent orthogonal rectangle oracle holds across bounded sizes and origins',()=>{
 for(let i=0;i<40;i++){const width=80+i*3,height=32+i*2,depth=5+i,origin=[-400000+i*100,300000-i*37,12],x=fixture(width,height,depth,origin),r=run(x),expected=[[10,10],[width-10,10],[width-10,height-10],[10,height-10]];for(let j=0;j<4;j++){assert.ok(Math.abs(r.corners[j].center[0]-origin[0]-expected[j][0])<1e-8);assert.ok(Math.abs(r.corners[j].center[1]-origin[1]-expected[j][1])<1e-8);}assert.ok(Math.abs(r.expectedVolume-(width*height-41*Math.PI)*depth)<1e-6);}
});

test('strict pairwise clearance uses the declared 1e-5 mm margin',()=>{
 const touching=fixture(100,24.00001);assert.throws(()=>run(touching),e=>e.code==='HOLES_OVERLAP');const separated=fixture(100,24.00002);assert.equal(run(separated).corners.length,4);
});
test('rejects noncanonical region and mismatched center intent before planning',()=>{
 for(const change of [x=>{const r=JSON.parse(x.request.regionId.slice('sketch-region:'.length));r.outer.reverse();x.profile.regionId=x.center.regionId=x.request.regionId='sketch-region:'+JSON.stringify(r)},x=>x.center.faceId='other',x=>x.center.revision='old',x=>x.request.featureId='9007199254740992',x=>x.request.featureId=4,x=>x.profile.extra=1,x=>x.center.extra=1]){const x=fixture();change(x);assert.throws(()=>run(x));}
});

test('rejects authored side-role swaps even when region membership is unchanged',()=>{const x=fixture(100,50,20,[0,0,0],[[0,0],[0,100],[-50,100],[-50,0]]);assert.throws(()=>run(x),e=>e.code==='STALE_SOURCE');const y=fixture();[y.request.sideIds.minX,y.request.sideIds.maxX]=[y.request.sideIds.maxX,y.request.sideIds.minX];assert.throws(()=>run(y),e=>e.code==='STALE_SOURCE')});

test('near-XY tilt or oblique through direction is refused instead of flattened',()=>{const a=fixture();a.profile.frame.x[2]=1e-11;a.profile.worldVertices[1][2]+=1e-9;assert.throws(()=>run(a),e=>e.code==='UNSUPPORTED_PROFILE');const b=fixture();b.profile.direction=[1e-11,0,1];assert.throws(()=>run(b),e=>e.code==='UNSUPPORTED_PROFILE')});
