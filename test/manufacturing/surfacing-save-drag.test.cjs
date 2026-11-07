const assert=require('node:assert/strict'),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
(async()=>{const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);if(![base,cdp].every(u=>['localhost','127.0.0.1','[::1]'].includes(u.hostname)))throw Error('Loopback only');const browser=await puppeteer.connect({browserURL:cdp.href}),context=await browser.createBrowserContext();try{
 const page=await context.newPage();await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base));await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});
 const result=await page.evaluate(async()=>{
  const c=__CAD_APP,life=new AbortController();c.projectService.bindHostLifetime({signal:life.signal,valid:()=>true});c.surfacingService.addPlane();const svc=c.surfacingService,editor=svc.view,cp=svc.scene.surfaces[0].grid[0][0],overlay=editor.currentTool.gizmo;
  overlay.attach(cp);const capture=await c.projectManager.prepareHostSave(),before=svc.state$.value.revision,original=JSON.stringify(capture.envelope.project.surfacing),x=cp.position[0];
  let armed=false,reentrant=null;const off=svc.state$.attach(()=>{if(armed&&!reentrant)reentrant=c.projectManager.prepareHostSave()});armed=true;
  // Invoke the real TransformControls change listener after moving its target,
  // exactly as an in-progress gizmo drag does, without dispatching drag-end.
  overlay.target.position.x=x+1;overlay.gizmo.dispatchEvent({type:'change'});
  const nested=await reentrant;off();const current=capture.isCurrent(),nestedCurrent=nested.isCurrent(),after=svc.state$.value.revision,now=JSON.stringify(svc.save());overlay.gizmo.dispatchEvent({type:'change'});const noOpRevision=svc.state$.value.revision;return {current,nestedCurrent,before,after,noOpRevision,changed:original!==now,moved:cp.position[0]===x+1};
 });
 assert.equal(result.moved,true);assert.equal(result.changed,true);assert.equal(result.current,false,'in-progress geometry movement must invalidate save capture');assert.equal(result.nestedCurrent,false,'reentrant capture before mutation must also become stale');assert.ok(result.after>result.before,'drag change must publish a new surfacing revision');assert.equal(result.noOpRevision,result.after,'unchanged gizmo position must not bump revision');console.log('PASS actual surfacing gizmo change invalidates captured save before drag end');
 }finally{await context.close();browser.disconnect()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
