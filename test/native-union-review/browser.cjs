// Read-only independent replay of existing pinned native diagnostic artifacts.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const puppeteer=require(process.env.PUPPETEER_CORE_PATH||'/tmp/codi-occt-release-control/node_modules/puppeteer-core');
const specifications={
 baseline:{dir:process.env.CODI_NATIVE_BASELINE_FIXTURE||'/tmp/codi-union-baseline-fixture',file:'baseline-regression',glue:'af32c74530a8fcdd0238726509f43ac4cf00b0621d39a561a3fd1ce9e7cd92f9',wasm:'542c13cabd28ff0a3287c42476e84092f2817e1054430bb4431995ac62ab1803',worker:'414276817a36ad8ba9c28f2b154a9f2048fceac1a9adc82b484b4375b5d38f53'},
 candidate:{dir:process.env.CODI_NATIVE_CANDIDATE_FIXTURE||'/tmp/codi-union-regression-fixture',file:'candidate-regression',glue:'03259700d14562d5dd2736f50864fc3950a5dcc3df9822554374e22beffdfe9d',wasm:'c23fce99b25edd65a145e5ae8f2a69da9a737d64660f1a43c116ee5451a62f4f',worker:'b7033d83162bd0b51bc6f9de69f1cc1c81a82b062f935e83797cc4dc601a9b3a'}
};
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
(async()=>{
 const browser=await puppeteer.connect({browserURL:process.env.CODI_TEST_CDP||'http://127.0.0.1:19329'}),context=await browser.createBrowserContext();
 const receipt={version:1,nativeSource:'8db6c88a9e5a7fe561f77b8a6d6e9fa822dda52e',kernelPatch:'6c99bfcfe6c7b9735a8c617b4207921c64b0555e',scope:'Existing pinned diagnostic native WASM in real Workers; no app provider, fake geometry or native source edits',browser:await browser.version(),runs:{}};
 try {
  for(const [name,spec] of Object.entries(specifications)){
   const assets={};for(const [file,pin] of [[spec.file+'.mjs',spec.glue],[spec.file+'.wasm',spec.wasm],['probe-worker.mjs',spec.worker]]){const bytes=fs.readFileSync(path.join(spec.dir,'static',file));assert.equal(hash(bytes),pin);assets['/static/'+file]=bytes;}
   const csp="default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; object-src 'none'";
   const server=http.createServer((req,res)=>{res.setHeader('Content-Security-Policy',csp);res.setHeader('Cache-Control','no-store');if(req.url==='/'){res.setHeader('Content-Type','text/html');return res.end('<!doctype html><title>native review</title>');}const bytes=assets[req.url];if(!bytes){res.statusCode=404;return res.end();}res.setHeader('Content-Type',req.url.endsWith('.wasm')?'application/wasm':'text/javascript');res.end(bytes);});
   await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
   const page=await context.newPage();
   try{
    const response=await page.goto(`http://127.0.0.1:${server.address().port}/`);assert.equal(response.headers()['content-security-policy'],csp);
    const result=await page.evaluate(wasmSha256=>new Promise((resolve,reject)=>{const w=new Worker('/static/probe-worker.mjs',{type:'module'}),timer=setTimeout(()=>{w.terminate();reject(Error('native review timeout'));},30000);w.onmessage=({data})=>{clearTimeout(timer);w.terminate();data.ok?resolve(data.result):reject(Error(data.error));};w.onerror=e=>{clearTimeout(timer);w.terminate();reject(Error(e.message));};w.postMessage({wasmSha256});}),spec.wasm);
    assert.deepEqual(result,JSON.parse(fs.readFileSync(path.join(__dirname,'owner-'+name+'.json'))));
    receipt.runs[name]={pins:{glue:spec.glue,wasm:spec.wasm,worker:spec.worker},csp,result};
   }finally{await page.close();await new Promise(resolve=>server.close(resolve));}
  }
  const a=receipt.runs.baseline.result,b=receipt.runs.candidate.result,changed=Object.keys(b).filter(k=>JSON.stringify(a[k])!==JSON.stringify(b[k]));assert.deepEqual(changed.sort(),['filled','forward','largeForward']);
  for(const [name,materials,volume]of [['filled',1,1000],['forward',2,2000],['largeForward',1,1000]]){assert.equal(b[name].valid0,true);assert.equal(b[name].valid2,true);assert.equal(b[name].materialRegions,materials);assert.equal(b[name].voidRegions,0);assert.ok(Math.abs(b[name].volume-volume)<1e-8);assert.ok(Math.abs(b[name].meshSignedVolume-volume)<1e-8);}
  receipt.status='pass-bounded-corrections-and-baseline-reproduction';receipt.fullBooleanQualification='not-qualified';receipt.open=['partialForward valid2=false retained','partial fill and island triangle-order discrepancy retained','specialized/infinite/attributed/custom-attribute guard negative controls untested','curved/general topology and app history untested'];
  fs.writeFileSync(process.env.CODI_RECEIPT||path.join(__dirname,'independent-replay.json'),JSON.stringify(receipt,null,2)+'\n');console.log('PASS independent real Worker replay: three bounded corrections; all other exposed records match baseline; general qualification remains open');
 }finally{await context.close();browser.disconnect();}
})().catch(e=>{console.error(e);process.exitCode=1;});
