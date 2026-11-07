import test from 'node:test';import assert from 'node:assert/strict';
import {inspectSolvedSelectedRegions as inspect,prepareSolvedSelectedRegion as prepare} from '../../modules/engine/extrusion/selectedSketchProfile.mjs';
import {frame,circle,rectangle,request,regionId,ids,holeLimitFixture} from './fixtures.mjs';
const frozen=o=>{if(o&&typeof o==='object'){assert.ok(Object.isFrozen(o));Object.values(o).forEach(frozen);}};
const row=(result,id)=>{const value=result.regions.find(r=>r.regionId===id);assert.ok(value,'Expected exact authored region identity');assert.deepEqual(Object.keys(value).sort(),['reason','regionId','support']);return value;};
const binding=(out,input)=>assert.deepEqual(out.binding,{revision:input.revision,sketchDigest:input.sketchDigest,faceId:input.faceId});
async function sameExecution(input,out){for(const r of out.regions){if(r.support==='supported'){assert.equal(r.reason,null);frozen(await prepare({...input,regionId:r.regionId}));}else{assert.equal(r.support,'unsupported');assert.equal(typeof r.reason.code,'string');assert.equal(typeof r.reason.message,'string');await assert.rejects(prepare({...input,regionId:r.regionId}),e=>e.code===r.reason.code&&e.message===r.reason.message);}}}
test('disjoint rectangles and three nested circles expose exact membership, matching execution',async()=>{
 for(const objects of[[...rectangle('a',0,0,10,10),...rectangle('b',20,0,2,3)],[circle('outer',30),circle('middle',20),circle('inner',10)]]){
  const input=await request(objects),before=JSON.stringify(input),out=await inspect(input);binding(out,input);frozen(out);assert.equal(out.regions.length,objects.length===3?3:2);assert.ok(out.regions.every(r=>r.support==='supported'));await sameExecution(input,out);assert.equal(JSON.stringify(input),before);
  if(objects.length===3){for(const [a,h]of[['outer',[['middle']]],['middle',[['inner']]],['inner',[]]])assert.equal(row(out,regionId('plane',[a],h)).support,'supported');}
  else for(const [name,volume]of[['a',500],['b',30]])assert.equal((await prepare({...input,regionId:regionId('plane',ids(objects.filter(o=>o.id.startsWith(name))))})).expected.volume,volume);
 }
});
test('mixed nested rectangle/circle islands and separate holes preserve the complete hierarchy',async()=>{
 const outer=rectangle('outer',-20,-20,40,40),middle=circle('middle',5),island=rectangle('island',-1,-1,2,2),separate=circle('separate',2,10,10),input=await request([...outer,middle,...island,separate]),out=await inspect(input);
 for(const [boundary,holes]of[[ids(outer),[['middle'],['separate']]],[['middle'],[ids(island)]],[ids(island),[]],[['separate'],[]]])assert.equal(row(out,regionId('plane',boundary,holes)).support,'supported');
 assert.equal(out.regions.length,4);await sameExecution(input,out);
});
test('nine-hole outer region is unsupported without dropping nine supported child disks',async()=>{
 const input=await request(holeLimitFixture()),before=JSON.stringify(input),out=await inspect(input),outer=regionId('plane',[0,1,2,3].map(i=>'outer'+i),Array.from({length:9},(_,i)=>['hole'+i]));
 assert.equal(out.regions.length,10);assert.equal(row(out,outer).support,'unsupported');assert.equal(row(out,outer).reason.code,'INVALID_REQUEST');assert.equal(out.regions.filter(r=>r.support==='supported').length,9);await sameExecution(input,out);assert.equal(JSON.stringify(input),before);
});
test('selected curve-count cap is local to the outer region',async()=>{
 const outer=rectangle('outer',0,0,100,100),holes=Array.from({length:6},(_,i)=>rectangle('hole'+i+'-',5+12*i,5,2,2)),input=await request([...outer,...holes.flat()]),out=await inspect(input);
 assert.equal(out.regions.length,7);assert.equal(row(out,regionId('plane',ids(outer),holes.map(ids))).support,'unsupported');assert.equal(out.regions.filter(r=>r.support==='supported').length,6);await sameExecution(input,out);
});
test('oversized region identity remains local; qualified global curve-ID cap is unchanged',async()=>{
 const outer=circle('o'.repeat(248),100),holes=Array.from({length:8},(_,i)=>rectangle('h'.repeat(244)+i+'-',-60+(i%4)*35,-25+Math.floor(i/4)*35,2,2)),input=await request([outer,...holes.flat()]),out=await inspect(input),large=regionId('plane',[outer.id],holes.map(ids));
 assert.ok(large.length>8192);assert.equal(row(out,large).support,'unsupported');assert.equal(row(out,large).reason.message,'Expected bounded current source and region identities.');assert.equal(out.regions.filter(r=>r.support==='supported').length,8);await sameExecution(input,out);
 const global=await request([circle('a'.repeat(251),1),circle('short',1,10,0)]);await assert.rejects(inspect(global),{code:'INVALID_REQUEST'});await assert.rejects(prepare({...global,regionId:regionId('plane',['short'])}),{code:'INVALID_REQUEST'});
});
test('regeneration changes only canonical affected membership; discovery never substitutes an old selection',async()=>{
 const original=await request([circle('outer',30),circle('middle',20),circle('inner',10)]),first=await inspect(original),moved=await request([circle('inner',10,100),circle('middle',20),circle('outer',30)]),second=await inspect(moved),oldMiddle=regionId('plane',['middle'],[['inner']]);
 assert.equal(row(first,oldMiddle).support,'supported');assert.ok(!second.regions.some(r=>r.regionId===oldMiddle));assert.equal(row(second,regionId('plane',['middle'])).support,'supported');await assert.rejects(prepare({...moved,regionId:oldMiddle}),{code:'STALE_REGION'});
 const reordered=await inspect(await request([circle('inner',10),circle('outer',30),circle('middle',20)]));assert.deepEqual(reordered.regions.map(r=>r.regionId).sort(),first.regions.map(r=>r.regionId).sort());assert.notEqual(first.binding.sketchDigest,reordered.binding.sketchDigest);
});
test('one genuine digest captures bytes/frame/depth before suspension and returns detached frozen data',async()=>{
 const input=await request(holeLimitFixture()),descriptor=Object.getOwnPropertyDescriptor(crypto.subtle,'digest'),native=crypto.subtle.digest;let count=0,release,started;const held=new Promise(r=>release=r),entered=new Promise(r=>started=r);
 Object.defineProperty(crypto.subtle,'digest',{configurable:true,value:async(...args)=>{count++;const result=await native.apply(crypto.subtle,args);started();await held;return result;}});
 try{const pending=inspect(input);await entered;input.frame.origin[0]=99;input.depth=0;input.sketchJSON='{}';input.revision='changed';release();const out=await pending;assert.equal(count,1);assert.equal(out.binding.revision,'current');assert.equal(out.regions.filter(r=>r.support==='supported').length,9);frozen(out);assert.deepEqual(JSON.parse(JSON.stringify(out)),out);assert.throws(()=>{out.regions[0].support='changed';},TypeError);}
 finally{if(descriptor)Object.defineProperty(crypto.subtle,'digest',descriptor);else delete crypto.subtle.digest;release?.();}
});
test('source, digest, frame, engine and geometric-topology failures remain distinct global refusals',async()=>{
 const input=await request([circle('c',10)]);for(const [change,code]of[[{engine:'manifold'},'UNSUPPORTED_ENGINE'],[{sketchDigest:'0'.repeat(64)},'STALE_SKETCH'],[{frame:{...frame,origin:[1,0,0]}},'STALE_FRAME'],[{depth:0},'INVALID_REQUEST'],[{sketchJSON:'{'},'STALE_SKETCH']])await assert.rejects(inspect({...input,...change}),{code});
 const broken='{',digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(broken)),brokenHash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');await assert.rejects(inspect({...input,sketchJSON:broken,sketchDigest:brokenHash}),{code:'INVALID_SKETCH'});
 await assert.rejects(inspect(await request([circle('duplicate',10),circle('duplicate',2)])),{code:'INVALID_SKETCH'});await assert.rejects(inspect(await request([circle('c',10)],{source:{stages:[]}})),{code:'UNSUPPORTED_SKETCH'});
 const arc={id:'arc',type:'Arc',role:null,stage:0,data:{a:{x:10,y:0},b:{x:10,y:0},c:{x:0,y:0}}};await assert.rejects(inspect(await request([arc])),{code:'UNSUPPORTED_PROFILE'});
 for(const objects of[[circle('a',10),circle('b',10,20)],[circle('a',10),circle('b',10,15)]])await assert.rejects(inspect(await request(objects)),{code:'UNSUPPORTED_REGION_TOPOLOGY'});
 // Native JSON has independent endpoint records. structuredClone preserves
 // the fixture's JS aliases, moving both neighbors and producing a skewed
 // closed contour instead of the intended single-endpoint gap.
 const gap=JSON.parse(JSON.stringify(rectangle('r',0,0,10,10)));gap[0].data.a.x+=1e-9;await assert.rejects(inspect(await request(gap)),{code:'OPEN_OR_AMBIGUOUS_PROFILE'});
});
test('accessors/extra fields/sparse frames refuse without reading getters and without source mutation',async()=>{
 const input=await request([circle('c',10)]),before=JSON.stringify(input);let reads=0;const getter={...input};Object.defineProperty(getter,'depth',{enumerable:true,get(){reads++;return 5;}});await assert.rejects(inspect(getter),{code:'INVALID_REQUEST'});
 const coordinate=structuredClone(input);Object.defineProperty(coordinate.frame.x,'0',{enumerable:true,get(){reads++;return 1;}});await assert.rejects(inspect(coordinate),{code:'INVALID_FRAME'});const sparse=structuredClone(input);delete sparse.frame.x[1];await assert.rejects(inspect(sparse),{code:'INVALID_FRAME'});await assert.rejects(inspect({...input,regionId:'extra'}),{code:'INVALID_REQUEST'});assert.equal(reads,0);assert.equal(JSON.stringify(input),before);
});
test('UTF-8 cap and opaque escaped/multibyte identities preserve exact source bytes',async()=>{
 const objects=[circle('e\u0301"/\\',2),circle('é__proto__',2,10)],input=await request(objects,{source:{note:'界 🌎'}}),before=input.sketchJSON,out=await inspect(input);assert.equal(out.regions.length,2);assert.equal(new Set(out.regions.map(r=>r.regionId)).size,2);await sameExecution(input,out);assert.equal(input.sketchJSON,before);
 const tooLarge=await request([circle('c',1)],{source:{extra:'界'.repeat(400000)}});assert.ok(tooLarge.sketchJSON.length<1048576);assert.ok(new TextEncoder().encode(tooLarge.sketchJSON).byteLength>1048576);await assert.rejects(inspect(tooLarge),{code:'INVALID_REQUEST'});
 const base=await request([circle('c',1)],{source:{extra:''}}),space=1048576-new TextEncoder().encode(base.sketchJSON).byteLength,exact=await request([circle('c',1)],{source:{extra:'界'.repeat(Math.floor(space/3))+'a'.repeat(space%3)}});assert.equal(new TextEncoder().encode(exact.sketchJSON).byteLength,1048576);assert.equal((await inspect(exact)).regions[0].support,'supported');
});
test('128 qualified loops remain bounded; construction and point data do not invent regions or solver proof',async()=>{
 const circles=Array.from({length:128},(_,i)=>circle('c'+i,1,3*i)),input=await request(circles),out=await inspect(input);assert.equal(out.regions.length,128);assert.ok(out.regions.every(r=>r.support==='supported'));await assert.rejects(inspect(await request([...circles,circle('extra',1,500)])),{code:'UNSUPPORTED_PROFILE'});
 const geometryOnly=await request([circle('c',10),{id:'ref',type:'Arc',stage:0,role:'construction',data:{}},{id:'point',type:'Point',stage:0,role:null,data:{x:0,y:0}}],{source:{stages:[{constraints:[{typeId:'unadmitted-placeholder'}],generators:[]}]}}),result=await inspect(geometryOnly);assert.equal(result.regions.length,1);assert.equal(result.regions[0].support,'supported');assert.deepEqual(Object.keys(result).sort(),['binding','regions']);
});
