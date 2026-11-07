// Loopback-only isolated Chromium probe. Set CODI_3MF_CAD_URL to a separately
// prepared test runtime and CODI_3MF_CDP to its Chrome DevTools endpoint.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {nativeBoxFor3mf} from '../../web/app/cad/export/nativeMeshBox3mf.mjs';
import {writeCore3mf} from '../../web/app/cad/export/core3mf.mjs';
const require=createRequire(import.meta.url), puppeteer=require('puppeteer-core');
const url=new URL(process.env.CODI_3MF_CAD_URL),cdp=new URL(process.env.CODI_3MF_CDP || 'http://127.0.0.1:19255');
if (![url,cdp].every(u=>['localhost','127.0.0.1','[::1]'].includes(u.hostname))) throw Error('Loopback only');
const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:120000}),context=await browser.createBrowserContext();
try {
 const page=await context.newPage();await page.goto(url.href);await page.waitForFunction('window.__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});
 const result=await page.evaluate(()=>{
  const ctx=window.__CAD_APP, op=ctx.operationService.get('NATIVE_MESH_BOX');
  if(!op) throw Error('Native box operation missing');
  const shell=op.run({x:1,y:2,z:3,width:10,depth:20,height:30,featureId:41},ctx).created[0];
  const loc=shell.location;loc.set3x4(0,-1,0,5,1,0,0,6,0,0,1,7);
  return {id:shell.id,brepShell:{data:{__meshWithOrigins:{meshData:shell.brepShell.data.__meshWithOrigins.meshData}}},location:{mxx:loc.mxx,mxy:loc.mxy,mxz:loc.mxz,myx:loc.myx,myy:loc.myy,myz:loc.myz,mzx:loc.mzx,mzy:loc.mzy,mzz:loc.mzz,tx:loc.tx,ty:loc.ty,tz:loc.tz}};
 });
 const object=nativeBoxFor3mf(result,{featureId:41,operationType:'NATIVE_MESH_BOX',id:'box',name:'Box',materialId:'pla'});
 assert.deepEqual(object.transform,[0,1,0,-1,0,0,0,0,1,5,6,7]);
 const bytes=await writeCore3mf({unit:'millimeter',revision:'native box test',materials:[{id:'pla',name:'PLA',color:'#00FF00'}],objects:[object]});
 if(process.env.CODI_3MF_LIB_PYTHON){const dir=await mkdtemp(join(tmpdir(),'codi-native-3mf-'));try{const f=join(dir,'native.3mf');await writeFile(f,bytes);execFileSync(process.env.CODI_3MF_LIB_PYTHON,['tests/3mf/validate_native_box.py',f],{stdio:'inherit'});}finally{await rm(dir,{recursive:true,force:true});}}
 assert.throws(()=>nativeBoxFor3mf(result,{featureId:40,operationType:'NATIVE_MESH_BOX'}),/resolved/);
 assert.throws(()=>nativeBoxFor3mf(result,{featureId:41,operationType:'BOX'}),/resolved/);
 console.log('Real Chromium native box mesh -> bounded 3MF passed');
} finally {await context.close();browser.disconnect();}
