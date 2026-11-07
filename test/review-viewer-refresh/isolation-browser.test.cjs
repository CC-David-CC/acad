const assert=require('node:assert/strict'),puppeteer=require('puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);
if(![base,cdp].every(u=>['127.0.0.1','localhost','[::1]'].includes(u.hostname)))throw Error('Loopback only');
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href}),context=await browser.createBrowserContext();try{
 const p=await context.newPage(),pageErrors=[];p.on('pageerror',e=>pageErrors.push(e.message));await p.goto(new URL('index-webos.html?DEFAULT&webos=1',base));await p.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});await p.addScriptTag({url:new URL('static/webosTest.bundle.js',base).href});
 const r=await p.evaluate(async()=>{
  window.Cypress={$:s=>{const a=[...document.querySelectorAll(s)];a.index=n=>a.indexOf(n);return a}};
  await webosTest.createPlaneAndOpenSketcher(webosTest.modellerUISubject(__CAD_APP));
  const a=__CAD_APP.services.sketcher.inPlaceEditor.sketcherAppContext.viewer,host=document.createElement('div'),canvas=document.createElement('canvas');host.style.cssText='width:200px;height:200px';host.append(canvas);document.body.append(host);
  const b=new a.constructor(canvas,a.io.constructor,a.applicationContext),frames=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  await frames();let first=0,second=0;const pa=a.repaint,pb=b.repaint;a.repaint=function(){first++;return pa.call(this)};b.repaint=function(){second++;return pb.call(this)};
  for(let n=0;n<100;n++){a.refresh();b.refresh()}await frames();const burst=[first,second];
  first=second=0;a.refresh();b.refresh();a.dispose();await frames();const independent=[first,second];
  second=0;let errors=0;const listener=e=>{if(e.error?.message==='intentional repaint test'||e.message.includes('intentional repaint test')){errors++;e.preventDefault()}};window.addEventListener('error',listener);
  b.repaint=function(){second++;if(second===1)throw Error('intentional repaint test');return pb.call(this)};b.refresh();await frames();b.refresh();await frames();window.removeEventListener('error',listener);const recovered=[errors,second];
  second=0;b.repaint=function(){second++;this.refresh();this.dispose()};b.refresh();await frames();await frames();const disposeDuringPaint=second;host.remove();return {burst,independent,recovered,disposeDuringPaint,disposed:b.isDisposed()};
 });assert.deepEqual(r.burst,[1,1]);assert.deepEqual(r.independent,[0,1]);assert.equal(r.recovered[1],2);assert.ok(pageErrors.some(e=>e.includes('intentional repaint test')));assert.equal(r.disposeDuringPaint,1);assert.equal(r.disposed,true);console.log('PASS independent viewer scheduling, exception recovery, disposal during paint',JSON.stringify(r));
}finally{await context.close();browser.disconnect()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
