// Real disposable Chromium Workers; independent DXF group-code/angle oracle.
// No Viewer, Canvas, fake solver, or imported writer parser is used by the test.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const puppeteer = require(process.env.PUPPETEER_CORE_PATH);
const mod360 = n => ((n % 360) + 360) % 360;
function entities(text) {
  const lines = text.trimEnd().split(/\r?\n/).map(line => line.trim());
  assert.equal(lines.length % 2, 0, 'complete DXF group-code/value pairs');
  let section = '', nextSection = false, current;
  const rows = [];
  for (let i = 0; i + 1 < lines.length; i += 2) {
    const code = lines[i], value = lines[i + 1];
    if (code === '0' && value === 'SECTION') nextSection = true;
    else if (nextSection && code === '2') { section = value; nextSection = false; }
    else if (code === '0' && value === 'ENDSEC') { section = ''; current = null; }
    else if (section === 'ENTITIES' && code === '0') { current = {type:value, values:{}}; rows.push(current); }
    else if (section === 'ENTITIES' && current) current.values[code] = value;
  }
  return rows;
}
const p = (x,y) => ({x,y});
const origin = p(0,0), radius = 10;
const near = dy => ({a:p(radius,0), b:p(Math.sqrt(radius*radius-dy*dy),dy), c:origin});
const cases = [
  {name:'quadrant-I', data:{a:p(10,0),b:p(0,10),c:origin}, type:'ARC', sweep:90},
  {name:'major-270', data:{a:p(0,10),b:p(10,0),c:origin}, type:'ARC', sweep:270},
  {name:'wrap-IV-I', data:{a:p(0,-10),b:p(10,0),c:origin}, type:'ARC', sweep:90},
  {name:'translated-quadrant-III-IV', data:{a:p(-7,-7),b:p(3,-17),c:p(3,-7)}, type:'ARC', sweep:90},
  {name:'full-identical', data:{a:p(0,-10),b:p(0,-10),c:origin}, type:'CIRCLE', sweep:360},
  {name:'full-near-positive', data:near(5e-7), type:'CIRCLE', sweep:360},
  {name:'full-near-negative', data:near(-5e-7), type:'CIRCLE', sweep:360},
  {name:'full-strictly-below-threshold', data:near(1e-6*(1-1e-6)), type:'CIRCLE', sweep:360},
  {name:'arc-at-strict-threshold', data:near(1e-6), type:'ARC', sweep:Math.asin(1e-7)*180/Math.PI},
  {name:'arc-above-threshold', data:near(1e-6*(1+1e-6)), type:'ARC', sweep:Math.asin(1e-7*(1+1e-6))*180/Math.PI},
  // Both coordinate differences are below1e-6 while chord length exceeds1e-6.
  {name:'full-diagonal-coordinate-predicate', data:{a:p(Math.sqrt(50),Math.sqrt(50)),b:p(10*Math.cos(Math.PI/4+1.2e-7),10*Math.sin(Math.PI/4+1.2e-7)),c:origin},type:'CIRCLE',sweep:360},
  {name:'arc-outside-diagonal-threshold', data:{a:p(Math.sqrt(50),Math.sqrt(50)),b:p(10*Math.cos(Math.PI/4+1.5e-7),10*Math.sin(Math.PI/4+1.5e-7)),c:origin},type:'ARC',sweep:1.5e-7*180/Math.PI}
];
(async () => {
  for (const u of [process.env.CODI_TEST_CDP,process.env.JSKETCHER_TEST_URL]) assert.ok(['127.0.0.1','localhost','[::1]'].includes(new URL(u).hostname),'loopback only');
  const b = await puppeteer.connect({browserURL:process.env.CODI_TEST_CDP});
  const context = await b.createBrowserContext();
  try {
    const page = await context.newPage();
    await page.goto(process.env.JSKETCHER_TEST_URL);
    const out = await page.evaluate(async cases => {
      const frame = {origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]};
      let created = 0, terminated = 0;
      const run = message => new Promise((resolve,reject) => {
        const worker = new Worker('/static/worker.js'); created++;
        let closed = false;
        const close = () => { if (!closed) {closed=true;worker.terminate();terminated++;} };
        const timer=setTimeout(() => {close();reject(Error('Worker deadline'));},15000);
        worker.onmessage = event => {clearTimeout(timer);close();resolve(event.data);};
        worker.onerror = event => {clearTimeout(timer);close();reject(Error(event.message));};
        worker.postMessage(message);
      });
      const empty = await run({mode:'empty',frame});
      if (!empty.ok) throw Error(JSON.stringify(empty));
      const rows=[];
      for (const test of cases) {
        // Full Arc remains a genuine saved Arc. Primitive creation intentionally
        // rejects near-coincident endpoints, so do not bypass that admission.
        // Instead exercise the native-source replay/export path that accepts it.
        const native=structuredClone(empty.sketch), id='arc-native-'+test.name;
        native.objects.push({id,type:'Arc',role:null,stage:0,data:test.data});
        const sketchJSON=JSON.stringify(native);
        const request={revision:test.name,unit:'millimeter',sketchJSON,frame,currentBoundary:native.boundary,externalParameters:{},parameterSource:null};
        const result=await run({mode:'audit-export',request});
        rows.push({name:test.name,result:{...result,blobType:result.blob?.type,dxf:result.ok?await result.blob.text():null},source:sketchJSON});
      }
      // Full-sweep analytic face boundaries pass through the same real adapter.
      const outline=structuredClone(empty.sketch.boundary);
      outline.arcs.push({id:'outline-full',a:{x:10,y:0},b:{x:Math.sqrt(100-25e-14),y:5e-7},c:{x:0,y:0}});
      const boundary=await run({mode:'export',request:{revision:'full-boundary',unit:'millimeter',sketchJSON:null,frame,currentBoundary:outline,externalParameters:{},parameterSource:null}});
      return {rows,boundary:{...boundary,dxf:boundary.ok?await boundary.blob.text():null},workers:{created,terminated},canvasCount:document.querySelectorAll('canvas').length,viewerPresent:!!window.__CAD_APP};
    },cases);
    assert.equal(out.canvasCount,0); assert.equal(out.viewerPresent,false);
    assert.equal(out.workers.created,cases.length+2); assert.equal(out.workers.terminated,out.workers.created);
    const observations=[];
    for (const test of cases) {
      const row=out.rows.find(row => row.name===test.name), result=row.result;
      assert.equal(result.ok,true,test.name+': '+JSON.stringify(result.error));
      assert.equal(result.blobType,'application/dxf');
      assert.equal(result.requestUnchanged,true,test.name+' worker request mutation');
      assert.equal(result.nativeReplay.ok,true,test.name+' replay failed');
      const native=JSON.parse(row.source), replay=JSON.parse(result.nativeReplay.serializedSketch);
      assert.deepEqual(replay.objects,native.objects,test.name+' native Arc changed during real solve/replay');
      assert.deepEqual(replay.stages,native.stages,test.name+' authored constraints/stages changed');
      const rows=entities(result.dxf);
      assert.equal(rows.length,1,test.name+' extra/missing geometry');
      const entity=rows[0], values=entity.values;
      assert.equal(entity.type,test.type,test.name+' full/partial branch mismatch');
      assert.equal(Number(values['10']),test.data.c.x); assert.equal(Number(values['20']),test.data.c.y);
      const expectedRadius=Math.hypot(test.data.a.x-test.data.c.x,test.data.a.y-test.data.c.y);
      assert.ok(Math.abs(Number(values['40'])-expectedRadius)<1e-12,test.name+' radius');
      let actualSweep=360;
      if(entity.type==='ARC') {
        const start=Number(values['50']), end=Number(values['51']);
        assert.ok(Number.isFinite(start)&&Number.isFinite(end));
        actualSweep=mod360(end-start);
        assert.ok(Math.abs(actualSweep-test.sweep)<1e-10,test.name+' sweep '+actualSweep+' expected '+test.sweep);
        for(const [angle,point] of [[start,test.data.a],[end,test.data.b]]) {
          const rad=angle*Math.PI/180;
          assert.ok(Math.hypot(Number(values['10'])+expectedRadius*Math.cos(rad)-point.x,Number(values['20'])+expectedRadius*Math.sin(rad)-point.y)<1e-11,test.name+' reconstructed endpoint');
        }
      } else {
        assert.equal(values['50'],undefined); assert.equal(values['51'],undefined);
      }
      observations.push({name:test.name,type:entity.type,center:[Number(values['10']),Number(values['20'])],radius:Number(values['40']),sweep:actualSweep,nativeType:replay.objects.find(o=>o.id==='arc-native-'+test.name).type,sourceUnchanged:true});
    }
    assert.equal(out.boundary.ok,true,JSON.stringify(out.boundary.error));
    assert.deepEqual(entities(out.boundary.dxf).map(row=>row.type),['CIRCLE']);
    const pin=crypto.createHash('sha256').update(Buffer.from(await(await fetch(new URL('/static/worker.js',process.env.JSKETCHER_TEST_URL))).arrayBuffer())).digest('hex');
    const receipt={scope:'Real Chromium disposable Worker using actual headless workspace/solver/replay/export, independently parsed DXF group codes. Native Arc preserved; no Viewer/Canvas and no live Files publication qualification.',workerSha256:pin,observations,fullBoundary:{type:'CIRCLE',ok:true},workers:out.workers,canvasCount:out.canvasCount,viewerPresent:out.viewerPresent};
    if(process.env.CODI_RECEIPT)fs.writeFileSync(process.env.CODI_RECEIPT,JSON.stringify(receipt,null,2)+'\n');
    console.log(JSON.stringify(receipt,null,2));
  } finally { await context.close(); b.disconnect(); }
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
