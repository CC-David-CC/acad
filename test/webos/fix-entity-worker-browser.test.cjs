const assert=require('node:assert/strict'),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);
if(![base,cdp].every(u=>['127.0.0.1','localhost','[::1]'].includes(u.hostname)))throw Error('Loopback only');
(async()=>{const browser=await puppeteer.connect({browserURL:cdp.href}),context=await browser.createBrowserContext();try{
 const page=await context.newPage();await page.goto(base.href);await page.addScriptTag({url:new URL('static/client.js',base).href});
 const result=await page.evaluate(async()=>{
  const boundary={lines:[],arcs:[],circles:[],nurbses:[]},row=(typeId,id,constants)=>({typeId,objects:[id],constants,stage:0,annotations:[],admission:{version:1,state:'accepted'}});
  const sketch={version:3,objects:[
   {id:'s',type:'Segment',role:null,stage:0,data:{a:{x:1,y:2},b:{x:11,y:7}}},
   {id:'c',type:'Circle',role:null,stage:0,data:{c:{x:2,y:3},r:5}},
   {id:'a',type:'Arc',role:null,stage:0,data:{a:{x:5,y:0},b:{x:0,y:5},c:{x:0,y:0}}}],dimensions:[],labels:[],constants:'',boundary:structuredClone(boundary),stages:[{generators:[],constraints:[
    row('FixSegment','s',{ax:'1',ay:'2',bx:'11',by:'7',length:String(Math.hypot(10,5)),direction:String(Math.atan2(5,10))}),
    row('FixCircle','c',{cx:'2',cy:'3',radius:'5'}),row('FixArc','a',{ax:'5',ay:'0',bx:'0',by:'5',cx:'0',cy:'0',radius:'5',sweep:String(Math.PI/2)})]}]};
  const run=sketch=>window.testHeadlessSketchClient('/static/worker.js',{revision:'fixed',sketch,boundary:structuredClone(boundary),externalParameters:{}});
  const good=await run(sketch),badExpression=structuredClone(sketch);badExpression.stages[0].constraints[1].constants.radius='width';
  const badGeometry=structuredClone(sketch);badGeometry.stages[0].constraints[2].constants.sweep='1';
  const wrongTarget=structuredClone(sketch);wrongTarget.stages[0].constraints[0].objects=['c'];
  return {good,expression:await run(badExpression),geometry:await run(badGeometry),wrong:await run(wrongTarget)};
 });
 assert.equal(result.good.ok,true,JSON.stringify(result.good.error));assert.deepEqual(result.good.sketch.objects.map(o=>o.data),[{a:{x:1,y:2},b:{x:11,y:7}},{c:{x:2,y:3},r:5},{a:{x:5,y:0},b:{x:0,y:5},c:{x:0,y:0}}]);
 for(const name of ['expression','geometry','wrong'])assert.equal(result[name].ok,false,`${name} must be refused`);
 console.log('PASS real Chromium Worker fixed segment, circle, arc and malformed intent refusal');
}finally{await context.close();browser.disconnect();}})().catch(error=>{console.error(error.stack);process.exitCode=1});
