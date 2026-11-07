// Complete E07 source. Execute only against root's composed, pinned runtime.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';

const need=k=>{assert(process.env[k],k+' required');return process.env[k];};
const desktop=path.resolve(need('CODI_DESKTOP_SOURCE_ROOT'));
const helper=path.join(desktop,'test/agent-cad-corpus/sweep/signed-harness.mjs');
const {harness}=await import(pathToFileURL(helper));
const pins=JSON.parse(fs.readFileSync(need('CODI_SIGNED_PINS')));
const out=path.resolve(need('CODI_EVIDENCE')),build=need('CODI_E07_ENGINE_REVISION');
assert.equal(pins.source,need('CODI_EXPECT_SOURCE'));assert.equal(pins.desktop,need('CODI_EXPECT_DESKTOP'));
assert.match(build,/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/);
for(const k of ['CODI_TEST_URL','CODI_TEST_CDP'])assert(['127.0.0.1','localhost'].includes(new URL(need(k)).hostname));
assert(!fs.existsSync(out),'Use a fresh evidence directory');fs.mkdirSync(out,{recursive:true});
const sha=v=>crypto.createHash('sha256').update(v).digest('hex');
const canonical=v=>JSON.stringify(function order(x){return Array.isArray(x)?x.map(order):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,order(x[k])])):x;}(v));
const paths=[new URL('./desktop-driver.mjs',import.meta.url),new URL('./README.md',import.meta.url),pathToFileURL(helper),pathToFileURL(path.join(desktop,'test/agent-cad-corpus/strict-join/oracle.mjs'))];
const hashes=()=>Object.fromEntries(paths.map(p=>[p.href,sha(fs.readFileSync(p))]));
const receipt={status:'RUNNING',scope:'Actual constrained rectangle/redundant signed width/contradictory intent refusal/shared dimension removal and recovery/native Save/Open/reedit; bounded E07 only',pins,engineRevision:build,sourcePins:hashes(),sourceSeeds:false,fakeSuccessfulReplies:false,tolerances:{lengthAbsMm:1e-6,angleAbsRadians:1e-8,nativeVolumeAbsMm3:1e-6,nativeBoundsAbsMm:1e-6},rows:[],saved:[]};
const flush=()=>fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(receipt,null,2)+'\n');
const record=(label,data={})=>{receipt.rows.push(structuredClone({label,...data}));flush();console.log(label);};
const one=(rows,label)=>{assert.equal(rows.length,1,'One '+label+' required');return rows[0];};
const near=(actual,expected,tolerance=1e-6)=>assert(Number.isFinite(actual)&&Math.abs(actual-expected)<=tolerance,`${actual} differs from ${expected}`);
const causes={'algebraic-contradiction':'exact-reduced-row','approximate-reduction-rejection':'approximate-reduced-row','original-residual-failure':'original-equations','invalid-domain':'domain-check','numerical-convergence-failure':'solver-status','nonfinite-result':'finite-check','resource-limit':'resource-check','retained-validation-failure':'retained-validation','unclassified-rejection':'admission-membership'};
const browser=await createRequire(import.meta.url)(need('PUPPETEER_CORE_PATH')).connect({browserURL:need('CODI_TEST_CDP'),protocolTimeout:300000});
let h,binding;

