// Real rendered legacy planes exercise the entrypoints. A temporary tag probes
// worker-face dispatch; projected real worker topology is tested separately.
const assert=require('node:assert/strict'),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL||'http://127.0.0.1:19982/'),cdp=new URL(process.env.CODI_TEST_CDP||'http://127.0.0.1:19983/');
if(![base,cdp].every(u=>['127.0.0.1','localhost','[::1]'].includes(u.hostname)))throw Error('Loopback only');
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:120000}),context=await browser.createBrowserContext();try{
 const page=await context.newPage();await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base));await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});
 const result=await page.evaluate(async()=>{const c=__CAD_APP,svc=c.services.sketcher,call=(featureId,depth)=>new Promise((resolve,reject)=>c.craftService.modify({type:'PLANE',params:{featureId,orientation:'XY',depth}},resolve,reject));await call(1,0);await call(2,100);const [a,b]=c.craftService.models$.value.map(s=>s.faces[0]);
  const data=JSON.stringify({version:3,objects:[],dimensions:[],labels:[],stages:[{constraints:[],generators:[]}],constants:''});c.sketchStorageService.setSketchData(a.id,data);
  svc.sketchFace(a);if(!svc.inPlaceEditor.inEditMode||svc.inPlaceEditor.face!==a)throw Error('Legacy editor did not open');
  b.root.ext.workerGeometry={version:1,representation:'worker-owned-occ-prism'};const code=fn=>{try{fn();return 'accepted'}catch(e){return e.code||String(e)}};
  const before=c.sketchStorageService.getSketchData(a.id),beforeTarget=c.sketchStorageService.getSketchData(b.id),history=c.craftService.modifications$.value;
  const failures=[code(()=>svc.sketchFace(b)),code(()=>svc.sketchFace2D(b)),code(()=>svc.inPlaceEditor.enter(b)),code(()=>svc.exportFaceToDXF(b)),code(()=>svc.reassignSketch(a.id,b.id)),code(()=>svc.reassignSketch(a.id,b)),code(()=>svc.reassignSketch(b.id,a.id)),code(()=>svc.reassignSketchMode.enter(b.id))];
  const unchanged=svc.inPlaceEditor.inEditMode&&svc.inPlaceEditor.face===a&&before===c.sketchStorageService.getSketchData(a.id)&&beforeTarget===c.sketchStorageService.getSketchData(b.id)&&history===c.craftService.modifications$.value;
  svc.inPlaceEditor.exit();delete b.root.ext.workerGeometry;svc.reassignSketch(a.id,b);const legacyMoved=c.sketchStorageService.getSketchData(a.id)===null&&c.sketchStorageService.getSketchData(b.id)===data;
  return {failures,unchanged,legacyMoved};});
 assert.deepEqual(result.failures,Array(8).fill('WORKER_REPRESENTATION_UNSUPPORTED'));assert.equal(result.unchanged,true);assert.equal(result.legacyMoved,true);console.log('PASS legacy editor/reassign and generated-face pre-mutation guards');
}finally{await context.close();browser.disconnect()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
