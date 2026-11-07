const assert=require('node:assert/strict'),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL||'http://127.0.0.1:19970/'),cdp=new URL(process.env.CODI_TEST_CDP||'http://127.0.0.1:19971/');
if(![base,cdp].every(u=>['127.0.0.1','localhost','[::1]'].includes(u.hostname)))throw Error('Loopback only');
(async()=>{const b=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:120000}),c=await b.createBrowserContext();try{
 const p=await c.newPage();await p.evaluateOnNewDocument(()=>{window.topologies=[];window.ordinaryResults=0;window.requestTopology=false;const Original=window.Worker;window.Worker=class extends Original{constructor(...args){super(...args);this.addEventListener('message',e=>{if(e.data?.portableTopology)window.topologies.push(e.data.portableTopology);else if(e.data?.kind==='result')window.ordinaryResults++});}postMessage(message,...rest){return super.postMessage(window.requestTopology&&message?.kind==='profile-extrude'?{...message,researchTopology:{version:1}}:message,...rest)}};});
 const response=await p.goto(new URL('static/engine-test.html',base));assert.doesNotMatch(response.headers()['content-security-policy'],/'unsafe-eval'/);
 await p.evaluate(async()=>{
  const {createVerifiedOciMount}=await import('./oci-verified-mount.mjs');const frame={origin:[3,-4,7],x:[1,0,0],y:[0,1,0],z:[0,0,1]},faceId='S:0/SURFACE';
  let pass=0;for(const [x,width,reverse] of [[10,100,false],[10,100,false],[210,150,false],[10,150,true]]){
   const result=await new Promise((resolve,reject)=>{const w=new Worker('/static/sketch-worker.js');w.onmessage=e=>{w.terminate();resolve(e.data)};w.onerror=e=>{w.terminate();reject(Error(e.message))};w.postMessage({task:'rectangle',revision:'source',unit:'millimeter',frame,origin:[x,20],width,height:50});});if(!result.ok)throw Error(JSON.stringify(result));
   const sketch=result.sketch;if(reverse){sketch.objects.reverse();for(const o of sketch.objects)[o.data.a,o.data.b]=[o.data.b,o.data.a];}
   const sketchJSON=JSON.stringify(sketch),sketchDigest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(sketchJSON))),n=>n.toString(16).padStart(2,'0')).join(''),regionId='sketch-region:'+JSON.stringify({faceId,outer:sketch.objects.map(o=>faceId+'/'+o.id).sort(),holes:[]});
   window.requestTopology=pass++>0;const mount=createVerifiedOciMount({workerUrl:'/static/oci-verified-worker.js',jsPath:'/static/occ-portable.js',wasmPath:'/lib-assets/jsketcher-occ-engine/occt.wasm'});await mount.ready;
   const returned=await mount.execute({op:'solid.profile.extrude',version:1,profile:{version:2,unit:'millimeter',engine:'occ',revision:'r',sketchDigest,faceId,regionId,frame,depth:10,sketchJSON}});if('portableTopology'in returned)throw Error('controller unexpectedly exposes research descriptor');mount.close();
  }
 });
 const topologies=await p.evaluate(()=>window.topologies);assert.equal(topologies.length,3);assert.equal(await p.evaluate(()=>window.ordinaryResults),1);
 for(const t of topologies){assert.equal(t.version,1);assert.equal(t.idScope,'response-local');assert.equal(t.vertices.length,8);assert.equal(t.edges.length,12);assert.equal(t.faces.length,6);assert.equal(t.sourceEdges.length,4);assert.ok(t.faces.every(f=>f.loop.length===4&&f.triangles.length>0));assert.ok(t.edges.every(e=>e.uses.length===2));assert.ok(!/"(ptr|ref|edgeRef)"/.test(JSON.stringify(t)));}
 assert.ok(topologies[2].sourceEdges.every(e=>e.sourceReversed));console.log('PASS actual OCC worker portable topology, source ancestry and controller withholding');
 }finally{await c.close();b.disconnect()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
