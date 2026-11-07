// Selection and constraint-editor controls on a real sketcher and solver.
const assert=require('node:assert/strict');const puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);
for(const u of [base,cdp])if(!['127.0.0.1','localhost','[::1]'].includes(u.hostname))throw Error('Loopback only');
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href,protocolTimeout:120000}),context=await browser.createBrowserContext();try{
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(new URL('index-webos.html?DEFAULT&webos=1',base));await page.waitForFunction('__CAD_APP?.streams?.lifecycle?.projectLoaded?.value===true',{timeout:90000});
 await page.addScriptTag({url:new URL('static/webosTest.bundle.js',base).href});
 const before=await page.evaluate(async()=>{window.Cypress={$:s=>{const a=[...document.querySelectorAll(s)];a.index=n=>a.indexOf(n);return a}};
  const ui=webosTest.modellerUISubject(__CAD_APP),[sketch]=await webosTest.createPlaneAndOpenSketcher(ui);window.lengthSketch=sketch;
  const first=sketch.addSegment(0,0,40,0),second=sketch.addSegment(0,10,10,10);window.lengthIds=[first.id,second.id];sketch.select([first,second]);
  return sketch.viewer.io.serializeSketch(undefined,{strict:true});
 });
 await page.waitForSelector('button[title="Set length of the first segment to factor times the second plus offset (mm)"]',{visible:true});
 await page.click('button[title="Set length of the first segment to factor times the second plus offset (mm)"]');
 await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='APPLY'));
 const inputs=await page.$$('input[type=text]');assert.equal(inputs.length,2);
 await inputs[0].click({clickCount:3});await inputs[0].type('2');await inputs[1].click({clickCount:3});await inputs[1].type('5');
 const applyButton=await page.waitForSelector('::-p-xpath(//button[normalize-space()="APPLY"])');await applyButton.click();
 const result=await page.evaluate(()=>{const v=window.lengthSketch.viewer,save=()=>v.io.serializeSketch(undefined,{strict:true});
  const after=save();v.historyManager.undo();const undone=save();v.historyManager.redo();const redone=save();return {after,undone,redone};});
 assert.notEqual(result.after,before);assert.equal(result.undone,before);assert.equal(result.redone,result.after);
 const sketch=JSON.parse(result.after),relation=sketch.stages.flatMap(s=>s.constraints).find(c=>c.typeId==='LengthRelation');
 assert.ok(relation);assert.deepEqual(relation.objects,await page.evaluate(()=>window.lengthIds));assert.deepEqual(relation.constants,{factor:'2',offset:'5'});
 const lengths=relation.objects.map(id=>{const o=sketch.objects.find(x=>x.id===id);return Math.hypot(o.data.b.x-o.data.a.x,o.data.b.y-o.data.a.y)});assert.ok(Math.abs(lengths[0]-2*lengths[1]-5)<1e-6,JSON.stringify(lengths));assert.notEqual(lengths[0],40);
 sketch.boundary ||= {lines:[],arcs:[],circles:[],nurbses:[]};
 const solved=await page.evaluate(async ({sketch,worker})=>await new Promise((resolve,reject)=>{const w=new Worker(worker);const timer=setTimeout(()=>{w.terminate();reject(Error('worker timeout'))},30000);w.onerror=e=>{clearTimeout(timer);w.terminate();reject(Error(e.message))};w.onmessage=e=>{clearTimeout(timer);w.terminate();resolve(e.data)};w.postMessage({revision:'ui-relation',sketch,boundary:structuredClone(sketch.boundary),externalParameters:{}})}),{sketch,worker:new URL(process.env.LENGTH_WORKER,base).href});
 assert.equal(solved.ok,true,JSON.stringify(solved));assert.ok(solved.evidence.some(e=>e.typeId==='LengthRelation'&&e.state==='accepted'));
 await page.evaluate(()=>{const found=[];lengthSketch.viewer.traverse(o=>{if(lengthIds.includes(o.id))found.push(o)});lengthSketch.select(lengthIds.map(id=>found.find(o=>o.id===id)))});
 await page.waitForSelector('button[title="Set length of the first segment to factor times the second plus offset (mm)"]',{visible:true});await page.click('button[title="Set length of the first segment to factor times the second plus offset (mm)"]');
 await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='APPLY'));
 const secondInputs=await page.$$('input[type=text]');await secondInputs[0].click({clickCount:3});await secondInputs[0].type('2');await secondInputs[1].click({clickCount:3});await secondInputs[1].type('6');
 const secondApply=await page.waitForSelector('::-p-xpath(//button[normalize-space()="APPLY"])');await secondApply.click();
 const failed=await page.evaluate(()=>{const v=lengthSketch.viewer;const unchanged=v.io.serializeSketch(undefined,{strict:true});v.historyManager.undo();const undone=v.io.serializeSketch(undefined,{strict:true});v.historyManager.redo();return {unchanged,undone,redone:v.io.serializeSketch(undefined,{strict:true})}});
 assert.equal(failed.unchanged,result.after);assert.equal(failed.undone,before);assert.equal(failed.redone,result.after);
 const command=await page.evaluate(()=>{const ctx=__CAD_APP.services.sketcher.inPlaceEditor.sketcherAppContext,action=ctx.actions.LengthRelation,v=lengthSketch.viewer;
  const priorInspection=v.io.serializeSketch(undefined,{strict:true}),inspected=action.inspect(ctx,{valid:()=>true}),afterInspection=v.io.serializeSketch(undefined,{strict:true});v.refresh();const accepted=action.invokeByIds(ctx,lengthIds,{factor:2,offset:5},inspected.revision,{valid:()=>true});
  let used=false;try{action.invokeByIds(ctx,lengthIds,{factor:2,offset:5},inspected.revision,{valid:()=>true})}catch{used=true}
  const stale=action.inspect(ctx,{valid:()=>true});let first;v.traverse(o=>{if(o.id===lengthIds[0])first=o});const original=first.a.x;first.a.x=original+1;
  let rejected=false;try{action.invokeByIds(ctx,lengthIds,{factor:2,offset:5},stale.revision,{valid:()=>true})}catch{rejected=true}first.a.x=original;
  const abaToken=action.inspect(ctx,{valid:()=>true});first.a.x=original+3;first.a.x=original;let aba=false;try{action.invokeByIds(ctx,lengthIds,{factor:2,offset:5},abaToken.revision,{valid:()=>true})}catch{aba=true}
  const hiddenToken=action.inspect(ctx,{valid:()=>true});const oldT=first.params.t.get();first.params.t.set(oldT+1);first.params.t.set(oldT);let hidden=false;try{action.invokeByIds(ctx,lengthIds,{factor:2,offset:5},hiddenToken.revision,{valid:()=>true})}catch{hidden=true}
  const reentrantToken=action.inspect(ctx,{valid:()=>true});let calls=0,reentrant=false;try{action.invokeByIds(ctx,lengthIds,{factor:2,offset:5},reentrantToken.revision,{valid:()=>{if(++calls===2)first.a.x=original+2;return true}})}catch{reentrant=true}first.a.x=original;
  return {accepted,used,rejected,aba,hidden,reentrant,inspectionUnchanged:priorInspection===afterInspection,objects:inspected.objects,relations:inspected.relations};});
 assert.ok(['accepted','redundant'].includes(command.accepted.status));assert.equal(command.used,true);assert.equal(command.rejected,true);assert.equal(command.reentrant,true);assert.equal(command.aba,true);assert.equal(command.hidden,true);assert.equal(command.objects.length,2);assert.equal(command.relations.length,1);assert.equal(command.inspectionUnchanged,true);assert.ok(command.objects.every(o=>o.measurementRole==='reference'&&o.unit==='millimeter'));assert.equal(command.relations[0].role,'driving');
 const measure=await page.evaluate(()=>{const ctx=__CAD_APP.services.sketcher.inPlaceEditor.sketcherAppContext,v=lengthSketch.viewer;let segment;v.traverse(o=>{if(o.id===lengthIds[0])segment=o});const point=lengthSketch.toScreen((segment.a.x+segment.b.x)/2,(segment.a.y+segment.b.y)/2),box=v.canvas.getBoundingClientRect();const before={count:v.parametricManager.stages.reduce((n,s)=>n+s.algNumSystem.allConstraints.length,0),dimensions:v.dimLayer.objects.length,coordinates:[segment.a.x,segment.a.y,segment.b.x,segment.b.y]};const label=ctx.actions.MeasureDistance.shortName;ctx.actions.MeasureDistance.invoke(ctx);return {before,label,point:{x:box.left+point[0],y:box.top+point[1]}}});
 await page.mouse.move(measure.point.x,measure.point.y);await page.mouse.click(measure.point.x,measure.point.y);await page.mouse.move(measure.point.x,measure.point.y-20);await page.mouse.click(measure.point.x,measure.point.y-20);
 const measured=await page.evaluate(()=>{const v=lengthSketch.viewer;let segment;v.traverse(o=>{if(o.id===lengthIds[0])segment=o});const dim=v.dimLayer.objects[v.dimLayer.objects.length-1];return {count:v.parametricManager.stages.reduce((n,s)=>n+s.algNumSystem.allConstraints.length,0),dimensions:v.dimLayer.objects.length,coordinates:[segment.a.x,segment.a.y,segment.b.x,segment.b.y],value:dim&&Math.hypot(dim.a.x-dim.b.x,dim.a.y-dim.b.y)}});
 assert.match(measure.label,/reference/i);assert.equal(measured.count,measure.before.count);assert.equal(measured.dimensions,measure.before.dimensions+1);assert.deepEqual(measured.coordinates,measure.before.coordinates);assert.ok(Number.isFinite(measured.value)&&Math.abs(measured.value-Math.hypot(measured.coordinates[2]-measured.coordinates[0],measured.coordinates[3]-measured.coordinates[1]))<1e-6);
 assert.deepEqual(errors,[]);console.log('PASS selected segment relation, typed factor/offset, native sketch persistence and undo/redo');
 }finally{await context.close();browser.disconnect()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
