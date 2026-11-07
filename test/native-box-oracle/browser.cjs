// Bounded direct-native experiment; a PASS harness can contain native failures.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const puppeteer=require(process.env.PUPPETEER_CORE_PATH||'/tmp/codi-occt-release-control/node_modules/puppeteer-core');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex'),root=process.env.CODI_BOX_ORACLE_ASSETS||'/tmp/codi-native-box-oracle-assets-20261105';
const specs={baseline:{wasm:'4d35fd5b3a37e500d79388523329d5e61560fcd80cb963b2824533d6cf0f8f21'},candidate:{wasm:'f33f19cd0098b610756db70ae0d25ac1dcba315e9af9eb90e387d0668be90daa'}};
const glue='8e49622c97d839cf94d6c4d5e2de6cbd96d1166075741e08dcbda3b1a223d8fa',caseTimeoutMs=6000,totalBudgetMs=120000;
function assess(row){
 if(row.oracle?.boundaryOnlyNonempty)return {status:'not-tested',reason:'Boundary-only topology is outside positive-volume cell oracle'};
 if(row.error||!row.native||row.native.error)return {status:'fail',reason:'Native failure/refusal',error:row.error||row.native};
 const o=row.oracle,n=row.native,checks={valid0:n.validLevel0===true,valid2:o.volume===0?n.empty===true:n.validLevel2===true,materialRegions:n.materialRegions===o.materialRegions,voidRegions:n.voidRegions===o.voidRegions,sourcesUnchanged:row.sourcesUnchanged===true};
 const definedVolume=o.volume===0||n.manifoldPredicate===true;
 checks.volume=definedVolume?Number.isFinite(n.volume)&&Math.abs(n.volume-o.volume)<=Math.max(1e-8,Math.abs(o.volume)*1e-9):null;
 return {status:Object.values(checks).some(x=>x===false)?'fail':'pass',checks,volumeScope:definedVolume?'defined-native-volume-vs-exact-integer':'native-nonmanifold-volume-skipped'};
}
(async()=>{
 const {cases,SEED}=await import('./cases.mjs'),rows=cases(),browser=await puppeteer.connect({browserURL:process.env.CODI_TEST_CDP||'http://127.0.0.1:19329',protocolTimeout:150000}),context=await browser.createBrowserContext();
 const report={version:1,seed:SEED,budget:{caseCount:48,caseTimeoutMs,totalBudgetMs,maxBoxes:6,maxCells:4096,maxNativeOperations:20},nativeSource:{baselineBinding:'e854d6ced3886c8533cea06dd5506e2385fdf6c1',candidateKernel:'6c99bfcfe6c7b9735a8c617b4207921c64b0555e',providerSource:'unchanged e854 binding linked against6c99 source-built libraries'},scope:'Direct native API and independent exact integer-cell Worker oracle; no tessellation, app/provider guard or history qualification',browser:await browser.version(),cases:rows,variants:{},testSources:Object.fromEntries(['cells.mjs','cases.mjs','worker.mjs','browser.cjs'].map(f=>[f,hash(fs.readFileSync(path.join(__dirname,f)))]))};
 const deadline=Date.now()+totalBudgetMs;
 try{
  for(const [variant,spec]of Object.entries(specs)){
   const assets={};for(const f of ['cells.mjs','worker.mjs'])assets['/'+f]=fs.readFileSync(path.join(__dirname,f));
   for(const [file,pin]of [['raw-provider.mjs',glue],['raw-provider.wasm',spec.wasm]]){const bytes=fs.readFileSync(path.join(root,variant,file));assert.equal(hash(bytes),pin);assets['/'+file]=bytes;}
   const csp="default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; object-src 'none'",server=http.createServer((req,res)=>{res.setHeader('Content-Security-Policy',csp);res.setHeader('Cache-Control','no-store');if(req.url==='/'){res.setHeader('Content-Type','text/html');return res.end('<!doctype html><title>bounded native box oracle</title>');}const bytes=assets[req.url];if(!bytes){res.statusCode=404;return res.end();}res.setHeader('Content-Type',req.url.endsWith('.wasm')?'application/wasm':'text/javascript');res.end(bytes);});
   await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const page=await context.newPage(),result={pins:{glue,wasm:spec.wasm},csp,rows:[]};report.variants[variant]=result;
   try{
    const response=await page.goto(`http://127.0.0.1:${server.address().port}/`);assert.equal(response.headers()['content-security-policy'],csp);
    for(const row of rows){
     const remaining=deadline-Date.now();if(remaining<=0)throw Error('Fixed total test budget exceeded');
     const out=await page.evaluate(({row,wasmSha256,timeout})=>new Promise(resolve=>{const w=new Worker('/worker.mjs',{type:'module'}),timer=setTimeout(()=>{w.terminate();resolve({id:row.id,error:{message:'Worker timeout'}});},timeout);w.onmessage=({data})=>{clearTimeout(timer);w.terminate();resolve(data);};w.onerror=e=>{clearTimeout(timer);w.terminate();resolve({id:row.id,error:{message:e.message}});};w.postMessage({row,wasmSha256});}),{row,wasmSha256:spec.wasm,timeout:Math.min(caseTimeoutMs,remaining)});
     out.assessment=assess(out);result.rows.push(out);
    }
   }finally{await page.close();await new Promise(resolve=>server.close(resolve));}
  }
  report.comparison=rows.map((row,i)=>{
   const a=report.variants.baseline.rows[i],b=report.variants.candidate.rows[i],nativeChanged=JSON.stringify(a.native)!==JSON.stringify(b.native)||JSON.stringify(a.error)!==JSON.stringify(b.error);
   const newlyFailedChecks=Object.keys(a.assessment.checks||{}).filter(k=>a.assessment.checks[k]===true&&b.assessment.checks?.[k]===false);
   const classification=a.assessment.status==='not-tested'||b.assessment.status==='not-tested'?'boundary-scope-not-qualified':a.assessment.status==='pass'&&b.assessment.status==='fail'||newlyFailedChecks.length?'new-regression':a.assessment.status==='fail'&&b.assessment.status==='pass'?'corrected':a.assessment.status==='fail'?(nativeChanged?'changed-baseline-failure':'baseline-failure-retained'):'both-pass';
   return {id:row.id,baseline:a.assessment.status,candidate:b.assessment.status,classification,newlyFailedChecks,nativeChanged};
  });
  report.counts=Object.fromEntries([...new Set(report.comparison.map(r=>r.classification))].map(k=>[k,report.comparison.filter(r=>r.classification===k).length]));report.status='completed-bounded-experiment';report.correctness=report.comparison.some(r=>r.candidate==='fail')?'fail':'pass-with-boundary-exclusions';
  fs.writeFileSync(process.env.CODI_RECEIPT||path.join(__dirname,'receipt.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,correctness:report.correctness,counts:report.counts}));
  if(report.comparison.some(r=>['new-regression','changed-baseline-failure'].includes(r.classification)))process.exitCode=1;
 }finally{await context.close();browser.disconnect();}
})().catch(e=>{console.error(e);process.exitCode=1;});
