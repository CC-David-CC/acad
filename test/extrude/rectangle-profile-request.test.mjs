import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {prepareRectangleExtrusion} from '../../modules/workbenches/modeler/features/extrude/rectangleProfileRequest.mjs';
const frame={origin:[3,-4,7],x:[1,0,0],y:[0,1,0],z:[0,0,1]},faceId='S:0/SURFACE';
function fixture(width=100, version=2){
 const points=[[10,20],[10+width,20],[10+width,70],[10,70]];
 const sketch={version:3,objects:points.map((p,i)=>({id:'rect-'+i,type:'Segment',role:null,stage:0,data:{a:{x:p[0],y:p[1]},b:{x:points[(i+1)%4][0],y:points[(i+1)%4][1]}}})),dimensions:[],labels:[],stages:[{constraints:[],generators:[]}],constants:'',metadata:{boundaryFrame:frame},boundary:{lines:[],arcs:[],circles:[],nurbses:[]}};
 const sketchJSON=JSON.stringify(sketch),sketchDigest=createHash('sha256').update(sketchJSON).digest('hex');
 const descriptor={faceId,outer:sketch.objects.map(o=>faceId+'/'+o.id).sort(),holes:[]};
 return {version,unit:'millimeter',engine:'occ',revision:'r1',sketchDigest,faceId,regionId:'sketch-region:'+JSON.stringify(descriptor),frame:structuredClone(frame),depth:10,sketchJSON};
}
const rehash=r=>r.sketchDigest=createHash('sha256').update(r.sketchJSON).digest('hex');
function edit(r,change){const s=JSON.parse(r.sketchJSON);change(s);r.sketchJSON=JSON.stringify(s);rehash(r);}
test('authored source identities, nonzero local/world origin and positive depth',async()=>{
 const r=fixture(),before=structuredClone(r),v=await prepareRectangleExtrusion(r);assert.deepEqual(r,before);
 assert.deepEqual(v.worldVertices,[[13,16,7],[113,16,7],[113,66,7],[13,66,7]]);assert.deepEqual(v.direction,[0,0,1]);assert.equal(v.depth,10);
 assert.deepEqual(v.edges.map(e=>e.id),[0,1,2,3].map(i=>faceId+'/rect-'+i));assert.ok(v.edges.every(e=>!e.reversed));assert.equal(v.regionId,r.regionId);assert.equal(v.sketchDigest,r.sketchDigest);
});
test('changed width recomputes actual edges and does not invent identities',async()=>{
 const v=await prepareRectangleExtrusion(fixture(150));assert.deepEqual(v.worldVertices,[[13,16,7],[163,16,7],[163,66,7],[13,66,7]]);assert.equal(v.edges[0].id,faceId+'/rect-0');
});
test('known solver-admitted driving relations retain the same rectangle profile',async()=>{
 // This is planner coverage only; actual solver admission is qualified by
 // the closed-sketch Worker and full-app tests, not by these authored hints.
 for(const typeId of ['LengthRelation','Collinear','AxisSymmetry','SignedDistanceX','SignedDistanceY','ProjectedDistance'])for(const state of ['accepted','redundant']){
  const request=fixture(),expected=await prepareRectangleExtrusion(request);
  edit(request,sketch=>{
   const objects=typeId==='LengthRelation'?['rect-0','rect-1']:typeId==='Collinear'?['construction-a','construction-b']:typeId==='AxisSymmetry'?['construction-p','construction-q','construction-axis']:typeId==='SignedDistanceY'?['rect-1:A','rect-1:B']:typeId==='ProjectedDistance'?['rect-0:A','rect-0:B','rect-0']:['rect-0:A','rect-0:B'];
   if(typeId==='Collinear')for(const [id,x]of[['construction-a',0],['construction-b',20]])sketch.objects.push({id,type:'Segment',role:'construction',stage:0,data:{a:{x,y:80},b:{x:x+10,y:80}}});
   if(typeId==='AxisSymmetry')sketch.objects.push({id:'construction-p',type:'Point',role:'construction',stage:0,data:{x:0,y:80}},{id:'construction-q',type:'Point',role:'construction',stage:0,data:{x:0,y:100}},{id:'construction-axis',type:'Segment',role:'construction',stage:0,data:{a:{x:-10,y:90},b:{x:10,y:90}}});
   sketch.stages[0].constraints.push({typeId,objects,constants:typeId==='LengthRelation'?{factor:'2',offset:'0'}:['Collinear','AxisSymmetry'].includes(typeId)?{}:{distance:typeId==='SignedDistanceY'?50:100},stage:0,admission:{version:1,state}});
  });
  const before=request.sketchJSON,result=await prepareRectangleExtrusion(request);
  assert.deepEqual(result.edges,expected.edges);assert.deepEqual(result.worldVertices,expected.worldVertices);assert.equal(request.sketchJSON,before);
 }
 for(const typeId of ['LengthRelation','Collinear','AxisSymmetry','SignedDistanceX','SignedDistanceY','ProjectedDistance']){const rejected=fixture();edit(rejected,s=>s.stages[0].constraints.push({typeId,admission:{version:1,state:'rejected'}}));await assert.rejects(prepareRectangleExtrusion(rejected),error=>error.code==='UNSUPPORTED_CONSTRAINT');}
});
test('reordered or reversed authored edges preserve identities and traversal',async()=>{
 const r=fixture();edit(r,s=>{s.objects.reverse();for(const o of s.objects)[o.data.a,o.data.b]=[o.data.b,o.data.a]});const v=await prepareRectangleExtrusion(r);assert.deepEqual(v.edges.map(e=>e.id),[0,1,2,3].map(i=>faceId+'/rect-'+i));assert.ok(v.edges.every(e=>e.reversed));
});
test('reject stale, unsupported and malformed data without modifying it',async()=>{
 const variants=[
  r=>r.sketchDigest='0'.repeat(64),r=>r.regionId=r.regionId.replace('rect-0','missing'),r=>r.faceId='other',
  r=>r.frame.origin[2]++,r=>r.frame.x=[0,1,0],r=>r.depth=0,r=>r.depth=Infinity,r=>r.unit='inch',r=>r.engine='manifold',
  r=>edit(r,s=>s.objects[0].data.b.x+=0.01),r=>edit(r,s=>s.objects[0].data.b.y+=0.001),
  r=>edit(r,s=>s.objects[0].id=s.objects[1].id),r=>edit(r,s=>s.objects[0].type='Circle'),
  r=>edit(r,s=>s.objects[0].role='construction'),r=>edit(r,s=>s.objects.pop()),
  r=>edit(r,s=>s.stages[0].constraints.push({typeId:'Horizontal',admission:{version:1,state:'rejected'}})),
  r=>edit(r,s=>s.stages[0].constraints.push({typeId:'Other',admission:{version:1,state:'accepted'}})),
  r=>edit(r,s=>s.stages[0].generators.push({})),
  r=>edit(r,s=>s.objects.push({...s.objects[0],id:'extra'})),
  r=>{const d=JSON.parse(r.regionId.slice('sketch-region:'.length));d.holes=[d.outer];r.regionId='sketch-region:'+JSON.stringify(d)},
  r=>{r.extra=true},r=>{r.sketchJSON='{bad';rehash(r)}
 ];
 for(const change of variants){const r=fixture();change(r);const before=structuredClone(r);await assert.rejects(prepareRectangleExtrusion(r));assert.deepEqual(r,before);}
});
test('unsupported engine receives a typed refusal',async()=>{const r=fixture();r.engine='manifold';await assert.rejects(prepareRectangleExtrusion(r),e=>e.code==='UNSUPPORTED_ENGINE');});
test('snapshots frame and bytes before yielding to digest',async()=>{
 const r=fixture(),promise=prepareRectangleExtrusion(r);r.frame.origin[0]=999;r.sketchJSON='changed';r.revision='later';
 const result=await promise;assert.equal(result.frame.origin[0],3);assert.equal(result.revision,'r1');assert.equal(result.worldVertices[0][0],13);
});
test('rejects accessor fields without executing them',async()=>{
 let called=0;const a=fixture();Object.defineProperty(a,'depth',{enumerable:true,get(){called++;return 10}});await assert.rejects(prepareRectangleExtrusion(a));
 const b=fixture();Object.defineProperty(b.frame.x,'0',{enumerable:true,get(){called++;return 1}});await assert.rejects(prepareRectangleExtrusion(b));assert.equal(called,0);
});

