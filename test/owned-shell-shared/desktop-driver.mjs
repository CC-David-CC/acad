// Prepared complete E12 workflow. Execute only against root's frozen composed
// signed runtime. All authoring uses the real registered public command API.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';

const need=key=>{assert(process.env[key],key+' required');return process.env[key];};
const desktop=path.resolve(need('CODI_DESKTOP_SOURCE_ROOT')),helper=path.join(desktop,'test/agent-cad-corpus/sweep/signed-harness.mjs'),agentPath=path.join(desktop,'apps/system/jsketcher/examples/cad-agent.mjs');
const {harness}=await import(pathToFileURL(helper));
const exampleUrl=new URL('./source-bound-shell.mjs',import.meta.url),exampleText=fs.readFileSync(exampleUrl,'utf8');
assert.equal(exampleText.split("'./cad-agent.mjs'").length,2,'One exact recipe helper import');
const exampleModule='data:text/javascript;base64,'+Buffer.from(exampleText.replace("'./cad-agent.mjs'",JSON.stringify(pathToFileURL(agentPath).href))).toString('base64');
const {createSourceBoundShellExample,SHELL_ENGINE_REVISION}=await import(exampleModule);
const pins=JSON.parse(fs.readFileSync(need('CODI_SIGNED_PINS'))),out=path.resolve(need('CODI_EVIDENCE')),base=need('CODI_TEST_URL'),cdp=need('CODI_TEST_CDP');
assert.equal(pins.source,need('CODI_EXPECT_SOURCE'));assert.equal(pins.desktop,need('CODI_EXPECT_DESKTOP'));
for(const url of[base,cdp])assert(['127.0.0.1','localhost'].includes(new URL(url).hostname),'Private root fixture only');
assert.match(pins.outer?.bundleSHA256||'',/^[a-f0-9]{64}$/);assert.match(pins.outer?.sha256||'',/^[a-f0-9]{64}$/);assert(Object.keys(pins.files||{}).length>10);
assert(!fs.existsSync(out),'Preserve earlier runs; use a fresh output directory');fs.mkdirSync(out,{recursive:true});
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const canonical=value=>JSON.stringify(function order(v){return Array.isArray(v)?v.map(order):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,order(v[k])])):v;}(value));
const sourceFiles=[new URL('./desktop-driver.mjs',import.meta.url),exampleUrl,new URL('./README.md',import.meta.url),pathToFileURL(helper),pathToFileURL(agentPath),pathToFileURL(path.join(desktop,'test/agent-cad-corpus/strict-join/oracle.mjs'))];
const hashes=()=>Object.fromEntries(sourceFiles.map(url=>[url.href,sha(fs.readFileSync(url))]));
const receipt={status:'RUNNING',scope:'Bounded actual E12 inward top-open box shell through public native feature, source/thickness replay, shared travel and normal Save/Open; not arbitrary shell-domain or full Gate1 approval',pins,engineRevision:SHELL_ENGINE_REVISION,sourcePins:hashes(),sourceSeeds:false,fakeSuccessfulReplies:false,recipeTransport:'exact on-disk example with helper import rebound to pinned Desktop source; actual registry dispatch including expectedDocumentToken, not served-example execution',tolerance:{nativeVolumeAbsMm3:1e-6,nativeBoundsAbsMm:1e-6},rows:[],commands:[],saved:[]};
const flush=()=>fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(receipt,null,2)+'\n');
const record=(label,data={})=>{receipt.rows.push(structuredClone({label,...data}));flush();console.log(label);};
const one=(rows,label)=>{assert.equal(rows.length,1,'One '+label+' required');return rows[0];};
const near=(actual,expected)=>assert(Number.isFinite(actual)&&Math.abs(actual-expected)<=1e-6,`${actual} differs from ${expected}`);
const require=createRequire(import.meta.url),pp=need('PUPPETEER_CORE_PATH');assert.equal(require(path.join(pp,'package.json')).version,'24.35.0');
const browser=await require(pp).connect({browserURL:cdp,protocolTimeout:300000}),h=await harness(browser,base,out,record);
let example,binding,descriptors,expected={width:100,depth:50,height:20,thickness:2};
const required=['inspect','create-worker-solid-box','inspect-worker-solids','inspect-worker-solid-history','edit-worker-solid-box','inspect-worker-shells','create-worker-shell','inspect-worker-shell-history','edit-worker-shell','classify-worker-solid-points','inspect-authored-edits','travel-authored-edit','save','open-project'];

