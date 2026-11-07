import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {geometryRevision} from '../../web/app/cad/projectManager/manufacturingMetadata.mjs';
import {manufacturingTo3mf} from '../../web/app/cad/export/manufacturingTo3mf.mjs';
const I=[1,0,0,0,1,0,0,0,1,0,0,0];
const mesh={verts:[0,0,0,1,0,0,1,1,0,0,1,0,0,0,1,1,0,1,1,1,1,0,1,1],tris:[0,2,1,0,3,2,4,5,6,4,6,7,0,1,5,0,5,4,1,2,6,1,6,5,2,3,7,2,7,6,3,0,4,3,4,7],mergeFrom:[],mergeTo:[]};
const location={mxx:1,mxy:0,mxz:0,myx:0,myy:1,myz:0,mzx:0,mzy:0,mzz:1,tx:0,ty:0,tz:0};
const body=(n)=>({id:`native:${n}`,originatingOperation:n-1,location,brepShell:{data:{__meshWithOrigins:{meshData:mesh}}}});
const region=(n,transform)=>({id:`r${n}`,bodyId:`b${n}`,materialId:'m',appearanceId:'a',transform});
const input=()=>({revision:'r1',history:[{type:'NATIVE_MESH_BOX',params:{featureId:1}},{type:'NATIVE_MESH_BOX',params:{featureId:2}}],bodies:[body(1),body(2)],metadata:{version:1,unit:'millimeter',revision:'r1',materials:[{id:'m',name:'PLA'}],appearances:[{id:'a',name:'Green',color:'#00ff00'}],bindings:[1,2].map(n=>({id:`b${n}`,featureId:n,operationType:'NATIVE_MESH_BOX'})),objects:[{id:'group',name:'group',regions:[region(1,I),region(2,[1,0,0,0,1,0,0,0,1,1,0,0])]}]}});
async function ready(d){d.project={model:{history:d.history,expressions:''},sketches:[]};d.revision=await geometryRevision(d.project);d.metadata.revision=d.revision;return d;}
test('independent reader verifies noncommuting placement and three regions in two builds',async()=>{
 const d=input();
 d.history.push({type:'NATIVE_MESH_BOX',params:{featureId:3}});
 d.bodies.push(body(3));
 d.bodies[0].location={mxx:0,mxy:-1,mxz:0,myx:1,myy:0,myz:0,mzx:0,mzy:0,mzz:1,tx:10,ty:20,tz:30};
 d.metadata.bindings.push({id:'b3',featureId:3,operationType:'NATIVE_MESH_BOX'});
 d.metadata.objects=[
  {id:'body',name:'Body',regions:[region(1,[1,0,0,0,0,1,0,-1,0,100,200,300])]},
  {id:'lid',name:'Lid and label',regions:[region(2,[1,0,0,0,1,0,0,0,1,115,170,320]),region(3,[1,0,0,0,1,0,0,0,1,120,170,320])]},
 ];
 const dir=await mkdtemp(join(tmpdir(),'codi-3mf-placement-'));
 try {
  const path=join(dir,'placement.3mf');
  await writeFile(path,await manufacturingTo3mf(await ready(d)));
  execFileSync('python3',['tests/3mf/validate_placement.py',path],{stdio:'inherit'});
 } finally {await rm(dir,{recursive:true,force:true});}
});
test('millimeter model coordinates cannot be relabeled as another physical unit',async()=>{
 for(const unit of ['micron','centimeter','meter','inch','foot']){
  const d=await ready(input());d.metadata.unit=unit;
  await assert.rejects(manufacturingTo3mf(d),/unit.*millimeter/i);
 }
});
test('regions touching accepted, overlap, stale, ambiguous and missing material rejected',async()=>{
 assert.ok((await manufacturingTo3mf(await ready(input()))).length);
 for(const change of [d=>d.revision='r2',d=>d.bodies.push(body(1)),d=>d.metadata.objects[0].regions[1].transform=I,d=>d.metadata.objects[0].regions[0].materialId=null,d=>d.history[0].type='BOX']) {const d=await ready(input());change(d);await assert.rejects(manufacturingTo3mf(d));}
});
test('region cap and pre-aborted work fail closed',async()=>{
 const d=input();d.metadata.objects[0].regions=Array.from({length:33},()=>d.metadata.objects[0].regions[0]);await assert.rejects(manufacturingTo3mf(d),/Too many/);
 const c=new AbortController();c.abort();await assert.rejects(manufacturingTo3mf(await ready(input()),{signal:c.signal}),{name:'AbortError'});
});
test('overlapping bounds require an explicit verifier and reject uncertainty',async()=>{
 const d=await ready(input());d.metadata.objects[0].regions[1].transform=[1,0,0,0,1,0,0,0,1,0.5,0,0];
 await assert.rejects(manufacturingTo3mf(d),/verified interference check required/);
 await assert.rejects(manufacturingTo3mf(d,{verifyInterference:async()=> 'uncertain'}),/uncertain/);
 // Stub demonstrates the research extension point, not a geometry proof.
 assert.ok((await manufacturingTo3mf(d,{verifyInterference:async()=> 'contact'})).length);
});
