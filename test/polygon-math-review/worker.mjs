import {parentPort} from 'node:worker_threads';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {orientationSign,analyzeSimplePolygon as polygon,classifyPolygonPoint as locate,polygonRelation} from '../../modules/engine/extrusion/simplePolygon.mjs';
import {preparePolygonProfileExtrusion as prepare} from '../../modules/engine/mount/polygonProfilePlan.mjs';
import {prepareSelectedProfileExtrusion as v2} from '../../modules/engine/mount/selectedProfilePlan.mjs';
const fixtures=JSON.parse(readFileSync(new URL('./fixtures.json',import.meta.url),'utf8')),rows=[];
function check(name,fn){try{const result=fn();rows.push({name,status:'PASS',...(result?{result}:{})});}catch(e){rows.push({name,status:'FAIL',error:e.message,code:e.code??null});}}
const edges=(v,p='e')=>v.map((a,i)=>({kind:'segment',id:p+i,a,b:v[(i+1)%v.length]}));
const circle=(center,radius,id='c')=>[{kind:'circle',center,radius,id}];
const req=(outer,holes=[])=>({op:'solid.profile.extrude',version:3,unit:'millimeter',frame:{origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]},depth:5,region:{id:'r',outer,holes}});
check('1200 independently generated rational orientation expectations',()=>{
 for(const [i,c] of fixtures.orientations.entries())assert.equal(orientationSign(...c.points),c.expected,'orientation '+i);
 return{cases:fixtures.orientations.length};
});
for(const c of fixtures.areas)check('exact rational area: '+c.name,()=>{
 if(c.area===0){assert.throws(()=>polygon(c.vertices),{code:'UNREPRESENTABLE_AREA'});return;}
 const p=polygon(c.vertices);assert.equal(p.area,c.area,JSON.stringify({expected:c.area,actual:p.area}));assert.equal(p.winding,c.sign);
});
check('concave containment uses actual notch rather than bounding box',()=>{
 const v=[[0,0],[30,0],[30,10],[10,10],[10,30],[0,30]],p=polygon(v);
 assert.equal(locate(p,[5,25]),'inside');assert.equal(locate(p,[25,25]),'outside');
 const notch=polygon([[15,15],[20,15],[20,20],[15,20]]);
 assert.equal(polygonRelation(p,notch),'separate');
 assert.throws(()=>prepare(req(edges(v),[edges(notch.vertices,'h')])),{code:'UNSUPPORTED_REGION_TOPOLOGY'});
 assert.throws(()=>prepare(req(edges(v),[circle([20,20],2)])),{code:'UNSUPPORTED_REGION_TOPOLOGY'});
 assert.ok(Math.abs(prepare(req(edges(v),[circle([5,20],2)])).expected.volume-(500-4*Math.PI)*5)<1e-10);
});
check('mixed loop clearance measures edge interiors, not only vertices',()=>{
 const box=edges([[0,0],[10,0],[10,10],[0,10]]);
 for(const x of[1.00005,1,0.5])assert.throws(()=>prepare(req(box,[circle([x,5],1)])),{code:'UNSUPPORTED_REGION_TOPOLOGY'});
 assert.ok(prepare(req(box,[circle([1.0002,5],1)])).expected.volume>0);
 const outer=circle([0,0],10,'outer'),hole=edges([[-1,-1],[1,-1],[1,1],[-1,1]],'h');
 assert.ok(Math.abs(prepare(req(outer,[hole])).expected.volume-(100*Math.PI-4)*5)<1e-10);
});
check('winding/order/frame and native stream retain analytic geometry',()=>{
 const v=[[0,0],[20,0],[20,10],[10,10],[10,20],[0,20]],area=300;
 for(let k=0;k<v.length;k++)for(const reversed of[false,true]){
  let a=[...v.slice(k),...v.slice(0,k)];if(reversed)a.reverse();
  const r=req(edges(a));r.frame={origin:[10,20,30],x:[0,0,1],y:[1,0,0],z:[0,1,0]};
  const p=prepare(r);assert.equal(p.expected.volume,area*5);assert.deepEqual(p.expected.bounds,{min:[10,20,30],max:[30,25,50]});
  assert.equal(p.loops[0].sourceWinding,reversed?-1:1);assert.equal(p.loops[0].winding,1);
  assert.deepEqual(p.nativeValues.slice(0,14),[5,10,20,30,0,0,1,1,0,0,0,1,0,1]);
 }
});
check('capture detaches coordinates and refuses accessor or extra fields',()=>{
 const r=req(edges([[0,0],[10,0],[0,10]])),before=JSON.stringify(r),p=prepare(r);
 assert.equal(JSON.stringify(r),before);r.region.outer[0].a[0]=9;assert.equal(p.request.region.outer[0].a[0],0);
 let reads=0;const r2=req(edges([[0,0],[10,0],[0,10]]));Object.defineProperty(r2,'depth',{enumerable:true,get(){reads++;return 5;}});
 assert.throws(()=>prepare(r2),{code:'INVALID_REQUEST'});assert.equal(reads,0);
 const r3=req(edges([[0,0],[10,0],[0,10]]));r3.region.outer[0].unknown=1;assert.throws(()=>prepare(r3),{code:'INVALID_REQUEST'});
});
check('V2 remains rectangle-only; V3 loop admission is bounded',()=>{
 const r=req(edges([[0,0],[10,0],[0,10]]));assert.throws(()=>v2({...r,version:2}),{code:'UNSUPPORTED_PROFILE'});
 const v=Array.from({length:513},(_,i)=>[Math.cos(i*2*Math.PI/513),Math.sin(i*2*Math.PI/513)]);assert.throws(()=>prepare(req(edges(v))),{code:'INVALID_REQUEST'});
});
check('thin triangle observation is not a minimum-width guarantee',()=>{
 const p=prepare(req(edges([[0,0],[1000000,0],[500000,1e-12]])));
 assert.equal(p.loops[0].area,5e-7);assert.equal(p.expected.bounds.max[1],1e-12);
 return{admitted:true,altitude:1e-12,area:p.loops[0].area,nativeClaim:false};
});
parentPort.postMessage({status:rows.every(r=>r.status==='PASS')?'PASS':'FAIL',scope:'Actual Node Worker pure geometry/preparation only; no solver, native or public UI claim',rows});
