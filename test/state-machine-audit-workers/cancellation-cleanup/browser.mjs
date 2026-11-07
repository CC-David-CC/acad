// Real Chromium native/cross-realm cancellation, synthetic error-only transport.
import http from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import puppeteer from '/tmp/codi-occt-release-control/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../..');
const server=http.createServer(async(req,res)=>{try{const path=resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(req.url==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Cancellation error-only contract</title>');return;}if(!path.startsWith(root+sep))throw Error('path');const bytes=await readFile(path);res.setHeader('Content-Type','text/javascript');res.end(bytes);}catch{res.statusCode=404;res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser,context;
try{
 browser=await puppeteer.connect({browserURL:process.env.CDP_URL||'http://127.0.0.1:19329'});context=await browser.createBrowserContext();const page=await context.newPage();await page.goto(`http://127.0.0.1:${server.address().port}/`);
 const rows=await page.evaluate(async()=>{
  const {fixture,box}=await import('/test/state-machine-audit-workers/cancellation-cleanup/fixture.mjs');
  const iframe=document.createElement('iframe');document.body.append(iframe);const ForeignAbortController=iframe.contentWindow.AbortController,rows=[];
  if(ForeignAbortController===AbortController)throw Error('not a distinct native realm');
  const check=(b,m)=>{if(!b)throw Error(m);};
  for(const foreign of [false,true]){
   const Controller=foreign?ForeignAbortController:AbortController;
   {const c=new Controller(),f=fixture({timeoutMs:1000});await f.mount.ready;const p=f.mount.execute(box,{signal:c.signal});c.abort();let error;try{await p;}catch(e){error=e;}check(error?.code==='CANCELLED','native abort');check(f.worker.terminations===1,'one termination');f.mount.close();rows.push({case:'ordinary native abort',foreign,code:error.code});}
   {const c=new Controller(),cause=Error('overridden add'),f=fixture({timeoutMs:1000});Object.defineProperty(c.signal,'addEventListener',{value(){throw cause;}});await f.mount.ready;let error;try{await f.mount.execute(box,{signal:c.signal});}catch(e){error=e;}check(error?.code==='ENGINE_FAILURE'&&error.cause===cause,'add exact cause');check(f.worker.messages.length===1&&f.worker.terminations===1,'setup retirement');f.mount.close();rows.push({case:'overridden native add',foreign,code:error.code,noJobPosted:true});}
   {const c=new Controller(),cause=Error('overridden remove'),f=fixture({timeoutMs:1000});Object.defineProperty(c.signal,'removeEventListener',{value(){throw cause;}});await f.mount.ready;const p=f.mount.execute(box,{signal:c.signal});f.emitError();let error;try{await p;}catch(e){error=e;}check(error?.code==='MEASUREMENT_PRECISION_UNRESOLVED','original typed Worker failure');let cleanup;try{f.mount.close();}catch(e){cleanup=e;}check(cleanup===cause&&f.worker.terminations===1,'exact cleanup');rows.push({case:'overridden native remove',foreign,code:error.code,cleanupExact:true});}
  }
  iframe.remove();return rows;
 });
 const source=await readFile(resolve(root,'modules/engine/mount/worker-controller.mjs'));const receipt={status:'PASS',scope:'Chromium native signals including genuine distinct iframe realm; transport/error-only; no native geometry',browser:await browser.version(),controllerSha256:createHash('sha256').update(source).digest('hex'),rows};
 await context.close();context=null;receipt.ownedContextClosed=true;await writeFile(process.argv[2]||'/tmp/controller-cancel-browser.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
}finally{if(context)await context.close();if(browser)await browser.disconnect();await new Promise(r=>server.close(r));}
