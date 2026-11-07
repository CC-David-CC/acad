const assert=require('node:assert/strict');
module.exports=async function reloadControls(page,editor,source){const results=[];for(const mode of ['mouse','touch']){
 await editor.click();await page.keyboard.down('Control');await page.keyboard.press('A');await page.keyboard.up('Control');await editor.type('base = 95\nW = base * 2\nH = base\nD = 30');
 assert.equal(await page.evaluate(()=>__CAD_APP.expressionService.script$.value),source);
 await page.evaluate(()=>{window.reloadBefore={fault:faultBaseline(),workers:workerRows.length,versions:[__CAD_APP.expressionService.script$,__CAD_APP.expressionService.list$,__CAD_APP.expressionService.table$,__CAD_APP.expressionService.errors$].map(s=>s.revision)};});
 const button=await page.$('[data-expression-reload="true"]');await button.evaluate(element=>element.scrollIntoView({block:'nearest'}));
 if(mode==='mouse')await button.click();else{const session=await page.createCDPSession();try{await session.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});const box=await button.boundingBox(),point={x:box.x+box.width/2,y:box.y+box.height/2};await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}finally{await session.send('Emulation.setTouchEmulationEnabled',{enabled:false});await session.detach();}}
 await page.waitForFunction(source=>document.querySelector('[aria-label="Numeric expression script"]').value===source,{timeout:5000},source);await new Promise(resolve=>setTimeout(resolve,100));
 const result=await page.evaluate(()=>({preserved:faultPreserved(reloadBefore.fault),workersUnchanged:workerRows.length===reloadBefore.workers,streamVersionsUnchanged:[__CAD_APP.expressionService.script$,__CAD_APP.expressionService.list$,__CAD_APP.expressionService.table$,__CAD_APP.expressionService.errors$].every((s,i)=>s.revision===reloadBefore.versions[i])}));
 for(const value of Object.values(result.preserved))assert.equal(value,true,mode);assert.equal(result.workersUnchanged,true,mode);assert.equal(result.streamVersionsUnchanged,true,mode);results.push({mode,...result});
 }return results;};
