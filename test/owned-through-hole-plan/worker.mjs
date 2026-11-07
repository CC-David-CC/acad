import {parentPort} from 'node:worker_threads';
import assert from 'node:assert/strict';
import {planOwnedThroughHoles as plan} from '../../modules/engine/mount/ownedThroughHolePlan.mjs';
import {capturePolygonProfileRequest} from '../../modules/engine/mount/selectedProfilePlan.mjs';
import {make,identityFrame} from './fixtures.mjs';
const rows=[],check=(name,fn)=>{try{const data=fn();rows.push({name,status:'PASS',...(data?{data}:{})});}catch(e){rows.push({name,status:'FAIL',error:{message:e.message,code:e.code??null,stack:e.stack}});}};
const near=(a,b,tolerance=1e-8)=>assert(Math.abs(a-b)<=tolerance,`${a} != ${b}`);
const error=(input,code)=>assert.throws(()=>plan(input),{code});
const setPolygon=(input,points)=>{input.sourceProfile.region.outer=points.map((a,i)=>({kind:'segment',id:'side-'+i,a:a.slice(),b:points[(i+1)%points.length].slice()}));};
const frozen=v=>{if(v&&typeof v==='object'){assert(Object.isFrozen(v));for(const x of Object.values(v))frozen(x);}};
check('centered 100x50x20 layout exact frozen contract and independent volume',()=>{
 const input=make(),before=JSON.stringify(input),p=plan(input);assert.equal(JSON.stringify(input),before);assert.deepEqual(Object.keys(p),['version','sourceRegionId','centersLocal','radius','toolProfiles','expectedRemovedVolume','axialSpan','scope']);
 assert.equal(p.scope,'rectangle-source-native-aabb-through');assert.equal(p.sourceRegionId,input.request.sourceRegionId);assert.deepEqual(p.centersLocal,[[50,25]]);assert.equal(p.radius,5);assert.deepEqual(p.axialSpan,{min:0,max:20});near(p.expectedRemovedVolume,500*Math.PI);
 const tool=p.toolProfiles[0];assert.equal(tool.depth,22);assert.deepEqual(tool.frame.origin,[0,0,-1]);assert.deepEqual(tool.region.outer,[{kind:'circle',id:'derived-through-hole:30:center:circle',center:[50,25],radius:5}]);assert.equal(tool.region.id,'derived-through-hole:30:center');assert.deepEqual(capturePolygonProfileRequest(tool),tool);frozen(p);
 assert.doesNotMatch(JSON.stringify(p),/"(?:sourceContexts|target|handle|sourceFeatureId|sourceProfile|nativeBounds)"\s*:/);return{sourceDepth:20,toolDepth:22,expectedRemovedVolume:p.expectedRemovedVolume};
});
check('four corners 100x50x20 have deterministic anchors and independent removal',()=>{
 const p=plan(make({kind:'four-corner-through'}));assert.deepEqual(p.centersLocal,[[10,10],[90,10],[90,40],[10,40]]);near(p.expectedRemovedVolume,320*Math.PI);
 assert.deepEqual(p.toolProfiles.map(x=>x.region.id),['MIN_X_MIN_Y','MAX_X_MIN_Y','MAX_X_MAX_Y','MIN_X_MAX_Y'].map(x=>'derived-through-hole:30:'+x));assert(p.toolProfiles.every(t=>t.depth===22));frozen(p);
});
check('source dimensions and depth variants 150x30x25 are recomputed',()=>{
 for(const kind of ['centered-through','four-corner-through']){const p=plan(make({width:150,height:30,depth:25,kind}));assert.deepEqual(p.axialSpan,{min:0,max:25});assert(p.toolProfiles.every(x=>x.depth===27));assert.deepEqual(p.centersLocal,kind==='centered-through'?[[75,15]]:[[10,10],[140,10],[140,20],[10,20]]);near(p.expectedRemovedVolume,(kind==='centered-through'?625:400)*Math.PI);}
});
check('source-local translation and clockwise ordering do not change anchors',()=>{
 const input=make({minX:-30,minY:20,kind:'four-corner-through'}),a=plan(input);assert.deepEqual(a.centersLocal,[[-20,30],[60,30],[60,60],[-20,60]]);
 input.sourceProfile.region.outer=input.sourceProfile.region.outer.slice().reverse().map(e=>({...e,a:e.b,b:e.a}));assert.deepEqual(plan(input),a);
});
check('translated quarter-turn world frame retains current local coordinates',()=>{
 const frame={origin:[20,30,40],x:[1,0,0],y:[0,0,1],z:[0,-1,0]},p=plan(make({frame}));assert.deepEqual(p.centersLocal,[[50,25]]);assert.deepEqual(p.axialSpan,{min:0,max:20});assert.deepEqual(p.toolProfiles[0].frame.origin,[20,31,40]);assert.deepEqual(p.toolProfiles[0].frame.z,frame.z);assert.equal(p.toolProfiles[0].depth,22);
});
check('mixed-sign rotated normal requires all eight native AABB corners',()=>{
 const c=Math.SQRT1_2,frame={origin:[100,200,300],x:[c,0,c],y:[0,1,0],z:[-c,0,c]},input=make({frame}),p=plan(input);
 // Opposite min/min and max/max corners alone both project to 10 here;
 // the full AABB envelope actually projects from -50 to 70.
 near(p.axialSpan.min,-50);near(p.axialSpan.max,70);near(p.toolProfiles[0].depth,122);near(p.toolProfiles[0].frame.origin[0],100+51*c);near(p.toolProfiles[0].frame.origin[2],300-51*c);near(p.expectedRemovedVolume,500*Math.PI);
 return{axialSpan:p.axialSpan,toolDepth:p.toolProfiles[0].depth,sourceDepth:20};
});
check('actual target axial span is independent of current source extrusion depth',()=>{
 const input=make({depth:25});input.targetMetrics.nativeBounds.min[2]=-7;input.targetMetrics.nativeBounds.max[2]=60;const p=plan(input);assert.deepEqual(p.axialSpan,{min:-7,max:60});assert.equal(p.toolProfiles[0].frame.origin[2],-8);assert.equal(p.toolProfiles[0].depth,69);near(p.expectedRemovedVolume,625*Math.PI);
});
check('positive native volume is not material/ancestry proof',()=>{
 const input=make();input.targetMetrics.nativeVolume=1;input.request.sourceFaceId='other-opaque-face';input.request.sourceFeatureId=123;const p=plan(input);near(p.expectedRemovedVolume,500*Math.PI);assert.equal(p.centersLocal[0][0],50);
 return{scope:'Runtime must authenticate source face/feature and actual material; planner does not infer them'};
});
check('offset rows and columns may reverse when all circles remain disjoint',()=>{
 const p=plan(make({width:15,height:15,kind:'four-corner-through'}));assert.deepEqual(p.centersLocal,[[10,10],[5,10],[5,5],[10,5]]);
});
check('H12 tangent boundary and exterior holes explicitly refuse',()=>{
 error(make({height:12,kind:'four-corner-through'}),'HOLE_OUTSIDE_PROFILE');error(make({height:10,diameter:10}),'HOLE_OUTSIDE_PROFILE');error(make({kind:'four-corner-through',offsetX:1}),'HOLE_OUTSIDE_PROFILE');error(make({kind:'four-corner-through',offsetY:70}),'HOLE_OUTSIDE_PROFILE');
});
check('current tool-to-tool touching, overlap and coincident rows refuse',()=>{
 error(make({height:14,kind:'four-corner-through',offsetY:9}),'HOLES_OVERLAP');error(make({height:14,kind:'four-corner-through',offsetY:9,diameter:6}),'HOLES_OVERLAP');error(make({height:20,kind:'four-corner-through'}),'HOLES_OVERLAP');error(make({kind:'four-corner-through',offsetX:50}),'HOLES_OVERLAP');
});
check('qualified profile clearance is explicit and not rounded into contact',()=>{
 error(make({height:10,diameter:9.9999}),'HOLE_OUTSIDE_PROFILE');assert.equal(plan(make({height:10,diameter:9.9996})).radius,9.9996/2);
});
check('nonrectangle, slight local skew, source holes and invalid frame refuse',()=>{
 for(const points of [[[0,0],[100,0],[101,50],[0,50]],[[0,0],[100,0],[100+1e-8,50],[0,50]],[[0,0],[100,0],[50,50]],[[0,0],[100,50],[100,0],[0,50]]]){const input=make();setPolygon(input,points);error(input,'UNSUPPORTED_PROFILE');}
 const hole=make();hole.sourceProfile.region.holes=[[{kind:'circle',id:'source-hole',center:[50,25],radius:1}]];error(hole,'UNSUPPORTED_PROFILE');
 const circle=make();circle.sourceProfile.region.outer=[{kind:'circle',id:'source-circle',center:[0,0],radius:30}];error(circle,'UNSUPPORTED_PROFILE');
 for(const frame of [{...identityFrame,x:[2,0,0]},{...identityFrame,z:[0,0,-1]}])error(make({frame}),'UNSUPPORTED_PROFILE');
});
check('stale region and invalid authored schema reject before producing tools',()=>{
 const stale=make();stale.request.sourceRegionId='stale';error(stale,'STALE_SOURCE');
 for(const change of [r=>r.diameter=0,r=>r.diameter=Infinity,r=>r.sourceFeatureId=r.featureId,r=>r.target='not-owned-body',r=>r.handle='native',r=>r.depth=22,r=>r.offsetX=10]){const input=make();change(input.request);error(input,'INVALID_REQUEST');}
 const old=make();old.sourceProfile.version=2;error(old,'INVALID_REQUEST');
});
check('exact actual metric contract rejects empty, multi, invalid and missing bounds',()=>{
 for(const change of [m=>m.valid=false,m=>m.solidCount=0,m=>m.solidCount=2,m=>m.version=1,m=>m.nativeVolume=0,m=>m.nativeBounds=null,m=>m.nativeBounds.max[2]=0]){const input=make();change(input.targetMetrics);error(input,'UNSUPPORTED_TARGET');}
 const extra=make();extra.targetMetrics.empty=false;error(extra,'INVALID_REQUEST');const missing=make();delete missing.targetMetrics.nativeVolume;error(missing,'INVALID_REQUEST');
});
check('derived tool depth and origin honor exact V3 domain bounds',()=>{
 const max=make({depth:999998});assert.equal(plan(max).toolProfiles[0].depth,1000000);error(make({depth:1000000}),'TOOL_DOMAIN');
 error(make({frame:{...identityFrame,origin:[0,0,-1000000]}}),'TOOL_DOMAIN');
 const huge=make();huge.targetMetrics.nativeBounds.min[2]=-1e308;huge.targetMetrics.nativeBounds.max[2]=1e308;error(huge,'TOOL_DOMAIN');
});
check('unrepresentable subnormal and below-resolution radii refuse tools',()=>{
 error(make({diameter:Number.MIN_VALUE}),'TOOL_DOMAIN');error(make({diameter:.0001}),'TOOL_DOMAIN');
 const tinyOffset=make({minX:999900,minY:0,kind:'four-corner-through',offsetX:Number.MIN_VALUE});error(tinyOffset,'HOLE_OUTSIDE_PROFILE');
});
check('detached immutable output and deterministic internal labels',()=>{
 const input=make({kind:'four-corner-through'}),p=plan(input),again=plan(input);assert.deepEqual(p,again);input.sourceProfile.frame.origin[0]=99;input.sourceProfile.region.outer[0].a[0]=99;input.request.offsetX=77;input.targetMetrics.nativeBounds.max[2]=99;
 assert.equal(p.centersLocal[0][0],10);assert.equal(p.toolProfiles[0].frame.origin[0],0);assert.equal(p.axialSpan.max,20);assert.throws(()=>p.toolProfiles[0].region.outer.push({}),TypeError);frozen(p);
});
check('outer/nested getters and toJSON never execute',()=>{
 let calls=0;const getter=()=>{calls++;return 1;};
 for(const mutate of [x=>Object.defineProperty(x,'request',{enumerable:true,get:getter}),x=>Object.defineProperty(x.request,'kind',{enumerable:true,get:getter}),x=>Object.defineProperty(x.sourceProfile.region.outer[0],'a',{enumerable:true,get:getter}),x=>Object.defineProperty(x.sourceProfile.frame.z,'2',{enumerable:true,get:getter}),x=>Object.defineProperty(x.targetMetrics.nativeBounds.max,'2',{enumerable:true,get:getter}),x=>x.sourceProfile.toJSON=getter]){const input=make();mutate(input);error(input,'INVALID_REQUEST');}assert.equal(calls,0);
});
check('strict dense/plain/finite snapshot and input work limits',()=>{
 for(const mutate of [x=>delete x.sourceProfile.frame.origin[0],x=>x.request[Symbol('extra')]=1,x=>x.sourceProfile.loop=x.sourceProfile,x=>Object.setPrototypeOf(x.sourceProfile.region,{custom:true}),x=>x.targetMetrics.nativeBounds.max[2]=NaN]){const input=make();mutate(input);error(input,'INVALID_REQUEST');}
 const large=make();large.sourceProfile.region.outer=new Array(4097).fill(null);error(large,'RESOURCE_LIMIT');const long=make();long.request.sourceRegionId='x'.repeat(16385);error(long,'RESOURCE_LIMIT');
});
check('whole-input capture measures UTF-8 before admitting oversized source work',()=>{
 const input=make();input.sourceProfile.region.outer=Array.from({length:1024},(_,i)=>({kind:'segment',id:('u'+i+':').padEnd(256,'\uffff'),a:[0,0],b:[1,0]}));
 const json=JSON.stringify(input);assert(json.length<524288);assert(new TextEncoder().encode(json).byteLength>524288);error(input,'RESOURCE_LIMIT');
 return{scope:'Oversized mathematical data-admission control only, not a supported rectangle'};
});
parentPort.postMessage({status:rows.every(r=>r.status==='PASS')?'PASS':'FAIL',scope:'Pure layout mathematics and strict data admission in Node Worker; no native execution, material/ancestry, runtime or public authoring qualification',rows});
