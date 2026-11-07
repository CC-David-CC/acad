// Actual normal app/public Craft source commands. No source/history seeds,
// private wizard, fabricated region IDs or successful Worker replies.
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);
for(const url of[base,cdp])assert(['127.0.0.1','localhost','[::1]'].includes(url.hostname));
assert.equal(base.port,'20682');
for(const key of['CODI_SOURCE_PIN','CODI_EXPECT_APP_SHA','CODI_EXPECT_SKETCH_SHA','CODI_EXPECT_PROJECT_SHA','CODI_EXPECT_SEMANTIC_SHA'])assert(new RegExp(key==='CODI_SOURCE_PIN'?'^[a-f0-9]{40}$':'^[a-f0-9]{64}$').test(process.env[key]||''),'Missing reviewed '+key);
const circle=(x,y,r)=>({kind:'Circle',data:{c:{x,y},r}}),segment=(a,b)=>({kind:'Segment',data:{a:{x:a[0],y:a[1]},b:{x:b[0],y:b[1]}}});
const polygon=points=>points.map((a,i)=>segment(a,points[(i+1)%points.length]));
const rectangle=(x,y)=>polygon([[x,y],[x+10,y],[x+10,y+10],[x,y+10]]);
const cases=[
 {name:'tiny-real-gap',expectation:'Four finite valid segments; the 0.00001 mm gap is real. No bounded region without explicit repair; do not weld endpoints.',classification:'open-profile',primitives:[...rectangle(0,0).slice(0,3),segment([0,10],[0,.00001])]},
 {name:'skew-four-line-loop',expectation:'Valid closed convex parallelogram with area100 mm2, so a general CAD kernel could extrude500 mm3. Current exact local rectangle-only scope may explicitly refuse it.',classification:'unsupported-valid-profile',primitives:polygon([[0,0],[10,0],[12,10],[2,10]])},
 {name:'duplicate-segment',expectation:'Five individually valid segments, including a duplicated rectangle edge. Duplicate boundary is ambiguous, not a second region; explicit refusal/repair is required.',classification:'ambiguous-boundary',primitives:[...rectangle(0,0),segment([0,0],[10,0])],probeAt:4},
 {name:'duplicate-circle',expectation:'Two individually valid identical circles. Coincident boundaries must not silently become two solids or cancel into empty space.',classification:'ambiguous-boundary',primitives:[circle(0,0,10),circle(0,0,10)],probeAt:1},
 {name:'intersecting-circles',expectation:'Two valid circles at distance10 with radii10 have two intersections. A planar arrangement has three bounded cells; this limited engine may refuse instead of inventing two independent overlapping regions.',classification:'unsupported-arrangement',primitives:[circle(0,0,10),circle(10,0,10)],probeAt:1},
 {name:'tangent-circles',expectation:'Two radius10 circles at distance20 touch at one point. Contact has zero area and must not be treated as a valid shared volumetric connection; explicit unsupported is permitted.',classification:'point-contact',primitives:[circle(0,0,10),circle(20,0,10)],probeAt:1},
 {name:'rectangles-point-contact',expectation:'Two valid10x10 rectangles meet at one corner. This is not a shared volumetric connection; explicit ambiguous/unsupported topology is permitted.',classification:'point-contact',primitives:[...rectangle(0,0),...rectangle(10,10)],probeAt:4},
 {name:'nested-rings-control',expectation:'Three concentric circles r30/r20/r10 define outer annulus, middle annulus and inner disk. All three selectable regions are supported; depth5 gives2500pi/1500pi/500pi mm3.',classification:'supported',primitives:[circle(0,0,30),circle(0,0,20),circle(0,0,10)],volumes:[2500*Math.PI,1500*Math.PI,500*Math.PI]},
 {name:'bowtie-self-intersection',expectation:'Four valid nonzero segments cross. A self-intersecting chain needs explicit arrangement decomposition or refusal; it is not a simple rectangle region.',classification:'unsupported-arrangement',primitives:polygon([[0,0],[10,10],[0,10],[10,0]])},
 {name:'zero-radius-circle',expectation:'The public Circle domain requires positive radius; zero is invalid Circle input, independent of region extraction.',classification:'invalid-input',primitives:[circle(0,0,0)]},
 {name:'negative-radius-circle',expectation:'Negative radius is invalid Circle input; do not reinterpret it as a positive circle or mirrored coordinates.',classification:'invalid-input',primitives:[circle(0,0,-10)]},
 {name:'zero-length-segment',expectation:'A coincident-endpoint segment is degenerate. It may be explicitly refused as input or retained with an explicit non-region refusal; it must not create a solid.',classification:'degenerate-input',primitives:[segment([0,0],[0,0])]},
];
async function pin(url){const r=await fetch(url);assert.equal(r.status,200);const h=crypto.createHash('sha256');let bytes=0;for await(const block of r.body){h.update(block);bytes+=block.length;}return{url:String(url),sha256:h.digest('hex'),bytes};}
const receipt={source:process.env.CODI_SOURCE_PIN,scope:'Actual public primitives/discovery/extrusion/refusal; no signed Files, topology broadening, solver contradiction, reference repair or whole CAD1 claim',result:'RUNNING',cases:[],assets:[]};
(async()=>{
 const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:180000});let context;
 try{
  receipt.browser=await browser.version();
  for(const spec of cases){
   context=await browser.createBrowserContext();const page=await context.newPage();await page.setViewport({width:1100,height:800});
   const response=await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base));assert.doesNotMatch(response.headers()['content-security-policy']||'',/'unsafe-eval'/);await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});
   const app=await pin(new URL('static/index.bundle.js',base));assert.equal(app.sha256,process.env.CODI_EXPECT_APP_SHA);if(!receipt.assets.length)receipt.assets.push(app);
   const result=await page.evaluate(async spec=>{
    const c=__CAD_APP,k=c.craftService,host=new AbortController();c.projectService.bindHostLifetime({signal:host.signal,valid:()=>true});
    const traces=[],Native=window.Worker;window.Worker=class extends Native{constructor(url,...args){super(url,...args);this.row={url:String(url),tasks:[],terminated:false};traces.push(this.row);}postMessage(value,...args){this.row.tasks.push(value?.task||value?.kind||null);return super.postMessage(value,...args);}terminate(){this.row.terminated=true;return super.terminate();}};
    const error=e=>({name:e.name,code:e.code||null,message:e.message,committed:e.committed===true});
    const row={name:spec.name,expectation:spec.expectation,classification:spec.classification,authoring:[],discovery:null,creation:[],issues:[],constraints:'No authored constraints; no satisfiability/infeasibility claim.'};let faceId;
    const capture=()=>({history:JSON.stringify(k.modifications$.value),source:faceId?c.sketchStorageService.getSketchData(faceId):null,keyVersion:faceId?c.storageService.versionOf(c.projectService.sketchStorageKey(faceId)):null,namespaceRevision:c.storageService.namespaceRevision(c.projectService.sketchStorageNamespace),models:k.models$.value.map(m=>m.id),bodies:k.inspectWorkerSolids().bodies.map(b=>({id:b.id,featureId:b.featureId,engine:b.engine,metrics:b.metrics})),streams:[k.modifications$.revision,k.models$.revision,k.authoredJournal$?.revision??null],failure:k.pipelineFailure$.value});
    const unchanged=(a,b,label)=>{if(JSON.stringify(a)!==JSON.stringify(b))row.issues.push(label+' changed accepted source/history/models/versions');};
    const discover=()=>{const info=k.inspectSelectedProfileCommands();return k.inspectSelectedProfileRegions({revision:info.revision,faceId,depth:5});};
    let priorReturnedRegion=null;
    try{
     const plane=await k.createEmptySketchPlane({revision:k.inspectPrimitiveCreation().revision,unit:'millimeter',plane:'XY',depth:0});faceId=plane.faceId;row.faceId=faceId;
     for(let index=0;index<spec.primitives.length;index++){
      const primitive=spec.primitives[index],before=capture();let value,refusal;
      try{value=await k.appendClosedSketchPrimitive({revision:k.inspectSketchTransitions().revision,faceId,kind:primitive.kind,data:primitive.data,role:null,stage:0});}catch(e){refusal=error(e);}
      const after=capture();row.authoring.push({input:primitive,...(refusal?{error:refusal,preserved:JSON.stringify(before)===JSON.stringify(after)}:{id:value.primitive.id})});
      if(refusal){unchanged(before,after,'Primitive refusal');if(!['invalid-input','degenerate-input'].includes(spec.classification))row.issues.push('Valid drawable primitive was refused before topology qualification');break;}
      if(spec.classification==='invalid-input')row.issues.push('Invalid Circle input accepted');
      if(spec.probeAt===index+1){const initial=await discover();priorReturnedRegion=initial.regions.find(r=>r.support==='supported')?.regionId||null;row.previousPublicRegionId=priorReturnedRegion;}
     }
     const authored=capture();row.acceptedSource=authored.source;
     try{row.discovery={ok:true,value:await discover()};}catch(e){row.discovery={ok:false,error:error(e)};}
     unchanged(authored,capture(),'Discovery');
     const allAuthored=row.authoring.length===spec.primitives.length&&row.authoring.every(x=>x.id);
     if(spec.classification==='supported'){
      if(!allAuthored||!row.discovery.ok)row.issues.push('Supported nested control unavailable');
      else{
       if(row.discovery.value.regions.length!==3||row.discovery.value.regions.some(r=>r.support!=='supported'))row.issues.push('Nested control did not expose exactly three supported regions');
       for(const candidate of row.discovery.value.regions){
        const info=k.inspectSelectedProfileCommands();const value=await k.createSelectedProfileExtrusion({revision:info.revision,faceId,regionId:candidate.regionId,unit:'millimeter',engine:'occ',engineRevision:info.engineRevision,depth:5,bodyPolicy:'separate'});row.creation.push({ok:true,value});
       }
       row.acceptedBodies=capture().bodies;
       for(const depth of[0,-5]){const before=capture(),info=k.inspectSelectedProfileCommands();let refusal;try{await k.createSelectedProfileExtrusion({revision:info.revision,faceId,regionId:row.discovery.value.regions[0].regionId,unit:'millimeter',engine:'occ',engineRevision:info.engineRevision,depth,bodyPolicy:'separate'});}catch(e){refusal=error(e);}row.creation.push({depth,error:refusal,preserved:JSON.stringify(before)===JSON.stringify(capture())});if(!refusal)row.issues.push('Invalid extrusion depth accepted');unchanged(before,capture(),'Invalid depth refusal');}
      }
     }else if(allAuthored){
      const currentSupported=row.discovery.ok?row.discovery.value.regions.filter(r=>r.support==='supported'):[];
      if(currentSupported.length)row.issues.push('Unexpected supported regions for unresolved/unsupported topology');
      // Use only an ID actually returned by public discovery before the source
      // changed, never synthesize an unavailable region from authored IDs.
      const regionId=priorReturnedRegion||(row.discovery.ok?row.discovery.value.regions[0]?.regionId:null);
      if(regionId){const before=capture(),info=k.inspectSelectedProfileCommands();let value,refusal;try{value=await k.createSelectedProfileExtrusion({revision:info.revision,faceId,regionId,unit:'millimeter',engine:'occ',engineRevision:info.engineRevision,depth:5,bodyPolicy:'separate'});}catch(e){refusal=error(e);}row.creation.push({selection:'genuine earlier/publicly returned ID',...(refusal?{error:refusal,preserved:JSON.stringify(before)===JSON.stringify(capture())}:{ok:true,value})});if(!refusal)row.issues.push('Unsupported source produced a solid');else unchanged(before,capture(),'Unsupported creation refusal');}
      else row.creation.push({notAttempted:'No public region ID was ever returned for this source; no fabricated selection.'});
     }
     row.final=capture();if(row.final.failure)row.issues.push('Refusal left a published pipeline failure');
     if(spec.classification!=='supported'&&row.final.bodies.length)row.issues.push('Unexpected native result for non-supported source');
     return row;
    }catch(e){row.harnessOrUnexpectedError=error(e);row.issues.push('Unexpected public workflow error');try{row.final=capture();}catch{}return row;}
    finally{row.trace=traces;window.Worker=Native;}
   },spec);
   receipt.cases.push(result);
   const pins=[];for(const url of[...new Set(result.trace.map(t=>new URL(t.url,base).href))])pins.push(await pin(url));result.workerPins=pins;
   assert(pins.some(p=>p.sha256===process.env.CODI_EXPECT_SKETCH_SHA),'Actual production sketch Worker used');
   if(spec.classification==='supported'){
    const volumes=result.acceptedBodies?.map(b=>b.metrics.nativeVolume).sort((a,b)=>a-b)||[],expected=[...spec.volumes].sort((a,b)=>a-b);
    if(volumes.length!==expected.length||volumes.some((v,i)=>Math.abs(v-expected[i])>1e-6))result.issues.push('Independent nested annulus/disk volume mismatch');
    if(result.acceptedBodies?.some(b=>b.metrics.nativeValidity?.valid!==true||b.metrics.solidCount!==1))result.issues.push('Supported control native validity failed');
    assert(pins.some(p=>p.sha256===process.env.CODI_EXPECT_SEMANTIC_SHA),'Actual semantic Worker used');
   }
   result.result=result.issues.length?'FAIL':'PASS scoped behavior';console.log(result.result,spec.name,JSON.stringify({authoring:result.authoring.map(x=>x.error?.code||x.error?.message||'accepted'),discovery:result.discovery?.ok?'returned':result.discovery?.error,issues:result.issues}));
   if(process.env.CODI_RECEIPT)fs.writeFileSync(process.env.CODI_RECEIPT,JSON.stringify(receipt,null,2)+'\n');await context.close();context=null;
  }
  receipt.result=receipt.cases.some(c=>c.issues.length)?'FAIL scoped findings':'PASS scoped corpus';
 }catch(e){receipt.result='HARNESS FAIL';receipt.error={message:e.message,stack:e.stack};throw e;}
 finally{if(process.env.CODI_RECEIPT)fs.writeFileSync(process.env.CODI_RECEIPT,JSON.stringify(receipt,null,2)+'\n');if(context)await context.close();browser.disconnect();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
