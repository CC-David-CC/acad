// Real unchanged NVIDIA WASM; isolated same-origin strict-CSP fixture, no UI.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const crypto = require('node:crypto'), assert = require('node:assert/strict');
const puppeteer = require(process.env.PUPPETEER_CORE_PATH || 'puppeteer-core');
const root = path.resolve(__dirname, '../..'), assets = path.resolve(process.env.CODI_RAW_EXPERIMENT_ASSETS || path.join(root, '.build/multivoid'));
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const pins = {
  wasm: '4d35fd5b3a37e500d79388523329d5e61560fcd80cb963b2824533d6cf0f8f21',
  glue: '8e49622c97d839cf94d6c4d5e2de6cbd96d1166075741e08dcbda3b1a223d8fa',
  baselineWorker: '5c17193baaabef79fb4cc6ad4e552e56e36bc9d07fd1b0ebf03ea392eac5f45f',
  candidateWorker: '4c86d804cfd4f15399225c2ddd6bfd10cd20860467dc110275f98c973665ad60'
};
const read = p => fs.readFileSync(p);
const payloads = {
  '/baseline/rawMount.mjs': read(path.join(assets, 'baseline/rawMount.mjs')),
  '/candidate/rawMount.mjs': read(path.join(assets, 'candidate/rawMount.mjs')),
  '/baseline/raw-smlib-worker.js': read(path.join(assets, 'baseline/raw-smlib-worker.js')),
  '/candidate/raw-smlib-worker.js': read(path.join(assets, 'candidate/raw-smlib-worker.js')),
  '/direct/worker.js': read(path.join(assets, 'direct/raw-smlib-worker.js')),
  '/raw-provider.wasm': read(path.join(assets, 'raw-provider.wasm'))
};
assert.equal(sha(payloads['/raw-provider.wasm']), pins.wasm);
assert.equal(sha(read(path.join(assets, 'raw-provider.mjs'))), pins.glue);
for (const kind of ['baseline', 'candidate']) assert.equal(sha(payloads[`/${kind}/raw-smlib-worker.js`]), pins[kind + 'Worker']);
const server = http.createServer((req, res) => {
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; object-src 'none'");
  res.setHeader('Cache-Control', 'no-store');
  if (req.url === '/') { res.setHeader('Content-Type', 'text/html'); return res.end('<!doctype html><title>isolated native container control</title>'); }
  const data = payloads[req.url];
  if (!data) { res.statusCode = 404; return res.end(); }
  res.setHeader('Content-Type', req.url.endsWith('.wasm') ? 'application/wasm' : 'text/javascript'); res.end(data);
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await puppeteer.connect({browserURL: process.env.CODI_TEST_CDP || 'http://127.0.0.1:19329'});
  const context = await browser.createBrowserContext();
  const report = {version: 1, scope: 'Experimental direct mount/real Worker/native WASM; no registered history/app qualification', source: {commit:require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),upstream:'3fd5b9548d19aa8c12c29bc9637a96d42a06f8a5',binding:'e854d6ced3886c8533cea06dd5506e2385fdf6c1'}, pins, directWorkerSha256:sha(payloads['/direct/worker.js']), mountSha256: Object.fromEntries(['baseline', 'candidate'].map(k => [k, sha(payloads[`/${k}/rawMount.mjs`])])), cases: [], direct: []};
  report.testSources=Object.fromEntries(['browser.test.cjs','direct-worker.js','prepare.cjs'].map(name=>[name,sha(read(path.join(__dirname,name)))]));
  try {
    const page = await context.newPage();
    const response = await page.goto(`http://127.0.0.1:${server.address().port}/`);
    report.csp = response.headers()['content-security-policy'];
    report.browser = await browser.version();
    for (const variant of ['baseline', 'forward', 'reverse', 'subtract', 'fill', 'fill-reverse', 'fill-before-union', 'reference', 'common', 'baseline-fill', 'baseline-fill-reverse']) {
      const out = await page.evaluate(async variant => {
        const kind = variant.startsWith('baseline') ? 'baseline' : 'candidate';
        const {createRawSmlibMount} = await import(`/${kind}/rawMount.mjs`);
        const m = createRawSmlibMount({workerUrl: `/${kind}/raw-smlib-worker.js`, wasmPath: '/raw-provider.wasm'});
        const result = {variant};
        try {
          await m.ready;
          const box = (origin, dimensions) => m.execute({op: 'solid.box.create', version: 1, unit: 'millimeter', origin, dimensions});
          const bool = (op, a, b) => m.execute({op: `solid.boolean.${op}`, version: 1, unit: 'millimeter', a: a.handle, b: b.handle});
          const snapshot = async item => {
            m.assertSolidBinding(item.handle);
            const mesh = await m.readSolidMesh({op: 'solid.mesh.read', version: 1, handle: item.handle});
            const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', mesh.buffer))].map(x => x.toString(16).padStart(2, '0')).join('');
            const a = new Float64Array(mesh.buffer), edges = new Map(), adjacent = new Map(), min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
            let signedVolume = 0, degenerateTriangles = 0; const triangleVolumes=[];
            const key = p => p.map(v => Object.is(v, -0) ? 0 : v).join(',');
            for (let i = 0; i < a.length; i += 9) {
              const p = [Array.from(a.slice(i,i+3)), Array.from(a.slice(i+3,i+6)), Array.from(a.slice(i+6,i+9))], n = i/9;
              const u = p[1].map((v,j)=>v-p[0][j]), v = p[2].map((v,j)=>v-p[0][j]);
              const cross = [u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
              if (cross.every(v=>v===0)) degenerateTriangles++;
              const triangleVolume=(p[0][0]*(p[1][1]*p[2][2]-p[1][2]*p[2][1])+p[0][1]*(p[1][2]*p[2][0]-p[1][0]*p[2][2])+p[0][2]*(p[1][0]*p[2][1]-p[1][1]*p[2][0]))/6;
              signedVolume += triangleVolume;triangleVolumes.push(triangleVolume);
              for (const q of p) for(let j=0;j<3;j++){min[j]=Math.min(min[j],q[j]);max[j]=Math.max(max[j],q[j]);}
              for(let j=0;j<3;j++) { const x=key(p[j]),y=key(p[(j+1)%3]),k=x<y?x+'|'+y:y+'|'+x; const e=edges.get(k)||[];e.push({n,d:x<y?1:-1});edges.set(k,e); }
            }
            let badEdges=0;
            for(const e of edges.values()){if(e.length!==2||e[0].d+e[1].d!==0)badEdges++;if(e.length===2){for(const [x,y] of [[e[0].n,e[1].n],[e[1].n,e[0].n]]){const list=adjacent.get(x)||[];list.push(y);adjacent.set(x,list);}}}
            const seen = new Set(), componentSignedVolumes=[]; let surfaceComponents=0;
            for(let t=0;t<mesh.triangleCount;t++)if(!seen.has(t)){surfaceComponents++;let volume=0;const todo=[t];while(todo.length){const x=todo.pop();if(seen.has(x))continue;seen.add(x);volume+=triangleVolumes[x];todo.push(...(adjacent.get(x)||[]));}componentSignedVolumes.push(volume);}
            return {evidence: mesh.evidence, triangleCount: mesh.triangleCount, digest, signedVolume, bounds:{min,max}, badEdges, degenerateTriangles, surfaceComponents, componentSignedVolumes, displayStatus:mesh.displayStatus};
          };
          const outer = await box([0,0,0],[10,10,10]), inner = await box([2,2,2],[6,6,6]), far = await box([20,0,0],[10,10,10]);
          const hollow = await bool('subtract',outer,inner), operands=[outer,inner,far,hollow];
          // The mount permits one pending operation, so mesh controls are sequential.
          result.before=[]; for(const x of operands)result.before.push(await snapshot(x));
          if(variant.startsWith('baseline-fill')) {
            result.stage='fill-single-cavity';
            result.downstream=await snapshot(await bool('union',...(variant==='baseline-fill'?[hollow,inner]:[inner,hollow])));
            result.after=[];for(const x of operands)result.after.push(await snapshot(x));
            result.status='completed';return result;
          }
          result.stage='construct-composite';
          const composite = await bool('union',...(variant==='reverse'?[far,hollow]:[hollow,far]));
          result.composite = await snapshot(composite);
          result.stage='downstream';
          if(variant==='subtract') result.downstream=await snapshot(await bool('subtract',composite,far));
          if(variant==='fill') result.downstream=await snapshot(await bool('union',composite,inner));
          if(variant==='fill-reverse') result.downstream=await snapshot(await bool('union',inner,composite));
          if(variant==='fill-before-union') result.downstream=await snapshot(await bool('union',await bool('union',hollow,inner),far));
          if(variant==='reference') result.downstream=await snapshot(await bool('union',outer,far));
          if(variant==='common') result.downstream=await snapshot(await bool('common',composite,outer));
          result.after=[];for(const x of operands)result.after.push(await snapshot(x));
          result.compositeAfter=await snapshot(composite);
          result.status='completed';
        } catch(e) { result.error={code:e.code||null,message:e.message}; }
        finally {m.close();}
        return result;
      }, variant);
      report.cases.push(out);
    }
    for(const variant of ['fill','fill-reverse','hollow-fill','hollow-fill-reverse','grouped']) {
      report.direct.push(await page.evaluate(variant=>new Promise((resolve,reject)=>{
        const w=new Worker('/direct/worker.js'),timer=setTimeout(()=>{w.terminate();reject(Error('Direct binding timeout'));},30000);
        w.onmessage=({data})=>{clearTimeout(timer);w.terminate();resolve(data);};w.onerror=e=>{clearTimeout(timer);w.terminate();reject(Error(e.message));};w.postMessage({variant});
      }),variant));
    }
    for(const item of report.direct){
      const triangles=item.mesh?.triangles;
      if(Array.isArray(triangles)) {
        item.meshSignedVolume=triangles.reduce((sum,[a,b,c])=>sum+(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6,0);
        const edges=new Map();let degenerateTriangles=0;
        for(const t of triangles){
          const u=t[1].map((x,i)=>x-t[0][i]),v=t[2].map((x,i)=>x-t[0][i]);
          if([u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]].every(x=>x===0))degenerateTriangles++;
          for(let j=0;j<3;j++){const a=t[j].join(','),b=t[(j+1)%3].join(','),key=a<b?a+'|'+b:b+'|'+a,edge=edges.get(key)||[];edge.push(a<b?1:-1);edges.set(key,edge);}
        }
        item.meshBadEdges=[...edges.values()].filter(x=>x.length!==2||x[0]+x[1]!==0).length;
        item.meshDegenerateTriangles=degenerateTriangles;
      }
    }
    const checks=[];const control=(id,run)=>{try{run();checks.push({id,status:'pass'});}catch(e){checks.push({id,status:'fail',error:e.message});}};
    control('baseline-refusal',()=>assert.equal(report.cases[0].error?.code, 'MULTI_MATERIAL_VOID_UNSUPPORTED'));
    const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8, `${a} != ${b}`);
    const check=(mesh,volume,materials,voids,components)=>{
      assert.equal(mesh.evidence.validLevel0,true);assert.equal(mesh.evidence.validLevel2,true);
      assert.equal(mesh.evidence.materialRegions,materials);assert.equal(mesh.evidence.voidRegions,voids);
      if(mesh.evidence.manifoldPredicate)near(mesh.evidence.volume,volume);else{assert.equal(mesh.evidence.volume,null);assert.equal(mesh.evidence.volumeQuality,'native-undefined-nonmanifold');}
      near(Math.abs(mesh.signedVolume),volume);assert.equal(mesh.badEdges,0);assert.equal(mesh.degenerateTriangles,0);assert.equal(mesh.surfaceComponents,components);
      assert.deepEqual(mesh.bounds,mesh.evidence.bounds);
    };
    for(const item of report.cases.slice(1)) control(item.variant,()=>{
      assert.equal(item.status,'completed',JSON.stringify(item.error));
      if(item.variant.startsWith('baseline-fill')) {check(item.downstream,1000,1,0,1);assert.deepEqual(item.after,item.before);return;}
      check(item.composite,1784,2,1,3);
      assert.deepEqual(item.after,item.before);assert.deepEqual(item.compositeAfter,item.composite);
      if(['fill','fill-reverse','fill-before-union','reference'].includes(item.variant))check(item.downstream,2000,2,0,2);
      if(['subtract','common'].includes(item.variant))check(item.downstream,784,1,1,2);
    });
    control('forward-reverse-mesh-volume',()=>near(report.cases[1].composite.signedVolume,report.cases[2].composite.signedVolume));
    for(const item of report.direct)control('direct-'+item.variant,()=>{
      assert.equal(item.error,undefined);assert.equal(item.inspect?.error,undefined);
      const expected=item.variant.startsWith('hollow')?1000:2000;
      near(item.inspect.volume,expected);near(Math.abs(item.meshSignedVolume),expected);
      assert.equal(item.meshBadEdges,0);assert.equal(item.meshDegenerateTriangles,0);
      assert.equal(item.inspect.materialRegions,item.variant.startsWith('hollow')?1:2);assert.equal(item.inspect.voidRegions,0);
    });
    report.checks=checks;report.status=checks.some(x=>x.status==='fail')?'fail':'pass';
    fs.writeFileSync(process.env.CODI_RECEIPT || path.join(__dirname, 'receipt.json'), JSON.stringify(report,null,2)+'\n');
    console.log(report.status.toUpperCase(),JSON.stringify(checks));
    assert.equal(report.status,'pass','Native census/volume must agree with independent analytic and mesh controls.');
  } finally {await context.close();browser.disconnect();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
