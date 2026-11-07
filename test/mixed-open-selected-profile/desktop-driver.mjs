// Prepared complete signed workflow. Never run against an older app. All source
// authoring is registered public commands; harness model/resource reads are
// observations only. No Native seeds, private writer or fabricated successes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const need=k=>{assert(process.env[k],k+' required');return process.env[k];};
const desktop=path.resolve(need('CODI_DESKTOP_SOURCE_ROOT')),helper=path.join(desktop,'test/agent-cad-corpus/sweep/signed-harness.mjs');
const {harness}=await import(pathToFileURL(helper)),pins=JSON.parse(fs.readFileSync(need('CODI_SIGNED_PINS'))),build=need('CODI_ENGINE_REVISION'),out=path.resolve(need('CODI_EVIDENCE'));
assert.equal(pins.source,need('CODI_EXPECT_SOURCE'));assert.equal(pins.desktop,need('CODI_EXPECT_DESKTOP'));assert(/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/.test(build));
for(const k of ['CODI_TEST_URL','CODI_TEST_CDP'])assert(['localhost','127.0.0.1'].includes(new URL(need(k)).hostname));
assert(!fs.existsSync(out),'Use fresh evidence output');fs.mkdirSync(out,{recursive:true});
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),files=[pathToFileURL(helper),new URL('./desktop-driver.mjs',import.meta.url),new URL('./WORKFLOW.md',import.meta.url)],hashes=()=>Object.fromEntries(files.map(p=>[p.href,sha(fs.readFileSync(p))]));
const receipt={status:'RUNNING',scope:'Actual public E01 separate open Segment + closed Circle selected extrusion, explicit complete source analysis, dependent diameter replay, unsafe-source refusals, shared travel and native Save/fresh Open. Not general arrangements/E05.',pins,engineRevision:build,sourcePins:hashes(),rows:[],sourceSeeds:false,fakeSuccessfulReplies:false};
const flush=()=>fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(receipt,null,2)+'\n');
const record=(label,data={})=>{receipt.rows.push(structuredClone({label,...data}));flush();console.log(label);};
const one=(rows,label)=>{assert.equal(rows.length,1,'One '+label+' required');return rows[0];},near=(a,b,t=1e-6)=>assert(typeof a==='number'&&Number.isFinite(a)&&Math.abs(a-b)<=t,`${a} != ${b}`),canon=v=>JSON.stringify(v);
const browser=await createRequire(import.meta.url)(need('PUPPETEER_CORE_PATH')).connect({browserURL:need('CODI_TEST_CDP'),protocolTimeout:300000});
const h=await harness(browser,need('CODI_TEST_URL'),out,record);let faceId,segmentId,circleId,regionId,profile;
async function pin(){const inner=await h.pinFiles(Object.keys(pins.files));for(const p of inner)assert.equal(p.sha256,pins.files[p.name],p.name);const outer=await h.pinOuter({bundle:pins.outer.bundleSHA256});assert.equal(outer.sha256,pins.outer.sha256);record('Exact composed source/runtime asset pins',{inner,outer});}
async function source(){return JSON.parse((await h.capture(faceId)).native.source);}
async function state(){return{capture:await h.capture(faceId),drawing:await h.command('inspect'),ownership:await h.ownership()};}
async function primitive(kind,data){const i=await h.command('inspect-closed-sketches');return h.command('append-sketch-primitive',{revision:i.revision,faceId,kind,role:null,stage:0,data});}
async function discovery(openIds){
 const i=await h.command('inspect-selected-profiles',{engineRevision:build});assert(i.ready,i.reason);assert.equal(i.profileVersion,3);assert.equal(i.engineRevision,build);
 const r=await h.command('inspect-selected-regions',{revision:i.revision,faceId,depth:10,engineRevision:build}),a=r.sourceAnalysis;
 assert.deepEqual(Object.keys(a).sort(),['clearanceMm','closedComponents','openComponents','policy','version']);assert.equal(a.version,1);assert.equal(a.policy,'v3-extrusion-isolated-open-chains');assert.equal(a.clearanceMm,.0001);
 assert.deepEqual(a.closedComponents,[{kind:'circle',curveIds:[circleId]}]);assert.deepEqual(a.openComponents,[{kind:'open-chain',curveIds:openIds.slice().sort(),reason:'OPEN_NON_BOUNDARY',separation:'outward-aabb-clearance'}]);
 const census=[...a.closedComponents,...a.openComponents].flatMap(c=>c.curveIds).sort(),actual=(await source()).objects.filter(o=>o.stage===0&&o.role===null&&['Segment','Circle'].includes(o.type)).map(o=>o.id).sort();assert.deepEqual(census,actual);assert.equal(new Set(census).size,census.length);
 const region=one(r.regions,'actual closed region');assert.equal(region.support,'supported');assert.deepEqual(region.descriptor,{outerCurveIds:[circleId],holeCurveIds:[]});if(regionId)assert.equal(region.regionId,regionId);else regionId=region.regionId;
 record('Explicit mixed-source component census and real Circle region',{discovery:r});return r;
}
async function geometry(diameter,openIds){
 const s=await source(),line=one(s.objects.filter(o=>o.id===segmentId),'original Segment'),circle=one(s.objects.filter(o=>o.id===circleId),'original Circle');assert.deepEqual(line.data,{a:{x:0,y:0},b:{x:30,y:40}});assert.deepEqual(circle.data.c,{x:60,y:20});near(circle.data.r,diameter/2);
 assert.deepEqual(s.objects.filter(o=>o.type==='Segment').map(o=>o.id).sort(),openIds.slice().sort());
 const i=await h.command('inspect-worker-solids'),b=one(i.bodies,'current native body');assert.equal(b.id,profile.outputId);assert.equal(b.featureId,profile.featureId);const m=b.metrics;assert.equal(m.nativeValidity.valid,true);assert.equal(m.solidCount,1);assert.equal(m.resultKind,'single-solid');assert.equal('sha256:'+m.runtime.jsSha256+':'+m.runtime.wasmSha256,build);near(m.nativeVolume,Math.PI*(diameter/2)**2*10);
 for(let k=0;k<3;k++){near(m.nativeBounds.min[k],[60-diameter/2,20-diameter/2,0][k]);near(m.nativeBounds.max[k],[60+diameter/2,20+diameter/2,10][k]);}
 const owned=await h.ownership();assert.equal(owned.processing,false);assert.equal(owned.resources.candidates,0);assert.equal(owned.resources.accepted,0);assert.equal(owned.resources.mounts,0);assert.equal(owned.resources.cleanupFailed,false);
 record('Independent actual native Circle volume/bounds with original unrelated Segment preserved',{diameter,metrics:m,source:s,ownership:owned});
}
function acceptedState(value){
 const copy=structuredClone(value);delete copy.capture.solids.revision;delete copy.capture.journal.revision;delete copy.drawing.revision;
 // Evaluation attempts may invalidate opaque inspection tokens. Owner/detached
 // metadata is recorded raw, while live Native work/cleanup is checked below.
 delete copy.ownership.resources;return copy;
}
async function reject(label,work){
 const before=await state();let error;
 try{await work();}catch(e){error={name:e.name,code:e.code??null,message:e.message,committed:e.committed===true,possiblyCommitted:e.possiblyCommitted===true};}
 const after=await state();record(label,{before,after,error});assert(error,'Unsafe source change must refuse');assert.equal(error.committed,false);assert.equal(error.possiblyCommitted,false);assert.equal(error.code,'OPEN_OR_AMBIGUOUS_PROFILE');
 assert.equal(canon(acceptedState(after)),canon(acceptedState(before)),'Refusal changed accepted source/model/IDs/counters/journal/dirty state');
 for(const key of ['candidates','accepted','mounts'])assert.equal(after.ownership.resources[key],0,key);assert.equal(after.ownership.resources.cleanupFailed,false);assert.equal(after.ownership.processing,false);
}

