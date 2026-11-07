const assert=require('node:assert/strict'),fs=require('node:fs'),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);
if(![base,cdp].every(u=>['127.0.0.1','localhost','[::1]'].includes(u.hostname)))throw Error('Loopback only');
const input=process.env.CODI_PROJECT_INPUT_PATH?JSON.parse(fs.readFileSync(process.env.CODI_PROJECT_INPUT_PATH,'utf8')):JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'../fixtures/project-worker-native-v2.json'),'utf8'));
(async()=>{const b=await puppeteer.connect({browserURL:cdp.href}),c=await b.createBrowserContext();try{
 const p=await c.newPage(),response=await p.goto(base.href),policy=response.headers()['content-security-policy'];assert.match(policy,/script-src 'self' 'wasm-unsafe-eval'/);assert.equal(policy.includes("'unsafe-eval'"),false);
 const result=await p.evaluate(async input=>{
  async function validate(value){return await new Promise((resolve,reject)=>{const w=new Worker('/static/worker.js');let done=false;const finish=(error,value)=>{if(done)return;done=true;clearTimeout(t);w.terminate();error?reject(error):resolve(value)},t=setTimeout(()=>finish(Error('Worker timeout')),15000);w.onerror=e=>finish(Error(e.message+' '+e.filename+':'+e.lineno));w.onmessageerror=()=>finish(Error('Unreadable result'));w.onmessage=e=>{if(typeof e.data?.ok==='boolean')finish(null,e.data)};w.postMessage({blob:new Blob([JSON.stringify(value)],{type:'application/json'})});});}
  const good=await validate(input),bad=await validate({...input,version:999});return {good:good.ok,error:good.error,model:typeof good.storage?.model,sketches:good.storage?.sketches.length,bad:bad.ok};
 },input);assert.equal(result.good,true,JSON.stringify(result));assert.equal(result.model,'string');assert.equal(result.bad,false);console.log('PASS actual project Worker under strict CSP',JSON.stringify(result));
}finally{await c.close();b.disconnect()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
