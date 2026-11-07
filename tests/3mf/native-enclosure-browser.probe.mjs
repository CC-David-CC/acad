import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {geometryRevision,encodeManufacturingProject,decodeManufacturingProject} from '../../web/app/cad/projectManager/manufacturingMetadata.mjs';
import {manufacturingTo3mf} from '../../web/app/cad/export/manufacturingTo3mf.mjs';
const require=createRequire(import.meta.url), puppeteer=require('puppeteer-core');
const url=new URL(process.env.CODI_3MF_CAD_URL),cdp=new URL(process.env.CODI_3MF_CDP||'http://127.0.0.1:19255');
if(![url,cdp].every(u=>['localhost','127.0.0.1','[::1]'].includes(u.hostname)))throw Error('Loopback only');
// Explicit test-only hypothesis for one rectangular pocket. This is not a
// general geometry verifier and must not be registered in the product.
async function rectangularResearchVerifier(a,b) {
 const contains=(pocket,box)=>{
  if(!pocket.verifiedPocket || box.verifiedPocket || !pocket.transform.every((n,i)=>n===box.transform[i])) return false;
  const v=box.vertices,lo=[0,1,2].map(i=>Math.min(...v.map(p=>p[i]))),hi=[0,1,2].map(i=>Math.max(...v.map(p=>p[i])));
  return lo.every((n,i)=>n>=pocket.verifiedPocket.min[i] && hi[i]<=pocket.verifiedPocket.max[i]);
 };
 return contains(a,b)||contains(b,a)?'contact':'uncertain';
}
const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:120000}),context=await browser.createBrowserContext();
try {
 async function open(){const p=await context.newPage();await p.goto(url.href);await p.waitForFunction('window.__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});return p;}
 const p=await open();
 async function apply(op,params,count){await p.evaluate(({op,params})=>{const c=__CAD_APP;c.actionService.run(op);for(const [k,v] of Object.entries(params))c.wizardService.updateParam(k,v);c.services.wizard.applyWorkingRequest()},{op,params});await p.waitForFunction(n=>__CAD_APP.craftService.modifications$.value.history.length===n&&!__CAD_APP.craftService.isProcessing,{timeout:30000},count);}
 await apply('NATIVE_MESH_BOX',{x:0,y:0,z:0,width:40,depth:30,height:10},1);
 await apply('NATIVE_MESH_BOX',{x:2,y:2,z:2,width:36,depth:26,height:9},2);
 await apply('NATIVE_MESH_BOOLEAN',{target:'native:1',tool:'native:2',kind:'SUBTRACT'},3);
 await apply('NATIVE_MESH_BOX',{x:0,y:0,z:12,width:40,depth:30,height:2},4);
 await apply('NATIVE_MESH_BOX',{x:10,y:10,z:13,width:10,depth:5,height:2},5);
 await apply('NATIVE_MESH_BOOLEAN',{target:'native:4',tool:'native:5',kind:'SUBTRACT'},6);
 await apply('NATIVE_MESH_BOX',{x:10,y:10,z:13,width:10,depth:5,height:1},7);
 const project=await p.evaluate(()=>__CAD_APP.projectManager.snapshotCurrentProject());
 const I=[1,0,0,0,1,0,0,0,1,0,0,0],r=(id,body,mat,color)=>({id,bodyId:body,materialId:mat,appearanceId:color,transform:I});
 const metadata={version:1,unit:'millimeter',revision:await geometryRevision(project),materials:[{id:'pla',name:'PLA'},{id:'petg',name:'PETG'}],appearances:[{id:'black',name:'Black',color:'#222222'},{id:'white',name:'White',color:'#FFFFFF'}],bindings:[{id:'body',featureId:3,operationType:'NATIVE_MESH_BOOLEAN'},{id:'lid',featureId:6,operationType:'NATIVE_MESH_BOOLEAN'},{id:'label',featureId:7,operationType:'NATIVE_MESH_BOX'}],objects:[{id:'enclosure',name:'Enclosure',regions:[r('body-region','body','pla','black')]},{id:'lid',name:'Lid with inset label',regions:[r('lid-region','lid','pla','black'),r('label-region','label','petg','white')]}]};
 // Encode + JSON round-trip exercises the current research file format, not My files.
 const saved=JSON.parse(JSON.stringify(encodeManufacturingProject(project,metadata))),decoded=decodeManufacturingProject(saved);
 if(process.env.CODI_ENCLOSURE_FIXTURE) await writeFile(process.env.CODI_ENCLOSURE_FIXTURE,JSON.stringify(saved));
 const q=await open();await q.evaluate(json=>__CAD_APP.projectManager.restoreSnapshotInEmptyWorkspace(json),JSON.stringify(decoded.project));
 const state=await q.evaluate(()=>{const c=__CAD_APP;return {project:c.projectManager.snapshotCurrentProject(),history:c.craftService.modifications$.value.history,bodies:c.cadRegistry.shells.map(s=>{const l=s.location;return {id:s.id,originatingOperation:s.originatingOperation,brepShell:{data:{__meshWithOrigins:{meshData:s.brepShell.data.__meshWithOrigins.meshData}}},location:{mxx:l.mxx,mxy:l.mxy,mxz:l.mxz,myx:l.myx,myy:l.myy,myz:l.myz,mzx:l.mzx,mzy:l.mzy,mzz:l.mzz,tx:l.tx,ty:l.ty,tz:l.tz}}})};});
 assert.equal(state.bodies.length,3);assert.deepEqual(state.history,project.model.history);assert.equal(await geometryRevision(state.project),metadata.revision);
 const overlapping=structuredClone(decoded.manufacturing);overlapping.objects[1].regions[1].transform=[1,0,0,0,1,0,0,0,1,0,0,-0.1];
 await assert.rejects(manufacturingTo3mf({metadata:overlapping,project:state.project,history:state.history,bodies:state.bodies,revision:metadata.revision}),/overlap/);
 const bytes=await manufacturingTo3mf({metadata:decoded.manufacturing,project:state.project,history:state.history,bodies:state.bodies,revision:metadata.revision},{verifyInterference:rectangularResearchVerifier});
 const dir=await mkdtemp(join(tmpdir(),'codi-enclosure-'));try{const f=join(dir,'enclosure.3mf');await writeFile(f,bytes);if(process.env.CODI_3MF_LIB_PYTHON)execFileSync(process.env.CODI_3MF_LIB_PYTHON,['tests/3mf/validate_enclosure.py',f],{stdio:'inherit'});}finally{await rm(dir,{recursive:true,force:true});}

 // Change enclosure width and lid thickness in the saved history, then require
 // a new explicitly reviewed geometry revision before exporting regenerated CAD.
 const changed=structuredClone(project),h=changed.model.history;
 h[0].params.width=44;h[1].params.width=40;h[3].params.width=44;h[3].params.height=3;h[4].params.z=14;h[6].params.z=14;
 const updated=structuredClone(metadata);updated.revision=await geometryRevision(changed);
 assert.notEqual(updated.revision,metadata.revision);
 const t=await open();await t.evaluate(json=>__CAD_APP.projectManager.restoreSnapshotInEmptyWorkspace(json),JSON.stringify(changed));
 const regenerated=await t.evaluate(()=>{const c=__CAD_APP;return {project:c.projectManager.snapshotCurrentProject(),history:c.craftService.modifications$.value.history,bodies:c.cadRegistry.shells.map(s=>{const l=s.location;return {id:s.id,originatingOperation:s.originatingOperation,brepShell:{data:{__meshWithOrigins:{meshData:s.brepShell.data.__meshWithOrigins.meshData}}},location:{mxx:l.mxx,mxy:l.mxy,mxz:l.mxz,myx:l.myx,myy:l.myy,myz:l.myz,mzx:l.mzx,mzy:l.mzy,mzz:l.mzz,tx:l.tx,ty:l.ty,tz:l.tz}}})};});
 await assert.rejects(manufacturingTo3mf({...regenerated,metadata,revision:metadata.revision}),/revision changed/);
 const afterEdit=await manufacturingTo3mf({...regenerated,metadata:updated,revision:updated.revision},{verifyInterference:rectangularResearchVerifier});
 const dir2=await mkdtemp(join(tmpdir(),'codi-enclosure-edit-'));try{const f=join(dir2,'edited.3mf');await writeFile(f,afterEdit);if(process.env.CODI_3MF_LIB_PYTHON)execFileSync(process.env.CODI_3MF_LIB_PYTHON,['tests/3mf/validate_enclosure.py',f,'44'],{stdio:'inherit'});}finally{await rm(dir2,{recursive:true,force:true});}
 console.log('Native enclosure + inset label restored, edited and exported to 3MF');
}finally{await context.close();browser.disconnect();}
