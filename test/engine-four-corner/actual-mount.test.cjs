const assert = require('node:assert/strict');
const puppeteer = require(process.env.PUPPETEER_CORE_PATH || 'puppeteer-core');
(async () => {
  const browser = await puppeteer.connect({browserURL:process.env.CODI_TEST_CDP});
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  try {
    await page.goto(process.env.CODI_TEST_URL);
    const result = await page.evaluate(async () => {
      const {createWorkerMount} = await import('/static/worker-controller.mjs');
      const config={jsSha256:'a8774acbbe3a90d7c82fe294c769096179eae351e5a8c854d4d0a31737a706ee',wasmSha256:'13617eda9a2118edfd1244b5d46523e7d9628a87ec995a0237b2b5cc58d532f2',representation:'occ-brep-worker-owned',engine:'occ-spi-v1',mesh:false,profile:true,centeredCut:true,fourCornerCut:true};
      const options={workerUrl:'/static/worker.js',jsPath:'/static/unused.js',wasmPath:'/static/engine.wasm'};
      const frame={origin:[0,0,7],x:[1,0,0],y:[0,1,0],z:[0,0,1]},faceId='S:0/SURFACE';
      const sw=new Worker('/static/sketch-worker.js');
      const draft=await new Promise((ok,no)=>{sw.onmessage=e=>{sw.terminate();ok(e.data)};sw.onerror=e=>no(Error(e.message));sw.postMessage({task:'rectangle',revision:'r',unit:'millimeter',frame,origin:[10000,20000],width:100,height:50});});
      if(!draft.ok)throw Error('Sketch solve failed');
      const sketchJSON=draft.serializedSketch;
      const sketchDigest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(sketchJSON)))].map(x=>x.toString(16).padStart(2,'0')).join('');
      const regionId='sketch-region:'+JSON.stringify({faceId,outer:draft.sketch.objects.map(o=>faceId+'/'+o.id).sort(),holes:[]});
      const profile={version:2,unit:'millimeter',engine:'occ',revision:'r',sketchDigest,faceId,regionId,frame,depth:20,sketchJSON};
      const center={version:1,unit:'millimeter',revision:'r',sketchDigest,faceId,regionId,diameter:10};
      const ids=[0,1,2,3].map(i=>faceId+'/rect-'+i);
      const request={version:1,unit:'millimeter',featureId:'4',parentFeatureId:'2',centerFeatureId:'3',revision:'r',sketchDigest,faceId,regionId,sideIds:{minX:ids[3],maxX:ids[1],minY:ids[0],maxY:ids[2]},offsetX:10,offsetY:10,diameter:4};
      const mount=createWorkerMount(options,config),other=createWorkerMount(options,config);
      await Promise.all([mount.ready,other.ready]);
      try {
        const prism=await mount.execute({op:'solid.profile.extrude',version:1,profile},{researchTopology:{version:1}});
        const hole=await mount.centeredThroughHole({op:'solid.profile.centered-through-hole',version:1,parent:prism.handle,request:center});
        const command={op:'solid.profile.four-corner-through-holes',version:1,parent:hole.handle,request};
        const result=await mount.fourCornerThroughHoles(command);
        if(!mount.assertFourCornerBinding(result.handle,hole.handle,result.binding,result.portableTopology))throw Error('Missing binding');
        const rejects=async fn=>{try{await fn();return false}catch{return true}};
        const badBinding=structuredClone(result.binding);badBinding.sideIds.minX='changed';
        const badTopology=structuredClone(result.portableTopology);badTopology.vertices[0][0]++;
        const stale=await rejects(()=>mount.fourCornerThroughHoles({...command,request:{...request,revision:'stale'}}));
        const cross=await rejects(()=>other.fourCornerThroughHoles(command));
        const tamperBinding=await rejects(()=>mount.assertFourCornerBinding(result.handle,hole.handle,badBinding,result.portableTopology));
        const tamperTopology=await rejects(()=>mount.assertFourCornerBinding(result.handle,hole.handle,result.binding,badTopology));
        const touching=await rejects(()=>mount.fourCornerThroughHoles({...command,request:{...request,offsetX:2}}));
        const otherPrism=await other.execute({op:'solid.profile.extrude',version:1,profile},{researchTopology:{version:1}});
        const otherHole=await other.centeredThroughHole({op:'solid.profile.centered-through-hole',version:1,parent:otherPrism.handle,request:center});
        const controller=new AbortController();
        const pending=other.fourCornerThroughHoles({...command,parent:otherHole.handle},{signal:controller.signal});
        controller.abort();
        const cancelled=await rejects(()=>pending);
        const cancelledMountClosed=await rejects(()=>other.assertCenteredHoleBinding(otherHole.handle,otherPrism.handle,otherHole.binding,otherHole.portableTopology));
        const originalUnaffected=mount.assertFourCornerBinding(result.handle,hole.handle,result.binding,result.portableTopology);
        const partialMount=createWorkerMount({...options,workerUrl:'/static/worker-partial.js'},config);
        await partialMount.ready;
        const partialPrism=await partialMount.execute({op:'solid.profile.extrude',version:1,profile},{researchTopology:{version:1}});
        const partialHole=await partialMount.centeredThroughHole({op:'solid.profile.centered-through-hole',version:1,parent:partialPrism.handle,request:center});
        const partialRejected=await rejects(()=>partialMount.fourCornerThroughHoles({...command,parent:partialHole.handle}));
        const partialClosed=await rejects(()=>partialMount.assertCenteredHoleBinding(partialHole.handle,partialPrism.handle,partialHole.binding,partialHole.portableTopology));
        partialMount.close();
        await mount.dispose({op:'solid.dispose',version:1,handle:prism.handle});
        const disposed=await rejects(()=>mount.assertFourCornerBinding(result.handle,hole.handle,result.binding,result.portableTopology));
        return {volume:result.evidence.analyticVolume,rims:result.evidence.rimCount,stale,cross,tamperBinding,tamperTopology,touching,disposed,cancelled,cancelledMountClosed,originalUnaffected,partialRejected,partialClosed};
      } finally {mount.close();other.close();}
    });
    assert.ok(Math.abs(result.volume-(100000-820*Math.PI))<1e-5);
    assert.equal(result.rims,10);
    for(const key of ['stale','cross','tamperBinding','tamperTopology','touching','disposed','cancelled','cancelledMountClosed','originalUnaffected','partialRejected','partialClosed'])assert.equal(result[key],true,key);
    console.log('PASS real same-mount four-hole result, binding, refusals and disposal',JSON.stringify(result));
  } finally {await context.close();browser.disconnect();}
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
