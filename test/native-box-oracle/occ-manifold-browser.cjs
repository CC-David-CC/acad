// Same48 mathematical expressions, current byte-pinned production Workers.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const puppeteer=require(process.env.PUPPETEER_CORE_PATH||'/tmp/codi-occt-release-control/node_modules/puppeteer-core');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),root=process.env.CODI_ENGINE_BOX_ASSETS||'/tmp/codi-occ-manifold-box-assets-20261105';
const specs={occ:{worker:'26c2191e2f952d2dfb62768aec971b847ed50165cd767987eb3ab1e4115052f5',wasm:'07d763a05f35cd257501d339d9087df63c65bcaeb51a4f4f80832e333892e12e',glue:'a84b31900e58e61a1d7e3f8d04978408455764ad149923359e7fba19d3d07884'},manifold:{worker:'35876bd7cd773b5eb243fde935599afb670314c192ba77ec11036dcb12aa79e4',wasm:'7bb5f8ee10fcafdab78799b1e5dd2cdc7c282ea0bf8e7939c43f3ad34b823e3d',glue:'cd2031fd75cbbc812b550dd228f95b9fd666ae4da6557f840e3d3ed4cbed268b'}};
const caseTimeoutMs=10000,totalBudgetMs=180000;
function assess(row,engine){
 if(row.oracle?.boundaryOnlyNonempty)return {status:'not-tested',reason:'Boundary-only topology remains outside volumetric oracle'};
 if(row.error||!row.native)return {status:'fail',reason:'Production Worker failure/refusal',error:row.error};
 const n=row.native,o=row.oracle,v=engine==='occ'?n.signedVolume:n.volume;
 const bounds=o.bounds===null?n.bounds===null:['min','max'].every(k=>Array.isArray(n.bounds?.[k])&&n.bounds[k].length===3&&n.bounds[k].every((x,i)=>Number.isFinite(x)&&Math.abs(x-o.bounds[k][i])<=1e-7));
 const checks={volume:Number.isFinite(v)&&Math.abs(v-o.volume)<=Math.max(1e-7,Math.abs(o.volume)*1e-9),bounds,sourcesUnchanged:row.sourcesUnchanged===true,kernelStatus:engine==='occ'?n.nativeValidity?.method==='occ-inspect-analytic-v1'&&n.nativeValidity.valid===true:n.nativeStatus==='NoError'};
 return {status:Object.values(checks).every(x=>x===true)?'pass':'fail',checks,measuredVolume:v,volumeQuality:n.volumeQuality,nativeFacts:{solidCount:n.solidCount??null,nativeTopology:n.nativeTopology??null,meshComponents:n.meshComponents??null,materialRegions:n.materialRegions??null,voidRegions:n.voidRegions??null},scope:'Kernel partition/component counts are recorded, not equated to material/void cell floods'};
}
(async()=>{
 const {cases,SEED}=await import('./cases.mjs'),rows=cases(),browser=await puppeteer.connect({browserURL:process.env.CODI_TEST_CDP||'http://127.0.0.1:19329',protocolTimeout:200000}),context=await browser.createBrowserContext();
 const report={version:1,source:'147814d8400de9d14d3718980f3e17b85241bcde',seed:SEED,browser:await browser.version(),scope:'Current production OCC/Manifold Workers via raw protocol; test orchestration + exact cell oracle in a parent Worker; no app UI/Canvas/history/parity/default qualification',budget:{caseCountPerEngine:48,caseTimeoutMs,totalBudgetMs,maxCreatedNames:8},testSources:Object.fromEntries(['cases.mjs','cells.mjs','bounds.mjs','engine-case-worker.mjs','occ-manifold-browser.cjs'].map(f=>[f,hash(fs.readFileSync(path.join(__dirname,f)))])),cases:rows,engines:{}};
 const deadline=Date.now()+totalBudgetMs;
 try{
  for(const [engine,pins]of Object.entries(specs)){
   const assets={};for(const f of ['cells.mjs','bounds.mjs','engine-case-worker.mjs'])assets['/'+f]=fs.readFileSync(path.join(__dirname,f));
   for(const [file,route,pin]of [['worker.js','/native-worker.js',pins.worker],['kernel.wasm','/kernel.wasm',pins.wasm]]){const bytes=fs.readFileSync(path.join(root,engine,file));assert.equal(hash(bytes),pin);assets[route]=bytes;}
   const csp="default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; object-src 'none'",server=http.createServer((req,res)=>{res.setHeader('Content-Security-Policy',csp);res.setHeader('Cache-Control','no-store');if(req.url==='/'){res.setHeader('Content-Type','text/html');return res.end('<!doctype html><title>bounded kernel cell oracle</title>');}const bytes=assets[req.url];if(!bytes){res.statusCode=404;return res.end();}res.setHeader('Content-Type',req.url.endsWith('.wasm')?'application/wasm':'text/javascript');res.end(bytes);});
   await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const page=await context.newPage(),result={pins,csp,rows:[]};report.engines[engine]=result;
   try{
    const response=await page.goto(`http://127.0.0.1:${server.address().port}/`);assert.equal(response.headers()['content-security-policy'],csp);
    for(const row of rows){
     const remaining=deadline-Date.now();if(remaining<=0)throw Error('Total experiment time budget exceeded');
     const out=await page.evaluate(({row,engine,pins,timeout})=>new Promise(resolve=>{const w=new Worker('/engine-case-worker.mjs',{type:'module'}),timer=setTimeout(()=>{w.terminate();resolve({id:row.id,engine,error:{message:'Case deadline exceeded'}});},timeout);w.onmessage=({data})=>{clearTimeout(timer);w.terminate();resolve(data);};w.onerror=e=>{clearTimeout(timer);w.terminate();resolve({id:row.id,engine,error:{message:e.message}});};w.postMessage({row,engine,pins});}),{row,engine,pins,timeout:Math.min(caseTimeoutMs,remaining)});
     out.assessment=assess(out,engine);result.rows.push(out);
    }
   }finally{await page.close();await new Promise(resolve=>server.close(resolve));}
  }
  report.summary=Object.fromEntries(Object.entries(report.engines).map(([engine,result])=>[engine,{pass:result.rows.filter(r=>r.assessment.status==='pass').length,fail:result.rows.filter(r=>r.assessment.status==='fail').length,notTested:result.rows.filter(r=>r.assessment.status==='not-tested').length,maxCreatedNames:Math.max(...result.rows.map(r=>r.created||0))}]));
  report.status=Object.values(report.summary).some(r=>r.fail)?'fail':'pass-with-six-boundary-exclusions-per-engine';
  fs.writeFileSync(process.env.CODI_RECEIPT||path.join(__dirname,'occ-manifold-receipt.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,summary:report.summary}));if(report.status==='fail')process.exitCode=1;
 }finally{await context.close();browser.disconnect();}
})().catch(e=>{console.error(e);process.exitCode=1;});
