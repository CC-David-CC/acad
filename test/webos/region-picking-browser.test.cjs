// Real Chromium checkbox and canvas selection of a bounded annular region.
const assert=require('node:assert/strict'),puppeteer=require('puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL||'http://127.0.0.1:19879/'),cdp=new URL(process.env.CODI_TEST_CDP||'http://127.0.0.1:19875');
if(![base,cdp].every(u=>['127.0.0.1','localhost','[::1]'].includes(u.hostname)))throw Error('Loopback required');
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href}),context=await browser.createBrowserContext(),p=await context.newPage();try{
 await p.goto(new URL('index-webos.html?DEFAULT&webos=1',base).href);await p.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true');await p.addScriptTag({url:new URL('static/webosTest.bundle.js',base).href});
 await p.evaluate(async()=>{window.Cypress={$:sel=>{const a=[...document.querySelectorAll(sel)];a.index=x=>a.indexOf(x);return a}};const ui=webosTest.modellerUISubject(__CAD_APP),[s]=await webosTest.createPlaneAndOpenSketcher(ui);s.addCircle(0,0,15);s.addCircle(0,0,5);await ui.commitSketch();await new Promise(r=>setTimeout(r,300));ui.selectFaces([0,0,-10],[0,0,10]);ui.openWizard('EXTRUDE')});
 await p.waitForSelector('input[aria-label="Sketch region 1"]');await p.click('input[aria-label="Sketch region 1"]');const expected=await p.evaluate(()=>__CAD_APP.wizardService.workingRequest.params.regions[0]);assert.ok(expected.startsWith('sketch-region:'));await p.click('input[aria-label="Sketch region 1"]');
 const pt=await p.evaluate(()=>{const v=__CAD_APP.viewer.sceneSetup,b=v.container.getBoundingClientRect(),p=v.modelToScreen({x:10,y:0,z:0});return {x:b.left+p.x,y:b.top+p.y}});await p.mouse.click(pt.x,pt.y);assert.deepEqual(await p.evaluate(()=>__CAD_APP.wizardService.workingRequest.params.regions),[expected]);console.log('PASS real checkbox and canvas region selection');
 }finally{await context.close();browser.disconnect()}})().catch(e=>{console.error(e);process.exitCode=1});
