const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),puppeteer=require('puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);
if(![base,cdp].every(url=>['localhost','127.0.0.1','[::1]'].includes(url.hostname)))throw Error('Loopback fixture only.');
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:120000}),context=await browser.createBrowserContext();try{
 const page=await context.newPage(),session=await page.createCDPSession(),client=fs.readFileSync(process.env.CODI_INSPECTION_CLIENT),worker=fs.readFileSync(process.env.CODI_INSPECTION_WORKER),clientURL=new URL('/static/closed-inspection-test-client.js',base).href,workerURL=new URL('/static/closed-inspection-test-worker.js',base).href;
 await session.send('Fetch.enable',{patterns:[{urlPattern:clientURL,requestStage:'Request'},{urlPattern:workerURL,requestStage:'Request'}]});
 session.on('Fetch.requestPaused',event=>session.send('Fetch.fulfillRequest',{requestId:event.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'text/javascript'}],body:(event.request.url===clientURL?client:worker).toString('base64')}));
 const response=await page.goto(base.href);assert.match(response.headers()['content-security-policy'],/worker-src 'self'/);assert.doesNotMatch(response.headers()['content-security-policy'],/script-src[^;]*'unsafe-eval'|worker-src[^;]*blob:/);await page.addScriptTag({url:clientURL});
 const result=await page.evaluate(async url=>{
  const Native=window.Worker;let starts=0,terminations=0;window.Worker=class extends Native{constructor(...args){super(...args);starts++}terminate(){terminations++;return super.terminate()}};
  try{
   const frame={origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]},created=await solveClosedSketchFixture(url,{task:'rectangle',revision:'draft',unit:'millimeter',frame,origin:[0,0],width:100,height:50});if(!created.ok)throw Error(JSON.stringify(created));
   const source=created.serializedSketch,input={revision:'inspect',sketchJSON:source,externalParameters:{}};
   let release,started;const acquired=new Promise(resolve=>started=resolve),lock=navigator.locks.request('codi-sketch-solve-v1',async()=>{started();await new Promise(resolve=>release=resolve)});await acquired;
   let ticks=0,last=performance.now(),maxGap=0;const timer=setInterval(()=>{const now=performance.now();maxGap=Math.max(maxGap,now-last);last=now;ticks++},5);
   const pending=inspectClosedSketchWorker(url,input);input.revision='mutated';input.sketchJSON='{}';input.externalParameters.changed=7;
   await new Promise(resolve=>setTimeout(resolve,30));release();await lock;const inspection=await pending;clearInterval(timer);
   const frozen=Object.isFrozen(inspection)&&Object.isFrozen(inspection.objects)&&inspection.objects.every(Object.isFrozen)&&Object.isFrozen(inspection.constraints)&&inspection.constraints.every(row=>Object.isFrozen(row)&&Object.isFrozen(row.objects)&&Object.isFrozen(row.constants)&&Object.isFrozen(row.admission))&&Object.isFrozen(inspection.boundaryFrame.origin);
   const malformed=await inspectClosedSketchWorker(url,{revision:'bad',sketchJSON:'{}',externalParameters:{}}),withoutFrame=JSON.parse(source);delete withoutFrame.metadata.boundaryFrame;
   const absentFrame=await inspectClosedSketchWorker(url,{revision:'frame',sketchJSON:JSON.stringify(withoutFrame),externalParameters:{}});
   const controller=new AbortController(),cancelled=await inspectClosedSketchWorker(url,{revision:'abort',sketchJSON:source,externalParameters:{}},{signal:controller.signal,valid:()=>{controller.abort();return true}}).then(()=>false,error=>error.name==='AbortError');
   const frameAfter=JSON.parse(source).metadata.boundaryFrame;
   return {inspection,malformed,absentFrame,cancelled,frozen,starts,terminations,ticks,maxGap,sourceUnchanged:JSON.stringify(frameAfter)===JSON.stringify(frame)};
  }finally{window.Worker=Native}
 },workerURL);
 assert.equal(result.inspection.revision,'inspect');assert.equal(result.inspection.ok,true);assert.equal(result.inspection.objects.length,4);assert.equal(result.inspection.constraints.length,11);assert.equal(result.inspection.emptyBoundary,true);
 assert.deepEqual(result.inspection.objects.map(row=>row.id),['rect-0','rect-1','rect-2','rect-3']);assert.equal(result.malformed.ok,false);assert.equal(result.absentFrame.ok,false);assert.equal(result.absentFrame.error.code,'FRAME_UNAVAILABLE');assert.ok(result.frozen&&result.cancelled&&result.sourceUnchanged&&result.ticks>0);assert.equal(result.starts,result.terminations);
 const receipt={clientSha256:crypto.createHash('sha256').update(client).digest('hex'),workerSha256:crypto.createHash('sha256').update(worker).digest('hex'),...result};if(process.env.CODI_INSPECTION_RECEIPT)fs.writeFileSync(process.env.CODI_INSPECTION_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log('PASS actual Worker inspection, captured input, IDs, currentness, frozen output and cleanup',JSON.stringify(receipt));
 }finally{await context.close();browser.disconnect()}})().catch(error=>{console.error(error.stack);process.exitCode=1});
