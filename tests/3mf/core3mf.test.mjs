import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFile, mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import JSZip from 'jszip';
import {writeCore3mf} from '../../web/app/cad/export/core3mf.mjs';
const tetra = (id, materialId) => ({id, name:id, materialId, vertices:[[0,0,0],[1,0,0],[0,1,0],[0,0,1]], triangles:[[0,2,1],[0,1,3],[0,3,2],[1,2,3]]});
const model=()=>({unit:'millimeter',revision:'rev <42> & draft',materials:[{id:'plastic-a',name:'Red & opaque',color:'#FF0000'},{id:'plastic-b',name:'Blue',color:'#0000FFFF'}],objects:[tetra('left','plastic-a'),{...tetra('right','plastic-b'),transform:[1,0,0,0,1,0,0,0,1,5,6,7]}],builds:[{id:'build-left',name:'Left build',objects:['left']},{id:'build-right',name:'Right build',objects:['right']}]});
test('two named bodies, materials and placements in core package',async()=>{
 const bytes=await writeCore3mf(model()); const zip=await JSZip.loadAsync(bytes); const xml=await zip.file('3D/3dmodel.model').async('string');
 assert.match(xml,/unit="millimeter"/); assert.match(xml,/rev &lt;42&gt; &amp; draft/); assert.match(xml,/Red &amp; opaque/); assert.match(xml,/pindex="1"/); assert.match(xml,/1 0 0 0 1 0 0 0 1 5 6 7/); assert.equal((xml.match(/<components>/g)||[]).length,4);
 if(process.env.CODI_3MF_TEST_OUTPUT) await writeFile(process.env.CODI_3MF_TEST_OUTPUT,bytes);
 if(process.env.CODI_3MF_LIB_PYTHON){const dir=await mkdtemp(join(tmpdir(),'codi-3mf-test-'));try{const path=join(dir,'model.3mf');await writeFile(path,bytes);execFileSync(process.env.CODI_3MF_LIB_PYTHON,['tests/3mf/validate_lib3mf.py',path],{stdio:'inherit'});}finally{await rm(dir,{recursive:true,force:true});}}
});
test('malformed, open, non-manifold and inward meshes rejected',async()=>{
 const cases=[m=>m.objects[0].triangles.pop(),m=>m.objects[0].triangles[0]=[0,1,2],m=>m.objects[0].triangles.push([0,2,1]),m=>m.objects[0].triangles=m.objects[0].triangles.map(([a,b,c])=>[a,c,b]),m=>m.objects[0].vertices[0][0]=NaN,m=>m.objects[0].triangles[0][0]=99,m=>m.objects[0].materialId='missing',m=>m.objects[1].transform=Array(12).fill(0),m=>m.objects[1].transform=[-1,0,0,0,1,0,0,0,1,0,0,0],m=>m.unit='garbage',m=>m.objects[1].id='left',m=>m.objects[0].name='bad\u0000name'];
 for(const modify of cases){const m=model();modify(m);await assert.rejects(writeCore3mf(m));}
});
test('unassigned material and cancellation',async()=>{
 const m=model();m.materials=[];m.objects=m.objects.slice(0,1);delete m.builds;m.objects[0].materialId=null;assert.ok((await writeCore3mf(m)).length);
 const c=new AbortController();c.abort();await assert.rejects(writeCore3mf(m,{signal:c.signal}),{name:'AbortError'});
 const c2=new AbortController();const pending=writeCore3mf(model(),{signal:c2.signal});c2.abort();await assert.rejects(pending,{name:'AbortError'});
});
test('limits and editable caller state during asynchronous export',async()=>{
 const m=model(), pending=writeCore3mf(m);m.objects[0].vertices[1][0]=999;m.materials[0].name='changed';
 const xml=await (await JSZip.loadAsync(await pending)).file('3D/3dmodel.model').async('string');
 assert.match(xml, /Red &amp; opaque/);assert.doesNotMatch(xml, /x="999"/);
 const big=model();big.objects[0].vertices.length=150001;await assert.rejects(writeCore3mf(big),/limits/);
});

