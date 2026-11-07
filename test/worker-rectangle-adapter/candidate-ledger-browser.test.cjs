const assert=require('node:assert/strict'),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);if(![base,cdp].every(u=>['127.0.0.1','localhost','[::1]'].includes(u.hostname)))throw Error('Loopback only');
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href}),context=await browser.createBrowserContext(),page=await context.newPage();try{
 page.on('pageerror',e=>console.error('PAGE',e.stack));page.on('console',m=>{if(m.type()==='error')console.error('CONSOLE',m.text())});
 const response=await page.goto(new URL('static/engine-test.html',base));assert.match(response.headers()['content-security-policy'],/script-src 'self' 'wasm-unsafe-eval'/);assert.doesNotMatch(response.headers()['content-security-policy'],/script-src[^;]*blob:/);
 await page.addScriptTag({url:new URL('static/candidate-ledger-entry.js',base).href,type:'module'});
 const out=await page.evaluate(async()=>{
  const {runWorkerRectangleExtrusion:run,resolveCandidatePrism:resolve,createEvaluationResourcePool}=window.candidateFixture;
  const frame={origin:[3,-4,7],x:[1,0,0],y:[0,1,0],z:[0,0,1]},faceId='S:0/SURFACE';
  const draft=await new Promise((yes,no)=>{const w=new Worker('/static/sketch-worker.js');w.onmessage=e=>{w.terminate();yes(e.data)};w.onerror=e=>no(Error(e.message));w.postMessage({task:'rectangle',revision:'r',unit:'millimeter',frame,origin:[10,20],width:100,height:50})});
  const sketchJSON=draft.serializedSketch,sketchDigest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(sketchJSON))),x=>x.toString(16).padStart(2,'0')).join(''),regionId='sketch-region:'+JSON.stringify({faceId,outer:draft.sketch.objects.map(o=>faceId+'/'+o.id).sort(),holes:[]});
  const profile={version:2,unit:'millimeter',engine:'occ',revision:'r',sketchDigest,faceId,regionId,frame,depth:10,sketchJSON};
  const doc=new AbortController(),owner=createEvaluationResourcePool().begin({signal:doc.signal,valid:()=>true});
  const result=await run({evaluation:owner,featureId:'42',profile,bodyPolicy:'separate',booleanKind:'NONE',occupiedIds:new Set(),valid:()=>true,assets:{workerUrl:'/static/oci-verified-worker.js',jsPath:'/static/occ-portable.js',wasmPath:'/lib-assets/jsketcher-occ-engine/occt.wasm',semanticWorkerUrl:'/static/rectangle-semantic-worker.js'}});
  const lid=result.model.faces.find(f=>f.topology.data.portableIdentity?.key?.role==='LID');
  const intent={version:1,kind:'centered-through-hole',unit:'millimeter',featureId:'43',target:{parentFeatureId:'42',bodyId:result.model.id,lidFaceId:lid.id,regionId},placement:{kind:'rectangle-center'},diameter:10,extent:'through-all'};
  const found=resolve(owner,intent),modelIdentity=found.model===result.model;found.requireCurrent();
  const model=result.model,face=model.faces[0].brepFace,edge=model.edges[0].brepEdge,vertex=model.vertices[0].brepVertex;
  const curveDelta=edge.curve.impl.eval(0)[1],surfaceDelta=face.surface.impl.eval(0,0)[1],triangle=face.data.tessellation.data[0][0][0];
  const cases=[
   [model,'ext',{workerGeometry:model.ext.workerGeometry}],[model.edges.find(e=>e.ext.workerIdentity?.stability==='transient').ext,'workerIdentity',{stability:'authored'}],[model.edges.find(e=>e.ext.workerIdentity?.stability==='transient'),'ext',{}],[model.vertices[0].ext,'vertexIdentity',{stability:'authored'}],[model.vertices[0],'ext',{}],[face.data,'id','mutated-topology-id'],[vertex.point,'x',vertex.point.x+1],[model.location,'tx',model.location.tx+1],
   [triangle,0,triangle[0]+1],[curveDelta,0,curveDelta[0]+1],[surfaceDelta,0,surfaceDelta[0]+1],
   [face.outerLoop.halfEdges[0],'next',null],[face.surface._simpleSurface.normal,'x',face.surface._simpleSurface.normal.x+1]
  ];
  const mutationRefusals=[];for(const [object,key,value] of cases){const old=object[key];object[key]=value;try{resolve(owner,intent);mutationRefusals.push(false)}catch{mutationRefusals.push(true)}finally{object[key]=old}resolve(owner,intent);}
  const registryEntry=model.brepRegistry.get(face);model.brepRegistry.delete(face);try{resolve(owner,intent);mutationRefusals.push(false)}catch{mutationRefusals.push(true)}finally{model.brepRegistry.set(face,registryEntry)}resolve(owner,intent);
  // Benign lazy caches may populate without changing authoritative geometry.
  for(const [label,run] of [['csys',()=>model.faces[0].csys],['env2D',()=>face.env2D()],['middlePoint',()=>edge.curve.middlePoint()]]){run();try{resolve(owner,intent)}catch(e){throw Error(label+': '+e.message)}}
  const modelFace=model.faces[0];void modelFace.basis();void modelFace.sketchToWorldTransformation;void modelFace.worldToSketchTransformation;resolve(owner,intent);
  const cacheKey=Object.keys(edge.curve.impl).find(k=>k.startsWith('__cache__:tess:'));if(!cacheKey)throw Error('Expected actual curve cache');
  const cacheCases=[[modelFace._csys.origin,'x',modelFace._csys.origin.x+1],[modelFace._sketchToWorldTransformation,'tx',modelFace._sketchToWorldTransformation.tx+1],
   [modelFace._worldToSketchTransformation,'tx',modelFace._worldToSketchTransformation.tx+1],[edge.curve.impl[cacheKey][0],0,edge.curve.impl[cacheKey][0][0]+1]];
  for(const [object,key,value] of cacheCases){const old=object[key];object[key]=value;try{resolve(owner,intent);mutationRefusals.push(false)}catch{mutationRefusals.push(true)}finally{object[key]=old}resolve(owner,intent);}
  const point=edge.curve.impl[cacheKey][0],oldCoordinate=point[0];delete point[0];try{resolve(owner,intent);mutationRefusals.push(false)}catch{mutationRefusals.push(true)}finally{point[0]=oldCoordinate}resolve(owner,intent);
  const start=performance.now();for(let i=0;i<20;i++)resolve(owner,intent);const averageMs=(performance.now()-start)/20;

  const wrong=createEvaluationResourcePool().begin({signal:new AbortController().signal,valid:()=>true});let wrongOwner=false;try{resolve(wrong,intent)}catch{wrongOwner=true}wrong.close();
  const secondDoc=new AbortController(),secondPool=createEvaluationResourcePool(),secondOwner=secondPool.begin({signal:secondDoc.signal,valid:()=>true});
  const second=await run({evaluation:secondOwner,featureId:'45',profile,bodyPolicy:'separate',booleanKind:'NONE',occupiedIds:new Set(),valid:()=>true,assets:{workerUrl:'/static/oci-verified-worker.js',jsPath:'/static/occ-portable.js',wasmPath:'/lib-assets/jsketcher-occ-engine/occt.wasm',semanticWorkerUrl:'/static/rectangle-semantic-worker.js'}});
  const lid2=second.model.faces.find(f=>f.topology.data.portableIdentity?.key?.role==='LID'),intent2={...intent,featureId:'46',target:{parentFeatureId:'45',bodyId:second.model.id,lidFaceId:lid2.id,regionId}},found2=resolve(secondOwner,intent2);secondDoc.abort();let abortedRefused=false;try{found2.requireCurrent()}catch{abortedRefused=true}const abortClosed=secondPool.usage.owners===0;
  owner.seal();owner.accept();let acceptedRefused=false;try{resolve(owner,intent)}catch{acceptedRefused=true}owner.close();let closedRefused=false;try{found.requireCurrent()}catch{closedRefused=true}
  return {mutationRefusals,averageMs,modelIdentity,wrongOwner,acceptedRefused,closedRefused,abortedRefused,abortClosed,faces:result.model.faces.length,edges:result.model.edges.length};
 });assert.deepEqual(out.mutationRefusals,Array(19).fill(true));assert.ok(Number.isFinite(out.averageMs));console.log('Projection revalidation mean ms',out.averageMs);delete out.mutationRefusals;delete out.averageMs;assert.deepEqual(out,{modelIdentity:true,wrongOwner:true,acceptedRefused:true,closedRefused:true,abortedRefused:true,abortClosed:true,faces:6,edges:12});console.log('PASS actual candidate owner, OCI mount, projected prism and candidate-only association');
}finally{await context.close();browser.disconnect()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
