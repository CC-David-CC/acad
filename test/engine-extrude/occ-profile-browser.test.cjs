// Real production sketch Worker and independently verified OCC research Worker.
const assert=require('node:assert/strict'),fs=require('node:fs'),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL||'http://127.0.0.1:19970/'),cdp=new URL(process.env.CODI_TEST_CDP||'http://127.0.0.1:19971/');
if(![base,cdp].every(u=>['127.0.0.1','localhost','[::1]'].includes(u.hostname)))throw Error('Loopback only');
(async()=>{const b=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:120000}),c=await b.createBrowserContext();try{
 const p=await c.newPage();await p.evaluateOnNewDocument(()=>{window.violations=[];document.addEventListener('securitypolicyviolation',e=>violations.push(e.violatedDirective))});
 const response=await p.goto(new URL('static/engine-test.html',base));assert.match(response.headers()['content-security-policy'],/blob:/);assert.doesNotMatch(response.headers()['content-security-policy'],/'unsafe-eval'/);
 const out=await p.evaluate(async()=>{
  const {createVerifiedOciMount}=await import('./oci-verified-mount.mjs');
  const opts={workerUrl:'/static/oci-verified-worker.js',jsPath:'/static/occ-portable.js',wasmPath:'/lib-assets/jsketcher-occ-engine/occt.wasm'};
  const frame={origin:[3,-4,7],x:[1,0,0],y:[0,1,0],z:[0,0,1]},faceId='S:0/SURFACE';
  async function profile(width){
   const res=await new Promise((resolve,reject)=>{const w=new Worker('/static/sketch-worker.js');w.onmessage=e=>{w.terminate();resolve(e.data)};w.onerror=e=>{w.terminate();reject(Error(e.message))};w.postMessage({task:'rectangle',revision:'source',unit:'millimeter',frame,origin:[10,20],width,height:50})});
   if(!res.ok)throw Error(JSON.stringify(res));const sketchJSON=res.serializedSketch,sketchDigest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(sketchJSON))),v=>v.toString(16).padStart(2,'0')).join('');
   const regionId='sketch-region:'+JSON.stringify({faceId,outer:res.sketch.objects.map(o=>faceId+'/'+o.id).sort(),holes:[]});
   return {version:1,unit:'millimeter',engine:'occ',revision:'r'+width,sketchDigest,faceId,regionId,frame:structuredClone(frame),depth:10,sketchJSON};
  }
  const a=await profile(100),b=await profile(150),mount=createVerifiedOciMount(opts);await mount.ready;
  const request=profile=>({op:'solid.profile.extrude',version:1,profile});
  const initial=request(structuredClone(a)),pending=mount.execute(initial);initial.profile.frame.origin[0]=999;initial.profile.revision='changed';const first=await pending;
  const second=await mount.execute(request(b));
  // Reverse and reorder the actual authored geometry and remap endpoint/
  // direction constraints, then ask the actual sketch solver to revalidate it.
  const reversed=structuredClone(b),sketch=JSON.parse(reversed.sketchJSON);
  sketch.objects.reverse();for(const object of sketch.objects)[object.data.a,object.data.b]=[object.data.b,object.data.a];
  for(const constraint of sketch.stages[0].constraints){constraint.objects=constraint.objects.map(id=>id.endsWith(':A')?id.slice(0,-2)+':B':id.endsWith(':B')?id.slice(0,-2)+':A':id);if(['Horizontal','Vertical'].includes(constraint.typeId))constraint.constants.angle=String((Number(constraint.constants.angle)+180)%360);}
  const reversedAuthored=JSON.stringify(sketch);
  const solved=await new Promise((resolve,reject)=>{const w=new Worker('/static/sketch-worker.js');w.onmessage=e=>{w.terminate();resolve(e.data)};w.onerror=e=>{w.terminate();reject(Error(e.message))};w.postMessage({revision:'reversed',sketch,boundary:structuredClone(sketch.boundary),externalParameters:{}})});
  if(!solved.ok)throw Error(JSON.stringify(solved));reversed.sketchJSON=reversedAuthored;reversed.sketchDigest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(reversed.sketchJSON))),v=>v.toString(16).padStart(2,'0')).join('');reversed.revision='reversed';
  const solvedProfile=structuredClone(reversed);solvedProfile.sketchJSON=JSON.stringify(solved.sketch);solvedProfile.sketchDigest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(solvedProfile.sketchJSON))),v=>v.toString(16).padStart(2,'0')).join('');
  const solvedById=new Map(solved.sketch.objects.map(o=>[o.id,o]));let maxGap=0;
  for(let i=0;i<4;i++){const a=solvedById.get('rect-'+i).data.a,b=solvedById.get('rect-'+((i+1)%4)).data.b;maxGap=Math.max(maxGap,Math.hypot(a.x-b.x,a.y-b.y));}
  const maxAxisDeviation=Math.max(...solved.sketch.objects.map(o=>Math.min(Math.abs(o.data.a.x-o.data.b.x),Math.abs(o.data.a.y-o.data.b.y))));
  const maxResidual=Math.max(...solved.evidence.flatMap(e=>e.residuals.map(Math.abs)));
  const negative=createVerifiedOciMount(opts);await negative.ready;let solvedRefusal;try{await negative.execute(request(solvedProfile));solvedRefusal='accepted'}catch(e){solvedRefusal=e.code}negative.close();
  const v2mount=createVerifiedOciMount(opts);await v2mount.ready;const solvedResult=await v2mount.execute(request({...solvedProfile,version:2}));v2mount.close();
  const trapezoid=structuredClone(a),trapezoidSketch=JSON.parse(trapezoid.sketchJSON),points=[[0,0],[0.1,0],[0.1,0.1],[1e-7,0.1]];
  for(let i=0;i<4;i++){trapezoidSketch.objects[i].data.a={x:points[i][0],y:points[i][1]};trapezoidSketch.objects[i].data.b={x:points[(i+1)%4][0],y:points[(i+1)%4][1]};}
  trapezoid.version=2;trapezoid.depth=10000;trapezoid.sketchJSON=JSON.stringify(trapezoidSketch);trapezoid.sketchDigest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(trapezoid.sketchJSON))),v=>v.toString(16).padStart(2,'0')).join('');
  const trapezoidMount=createVerifiedOciMount(opts);await trapezoidMount.ready;let trapezoidResult,trapezoidFailure;try{trapezoidResult=await trapezoidMount.execute(request(trapezoid))}catch(e){trapezoidFailure={code:e.code,message:e.message}}trapezoidMount.close();
  const oldVolume=createVerifiedOciMount({...opts,workerUrl:'/static/oci-profile-old-volume-double.js'});await oldVolume.ready;const oldTrapezoid=await oldVolume.execute(request(trapezoid));oldVolume.close();

  let reverseResult;try{reverseResult=await mount.execute(request(reversed));}catch(e){throw Error('reverse profile '+e.code+' '+e.message)}
  let getterCalls=0;const getterProfile=structuredClone(a);Object.defineProperty(getterProfile,'depth',{enumerable:true,get(){getterCalls++;return 10}});let accessor;try{await mount.execute(request(getterProfile))}catch(e){accessor=e.code}
  const attempts=[];for(const change of [x=>x.sketchDigest='0'.repeat(64),x=>x.regionId=x.regionId.replace('rect-0','missing'),x=>x.frame.origin[2]++,x=>x.frame.x=[0,1,0],x=>x.depth=0,x=>x.engine='manifold']){
   const input=structuredClone(a);change(input);try{await mount.execute(request(input));attempts.push('accepted')}catch(e){attempts.push(e.code)}
  }
  const firstHandle=structuredClone(first.handle),dispose=await mount.dispose({op:'solid.dispose',version:1,handle:first.handle});let stale;try{await mount.boolean({op:'solid.boolean.union',version:1,unit:'millimeter',a:firstHandle,b:second.handle})}catch(e){stale=e.code}
  const advertised=mount.descriptor.operations.map(o=>o.id);mount.close();let closed;try{await mount.execute(request(a))}catch(e){closed=e.code}
  // Test-only real kernel worker: its second prism reports success without writing.
  const noOp=createVerifiedOciMount({...opts,workerUrl:'/static/oci-profile-noop-double.js'});await noOp.ready;
  const prior=await noOp.execute(request(a));let noOpResult,noOpAfter;
  try{await noOp.execute(request(b));noOpResult='accepted'}catch(e){noOpResult=e.code}
  try{await noOp.execute(request(a));noOpAfter='accepted'}catch(e){noOpAfter=e.code}noOp.close();
  const noHistory=createVerifiedOciMount({...opts,workerUrl:'/static/oci-profile-nohistory-double.js'});await noHistory.ready;let historyRefusal;
  try{await noHistory.execute(request(a));historyRefusal='accepted'}catch(e){historyRefusal=e.code}noHistory.close();
  return {first,second,reverseResult,attempts,dispose,stale,closed,advertised,noOpResult,noOpAfter,prior:prior.evidence,accessor,getterCalls,historyRefusal,solvedRefusal,solvedResult,trapezoidResult,trapezoidFailure,oldTrapezoid,maxGap,maxAxisDeviation,maxResidual,solvedSketch:solved.sketch};
 });
 for(const [item,max,vol,revision] of [[out.first,[113,66,17],50000,'r100'],[out.second,[163,66,17],75000,'r150'],[out.reverseResult,[163,66,17],75000,'reversed']]){
  assert.deepEqual(item.evidence.bounds,{min:[13,16,7],max});assert.equal(item.evidence.faces,6);assert.equal(item.evidence.triangles,12);assert.equal(item.evidence.triangulatedClosed,true);assert.equal(item.evidence.triangleOrientationConsistent,true);assert.ok(Math.abs(item.evidence.signedVolume-vol)<1e-5);
  assert.equal(JSON.stringify(item).includes('\"ptr\"'),false);assert.equal(item.evidence.topologySummary.uniqueEdgeGroups,12);assert.deepEqual(item.evidence.topologySummary.surfaceTypes,Array(6).fill('PLANE'));assert.deepEqual(item.evidence.topologySummary.edgeUseCounts,Array(12).fill(2));assert.equal(item.handle.representation,'occ-brep-worker-owned');assert.equal(item.provenance.revision,revision);assert.equal(item.provenance.edgeFaces.length,4);assert.equal(new Set(item.provenance.edgeFaces.map(e=>e.faceOrdinal)).size,4);assert.deepEqual(item.provenance.edgeFaces.map(e=>e.sourceEdgeId).sort(),[0,1,2,3].map(i=>'S:0/SURFACE/rect-'+i));assert.ok(item.provenance.edgeFaces.every(e=>e.binding==='kernel-history-and-geometric-match'));
 }
 assert.equal(out.trapezoidFailure?.code,'ENGINE_FAILURE');assert.equal(out.trapezoidResult,undefined);assert.ok(Math.abs(out.oldTrapezoid.evidence.signedVolume-100)<1e-8);assert.ok(Math.abs(out.oldTrapezoid.evidence.signedVolume-99.99995)>1e-5);
 console.log('TRAPEZOID_OLD_CHECK_ACCEPTED',out.oldTrapezoid.evidence.signedVolume,'NEW_CHECK',out.trapezoidFailure.code);
 assert.equal(out.solvedRefusal,'OPEN_OR_AMBIGUOUS_PROFILE');
 const sr=out.solvedResult;assert.equal(sr.evidence.faces,6);assert.equal(sr.evidence.triangles,12);assert.equal(sr.evidence.triangulatedClosed,true);assert.equal(sr.evidence.triangleOrientationConsistent,true);assert.ok(Math.abs(sr.evidence.signedVolume-75000)<1e-5);for(const [i,v] of [13,16,7].entries())assert.ok(Math.abs(sr.evidence.bounds.min[i]-v)<1e-7);for(const [i,v] of [163,66,17].entries())assert.ok(Math.abs(sr.evidence.bounds.max[i]-v)<1e-7);assert.equal(new Set(sr.provenance.edgeFaces.map(e=>e.faceOrdinal)).size,4);assert.deepEqual(sr.provenance.edgeFaces.map(e=>e.sourceEdgeId).sort(),[0,1,2,3].map(i=>'S:0/SURFACE/rect-'+i));assert.ok(sr.provenance.edgeFaces.every(e=>e.sourceReversed&&e.binding==='kernel-history-and-geometric-match'));assert.deepEqual(out.solvedSketch,JSON.parse(fs.readFileSync('test/engine-extrude/fixtures/reversed-solver-output.json','utf8')));
 assert.equal(out.maxGap,0);assert.equal(out.maxGap,0);assert.ok(out.maxAxisDeviation>0&&out.maxAxisDeviation<1e-6);assert.ok(out.maxResidual<=1e-6);
 console.log('REVERSED_SOLVER_NEGATIVE',JSON.stringify({maxGap:out.maxGap,maxAxisDeviation:out.maxAxisDeviation,maxResidual:out.maxResidual,code:out.solvedRefusal}));
 if(process.env.CODI_SOLVER_NEGATIVE_OUT)fs.writeFileSync(process.env.CODI_SOLVER_NEGATIVE_OUT,JSON.stringify(out.solvedSketch,null,2)+'\n');
 assert.equal(out.accessor,'INVALID_REQUEST');assert.equal(out.getterCalls,0);
 console.log('OCC_TOPOLOGY_SUMMARY',JSON.stringify(out.first.evidence.topologySummary));
 assert.ok(out.first.provenance.edgeFaces.every(e=>e.sourceReversed===false));assert.ok(out.reverseResult.provenance.edgeFaces.every(e=>e.sourceReversed===true));
 assert.equal(out.first.provenance.regionId,out.second.provenance.regionId);assert.notEqual(out.first.provenance.sketchDigest,out.second.provenance.sketchDigest);
 assert.deepEqual(out.attempts,['STALE_SKETCH','STALE_REGION','STALE_FRAME','UNSUPPORTED_FRAME','INVALID_REQUEST','UNSUPPORTED_ENGINE']);assert.equal(out.stale,'INVALID_HANDLE');assert.equal(out.closed,'MOUNT_CLOSED');assert.equal(out.dispose.op,'solid.dispose');assert.equal(out.noOpResult,'ENGINE_FAILURE');assert.equal(out.noOpAfter,'MOUNT_CLOSED');assert.equal(out.historyRefusal,'ENGINE_FAILURE');assert.deepEqual(out.prior.bounds,{min:[13,16,7],max:[113,66,17]});assert.ok(out.advertised.includes('solid.profile.extrude'));
 const inspector=await b.target().createCDPSession(),deadline=Date.now()+5000;let remaining;do{remaining=(await inspector.send('Target.getTargets')).targetInfos.filter(t=>t.type==='worker'&&/oci-(verified-worker|profile-noop-double|profile-nohistory-double)/.test(t.url));if(remaining.length)await new Promise(r=>setTimeout(r,20))}while(remaining.length&&Date.now()<deadline);assert.equal(remaining.length,0);
 assert.deepEqual(await p.evaluate(()=>window.violations),[]);console.log('PASS authored rectangle OCC profile/prism, provenance, orientation, bounded refusal and handle lifetime');
 }finally{await c.close();b.disconnect()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
