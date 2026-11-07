// Retained17 exact assertions; import closure includes current V3 +new descriptor module.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,webcrypto} from 'node:crypto';
import {mkdtemp,readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,dirname,join} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';

if(!globalThis.crypto)globalThis.crypto=webcrypto;
const repo=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
assert(process.env.CODI_SELECTED_PROFILE_CANDIDATE,'Set CODI_SELECTED_PROFILE_CANDIDATE to the candidate module.');
const bundle=await mkdtemp(join(tmpdir(),'codi-selected-profile-source-review-'));
const entry='modules/engine/extrusion/selectedSketchProfile.mjs';
const files=[entry,'modules/engine/extrusion/selectedRegionDescriptor.mjs','modules/engine/mount/polygonProfilePlan.mjs','modules/engine/extrusion/simplePolygon.mjs','modules/engine/mount/selectedProfilePlan.mjs','modules/workbenches/modeler/features/extrude/authoredRegions.mjs','modules/workbenches/modeler/features/extrude/profilePlan.mjs'],pins=[];
for(const p of files){const b=await readFile(p===entry?process.env.CODI_SELECTED_PROFILE_CANDIDATE:join(repo,p));await mkdir(dirname(join(bundle,p)),{recursive:true});await writeFile(join(bundle,p),b);pins.push({path:p,sha256:createHash('sha256').update(b).digest('hex'),bytes:b.length});}
console.log('SOURCE_PINS '+JSON.stringify(pins));
const {prepareSolvedSelectedRegion:prepare}=await import(pathToFileURL(join(bundle,entry)));
test.after(()=>rm(bundle,{recursive:true,force:true}));
const copy=x=>JSON.parse(JSON.stringify(x)),sha=s=>createHash('sha256').update(s).digest('hex');
const frame={origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]};
const circle=(id,x,y,r)=>({id,type:'Circle',role:null,stage:0,data:{c:{x,y},r}});
const segment=(id,a,b)=>({id,type:'Segment',role:null,stage:0,data:{a:{x:a[0],y:a[1]},b:{x:b[0],y:b[1]}}});
const rect=(id,x,y,w,h)=>{const p=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];return p.map((a,i)=>segment(id+i,a,p[(i+1)%4]));};
const ids=objects=>objects.map(o=>'plane/'+o.id).sort();
function request(objects,outer=objects,holes=[],other={}){
 const source={version:3,objects:copy(objects),stages:[{constraints:[],generators:[]}],metadata:{boundaryFrame:copy(other.frame||frame)},...(other.sketch||{})},sketchJSON=JSON.stringify(source);
 return {unit:'millimeter',engine:'occ',revision:'r1',sketchDigest:sha(sketchJSON),faceId:'plane',regionId:'sketch-region:'+JSON.stringify({faceId:'plane',outer:ids(outer),holes:holes.map(ids).sort((a,b)=>JSON.stringify(a)<JSON.stringify(b)?-1:1)}),frame:copy(other.frame||frame),depth:5,sketchJSON,...other.request};
}
async function refuses(r,code){await assert.rejects(prepare(r),e=>{assert.equal(e.code,code);return true;});}
const near=(a,b,t=1e-9)=>assert(Math.abs(a-b)<=t,`${a} != ${b}`);

