// ONE complete public workflow; preparation only until root composes exact pins.
import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {createRequire} from 'node:module';import {fileURLToPath,pathToFileURL} from 'node:url';import {spawnSync} from 'node:child_process';
const need=k=>{assert(process.env[k],k+' required');return process.env[k];};
const root=path.resolve(need('CODI_DESKTOP_SOURCE_ROOT')),out=path.resolve(need('CODI_EVIDENCE')),build=need('CODI_ENGINE_REVISION');
const pins=JSON.parse(fs.readFileSync(need('CODI_SIGNED_PINS'))),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.equal(pins.source,need('CODI_EXPECT_SOURCE'));assert.equal(pins.desktop,need('CODI_EXPECT_DESKTOP'));assert.match(build,/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/);
for(const k of ['CODI_TEST_URL','CODI_TEST_CDP'])assert(['127.0.0.1','localhost'].includes(new URL(need(k)).hostname));
assert(!fs.existsSync(out),'Retain every prior attempt');fs.mkdirSync(out,{recursive:true});
const harnessFile=path.join(root,'test/agent-cad-corpus/sweep/signed-harness.mjs'),exampleFile=path.join(root,'apps/system/jsketcher/examples/source-bound-native-frame.mjs'),agentFile=path.join(root,'apps/system/jsketcher/examples/cad-agent.mjs');
const {harness}=await import(pathToFileURL(harnessFile)),{createSourceBoundNativeFrameExample}=await import(pathToFileURL(exampleFile));
const require=createRequire(import.meta.url),puppeteer=need('PUPPETEER_CORE_PATH');assert.equal(require(path.join(puppeteer,'package.json')).version,'24.35.0');
const receipt={status:'RUNNING',scope:'C08 Phase B finite extrusion-cap attachment',pins,engineRevision:build,privateAuthoring:false,sourceSeeds:false,rows:[],commands:[],observations:[],saves:[],refusals:[],discoveries:[]};
const flush=()=>fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(receipt,null,2)+'\n'),record=(label,data={})=>{receipt.rows.push(structuredClone({label,...data}));flush();console.log(label);};
const sources=[fileURLToPath(import.meta.url),fileURLToPath(new URL('./check.py',import.meta.url)),fileURLToPath(new URL('./SOURCE.md',import.meta.url)),fileURLToPath(new URL('../native-cad-container/archive_oracle.py',import.meta.url)),harnessFile,exampleFile,agentFile];
fs.mkdirSync(path.join(out,'source'));receipt.sourcePins=sources.map(original=>{const data=fs.readFileSync(original),digest=sha(data),file='source/'+digest+'-'+path.basename(original);fs.writeFileSync(path.join(out,file),data);return{original,file,sha256:digest};});
const browser=await require(puppeteer).connect({browserURL:need('CODI_TEST_CDP'),protocolTimeout:300000}),contexts=new Set();
let h,recipe,profileSource,alternateSource,parent,alternative,attached,child,baselineLocal,file;
const identity=()=>({origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]}),basis=origin=>({kind:'basis',frame:{...identity(),origin}});
const one=(rows,label)=>{assert.equal(rows.length,1,label);return rows[0];},near=(a,b,t=5e-8)=>assert(Number.isFinite(a)&&Math.abs(a-b)<=t,`${a} differs from ${b}`);
const local=raw=>{const value=typeof raw==='string'?JSON.parse(raw):structuredClone(raw);value.metadata={...value.metadata,boundaryFrame:null};return value;};
async function call(command,args={},expectedDocumentToken){
 receipt.commands.push({command,args:structuredClone(args),documentPinned:expectedDocumentToken!==undefined});
 const reply=await h.page.evaluate(async input=>{try{return{ok:true,value:await codiDesktopCommands.execute(input)}}catch(e){return{ok:false,error:{name:e.name,message:e.message,code:e.code??null,committed:e.committed===true,possiblyCommitted:e.possiblyCommitted===true}}}},{windowId:h.windowId,command,args,...(expectedDocumentToken===undefined?{}:{expectedDocumentToken})});
 if(!reply.ok)throw Object.assign(Error(reply.error.message),reply.error);return reply.value;
}
async function pin(){contexts.add(h.page.browserContext().id);const assets=await h.pinFiles(Object.keys(pins.files));for(const row of assets)assert.equal(row.sha256,pins.files[row.name]);const outer=await h.pinOuter({bundle:pins.outer.bundleSHA256});assert.equal(outer.sha256,pins.outer.sha256);record('Exact composed runtime pins',{assets,outer});}
async function currentRecipe(){const list=await h.page.evaluate(()=>codiDesktopCommands.list());return createSourceBoundNativeFrameExample({windowId:h.windowId,api:{list:()=>list,execute:r=>call(r.command,r.args,r.expectedDocumentToken)}});}
async function state(){return{capture:await h.capture(attached?.faceId),ownership:await h.ownership(),frames:await call('inspect-source-frames')};}
function stable(value){const copy=structuredClone(value);delete copy.capture.solids.revision;delete copy.capture.journal.revision;delete copy.frames.revision;return copy;}
function settled(value){assert.equal(value.ownership.processing,false);const r=value.ownership.resources;for(const k of ['candidates','accepted','mounts'])assert.equal(r[k],0);assert.equal(r.cleanupFailed,false);assert(r.owners<=3);assert.equal(r.owners,r.detached);}
async function primitive(faceId,kind,data){const i=await call('inspect-closed-sketches');return call('append-sketch-primitive',{revision:i.revision,faceId,kind,role:null,stage:0,data});}
async function rectangle(faceId,x=0){
 const corners=[[x,0],[x+100,0],[x+100,50],[x,50]],edges=[];
 for(let n=0;n<4;n++)edges.push(await primitive(faceId,'Segment',{a:{x:corners[n][0],y:corners[n][1]},b:{x:corners[(n+1)%4][0],y:corners[(n+1)%4][1]}}));
 for(const [kind,ids]of [['horizontal',[edges[0].primitive.id,edges[2].primitive.id]],['vertical',[edges[1].primitive.id,edges[3].primitive.id]]]){const i=await call('inspect-closed-sketches');await call('apply-closed-sketch-orientation',{revision:i.revision,faceId,kind,ids});}
 return edges.map(e=>e.primitive.id);
}
async function source(origin){const i=await call('inspect-source-frames');return call('create-source-frame',{revision:i.revision,unit:'millimeter',parent:null,placement:basis(origin)});}
async function extrusion(faceId,depth){const i=await call('inspect-selected-profiles',{engineRevision:build});assert(i.ready);assert.equal(i.profileVersion,3);const choices=await call('inspect-selected-regions',{revision:i.revision,faceId,depth,engineRevision:build}),r=one(choices.regions.filter(row=>row.support==='supported'),'actual selected region');return call('create-selected-extrusion',{revision:choices.revision,faceId,regionId:r.regionId,unit:'millimeter',engine:'occ',engineRevision:build,depth,bodyPolicy:'separate'});}
async function discover(target){const before=await state(),solids=await call('inspect-worker-solids'),body=one(solids.bodies.filter(row=>row.featureId===target.featureId),'actual parent output'),i=await call('inspect-source-frames'),reply=await call('inspect-source-frame-attachments',{revision:i.revision,bodyId:body.id,featureId:body.featureId}),after=await state();assert.deepEqual(after,before);settled(after);receipt.discoveries.push({target:structuredClone(target),reply,before,after});flush();return reply;}
async function travel(direction){const i=await call('inspect-authored-edits');assert(i[direction==='undo'?'canUndo':'canRedo']);return call('travel-authored-edit',{revision:i.revision,direction});}
async function refuse(label,work,code){const before=await state();let error;try{await work()}catch(e){error={name:e.name,message:e.message,code:e.code,committed:e.committed===true,possiblyCommitted:e.possiblyCommitted===true};}const after=await state();record(label+' raw',{before,after,error:error||null});assert(error);if(code)assert.equal(error.code,code);assert(!error.committed&&!error.possiblyCommitted);assert.deepEqual(stable(after),stable(before));settled(after);receipt.refusals.push({label,error});flush();}
const truth=(z,{posed=false,alternate=false,reselected=false,depth=25,alternativeDepth=15}={})=>{
 const center=alternate?[250,25]:posed?[-14,42]:[50,25],frame={...identity(),origin:alternate?[200,0,z]:posed?[11,-8,z]:[0,0,z]};
 if(posed&&!alternate){frame.x=[0,1,0];frame.y=[-1,0,0];}
 return{frame,bounds:{min:[center[0]-5,center[1]-5,z],max:[center[0]+5,center[1]+5,z+10]},points:[[...center,z+5],[center[0]+6,center[1],z+5],[...center,z-1]],parentPoints:posed?[[-9,reselected?152:12,13],[-9,reselected?152:12,depth+4]]:[[20,20,10],[20,20,depth+1]],depth,alternativeDepth};
};
async function query(body,points){const i=await call('inspect-worker-solids');return call('classify-worker-solid-points',{revision:i.revision,version:1,unit:'millimeter',engine:'occ',engineRevision:build,bodyId:body.id,featureId:body.featureId,points});}
async function observe(label,expected){
 const before=await state(),bodies=before.capture.solids.bodies,body=one(bodies.filter(b=>b.featureId===child.featureId),'actual child Native output');
 assert.deepEqual(local(one(before.capture.native.sketches.filter(s=>s.id===attached.faceId),'actual local source').source),baselineLocal);
 const frame=one(before.frames.features.filter(row=>row.featureId===attached.featureId),'actual attached frame').frame;
 for(const key of ['origin','x','y','z'])frame[key].forEach((v,i)=>near(v,expected.frame[key][i]));
 const m=body.metrics;near(m.nativeVolume,250*Math.PI,1e-6);assert.equal(m.nativeValidity.valid,true);assert.equal(m.solidCount,1);assert.equal('sha256:'+m.runtime.jsSha256+':'+m.runtime.wasmSha256,build);
 for(const key of ['min','max'])m.nativeBounds[key].forEach((v,i)=>near(v,expected.bounds[key][i],1e-6));
 const pb=one(bodies.filter(b=>b.featureId===parent.featureId),'actual original parent'),ab=one(bodies.filter(b=>b.featureId===alternative.featureId),'actual alternative parent');near(pb.metrics.nativeVolume,5000*expected.depth,1e-6);near(ab.metrics.nativeVolume,5000*expected.alternativeDepth,1e-6);
 const classifications=await query(body,expected.points),parentQuery=await query(pb,expected.parentPoints);record(label+' raw Native observations',{expected,classifications,parentQuery});
 assert.equal(classifications.quality,'native-re-evaluation-observation');assert.deepEqual(classifications.points.map(p=>p.classification),['inside','outside','outside']);assert.deepEqual(parentQuery.points.map(p=>p.classification),['inside','outside']);
 const after=await state();assert.deepEqual(after,before,'Native observation changed accepted state');settled(after);receipt.observations.push({label,expected,before,after,query:classifications,parentQuery});record(label);
}
async function save(label){
 const before=await state(),i=await call('inspect'),result=await call('save',{revision:i.revision,...(!i.path?{path:file}:{})});assert.equal(result.committed,true);assert.equal(result.nativeArchive.format,'codi-cad-project');
 const deadline=Date.now()+120000;let data;while(Date.now()<deadline){try{data=await h.page.evaluate(async file=>{const a=await(await mirrorFileContext()).files.read(file),b=await(await serverFileContext()).files.read(file.slice(1));return a.sha256===b.sha256?{sha256:b.sha256,bytes:Array.from(b.data)}:null;},file);}catch{}if(data)break;await new Promise(r=>setTimeout(r,200));}
 assert(data,'Normal saved-file server synchronization required');const bytes=Buffer.from(data.bytes);assert.equal(sha(bytes),data.sha256);fs.writeFileSync(path.join(out,label+'.cad'),bytes);assert.deepEqual(stable(await state()),stable(before));receipt.saves.push({label,file,savedFile:label+'.cad',sha256:data.sha256,bytes:bytes.length,result,before});record('Normal .cad Save/server integrity',{label,sha256:data.sha256});
}
async function reopen(){await h.freshOpen(file);await pin();recipe=await currentRecipe();assert.equal((await call('inspect-authored-edits')).canUndo,false);}
try{
 h=await harness(browser,need('CODI_TEST_URL'),out,record);await h.login();const commands=await h.launch();
 for(const id of ['inspect-source-frame-attachments','repair-source-frame-parent','create-source-frame'])assert(commands.some(c=>c.id===id));
 await pin();recipe=await currentRecipe();file='/Native-attached-source-'+h.username+'.cad';
 profileSource=await source([0,0,0]);await rectangle(profileSource.faceId);parent=await extrusion(profileSource.faceId,20);
 alternateSource=await source([200,0,0]);await rectangle(alternateSource.faceId);alternative=await extrusion(alternateSource.faceId,15);
 receipt.profileSource=profileSource;receipt.alternateSource=alternateSource;receipt.parent=parent;receipt.alternative=alternative;
 await discover(parent);attached=await recipe.attach(parent);receipt.attached=attached;
 const created=await state(),highWater=created.capture.native.counters.featureId;
 await travel('undo');let undo=await state();assert(!undo.capture.native.history.some(row=>Number(row.params.featureId)===attached.featureId));assert(!undo.capture.native.sketches.some(row=>row.id===attached.faceId));assert.equal(undo.capture.native.counters.featureId,highWater);
 await travel('redo');assert.deepEqual((await state()).capture.native.sketches,created.capture.native.sketches);record('Native-attached source creation travel preserves genuine bytes/high-water');
 await primitive(attached.faceId,'Circle',{c:{x:50,y:25},r:5});child=await extrusion(attached.faceId,10);receipt.child=child;
 baselineLocal=local(one((await state()).capture.native.sketches.filter(row=>row.id===attached.faceId),'actual authored child source').source);receipt.baselineLocal=baselineLocal;
 await observe('Initial genuine parent depth20 cap',truth(20,{depth:20}));
 await recipe.depth(parent,25);await observe('Attached sketch follows actual extrusion depth20 to25',truth(25));
 await travel('undo');await observe('Depth Undo restores native attachment',truth(20,{depth:20}));await travel('redo');await observe('Depth Redo restores native attachment',truth(25));
 const pose={kind:'rigid',frame:identity(),axis:[0,0,1],angleDegrees:90,pivot:[10,0,0],translation:[1,2,3]};
 let i=await call('inspect-source-frames');await call('edit-source-frame',{revision:i.revision,index:profileSource.index,featureId:profileSource.featureId,faceId:profileSource.faceId,placement:pose});
 await observe('Actual parent source non-origin pivot and orientation',truth(28,{posed:true}));await travel('undo');await observe('Mixed source pose Undo',truth(25));await travel('redo');await observe('Mixed source pose Redo',truth(28,{posed:true}));
 const stale=await call('inspect-source-frames');await recipe.depth(parent,26);
 await refuse('Opaque stale source revision',()=>call('edit-source-frame',{revision:stale.revision,index:attached.index,featureId:attached.featureId,faceId:attached.faceId,placement:basis([0,0,0])}),'STALE_HISTORY');
 await travel('undo');await travel('redo');await travel('undo');await observe('Chronology survives source refusal',truth(28,{posed:true}));
 const parentRead=await discover(parent),actual=one(parentRead.parents.filter(row=>row.observation.role==='last-cap'),'real Native cap'),bad={kind:'native-planar-face',bodyId:actual.parent.bodyId,featureId:actual.parent.featureId,selectionId:'own-negative-unresolved-selection'};
 await refuse('Missing opaque face cannot invent attachment',async()=>{const s=await call('inspect-source-frames');return call('create-source-frame',{revision:s.revision,unit:'millimeter',parent:bad,placement:basis([0,0,0])});},'UNSUPPORTED_FRAME_PARENT');
 const units=await call('inspect-display-units');await call('set-display-units',{revision:units.revision,lengthUnit:'inch'});await observe('Inch display preserves physical native datum',truth(28,{posed:true}));
 await save('parent25-posed');await reopen();await observe('Fresh Open reconstructs native attachment without healing',truth(28,{posed:true}));
 await recipe.depth(parent,30);await observe('Fresh Open parent reedit',truth(33,{posed:true,depth:30}));await save('parent30-reedited');
 const otherEdges=await rectangle(profileSource.faceId,140);receipt.otherRegionCurveIds=otherEdges;
 const regionChoice=async()=>{const history=await call('inspect-selected-profile-history'),row=one(history.features.filter(row=>row.featureId===parent.featureId),'actual current parent definition'),choices=await call('inspect-selected-profile-region-choices',{revision:history.revision,index:row.index,featureId:row.featureId});const region=one(choices.regions.filter(r=>r.support==='supported'&&r.descriptor.outerCurveIds.length===otherEdges.length&&r.descriptor.outerCurveIds.every(id=>otherEdges.includes(id))),'genuine separately authored alternative region');return{revision:history.revision,index:row.index,featureId:row.featureId,regionId:region.regionId};};
 await refuse('Changed constructor region invalidates saved native datum',async()=>call('edit-selected-profile-region',await regionChoice()),'UNRESOLVED_SOURCE');
 await discover(alternative);await recipe.repair(attached,alternative);await observe('Explicit earlier native parent repair',truth(15,{posed:true,alternate:true,depth:30}));
 await travel('undo');await observe('Repair Undo restores exact original locator',truth(33,{posed:true,depth:30}));await travel('redo');await observe('Repair Redo restores alternative native locator',truth(15,{posed:true,alternate:true,depth:30}));
 const acceptedRegion=await regionChoice();await call('edit-selected-profile-region',acceptedRegion);receipt.reselectedRegionId=acceptedRegion.regionId;
 await observe('Region change succeeds after explicit descendant repair',truth(15,{posed:true,alternate:true,reselected:true,depth:30}));await save('repaired-and-reselected');
 await reopen();await observe('Fresh Open preserves explicit repaired locator',truth(15,{posed:true,alternate:true,reselected:true,depth:30}));
 await recipe.depth(alternative,18);await observe('Reopened repaired parent depth15 to18',truth(18,{posed:true,alternate:true,reselected:true,depth:30,alternativeDepth:18}));await save('repaired-parent18');
 await reopen();const last=truth(18,{posed:true,alternate:true,reselected:true,depth:30,alternativeDepth:18});await observe('Second Open preserves genuine repaired attachment',last);
 const badArchives=spawnSync('python3',[fileURLToPath(new URL('./check.py',import.meta.url)),'make-bad',path.join(out,'repaired-parent18.cad'),path.join(out,'own-invalid')],{encoding:'utf8'});assert.equal(badArchives.status,0,badArchives.stderr);receipt.malformed=[];
 for(const item of JSON.parse(badArchives.stdout)){const bytes=fs.readFileSync(item.file),target='/Invalid-native-attachment-'+item.kind+'-'+h.username+'.cad';await h.page.evaluate(async({target,bytes})=>{await(await mirrorFileContext()).files.write(target,new Blob([new Uint8Array(bytes)]),null);},{target,bytes:Array.from(bytes)});const current=await call('inspect');await refuse('Own native '+item.kind+' pre-adoption refusal',()=>call('open-project',{revision:current.revision,path:target}),item.code);receipt.malformed.push({kind:item.kind,file:path.relative(out,item.file),sha256:sha(bytes)});}
 await observe('Healthy continuation after invalid own native files',last);receipt.status='PASS';
}catch(error){receipt.status='FAIL';receipt.error={name:error.name,message:error.message,code:error.code,stack:error.stack};console.error(error.stack);process.exitCode=1;}
finally{
 try{if(h)await h.retire();receipt.ownedContextClosed=true;}catch(error){receipt.status='FAIL';receipt.cleanupError=String(error);process.exitCode=1;}
 try{const cdp=await browser.target().createCDPSession();try{const {targetInfos}=await cdp.send('Target.getTargets');receipt.remainingOwnedTargets=targetInfos.filter(t=>contexts.has(t.browserContextId)).map(t=>({type:t.type,targetId:t.targetId}));assert.equal(receipt.remainingOwnedTargets.length,0);}finally{await cdp.detach();}}catch(error){receipt.status='FAIL';receipt.targetCleanupError=String(error);process.exitCode=1;}
 receipt.ownedContextIds=[...contexts];await browser.disconnect();receipt.sharedBrowserDisconnectedOnly=true;receipt.sourceUnchanged=receipt.sourcePins.every(row=>sha(fs.readFileSync(row.original))===row.sha256);if(!receipt.sourceUnchanged){receipt.status='FAIL';process.exitCode=1;}flush();
}