async function runtime(){
 const assets=await h.pinFiles(Object.keys(pins.files));for(const r of assets)assert.equal(r.sha256,pins.files[r.name],r.name);
 const outer=await h.pinOuter({bundle:pins.outer.bundleSHA256});assert.equal(outer.sha256,pins.outer.sha256);
 record('Exact served source outer and native byte pins',{assets,outer});
}
async function state(){return {capture:await h.capture(binding.faceId),host:await h.command('inspect'),ownership:await h.ownership()};}
const inspect=()=>h.inspect(binding.faceId);
const widthTarget=i=>one(i.dimensionTargets.filter(r=>r.typeId==='SegmentLength'&&r.canEdit&&r.canRemove&&r.objects.length===1&&r.objects[0]===binding.segmentId),'discovered existing width dimension');
const signedRows=i=>i.constraints.filter(c=>c.typeId==='SignedDistanceX'&&canonical(c.objects)===canonical(binding.pointIds));
async function editWidth(value,info){const i=info||await inspect();return h.command('edit-closed-sketch-dimension',{revision:i.revision,faceId:binding.faceId,constraintId:widthTarget(i).constraintId,value});}
// The generic helper omits admission causes. Observe the actual public registry
// rejection here; no private service call or synthetic solver report is used.
async function rejectedOutcome(command,args){
 return h.page.evaluate(async({windowId,command,args})=>{
  try{return {ok:true,value:await codiDesktopCommands.execute({windowId,command,args})};}
  catch(error){
   let admissionCause=null,current=error;
   for(let i=0;current&&typeof current==='object'&&i<4;i++){
    const k=Object.getOwnPropertyDescriptor(current,'kind'),b=Object.getOwnPropertyDescriptor(current,'basis');
    if(k&&b&&Object.hasOwn(k,'value')&&Object.hasOwn(b,'value')&&typeof k.value==='string'&&k.value.length<=64&&typeof b.value==='string'&&b.value.length<=64){admissionCause={kind:k.value,basis:b.value};break;}
    const d=Object.getOwnPropertyDescriptor(current,'cause');current=d&&Object.hasOwn(d,'value')?d.value:null;
   }
   return {ok:false,error:{name:error.name,code:typeof error.code==='string'?error.code:null,message:error.message,committed:error.committed===true,possiblyCommitted:error.possiblyCommitted===true,admissionCause}};
  }
 },{windowId:h.windowId,command,args});
}
async function refuse(label,command,args,code,mathematics){
 const before=await state(),outcome=await rejectedOutcome(command,args);
 record(label+' actual public outcome',{outcome,expectedCode:code,fixtureMathematics:mathematics});
 assert.equal(outcome.ok,false,'Required refusal succeeded');const e=outcome.error;
 assert.equal(e.name,'Error');assert.equal(e.code,code);assert.equal(e.committed,false);assert.equal(e.possiblyCommitted,false);
 assert(e.admissionCause,'The solver rejection must retain its actual admission cause');assert.equal(e.admissionCause.basis,causes[e.admissionCause.kind]);
 const after=await state();assert.equal(canonical(after),canonical(before),'Refusal changed accepted source/native geometry/history/journal/material/counters/resources/host baseline or same-window revision token');
 record(label+' exact accepted-state preservation',{before,after,solverClassification:e.admissionCause,solverClaim:e.admissionCause.kind==='algebraic-contradiction'?'Exact reduced-row rejection in this invocation':'Actual rejection category only; numerical failure is not labeled inconsistency'});
}
function rectangle(capture,width){
 const source=JSON.parse(capture.native.source);assert.equal(source.objects.length,4);assert.equal(source.stages.length,1);assert.deepEqual(source.objects.map(o=>o.id).sort(),binding.segmentIds);
 const corners=[[0,0],[width,0],[width,50],[0,50]],seen=new Map();
 for(const o of source.objects){assert.equal(o.type,'Segment');assert.equal(o.role,null);assert.equal(o.stage,0);for(const p of [o.data.a,o.data.b]){const corner=one(corners.filter(([x,y])=>Math.abs(p.x-x)<=1e-6&&Math.abs(p.y-y)<=1e-6),'analytic rectangle corner');const k=canonical(corner);seen.set(k,(seen.get(k)||0)+1);}}
 assert.equal(seen.size,4);assert([...seen.values()].every(n=>n===2));assert.deepEqual(source.metadata.boundaryFrame,binding.frame);
 const lengths=source.stages[0].constraints.filter(c=>c.typeId==='SegmentLength'&&c.objects[0]===binding.segmentId);if(lengths.length){assert.equal(lengths.length,1);near(Number(lengths[0].constants.length),width);}
 assert(source.stages[0].constraints.every(c=>['accepted','redundant'].includes(c.admission?.state)));return source;
}
async function diagnostic(label){
 const before=await state(),targets=await h.command('inspect-sketch-diagnostics');assert(targets.saved.some(s=>s.faceId===binding.faceId&&s.availability==='current'));
 const report=await h.command('analyze-sketch',{revision:targets.revision,mode:'saved',faceId:binding.faceId});
 assert.equal(report.revision,targets.revision);assert.equal(report.faceId,binding.faceId);assert.equal(report.mode,'saved');assert.equal(report.scope,'current-sketch-local-estimate');assert.notEqual(report.status,'unavailable');
 const d=report.localJacobian;assert.equal(d.version,1);assert.equal(d.rankLower,d.rankUpper);assert.equal(d.rankLower,d.variables);assert.equal(d.nullityLower,0);assert.equal(d.nullityUpper,0);assert.equal(d.localNullity,0);
 const info=await inspect();assert.equal(report.admission.length,info.constraints.length);assert.equal(report.evidence.length,info.constraints.length);
 for(let j=0;j<info.constraints.length;j++){
  const c=info.constraints[j],a=report.admission[j],e=report.evidence[j];assert.equal(a.typeId,c.typeId);assert.equal(canonical(a.objects),canonical(c.objects));assert.equal(a.state,c.admission.state);assert.equal(e.typeId,c.typeId);assert.equal(e.state,c.admission.state);
  const angular=['Horizontal','Vertical'].includes(c.typeId),unit=angular?'radian':'millimeter',tolerance=angular?1e-8:1e-6;
  assert.equal(e.unit,unit);assert.equal(e.tolerance,tolerance);assert.equal(e.residuals.length,e.tolerances.length);assert.equal(e.units.length,e.residuals.length);
  e.residuals.forEach((value,i)=>{assert.equal(e.units[i],unit);assert.equal(e.tolerances[i],tolerance);assert(Number.isFinite(value));assert(Math.abs(value)<=tolerance);});
 }
 const after=await state();assert.equal(canonical(after),canonical(before),'Read-only diagnostics changed accepted state, ownership or host revision');
 record(label,{report,physicalDofClaim:null,scope:'Local Jacobian at this accepted solution, not a global freedom/solvability or redundancy admission proof'});return report;
}
async function native(width){
 const solids=await h.command('inspect-worker-solids');assert.equal(solids.bodies.length,1);assert.equal(solids.outputs.length,1);
 const body=one(solids.bodies.filter(b=>b.id===binding.profile.outputId),'same native body'),m=body.metrics;assert.equal(body.featureId,binding.profile.featureId);assert.equal(m.resultKind,'single-solid');assert.equal(m.solidCount,1);assert.equal(m.nativeValidity.valid,true);assert.equal('sha256:'+m.runtime.jsSha256+':'+m.runtime.wasmSha256,build);
 near(m.nativeVolume,width*50*20);for(let i=0;i<3;i++){near(m.nativeBounds.min[i],0);near(m.nativeBounds.max[i],[width,50,20][i]);}
 const owner=await h.ownership();assert.equal(owner.resources.candidates,0);assert.equal(owner.resources.accepted,0);assert.equal(owner.resources.mounts,0);assert.equal(owner.resources.cleanupFailed,false);assert.equal(owner.processing,false);return {body,ownership:owner};
}
function savedIntent(saved,capture,width){
 assert.equal(saved.native.format,'codi-jsketcher-project');assert.equal(saved.native.version,2);assert.equal(saved.native.unit,'millimeter');assert.deepEqual(saved.native.project.model.history,capture.native.history);assert.deepEqual(saved.native.project.model.counters,capture.native.counters);
 const source=one(saved.native.project.sketches.filter(s=>s.id===binding.faceId),'actual saved sketch');assert.deepEqual(source.data,JSON.parse(capture.native.source));assert.equal(source.data.stages[0].constraints.length,11);assert.equal(source.data.stages[0].constraints.filter(c=>c.typeId==='SignedDistanceX').length,0);rectangle(capture,width);assert(!JSON.stringify(saved.native).includes('constraintId'),'Ephemeral locator was persisted');
}