try{
 await h.login();const commands=await h.launch();for(const id of ['create-empty-sketch-plane','append-sketch-primitive','inspect-selected-profiles','inspect-selected-regions','create-selected-extrusion','inspect-closed-sketch','apply-closed-sketch-diameter','edit-closed-sketch-dimension','edit-closed-sketch-point','save','open-project','travel-authored-edit'])assert(commands.some(c=>c.id===id),id);await pin();
 const creation=await h.command('inspect-sketch-creation'),plane=await h.command('create-empty-sketch-plane',{revision:creation.revision,unit:'millimeter',plane:'XY',depth:0});faceId=plane.faceId;
 segmentId=(await primitive('Segment',{a:{x:0,y:0},b:{x:30,y:40}})).primitive.id;circleId=(await primitive('Circle',{c:{x:60,y:20},r:5})).primitive.id;
 const selected=await discovery([segmentId]);profile=await h.command('create-selected-extrusion',{revision:selected.revision,faceId,regionId,unit:'millimeter',engine:'occ',engineRevision:build,depth:10,bodyPolicy:'separate'});receipt.binding={faceId,segmentId,circleId,regionId,profile};await geometry(10,[segmentId]);
 let inspect=await h.inspect(faceId);await h.command('apply-closed-sketch-diameter',{revision:inspect.revision,faceId,id:circleId,diameter:10});inspect=await h.inspect(faceId);const dim=one(inspect.dimensionTargets.filter(t=>t.canEdit&&t.objects.length===1&&t.objects[0]===circleId),'actual Circle driving dimension');await h.command('edit-closed-sketch-dimension',{revision:inspect.revision,faceId,constraintId:dim.constraintId,value:14});await geometry(14,[segmentId]);await h.travel('undo');await geometry(10,[segmentId]);await h.travel('redo');await geometry(14,[segmentId]);await discovery([segmentId]);
 inspect=await h.inspect(faceId);const endpoint=one(inspect.points.filter(p=>p.parentId===segmentId&&p.x===30&&p.y===40),'actual Segment endpoint');await reject('Unsafe open chain enters Circle bounds and refuses atomically',()=>h.command('edit-closed-sketch-point',{revision:inspect.revision,faceId,id:endpoint.id,x:60,y:20}));
 const continuation=(await primitive('Segment',{a:{x:30,y:40},b:{x:10,y:10}})).primitive.id,open=[segmentId,continuation];await discovery(open);await geometry(14,open);
 await reject('Branching ordinary source refuses instead of silent filtering',()=>primitive('Segment',{a:{x:30,y:40},b:{x:40,y:40}}));
 const file='/Mixed-source-'+h.username+'.jsketcher.json',saved=await h.save(file,'mixed-edited');assert.equal(saved.native.format,'codi-jsketcher-project');assert.equal(saved.native.version,2);assert.equal(saved.native.unit,'millimeter');const op=one(saved.native.project.model.history.filter(o=>o.type==='WORKER_SELECTED_PROFILE_EXTRUDE_V2'),'saved original selected feature');assert.equal(op.params.featureId,profile.featureId);assert.equal(op.params.faceId,faceId);assert.equal(op.params.regionId,regionId);assert.equal(op.params.engineRevision,build);assert.equal(Object.keys(op.params).length,9);assert(!Object.hasOwn(op.params,'sourceAnalysis'));assert.deepEqual(one(saved.native.project.sketches.filter(s=>s.id===faceId),'saved sketch').data.objects.map(o=>o.id).sort(),[segmentId,circleId,continuation].sort());
 await h.freshOpen(file);await pin();await discovery(open);await geometry(14,open);inspect=await h.inspect(faceId);const reopened=one(inspect.dimensionTargets.filter(t=>t.canEdit&&t.objects.length===1&&t.objects[0]===circleId),'reopened driving dimension');await h.command('edit-closed-sketch-dimension',{revision:inspect.revision,faceId,constraintId:reopened.constraintId,value:12});await geometry(12,open);await h.travel('undo');await geometry(14,open);await h.travel('redo');await geometry(12,open);const final=await h.save(file,'mixed-final');record('Normal native Save/server sync/fresh Open/re-edit preserve semantic source and exact backend',{file,firstSha256:saved.sha256,finalSha256:final.sha256});receipt.status='PASS';
}catch(error){receipt.status='FAIL';receipt.error={name:error.name,code:error.code??null,message:error.message,stack:error.stack};process.exitCode=1;console.error(error.stack);}finally{await h.retire();receipt.cleanup='Only owned context retired after awaited command/write/sync settlement';receipt.sourceHashesAfter=hashes();assert.deepEqual(receipt.sourceHashesAfter,receipt.sourcePins);flush();await browser.disconnect();}
