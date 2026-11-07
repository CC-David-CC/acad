// Actual public circle extrusion followed by the public box command.
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);
for(const u of[base,cdp])assert(['127.0.0.1','localhost'].includes(u.hostname));
const pins=JSON.parse(fs.readFileSync(process.env.CODI_RUNTIME_PINS,'utf8'));
const receipt={source:pins.source,result:'RUNNING',scope:'Public selected-native box continuation preserving exact authored build and accepted inputs. No signed Files or general CAD claim.'};
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:180000});const context=await browser.createBrowserContext();
try{const page=await context.newPage();await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base));await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});
for(const [name,expected]of Object.entries(pins.files)){const response=await fetch(new URL('static/'+name,base));assert.equal(response.status,200);const hash=crypto.createHash('sha256');for await(const b of response.body)hash.update(b);assert.equal(hash.digest('hex'),expected,name);}
receipt.workflow=await page.evaluate(async()=>{const c=__CAD_APP,k=c.craftService,host=new AbortController();c.projectService.bindHostLifetime({signal:host.signal,valid:()=>true});
const snapshot=()=>({history:JSON.stringify(k.modifications$.value),sources:c.sketchStorageService.getAllSketches().map(x=>({id:x.id,data:c.sketchStorageService.getSketchData(x.id)})),outputs:k.inspectWorkerSolids().outputs.map(x=>({id:x.outputId,metrics:x.metrics}))});
const plane=await k.createEmptySketchPlane({revision:k.inspectPrimitiveCreation().revision,unit:'millimeter',plane:'XY',depth:0});await k.appendClosedSketchPrimitive({revision:k.inspectSketchTransitions().revision,faceId:plane.faceId,kind:'Circle',data:{c:{x:0,y:0},r:10},role:null,stage:0});
const info=k.inspectSelectedProfileCommands(),regions=await k.inspectSelectedProfileRegions({revision:info.revision,faceId:plane.faceId,depth:5});
const profile=await k.createSelectedProfileExtrusion({revision:info.revision,faceId:plane.faceId,regionId:regions.regions[0].regionId,unit:'millimeter',engine:'occ',engineRevision:info.engineRevision,depth:5,bodyPolicy:'separate'});
const before=snapshot(),models=k.models$.value;let box,error;
try{box=await k.createWorkerSolidBox({revision:k.inspectWorkerSolids().revision,version:1,unit:'millimeter',engine:'occ',origin:[30,0,0],dimensions:[2,3,4]});}catch(e){error={name:e.name,code:e.code,message:e.message};}
return{profile,before,box,error,after:snapshot(),sameModels:k.models$.value===models};});
const row=receipt.workflow;
if(process.env.CODI_EXPECT_FAILURE){assert.equal(row.error?.code,process.env.CODI_EXPECT_FAILURE);assert.deepEqual(row.after,row.before);assert(row.sameModels);console.log('BASELINE public selected box refused',row.error.code);}
else{assert(!row.error,JSON.stringify(row.error));assert.equal(row.after.outputs.length,2);const history=JSON.parse(row.after.history).history,box=history.at(-1);assert.equal(box.type,'WORKER_SOLID_BOX_V1');assert.equal(box.params.engineRevision,row.profile.engineRevision);assert.deepEqual(row.after.sources,row.before.sources);assert.equal(row.after.outputs[0].metrics.nativeVolume,row.before.outputs[0].metrics.nativeVolume);const result=row.after.outputs.find(x=>x.id===row.box.outputId);assert(Math.abs(result.metrics.nativeVolume-24)<1e-9);assert.equal(result.metrics.nativeValidity.valid,true);console.log('PASS public box retains selected runtime and previous geometry');}
receipt.result='PASS';
}catch(e){receipt.result='FAIL';receipt.error={message:e.message,stack:e.stack};throw e;}
finally{fs.writeFileSync(process.env.CODI_RECEIPT,JSON.stringify(receipt,null,2)+'\n');await context.close();browser.disconnect();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
