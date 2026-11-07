const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer-core');
(async () => {
  const source=fs.readFileSync(path.join(__dirname,'../../web/app/cad/craft/capturePipelineHistory.mjs'));
  const server=http.createServer((req,res)=>{res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'");if(req.url==='/capture.mjs'){res.setHeader('Content-Type','text/javascript');res.end(source)}else{res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>History capture test</title>')}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await puppeteer.connect({browserURL:process.env.CODI_TEST_CDP || 'http://127.0.0.1:19329'}),context=await browser.createBrowserContext();
  try {
    const page=await context.newPage(); await page.goto(`http://127.0.0.1:${server.address().port}/`);
    const result=await page.evaluate(async()=>{
      const {capturePipelineHistory,assertPipelineHistoryCurrent}=await import('/capture.mjs');
      const history=Array.from({length:512},(_,i)=>({type:'FEATURE',params:{index:i,label:'a'.repeat(1024)}}));
      let beats=0;const timer=setInterval(()=>beats++,0),start=performance.now();
      try{const copy=await capturePipelineHistory(history);await assertPipelineHistoryCurrent(history,copy);return {beats,ms:performance.now()-start,count:copy.length,bytes:history.length*1024};}finally{clearInterval(timer)}
    });
    assert.equal(result.count,512);assert.ok(result.bytes>256*1024);assert.ok(result.beats>1);console.log(JSON.stringify(result));
  } finally {await context.close();browser.disconnect();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1});