test('actual solved profile is preserved unsnapped in version 2; version 1 still rejects it',async()=>{
 const r=fixture(150),sketch=JSON.parse(readFileSync(new URL('../engine-extrude/fixtures/reversed-solver-output.json',import.meta.url),'utf8'));r.sketchJSON=JSON.stringify(sketch);rehash(r);
 const v=await prepareRectangleExtrusion(r),raw=new Map(sketch.objects.map(o=>[faceId+'/'+o.id,o.data]));
 assert.equal(v.version,2);for(const e of v.edges){const d=raw.get(e.id);assert.deepEqual(e.a,e.reversed?d.b:d.a);assert.deepEqual(e.b,e.reversed?d.a:d.b);}
 assert.ok(v.edges.some(e=>e.a.y===19.999999999999982||e.b.y===19.999999999999982));
 const legacy={...r,version:1};await assert.rejects(prepareRectangleExtrusion(legacy),e=>e.code==='OPEN_OR_AMBIGUOUS_PROFILE');
});
test('version 2 never joins a gap or accepts slant outside existing tolerance',async()=>{
 const gap=fixture();edit(gap,s=>s.objects[0].data.b.y+=1e-12);await assert.rejects(prepareRectangleExtrusion(gap),e=>e.code==='OPEN_OR_AMBIGUOUS_PROFILE');
 const slant=fixture();edit(slant,s=>{s.objects[0].data.b.y+=2e-7;s.objects[1].data.a.y+=2e-7});await assert.rejects(prepareRectangleExtrusion(slant),e=>e.code==='UNSUPPORTED_PROFILE');
});
test('version 2 preserves small and large valid coordinates',async()=>{
 const small=fixture();edit(small,s=>{const p=[[0,0],[0.001,0],[0.001,0.002],[0,0.002]];s.objects.forEach((o,i)=>{o.data.a={x:p[i][0],y:p[i][1]};o.data.b={x:p[(i+1)%4][0],y:p[(i+1)%4][1]}})});const a=await prepareRectangleExtrusion(small);assert.equal(a.edges[0].b.x,0.001);
 const large=fixture();edit(large,s=>s.objects.forEach(o=>{o.data.a.x+=9990000;o.data.b.x+=9990000}));const b=await prepareRectangleExtrusion(large);assert.equal(b.worldVertices[0][0],9990013);
});

