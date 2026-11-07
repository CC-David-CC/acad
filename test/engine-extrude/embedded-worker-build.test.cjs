const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawnSync}=require('node:child_process'),crypto=require('node:crypto');
const {embeddedWorker}=require('../../build/embedded-oci-worker.cjs');
const source=fs.readFileSync('modules/engine/mount/oci-verified-worker.js','utf8');
const glue=fs.readFileSync('.build/prism-assets/occ-portable.js','utf8');
test('embedded worker deterministically binds reviewed input and avoids blob script execution',()=>{
 const a=embeddedWorker(source,glue);assert.equal(a,embeddedWorker(source,glue));assert.equal(crypto.createHash('sha256').update(a).digest('hex'),'b0713d865ec90f3778f65118098138a86fc6dba707070374f9eb166d5e03a3ca');assert.doesNotMatch(a,/importScripts\(blob\)/);assert.match(a,/get:\(\)=>HEAP8/);
});
test('changed bootstrap or glue fails closed',()=>{
 assert.throws(()=>embeddedWorker(source+' ',glue),/hash/);assert.throws(()=>embeddedWorker(source,glue+' '),/hash/);
});
test('tampered build-time WASM is refused before wrapper execution',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'codi-embedded-negative-'));
 try {
  for(const dir of ['build','modules/engine/mount','modules/workbenches/modeler/features/extrude','node_modules/.cache/codi-oci-clean'])fs.mkdirSync(path.join(root,dir),{recursive:true});
  for(const name of ['prepare-prism-assets.cjs','embedded-oci-worker.cjs'])fs.copyFileSync(path.join('build',name),path.join(root,'build',name));
  for(const name of ['profile-topology.mjs','centeredHolePlan.mjs','centeredHoleTopology.mjs','boundedPrismBoundary.mjs','fourCornerHolePlan.mjs','fourCornerHoleTopology.mjs','fourCornerHoleProvenance.mjs'])fs.writeFileSync(path.join(root,'modules/engine/mount',name),'');
  for(const name of ['rectangleProfileRequest.mjs','authoredRegions.mjs','profilePlan.mjs'])fs.writeFileSync(path.join(root,'modules/workbenches/modeler/features/extrude',name),'');
  fs.writeFileSync(path.join(root,'node_modules/.cache/codi-oci-clean/main.wasm'),'tampered');
  const run=spawnSync(process.execPath,[path.join(root,'build/prepare-prism-assets.cjs')],{encoding:'utf8'});assert.notEqual(run.status,0);assert.match(run.stderr,/Unexpected pinned OCC WASM/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('prepared helper modules are exact source bytes for dynamic worker imports',()=>{
 for(const name of ['centeredHolePlan.mjs','centeredHoleTopology.mjs','boundedPrismBoundary.mjs','fourCornerHolePlan.mjs','fourCornerHoleTopology.mjs','fourCornerHoleProvenance.mjs']){
  assert.deepEqual(fs.readFileSync(path.join('.build/prism-assets',name)),fs.readFileSync(path.join('modules/engine/mount',name)));
 }
});
