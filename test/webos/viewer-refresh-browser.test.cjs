// Real viewer/Canvas, not a fake browser or worker renderer.
const assert=require('node:assert/strict'),fs=require('node:fs'),puppeteer=require('puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP),coalesced=process.env.CODI_EXPECT_COALESCED==='1';
if(![base,cdp].every(u=>['127.0.0.1','localhost','[::1]'].includes(u.hostname)))throw Error('Loopback only');
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href}),ctx=await browser.createBrowserContext();
try{const p=await ctx.newPage();await p.goto(new URL('index-webos.html?DEFAULT&webos=1',base));await p.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});await p.addScriptTag({url:new URL('static/webosTest.bundle.js',base).href});
const r=await p.evaluate(async()=>{
 window.Cypress={$:s=>{const a=[...document.querySelectorAll(s)];a.index=n=>a.indexOf(n);return a;}};
 await webosTest.createPlaneAndOpenSketcher(webosTest.modellerUISubject(__CAD_APP));
 const v=__CAD_APP.services.sketcher.inPlaceEditor.sketcherAppContext.viewer,frames=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 await frames();let paints=0;const original=v.repaint;v.repaint=function(){paints++;return original.call(this);};
 for(let i=0;i<512;i++)v.refresh();await frames();const burst=paints;
 paints=0;v.repaint=function(){paints++;if(paints===1)this.refresh();return original.call(this);};v.refresh();await frames();await frames();const reentrant=paints;
 paints=0;v.repaint=function(){paints++;return original.call(this);};v.refresh();v.dispose();await frames();v.refresh();await frames();return {burst,reentrant,disposedPaints:paints,disposed:v.isDisposed()};
});assert.equal(r.burst,coalesced?1:512);assert.equal(r.reentrant,2);assert.equal(r.disposedPaints,0);assert.equal(r.disposed,true);if(process.env.CODI_RECEIPT)fs.writeFileSync(process.env.CODI_RECEIPT,JSON.stringify(r,null,2)+'\n');console.log('PASS actual viewer refresh scheduling',JSON.stringify(r));
}finally{await ctx.close();browser.disconnect();}})().catch(e=>{console.error(e);process.exitCode=1;});