async function bindExample(){
 descriptors=await h.page.evaluate(id=>codiDesktopCommands.list().filter(row=>row.appId==='jsketcher'&&row.windowId===id),h.windowId);
 for(const id of required)assert(descriptors.some(row=>row.id===id),id+' must be truly registered');
 example=createSourceBoundShellExample({engineRevision:SHELL_ENGINE_REVISION,windowId:h.windowId,api:{list:()=>descriptors,execute:async request=>{
  assert.equal(request.windowId,h.windowId);assert.equal(typeof request.expectedDocumentToken,'string');
  const result=await h.page.evaluate(async request=>{try{return{ok:true,value:await codiDesktopCommands.execute(request)}}catch(error){return{ok:false,error:{name:error.name,message:error.message,code:error.code??null,committed:error.committed===true,possiblyCommitted:error.possiblyCommitted===true}}}},request);
  descriptors=await h.page.evaluate(id=>codiDesktopCommands.list().filter(row=>row.appId==='jsketcher'&&row.windowId===id),h.windowId);
  receipt.commands.push({command:request.command,args:structuredClone(request.args),ok:result.ok,...(!result.ok?{error:result.error}:{})});flush();
  if(!result.ok)throw Object.assign(Error(result.error.message),result.error);return result.value;
 }}});
}
async function runtime(){
 const assets=await h.pinFiles(Object.keys(pins.files));for(const asset of assets)assert.equal(asset.sha256,pins.files[asset.name],asset.name);
 const outer=await h.pinOuter({bundle:pins.outer.bundleSHA256});assert.equal(outer.sha256,pins.outer.sha256);record('Exact composed runtime and all declared byte pins',{assets,outer});
}
async function capture(){return{accepted:await h.capture(null),ownership:await h.ownership(),lifetime:await h.frame.evaluate(()=>({documentGeneration:__CAD_APP.projectService.documentGeneration,evaluationEpoch:__CAD_APP.craftService.evaluationEpoch,manufacturing:structuredClone(__CAD_APP.projectManager.getManufacturingMetadata())}))};}
function stable(value){const copy=structuredClone(value);delete copy.accepted.solids.revision;delete copy.accepted.journal.revision;delete copy.lifetime.evaluationEpoch;return copy;}
function shapeExpectation(shell=true){const {width:w,depth:d,height:z,thickness:t}=expected;return{volume:shell?w*d*z-(w-2*t)*(d-2*t)*(z-t):w*d*z,bounds:{min:[0,0,0],max:[w,d,z]}};}
function probes(shell){const {width:w,depth:d,height:z,thickness:t}=expected;return[
 {id:'central-material-or-open-cavity',point:[w/2,d/2,z/2],classification:shell?'outside':'inside'},
 {id:'bottom-material',point:[w/2,d/2,shell?t/2:z/4],classification:'inside'},
 {id:'side-material',point:[shell?t/2:w/4,d/2,z/2],classification:'inside'},
 {id:'above-open-top',point:[w/2,d/2,z+1],classification:'outside'},
 {id:'left-exterior',point:[-1,d/2,z/2],classification:'outside'},
 {id:'outer-bottom',point:[w/2,d/2,0],classification:'boundary'},
 ...(shell?[{id:'inner-floor',point:[w/2,d/2,t],classification:'boundary'},{id:'removed-top-center',point:[w/2,d/2,z],classification:'outside'}]:[])
 ];}
