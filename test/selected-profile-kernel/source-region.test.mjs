// Pure geometry-preparation controls, with explicit native source fixtures.
// These do not claim solver admission, public authoring or signed persistence.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {prepareSolvedSelectedRegion} from '../../modules/engine/extrusion/selectedSketchProfile.mjs';
const frame={origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]},faceId='plane';
const circle=(id,r,x=0,y=0)=>({id,type:'Circle',role:null,stage:0,data:{c:{x,y},r}});
const rectangle=(id,x,y,w,h)=>{
 const p=[{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}];
 return p.map((a,i)=>({id:id+i,type:'Segment',role:null,stage:0,data:i%2?{a:p[(i+1)%4],b:a}:{a,b:p[(i+1)%4]}}));
};
const region=(outer,holes=[])=>'sketch-region:'+JSON.stringify({faceId,outer:outer.map(id=>faceId+'/'+id).sort(),holes:holes.map(ids=>ids.map(id=>faceId+'/'+id).sort()).sort((a,b)=>JSON.stringify(a)<JSON.stringify(b)?-1:1)});
const request=(objects,regionId,overrides={})=>{
 const f=overrides.frame||structuredClone(frame),sketchJSON=JSON.stringify({version:3,objects,stages:[{constraints:[],generators:[]}],metadata:{boundaryFrame:f}});
 return{unit:'millimeter',engine:'occ',revision:'current',sketchDigest:createHash('sha256').update(sketchJSON).digest('hex'),faceId,regionId,frame:f,depth:5,sketchJSON,...overrides};
};
const ids=(prefix)=>[0,1,2,3].map(i=>prefix+i);

test('disjoint exact source loops select independently without rewriting source',async()=>{
 const objects=[...rectangle('a',0,0,10,10),...rectangle('b',20,0,10,10)].reverse();
 for(const prefix of ['a','b']){
  const input=request(objects,region(ids(prefix))),before=JSON.stringify(input),result=await prepareSolvedSelectedRegion(input);
  assert.equal(JSON.stringify(input),before);assert.equal(result.expected.volume,500);
  assert.deepEqual(result.expected.bounds,{min:[prefix==='a'?0:20,0,0],max:[prefix==='a'?10:30,10,5]});
  assert.deepEqual(result.request.region.outer.map(c=>c.id).sort(),ids(prefix).map(id=>'plane/'+id));
  assert.equal(result.request.region.holes.length,0);assert.ok(Object.isFrozen(result.request.region.outer[0].a));
 }
});

test('three nested circles keep distinct selectable annuli and disk',async()=>{
 const objects=[circle('outer',30),circle('middle',20),circle('inner',10)];
 for(const [name,holes,area]of[['outer',[['middle']],500*Math.PI],['middle',[['inner']],300*Math.PI],['inner',[],100*Math.PI]]){
  const result=await prepareSolvedSelectedRegion(request(objects,region([name],holes)));
  assert.ok(Math.abs(result.expected.volume-area*5)<1e-9);
  assert.deepEqual(result.request.region.holes.map(loop=>loop.map(c=>c.id)),holes.map(loop=>loop.map(id=>'plane/'+id)));
 }
 await assert.rejects(prepareSolvedSelectedRegion(request(objects,region(['outer'],[['inner']]))),{code:'STALE_REGION'});
});

test('mixed holes, exact thin coordinates and XZ/oblique placement survive preparation',async()=>{
 const mixed=request([...rectangle('outer',0,0,40,40),circle('hole',2,10,10),...rectangle('square',20,20,4,4)],region(ids('outer'),[['hole'],ids('square')]));
 assert.ok(Math.abs((await prepareSolvedSelectedRegion(mixed)).expected.volume-(1600-4*Math.PI-16)*5)<1e-9);
 const thin=await prepareSolvedSelectedRegion(request(rectangle('thin',0,0,.0005,1),region(ids('thin'))));
 assert.equal(thin.expected.volume,.0025);assert.equal(thin.expected.bounds.max[0],.0005);
 const xz={origin:[1,2,3],x:[1,0,0],y:[0,0,1],z:[0,-1,0]};
 assert.deepEqual((await prepareSolvedSelectedRegion(request(rectangle('r',0,0,10,10),region(ids('r')),{frame:xz}))).expected.bounds,{min:[1,-3,3],max:[11,2,13]});
 const s=Math.SQRT1_2,f={origin:[1,2,3],x:[s,s,0],y:[-s,s,0],z:[0,0,1]};
 const result=await prepareSolvedSelectedRegion(request([circle('c',10)],region(['c']),{frame:f}));
 for(const [side,wanted]of [['min',[-9,-8,3]],['max',[11,12,8]]])for(let i=0;i<3;i++)assert.ok(Math.abs(result.expected.bounds[side][i]-wanted[i])<1e-12);
});