try{
 h=await harness(browser,need('CODI_TEST_URL'),out,record);await h.login();const listing=await h.launch();
 for(const id of ['create-rectangle-sketch','inspect-closed-sketch','apply-closed-sketch-signed-distance','edit-closed-sketch-dimension','remove-closed-sketch-dimension','inspect-sketch-diagnostics','analyze-sketch','inspect-selected-profiles','inspect-selected-regions','create-selected-extrusion','inspect-authored-edits','travel-authored-edit','save','open-project'])assert(listing.some(c=>c.id===id),id);
 await runtime();const r=await h.command('inspect-rectangle-creation'),created=await h.command('create-rectangle-sketch',{revision:r.revision,unit:'millimeter',origin:[0,0],width:100,height:50,depth:0});binding={faceId:created.faceId};
 const initial=await inspect(),segments=initial.objects.filter(o=>o.type==='Segment');assert.equal(segments.length,4);
 const bottom=one(segments.filter(o=>{const p=initial.points.filter(p=>p.parentId===o.id);return p.length===2&&p.every(p=>p.y===0)&&p.some(p=>p.x===0)&&p.some(p=>p.x===100);}), 'public bottom Segment');
 const points=initial.points.filter(p=>p.parentId===bottom.id).sort((a,b)=>a.x-b.x);Object.assign(binding,{segmentId:bottom.id,segmentIds:segments.map(s=>s.id).sort(),pointIds:points.map(p=>p.id),frame:initial.boundaryFrame});receipt.binding=binding;
 assert.equal(initial.constraints.length,11);assert(initial.constraints.every(c=>c.admission.state==='accepted'));near(widthTarget(initial).resolvedValue,100);
 const original=await h.capture(binding.faceId);rectangle(original,100);const baseReport=await diagnostic('Actual constrained rectangle original residuals and local rank');
 const duplicate=await h.command('apply-closed-sketch-signed-distance',{revision:initial.revision,faceId:binding.faceId,axis:'x',ids:binding.pointIds,distance:100});assert.equal(duplicate.changed,true);assert.equal(duplicate.authoredUndo,true);assert.equal(duplicate.dimension.typeId,'SignedDistanceX');assert.equal(duplicate.dimension.status,'redundant');
 const dupeInfo=await inspect(),dupeSource=await h.capture(binding.faceId),signed=one(signedRows(dupeInfo),'actual redundant signed width');assert.equal(signed.admission.state,'redundant');assert.equal(signed.constants.distance,100);assert.equal(dupeInfo.constraints.length,12);rectangle(dupeSource,100);assert.deepEqual(dupeSource.native.history,original.native.history);assert.deepEqual(dupeSource.native.counters,original.native.counters);
 assert.deepEqual(JSON.parse(dupeSource.native.source).objects,JSON.parse(original.native.source).objects,'Redundant width moved geometry');
 const dupeReport=await diagnostic('Same width has real redundant admission and finite original residuals');assert.equal(dupeReport.localJacobian.rankLower,baseReport.localJacobian.rankLower);assert.equal(dupeReport.localJacobian.equations,baseReport.localJacobian.equations+1);record('Public redundant width retained without geometry or identity change',{created,binding,duplicate,original,dupeSource});
 await refuse('Conflicting signed X120 with original length100','apply-closed-sketch-signed-distance',{revision:dupeInfo.revision,faceId:binding.faceId,axis:'x',ids:binding.pointIds,distance:120},'DISTANCE_CONFLICT',{domain:'This actual Segment',existingLengthMm:100,requestedSignedXMm:120,proof:'abs(deltaX) cannot exceed Euclidean segment length;120>100. This fixture contradiction is independent of numerical solver failure.'});
 const guarded=await inspect();await refuse('Conflicting existing length120 with retained signed X100','edit-closed-sketch-dimension',{revision:guarded.revision,faceId:binding.faceId,constraintId:widthTarget(guarded).constraintId,value:120},'DIMENSION_REJECTED',{existingHorizontal:true,existingSignedXMm:100,requestedLengthMm:120,proof:'Horizontal deltaY0 with signed deltaX100 requires length100, incompatible with120.'});
 const removable=await inspect(),removed=await h.command('remove-closed-sketch-dimension',{revision:removable.revision,faceId:binding.faceId,constraintId:widthTarget(removable).constraintId});assert.equal(removed.changed,true);assert.equal(removed.authoredUndo,true);assert.equal(removed.dimension.status,'removed');
 const reactivated=await inspect();assert.equal(reactivated.dimensionTargets.filter(r=>r.typeId==='SegmentLength'&&r.objects[0]===binding.segmentId).length,0);assert.equal(one(signedRows(reactivated),'reactivated signed width').admission.state,'accepted');rectangle(await h.capture(binding.faceId),100);await diagnostic('Removing original length reactivates the surviving genuine width');record('Public dimension removal and redundancy reactivation',{removed,reactivated});
 await h.travel('undo');assert.equal((await h.capture(binding.faceId)).native.source,dupeSource.native.source);assert.equal(one(signedRows(await inspect()),'restored redundant width').admission.state,'redundant');
 await h.travel('undo');const clean=await h.capture(binding.faceId);assert.equal(clean.native.source,original.native.source);assert.deepEqual(clean.native.history,original.native.history);assert.deepEqual(clean.native.counters,original.native.counters);assert.equal(signedRows(await inspect()).length,0);
 const edited=await editWidth(120);assert.equal(edited.changed,true);assert.equal(edited.authoredUndo,true);assert.equal(edited.dimension.status,'accepted');near(edited.dimension.resolvedValue,120);rectangle(await h.capture(binding.faceId),120);
 await h.travel('undo');assert.equal((await h.capture(binding.faceId)).native.source,original.native.source);await h.travel('redo');rectangle(await h.capture(binding.faceId),120);await diagnostic('Healthy positive edit after contradiction recovery');record('Shared mixed Undo restores original intent and positive width120 succeeds',{edited,state:await state()});
 const selected=await h.command('inspect-selected-profiles',{engineRevision:build});assert(selected.ready,selected.reason);assert.equal(selected.engineRevision,build);const discovered=await h.command('inspect-selected-regions',{revision:selected.revision,faceId:binding.faceId,depth:20,engineRevision:build});
 const region=one(discovered.regions.filter(r=>r.support==='supported'&&r.descriptor.outerCurveIds.length===4&&r.descriptor.holeCurveIds.length===0),'actual recovered rectangle region');assert.deepEqual(region.descriptor.outerCurveIds.slice().sort(),binding.segmentIds);binding.regionId=region.regionId;
 binding.profile=await h.command('create-selected-extrusion',{revision:selected.revision,faceId:binding.faceId,regionId:region.regionId,unit:'millimeter',engine:'occ',engineRevision:build,depth:20,bodyPolicy:'separate'});assert.equal(binding.profile.engineRevision,build);record('Recovered source produces one genuine120000mm3 solid',{binding,observation:await native(120)});
 const file='/E07-recovery-'+h.username+'.jsketcher.json',beforeSave=await h.capture(binding.faceId),saved=await h.save(file,'recovered-width120');savedIntent(saved,beforeSave,120);receipt.saved.push({file,savedFile:'recovered-width120.jsketcher.json',sha256:saved.sha256,bytes:saved.bytes.length,width:120,binding:structuredClone(binding)});flush();
 await h.freshOpen(file);await runtime();const opened=await h.capture(binding.faceId);assert.equal(opened.journal.canUndo,false);assert.equal(opened.journal.canRedo,false);assert.deepEqual(opened.native.history,beforeSave.native.history);assert.deepEqual(opened.native.counters,beforeSave.native.counters);assert.deepEqual(JSON.parse(opened.native.source),JSON.parse(beforeSave.native.source));await native(120);
 const reedit=await editWidth(150);assert.equal(reedit.changed,true);assert.equal(reedit.authoredUndo,true);near(reedit.dimension.resolvedValue,150);rectangle(await h.capture(binding.faceId),150);await native(150);const tip=await h.capture(binding.faceId);assert.deepEqual(tip.native.history,opened.native.history);assert.deepEqual(tip.native.counters,opened.native.counters);
 await h.travel('undo');assert.equal((await h.capture(binding.faceId)).native.source,opened.native.source);await native(120);await h.travel('redo');assert.equal((await h.capture(binding.faceId)).native.source,tip.native.source);await native(150);await diagnostic('Fresh native Open positive edit and normal UndoRedo');
 const beforeResave=await h.capture(binding.faceId),again=await h.save(file,'recovered-width150');savedIntent(again,beforeResave,150);assert.notEqual(again.sha256,saved.sha256);receipt.saved.push({file,savedFile:'recovered-width150.jsketcher.json',sha256:again.sha256,bytes:again.bytes.length,width:150,binding:structuredClone(binding)});flush();
 await h.freshOpen(file);await runtime();const final=await h.capture(binding.faceId);assert.deepEqual(final.native.history,beforeResave.native.history);assert.deepEqual(final.native.counters,beforeResave.native.counters);assert.deepEqual(JSON.parse(final.native.source),JSON.parse(beforeResave.native.source));assert.equal(final.journal.canUndo,false);rectangle(final,150);await native(150);record('Normal Save sync fresh Open reedit UndoRedo resave and fresh Open complete',{file,firstSHA:saved.sha256,finalSHA:again.sha256,final});receipt.status='PASS';
}catch(error){receipt.status='FAIL';receipt.error={name:error.name,code:error.code??null,message:error.message,stack:error.stack};console.error(error.stack);process.exitCode=1;}
finally{try{if(h){await h.retire();record('Owned context retired after all commands and durable writes settled',{sharedBrowserRetained:true});}}catch(error){receipt.status='FAIL';receipt.cleanupError={name:error.name,message:error.message};process.exitCode=1;}finally{receipt.sourceHashesAfter=hashes();if(canonical(receipt.sourceHashesAfter)!==canonical(receipt.sourcePins)){receipt.status='FAIL';receipt.sourceChanged=true;process.exitCode=1;}flush();await browser.disconnect();}}
