// Public authoring only; passive model reads are test oracles, never publication.
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);
for(const url of[base,cdp])assert.ok(['127.0.0.1','localhost','[::1]'].includes(url.hostname));
(async()=>{
 const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:180000}),context=await browser.createBrowserContext();
 try{
  async function fresh(){const p=await context.newPage();await p.goto(new URL('index-webos.html?DEFAULT&webos=1',base));await p.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});await p.evaluate(()=>{window.regionHost=new AbortController();__CAD_APP.projectService.bindHostLifetime({signal:regionHost.signal,valid:()=>true});});return p;}
  const page=await fresh();
  const result=await page.evaluate(async()=>{
   const c=__CAD_APP,k=c.craftService,rows=[];
   const segment=(a,b,role=null)=>({kind:'Segment',data:{a:{x:a[0],y:a[1]},b:{x:b[0],y:b[1]}},role});
   const rectangle=(x,y,w,h)=>{const p=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];return p.map((a,i)=>segment(a,p[(i+1)%4]));};
   const circle=(x,y,r)=>({kind:'Circle',data:{c:{x,y},r},role:null});
   const cases=[
    {name:'rectangle',primitives:rectangle(0,0,100,50),holes:[0]},
    {name:'solved-PCoincident-rectangle-edited',primitives:[],constrained:true,holes:[0]},
    {name:'disjoint-rectangles',primitives:[...rectangle(0,0,10,10),...rectangle(20,0,10,10)],holes:[0,0]},
    {name:'three-nested-circles',primitives:[circle(0,0,30),circle(0,0,20),circle(0,0,10)],holes:[1,1,0]},
    {name:'rectangle-with-circle',primitives:[...rectangle(0,0,100,50),circle(50,25,10)],holes:[1,0]},
    {name:'nearby-point-before-circle',primitives:[{kind:'Point',data:{x:0,y:0},role:null},circle(.0005,0,10)],holes:[0]},
    {name:'nearby-construction-before-circle',primitives:[segment([0,0],[10,0],'construction'),circle(.0005,0,10)],holes:[0]},
    {name:'construction-cross',primitives:[...rectangle(0,0,100,50),segment([-10,25],[110,25],'construction')],holes:[0]},
    {name:'open-chain',primitives:rectangle(0,0,10,10).slice(0,3),refused:true},
    {name:'tiny-unrepaired-gap',primitives:[...rectangle(0,0,10,10).slice(0,3),segment([0,10],[0,.000001])],refused:true},
    {name:'intersecting-circles',primitives:[circle(0,0,10),circle(15,0,10)],refused:true},
    {name:'tangent-circles',primitives:[circle(0,0,10),circle(20,0,10)],refused:true},
    {name:'point-touching-rectangles',primitives:[...rectangle(0,0,10,10),...rectangle(10,10,10,10)],refused:true},
    {name:'duplicate-boundary',primitives:[...rectangle(0,0,10,10),segment([0,0],[10,0])],refused:true},
    {name:'self-intersection',primitives:[segment([0,0],[10,10]),segment([10,10],[0,10]),segment([0,10],[10,0]),segment([10,0],[0,0])],refused:true}
   ];
   for(const test of cases){
    const {faceId}=test.constrained?await k.createRectangleSketch({revision:k.inspectRectangleCreation().revision,unit:'millimeter',origin:[.123456789,.987654321],width:100.1234567,height:50.7654321,depth:0}):await k.createEmptySketchPlane({revision:k.inspectPrimitiveCreation().revision,unit:'millimeter',plane:'XY',depth:0});
    if(test.constrained)await k.editRectangleDimensions({revision:k.inspectRectangleDimensions().revision,faceId,width:150.7654321,height:30.1234567});
    for(const primitive of test.primitives)await k.appendClosedSketchPrimitive({revision:k.inspectSketchTransitions().revision,faceId,stage:0,...primitive});
    const face=c.cadRegistry.findFace(faceId),descriptors=face.sketchRegions.map(r=>r.descriptor),holes=descriptors.map(r=>r.holes.length).sort((a,b)=>b-a);
    let matchesExpected=test.refused?descriptors.length===0&&!!face.sketchRegionError:!face.sketchRegionError&&JSON.stringify(holes)===JSON.stringify(test.holes);
    const before=c.sketchStorageService.getSketchData(faceId);void face.sketchRegions.length;if(before!==c.sketchStorageService.getSketchData(faceId))throw Error('Region inspection changed source');
    const nativeGeometry=JSON.parse(before).objects.map(o=>({id:o.id,type:o.type,data:o.data}));
    const derivedGeometry=[...face.sketch.connections,...face.sketch.constructionSegments,...face.sketch.loops].map(o=>({id:o.id,a:o.a?{x:o.a.x,y:o.a.y}:null,b:o.b?{x:o.b.x,y:o.b.y}:null,c:o.c?{x:o.c.x,y:o.c.y}:null}));
    const samePoint=(a,b)=>!!a&&!!b&&a.x===b.x&&a.y===b.y;
    const coordinateChanges=nativeGeometry.filter(o=>{const d=derivedGeometry.find(d=>d.id===faceId+'/'+o.id);return o.type==='Segment'? !d||!samePoint(d.a,o.data.a)||!samePoint(d.b,o.data.b):o.type==='Circle'?!d||!samePoint(d.c,o.data.c):false;}).map(o=>o.id);
    matchesExpected=matchesExpected&&coordinateChanges.length===0;
    rows.push({name:test.name,faceId,authoredPrimitives:test.primitives.length,contours:face.sketch.contours.length,descriptors,regionIds:face.sketchRegions.map(r=>r.id),error:face.sketchRegionError,source:before,nativeGeometry,derivedGeometry,coordinateChanges,expected:test.refused?'explicit-unsupported':test.holes,matchesExpected,outcome:face.sketchRegionError?'explicit-unsupported':'supported'});
   }
   const saved=await c.projectManager.prepareHostSave();if(!saved.isCurrent())throw Error('Native save became stale');return{rows,saved:saved.envelope};
  });
  const reopened=await fresh(),facts=await reopened.evaluate(async saved=>{
   const c=__CAD_APP;await c.projectManager.restoreSnapshotBytesInEmptyWorkspace(new Blob([JSON.stringify(saved)]));return c.sketchStorageService.getAllSketches().map(s=>{const f=c.cadRegistry.findFace(s.id);return{faceId:s.id,source:c.sketchStorageService.getSketchData(s.id),regionIds:f.sketchRegions.map(r=>r.id),error:f.sketchRegionError};});
  },result.saved);
  for(const row of result.rows)assert.deepEqual(facts.find(f=>f.faceId===row.faceId),{faceId:row.faceId,source:row.source,regionIds:row.regionIds,error:row.error});
  const bytes=await(await fetch(new URL('static/index.bundle.js',base))).arrayBuffer(),appSHA256=crypto.createHash('sha256').update(Buffer.from(bytes)).digest('hex');if(process.env.CODI_EXPECT_APP_SHA)assert.equal(appSHA256,process.env.CODI_EXPECT_APP_SHA);
  const receipt={format:'codi-public-region-corpus/1',appSHA256,result:result.rows.every(r=>r.matchesExpected)?'PASS':'FAIL',rows:result.rows,nativeReopen:true,scope:'Public primitive authoring and passive derived-region census. No geometry seeds, solver-status inference, general planar arrangement, solid extrusion, signed Files or old active-editor UI claim.'};
  if(process.env.CODI_RECEIPT)fs.writeFileSync(process.env.CODI_RECEIPT,JSON.stringify(receipt,null,2)+'\n');
  console.log(receipt.result+' public region corpus',JSON.stringify({appSHA256,rows:result.rows.map(r=>({name:r.name,outcome:r.outcome,regions:r.descriptors.length,error:r.error,coordinateChanges:r.coordinateChanges,matchesExpected:r.matchesExpected})),nativeReopen:true}));
  assert.ok(result.rows.every(r=>r.matchesExpected),'See receipt: public region corpus has mismatched mathematical expectations');
 }finally{await context.close();browser.disconnect();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
