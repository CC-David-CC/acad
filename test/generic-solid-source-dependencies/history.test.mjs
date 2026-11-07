import test from 'node:test';import assert from 'node:assert/strict';
import {hasOnlyUnconsumedSketchHistory as admits} from '../../web/app/cad/craft/unconsumedSketchSave.mjs';
import {CAD_ENGINES,OCC_SELECTED_PROFILE_BUILD as selected} from '../../modules/engine/mount/engineCatalog.mjs';
import {solidBodyId} from '../../modules/engine/solid/solidIntent.mjs';
const plane=id=>({type:'PLANE',params:{featureId:id,orientation:'XY',depth:0,datum:null}});
const box=(id,build=CAD_ENGINES.occ)=>({type:'WORKER_SOLID_BOX_V1',params:{version:1,unit:'millimeter',engine:build.id,engineRevision:build.revision,featureId:id,x:0,y:0,z:0,width:10,depth:20,height:30}});
const profile=(id,faceId)=>({type:'WORKER_SELECTED_PROFILE_EXTRUDE_V2',params:{version:1,unit:'millimeter',engine:'occ',engineRevision:selected.revision,featureId:id,faceId,regionId:'sketch-region:'+JSON.stringify({faceId,outer:['curve'],holes:[]}),depth:5,bodyPolicy:'separate'}});
const boolean=(id,a,b,kind='union',build=selected)=>({type:'WORKER_SOLID_BOOLEAN_V1',params:{version:1,unit:'millimeter',engine:build.id,engineRevision:build.revision,featureId:id,kind,a:solidBodyId(a),b:solidBodyId(b)}});
const history=()=>[plane(1),profile(2,'A'),profile(3,'B'),boolean(4,2,3),profile(5,'C'),boolean(6,4,5,'common')];
test('registered boxes have no source dependency; original defaults remain registered',()=>{for(const build of[...Object.values(CAD_ENGINES),selected])for(const target of['\0','A'])assert.equal(admits([plane(1),box(2,build)],target),true);});
test('nested generic Boolean history admits sentinel/unrelated target but never a related fast save',()=>{const h=history(),before=JSON.stringify(h);assert.equal(admits(h,'\0'),true);assert.equal(admits(h,'unrelated'),true);for(const source of['A','B','C'])assert.equal(admits(h,source),false);assert.equal(JSON.stringify(h),before);});
test('persisted Join retains both operands source dependencies without blocking unrelated sketch saves',()=>{
 const h=history();h[3].params.kind='join';h[5].params.kind='join';const before=JSON.stringify(h);
 assert.equal(admits(h,'\0'),true);assert.equal(admits(h,'unrelated'),true);
 for(const source of ['A','B','C'])assert.equal(admits(h,source),false);
 assert.equal(JSON.stringify(h),before);
});
test('common/empty-capable histories retain source dependencies without inspecting derived geometry',()=>{const h=[plane(1),profile(2,'A'),profile(3,'B'),boolean(4,2,3,'common'),box(5,selected),boolean(6,4,5)];assert.equal(admits(h,'\0'),true);assert.equal(admits(h,'A'),false);assert.equal(admits(h,'B'),false);});
test('consumed parent IDs cannot be reused, while historical feature identities stay reserved',()=>{
 const h=history();for(const next of[boolean(7,2,6),boolean(7,4,6),box(2,selected),profile(3,'D'),plane(4)])assert.equal(admits([...h,next],'\0'),false);
});
test('unknown, forward, repeated and noncanonical aliases never become live operands',()=>{
 for(const mutate of[p=>p.a='missing',p=>p.a=solidBodyId(9),p=>p.b=p.a,p=>p.a='worker-solid:1:[2.0,"body"]',p=>p.a='worker-solid:1:[2, "body"]']){const h=history();mutate(h[3].params);assert.equal(admits(h,'\0'),false);}
});
test('mixed engines/builds or unregistered identities refuse even for unrelated outputs',()=>{
 for(const h of[[box(1),box(2,selected)],[box(1),box(2,CAD_ENGINES.manifold)],[profile(1,'A'),box(2)]])assert.equal(admits(h,'\0'),false);
 for(const mutate of[p=>p.engineRevision='sha256:'+'a'.repeat(64)+':'+'b'.repeat(64),p=>p.engineRevision+='\n',p=>p.engine='unknown',p=>p.engineRevision=undefined]){const h=[box(1)];mutate(h[0].params);assert.equal(admits(h,'\0'),false);}
 const wrong=profile(1,'A');wrong.params.engineRevision=CAD_ENGINES.occ.revision;assert.equal(admits([wrong],'\0'),false);
});
test('exact generic schemas reject accessors, hidden/inherited data, symbols and extras without reads',()=>{
 for(const entry of[box(1),profile(1,'A'),boolean(4,2,3)])for(const field of Object.keys(entry.params)){
  let reads=0;const p=structuredClone(entry);Object.defineProperty(p.params,field,{enumerable:true,get(){reads++;return entry.params[field]}});assert.equal(admits([p],'\0'),false);assert.equal(reads,0);
  const hidden=structuredClone(entry);Object.defineProperty(hidden.params,field,{value:hidden.params[field],enumerable:false});assert.equal(admits([hidden],'\0'),false);
  const inherited=structuredClone(entry),value=inherited.params[field];delete inherited.params[field];Object.setPrototypeOf(inherited.params,{[field]:value});assert.equal(admits([inherited],'\0'),false);
 }
 for(const mutate of[p=>p.extra=1,p=>Object.defineProperty(p,'hidden',{value:1}),p=>p[Symbol('extra')]=1]){const b=box(1);mutate(b.params);assert.equal(admits([b],'\0'),false);}
});
test('numeric domains and literal versions/units/kinds are enforced',()=>{
 for(const [key,value]of[['width',0],['height',-1],['depth',1e6+1],['x',Infinity],['y',1e6+1],['z','0'],['version',2],['unit','inch'],['featureId','1']]){const b=box(1);b.params[key]=value;assert.equal(admits([b],'\0'),false);}
 const boundary=box(1);Object.assign(boundary.params,{x:-1e6,y:1e6,width:1e6});assert.equal(admits([boundary],'\0'),true);
 const h=history();h[3].params.kind='intersect';assert.equal(admits(h,'\0'),false);
});
test('old rectangle-hole ancestry cannot target a new generic box as if it were a prism',()=>{const h=[box(1),{type:'WORKER_CENTERED_THROUGH_HOLE_V1',params:{featureId:2,face:'worker-prism:1:'+JSON.stringify(['1','face','LID',{regionId:'r'}]),diameter:4}}];assert.equal(admits(h,'\0'),false);});
test('bounded history and unknown operation refusals remain conservative',()=>{assert.equal(admits(Array.from({length:257},(_,i)=>plane(i+1)),'\0'),false);assert.equal(admits([,plane(1)],'\0'),false);assert.equal(admits([{type:'UNKNOWN',params:{featureId:1}}],'\0'),false);});