test('mount advertises outer v1 and nested profile versions separately', async () => {
  const {operationSchemasV1}=await import('../../modules/engine/mount/inventory.mjs');
  const schema=operationSchemasV1['oci-rectangle-profile-v1'];
  assert.equal(schema.properties.version.const,1);
  assert.deepEqual(schema.properties.profile.properties.version.enum,[1,2]);
});

test('reference points and construction curves preserve the explicit rectangle region',async()=>{
 const request=fixture(),expected=await prepareRectangleExtrusion(request);
 edit(request,s=>s.objects.push(
  {id:'point',type:'Point',role:null,stage:0,data:{x:20,y:30}},
  {id:'construction-line',type:'Segment',role:'construction',stage:0,data:{a:{x:0,y:0},b:{x:120,y:80}}},
  {id:'construction-circle',type:'Circle',role:'construction',stage:0,data:{c:{x:50,y:50},r:10}}));
 const before=request.sketchJSON,actual=await prepareRectangleExtrusion(request);
 assert.deepEqual(actual.edges,expected.edges);assert.deepEqual(actual.worldVertices,expected.worldVertices);
 assert.equal(actual.regionId,expected.regionId);assert.equal(request.sketchJSON,before);
 const ordinary=fixture();edit(ordinary,s=>s.objects.push({id:'circle',type:'Circle',role:null,stage:0,data:{c:{x:50,y:50},r:10}}));
 await assert.rejects(prepareRectangleExtrusion(ordinary),e=>e.code==='UNSUPPORTED_PROFILE');
});
