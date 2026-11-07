// Bounded real client/Worker corpus plus actual registered rectangle services.
// No canvas interactions, editor opening, fake solver/storage or UI assertions.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');const puppeteer=require(process.env.PUPPETEER_CORE_PATH||'/tmp/codi-occt-release-control/node_modules/puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL||'http://127.0.0.1:20469/'),cdp=new URL(process.env.CODI_TEST_CDP||'http://127.0.0.1:19329/');
for(const u of [base,cdp])assert.ok(['127.0.0.1','localhost','[::1]'].includes(u.hostname));
const workerURL=new URL('static/sketch-solver.daf07664413b4c37cd6a.js',base).href;
const source={commit:'4a3d7aba490490c1d87bae11be92cb88b962f3e6',appSha256:'4a340ecf3973c88c67d879a697fcb17d7e55e523812aedcd356323be388bfa53',workerSha256:'bfa92a0f627b359aee3f0338a585c3426a9aee6e49caf10f5f187a6702b97893'};
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const wrapper=fs.readFileSync(process.env.CODI_SKETCH_CORPUS_CLIENT||'/tmp/codi-agent-sketch-corpus-client-4a3/client.js');
(async()=>{
 const {cases}=await import(pathToFileURL(path.join(__dirname,'fixtures.mjs'))),{validateWorkerCase,assertGeometry}=await import(pathToFileURL(path.join(__dirname,'oracles.mjs')));
 const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:120000}),context=await browser.createBrowserContext();
 try{
  const page=await context.newPage(),session=await page.createCDPSession(),wrapperURL=new URL('static/agent-sketch-corpus-client-only.js',base).href;
  await session.send('Fetch.enable',{patterns:[{urlPattern:wrapperURL,requestStage:'Request'}]});
  session.on('Fetch.requestPaused',event=>session.send('Fetch.fulfillRequest',{requestId:event.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'text/javascript'}],body:wrapper.toString('base64')}).catch(()=>{}));
  const response=await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base).href),csp=response.headers()['content-security-policy'];assert.ok(csp);
  const scriptPolicy=csp.split(';').find(p=>p.trim().startsWith('script-src'));assert.ok(scriptPolicy.includes("'self'"));assert.doesNotMatch(scriptPolicy,/'unsafe-eval'|'unsafe-inline'/);assert.match(csp,/worker-src[^;]*'self'/);
  await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});
  const served=await page.evaluate(async worker=>{const sha=async url=>{const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error('Asset unavailable');return [...new Uint8Array(await crypto.subtle.digest('SHA-256',await r.arrayBuffer()))].map(n=>n.toString(16).padStart(2,'0')).join('');};return {app:await sha(new URL('static/index.bundle.js',location.href)),worker:await sha(worker)};},workerURL);
  assert.equal(served.app,source.appSha256);assert.equal(served.worker,source.workerSha256);await page.addScriptTag({url:wrapperURL});
  const raw=await page.evaluate(async({entries,workerURL})=>{
   const rows=[],errors=[],violations=[];let started=0,terminated=0;const RealWorker=window.Worker;
   const onError=event=>errors.push(event.reason?.message||event.message||'unhandled rejection'),onViolation=event=>violations.push(event.violatedDirective);
   addEventListener('unhandledrejection',onError);addEventListener('securitypolicyviolation',onViolation);
   window.Worker=class extends RealWorker{constructor(url,...args){super(url,...args);this.counted=new URL(String(url),location.href).href===workerURL;if(this.counted)started++;}terminate(){if(this.counted){this.counted=false;terminated++;}return super.terminate();}};
   const life=new AbortController();let registered;
   try{
    try{
     const app=__CAD_APP,craft=app.craftService;app.projectService.bindHostLifetime({signal:life.signal,valid:()=>!life.signal.aborted});
     const made=await craft.createRectangleSketch({revision:craft.inspectRectangleCreation().revision,unit:'millimeter',origin:[10,20],width:100,height:50,depth:0});
     const original=app.sketchStorageService.getSketchData(made.faceId);
     const edited=await craft.editRectangleDimensions({revision:craft.inspectRectangleCreation().revision,faceId:made.faceId,width:120,height:60});
     const acceptedSource=app.sketchStorageService.getSketchData(made.faceId),before=JSON.stringify(app.projectManager.snapshotCurrentProject()),historyBefore=JSON.stringify(craft.modifications$.value);
     let refusal;try{await craft.editRectangleDimensions({revision:craft.inspectRectangleCreation().revision,faceId:made.faceId,width:0,height:60});}catch(error){refusal={name:error.name,code:error.code||null,message:error.message};}
     const after=JSON.stringify(app.projectManager.snapshotCurrentProject()),historyAfter=JSON.stringify(craft.modifications$.value),sourceAfter=app.sketchStorageService.getSketchData(made.faceId);
     const diagnosticsBefore=JSON.stringify(app.projectManager.snapshotCurrentProject()),service=app.sketchDiagnosticService,info=service.inspect();
     const diagnostic=await service.analyze({revision:info.revision,mode:'saved',faceId:made.faceId});
     registered={made,edited,original,acceptedSource,sourceAfter,before,after,historyBefore,historyAfter,refusal,diagnostic,diagnosticsBefore,diagnosticsAfter:JSON.stringify(app.projectManager.snapshotCurrentProject())};
    }catch(error){registered={error:{name:error.name,code:error.code||null,message:error.message}};}
    for(const entry of entries){
     const request=structuredClone(entry.request);request.revision=crypto.randomUUID();const before=JSON.stringify(request);let result,replay;
     try{
      result=await runSketchCorpusWorker(workerURL,request,{valid:()=>!life.signal.aborted});
      if(result.ok&&entry.expected==='accepted'){
       const solved=result.sketch||JSON.parse(result.serializedSketch),next=request.task==='typed-sketch-transaction'?{...request,revision:crypto.randomUUID(),sketchJSON:JSON.stringify(solved),verifyCurrent:true}:{revision:crypto.randomUUID(),sketch:JSON.parse(JSON.stringify(solved)),boundary:structuredClone(solved.boundary),externalParameters:structuredClone(request.externalParameters||{})};
       replay=await runSketchCorpusWorker(workerURL,next,{valid:()=>!life.signal.aborted});
      }
     }catch(error){result={ok:false,transportError:true,error:{code:error.name,message:error.message}};}
     rows.push({id:entry.id,before,after:JSON.stringify(request),result,...(replay?{replay}:{})});
    }
    return {registered,rows,started,terminated,violations,unhandledRejections:errors};
   }finally{life.abort();window.Worker=RealWorker;removeEventListener('unhandledrejection',onError);removeEventListener('securitypolicyviolation',onViolation);}
  },{entries:cases,workerURL});
  assert.equal(raw.started,raw.terminated,'Worker leak');assert.deepEqual(raw.violations,[]);assert.deepEqual(raw.unhandledRejections,[]);
  const evidence={version:1,source,workerURL,csp,wrapperSha256:digest(wrapper),clientSourceSha256:digest(fs.readFileSync(path.join(__dirname,'../../../web/app/sketcher/headless/client.ts'))),fixturesSha256:digest(fs.readFileSync(path.join(__dirname,'fixtures.mjs'))),...raw};
  const items=cases.map((entry,index)=>{
   let check;try{check=validateWorkerCase(entry,raw.rows[index]);}catch(error){check={status:'fail',message:error.message};}
   return {id:'SKETCH-'+entry.id.slice('sketch.'.length).toUpperCase().replaceAll('.','-'),subsystem:['rejected','truthful-redundancy'].includes(entry.expected)?'constraints':'geometry',priority:'P0',level:'CAD1',layer:'browser-worker',backend:'shared',status:check.status,expected:{behavior:entry.expected,oracle:entry.oracle,reason:entry.reason||null},actual:{ok:raw.rows[index].result.ok,error:raw.rows[index].result.error||null,admission:raw.rows[index].result.evidence?.map(row=>({typeId:row.typeId,state:row.state})),check},evidence:[{file:'receipt.json',record:index}],scope:'Production client + actual installed disposable sketch Worker. Refusal immutability covers caller request only; no live editor/history rollback or physical DOF inferred.'};
  });
  const expectedById={'SKETCH-P0-REGISTERED-RECTANGLE-ACCEPTED-EDIT':'Anchored rectangle100x50 becomes120x60 through the real registered model service','SKETCH-P0-REGISTERED-RECTANGLE-REJECTED-EXACT-STATE':'Width0 refuses and exact accepted native project, source and history bytes remain unchanged','SKETCH-P0-SAVED-DIAGNOSTICS-READONLY':'Saved diagnostic inspection returns its scoped local estimate without changing the native project'};
  const appRow=(id,work,scope)=>{let status='pass',actual;try{actual=work();}catch(error){status='fail';actual={message:error.message,serviceError:raw.registered.error||null};}items.push({id,subsystem:'history',priority:'P0',level:'CAD1',layer:'subsystem',backend:'shared',status,expected:expectedById[id],actual,evidence:[{file:'receipt.json',record:'registered'}],scope});};
  appRow('SKETCH-P0-REGISTERED-RECTANGLE-ACCEPTED-EDIT',()=>{assert.ok(!raw.registered.error,JSON.stringify(raw.registered.error));assertGeometry(JSON.parse(raw.registered.original),{kind:'rectangle',origin:[10,20],width:100,height:50});assertGeometry(JSON.parse(raw.registered.acceptedSource),{kind:'rectangle',origin:[10,20],width:120,height:60});return {edited:raw.registered.edited};},'Actual registered craft create/edit service and installed Worker, headlessly via API; no signed external agent transport or UI assertion.');
  appRow('SKETCH-P0-REGISTERED-RECTANGLE-REJECTED-EXACT-STATE',()=>{const r=raw.registered;assert.ok(r.refusal,'Invalid edit accepted');assert.equal(r.before,r.after,'Native source/metadata/counters changed');assert.equal(r.historyBefore,r.historyAfter,'History changed');assert.equal(r.acceptedSource,r.sourceAfter,'Stored sketch bytes changed');return {refusal:r.refusal,nativeBytesUnchanged:true,historyBytesUnchanged:true,sketchBytesUnchanged:true};},'Invalid dimension edit (width0), not a solver contradiction. Exact accepted real project/source/history state, including serialized metadata/counters.');
  appRow('SKETCH-P0-SAVED-DIAGNOSTICS-READONLY',()=>{const r=raw.registered;assert.equal(r.diagnosticsBefore,r.diagnosticsAfter);assert.equal(r.diagnostic.scope,'current-sketch-local-estimate');assert.ok(Array.isArray(r.diagnostic.admission));return {scope:r.diagnostic.scope,status:r.diagnostic.status,unchanged:true};},'Actual saved diagnostic service; local differential estimate only, never a certified physical DOF count.');
  for(const [id,subsystem,reason]of [['SKETCH-P0-LIVE-CONTRADICTORY-CONSTRAINT-ROLLBACK','history','Live constraint-edit rollback through signed agent transport was not invoked; Worker input immutability is not document rollback.'],['SKETCH-P0-CONSISTENT-NUMERICAL-NONCONVERGENCE','constraints','No independently consistent problem with genuine numerical nonconvergence was established; SOLVE_FAILED is not automatically an inconsistency certificate.'],['SKETCH-P0-PHYSICAL-DOF-CERTIFICATION','constraints','No physical DOF result qualified. Equation counts and local Jacobian rank were not used as physical DOF.']])items.push({id,subsystem,priority:'P0',level:'CAD1',layer:'subsystem',backend:'shared',status:'not-tested',expected:reason,actual:null,evidence:[],scope:reason});
  const fragment={version:1,source,cases:items};
  const output=process.env.CODI_SKETCH_CORPUS_OUTPUT||'/tmp/codi-agent-sketch-corpus-4a3';fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'receipt.json'),JSON.stringify(evidence,null,2)+'\n');fs.writeFileSync(path.join(output,'fragment.json'),JSON.stringify(fragment,null,2)+'\n');
  console.log(JSON.stringify({output,workerStarted:raw.started,workerTerminated:raw.terminated,statuses:Object.fromEntries(['pass','fail','unsupported','not-tested'].map(s=>[s,items.filter(c=>c.status===s).length])),failures:items.filter(c=>c.status==='fail').map(c=>({id:c.id,actual:c.actual}))},null,2));
 }finally{await context.close();browser.disconnect();}
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
