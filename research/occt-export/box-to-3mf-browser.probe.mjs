import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {indexOccAxisBox} from '../../web/app/cad/export/occBoxSoup3mf.mjs';
import {writeCore3mf} from '../../web/app/cad/export/core3mf.mjs';
const require=createRequire(import.meta.url),puppeteer=require('puppeteer-core');
const url=new URL(process.env.CODI_OCC_TEST_URL),cdp=new URL(process.env.CODI_OCC_TEST_CDP||'http://127.0.0.1:19255');
if(![url,cdp].every(u=>['localhost','127.0.0.1','[::1]'].includes(u.hostname))) throw Error('Loopback only');
const b=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:120000}),c=await b.createBrowserContext();
try{
 const p=await c.newPage();await p.goto(url.href);await p.waitForFunction('window.__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});
 const soup=await p.evaluate(()=>{const ctx=__CAD_APP,s=ctx.operationService.get('BOX').run({x:10,y:20,z:30,featureId:1,boolean:{kind:'NONE'}},ctx).created[0],code=Module._ExportTessellationCopy(s.brepShell.data.externals.ptr,0.1);if(code!==0)throw Error('OCC export failed: '+code);return window.__OCI_EXCHANGE_VAL;});
 const mesh=indexOccAxisBox(soup,{minimumSeparation:1e-7});assert.equal(mesh.vertices.length,8);assert.equal(mesh.triangles.length,12);
 const bytes=await writeCore3mf({unit:'millimeter',revision:'occ-box-demo',materials:[{id:'pla',name:'PLA',color:'#00ff00'}],objects:[{id:'part',name:'OCC Box',materialId:'pla',...mesh}]});
 const dir=await mkdtemp(join(tmpdir(),'codi-occ-3mf-'));try{const file=join(dir,'box.3mf');await writeFile(file,bytes);if(process.env.CODI_3MF_LIB_PYTHON)execFileSync(process.env.CODI_3MF_LIB_PYTHON,['research/occt-export/validate_occ_box.py',file],{stdio:'inherit'});}finally{await rm(dir,{recursive:true,force:true});}
 const ambiguous=structuredClone(soup);ambiguous.triangles[0][0][0]+=1e-8;assert.throws(()=>indexOccAxisBox(ambiguous,{minimumSeparation:1e-7}),/nearby|box/i);
 console.log('OCC copy-tessellated axis-aligned box -> exact indexing -> 3MF passed');
}finally{await c.close();b.disconnect();}
