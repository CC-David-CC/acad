/* This is an intended-behavior regression. At 2ec7bef2 it fails because
 * radius 0 is committed as a history feature and an empty shell. */
const assert=require('node:assert/strict'),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL||'http://127.0.0.1:19782/'),cdp=new URL(process.env.CODI_TEST_CDP||'http://127.0.0.1:19282');
if(![base,cdp].every(u=>['127.0.0.1','localhost','[::1]'].includes(u.hostname)))throw Error('Loopback required');
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:60000}),context=await browser.createBrowserContext(),page=await context.newPage();try{
 await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base).href);await page.waitForFunction('window.__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});
 await page.evaluate(()=>{const c=__CAD_APP;c.actionService.run('BOX');c.wizardService.updateParam('x',10);c.wizardService.updateParam('y',20);c.wizardService.updateParam('z',30);c.services.wizard.applyWorkingRequest()});
 await page.waitForFunction('__CAD_APP.craftService.modifications$.value.history.length===1&&!__CAD_APP.craftService.isProcessing',{timeout:30000});
 const before=await page.evaluate(()=>({history:__CAD_APP.craftService.modifications$.value.history.length,shells:__CAD_APP.cadRegistry.shells.map(s=>({id:s.id,faces:s.faces.length}))}));
 await page.evaluate(()=>{const c=__CAD_APP;c.actionService.run('SPHERE');c.wizardService.updateParam('radius',0);c.services.wizard.applyWorkingRequest()});await new Promise(r=>setTimeout(r,1500));
 const after=await page.evaluate(()=>({history:__CAD_APP.craftService.modifications$.value.history.length,shells:__CAD_APP.cadRegistry.shells.map(s=>({id:s.id,faces:s.faces.length})),message:document.body.innerText}));
 console.log('OBSERVED',JSON.stringify({before,after}));assert.equal(after.history,before.history,'zero radius must not commit a history feature');assert.deepEqual(after.shells,before.shells,'zero radius must leave the prior body intact');assert.match(after.message,/Sphere radius must be finite and greater than zero/i,'show a useful error');
 }finally{await context.close();browser.disconnect()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
