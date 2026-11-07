// Actual normal app DOM/registry qualification; no overlay or fake UI.
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.CODI_BRANDING_URL),cdp=new URL(process.env.CODI_TEST_CDP);
for(const u of[base,cdp])assert.equal(u.hostname,'127.0.0.1');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href}),context=await browser.createBrowserContext();
try{
 const page=await context.newPage();await page.setViewport({width:1280,height:900});
 await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base));
 await page.waitForFunction(()=>Boolean(globalThis.__CAD_APP?.streams?.ui?.controlBars?.left),{timeout:120000});
 const actual=await page.evaluate(()=>({title:document.title,toolbar:__CAD_APP.streams.ui.controlBars.left.value,
  removed:['Donate','GitHub'].map(id=>({id,dom:document.querySelectorAll('[data-action-id="'+id+'"]').length,registered:Object.hasOwn(__CAD_APP.streams.action.state,id)})),
  visibleMenus:[...document.querySelectorAll('[data-action-id^="menu."]')].filter(e=>e.getBoundingClientRect().width>0&&e.getBoundingClientRect().height>0).map(e=>e.dataset.actionId),
  canvases:document.querySelectorAll('canvas').length}));
 assert.equal(actual.title,'CAD Modeler (JSketcher inspired)');
 // Existing debugBundle appends its Debug menu after UI configuration.
 const expected=['menu.file','menu.edit','menu.craft','menu.boolean','menu.primitives','menu.views','menu.viewModes','menu.debug'];assert.deepEqual(actual.toolbar,expected);
 for(const r of actual.removed){assert.equal(r.dom,0);assert.equal(r.registered,false);}
 for(const id of expected)assert(actual.visibleMenus.includes(id));assert(actual.canvases>0);
 const app=Buffer.from(await(await fetch(new URL('static/index.bundle.js',base))).arrayBuffer());assert.equal(sha(app),process.env.CODI_EXPECT_APP_SHA);
 const html=Buffer.from(await(await fetch(new URL('index-webos.html',base))).arrayBuffer());
 const result={status:'PASS',source:process.env.CODI_SOURCE_PIN,url:base.href,appSHA256:sha(app),htmlSHA256:sha(html),actual,scope:'Actual normal-app title, rendered footer menus and absent remote action registrations; no CAD geometry qualification repeated'};
 fs.writeFileSync(process.env.CODI_RECEIPT,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}finally{await context.close();browser.disconnect();}})().catch(e=>{console.error(e);process.exitCode=1;});