async function state(label,{shell=true,query=true}={}){
 const before=await capture(),info=before.accepted.solids,body=one(info.bodies,'whole part output'),id=shell?binding.shell.outputId:binding.box.outputId,featureId=shell?binding.shell.featureId:binding.box.featureId,m=body.metrics,truth=shapeExpectation(shell);
 assert.equal(body.id,id);assert.equal(body.featureId,featureId);assert.equal(body.engine,'occ');assert.equal(m.resultKind,'single-solid');assert.equal(m.solidCount,1);assert.equal(m.nativeValidity.valid,true);assert.equal('sha256:'+m.runtime.jsSha256+':'+m.runtime.wasmSha256,SHELL_ENGINE_REVISION);near(m.nativeVolume,truth.volume);
 for(const key of['min','max'])for(let i=0;i<3;i++)near(m.nativeBounds[key][i],truth.bounds[key][i]);
 const own=before.ownership;assert.equal(own.processing,false);for(const key of['candidates','accepted','mounts'])assert.equal(own.resources[key],0,key);assert.equal(own.resources.cleanupFailed,false);
 let response=null;
 if(query){const checks=probes(shell),request={revision:info.revision,version:1,unit:'millimeter',engine:'occ',engineRevision:SHELL_ENGINE_REVISION,bodyId:id,featureId,points:checks.map(check=>check.point)};
  record('Native observation request before dispatch',{label,request,expected:checks,before});
  response=await h.command('classify-worker-solid-points',request);record('Raw native observation before independent assertions',{label,response});
  for(const key of['revision','version','unit','engine','engineRevision','bodyId','featureId'])assert.equal(response[key],request[key]);assert.equal(response.quality,'native-re-evaluation-observation');assert.equal(response.points.length,checks.length);
  response.points.forEach((row,i)=>{assert.deepEqual(row.point,checks[i].point);assert.equal(row.classification,checks[i].classification,checks[i].id);});
  const after=await capture();assert.equal(canonical(after),canonical(before),'Native read changed accepted source/history/metrics/revisions/epoch/counters/manufacturing/resources');
 }
 const history=before.accepted.native.history,box=one(history.filter(row=>row.params.featureId===binding.box.featureId),'original box intent');assert.equal(box.type,'WORKER_SOLID_BOX_V1');
 for(const key of['width','depth','height'])assert.equal(box.params[key],expected[key]);for(const key of['x','y','z'])assert.equal(box.params[key],0);assert.equal(box.params.engineRevision,SHELL_ENGINE_REVISION);
 const shellEntries=history.filter(row=>row.params.featureId===binding.shell.featureId);assert.equal(shellEntries.length,shell?1:0);
 if(shell){const intent=shellEntries[0];assert.equal(intent.type,'WORKER_SOLID_SHELL_V1');assert.deepEqual(Object.keys(intent.params).sort(),['version','unit','engine','engineRevision','featureId','target','producerFeatureId','removedFaceIds','thickness','direction'].sort());assert.equal(intent.params.target,binding.box.outputId);assert.equal(intent.params.producerFeatureId,binding.box.featureId);assert.equal(intent.params.engineRevision,SHELL_ENGINE_REVISION);assert.deepEqual(intent.params.removedFaceIds,[binding.removedFace.id]);assert.equal(intent.params.direction,'inward');assert.equal(intent.params.thickness,expected.thickness);assert.equal(info.bodies.some(body=>body.id===binding.box.outputId),false);}
 assert.deepEqual(before.accepted.native.sketches,[]);record(label,{expected:structuredClone(expected),truth,body,before,nativeClassifications:response});return before;
}
async function refused(label,work,{codes=[],names=[]}={}){
 const before=await capture();let failure;
 try{await work();}catch(error){failure={name:error.name,code:error.code??null,message:error.message,committed:error.committed===true,possiblyCommitted:error.possiblyCommitted===true};}
 const after=await capture();record(label+' raw outcome before assertions',{failure:failure??null,before,after});assert(failure,'Expected refusal');assert(!failure.committed&&!failure.possiblyCommitted);assert(codes.includes(failure.code)||names.includes(failure.name),'Unexpected refusal '+failure.name+'/'+failure.code);
 assert.equal(canonical(stable(after)),canonical(stable(before)),'Refusal changed accepted source/history/geometry/counters/document/manufacturing/resources');return failure;
}
async function save(file,label){
 const before=await capture(),result=await example.save(file);assert.equal(result.persistence,'browser');
 const saved=await h.synchronize(file),bytes=Buffer.from(saved.bytes);fs.writeFileSync(path.join(out,label+'.jsketcher.json'),bytes);assert.deepEqual(saved.native.project.model.history,before.accepted.native.history);assert.deepEqual(saved.native.project.sketches,[]);
 receipt.saved.push({file,savedFile:label+'.jsketcher.json',sha256:saved.sha256,bytes:bytes.length,expected:structuredClone(expected),binding});record(label+' normal native Save/server byte equality',{result,sha256:saved.sha256,bytes:bytes.length});return{saved,before};
}

