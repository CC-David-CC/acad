// Disposable loopback-only 128 MiB import/responsiveness probe; no product data.
const assert=require('node:assert/strict');
const puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL||'http://127.0.0.1:19336/'),cdp=new URL(process.env.CODI_TEST_CDP||'http://127.0.0.1:19335/');
const mode=process.env.CODI_PERF_CASE||'unknown-padding';
for(const u of [base,cdp])if(!['127.0.0.1','localhost','[::1]'].includes(u.hostname))throw Error('Loopback only');
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:180000}),context=await browser.createBrowserContext();try{
 const page=await context.newPage();await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base).href,{waitUntil:'domcontentloaded'});await page.waitForFunction('window.__CAD_APP?.streams?.lifecycle?.projectLoaded?.value === true',{timeout:90000});
 const result=await page.evaluate(async mode=>{
  const e=__CAD_APP.projectManager.snapshotCurrentProject();let blob;
  if(mode==='unknown-padding'){
   e.project.model.padding='MARKER_PADDING';const encoded=JSON.stringify(e),needle='MARKER_PADDING',at=encoded.indexOf(needle),head=encoded.slice(0,at),tail=encoded.slice(at+needle.length);
   const target=128*1024*1024-4096,repeat=target-head.length-tail.length,chunk='x'.repeat(1024*1024),parts=[head];let left=repeat;while(left>0){const n=Math.min(left,chunk.length);parts.push(n===chunk.length?chunk:chunk.slice(0,n));left-=n}parts.push(tail);blob=new Blob(parts,{type:'application/json'});
  }else if(mode==='supported-sketch'){
   const objects=Array.from({length:2000},(_,i)=>({id:String(i+1),type:'Segment',role:null,stage:0,data:{a:{x:i,y:0},b:{x:i+1,y:1}}}));
   e.project.sketches=[{id:'synthetic-large-sketch',data:{version:3,objects,dimensions:[],labels:[],stages:[{constraints:[],generators:[]}],constants:''}}];blob=new Blob([JSON.stringify(e)],{type:'application/json'});
  }else throw Error('Unknown probe mode');
  const gaps=[],events=[],longTasks=[],begin=performance.now(),Native=window.Worker,parse=JSON.parse,stringify=JSON.stringify;
  let last=begin;const timer=setInterval(()=>{const now=performance.now();gaps.push(now-last);last=now},20);
  const observer=new PerformanceObserver(list=>list.getEntries().forEach(x=>longTasks.push({startMs:Math.round(x.startTime-begin),durationMs:Math.round(x.duration)})));observer.observe({entryTypes:['longtask']});
  for(const [name,original] of [['parse',parse],['stringify',stringify]])JSON[name]=function(...args){const t=performance.now();try{return original.apply(this,args)}finally{const d=performance.now()-t;if(d>20)events.push({operation:'JSON.'+name,startMs:Math.round(t-begin),durationMs:Math.round(d)})}};
  window.Worker=class extends Native {constructor(...args){super(...args);this.addEventListener('message',e=>{if(e.data?.progress==='started'||e.data?.ok===true)events.push({operation:e.data?.ok?'worker-result':'worker-started',startMs:Math.round(performance.now()-begin)})})}};
  let outcome='ok';try{await __CAD_APP.projectManager.restoreSnapshotBytesInEmptyWorkspace(blob)}catch(error){outcome=String(error)}await new Promise(r=>setTimeout(r,25));clearInterval(timer);observer.disconnect();window.Worker=Native;JSON.parse=parse;JSON.stringify=stringify;
  return {mode,bytes:blob.size,elapsedMs:Math.round(performance.now()-begin),maxTimerGapMs:Math.round(Math.max(0,...gaps)),samples:gaps.length,longTasks,events,outcome};
 },mode);console.log(JSON.stringify(result));
 if(mode==='unknown-padding'){assert.equal(result.bytes,128*1024*1024-4096);assert.match(result.outcome,/unsupported project structure/i)}else assert.equal(result.outcome,'ok');
 }finally{await context.close();browser.disconnect()}})().catch(e=>{console.error(e);process.exitCode=1});
