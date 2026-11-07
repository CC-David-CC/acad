import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareSolvedSelectedRegion as prepare,inspectSolvedSelectedRegions as inspect} from '../../modules/engine/extrusion/selectedSketchProfile.mjs';
import {polygonProfileRegions,preparePolygonProfileExtrusion} from '../../modules/engine/mount/polygonProfilePlan.mjs';
import {circle,rectangle,polygon,triangle,rotated,lshape,regular,regionId,ids,request} from './fixtures.mjs';
const frozen=v=>!v||typeof v!=='object'||Object.isFrozen(v)&&Object.values(v).every(frozen);
const code=expected=>error=>error.code===expected;
const check=async(input,outer,holes,volume)=>{const before=JSON.stringify(input),selected=regionId(input.faceId,ids(outer),holes.map(ids)),out=await prepare({...input,regionId:selected});assert.equal(out.request.version,3);assert.equal(out.request.region.id,selected);assert.ok(Math.abs(out.expected.volume-volume)<1e-8);assert.equal(JSON.stringify(input),before);assert.equal(frozen(out),true);return out;};
test('triangle, reversed rotated quad and L source use explicit V3 without changing V2',async()=>{
 for(const [objects,volume] of [[triangle(),1500],[rotated(),1000],[lshape(),12000]]){const input=await request(objects);await check(input,objects,[],volume);const legacy={...input};delete legacy.profileVersion;await assert.rejects(inspect(legacy),code('UNSUPPORTED_PROFILE'));}
 const ordinary=rectangle('b',0,0,10,10),input=await request(ordinary),legacy={...input};delete legacy.profileVersion;const id=regionId(input.faceId,ids(ordinary));assert.equal((await prepare({...legacy,regionId:id})).request.version,2);assert.equal((await prepare({...input,regionId:id})).request.version,3);
 await assert.rejects(inspect({...input,profileVersion:2}),code('INVALID_REQUEST'));
});
test('mixed circle and polygon holes preserve exact membership and analytic volume',async()=>{
 const outer=lshape(),hole=circle('c',3,10,40),inner=polygon('h',[[40,5],[60,5],[50,15]]),input=await request([...inner,hole,...outer].reverse());
 const result=await inspect(input);assert.equal(result.regions.length,3);assert.ok(result.regions.every(r=>r.support==='supported'));await check(input,outer,[[hole],inner],(2300-9*Math.PI)*5);await check(input,[hole],[],45*Math.PI);await check(input,inner,[],500);
});
test('nested polygon/circle cells and disjoint L remain independent selectable cells',async()=>{
 const outer=rectangle('o',-50,-50,100,100),middle=circle('c',30),inner=polygon('i',[[-5,-5],[5,-5],[0,5]]),island=lshape('d',200),input=await request([...island,...inner,middle,...outer]);
 const found=await inspect(input);assert.equal(found.regions.length,4);await check(input,outer,[[middle]],(10000-900*Math.PI)*5);await check(input,[middle],[inner],(900*Math.PI-50)*5);await check(input,inner,[],250);await check(input,island,[],12000);
});
test('source regeneration preserves authored membership; changed child membership requires reselecting',async()=>{
 const outer=rotated(),first=await request(outer),oldId=regionId(first.faceId,ids(outer));const moved=JSON.parse(first.sketchJSON);for(const o of moved.objects){o.data.a.x+=100;o.data.b.x+=100;}const next=await request(moved.objects);assert.equal((await prepare({...next,regionId:oldId})).expected.volume,1000);
 const withChild=await request([...outer,circle('new',1,10,10)]);await assert.rejects(prepare({...withChild,regionId:oldId}),code('STALE_REGION'));const discovery=await inspect(withChild);assert.equal(discovery.regions.length,2);assert.ok(discovery.regions.some(r=>r.regionId===regionId(first.faceId,ids(outer),[['new']])));
});
test('XZ frame and exact source coordinates survive preparation',async()=>{
 const objects=triangle(),frame={origin:[3,4,5],x:[1,0,0],y:[0,0,1],z:[0,-1,0]},input=await request(objects,{frame});const out=await check(input,objects,[],1500);assert.deepEqual(out.expected.bounds,{min:[3,-1,5],max:[33,4,25]});assert.deepEqual(out.request.frame,frame);
});
test('gaps, crossings, touching, duplicate and unsupported ordinary curves are global explicit refusals',async()=>{
 const gap=triangle();gap[0].data.a.x=1e-8;await assert.rejects(inspect(await request(gap)),code('OPEN_OR_AMBIGUOUS_PROFILE'));
 await assert.rejects(inspect(await request(polygon('b',[[0,0],[20,20],[0,20],[20,0]]))),code('SELF_INTERSECTION'));
 await assert.rejects(inspect(await request([...rectangle('a',0,0,10,10),...rectangle('b',10,10,10,10)])),code('OPEN_OR_AMBIGUOUS_PROFILE'));
 await assert.rejects(inspect(await request([...rectangle('a',0,0,10,10),...rectangle('b',5,5,10,10)])),code('UNSUPPORTED_REGION_TOPOLOGY'));
 await assert.rejects(inspect(await request([...triangle(),circle('cross',20,10,10)])),code('UNSUPPORTED_REGION_TOPOLOGY'));
 const duplicate=triangle();duplicate.push({...structuredClone(duplicate[0]),id:'dup'});await assert.rejects(inspect(await request(duplicate)),code('OPEN_OR_AMBIGUOUS_PROFILE'));
 await assert.rejects(inspect(await request([...triangle(),{id:'arc',type:'Arc',role:null,stage:0,data:{}}])),code('UNSUPPORTED_PROFILE'));
});
test('provider resolution, source digest/frame and loop caps remain distinct',async()=>{
 await assert.rejects(inspect(await request(polygon('tiny',[[0,0],[1e-5,0],[0,1]]))),code('PROFILE_BELOW_RESOLUTION'));
 await assert.rejects(inspect(await request([...rectangle('a',0,0,10,10),...rectangle('b',10.00001,0,10,10)])),code('UNSUPPORTED_REGION_TOPOLOGY'));
 const input=await request(triangle());await assert.rejects(inspect({...input,sketchDigest:'0'.repeat(64)}),code('STALE_SKETCH'));await assert.rejects(inspect({...input,frame:{...input.frame,origin:[1,0,0]}}),code('STALE_FRAME'));
 const max=regular('p',512),r=await inspect(await request(max));assert.equal(r.regions.length,1);assert.equal(r.regions[0].support,'supported');await assert.rejects(inspect(await request(regular('p',513))),code('UNSUPPORTED_PROFILE'));
 const aggregate=[...regular('a',257),...regular('b',256)];for(const o of aggregate.filter(o=>o.id.startsWith('b'))){o.data.a.x+=1000;o.data.b.x+=1000;}await assert.rejects(inspect(await request(aggregate)),code('UNSUPPORTED_PROFILE'));
});
test('profileVersion and frame are captured before the genuine digest await',async()=>{
 const objects=triangle(),input=await request(objects),id=regionId(input.faceId,ids(objects)),original=crypto.subtle.digest;let release;const gate=new Promise(r=>release=r);
 Object.defineProperty(crypto.subtle,'digest',{configurable:true,value:async(...args)=>{const actual=original.apply(crypto.subtle,args);await gate;return actual;}});
 try{const args={...input,regionId:id},pending=prepare(args);args.profileVersion=2;args.frame.origin[0]=100;release();const out=await pending;assert.equal(out.request.version,3);assert.equal(out.request.frame.origin[0],0);assert.equal(out.expected.volume,1500);}finally{delete crypto.subtle.digest;}
});
test('shared bounded nesting returns immediate children for prepared polygon and circle loops',()=>{
 const frame={origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]},loop=curves=>preparePolygonProfileExtrusion({op:'solid.profile.extrude',version:3,unit:'millimeter',frame,depth:5,region:{id:'loop',outer:curves,holes:[]}}).loops[0];
 const segment=(id,a,b)=>({kind:'segment',id,a,b}),poly=points=>points.map((a,i)=>segment('s'+i,a,points[(i+1)%points.length]));
 const profiles=[loop(poly([[-50,-50],[50,-50],[50,50],[-50,50]])),loop([{kind:'circle',id:'c',center:[0,0],radius:30}]),loop(poly([[-5,-5],[5,-5],[0,5]]))];assert.deepEqual(polygonProfileRegions(profiles),[{outer:0,holes:[1],depth:0},{outer:1,holes:[2],depth:1},{outer:2,holes:[],depth:2}]);
});
