// Complete workflow; execute only on a root-frozen composed runtime.
// Mutations are public commands. Private harness access is read-only.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {createOrientationExample} from './example.mjs';
const need=k=>{assert(process.env[k],k+' required');return process.env[k];};
const desktop=path.resolve(need('CODI_DESKTOP_SOURCE_ROOT')),helper=path.join(desktop,'test/agent-cad-corpus/sweep/signed-harness.mjs'),agentFile=path.join(desktop,'apps/system/jsketcher/examples/cad-agent.mjs');
const {harness}=await import(pathToFileURL(helper)),{createCadAgent}=await import(pathToFileURL(agentFile));
const pins=JSON.parse(fs.readFileSync(need('CODI_SIGNED_PINS'))),out=path.resolve(need('CODI_EVIDENCE')),base=need('CODI_TEST_URL'),cdp=need('CODI_TEST_CDP');
assert.equal(pins.source,need('CODI_EXPECT_SOURCE'));assert.equal(pins.desktop,need('CODI_EXPECT_DESKTOP'));
for(const u of[base,cdp])assert(['127.0.0.1','localhost'].includes(new URL(u).hostname));
assert.match(pins.outer?.bundleSHA256||'',/^[a-f0-9]{64}$/);assert.match(pins.outer?.sha256||'',/^[a-f0-9]{64}$/);assert(Object.keys(pins.files||{}).length>10);
assert(!fs.existsSync(out),'Retain earlier runs');fs.mkdirSync(out,{recursive:true});
const canonical=v=>JSON.stringify(function order(x){return Array.isArray(x)?x.map(order):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,order(x[k])])):x;}(v));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),sourceFiles=[pathToFileURL(agentFile),pathToFileURL(helper),new URL('./example.mjs',import.meta.url),new URL('./desktop-driver.mjs',import.meta.url),new URL('./README.md',import.meta.url)];
const hashes=()=>Object.fromEntries(sourceFiles.map(u=>[u.href,sha(fs.readFileSync(u))]));
const receipt={status:'RUNNING',scope:'Four actual orientation schemas through shared groups, directed branch-preserving source edits, refusals/travel/native project Save/Open; no BRep, typed-mutation or general constraint completeness claim',pins,sourcePins:hashes(),transport:'Actual document-token-bound registry with on-disk public example; not served-browser example execution',privateAuthoring:false,sourceSeeds:false,fakeSuccessfulReplies:false,tolerances:{coordinatesMm:1e-6,normalizedDotCross:1e-8},rows:[],commands:[],saved:[]};
const flush=()=>fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(receipt,null,2)+'\n');
let h=null,recipe,binding,descriptors;
const record=(label,data={})=>{receipt.rows.push(structuredClone({label,...data}));flush();console.log(label);};
const one=(a,l)=>{assert.equal(a.length,1,'One '+l);return a[0];},near=(a,b)=>assert(typeof a==='number'&&Number.isFinite(a)&&Math.abs(a-b)<=1e-6,`${a} differs from ${b}`);
const required=['inspect','inspect-rectangle-creation','create-rectangle-sketch','inspect-closed-sketches','inspect-closed-sketch','append-sketch-primitive','apply-closed-sketch-signed-distance','apply-closed-sketch-length-relation','apply-closed-sketch-orientation','edit-closed-sketch-points','inspect-authored-edits','travel-authored-edit','save','open-project'];
const require=createRequire(import.meta.url),pp=need('PUPPETEER_CORE_PATH');assert.equal(require(path.join(pp,'package.json')).version,'24.35.0');const browser=await require(pp).connect({browserURL:cdp,protocolTimeout:300000});
async function runtime(){const assets=await h.pinFiles(Object.keys(pins.files));for(const a of assets)assert.equal(a.sha256,pins.files[a.name]);const outer=await h.pinOuter({bundle:pins.outer.bundleSHA256});assert.equal(outer.sha256,pins.outer.sha256);record('Complete runtime pins',{assets,outer});}
async function bind(){
 descriptors=await h.page.evaluate(id=>codiDesktopCommands.list().filter(r=>r.appId==='jsketcher'&&r.windowId===id),h.windowId);for(const id of required)assert(descriptors.some(r=>r.id===id),id+' registered');
 const agent=createCadAgent({windowId:h.windowId,api:{list:()=>descriptors,execute:async request=>{
  assert.equal(request.windowId,h.windowId);assert.equal(typeof request.expectedDocumentToken,'string');
  const r=await h.page.evaluate(async request=>{try{return{ok:true,value:await codiDesktopCommands.execute(request)}}catch(e){return{ok:false,error:{name:e.name,message:e.message,code:e.code??null,committed:e.committed===true,possiblyCommitted:e.possiblyCommitted===true}}}},request);
  descriptors=await h.page.evaluate(id=>codiDesktopCommands.list().filter(r=>r.appId==='jsketcher'&&r.windowId===id),h.windowId);
  receipt.commands.push({command:request.command,args:structuredClone(request.args),ok:r.ok,...(!r.ok?{error:r.error}:['append-sketch-primitive','create-rectangle-sketch','apply-closed-sketch-orientation'].includes(request.command)?{result:structuredClone(r.value)}:{})});flush();if(!r.ok)throw Object.assign(Error(r.error.message),r.error);return r.value;
 }}});recipe=createOrientationExample(agent);
}
async function capture(){return{accepted:await h.capture(binding.faceId),ownership:await h.ownership(),lifetime:await h.frame.evaluate(()=>({generation:__CAD_APP.projectService.documentGeneration,epoch:__CAD_APP.craftService.evaluationEpoch}))};}
function settled(s){assert.equal(s.ownership.processing,false);for(const k of['candidates','accepted','mounts'])assert.equal(s.ownership.resources[k],0,k);assert.equal(s.ownership.resources.cleanupFailed,false);assert.equal(s.accepted.solids.bodies.length,0,'Sketch case must not fabricate solids');}
function stable(s){const c=structuredClone(s);delete c.accepted.solids.revision;delete c.accepted.journal.revision;delete c.lifetime.epoch;return c;}
const segments=[],expected=new Map(),groups=new Map();
const typeFor={horizontal:'Horizontal',vertical:'Vertical',parallel:'Parallel',perpendicular:'Perpendicular'};
const constraints=s=>s.stages.flatMap(x=>x.constraints),groupKey=(kind,ids)=>kind+'\0'+JSON.stringify(ids);
const vector=degrees=>{if(degrees===0)return[1,0];if(degrees===90)return[0,1];if(degrees===180)return[-1,0];if(degrees===270)return[0,-1];return[Math.cos(degrees*Math.PI/180),Math.sin(degrees*Math.PI/180)];};
function endpoint(segment,degrees){const d=vector(degrees);return[segment.a[0]+segment.length*d[0],segment.a[1]+segment.length*d[1]];}
const pointAt=(origin,degrees)=>{const d=vector(degrees);return[origin[0]+10*d[0],origin[1]+10*d[1]];};
function useAngle(segment,degrees){expected.get(segment.id).b=endpoint(segment,degrees);}
function members(kind,ids){return ['horizontal','vertical'].includes(kind)?ids.map(id=>[id]):ids.slice(1).map((_,i)=>ids.slice(i,i+2));}
function remember(kind,ids,angles){members(kind,ids).forEach((refs,i)=>groups.set(groupKey(kind,refs),{kind,typeId:typeFor[kind],ids:refs,degrees:angles[i]}));}
function oracle(i,s){
 assert.equal(s.objects.length,5+segments.length);assert.equal(s.stages.length,1);assert.equal(s.version,3);
 const sourceIds=new Set(s.objects.map(o=>o.id));assert.equal(sourceIds.size,s.objects.length);for(const id of binding.rectangleIds)assert(sourceIds.has(id));
 const datum=one(i.points.filter(p=>p.id===binding.datumId),'actual datum');near(datum.x,0);near(datum.y,0);
 const rectangle=s.objects.filter(o=>binding.rectangleIds.includes(o.id)).flatMap(o=>[o.data.a,o.data.b]);near(Math.min(...rectangle.map(p=>p.x)),0);near(Math.max(...rectangle.map(p=>p.x)),10);near(Math.min(...rectangle.map(p=>p.y)),0);near(Math.max(...rectangle.map(p=>p.y)),10);
 const unrelated=one(s.objects.filter(o=>o.id===binding.unrelatedId&&o.type==='Point'),'unrelated Point');assert.deepEqual(unrelated.data,{x:7,y:9});const u=one(i.points.filter(p=>p.id===binding.unrelatedPointId),'unrelated measured Point');near(u.x,7);near(u.y,9);
 const directions=new Map();
 for(const segment of segments){const e=expected.get(segment.id),object=one(s.objects.filter(o=>o.id===segment.id&&o.type==='Segment'),'source Segment'),pa=one(i.points.filter(p=>p.id===segment.aId&&p.parentId===segment.id),'actual bound start'),pb=one(i.points.filter(p=>p.id===segment.bId&&p.parentId===segment.id),'actual bound end');
  for(const [p,want]of[[pa,e.a],[pb,e.b],[object.data.a,e.a],[object.data.b,e.b]]){near(p.x,want[0]);near(p.y,want[1]);}
  const dx=pb.x-pa.x,dy=pb.y-pa.y,length=Math.hypot(dx,dy);assert(length>1e-9);near(length,segment.length);directions.set(segment.id,[dx/length,dy/length]);
 }
 for(const g of groups.values()){
  const c=one(constraints(s).filter(c=>c.typeId===g.typeId&&canonical(c.objects)===canonical(g.ids)),'actual '+g.typeId+' ordered row');assert.deepEqual(Object.keys(c.constants).sort(),['angle']);assert.equal(Number(c.constants.angle),g.degrees);assert(['accepted','redundant'].includes(c.admission.state));
  const d=g.ids.map(id=>directions.get(id)),target=g.degrees*Math.PI/180;
  if(d.length===1){near(d[0][0],Math.cos(target));near(d[0][1],Math.sin(target));}
  else{const cross=d[0][0]*d[1][1]-d[0][1]*d[1][0],dot=d[0][0]*d[1][0]+d[0][1]*d[1][1];assert(Math.abs(cross-Math.sin(target))<=1e-8,'Independent cross sign/orthogonality');assert(Math.abs(dot-Math.cos(target))<=1e-8,'Independent dot sign/parallelism');}
 }
 for(const c of constraints(s))assert(['accepted','redundant'].includes(c.admission.state),'No retained conflict');
 assert.deepEqual(i.orientationGroups.map(r=>r.kind),['horizontal','vertical','parallel','perpendicular']);
}
async function state(label){const before=await capture(),inspection=await recipe.inspect(binding);record(label+' raw',{before,inspection,expected:[...expected],groups:[...groups.values()]});settled(before);oracle(inspection,JSON.parse(before.accepted.native.source));assert.equal(canonical(await capture()),canonical(before),'Inspection changed accepted state/resources');record(label);return before;}
async function add(label,a,b,locked=false){const segment=await recipe.segment(binding,{a,b,locked});segments.push(segment);expected.set(segment.id,{a:[...a],b:[...b]});receipt.bindings=segments;flush();await state(label);return segment;}
function checkReply(result,kind,ids,angles){const g=result.group;assert.deepEqual(Object.keys(g).sort(),['action','existing','ids','kind','rows']);assert.equal(g.kind,kind);assert.equal(g.action,'create');assert.deepEqual(g.ids,ids);const refs=members(kind,ids);assert.equal(g.rows.length,refs.length);g.rows.forEach((r,index)=>{assert.deepEqual(Object.keys(r).sort(),['angleDegrees','index','objects','stage','status','typeId']);assert.equal(r.typeId,typeFor[kind]);assert.deepEqual(r.objects,refs[index]);assert.equal(r.angleDegrees,angles[index]);assert(['accepted','redundant'].includes(r.status));});assert.equal(result.changed,!g.existing);}
async function apply(label,kind,items,angles,update=()=>{}){const ids=items.map(s=>s.id),before=await capture(),result=await recipe.orientation(binding,kind,ids);record(label+' receipt',{before,result});checkReply(result,kind,ids,angles);update();remember(kind,ids,angles);await state(label);return result;}
async function refused(label,work,codes){const before=await capture();let error=null;try{await work();}catch(e){error={name:e.name,message:e.message,code:e.code??null,committed:e.committed===true,possiblyCommitted:e.possiblyCommitted===true};}const after=await capture();record(label+' raw',{error,before,after});assert(error,'Expected refusal');assert(!error.committed&&!error.possiblyCommitted);assert(codes.includes(error.code),'Unexpected refusal '+error.code+': '+error.message);assert.equal(canonical(stable(after)),canonical(stable(before)),'Refusal changed accepted source/history/journal/counters/resources');settled(after);await state(label+' accepted state retained');}
async function save(file,label){const before=await capture(),saved=await h.save(file,label);assert.deepEqual(saved.native.project.model.history,before.accepted.native.history);assert.deepEqual(one(saved.native.project.sketches.filter(s=>s.id===binding.faceId),'saved source').data,JSON.parse(before.accepted.native.source));receipt.saved.push({file,savedFile:label+'.jsketcher.json',sha256:saved.sha256,bytes:saved.bytes.length,binding,segments,expected:[...expected],groups:[...groups.values()]});flush();return before;}
async function reopen(file,before){await h.freshOpen(file);await runtime();await bind();const after=await capture();for(const key of['history','counters','expressions'])assert.deepEqual(after.accepted.native[key],before.accepted.native[key]);assert.deepEqual(JSON.parse(after.accepted.native.source),JSON.parse(before.accepted.native.source));assert.equal(after.accepted.journal.canUndo,false);assert.equal(after.accepted.journal.canRedo,false);settled(after);await state('Fresh Open retains actual IDs/canonical branch constants; session journal reset');}
const conflictCodes=['CONSTRAINT_GROUP_CONFLICT','RESIDUAL','SOLVE_ERROR','CONFLICT','CURRENT_GEOMETRY_MISMATCH','ORIENTATION_DOMAIN','INVALID_CANDIDATE'];
try{
 h=await harness(browser,base,out,record);await h.login();await h.launch();await h.newProject();await runtime();await bind();binding=await recipe.begin();receipt.binding=binding;flush();await state('Real anchored datum and unrelated Point');
 const hp=await add('Oblique H+',[20,20],[28,26]),hn=await add('Reversed H-',[50,20],[42,14]),vp=await add('Oblique V+',[80,20],[86,28]),vn=await add('Reversed V-',[110,20],[104,12]);
 await apply('Horizontal ordered directions0/180','horizontal',[hp,hn],[0,180],()=>{useAngle(hp,0);useAngle(hn,180);});await apply('Vertical ordered directions90/270','vertical',[vp,vn],[90,270],()=>{useAngle(vp,90);useAngle(vn,270);});
 const axis=await add('Fixed +X line',[200,50],[210,50],true),same=await add('Offset oblique peer',[230,80],[238,86]),opposed=await add('Offset reversed peer',[260,100],[252,94]),up=await add('Perpendicular peer+',[290,80],[296,88]),down=await add('Perpendicular peer-',[320,80],[314,72]);
 await apply('Disjoint supporting-line Parallel does not make collinear','parallel',[axis,same],[0],()=>useAngle(same,0));await apply('Ordinary anti-parallel branch180','parallel',[axis,opposed],[180],()=>useAngle(opposed,180));await apply('Perpendicular branch90','perpendicular',[axis,up],[90],()=>useAngle(up,90));await apply('Reversed Perpendicular branch270','perpendicular',[axis,down],[270],()=>useAngle(down,270));
 const a180=await add('Fixed A180',[350,100],[340,100],true),b0=await add('Fixed B0',[380,140],[390,140],true),a90=await add('Fixed A90',[410,100],[410,110],true);
 await apply('Previously mismatched raw branch: locked A180/B0','parallel',[a180,b0],[180]);await apply('Previously mismatched raw branch: locked A90/B0','perpendicular',[a90,b0],[270]);await apply('Reversed pair is its actual ordered schema row','perpendicular',[b0,a90],[90]);
 const overlap=await add('Overlapping distinct Segment',[205,50],[215,50],true),copy=await add('Coincident geometry with distinct authored ID',[200,50],[210,50],true);assert.notEqual(copy.id,axis.id);await apply('Overlapping supporting lines remain valid','parallel',[axis,overlap],[0]);await apply('No coordinate welding for coincident geometry','parallel',[axis,copy],[0]);
 const partial=await add('Mixed-group missing peer',[440,150],[448,156]),stale=await recipe.inspect(binding);await apply('Partially existing group adds only missing member','parallel',[axis,same,partial],[0,0],()=>useAngle(partial,0));
 const noOpBefore=await capture(),noOp=await recipe.orientation(binding,'parallel',[axis.id,same.id,partial.id]);checkReply(noOp,'parallel',[axis.id,same.id,partial.id],[0,0]);assert.equal(noOp.changed,false);assert.equal(canonical(await capture()),canonical(noOpBefore));record('Exact group no-op has no journal/counter/resource churn',{noOp});
 await refused('Stale source revision',()=>recipe.orientationAt(binding,stale.revision,'parallel',[axis.id,same.id]),['STALE_HISTORY']);await refused('Same Segment cannot pair itself',()=>recipe.orientation(binding,'parallel',[axis.id,axis.id]),[null,'INVALID_REQUEST','INVALID_TARGET']);await refused('Inspected Point cannot act as a Segment',()=>recipe.orientation(binding,'horizontal',[binding.unrelatedId]),['INVALID_TARGET']);
 await refused('Actual zero-length append refuses without source seed',()=>recipe.zero(binding),['INVALID','INVALID_GEOMETRY','PRIMITIVE_INVALID','SOLVE_ERROR','INVALID_CANDIDATE']);
 const fixedSloped=await add('Fixed nonhorizontal endpoints',[470,100],[478,106],true);await refused('Fixed endpoints contradict Horizontal',()=>recipe.orientation(binding,'horizontal',[fixedSloped.id]),conflictCodes);await refused('Fixed endpoint directions contradict Perpendicular',()=>recipe.orientation(binding,'perpendicular',[axis.id,fixedSloped.id]),conflictCodes);
 const middle=await add('Compatible first member cannot partially publish',[500,150],[508,156]);await refused('Contradictory final member rejects whole ordered group',()=>recipe.orientation(binding,'parallel',[axis.id,middle.id,a90.id]),conflictCodes);
 const driven=await add('Length10 with signed dx6',[530,150],[536,158]);await recipe.lockEndX(binding,driven,536);await state('Real driving dimension before conflict');await refused('Horizontal cannot erase independent length/dx',()=>recipe.orientation(binding,'horizontal',[driven.id]),conflictCodes);
 const antiA=await add('Rotatable A170',[560,150],pointAt([560,150],170)),antiB=await add('Rotatable B350',[590,150],pointAt([590,150],350)),preAnti=await capture();
 await apply('Authored anti-parallel pair before global wrap','parallel',[antiA,antiB],[180]);const antiCreated=await capture(),at190=endpoint(antiA,190);await recipe.end(binding,antiA,...at190);useAngle(antiA,190);useAngle(antiB,10);await state('Source edit crosses normalized branch without changing authored180');
 await recipe.travel('undo');useAngle(antiA,170);useAngle(antiB,350);const undoEdit=await state('Undo actual source edit');assert.equal(undoEdit.accepted.native.source,antiCreated.accepted.native.source);
 await recipe.travel('undo');groups.delete(groupKey('parallel',[antiA.id,antiB.id]));const undoCreate=await state('Mixed Undo group creation');assert.equal(undoCreate.accepted.native.source,preAnti.accepted.native.source);
 await recipe.travel('redo');remember('parallel',[antiA.id,antiB.id],[180]);await state('Redo original canonical180 group');await recipe.travel('redo');useAngle(antiA,190);useAngle(antiB,10);await state('Redo source edit after group');
 for(const degrees of[350,10]){await recipe.end(binding,antiA,...endpoint(antiA,degrees));useAngle(antiA,degrees);useAngle(antiB,(degrees+180)%360);await state('Anti-parallel source angle '+degrees+' retains canonical180');}
 const turnA=await add('Rotatable A90',[620,150],pointAt([620,150],90)),turnB=await add('Rotatable B0',[650,150],pointAt([650,150],0));await apply('Authored clockwise Perpendicular270','perpendicular',[turnA,turnB],[270]);
 for(const degrees of[350,10]){await recipe.end(binding,turnA,...endpoint(turnA,degrees));useAngle(turnA,degrees);useAngle(turnB,(degrees+270)%360);await state('Perpendicular source angle '+degrees+' retains cross-sign270');}
 const file='/Orientations-'+h.username+'.jsketcher.json',saved=await save(file,'orientation-edited');await reopen(file,saved);
 await recipe.end(binding,antiA,...endpoint(antiA,190));useAngle(antiA,190);useAngle(antiB,10);await state('Reopened source reedit across antiparallel chart');await recipe.travel('undo');useAngle(antiA,10);useAngle(antiB,190);await state('Reopened source Undo');await recipe.travel('redo');useAngle(antiA,190);useAngle(antiB,10);await state('Reopened source Redo');
 const last=await save(file,'orientation-reedited');await reopen(file,last);await state('Resave and second Open preserves all four schema kinds');receipt.status='PASS';
}catch(e){receipt.status='FAIL';receipt.error={name:e.name,code:e.code??null,message:e.message,stack:e.stack};console.error(e.stack);process.exitCode=1;}
finally{try{if(h)await h.retire();receipt.cleanup='Only owned contexts retired; shared browser/root fixture retained';}catch(e){receipt.status='FAIL';receipt.cleanupError={name:e.name,message:e.message};process.exitCode=1;}finally{receipt.sourceHashesAfter=hashes();if(canonical(receipt.sourceHashesAfter)!==canonical(receipt.sourcePins)){receipt.status='FAIL';receipt.sourceChanged=true;process.exitCode=1;}flush();await browser.disconnect();}}
