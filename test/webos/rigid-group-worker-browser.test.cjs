const assert=require('node:assert/strict'),puppeteer=require(process.env.PUPPETEER_CORE_PATH||'puppeteer-core');
const base=new URL(process.env.JSKETCHER_TEST_URL),cdp=new URL(process.env.CODI_TEST_CDP);
if(![base,cdp].every(u=>['127.0.0.1','localhost','[::1]'].includes(u.hostname)))throw Error('Loopback only');
(async()=>{const b=await puppeteer.connect({browserURL:cdp.href}),ctx=await b.createBrowserContext(),page=await ctx.newPage();try{
 await page.goto(base.href);await page.addScriptTag({url:new URL('static/client.js',base).href});
 const results=await page.evaluate(async()=>{
  const boundary=()=>({lines:[],arcs:[],circles:[],nurbses:[]}),pts=[[0,0],[100,0],[100,50],[0,50],[0,0]],members=[],points=[],objects=[];
  for(let i=0;i<4;i++){const id='s'+i,a=id+':A',b=id+':B';members.push({id,a,b});points.push({id:a,x:pts[i][0],y:pts[i][1]},{id:b,x:pts[i+1][0],y:pts[i+1][1]});objects.push({id,type:'Segment',stage:0,role:null,data:{a:{x:pts[i][0],y:pts[i][1]},b:{x:pts[i+1][0],y:pts[i+1][1]}}});}
  objects.push({id:'g',type:'RigidGroup',stage:0,role:null,data:{version:1,members,points,transform:{x:0,y:0,angle:0}}});
  const sketch={version:3,objects,dimensions:[],labels:[],constants:'',stages:[{constraints:[{typeId:'RigidGroup',objects:['g',...members.map(m=>m.id)],stage:0,annotations:[],admission:{version:1,state:'accepted'}}],generators:[]}],boundary:boundary()};
  const run=sketch=>window.testHeadlessSketchClient('/static/worker.js',{revision:'rigid',sketch,boundary:boundary(),externalParameters:{}});
  const good=await run(sketch),wrong=structuredClone(sketch);wrong.objects[0].data.a.x=7;
  const orphan=structuredClone(sketch);orphan.stages[0].constraints=[];
  const overlap=structuredClone(sketch);overlap.stages[0].constraints.push(structuredClone(overlap.stages[0].constraints[0]));
  return {good,wrong:await run(wrong),orphan:await run(orphan),overlap:await run(overlap)};
 });
 assert.equal(results.good.ok,true,JSON.stringify(results.good.error));assert.equal(results.good.sketch.objects.filter(o=>o.type==='RigidGroup').length,1);for(const name of ['wrong','orphan','overlap'])assert.equal(results[name].ok,false,name);
 console.log('PASS real strict-CSP Worker group native replay, altered geometry, orphan and overlapping owner refusal');
}finally{await ctx.close();b.disconnect();}})().catch(e=>{console.error(e.stack);process.exitCode=1});
