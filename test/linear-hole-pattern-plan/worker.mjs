import {parentPort} from 'node:worker_threads';
import assert from 'node:assert/strict';
import {planDraftLinearHolePattern as plan,captureDraftPatternIntent as capture} from './draft-plan.mjs';
import {make} from './fixtures.mjs';
const rows=[],check=(name,fn)=>{try{const data=fn();rows.push({name,status:'PASS',...(data?{data}:{})});}catch(e){rows.push({name,status:'FAIL',error:{code:e.code||null,message:e.message,stack:e.stack}});}};
const near=(a,b,t=1e-8)=>assert(Math.abs(a-b)<=t,`${a} != ${b}`),error=(a,code)=>assert.throws(()=>plan(a),{code});
const frozen=v=>{if(v&&typeof v==='object'){assert(Object.isFrozen(v));for(const x of Object.values(v))frozen(x);}};
check('three holes INCLUDING seed yield only2 additional tools at localX+20,+40',()=>{
 const a=make(),before=JSON.stringify(a),p=plan(a);assert.equal(JSON.stringify(a),before);assert.deepEqual(p.centersLocal,[[50,25],[70,25],[90,25]]);assert.equal(p.toolProfiles.length,2);assert.deepEqual(p.toolProfiles.map(t=>t.region.outer[0].center),[[70,25],[90,25]]);assert.equal(p.radius,5);assert.equal(p.count,3);assert.deepEqual(p.axialSpan,{min:0,max:20});assert(p.toolProfiles.every(t=>t.depth===22));near(p.expectedAdditionalPrismaticRemoval,1000*Math.PI);assert.deepEqual(p.nativeWork,{status:'planned',additionalTools:2,unions:1,cuts:1,nativeResultCost:4});frozen(p);
 // Independent full-source arithmetic includes the already cut seed once.
 near(100*50*20-3*Math.PI*25*20,100000-1500*Math.PI);
 return{centers:p.centersLocal,cost:p.nativeWork.nativeResultCost,additionalRemoval:p.expectedAdditionalPrismaticRemoval};
});
check('current source150x30/depth25 recomputes seed/copies and target extent',()=>{
 const p=plan(make({width:150,height:30,depth:25}));assert.deepEqual(p.centersLocal,[[75,15],[95,15],[115,15]]);assert.deepEqual(p.axialSpan,{min:0,max:25});assert(p.toolProfiles.every(t=>t.depth===27));near(p.expectedAdditionalPrismaticRemoval,1250*Math.PI);
 const a=make({width:150,height:30,depth:25});a.targetMetrics.nativeBounds.min[2]=-4;a.targetMetrics.nativeBounds.max[2]=48;const extended=plan(a);assert.equal(extended.toolProfiles[0].depth,54);assert.equal(extended.toolProfiles[0].frame.origin[2],-5);near(extended.expectedAdditionalPrismaticRemoval,1250*Math.PI);
});
check('seed diameter edits update every copy without storing diameter in pattern intent',()=>{
 const a=make({width:150,height:30,depth:25,diameter:14}),p=plan(a);assert.equal(p.radius,7);assert(p.toolProfiles.every(t=>t.region.outer[0].radius===7));near(p.expectedAdditionalPrismaticRemoval,2450*Math.PI);assert(!Object.hasOwn(capture(a.request),'diameter'));assert(!Object.hasOwn(capture(a.request),'centersLocal'));
});
check('authored intent stores seed/count/spacing/axis and common identity, never solved copies or source duplication',()=>{
 const a=make(),p=capture(a.request);assert.deepEqual(Object.keys(p),['version','unit','engine','engineRevision','featureId','target','producerFeatureId','seedFeatureId','axis','count','spacing']);assert(Object.isFrozen(p));for(const extra of [{diameter:10},{sourceFeatureId:10},{sourceFaceId:'face'},{sourceRegionId:'region'},{tools:[]},{centersLocal:[[50,25]]},{depth:22},{handle:'native'}]){const b=make();b.request={...b.request,...extra};error(b,'INVALID_REQUEST');}
});
check('count1 is seed-only layout requiring genuine owned identity output; no fictitious zero-cost policy',()=>{
 const a=make();a.request.count=1;a.request.spacing=1000000;const p=plan(a);assert.deepEqual(p.centersLocal,[[50,25]]);assert.deepEqual(p.toolProfiles,[]);assert.equal(p.expectedAdditionalPrismaticRemoval,0);assert.deepEqual(p.nativeWork,{status:'requires-owned-identity-result',additionalTools:0,unions:0,cuts:0,nativeResultCost:null});assert.notEqual(p.nativeWork.nativeResultCost,0);
});
check('invalid counts/axes/spacing and conflicting current feature IDs refuse',()=>{
 for(const extra of [{count:0},{count:-1},{count:1.5},{count:18},{count:'3'},{count:NaN},{axis:'world-x'},{axis:'source-local-y'},{spacing:0},{spacing:-20},{spacing:Infinity},{spacing:'20'},{featureId:30},{featureId:70},{featureId:10}]){const a=make();Object.assign(a.request,extra);error(a,'INVALID_REQUEST');}
});
check('new source/seed/target/runtime binding must match exactly without aliasing original target',()=>{
 for(const [object,key,value] of [['binding','sourceFeatureId',999],['binding','sourceFaceId','other'],['binding','sourceRegionId','other'],['binding','seedFeatureId',999],['binding','producerFeatureId',20],['binding','target','original'],['binding','engineRevision','other'],['request','seedFeatureId',999]]){const a=make();a[object][key]=value;error(a,'STALE_BINDING');}
 const a=make();assert.notEqual(a.seed.target,a.request.target);const p=plan(a);assert.equal(p.seedFeatureId,30);assert.equal(a.request.producerFeatureId,70);assert.equal(a.seed.producerFeatureId,20);assert.equal(a.seed.sourceFeatureId,10);
 return{scope:'Structural captured-binding checks only; native ownership and target contains seed require evaluator proof'};
});
check('four-corner or other non-centered seeds are explicit unsupported, not silently repurposed',()=>{const a=make({kind:'four-corner-through'});error(a,'UNSUPPORTED_SEED');const b=make();b.seed.kind='blind';error(b,'INVALID_REQUEST');});
check('source-local translation and reversed source winding preserve intended +X pattern',()=>{
 const a=make({minX:-30,minY:20}),p=plan(a);assert.deepEqual(p.centersLocal,[[20,45],[40,45],[60,45]]);a.sourceProfile.region.outer=a.sourceProfile.region.outer.slice().reverse().map(e=>({...e,a:e.b,b:e.a}));assert.deepEqual(plan(a),p);
});
check('rotated translated source frame maps copies to +sourceX, never worldX',()=>{
 const frame={origin:[10,20,30],x:[0,1,0],y:[-1,0,0],z:[0,0,1]},p=plan(make({frame}));assert.deepEqual(p.centersLocal,[[50,25],[70,25],[90,25]]);
 const first=p.toolProfiles[0],c=first.region.outer[0].center,world=first.frame.origin.map((n,i)=>n+first.frame.x[i]*c[0]+first.frame.y[i]*c[1]);assert.deepEqual(world,[-15,90,29]);assert.deepEqual(first.frame.z,[0,0,1]);assert.equal(first.depth,22);
});
check('oblique frame preserves all8 actual AABB projection bounds for every copy',()=>{
 const c=Math.SQRT1_2,frame={origin:[100,200,300],x:[c,0,c],y:[0,1,0],z:[-c,0,c]},p=plan(make({frame}));near(p.axialSpan.min,-50);near(p.axialSpan.max,70);for(const t of p.toolProfiles){near(t.depth,122);near(t.frame.origin[0],100+51*c);near(t.frame.origin[2],300-51*c);}near(p.expectedAdditionalPrismaticRemoval,1000*Math.PI);
});
check('overlap/touching and source-boundary exterior copies are separate explicit failures',()=>{
 for(const spacing of [10,9,0.000001]){const a=make();a.request.spacing=spacing;error(a,'PATTERN_OVERLAP');}
 for(const spacing of [22.5,25,100]){const a=make();a.request.spacing=spacing;error(a,'PATTERN_OUTSIDE_PROFILE');}
 const a=make({width:150,diameter:21});error(a,'PATTERN_OVERLAP');
});
check('maximum perfeature count17 plans16additionaltools/32results while wholehistory budget remains external',()=>{
 const a=make({width:1000,height:50});a.request.count=17;a.request.spacing=10.5;const p=plan(a);assert.equal(p.toolProfiles.length,16);assert.equal(p.nativeWork.nativeResultCost,32);assert.equal(p.centersLocal.at(-1)[0],668);
 return{scope:'This mathematical per-feature ceiling does not reserve whole-part capacity; existing source/seed/edges consume additional results'};
});
check('actual material and mixed preexisting holes remain OPEN, not inferred from positive volume/bindings',()=>{
 const a=make(),p=plan(a);a.targetMetrics.nativeVolume=1;const q=plan(a);assert.deepEqual(q,p);
 // A positive scalar cannot reveal an existing bore on the proposed path.
 // Reference prismatic subtraction is NOT an accepted result volume oracle.
 return{scope:'Planner cannot certify target contains seed, no intersecting prior holes or constant material along cut. Runtime verification required',referenceRemoval:q.expectedAdditionalPrismaticRemoval,targetVolume:1};
});
check('original intent/profile/measurements unchanged; detached immutable derived plan survives caller edits',()=>{
 const a=make(),p=plan(a);a.request.spacing=1;a.seed.diameter=99;a.sourceProfile.frame.origin[0]=99;a.sourceProfile.region.outer[0].a[0]=99;a.binding.sourceFaceId='changed';a.targetMetrics.nativeBounds.max[2]=99;assert.deepEqual(p.centersLocal,[[50,25],[70,25],[90,25]]);assert.equal(p.radius,5);assert.equal(p.toolProfiles[0].frame.origin[0],0);frozen(p);assert.throws(()=>p.toolProfiles[0].region.outer.push({}),TypeError);
});
check('getter/extra/sparse/nonfinite data and oversized source admission preserve product guards',()=>{
 let reads=0;for(const mutate of [a=>Object.defineProperty(a.request,'count',{enumerable:true,get(){reads++;return 3}}),a=>Object.defineProperty(a.binding,'seedFeatureId',{enumerable:true,get(){reads++;return 30}}),a=>Object.defineProperty(a.seed,'diameter',{enumerable:true,get(){reads++;return 10}}),a=>Object.defineProperty(a.sourceProfile.frame.origin,'0',{enumerable:true,get(){reads++;return 0}})]){const a=make();mutate(a);error(a,'INVALID_REQUEST');}assert.equal(reads,0);
 const sparse=make();delete sparse.sourceProfile.frame.origin[0];error(sparse,'INVALID_REQUEST');const nonfinite=make();nonfinite.targetMetrics.nativeBounds.max[2]=NaN;error(nonfinite,'INVALID_REQUEST');const big=make();big.sourceProfile.region.outer=new Array(4097).fill(null);error(big,'RESOURCE_LIMIT');
});
check('source reshape/holes/seed placement failures remain product through-hole admission failures',()=>{
 const a=make();a.sourceProfile.region.outer[1].b[0]=101;error(a,'UNSUPPORTED_PROFILE');const b=make();b.seed.sourceRegionId='stale';b.binding.sourceRegionId='stale';error(b,'STALE_SOURCE');const c=make({height:10});error(c,'HOLE_OUTSIDE_PROFILE');
});
parentPort.postMessage({status:rows.every(r=>r.status==='PASS')?'PASS':'FAIL',scope:'Pure test-only layout/intent contract in actual Node Worker; no native ownership, geometry, copy identity, actual ancestor, material, public/Craft/history qualification',rows});
