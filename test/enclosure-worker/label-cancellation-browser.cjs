const assert = require('node:assert/strict');
const puppeteer = require('puppeteer-core');
(async () => {
 const b = await puppeteer.connect({browserURL:'http://127.0.0.1:19975'}), c = await b.createBrowserContext();
 try {
  const p = await c.newPage(); await p.goto('http://127.0.0.1:19974/static/');
  const result = await p.evaluate(async () => {
   const all={};
   for (const engine of ['occ','manifold']) {
    const mod=await import(engine==='occ'?'./oci-verified-mount.mjs':'./manifold-verified-mount.mjs');
    const opt={workerUrl:engine==='occ'?'/static/worker.js':'/static/manifold-worker.js',jsPath:'/static/unused.js',wasmPath:engine==='occ'?'/static/oci.wasm':'/static/manifold.wasm'};
    const make=()=>engine==='occ'?mod.createVerifiedOciMount(opt):mod.createVerifiedManifoldMount(opt);
    const a=make(), b=make(), c=make(), slow=engine==='occ'?mod.createVerifiedOciMount({...opt,workerUrl:'/static/occ-slow-manufacturing.js'}):mod.createVerifiedManifoldMount({...opt,workerUrl:'/static/manifold-slow-manufacturing.js'});
    try {
     await Promise.all([a.ready,b.ready,c.ready,slow.ready]);
     const plan={unit:'millimeter',width:100,length:70,height:30,wall:3,clearance:.3,lidThickness:3,lipDepth:2};
     const request=label=>({op:'solid.enclosure.create',version:2,plan:{...plan,label}});
     let invalid=false,cross=false,missing=false,closed=false;
     try {await a.createEnclosure(request({width:40,length:20,depth:3}));} catch {invalid=true;}
     const one=await a.createEnclosure(request({width:40,length:20,depth:1}));
     const two=await b.createEnclosure(request({width:40,length:20,depth:1}));
     const old=await c.createEnclosure({op:'solid.enclosure.create',version:1,plan});const slowShape=await slow.createEnclosure(request({width:40,length:20,depth:1})); const ac=new AbortController();const job=slow.readEnclosureManufacturingMesh({op:'solid.enclosure.manufacturing-mesh',version:1,handle:slowShape.label.handle,maxDeviationMm:.001},{signal:ac.signal}).catch(e=>e.code);setTimeout(()=>ac.abort(),20);const aborted=await job;let cancelledClosed=false;try{slow.assertEnclosureBinding(slowShape.body.handle,slowShape.lid.handle,slowShape.label.handle);}catch{cancelledClosed=true;}const otherIntact=b.assertEnclosureBinding(two.body.handle,two.lid.handle,two.label.handle);
     try {a.assertEnclosureBinding(one.body.handle,one.lid.handle,two.label.handle);} catch {cross=true;}
     try {a.assertEnclosureBinding(one.body.handle,one.lid.handle);} catch {missing=true;}
     a.close(); try {a.assertEnclosureBinding(one.body.handle,one.lid.handle,one.label.handle);} catch {closed=true;}
     all[engine]={invalid,cross,missing,closed,aborted,cancelledClosed,otherIntact,oldVersion:old.contractVersion,oldHasLabel:'label' in old};
    } finally {a.close();b.close();c.close();slow.close();}
   } return all;
  });
  for (const [engine,r] of Object.entries(result)) { for (const k of ['invalid','cross','missing','closed','cancelledClosed','otherIntact']) assert.equal(r[k],true,`${engine} ${k}`); assert.equal(r.aborted,'CANCELLED'); assert.equal(r.oldVersion,1); assert.equal(r.oldHasLabel,false); }
  console.log(JSON.stringify(result));
 } finally {await c.close();b.disconnect();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
