import test from 'node:test';import assert from 'node:assert/strict';
import {captureSelectedProfileRequest,prepareSelectedProfileExtrusion} from '../../modules/engine/mount/selectedProfilePlan.mjs';
const frame={origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]};
const circle=(id,r,c=[0,0])=>[{kind:'circle',id,center:c,radius:r}];
const rectangle=(id,x,y,w,h)=>{const p=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];return p.map((a,i)=>({kind:'segment',id:id+i,a,b:p[(i+1)%4]}));};
const request=(outer,holes=[],extra={})=>({op:'solid.profile.extrude',version:2,unit:'millimeter',frame,depth:5,region:{id:'region',outer,holes},...extra});
test('rectangle: exact copied input, volume and bounds; orientation reversal only',()=>{
 const r=request(rectangle('r',0,0,10,10)),before=JSON.stringify(r),p=prepareSelectedProfileExtrusion(r);assert.deepEqual(p.expected,{volume:500,bounds:{min:[0,0,0],max:[10,10,5]}});assert.equal(JSON.stringify(r),before);
 r.region.outer.reverse();for(const e of r.region.outer)[e.a,e.b]=[e.b,e.a];assert.deepEqual(prepareSelectedProfileExtrusion(r).expected,p.expected);
 const copied=captureSelectedProfileRequest(r);r.region.outer[0].a[0]=999;assert.notEqual(copied.region.outer[0].a[0],999);
});
test('circle, annulus and independently selected nested regions use analytic areas',()=>{
 const rings=[request(circle('outer',30),[circle('middle',20)]),request(circle('middle',20),[circle('inner',10)]),request(circle('inner',10))];
 rings.forEach((r,i)=>assert.ok(Math.abs(prepareSelectedProfileExtrusion(r).expected.volume-[2500,1500,500][i]*Math.PI)<1e-10));
 assert.deepEqual(prepareSelectedProfileExtrusion(rings[0]).expected.bounds,{min:[-30,-30,0],max:[30,30,5]});
});
test('disjoint selected rectangles remain two independent requests, never an implicit compound',()=>{
 const a=prepareSelectedProfileExtrusion(request(rectangle('a',0,0,10,10))),b=prepareSelectedProfileExtrusion(request(rectangle('b',20,0,10,10)));
 assert.equal(a.expected.volume,500);assert.equal(b.expected.volume,500);assert.deepEqual(b.expected.bounds,{min:[20,0,0],max:[30,10,5]});
});
test('arbitrary orthonormal placement; handedness and scaling refuse',()=>{
 const xz={origin:[2,3,4],x:[1,0,0],y:[0,0,1],z:[0,-1,0]};
 assert.deepEqual(prepareSelectedProfileExtrusion(request(circle('c',10),[],{frame:xz})).expected.bounds,{min:[-8,-2,-6],max:[12,3,14]});
 for(const f of[{...frame,z:[0,0,-1]},{...frame,x:[2,0,0]},{...frame,y:[1,1,0]}])assert.throws(()=>prepareSelectedProfileExtrusion(request(circle('c',1),[],{frame:f})),{code:'INVALID_FRAME'});
});
test('thin source preserved; tiny gap never repaired',()=>{
 assert.equal(prepareSelectedProfileExtrusion(request(rectangle('r',0,0,.0005,1))).expected.volume,.0025);
 const gap=request(rectangle('r',0,0,10,10));gap.region.outer[3].b=[0,.000001];assert.throws(()=>prepareSelectedProfileExtrusion(gap),{code:'OPEN_OR_AMBIGUOUS_PROFILE'});
});
test('hole domains are deliberate: outside, touching, intersecting or nested holes refuse',()=>{
 for(const holes of[[circle('h',5,[6,0])],[circle('h',5,[5,0])],[circle('h',3),circle('k',3,[2,0])],[circle('h',5),circle('k',1)]])assert.throws(()=>prepareSelectedProfileExtrusion(request(circle('o',10),holes)),{code:'UNSUPPORTED_PROFILE'});
 assert.ok(prepareSelectedProfileExtrusion(request(rectangle('o',-20,-20,40,40),[circle('h',2,[-5,0]),rectangle('k',2,-2,4,4)])));
});
test('unsupported curves and profiles are honest; malformed data never coerced',()=>{
 const triangle=[{kind:'segment',id:'a',a:[0,0],b:[10,0]},{kind:'segment',id:'b',a:[10,0],b:[0,10]},{kind:'segment',id:'c',a:[0,10],b:[0,0]}];
 assert.throws(()=>prepareSelectedProfileExtrusion(request(triangle)),{code:'UNSUPPORTED_PROFILE'});
 assert.throws(()=>prepareSelectedProfileExtrusion(request([{kind:'arc',id:'a'}])),{code:'UNSUPPORTED_PROFILE'});
 for(const patch of[{version:1},{unit:'inch'},{depth:0},{depth:Infinity},{depth:'5'},{extra:true}])assert.throws(()=>captureSelectedProfileRequest(request(circle('a',1),[],patch)),{code:'INVALID_REQUEST'});
 const duplicate=request(rectangle('a',0,0,10,10));duplicate.region.outer[1].id=duplicate.region.outer[0].id;assert.throws(()=>captureSelectedProfileRequest(duplicate),{code:'INVALID_REQUEST'});
 let called=0;const getter=request(circle('a',1));Object.defineProperty(getter,'depth',{enumerable:true,get(){called++;return 5;}});assert.throws(()=>captureSelectedProfileRequest(getter),{code:'INVALID_REQUEST'});assert.equal(called,0);
 const sparse=request(circle('a',1));sparse.frame={...frame,origin:[0,,0]};assert.throws(()=>captureSelectedProfileRequest(sparse),{code:'INVALID_REQUEST'});
});
