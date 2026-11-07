import {test} from 'node:test';import assert from 'node:assert/strict';import {planCenteredHole} from '../../modules/engine/mount/centeredHolePlan.mjs';
const profile=(w=100,h=50,depth=20)=>({revision:'r',sketchDigest:'a'.repeat(64),faceId:'face',regionId:'region',worldVertices:[[3,4,7],[w+3,4,7],[w+3,h+4,7],[3,h+4,7]],direction:[0,0,1],depth});
const req={version:1,unit:'millimeter',revision:'r',sketchDigest:'a'.repeat(64),faceId:'face',regionId:'region',diameter:10};
test('current centered intent tracks source dimensions and depth without mutation',()=>{let p=profile(),before=JSON.stringify(p),x=planCenteredHole(p,req),y=planCenteredHole(profile(150,30,35),req);assert.deepEqual(x.center,[53,29,7]);assert.deepEqual(y.center,[78,19,7]);assert.equal(x.expectedVolume,(5000-25*Math.PI)*20);assert.equal(y.expectedVolume,(4500-25*Math.PI)*35);assert.equal(JSON.stringify(p),before)});
test('invalid, stale, touching, ambiguous and non-XY inputs refuse',()=>{for(const r of [{...req,diameter:0},{...req,diameter:NaN},{...req,diameter:50},{...req,revision:'stale'},{...req,extra:true}])assert.throws(()=>planCenteredHole(profile(),r));for(const f of [p=>p.worldVertices[3][0]+=.01,p=>p.worldVertices[1][1]+=.1,p=>p.direction=[0,1,0],p=>p.worldVertices[0].splice(1,1),p=>p.depth=0]){let p=profile();f(p);assert.throws(()=>planCenteredHole(p,req));}});

test('unsnapped profile volume uses authored polygon rather than ideal rectangle',()=>{
 const p=profile();p.worldVertices=[[0,0,0],[100,0,0],[100,50,0],[4e-7,50,0]];
 const result=planCenteredHole(p,req),expected=(((100+99.9999996)*50/2)-Math.PI*25)*20;
 assert.ok(Math.abs(result.expectedVolume-expected)<1e-9);
 assert.ok(Math.abs(result.expectedVolume-(5000-Math.PI*25)*20)>1e-4);
 assert.throws(()=>{result.center[0]=0});
});
test('request extras and accessors are rejected without evaluating them',()=>{
 for(const key of ['hidden',Symbol('extra')]){const r={...req};Object.defineProperty(r,key,{value:1});assert.throws(()=>planCenteredHole(profile(),r));}
 let calls=0;const r={...req};Object.defineProperty(r,'diameter',{enumerable:true,get(){calls++;return 10}});
 assert.throws(()=>planCenteredHole(profile(),r));assert.equal(calls,0);
});
test('sub-precision positive hole is refused before native allocation',()=>{assert.throws(()=>planCenteredHole(profile(),{...req,diameter:Number.MIN_VALUE}),e=>e.code==='UNSUPPORTED_PROFILE')});
