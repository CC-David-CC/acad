import {parentPort} from 'node:worker_threads';
import assert from 'node:assert/strict';
import {orientationSign,segmentRelation,analyzeSimplePolygon as polygon,classifyPolygonPoint as locate,polygonRelation} from '../../modules/engine/extrusion/simplePolygon.mjs';
import {preparePolygonProfileExtrusion as prepare} from '../../modules/engine/mount/polygonProfilePlan.mjs';
import {prepareSelectedProfileExtrusion as oldPrepare} from '../../modules/engine/mount/selectedProfilePlan.mjs';
const rows=[];
function check(name,run){run();rows.push(name);}
const rect=(x,y,w,h)=>polygon([[x,y],[x+w,y],[x+w,y+h],[x,y+h]]);
check('analytic triangle, rotated rectangle and concave L',()=>{
 assert.equal(polygon([[0,0],[3,0],[0,4]]).area,6);
 assert.equal(polygon([[0,10],[10,0],[20,10],[10,20]]).area,200);
 const p=polygon([[0,0],[10,0],[10,4],[4,4],[4,10],[0,10]]);
 assert.equal(p.area,64);assert.equal(locate(p,[2,8]),'inside');assert.equal(locate(p,[8,8]),'outside');assert.equal(locate(p,[4,8]),'boundary');
});
check('reverse, cyclic rotation and translation preserve area',()=>{
 const v=[[0,0],[10,0],[10,4],[4,4],[4,10],[0,10]];
 for(let i=0;i<v.length;i++){
  const p=[...v.slice(i),...v.slice(0,i)];assert.equal(polygon(p).area,64);
  assert.equal(polygon([...p].reverse()).winding,-1);
  assert.equal(polygon(p.map(([x,y])=>[x+900000,y-900000])).area,64);
 }
});
check('independent integer determinant oracle',()=>{
 let seed=123456789;const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return(seed%2000001)-1000000;};
 for(let i=0;i<10000;i++){
  const a=[next(),next()],b=[next(),next()],c=[next(),next()];
  const n=(BigInt(b[0])-BigInt(a[0]))*(BigInt(c[1])-BigInt(a[1]))-(BigInt(b[1])-BigInt(a[1]))*(BigInt(c[0])-BigInt(a[0]));
  assert.equal(orientationSign(a,b,c),n>0n?1:n<0n?-1:0);
 }
});
check('cancellation and subnormal orientation retain exact signs',()=>{
 const e=2**-52,a=[0,0],b=[1,1+e],c=[1-e,1];
 assert.equal(b[0]*c[1]-b[1]*c[0],0);
 assert.equal(orientationSign(a,b,c),1);assert.equal(orientationSign(a,c,b),-1);
 assert.equal(polygon([a,b,c]).area,e*e/2);
 assert.equal(orientationSign([0,0],[1e-200,0],[0,1e-200]),1);
 assert.equal(orientationSign([0,0],[Number.MIN_VALUE,0],[0,Number.MIN_VALUE]),1);
 const x=(1+2**-52)*2**-500,y=(1.125-2**-52)*2**-571;
 assert.equal(polygon([[0,0],[x,0],[0,y]]).area,5*Number.MIN_VALUE);
 const y2=(1-2**-53)*2**-574;
 assert.equal(polygon([[0,0],[x,0],[0,y2]]).area,Number.MIN_VALUE);
 assert.throws(()=>polygon([[0,0],[1e-200,0],[0,1e-200]]),{code:'UNREPRESENTABLE_AREA'});
});
check('crossing, contact, overlap and gap remain distinct',()=>{
 assert.equal(segmentRelation([0,0],[10,10],[0,10],[10,0]),'crossing');
 assert.equal(segmentRelation([0,0],[10,0],[10,0],[10,10]),'touching');
 assert.equal(segmentRelation([0,0],[10,0],[2,0],[8,0]),'overlap');
 assert.equal(segmentRelation([0,0],[10,0],[0,1e-6],[10,1e-6]),'separate');
});
check('invalid closed boundaries refuse explicitly',()=>{
 assert.throws(()=>polygon([[0,0],[0,0],[1,1]]),{code:'ZERO_LENGTH_EDGE'});
 assert.throws(()=>polygon([[0,0],[10,0],[10,0],[10,10],[0,10]]),{code:'ZERO_LENGTH_EDGE'});
 assert.throws(()=>polygon([[0,0],[10,10],[0,10],[10,0]]),{code:'SELF_INTERSECTION'});
 assert.throws(()=>polygon([[0,0],[10,0],[5,0],[5,5],[0,5]]),{code:'OVERLAPPING_EDGES'});
 assert.throws(()=>polygon([[0,0],[10,0],[10,10],[5,0],[0,10]]),{code:'SELF_TOUCHING_BOUNDARY'});
 assert.throws(()=>polygon([[0,0],[Infinity,0],[0,1]]),{code:'INVALID_PROFILE'});
 assert.throws(()=>polygon([[0,0],[,0],[0,1]]),{code:'INVALID_PROFILE'});
 assert.throws(()=>polygon([[0,0],,[0,1]]),{code:'INVALID_PROFILE'});
});
check('nested, disjoint, intersecting and touching loops',()=>{
 const a=rect(0,0,10,10),b=rect(2,2,3,3);
 assert.equal(polygonRelation(a,b),'contains');assert.equal(polygonRelation(b,a),'inside');
 assert.equal(polygonRelation(a,rect(11,0,2,2)),'separate');
 assert.equal(polygonRelation(a,rect(10+1e-6,0,2,2)),'separate');
 assert.equal(polygonRelation(a,rect(9,-1,2,2)),'intersecting');
 assert.equal(polygonRelation(a,rect(10,10,2,2)),'touching-or-overlapping-boundary');
 assert.equal(polygonRelation(a,rect(0,0,10,10)),'touching-or-overlapping-boundary');
});
check('detached input and 512-vertex boundary',()=>{
 const input=[[0,0],[3,0],[0,4]],p=polygon(input);input[1][0]=99;assert.equal(p.vertices[1][0],3);
 const n=512,v=Array.from({length:n},(_,i)=>[100*Math.cos(2*Math.PI*i/n),100*Math.sin(2*Math.PI*i/n)]),q=polygon(v);
 assert.ok(Math.abs(q.area-n*10000*Math.sin(2*Math.PI/n)/2)<1e-8);assert.equal(locate(q,[0,0]),'inside');
 assert.throws(()=>polygon([...v,v[0]]),{code:'INVALID_PROFILE'});
});
const edges=(v,prefix='e')=>v.map((a,i)=>({kind:'segment',id:prefix+i,a,b:v[(i+1)%v.length]}));
const request=(outer,holes=[])=>({op:'solid.profile.extrude',version:3,unit:'millimeter',frame:{origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]},depth:10,region:{id:'selected',outer,holes}});
check('public gap fixtures have analytic v3 preparation',()=>{
 for(const [v,area] of [ [[[0,0],[20,0],[0,10]],100], [[[10,10],[22,26],[14,32],[2,16]],200], [[[0,0],[30,0],[30,10],[10,10],[10,30],[0,30]],500] ]){
  const r=request(edges(v));assert.equal(prepare(r).expected.volume,10*area);
  assert.throws(()=>oldPrepare({...r,version:2}),{code:'UNSUPPORTED_PROFILE'});
 }
});
check('polygon and circle holes preserve region intent',()=>{
 const outer=edges([[0,0],[10,0],[10,10],[0,10]]),circle={kind:'circle',id:'c',center:[5,5],radius:2};
 assert.equal(prepare(request(outer,[[circle]])).expected.volume,(100-4*Math.PI)*10);
 const hole=edges([[2,2],[4,2],[4,4],[2,4]],'h');
 assert.equal(prepare(request(outer,[hole])).expected.volume,960);
 assert.throws(()=>prepare(request(outer,[[{...circle,center:[1,5]}]])),{code:'UNSUPPORTED_REGION_TOPOLOGY'});
 assert.throws(()=>prepare(request(outer,[hole,hole.map(c=>({...c,id:c.id+'x'}))])),{code:'UNSUPPORTED_REGION_TOPOLOGY'});
});
check('rotated frame, winding and resolution are explicit',()=>{
 const r=request(edges([[0,0],[20,0],[0,10]].reverse()));r.frame={origin:[10,20,30],x:[0,1,0],y:[-1,0,0],z:[0,0,1]};
 const p=prepare(r);assert.deepEqual(p.expected.bounds,{min:[0,20,30],max:[10,40,40]});assert.equal(p.expected.volume,1000);
 assert.equal(p.loops[0].winding,1);assert.equal(p.loops[0].sourceWinding,-1);
 assert.throws(()=>prepare(request(edges([[0,0],[10,0],[10,1e-6],[0,1e-6]]))),{code:'PROFILE_BELOW_RESOLUTION'});
 const thin=[[0,0],[1e6,0],[5e5,1e-12]];assert.equal(polygon(thin).area,5e-7);
 assert.equal(prepare(request(edges(thin))).expected.volume,5e-7*10);
});
parentPort.postMessage({status:'PASS',scope:'Actual Node Worker geometry/preparation, not public CAD/arrangement/native qualification',groups:rows.length,rows});