test('authored group keeps two material regions in one build item',async()=>{
 const m=model();m.builds=[{id:'lid-with-label',name:'Lid with label',objects:['left','right']}];
 const bytes=await writeCore3mf(m), zip=await JSZip.loadAsync(bytes), xml=await zip.file('3D/3dmodel.model').async('string');
 assert.equal((xml.match(/<item /g)||[]).length,1);
 if(process.env.CODI_3MF_LIB_PYTHON){const dir=await mkdtemp(join(tmpdir(),'codi-3mf-test-'));try{const path=join(dir,'model.3mf');await writeFile(path,bytes);execFileSync(process.env.CODI_3MF_LIB_PYTHON,['tests/3mf/validate_lib3mf.py',path,'grouped'],{stdio:'inherit'});}finally{await rm(dir,{recursive:true,force:true});}}
 const missing=model();delete missing.builds;await assert.rejects(writeCore3mf(missing),/grouping required/);
 const repeated=model();repeated.builds[1].objects=['left'];await assert.rejects(writeCore3mf(repeated),/repeated/);
});
function box(min,max,inward=false){
 const [a,b,c]=min,[x,y,z]=max;
 const vertices=[[a,b,c],[x,b,c],[x,y,c],[a,y,c],[a,b,z],[x,b,z],[x,y,z],[a,y,z]];
 let triangles=[[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]];
 if(inward) triangles=triangles.map(([i,j,k])=>[i,k,j]);return {vertices,triangles};
}
function shells(...boxes){
 const vertices=[],triangles=[];for(const b of boxes){const offset=vertices.length;vertices.push(...b.vertices);triangles.push(...b.triangles.map(t=>t.map(i=>i+offset)));}return vertices.length?{vertices,triangles}:null;
}
test('boxed void, nested island and separate solids: strict nesting and winding',async()=>{
 const m=model(); m.objects=[{id:'hollow',name:'Hollow',materialId:'plastic-a',...shells(box([0,0,0],[10,10,10]),box([2,2,2],[8,8,8],true),box([3,3,3],[4,4,4]),box([20,20,20],[21,21,21]))}];delete m.builds;
 const bytes=await writeCore3mf(m);
 if(process.env.CODI_3MF_LIB_PYTHON){const dir=await mkdtemp(join(tmpdir(),'codi-3mf-test-'));try{const path=join(dir,'model.3mf');await writeFile(path,bytes);execFileSync(process.env.CODI_3MF_LIB_PYTHON,['tests/3mf/validate_cavities.py',path],{stdio:'inherit'});}finally{await rm(dir,{recursive:true,force:true});}}
 const bad=structuredClone(m);bad.objects[0]={...bad.objects[0],...shells(box([0,0,0],[10,10,10]),box([2,2,2],[8,8,8]))};await assert.rejects(writeCore3mf(bad),/winding/);
 const touching=structuredClone(m);touching.objects[0]={...touching.objects[0],...shells(box([0,0,0],[10,10,10]),box([0,2,2],[8,8,8],true))};await assert.rejects(writeCore3mf(touching),/touch or intersect/);
 const overlap=structuredClone(m);overlap.objects[0]={...overlap.objects[0],...shells(box([0,0,0],[10,10,10]),box([9,2,2],[11,8,8]))};await assert.rejects(writeCore3mf(overlap),/touch or intersect/);
});
test('unsupported ambiguous overlapping bounds and excessive shell counts fail',async()=>{
 const m=model(); const t=tetra('small',null);m.objects=[{id:'mixed',name:'Mixed',...shells(box([0,0,0],[10,10,10]),{vertices:t.vertices.map(v=>v.map(n=>n+2)),triangles:t.triangles})}];delete m.builds;
 await assert.rejects(writeCore3mf(m),/Ambiguous overlapping shell bounds/);
 const many=model();many.objects=[{id:'many',name:'Many',...shells(...Array.from({length:65},(_,i)=>box([i*3,0,0],[i*3+1,1,1])))}];delete many.builds;
 await assert.rejects(writeCore3mf(many),/Too many shell components/);
});
test('native box adapter refuses wrong identity and unsupported merged mesh',async()=>{
 const {nativeBoxFor3mf}=await import('../../web/app/cad/export/nativeMeshBox3mf.mjs');
 const mesh=box([0,0,0],[1,2,3]);const location={mxx:1,mxy:0,mxz:0,myx:0,myy:1,myz:0,mzx:0,mzy:0,mzz:1,tx:3,ty:4,tz:5};
 const shell={id:'native:5',location,brepShell:{data:{__meshWithOrigins:{meshData:{verts:mesh.vertices.flat(),tris:mesh.triangles.flat(),mergeFrom:[],mergeTo:[]}}}}};
 const opts={featureId:5,operationType:'NATIVE_MESH_BOX',id:'body',name:'Body'};
 assert.deepEqual(nativeBoxFor3mf(shell,opts).transform,[1,0,0,0,1,0,0,0,1,3,4,5]);
 assert.throws(()=>nativeBoxFor3mf(shell,{...opts,featureId:6}),/resolved/);
 shell.brepShell.data.__meshWithOrigins.meshData.mergeFrom=[1];assert.throws(()=>nativeBoxFor3mf(shell,opts),/Unsupported/);
});
test('bow-tie vertex in a single edge-connected surface and duplicated triangle fail',async()=>{
 const m=model(),n=6,vertices=[],triangles=[];
 for(let i=0;i<n;i++)for(let j=0;j<n;j++){const u=2*Math.PI*i/n,v=2*Math.PI*j/n;vertices.push([(5+Math.cos(v))*Math.cos(u),(5+Math.cos(v))*Math.sin(u),Math.sin(v)]);}
 const index=(i,j)=>(i%n)*n+(j%n);
 for(let i=0;i<n;i++)for(let j=0;j<n;j++){const a=index(i,j),b=index(i+1,j),c=index(i+1,j+1),d=index(i,j+1);triangles.push([a,b,c],[a,c,d]);}
 for(const t of triangles) for(let i=0;i<3;i++) if(t[i]===index(3,3))t[i]=0;
 m.objects=[{id:'pinched',name:'pinched',vertices,triangles}];delete m.builds;
 await assert.rejects(writeCore3mf(m),/Non-manifold vertex/);
 const duplicate=model();duplicate.objects[0].triangles[1]=duplicate.objects[0].triangles[0].slice();await assert.rejects(writeCore3mf(duplicate),/Non-manifold|open|winding/);
});
test('known limit: edge-manifold spindle torus can geometrically self-intersect',async()=>{
 const m=model(),n=12,vertices=[],triangles=[];
 for(let i=0;i<n;i++)for(let j=0;j<n;j++){const u=2*Math.PI*i/n,v=2*Math.PI*j/n;vertices.push([(.5+Math.cos(v))*Math.cos(u),(.5+Math.cos(v))*Math.sin(u),Math.sin(v)]);}
 const index=(i,j)=>(i%n)*n+(j%n);
 for(let i=0;i<n;i++)for(let j=0;j<n;j++){const a=index(i,j),b=index(i+1,j),c=index(i+1,j+1),d=index(i,j+1);triangles.push([a,b,c],[a,c,d]);}
 m.objects=[{id:'self-intersecting',name:'Unsupported self intersecting test',vertices,triangles}];delete m.builds;
 // Documents that topology checks alone cannot prove geometric validity.
 assert.ok((await writeCore3mf(m)).length);
});
