const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const puppeteer=require(process.env.PUPPETEER_CORE_PATH);
const source='c9f1d103976a815cef12a0eeb371b61e2442ca85';
const expectedWorker='de90850d961327b206f311460bc3a221091289490e38968cc0df3e27bf985028';
const base=new URL(process.env.JSKETCHER_TEST_URL||'http://127.0.0.1:20584');
const cdp=new URL(process.env.CODI_TEST_CDP||'http://127.0.0.1:19329');
for(const url of [base,cdp])assert.ok(['localhost','127.0.0.1','[::1]'].includes(url.hostname));
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
(async()=>{
 const browser=await puppeteer.connect({browserURL:cdp.href}),context=await browser.createBrowserContext();
 try{
  const page=await context.newPage();
  const response=await page.goto(new URL('/static/index.html',base));
  const csp=response.headers()['content-security-policy'];
  assert.match(csp,/worker-src 'self'/);assert.doesNotMatch(csp,/'unsafe-eval'|blob:/);
  const assets=await page.evaluate(async()=>Object.fromEntries(await Promise.all(['/static/worker.js','/static/verb.js'].map(async path=>{const r=await fetch(path);if(!r.ok)throw Error('Asset '+r.status);const data=await r.arrayBuffer();return [path,Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),b=>b.toString(16).padStart(2,'0')).join('')]}))));
  assert.equal(assets['/static/worker.js'],expectedWorker);
  assert.equal(assets['/static/verb.js'],'55f13091a656c635d1ebe3931a9b52236c65023549b7b69bc8278362f87686f3');
  const results=await page.evaluate(async()=>{
   const violations=[];document.addEventListener('securitypolicyviolation',e=>violations.push(e.violatedDirective));
   let started=0,terminated=0;
   const run=async(id,request,mode='replay')=>{
    const begin=performance.now();
    const before=JSON.stringify(request);
    const result=await new Promise(resolve=>{
     const worker=new Worker('/static/worker.js');started++;
     const finish=result=>{clearTimeout(timer);worker.terminate();terminated++;resolve(result)};
     const timer=setTimeout(()=>finish({transport:'deadline',solverVerdict:false}),8000);
     worker.onmessage=e=>finish(e.data);worker.onerror=e=>finish({transport:'worker-error',message:e.message,solverVerdict:false});
     worker.postMessage({mode,request});
    });
    return {id,elapsedMs:performance.now()-begin,inputJSONUnchanged:before===JSON.stringify(request),result};
   };
   const object=(id,stage=0)=>({id,type:'Segment',role:null,stage,data:{a:{x:0,y:id==='a'?0:20},b:{x:10,y:id==='a'?0:20}}});
   const lock=o=>({typeId:'LockPoint',objects:[o.id+':A'],constants:{x:String(o.data.a.x),y:String(o.data.a.y)},stage:o.stage,annotations:[],admission:{version:1,state:'accepted'}});
   const sketch={version:3,objects:[object('a'),object('b')],dimensions:[],labels:[],stages:[{constraints:[],generators:[]}],constants:'',metadata:{marker:'exact-é',boundaryFrame:{origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]}},boundary:{lines:[],arcs:[],circles:[],nurbses:[]}};
   sketch.stages[0].constraints=sketch.objects.map(lock);
   const req=s=>({revision:'review-current',sketchJSON:JSON.stringify(s),externalParameters:{}});
   const out=[];
   out.push(await run('exact-baseline',req(sketch)));
   out.push(await run('accepted-length', {...req(sketch),intent:{ids:['a','b'],factor:2,offset:0}},'length'));
   const boundary=structuredClone(sketch);boundary.boundary.lines.push({id:'edge',a:{x:0,y:-10},b:{x:100,y:-10}});
   out.push(await run('fixed-boundary', {...req(boundary),intent:{ids:['a','b'],factor:2,offset:0}},'length'));
   const stages=structuredClone(sketch);stages.objects[1].stage=1;stages.stages=[{constraints:[lock(stages.objects[0])],generators:[]},{constraints:[lock(stages.objects[1])],generators:[]}];
   out.push(await run('multistage-length', {...req(stages),intent:{ids:['a','b'],factor:2,offset:0}},'length'));
   const spline=structuredClone(sketch);spline.objects.push({id:'raw',type:'BSpline',role:null,stage:0,data:{degree:2,cPoints:[{id:'splineraw_cPoint0',x:0,y:40},{id:'splineraw_cPoint1',x:10,y:50},{id:'splineraw_cPoint2',x:20,y:40}],fPoints:[],kValues:[0,0,0,1,1,1],interpolation:false,CVModel:false,type:'Clamped',method:-1}});
   out.push(await run('unrelated-raw-spline', {...req(spline),intent:{ids:['a','b'],factor:2,offset:0}},'length'));
   const legacy=structuredClone(sketch);legacy.stages[0].constraints.forEach(c=>delete c.admission);
   out.push(await run('legacy-missing-hint',req(legacy)));
   const wrongHint=structuredClone(sketch);wrongHint.stages[0].constraints[0].admission.state='redundant';
   out.push(await run('changed-explicit-hint',req(wrongHint)));
   const degenerate=structuredClone(sketch);degenerate.objects[0].data.b={...degenerate.objects[0].data.a};
   out.push(await run('degenerate-source',req(degenerate)));
   out.push(await run('malformed-json',{...req(sketch),sketchJSON:'{'}));
   out.push(await run('extra-request-key',{...req(sketch),extra:true}));
   out.push(await run('utf8-over-limit',{...req(sketch),sketchJSON:'é'.repeat(600000)}));
   out.push(await run('external-map',{...req(sketch),externalParameters:new Map([['ignored',1]])}));
   out.push(await run('external-date',{...req(sketch),externalParameters:new Date(0)}));
   out.push(await run('external-typed-array',{...req(sketch),externalParameters:new Float64Array([1])}));
   out.push(await run('external-null-prototype',{...req(sketch),externalParameters:Object.assign(Object.create(null),{X:1})}));
   out.push(await run('revision-getter',{},'getter'));
   out.push(await run('external-getter',{},'external-getter'));
   out.push(await run('external-array',{...req(sketch),externalParameters:[]}));
   return {out,started,terminated,violations,inputSketch:sketch};
  });
  const byId=Object.fromEntries(results.out.map(r=>[r.id,r]));
  for(const row of results.out)assert.equal(row.inputJSONUnchanged,true,row.id);
  for(const name of ['exact-baseline','accepted-length','fixed-boundary','multistage-length','unrelated-raw-spline','external-null-prototype'])assert.equal(byId[name].result.ok,true,JSON.stringify(byId[name]));
  const initial=JSON.parse(byId['exact-baseline'].result.serializedSketch);
  assert.deepEqual(initial,results.inputSketch);
  for(const name of ['accepted-length','fixed-boundary','multistage-length','unrelated-raw-spline']){
   const after=JSON.parse(byId[name].result.serializedSketch);
   assert.deepEqual(after.metadata,initial.metadata,name);
   assert.deepEqual(after.objects.slice(0,2).map(o=>[o.id,o.type,o.role]),initial.objects.map(o=>[o.id,o.type,o.role]),name);
   assert.deepEqual(after.stages.flatMap(s=>s.constraints).filter(c=>c.typeId==='LockPoint').map(c=>c.constants),initial.stages[0].constraints.map(c=>c.constants),name);
   const [a,b]=after.objects;
   const length=o=>Math.hypot(o.data.b.x-o.data.a.x,o.data.b.y-o.data.a.y);
   assert.ok(Math.abs(length(a)-2*length(b))<1e-6,name);
   assert.deepEqual(after.stages.flatMap(s=>s.constraints).filter(c=>c.typeId==='LengthRelation').map(c=>c.objects),[['a','b']],name);
  }
  assert.deepEqual(JSON.parse(byId['unrelated-raw-spline'].result.serializedSketch).objects[2].data,{degree:2,cPoints:[{id:'splineraw_cPoint0',x:0,y:40},{id:'splineraw_cPoint1',x:10,y:50},{id:'splineraw_cPoint2',x:20,y:40}],fPoints:[],kValues:[0,0,0,1,1,1],interpolation:false,CVModel:false,type:'Clamped',method:-1});
  assert.deepEqual(JSON.parse(byId['fixed-boundary'].result.serializedSketch).boundary.lines,[{id:'edge',a:{x:0,y:-10},b:{x:100,y:-10}}]);
  assert.deepEqual(JSON.parse(byId['multistage-length'].result.serializedSketch).objects[0].data,initial.objects[0].data);
  for(const name of ['legacy-missing-hint','changed-explicit-hint','degenerate-source','malformed-json','extra-request-key','utf8-over-limit','external-array','external-map','external-date','external-typed-array'])assert.equal(byId[name].result.ok,false,JSON.stringify(byId[name]));
  for(const name of ['extra-request-key','utf8-over-limit','external-map','external-date','external-typed-array'])assert.equal(byId[name].result.revision,'review-current',name);
  assert.equal(byId['legacy-missing-hint'].result.error.code,'UNSUPPORTED');
  for(const [name,revision] of [['revision-getter',''],['external-getter','get-external']]){assert.equal(byId[name].result.result.ok,false);assert.equal(byId[name].result.result.error.code,'INVALID');assert.equal(byId[name].result.result.revision,revision);assert.equal(byId[name].result.reads,0);}
  assert.equal(results.started,results.terminated);assert.deepEqual(results.violations,[]);
  const receipt={version:1,source,layer:'actual-test-only-browser-worker',fixture:base.href,cdp:cdp.href,browser:await browser.version(),targetId:page.target()._targetId,csp,assets,...results};
  for(const row of receipt.out)if(row.result.serializedSketch){row.outputSha256=sha(row.result.serializedSketch);delete row.result.serializedSketch;delete row.result.evidence;}
  fs.writeFileSync(process.env.CODI_RECEIPT||'test/sketch-transition-review/fixed/browser-receipt.json',JSON.stringify(receipt,null,2)+'\n');
  console.log('PASS bounded real Worker retention/refusal controls',JSON.stringify(receipt.out));
 }finally{await context.close();browser.disconnect();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
