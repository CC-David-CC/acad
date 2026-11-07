/* Exact source-built app over loopback; emits failures instead of hiding them.
 * JSKETCHER_TEST_URL and CODI_TEST_CDP must be loopback addresses. */
const assert=require('node:assert/strict'),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL||'http://127.0.0.1:19782/'),cdp=new URL(process.env.CODI_TEST_CDP||'http://127.0.0.1:19282');
if(![base,cdp].every(u=>['127.0.0.1','localhost','[::1]'].includes(u.hostname)))throw Error('Loopback required');
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:60000}),context=await browser.createBrowserContext(),page=await context.newPage();try{
 await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base).href);await page.waitForFunction('window.__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});
 const result=await page.evaluate(async()=>{const ctx=__CAD_APP,tests=[['BOX',{x:10,y:20,z:30},'x'],['CYLINDER',{diameter:20,height:30},'diameter'],['SPHERE',{radius:10},'radius'],['CONE',{diameterA:20,diameterB:10,height:30},'height'],['NATIVE_MESH_BOX',{x:0,y:0,z:0,width:10,depth:20,height:30},'width']],out={};
  function metrics(shell){const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];let sum=0,count=0;for(const face of shell.faces)for(const [tri] of face.data.tessellation.data){const [a,b,c]=tri;count++;sum+=(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;for(const v of tri)for(let i=0;i<3;i++){lo[i]=Math.min(lo[i],v[i]);hi[i]=Math.max(hi[i],v[i])}}return {faces:shell.faces.length,lo,hi,meshVolume:Math.abs(sum),triangles:count}}
  for(const [id,params,key] of tests){const op=ctx.operationService.get(id);const valid=await op.run({...params,featureId:10,boolean:{kind:'NONE'}},ctx);const zero={...params,[key]:0,featureId:11,boolean:{kind:'NONE'}};let invalid;try{const r=await op.run(zero,ctx);invalid={accepted:true,faces:r.created[0]?.brepShell?.faces.length??null}}catch(e){invalid={accepted:false,error:String(e.message||e)}}out[id]={valid:metrics(valid.created[0].brepShell),zero:invalid};}
  const csys={origin:{x:3,y:4,z:5},x:{x:0,y:1,z:0},y:{x:-1,y:0,z:0},z:{x:0,y:0,z:1}};
  for(const [id,params] of [['BOX',{x:10,y:20,z:30}],['CYLINDER',{diameter:20,height:30}],['CONE',{diameterA:20,diameterB:10,height:30}]]){const r=await ctx.operationService.get(id).run({...params,locations:{csys},featureId:20,boolean:{kind:'NONE'}},ctx);out[id].rotated=metrics(r.created[0].brepShell)}
  const tilted={origin:{x:3,y:4,z:5},x:{x:0,y:0,z:1},y:{x:1,y:0,z:0},z:{x:0,y:1,z:0}};
  for(const [id,params] of [['CYLINDER',{diameter:20,height:30}],['CONE',{diameterA:20,diameterB:10,height:30}]]){const r=await ctx.operationService.get(id).run({...params,locations:{csys:tilted},featureId:21,boolean:{kind:'NONE'}},ctx);out[id].tilted=metrics(r.created[0].brepShell)}
  return out;});
 console.log('OBSERVED',JSON.stringify(result));
 assert.deepEqual(result.BOX.valid.lo,[0,0,0]);assert.deepEqual(result.BOX.valid.hi,[10,20,30]);assert.ok(Math.abs(result.BOX.valid.meshVolume-6000)<1e-6);
 assert.deepEqual(result.NATIVE_MESH_BOX.valid.lo,[0,0,0]);assert.deepEqual(result.NATIVE_MESH_BOX.valid.hi,[10,20,30]);assert.ok(Math.abs(result.NATIVE_MESH_BOX.valid.meshVolume-6000)<1e-6);
 const failures=[];for(const [id,item] of Object.entries(result))if(item.zero.accepted)failures.push(id+' accepted zero dimension with '+item.zero.faces+' faces');
 // Box and sketch CSys use z for extrusion height; flag the curved
 // primitives' orientation for engineering review rather than equating engines.
 for(const id of ['CYLINDER','CONE'])if(Math.abs(result[id].rotated.hi[2]-35)>0.2)failures.push(id+' height does not follow rotated datum z axis');
 for(const id of ['CYLINDER','CONE'])if(Math.abs(result[id].tilted.lo[1]-4)>0.2||Math.abs(result[id].tilted.hi[1]-34)>0.2)failures.push(id+' height does not follow tilted datum z axis');
 if(failures.length)throw Error('Basic primitive findings: '+failures.join('; '));
 console.log('PASS primitive domain and datum orientation checks');
 }finally{await context.close();browser.disconnect()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
