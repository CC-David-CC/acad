// Isolated real-account test for native mesh CAD. No live service is used.
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
const base = new URL(process.env.CODI_TEST_URL || 'http://127.0.0.1:19739/');
const cdp = new URL(process.env.CODI_TEST_CDP || 'http://127.0.0.1:19255');
const loopback = host => ['127.0.0.1', 'localhost', '[::1]'].includes(host);
if (!loopback(base.hostname) || !loopback(cdp.hostname)) throw Error('Loopback endpoints required.');
const phone = process.env.CODI_PHONE === '1', large = process.env.CODI_4K === '1', name = process.env.CODI_TEST_USER || 'native' + Date.now().toString().slice(-8), password = 'test1234';
const expectedCsp = "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self' wss://ksu.codes; font-src 'self' data:; frame-src 'self' blob:; worker-src 'self' blob:; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'self'";
const browser = await puppeteer.connect({browserURL: cdp.href, protocolTimeout: 120000}), contexts = [];
async function newPage() {
  const context = await browser.createBrowserContext(); contexts.push(context);
  const page = await context.newPage(); await page.setViewport(phone ? {width:390,height:844,isMobile:true,hasTouch:true} : large ? {width:3840,height:2160} : {width:1920,height:1080}); return page;
}
async function login(page, username, register) {
  await page.goto(base); await page.waitForSelector('.login-toggle'); if (register) await page.click('.login-toggle');
  await page.type('[aria-label=Username]', username); await page.type('[aria-label=Password]', password);
  if (register) await page.type('[aria-label="Confirm password"]', password);
  await page.click('.login-form button[type=submit]'); await page.waitForFunction(() => window.desktopLab?.session?.kind === 'registered', {timeout:30000});
}
async function ready(page, count = 1) {
  await page.waitForFunction(count => document.querySelectorAll('.jsketcher-app').length === count && document.querySelectorAll('.jsketcher-app .app-status')[count-1]?.textContent.startsWith('New model.'), {timeout:90000}, count);
}
async function choose(page, file) {
  const selector = `[aria-label="Choose file ${file}"]`; await page.waitForSelector(selector, {timeout:30000});
  if (phone) await page.tap(selector); else await page.click(selector);
}
try {
  const page = await newPage(), csp = [], errors = [], wasm = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', response => {if (response.url().includes('/jsketcher-build/index-webos.html')) csp.push(response.headers()['content-security-policy']); if (response.url().endsWith('.wasm')) wasm.push({url:response.url(),status:response.status()});});
  await login(page, name + 'a', true); await page.evaluate(() => surfaces.get('Desktop').launch('jsketcher')); await ready(page);
  const frame = await (await page.$('.jsketcher-app iframe')).contentFrame();
  async function clickControl(selector) {
    const handle = await frame.waitForSelector(selector, {visible:true,timeout:30000});
    await handle.scrollIntoView();
    if (phone) await handle.tap(); else await handle.click();
  }
  async function box(x, expected) {
    await clickControl('[data-action-id="NATIVE_MESH_BOX"]');
    await frame.waitForSelector('[data-field-name="width"] input', {visible:true});
    for (const [key, value] of Object.entries({x, y:0, z:0, width:10, depth:20, height:30})) {
      const input = await frame.$(`[data-field-name="${key}"] input`);
      assert.ok(input, `field ${key} exists`);
      assert.ok(await input.evaluate(e => Boolean(e.id && document.querySelector(`label[for="${e.id}"]`))), `field ${key} has a label`);
      await input.click({clickCount:3}); await input.press('Backspace'); await input.type(String(value));
    }
    await clickControl('.dialog-ok');
    await frame.waitForFunction(n => __CAD_APP.cadRegistry.shells.length === n && !__CAD_APP.craftService.isProcessing, {timeout:30000}, expected);
  }
  const nativeButton = await frame.$('[data-action-id="NATIVE_MESH_BOX"]');
  assert.equal(await nativeButton.evaluate(e => e.getAttribute('aria-label')), 'Native Mesh Box');
  assert.equal(await nativeButton.evaluate(e => e.getAttribute('role')), 'button');
  await box(0, 1); await box(5, 2);
  await clickControl('[data-action-id="NATIVE_MESH_BOOLEAN"]');
  const target = 'select[aria-label="Native target"]', tool = 'select[aria-label="Native tool"]';
  await frame.waitForSelector(target, {visible:true}); await frame.waitForSelector(tool, {visible:true});
  if (phone) {
    const visibility = await frame.evaluate(() => {
      const inputs = [...document.querySelectorAll('select[aria-label="Native target"], select[aria-label="Native tool"]')];
      return {width:innerWidth, content:document.documentElement.scrollWidth, scrollX, boxes:inputs.map(e => {const r=e.getBoundingClientRect(); return {left:r.left,right:r.right};})};
    });
    assert.ok(visibility.content <= visibility.width + 1 && visibility.scrollX === 0 && visibility.boxes.every(r => r.left >= 0 && r.right <= visibility.width), `phone wizard clipped: ${JSON.stringify(visibility)}`);
  }
  const choices = await frame.$$eval(`${target} option`, opts => opts.map(option => option.value));
  assert.ok(choices.includes('native:1') && choices.includes('native:2'), 'both native operands are offered');
  if (phone) { await frame.tap(target); await frame.tap(tool); }
  await frame.select(target, 'native:1'); await frame.select(tool, 'native:2');
  await frame.select('[data-field-name="kind"] select', 'INTERSECT');
  await clickControl('.dialog-ok');
  await frame.waitForFunction(() => __CAD_APP.craftService.modifications$.value.history.length === 3 && !__CAD_APP.craftService.isProcessing, {timeout:30000});
  if (phone) {
    const layout = await frame.evaluate(() => ({width:innerWidth, content:document.documentElement.scrollWidth, scrollX}));
    assert.ok(layout.content <= layout.width + 1 && layout.scrollX === 0, `phone document overflows: ${JSON.stringify(layout)}`);
  }
  const inspect = () => frame.evaluate(() => {
    const c=__CAD_APP,s=c.cadRegistry.shells[0],m=s.brepShell.data.__meshWithOrigins.meshData,v=m.verts; let signed=0;
    for(let i=0;i<m.tris.length;i+=3){const a=m.tris[i]*3,b=m.tris[i+1]*3,d=m.tris[i+2]*3;signed+=(v[a]*(v[b+1]*v[d+2]-v[b+2]*v[d+1])+v[a+1]*(v[b+2]*v[d]-v[b]*v[d+2])+v[a+2]*(v[b]*v[d+1]-v[b+1]*v[d]))/6;}
    return {ids:c.cadRegistry.shells.map(shell=>shell.id),faces:s.faces.length,volume:Math.abs(signed)};
  });
  assert.deepEqual(await inspect(), {ids:['native:3'],faces:6,volume:3000});
  const guards = await frame.evaluate(async () => {
    const c=__CAD_APP, native=c.cadRegistry.shells[0], occ=c.operationService.get('BOX').run({x:1,y:1,z:1,featureId:100,boolean:{kind:'NONE'}},c).created[0];
    let occError='', nativeError='', sameError='', precisionError='';
    try {c.occService.io.pushModel(native,'bad')} catch(e){occError=e.message}
    try {await c.operationService.get('NATIVE_MESH_BOOLEAN').run({target:native,tool:occ,kind:'UNION',featureId:101},c)} catch(e){nativeError=e.message}
    try {await c.operationService.get('NATIVE_MESH_BOOLEAN').run({target:native,tool:native,kind:'UNION',featureId:101},c)} catch(e){sameError=e.message}
    try {c.operationService.get('NATIVE_MESH_BOX').run({x:1e6,y:0,z:0,width:0.01,depth:1,height:1,featureId:102},c)} catch(e){precisionError=e.message}
    return {occError,nativeError,sameError,precisionError};
  });
  assert.match(guards.occError,/cannot be mixed/i); assert.match(guards.nativeError,/cannot be mixed/i); assert.match(guards.sameError,/different/i); assert.match(guards.precisionError,/precision/i);
  await frame.evaluate(() => __CAD_APP.craftService.historyTravel.backward());
  await frame.waitForFunction('__CAD_APP.craftService.modifications$.value.pointer===1&&!__CAD_APP.craftService.isProcessing',{timeout:30000});
  assert.equal(await frame.evaluate(() => __CAD_APP.cadRegistry.shells.length), 2);
  await frame.evaluate(() => __CAD_APP.craftService.historyTravel.end());
  await frame.waitForFunction('__CAD_APP.craftService.modifications$.value.pointer===2&&!__CAD_APP.craftService.isProcessing',{timeout:30000});
  assert.deepEqual(await inspect(), {ids:['native:3'],faces:6,volume:3000});
  await clickControl('[data-action-id="Save"]');
  await page.waitForSelector('dialog.codi-confirm-dialog input');
  await page.$eval('dialog.codi-confirm-dialog input', e => {e.value='/native.jsketcher.json';}); await page.click('dialog.codi-confirm-dialog button[type=submit]');
  await page.waitForFunction(() => document.querySelector('.jsketcher-app .app-status')?.textContent.includes('syncing with the server'), {timeout:30000});
  const saved = await page.evaluate(async () => {const c=await mirrorFileContext();await c.files.sync();const a=await c.files.read('/native.jsketcher.json'),b=await(await serverFileContext()).files.read('native.jsketcher.json');return {local:new TextDecoder().decode(a.data),remote:new TextDecoder().decode(b.data)};});
  assert.equal(saved.local, saved.remote, 'native project synced with exact server bytes'); const model=JSON.parse(saved.local); assert.equal(model.model.history.length,3);
  const originalFrame = await page.$('.jsketcher-app iframe');
  const close = await page.$('.window:has(.jsketcher-app) [aria-label=Close]');
  if (phone) await close.tap(); else await close.click();
  await page.waitForFunction(() => !document.querySelector('.jsketcher-app iframe'), {timeout:30000});
  assert.equal(await originalFrame.evaluate(e => e.isConnected).catch(() => false), false, 'closing releases iframe');
  await page.evaluate(() => surfaces.get('Desktop').launch('jsketcher')); await ready(page,1);
  const second=await(await page.$$('.jsketcher-app iframe'))[0].contentFrame(); assert.equal(await second.evaluate(() => __CAD_APP.cadRegistry.shells.length),0,'second window starts independent');
  await second.evaluate(() => __CAD_APP.actionService.run('NativeFormatImport')); await choose(page,'native.jsketcher.json');
  await page.waitForFunction(() => document.querySelectorAll('.jsketcher-app .app-status')[0]?.textContent.startsWith('Opened /native.jsketcher.json'), {timeout:90000});
  const reopened=await page.evaluate(() => {const c=document.querySelectorAll('.jsketcher-app iframe')[0].contentWindow.__CAD_APP;return {ids:c.cadRegistry.shells.map(s=>s.id),faces:c.cadRegistry.shells[0].faces.length,history:c.projectManager.snapshotCurrentProject().model.history};});
  assert.deepEqual(reopened.ids,['native:3']); assert.equal(reopened.faces,6); assert.deepEqual(reopened.history,model.model.history);
  // A separate OCC window uses the actual toolbar and wizard too.
  await page.evaluate(() => surfaces.get('Desktop').launch('jsketcher')); await ready(page,2);
  const occ = await (await page.$$('.jsketcher-app iframe'))[1].contentFrame();
  const occAction = await occ.waitForSelector('[data-action-id="BOX"]', {visible:true});
  await occAction.scrollIntoView(); if (phone) await occAction.tap(); else await occAction.click();
  await occ.waitForSelector('[data-field-name="x"] input', {visible:true});
  const occOk = await occ.$('.dialog-ok'); if (phone) await occOk.tap(); else await occOk.click();
  await occ.waitForFunction(() => __CAD_APP.cadRegistry.shells.length === 1 && !__CAD_APP.craftService.isProcessing, {timeout:30000});
  const occHistory = await occ.evaluate(() => __CAD_APP.projectManager.snapshotCurrentProject().model.history);
  assert.equal(occHistory[0].type, 'BOX', 'ordinary OCC box was created');
  // The preserved 7e9233b8 bundle predates the rotate action.
  const nativeStill = await page.evaluate(() => document.querySelectorAll('.jsketcher-app iframe')[0].contentWindow.__CAD_APP.cadRegistry.shells.map(shell => shell.id));
  assert.deepEqual(nativeStill, ['native:3'], 'OCC window does not change native window');
  const occSave = await occ.$('[data-action-id="Save"]'); await occSave.scrollIntoView(); if (phone) await occSave.tap(); else await occSave.click();
  await page.waitForSelector('dialog.codi-confirm-dialog input');
  await page.$eval('dialog.codi-confirm-dialog input', e => {e.value='/occ-ui.jsketcher.json';}); await page.click('dialog.codi-confirm-dialog button[type=submit]');
  await page.waitForFunction(() => document.querySelectorAll('.jsketcher-app .app-status')[1]?.textContent.includes('syncing with the server'), {timeout:30000});
  const savedOcc = await page.evaluate(async () => {const c=await mirrorFileContext();await c.files.sync();const local=await c.files.read('/occ-ui.jsketcher.json'),remote=await(await serverFileContext()).files.read('occ-ui.jsketcher.json');return {local:new TextDecoder().decode(local.data),remote:new TextDecoder().decode(remote.data)};});
  assert.equal(savedOcc.local,savedOcc.remote); assert.equal(JSON.parse(savedOcc.local).model.history[0].type,'BOX'); assert.equal(JSON.parse(savedOcc.local).model.history.length,1);
  const other=await newPage();await login(other,name+'b',true);const denied=await other.evaluate(async()=>{try{await(await serverFileContext()).files.read('native.jsketcher.json');return 'read succeeded';}catch(e){return e.status;}});assert.ok(denied===403||denied===404);
  const fresh=await newPage();await login(fresh,name+'a',false);await fresh.evaluate(async()=>{const c=await mirrorFileContext();await c.files.sync();surfaces.get('Desktop').launch('files');});
  const row='[data-chonky-file-id="/native.jsketcher.json"]';await fresh.waitForSelector(row,{timeout:30000});
  if(phone){await fresh.tap(row);await fresh.waitForFunction(()=>[...document.querySelectorAll('.codi-chonky button')].some(b=>b.textContent.trim()==='Open'&&!b.disabled),{timeout:30000});const button=(await fresh.evaluateHandle(()=>[...document.querySelectorAll('.codi-chonky button')].find(b=>b.textContent.trim()==='Open'&&!b.disabled))).asElement();await button.scrollIntoView();await button.tap();}else{await fresh.click(row);await fresh.click(row,{clickCount:2});}
  await fresh.waitForFunction(()=>document.querySelector('.jsketcher-app .app-status')?.textContent.startsWith('Opened /native.jsketcher.json'),{timeout:90000});
  const restored=await fresh.evaluate(()=>{const c=document.querySelector('.jsketcher-app iframe').contentWindow.__CAD_APP;return {ids:c.cadRegistry.shells.map(s=>s.id),history:c.projectManager.snapshotCurrentProject().model.history};});
  assert.deepEqual(restored.ids,['native:3']);assert.deepEqual(restored.history,model.model.history);
  assert.ok(csp.length>=3 && csp.every(value=>value===expectedCsp),'CAD frames use captured CSP');assert.ok(wasm.some(x=>x.status===200&&x.url.includes('7bb5f8ee')),'native Wasm loaded');assert.deepEqual(errors,[]);
  console.log('PASS research-only source-built OCCT: native and OCC box actions, history, save/close, isolated accounts and Files reopen (rotation not tested)');
} finally {for(const context of contexts)await context.close();browser.disconnect();}