try{
 await h.login();await h.launch();await runtime();await bindExample();binding=await example.build();receipt.binding=binding;
 assert.equal(binding.removedFace.role,'Z_MAX');assert.equal(binding.removedFace.originFeatureId,binding.box.featureId);assert.equal(binding.removedFace.geometry,'plane');assert.equal(binding.box.engineRevision,SHELL_ENGINE_REVISION);
 const built=await state('Genuine public top-open100x50x20 shell thickness2 has20512mm3 material'),counters=built.accepted.native.counters;
 const append=await h.command('inspect-authored-edits');assert.equal(append.undoTarget.kind,'operation-append');assert.equal(append.undoTarget.featureId,binding.shell.featureId);
 await example.travel('undo');await state('Shell creation Undo restores genuine solid box',{shell:false});await example.travel('redo');const redone=await state('Shell creation Redo preserves original feature and opaque top-face ID');assert.deepEqual(redone.accepted.native.counters,counters);
 const prior=await h.command('inspect-worker-shell-history');await example.editThickness(binding,3);expected.thickness=3;await state('Thickness3 regenerates genuine shell with29688mm3 material');
 const beforeNoop=await capture(),noop=await example.editThickness(binding,3);assert.equal(noop.changed,false);assert.equal(canonical(await capture()),canonical(beforeNoop));record('Same thickness no-op preserves all source/journal/resource tokens',{noop});
 await example.resizeBox(binding,{width:120,depth:60,height:25});Object.assign(expected,{width:120,depth:60,height:25});await state('Original source box resize propagates through unchanged shell selection');
 await example.travel('undo');Object.assign(expected,{width:100,depth:50,height:20});await state('Mixed Undo restores original box dimensions while retaining thickness3');
 await example.travel('undo');expected.thickness=2;await state('Mixed Undo restores thickness2');await example.travel('undo');await state('Mixed Undo then removes shell creation',{shell:false});
 await example.travel('redo');await state('Mixed Redo restores shell creation');await example.travel('redo');expected.thickness=3;await state('Mixed Redo restores thickness3');await example.travel('redo');Object.assign(expected,{width:120,depth:60,height:25});const tip=await state('Mixed Redo restores edited source and shell');assert.deepEqual(tip.accepted.native.counters,counters);
 await refused('Nonpositive public thickness refuses preserving accepted part',async()=>{const info=await h.command('inspect-worker-shell-history'),feature=one(info.features.filter(f=>f.featureId===binding.shell.featureId),'current shell');return h.command('edit-worker-shell',{revision:info.revision,index:feature.index,featureId:feature.featureId,thickness:0});},{codes:['INVALID_REQUEST',null]});
 await refused('Native inward collapse refuses preserving the last valid shell',()=>example.editThickness(binding,1000),{codes:['SHELL_BUILD_FAILED','SHELL_INVALID_RESULT','SHELL_INVALID_INPUT','SHELL_UNSUPPORTED_INPUT','SHELL_FAILED']});
 await refused('Stale shell edit revision refuses',()=>h.command('edit-worker-shell',{revision:prior.revision,index:one(prior.features.filter(f=>f.featureId===binding.shell.featureId),'old shell').index,featureId:binding.shell.featureId,thickness:4}),{codes:['STALE_HISTORY'],names:['AbortError']});
 await refused('Already removed source top face is not invented on shell descendant',async()=>{const info=await h.command('inspect-worker-shells');return h.command('create-worker-shell',{revision:info.revision,version:1,unit:'millimeter',engine:'occ',engineRevision:SHELL_ENGINE_REVISION,bodyId:binding.shell.outputId,removedFaceIds:[binding.removedFace.id],thickness:1,direction:'inward'});},{codes:['UNRESOLVED_SELECTION']});
 await state('Healthy actual native continuation after refusals');
 const file='/Owned-shell-'+h.username+'.jsketcher.json',first=await save(file,'shell-source-edited');await h.freshOpen(file);await runtime();await bindExample();
 const reopened=await state('Normal fresh Open restores semantic shell and original source IDs');assert.equal(reopened.accepted.journal.canUndo,false);assert.deepEqual(reopened.accepted.native.history,first.before.accepted.native.history);assert.deepEqual(reopened.accepted.native.counters,first.before.accepted.native.counters);
 await example.editThickness(binding,2.5);expected.thickness=2.5;await state('Freshly opened shell thickness reedit remains native and source-bound');await example.travel('undo');expected.thickness=3;await state('Reopened edit Undo');await example.travel('redo');expected.thickness=2.5;await state('Reopened edit Redo');
 const second=await save(file,'shell-reedited');await h.freshOpen(file);await runtime();await bindExample();const final=await state('Reedited native resave and second fresh Open retain semantic feature');assert.deepEqual(final.accepted.native.history,second.before.accepted.native.history);assert.deepEqual(final.accepted.native.counters,second.before.accepted.native.counters);
 receipt.finalExpected=expected;receipt.status='PASS';
}catch(error){receipt.status='FAIL';receipt.error={name:error.name,code:error.code??null,message:error.message,stack:error.stack};console.error(error.stack);process.exitCode=1;}
finally{try{await h.retire();receipt.cleanup='owned context closed after awaited commands/file sync; shared browser left alive';}catch(error){receipt.status='FAIL';receipt.cleanupError={name:error.name,message:error.message};process.exitCode=1;}finally{receipt.sourceHashesAfter=hashes();if(canonical(receipt.sourceHashesAfter)!==canonical(receipt.sourcePins)){receipt.status='FAIL';receipt.sourceChanged=true;process.exitCode=1;}flush();await browser.disconnect();}}
