import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const need=k=>{assert(process.env[k],k+' required');return process.env[k];};
const desktop=path.resolve(need('CODI_DESKTOP_SOURCE_ROOT')),out=path.resolve(need('CODI_EVIDENCE'));
const pins=JSON.parse(fs.readFileSync(need('CODI_SIGNED_PINS'))),build=need('CODI_ENGINE_REVISION');
assert.equal(pins.source,need('CODI_EXPECT_SOURCE'));assert.equal(pins.desktop,need('CODI_EXPECT_DESKTOP'));
for(const k of ['CODI_TEST_URL','CODI_TEST_CDP'])assert(['127.0.0.1','localhost'].includes(new URL(need(k)).hostname));
assert.match(build,/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/);assert(!fs.existsSync(out),'Keep prior runs');fs.mkdirSync(out,{recursive:true});
const helper=path.join(desktop,'test/agent-cad-corpus/sweep/signed-harness.mjs'),example=path.join(desktop,'apps/system/jsketcher/examples/source-bound-parameters.mjs');
const {harness}=await import(pathToFileURL(helper));
const {createModernParametersExample,mechanicalParameterDefinitions}=await import(pathToFileURL(example));
const canonical=x=>JSON.stringify(function sort(v){return Array.isArray(v)?v.map(sort):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort(v[k])])):v;}(x));
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const inputs=[new URL(import.meta.url),new URL('./CONTRACT.md',import.meta.url),new URL('./check.py',import.meta.url),pathToFileURL(helper),pathToFileURL(example)];
const hashes=()=>Object.fromEntries(inputs.map(u=>[u.href,sha(fs.readFileSync(u))]));
const receipt={status:'RUNNING',scope:'Accepted public quantities and actual typed plate persistence',pins,build,sourcePins:hashes(),privateAuthoring:false,sourceSeeds:false,rows:[],saved:[]};
const flush=()=>fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(receipt,null,2)+'\n');
const record=(label,data={})=>{receipt.rows.push(structuredClone({label,...data}));flush();console.log(label);};
const require=createRequire(import.meta.url),pp=need('PUPPETEER_CORE_PATH');assert.equal(require(path.join(pp,'package.json')).version,'24.35.0');
const browser=await require(pp).connect({browserURL:need('CODI_TEST_CDP'),protocolTimeout:300000});
let h,binding,recipe,definitions;
const extras=[
 {name:'twoInches',dimension:'length',expression:'inch(2)'},
 {name:'squareInch',dimension:'area',expression:'inch(1) * inch(1)'},
 {name:'cubicInch',dimension:'volume',expression:'squareInch * inch(1)'},
 {name:'rightAngle',dimension:'angle',expression:'deg(90)'},
 {name:'ten',dimension:'length',expression:'mm(10)'},
 {name:'twenty',dimension:'length',expression:'mm(20)'},
 {name:'three',dimension:'length',expression:'mm(3)'},
 {name:'patchArea',dimension:'area',expression:'ten * twenty'},
 {name:'patchVolume',dimension:'volume',expression:'patchArea * three'},
 {name:'ratio',dimension:'scalar',expression:'ten / twenty'},
 {name:'copies',dimension:'count',expression:'3'},
 {name:'enabled',dimension:'boolean',expression:'true'}
];
const expected={twoInches:['length',50.8,'millimeter'],squareInch:['area',645.16,'square-millimeter'],cubicInch:['volume',16387.064,'cubic-millimeter'],rightAngle:['angle',Math.PI/2,'radian'],ten:['length',10,'millimeter'],twenty:['length',20,'millimeter'],three:['length',3,'millimeter'],patchArea:['area',200,'square-millimeter'],patchVolume:['volume',600,'cubic-millimeter'],ratio:['scalar',.5,'dimensionless'],copies:['count',3,'count'],enabled:['boolean',true,null]};
const near=(a,b,t=1e-6)=>assert(typeof a==='number'&&Number.isFinite(a)&&Math.abs(a-b)<=t,`${a} != ${b}`);
async function bindRecipe(){
 const listing=await h.page.evaluate(()=>codiDesktopCommands.list());
 recipe=createModernParametersExample({engineRevision:build,windowId:h.windowId,api:{list:()=>listing,execute:async request=>{
  const r=await h.page.evaluate(async request=>{try{return{ok:true,value:await codiDesktopCommands.execute(request)}}catch(e){return{ok:false,error:{name:e.name,message:e.message,code:e.code??null,committed:e.committed===true,possiblyCommitted:e.possiblyCommitted===true}}}},request);
  if(!r.ok)throw Object.assign(Error(r.error.message),r.error);return r.value;
 }}});
}
async function pin(){const a=await h.pinFiles(Object.keys(pins.files));for(const x of a)assert.equal(x.sha256,pins.files[x.name]);const outer=await h.pinOuter({bundle:pins.outer.bundleSHA256});assert.equal(outer.sha256,pins.outer.sha256);record('Exact runtime',{assets:a,outer});}
async function state(){return{capture:await h.capture(binding.faceId),host:await h.command('inspect'),physical:await h.command('inspect-physical-parameters'),ownership:await h.ownership()};}
function settled(s){assert.equal(s.ownership.processing,false);assert.equal(s.ownership.resources.cleanupFailed,false);for(const k of ['candidates','accepted','mounts'])assert.equal(s.ownership.resources[k],0);assert.equal(s.ownership.resources.owners,s.ownership.resources.detached);assert(s.ownership.resources.owners<=3);}
function quantities(s,width,withExtras=true){
 assert.equal(s.physical.ready,true);assert.deepEqual(s.physical.definitions,definitions);
 const q=s.physical.quantities;assert(Array.isArray(q),'Public current values missing');assert.equal(q.length,definitions.length);assert.deepEqual(q.map(x=>x.name),definitions.map(x=>x.name));
 const values={width:['length',width,'millimeter'],height:['length',width/2,'millimeter'],depth:['length',width/5,'millimeter'],hole:['length',width/10,'millimeter'],corner:['length',width*.04,'millimeter'],edge:['length',width*.08,'millimeter'],...(withExtras?expected:{})};
 for(const row of q){assert.deepEqual(Object.keys(row).sort(),['dimension','name','unit','value']);const [dimension,value,unit]=values[row.name];assert.equal(row.dimension,dimension);assert.equal(row.unit,unit);if(typeof value==='boolean')assert.equal(row.value,value);else near(row.value,value,1e-9);}
 const bodies=s.capture.solids.bodies;assert.equal(bodies.length,1);const b=bodies[0],m=b.metrics;
 assert.equal(b.id,binding.corners.outputId);assert.equal(b.featureId,binding.corners.featureId);assert.equal(m.nativeValidity.valid,true);assert.equal(m.resultKind,'single-solid');assert.equal(m.solidCount,1);assert.equal('sha256:'+m.runtime.jsSha256+':'+m.runtime.wasmSha256,build);
 const volume=(width*width/2-Math.PI*((width/20)**2+4*(width*.02)**2))*width/5;
 near(m.nativeVolume,volume);m.nativeBounds.min.forEach(x=>near(x,0));m.nativeBounds.max.forEach((v,i)=>near(v,[width,width/2,width/5][i]));settled(s);
 return{width,expectedVolume:volume,actualVolume:m.nativeVolume,expectedQuantities:values};
}
async function observe(label,width,withExtras=true){const before=await state(),truth=quantities(before,width,withExtras),after=await state();assert.equal(canonical(after),canonical(before),'Inspection changed document');record(label,{before,after,truth});return before;}
function normalized(s){const c=structuredClone(s);for(const x of[c.host,c.physical,c.capture.journal,c.capture.solids])delete x.revision;return c;}
async function refuse(name,dimension,expression,code){const before=await state();let error;try{await recipe.replaceDefinitions([...definitions,{name,dimension,expression}]);}catch(e){error={code:e.code??null,message:e.message,committed:e.committed===true,possiblyCommitted:e.possiblyCommitted===true};}const after=await state();record('Refused '+name,{error,before,after,definition:{name,dimension,expression},expectedCode:code});assert(error);assert.equal(error.code,code);assert(!error.committed&&!error.possiblyCommitted);assert.equal(canonical(normalized(after)),canonical(normalized(before)),'Refusal changed durable document/history/resources');settled(after);}
async function save(file,label,width){const before=await state();quantities(before,width);const saved=await h.save(file,label);assert.deepEqual(saved.native.project.model.history,before.capture.native.history);assert.equal(saved.native.project.model.expressions,before.capture.native.expressions);receipt.saved.push({file,savedFile:label+'.jsketcher.json',sha256:saved.sha256,bytes:saved.bytes.length,width,definitions:structuredClone(definitions),before});flush();return before;}
async function reopen(file,before,width){await h.freshOpen(file);await pin();await bindRecipe();const after=await observe('Fresh Open retains quantities and actual geometry',width);assert.equal(after.capture.native.expressions,before.capture.native.expressions);assert.deepEqual(after.capture.native.history,before.capture.native.history);assert.deepEqual(after.capture.native.counters,before.capture.native.counters);assert.equal(after.capture.journal.canUndo,false);assert.equal(after.capture.journal.canRedo,false);}
try{
 h=await harness(browser,need('CODI_TEST_URL'),out,record);await h.login();await h.launch();await pin();await bindRecipe();binding=await recipe.build();receipt.binding=binding;definitions=mechanicalParameterDefinitions();await recipe.bind(binding,definitions);await observe('Ordinary actual typed plate baseline',100,false);
 definitions=[...definitions,...extras];await recipe.replaceDefinitions(definitions);await observe('All supported canonical quantity dimensions',100);
 for(const spec of[
  ['badMixed','length','mm(1) + deg(1)','DIMENSION_MISMATCH'],['badArea','length','patchArea','DIMENSION_MISMATCH'],
  ['badUnit','length','meter(1)','INVALID_EXPRESSION'],['badOverflow','scalar','1e13','NUMERIC_DOMAIN'],
  ['badInfinity','scalar','1e309','NUMERIC_DOMAIN'],['badDivide','scalar','1 / 0','NUMERIC_DOMAIN'],
  ['badCount','count','3.5','COUNT_DOMAIN'],['badCountUnit','count','mm(3)','COUNT_DOMAIN'],
  ['badBoolean','boolean','1','DIMENSION_MISMATCH'],['badUnknown','length','absentQuantity','UNKNOWN_PARAMETER'],
  ['badCycle','length','badCycle','CYCLE'],['badComma','length','mm(1,5)','INVALID_EXPRESSION']
 ])await refuse(...spec);
 await recipe.travel('undo');definitions=mechanicalParameterDefinitions();await observe('Refusals add no undo entry; genuine quantity edit undone',100,false);
 await recipe.travel('redo');definitions=[...definitions,...extras];await observe('Genuine quantity edit Redo',100);
 const beforeUnits=await state();await recipe.setDisplayUnits('inch');const inch=await observe('Inch display preserves canonical values and geometry',100);assert.deepEqual(inch.physical.quantities,beforeUnits.physical.quantities);assert.deepEqual(inch.capture.native.history,beforeUnits.capture.native.history);assert.equal(inch.capture.native.source,beforeUnits.capture.native.source);
 const file='/Quantities-'+h.username+'.jsketcher.json',first=await save(file,'quantities-initial',100);await reopen(file,first,100);
 definitions=definitions.map(d=>d.name==='width'?{...d,expression:'inch(4)'}:d);await recipe.replaceDefinitions(definitions);await observe('Inch expression drives real101.6mm part',101.6);
 await recipe.travel('undo');definitions=definitions.map(d=>d.name==='width'?{...d,expression:'mm(100)'}:d);await observe('Width Undo restores100mm',100);
 await recipe.travel('redo');definitions=definitions.map(d=>d.name==='width'?{...d,expression:'inch(4)'}:d);await observe('Width Redo restores101.6mm',101.6);
 const second=await save(file,'quantities-inch-expression',101.6);await reopen(file,second,101.6);
 const beforeSpelling=await state();definitions=definitions.map(d=>d.name==='width'?{...d,expression:'mm(101.6)'}:d);await recipe.replaceDefinitions(definitions);const spelled=await observe('Equivalent mm spelling preserves physical size',101.6);assert.deepEqual(spelled.physical.quantities,beforeSpelling.physical.quantities);
 await recipe.setDisplayUnits('millimeter');await observe('Millimeter display retains physical part',101.6);const third=await save(file,'quantities-mm-expression',101.6);await reopen(file,third,101.6);receipt.status='PASS';
}catch(e){receipt.status='FAIL';receipt.error={name:e.name,code:e.code??null,message:e.message,stack:e.stack};console.error(e.stack);process.exitCode=1;}
finally{try{if(h)await h.retire();receipt.ownedContextsClosed=true;}catch(e){receipt.status='FAIL';receipt.cleanupError={name:e.name,message:e.message};process.exitCode=1;}finally{receipt.sourcePinsAfter=hashes();if(canonical(receipt.sourcePinsAfter)!==canonical(receipt.sourcePins)){receipt.status='FAIL';receipt.sourceChanged=true;process.exitCode=1;}flush();await browser.disconnect();}}