test('all 64 edge order/direction permutations preserve exact rectangle and source',async()=>{
 const original=rect('r',1,2,10,20);
 for(let shift=0;shift<4;shift++)for(let mask=0;mask<16;mask++){
  const objects=original.slice(shift).concat(original.slice(0,shift)).map((o,i)=>mask&(1<<i)?{...o,data:{a:o.data.b,b:o.data.a}}:o),r=request(objects),before=JSON.stringify(r),out=await prepare(r);
  assert.equal(JSON.stringify(r),before);near(out.expected.volume,1000);assert.deepEqual(out.expected.bounds,{min:[1,2,0],max:[11,22,5]});
  const loop=out.request.region.outer;for(let i=0;i<4;i++)assert.deepEqual(loop[i].b,loop[(i+1)%4].a);
 }
});
test('disjoint source regions select independent volumes without joining unselected geometry',async()=>{
 const a=rect('a',0,0,10,10),b=rect('b',30,20,2,3),all=[...b,...a];
 for(const [selected,volume,bounds] of [[a,500,{min:[0,0,0],max:[10,10,5]}],[b,30,{min:[30,20,0],max:[32,23,5]}]]){const out=await prepare(request(all,selected));near(out.expected.volume,volume);assert.deepEqual(out.expected.bounds,bounds);assert.deepEqual(ids(selected),out.request.region.outer.map(c=>c.id).sort());}
});
test('three nested circles use immediate children rather than grandchildren',async()=>{
 const a=circle('a',0,0,30),b=circle('b',0,0,20),c=circle('c',0,0,10),all=[c,a,b];
 for(const [outer,holes,volume] of [[a,[[b]],2500*Math.PI],[b,[[c]],1500*Math.PI],[c,[],500*Math.PI]])near((await prepare(request(all,[outer],holes))).expected.volume,volume,1e-8);
 await refuses(request(all,[a],[[b],[c]]),'STALE_REGION');
});
test('mixed nested rectangle/circle and separate holes retain analytic areas',async()=>{
 const outer=rect('outer',-20,-20,40,40),hole=circle('h',0,0,5),island=rect('island',-1,-1,2,2),all=[...outer,hole,...island];
 near((await prepare(request(all,outer,[[hole]]))).expected.volume,(1600-25*Math.PI)*5);
 near((await prepare(request(all,[hole],[island]))).expected.volume,(25*Math.PI-4)*5);
 const h2=circle('h2',10,10,2);near((await prepare(request([...outer,hole,h2],outer,[[hole],[h2]]))).expected.volume,(1600-29*Math.PI)*5);
});
test('descriptor binds exact face, members and canonical sorted IDs; digest binds source',async()=>{
 const r=request(rect('r',0,0,10,10));
 for(const change of [x=>x.faceId='other',x=>x.regionId=x.regionId.replace('plane/r0','plane/wrong'),x=>{const d=JSON.parse(x.regionId.slice(14));d.outer.reverse();x.regionId='sketch-region:'+JSON.stringify(d);}]){const x=copy(r);change(x);await refuses(x,'STALE_REGION');}
 await refuses({...r,sketchDigest:'0'.repeat(64)},'STALE_SKETCH');
});
test('capture precedes genuine digest suspension, result is deeply frozen',async()=>{
 const original=crypto.subtle.digest.bind(crypto.subtle);let release,entered;const held=new Promise(r=>release=r),started=new Promise(r=>entered=r);
 Object.defineProperty(crypto.subtle,'digest',{configurable:true,value:async(...args)=>{const result=await original(...args);entered();await held;return result;}});
 try{const r=request(rect('r',0,0,10,10)),pending=prepare(r);await started;r.frame.origin[0]=999;r.depth=123;r.regionId='changed';r.sketchJSON='{}';release();const out=await pending;assert.deepEqual(out.request.frame.origin,[0,0,0]);assert.equal(out.request.depth,5);const check=x=>{if(x&&typeof x==='object'){assert(Object.isFrozen(x));for(const v of Object.values(x))check(v);}};check(out);}
 finally{Object.defineProperty(crypto.subtle,'digest',{configurable:true,value:original});release?.();}
});
test('extra input keys/accessors and sparse frame refuse without invoking getters',async()=>{
 const r=request(rect('r',0,0,10,10));let calls=0;await refuses({...r,extra:1},'INVALID_REQUEST');
 const getter={...r};Object.defineProperty(getter,'depth',{enumerable:true,get(){calls++;return 5;}});await refuses(getter,'INVALID_REQUEST');
 const fg=copy(r);Object.defineProperty(fg.frame.x,'0',{enumerable:true,get(){calls++;return 1;}});await refuses(fg,'INVALID_FRAME');
 const sparse=copy(r);delete sparse.frame.x[1];await refuses(sparse,'INVALID_FRAME');assert.equal(calls,0);
});
test('source metadata frame/stage/identity violations refuse',async()=>{
 const objects=rect('r',0,0,10,10),r=request(objects);r.frame.origin[0]=1;await refuses(r,'STALE_FRAME');
 await refuses(request(objects,objects,[],{sketch:{stages:[{constraints:[],generators:[{}]}]}}),'UNSUPPORTED_SKETCH');
 await refuses(request(objects,objects,[],{sketch:{stages:[]}}),'UNSUPPORTED_SKETCH');await refuses(request([...objects,copy(objects[0])],objects),'INVALID_SKETCH');
});
test('near rectangle, exact gap, duplicate and crossed unselected loop refuse',async()=>{
 const objects=rect('r',0,0,10,10),bad=copy(objects);bad[0].data.b.y=1e-8;bad[1].data.a.y=1e-8;await refuses(request(bad),'UNSUPPORTED_PROFILE');
 const gap=copy(objects);gap[0].data.b.x+=1e-9;await refuses(request(gap),'OPEN_OR_AMBIGUOUS_PROFILE');
 await refuses(request([...objects,segment('dup',[0,0],[10,0])],objects),'OPEN_OR_AMBIGUOUS_PROFILE');
 const crossed=[segment('x0',[20,0],[30,10]),segment('x1',[30,10],[20,10]),segment('x2',[20,10],[30,0]),segment('x3',[30,0],[20,0])];await refuses(request([...objects,...crossed],objects),'UNSUPPORTED_PROFILE');
});
test('touching, intersecting and coincident unselected ordinary loops are not ignored',async()=>{
 const a=circle('a',0,0,10);for(const b of [circle('b',20,0,10),circle('b',15,0,10),circle('b',0,0,10)])await refuses(request([a,b],[a]),'UNSUPPORTED_REGION_TOPOLOGY');
});
test('resolution, coordinate and depth domain boundaries remain explicit',async()=>{
 for(const r of [0,-1,1e-4,'5',null])await refuses(request([circle('a',0,0,r)]),'INVALID_PROFILE');
 near((await prepare(request(rect('r',0,0,0.00010001,1)))).expected.volume,0.00050005,1e-12);
 for(const depth of [0,-1,Infinity,1e6+1])await refuses(request(rect('r',0,0,10,10),undefined,[],{request:{depth}}),'INVALID_REQUEST');
 await refuses(request([circle('a',Infinity,0,1)]),'INVALID_PROFILE');
});
test('oblique frame bounds agree with independent eight-vertex transform',async()=>{
 const c=Math.sqrt(.5),f={origin:[7,8,9],x:[c,c,0],y:[0,0,1],z:[c,-c,0]},out=await prepare(request(rect('r',2,3,4,5),undefined,[],{frame:f})),points=[];
 for(const x of [2,6])for(const y of [3,8])for(const d of [0,5])points.push(f.origin.map((v,i)=>v+x*f.x[i]+y*f.y[i]+d*f.z[i]));
 for(let i=0;i<3;i++){near(out.expected.bounds.min[i],Math.min(...points.map(p=>p[i])));near(out.expected.bounds.max[i],Math.max(...points.map(p=>p[i])));}near(out.expected.volume,100);
});
test('128-loop boundary accepted, excess contours/objects/global identities refuse',async()=>{
 const many=Array.from({length:128},(_,i)=>circle('c'+i,i*3,0,1));near((await prepare(request(many,[many[0]]))).expected.volume,5*Math.PI);
 await refuses(request([...many,circle('extra',400,0,1)],[many[0]]),'UNSUPPORTED_PROFILE');
 const objects=Array.from({length:4097},(_,i)=>({id:'p'+i,type:'Point',stage:0,role:null,data:{x:i,y:0}}));await refuses(request(objects,[]),'UNSUPPORTED_SKETCH');
 await refuses(request([circle('a'.repeat(251),0,0,1)]),'INVALID_REQUEST');
});
test('UTF-8 source admission matches existing native candidate-storage 1MiB byte cap',async()=>{
 const objects=rect('r',0,0,10,10),r=request(objects,objects,[],{sketch:{extra:'界'.repeat(400000)}});assert(r.sketchJSON.length<1048576);assert(Buffer.byteLength(r.sketchJSON)>1048576);await refuses(r,'INVALID_REQUEST');
});
test('512 segment traversal boundary accepts 128 independent rectangles and rejects the next',async()=>{
 const loops=Array.from({length:128},(_,i)=>rect('r'+i+'-',i*3,0,1,1)),all=loops.flat();
 const out=await prepare(request(all.slice().reverse(),loops[0]));near(out.expected.volume,5);
 await refuses(request([...all,...rect('extra-',400,0,1,1)],loops[0]),'UNSUPPORTED_PROFILE');
});
test('ASCII and multibyte metadata agree at exact UTF-8 cap without source normalization',async()=>{
 const objects=rect('r',0,0,10,10),empty=request(objects,objects,[],{sketch:{extra:''}}),baseBytes=Buffer.byteLength(empty.sketchJSON),room=1048576-baseBytes;
 for(const extra of ['a'.repeat(room),'界'.repeat(Math.floor(room/3))+'a'.repeat(room%3)]){
  const r=request(objects,objects,[],{sketch:{extra}}),before=r.sketchJSON;assert.equal(Buffer.byteLength(before),1048576);await prepare(r);assert.equal(r.sketchJSON,before);
  const tooLarge=request(objects,objects,[],{sketch:{extra:extra+'a'}});await refuses(tooLarge,'INVALID_REQUEST');
 }
});
test('native full Arc stays explicit unsupported source rather than silently reauthored Circle',async()=>{
 const arc={id:'arc',type:'Arc',role:null,stage:0,data:{a:{x:10,y:0},b:{x:10,y:0},c:{x:0,y:0}}},r=request([arc]),before=r.sketchJSON;
 await refuses(r,'UNSUPPORTED_PROFILE');assert.equal(r.sketchJSON,before);
});