test('gaps, duplicate/touching boundaries and unsupported ordinary curves refuse explicitly',async()=>{
 // Native JSON has independent endpoint records. Detach the fixture's shared
 // JS point references before moving just one endpoint to create a true gap.
 const gapped=JSON.parse(JSON.stringify(rectangle('gap',0,0,10,10)));gapped[0].data.a.x+=1e-6;
 await assert.rejects(prepareSolvedSelectedRegion(request(gapped,region(ids('gap')))),{code:'OPEN_OR_AMBIGUOUS_PROFILE'});
 const ordinary=rectangle('r',0,0,10,10);
 await assert.rejects(prepareSolvedSelectedRegion(request([...ordinary,{...ordinary[0],id:'duplicate'}],region(ids('r')))),{code:'OPEN_OR_AMBIGUOUS_PROFILE'});
 await assert.rejects(prepareSolvedSelectedRegion(request([circle('a',10),circle('b',10,20)],region(['a']))),{code:'UNSUPPORTED_REGION_TOPOLOGY'});
 await assert.rejects(prepareSolvedSelectedRegion(request([...ordinary,{id:'arc',type:'Arc',role:null,stage:0,data:{}}],region(ids('r')))),{code:'UNSUPPORTED_PROFILE'});
 const construction={id:'reference',type:'Circle',role:'construction',stage:0,data:{c:{x:5,y:5},r:4}};
 assert.equal((await prepareSolvedSelectedRegion(request([...ordinary,construction],region(ids('r'))))).expected.volume,500);
});

test('digest/frame/region/domain failures remain separate and source stays unchanged',async()=>{
 const input=request([circle('c',10)],region(['c'])),before=JSON.stringify(input);
 await assert.rejects(prepareSolvedSelectedRegion({...input,sketchDigest:'0'.repeat(64)}),{code:'STALE_SKETCH'});
 await assert.rejects(prepareSolvedSelectedRegion({...input,frame:{...frame,origin:[1,0,0]}}),{code:'STALE_FRAME'});
 await assert.rejects(prepareSolvedSelectedRegion({...input,regionId:region(['missing'])}),{code:'STALE_REGION'});
 await assert.rejects(prepareSolvedSelectedRegion({...input,depth:0}),{code:'INVALID_REQUEST'});
 await assert.rejects(prepareSolvedSelectedRegion({...input,engine:'manifold'}),{code:'UNSUPPORTED_ENGINE'});
 assert.equal(JSON.stringify(input),before);
});

test('capture rejects getters and detaches frame before asynchronous digest',async()=>{
 const input=request([circle('c',10)],region(['c']));let reads=0;
 await assert.rejects(prepareSolvedSelectedRegion({...input,get depth(){reads++;return 5;}}),{code:'INVALID_REQUEST'});assert.equal(reads,0);
 const pending=prepareSolvedSelectedRegion(input);input.frame.origin[0]=100;input.sketchJSON='changed';input.depth=123;
 const result=await pending;assert.deepEqual(result.request.frame.origin,[0,0,0]);assert.equal(result.request.depth,5);
 const malformed=request([circle('c',10)],region(['c']));delete malformed.frame.x[1];
 await assert.rejects(prepareSolvedSelectedRegion(malformed),{code:'INVALID_FRAME'});
});

test('source admission caps UTF-8 bytes rather than UTF-16 code units alone',async()=>{
 const input=request([circle('c',10)],region(['c'])),native=JSON.parse(input.sketchJSON);
 native.metadata.extra='界'.repeat(400000);input.sketchJSON=JSON.stringify(native);
 input.sketchDigest=createHash('sha256').update(input.sketchJSON).digest('hex');
 assert.ok(input.sketchJSON.length<1048576);assert.ok(Buffer.byteLength(input.sketchJSON)>1048576);
 await assert.rejects(prepareSolvedSelectedRegion(input),{code:'INVALID_REQUEST'});
 native.metadata.extra='';const base=JSON.stringify(native),space=1048576-Buffer.byteLength(base);
 native.metadata.extra='a'.repeat(space);input.sketchJSON=JSON.stringify(native);assert.equal(Buffer.byteLength(input.sketchJSON),1048576);
 input.sketchDigest=createHash('sha256').update(input.sketchJSON).digest('hex');
 assert.ok(Math.abs((await prepareSolvedSelectedRegion(input)).expected.volume-500*Math.PI)<1e-9);
});
