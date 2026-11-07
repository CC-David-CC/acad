import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {geometryRevision} from '../../web/app/cad/projectManager/manufacturingMetadata.mjs';
import {manufacturingTo3mf} from '../../web/app/cad/export/manufacturingTo3mf.mjs';
const require=createRequire(import.meta.url), puppeteer=require('puppeteer-core');
const url=new URL(process.env.CODI_3MF_CAD_URL),cdp=new URL(process.env.CODI_3MF_CDP || 'http://127.0.0.1:19255');
if(![url,cdp].every(u=>['localhost','127.0.0.1','[::1]'].includes(u.hostname)))throw Error('Loopback endpoints required');
const I=[1,0,0,0,1,0,0,0,1,0,0,0];
const region=(id,body,material,appearance,transform=I)=>({id,bodyId:body,materialId:material,appearanceId:appearance,transform});
const meta={version:1,unit:'millimeter',revision:'rev-42',materials:[{id:'pla',name:'PLA'},{id:'petg',name:'PETG'}],appearances:[{id:'red',name:'Red',color:'#ff0000'},{id:'blue',name:'Blue',color:'#0000ff'}],bindings:[{id:'body-a',featureId:1,operationType:'NATIVE_MESH_BOX'},{id:'body-b',featureId:2,operationType:'NATIVE_MESH_BOX'}],objects:[{id:'lid',name:'Lid and label',regions:[region('lid-region','body-a','pla','red'),region('label-region','body-b','petg','blue',[1,0,0,0,1,0,0,0,1,10,0,0])]}]};
const box=(featureId,width)=>({type:'NATIVE_MESH_BOX',params:{featureId,x:0,y:0,z:0,width,depth:10,height:2}});
const envelope={format:'codi-jsketcher-manufacturing',version:1,project:{model:{history:[box(1,10),box(2,2)],expressions:'',counters:{featureId:2}},sketches:[]},manufacturing:meta};
const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:120000}),context=await browser.createBrowserContext();
try {
 async function open(){const p=await context.newPage();await p.goto(url.href);await p.waitForFunction('window.__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});return p;}
 const first=await open();await first.evaluate(json=>__CAD_APP.projectManager.restoreSnapshotInEmptyWorkspace(json),JSON.stringify(envelope.project));
 const project=await first.evaluate(()=>__CAD_APP.projectManager.snapshotCurrentProject());meta.revision=await geometryRevision(project);
 const wrapped={...envelope,project,manufacturing:meta};
 const second=await open();await second.evaluate(json=>__CAD_APP.projectManager.restoreSnapshotInEmptyWorkspace(json),JSON.stringify(wrapped));
 const state=await second.evaluate(()=>{const c=__CAD_APP,snapshot=c.projectManager.snapshotCurrentProject();return {snapshot,history:c.craftService.modifications$.value.history,bodies:c.cadRegistry.shells.map(s=>{const l=s.location;return {id:s.id,originatingOperation:s.originatingOperation,brepShell:{data:{__meshWithOrigins:{meshData:s.brepShell.data.__meshWithOrigins.meshData}}},location:{mxx:l.mxx,mxy:l.mxy,mxz:l.mxz,myx:l.myx,myy:l.myy,myz:l.myz,mzx:l.mzx,mzy:l.mzy,mzz:l.mzz,tx:l.tx,ty:l.ty,tz:l.tz}}})};});
 assert.equal(state.bodies.length,2);assert.deepEqual(state.snapshot.manufacturing,meta);
 async function exportAndCheck(metadata,mode){const bytes=await manufacturingTo3mf({metadata,history:state.history,bodies:state.bodies,project:state.snapshot.project,revision:meta.revision});const dir=await mkdtemp(join(tmpdir(),'codi-3mf-model-'));try{const p=join(dir,'test.3mf');await writeFile(p,bytes);if(process.env.CODI_3MF_LIB_PYTHON)execFileSync(process.env.CODI_3MF_LIB_PYTHON,['tests/3mf/validate_model_project.py',p,mode],{stdio:'inherit'});}finally{await rm(dir,{recursive:true,force:true});}}
 await exportAndCheck(meta,'grouped');const separate=structuredClone(meta);separate.objects=[{id:'lid',name:'Lid',regions:[meta.objects[0].regions[0]]},{id:'label',name:'Label',regions:[meta.objects[0].regions[1]]}];await exportAndCheck(separate,'separate');
 await assert.rejects(manufacturingTo3mf({metadata:meta,history:state.history,bodies:state.bodies,project:state.snapshot.project,revision:'rev-43'}),/revision changed/);
 const overlap=structuredClone(meta);overlap.objects[0].regions[1].transform=I;await assert.rejects(manufacturingTo3mf({metadata:overlap,history:state.history,bodies:state.bodies,project:state.snapshot.project,revision:meta.revision}),/overlap/);
 console.log(process.env.CODI_3MF_LIB_PYTHON ? 'Restored two actual native CAD bodies; grouped/separate 3MF independently read by lib3mf' : 'Restored two actual native CAD bodies; grouped/separate 3MF generated (independent reader not configured)');
}finally{await context.close();browser.disconnect();}
