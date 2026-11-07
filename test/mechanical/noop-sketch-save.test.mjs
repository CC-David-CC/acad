import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {unchangedSketchSave} from '../../web/app/cad/sketch/unchangedSketchSave.mjs';
const fixture=JSON.parse(readFileSync(new URL('./noop-sketch-save.fixture.json',import.meta.url),'utf8'));
const previous=JSON.parse(fixture.storedSource),current=()=>({...structuredClone(previous),metadata:{...structuredClone(previous.metadata),expressionsSignature:fixture.currentExpressionSignature}});
test('exact sketch or clock-only reserialization retains the previous bytes',()=>{
 assert.equal(unchangedSketchSave(fixture.storedSource,previous),true);assert.notEqual(previous.metadata.expressionsSignature,fixture.currentExpressionSignature);assert.equal(unchangedSketchSave(fixture.storedSource,current()),true);
 assert.equal(unchangedSketchSave(JSON.stringify({...previous,metadata:{...previous.metadata,expressionsSignature:'content-id'}}),current()),false);const missing=structuredClone(previous);delete missing.metadata.expressionsSignature;assert.equal(unchangedSketchSave(JSON.stringify(missing),current()),true);assert.equal(unchangedSketchSave(null,current()),false);assert.equal(unchangedSketchSave('not-json',current()),false);
});
test('actual fresh rectangle first Save permits only numeric-clock presence/absence',()=>{
 const first=JSON.parse(readFileSync(new URL('./noop-sketch-save-first.fixture.json',import.meta.url),'utf8')),old=JSON.parse(first.storedSource),next=JSON.parse(first.firstSaveSource);assert.equal(Object.hasOwn(old.metadata,'expressionsSignature'),false);assert.ok(old.metadata.boundaryFrame);assert.equal(unchangedSketchSave(first.storedSource,next),true);assert.equal(unchangedSketchSave(first.firstSaveSource,old),true);
 for(const stamp of ['content-id',1,null,'01','9007199254740992']){const bad=structuredClone(next);bad.metadata.expressionsSignature=stamp;assert.equal(unchangedSketchSave(first.storedSource,bad),false);assert.equal(unchangedSketchSave(JSON.stringify(bad),old),false)}
 for(const mutate of [m=>m.boundaryFrame.origin[0]++,m=>{delete m.boundaryFrame},m=>{m.note='authored'}]){const changed=structuredClone(next);mutate(changed.metadata);assert.equal(unchangedSketchSave(first.storedSource,changed),false)}
 const missingMetadata=structuredClone(old);delete missingMetadata.metadata;assert.equal(unchangedSketchSave(JSON.stringify(missingMetadata),next),false);const objectMetadata=structuredClone(next);objectMetadata.objects[0].metadata={authored:true};assert.equal(unchangedSketchSave(first.storedSource,objectMetadata),false);
});
test('every captured JSON leaf outside the expression clock remains meaningful',()=>{
 const paths=[];function visit(value,path=[]){if(value&&typeof value==='object'&&Object.keys(value).length)for(const key of Object.keys(value))visit(value[key],[...path,key]);else paths.push(path)}visit(previous);let checked=0;for(const path of paths){if(path.join('.')==='metadata.expressionsSignature')continue;const value=current();let at=value;for(const key of path.slice(0,-1))at=at[key];const key=path.at(-1),old=at[key];at[key]=Array.isArray(old)?[null]:old&&typeof old==='object'?{added:true}:typeof old==='number'?old+1:typeof old==='string'?old+' changed':typeof old==='boolean'?!old:0;assert.equal(unchangedSketchSave(fixture.storedSource,value),false,path.join('.'));checked++}assert.ok(checked>100);const unknown=current();unknown.metadata.authoredNote='retain me';assert.equal(unchangedSketchSave(fixture.storedSource,unknown),false);const removed=current();delete removed.metadata.boundaryFrame;assert.equal(unchangedSketchSave(fixture.storedSource,removed),false);const reordered=current();reordered.objects.reverse();assert.equal(unchangedSketchSave(fixture.storedSource,reordered),false);
});
test('numeric and typed geometry edits are not classified as no-op',()=>{
 for(const named of [false,true]){const sketch=current(),constraint=sketch.stages.flatMap(s=>s.constraints).find(c=>c.typeId==='DiameterLength'&&(c.constants.diameter==='D')===named);assert.ok(constraint);if(!named)constraint.constants.diameter='14';sketch.objects.find(o=>o.id===constraint.objects[0]).data.r=7;assert.equal(unchangedSketchSave(fixture.storedSource,sketch),false)}
 const model=structuredClone(fixture.native.project.model),before=JSON.stringify(model),source=model.expressions,index=source.indexOf('\n'),definitions=JSON.parse(source.slice(index+1));definitions.definitions.find(d=>d.name==='D').expression='mm(6) * 2';model.expressions=source.slice(0,index+1)+JSON.stringify(definitions);assert.equal(unchangedSketchSave(fixture.storedSource,current()),true);assert.notEqual(JSON.stringify(model),before,'parameter-only intent remains distinct even when sketch is unchanged');
});

// Compile the intact source writer through its isolated test-only presentation
// boundary. IO, constraints, expressions, refresh and ID reset remain real.
import {createLegacyReevaluationEntry} from '!!babel-loader!../mechanical-corpus-harness/reevaluate-entry-loader.cjs!../../web/app/cad/sketch/sketcherBundle.ts?mechanical-reevaluate-entry';
import {HeadlessSketchWorkspace} from '../../web/app/sketcher/headless/workspace.ts';
import {evaluateMath} from '../../modules/gems/safeExpression.mjs';
function legacySetup({width,decorateSerialized}={}){
 const first=JSON.parse(readFileSync(new URL('./noop-sketch-save-first.fixture.json',import.meta.url),'utf8'));
 if(width!==undefined){const sketch=JSON.parse(first.storedSource);sketch.stages[0].constraints.find(c=>c.typeId==='SegmentLength'&&c.objects[0]==='rect-0').constants.length='W';first.storedSource=JSON.stringify(sketch);}
 let source=first.storedSource,writes=0,refreshes=0,loadRefreshes=0,resets=0;
 const workspaces=[],resolved=[];
 const values=width===undefined?Object.create(null):{W:width};
 const ctx={sketchStorageService:{getSketchData:()=>source},expressionService:{isTyped:false,signature:first.currentExpressionSignature,evaluateExpression(value){resolved.push(value);return evaluateMath(value,values);}},projectService:{sketchStorageKey:id=>id}};
 const services={storage:{set(id,text){assert.equal(id,first.faceId);source=text;writes++;}}};
 const run=createLegacyReevaluationEntry({ctx,services,onReset(){resets++;},onWorkspace(workspace){
  assert.ok(workspace instanceof HeadlessSketchWorkspace);workspaces.push(workspace);
  let loading=0;
  const load=workspace.io._loadSketch.bind(workspace.io);
  workspace.io._loadSketch=(...args)=>{loading++;try{return load(...args);}finally{loading--;}};
  const refresh=workspace.parametricManager.refresh.bind(workspace.parametricManager);
  workspace.parametricManager.refresh=(...args)=>{if(loading)loadRefreshes++;else refreshes++;return refresh(...args);};
  if(decorateSerialized){const serialize=workspace.io.serializeSketch.bind(workspace.io);workspace.io.serializeSketch=(...args)=>{const data=JSON.parse(serialize(...args));decorateSerialized(data);return JSON.stringify(data);};}
 }});
 return {run:()=>run(first.faceId),get source(){return source;},get writes(){return writes;},get refreshes(){return refreshes;},get loadRefreshes(){return loadRefreshes;},get resets(){return resets;},first,ctx,workspaces,resolved};
}
function assertSolved(workspace,width=100){
 const index=workspace.createIndex(),line=index['rect-0'];
 assert.ok(Math.abs(Math.hypot(line.b.x-line.a.x,line.b.y-line.a.y)-width)<1e-6);
 const right=index['rect-1'];assert.ok(Math.abs(right.a.x-width)<1e-6&&Math.abs(right.b.x-width)<1e-6,'dependent rectangle side follows the driving width');
 const system=workspace.parametricManager.stage.algNumSystem;
 assert.equal(system.solveStatus.success,true);
 assert.ok(system.allConstraints.length>=11);
 for(const constraint of system.allConstraints){const equations=[];constraint.collectPolynomials(equations);assert.ok(equations.every(e=>Number.isFinite(e.value())&&Math.abs(e.value())<=1e-6),constraint.schema.id);}
}
test('actual legacy reevaluate writer skips only clock-only storage without skipping real refresh/reset',()=>{
 const f=legacySetup(),clock=f.ctx.expressionService.signature;f.run();assert.equal(f.writes,0);assert.equal(f.source,f.first.storedSource);assert.equal(f.refreshes,1);assert.equal(f.loadRefreshes,1,'actual native IO also refreshes once during load');assert.equal(f.resets,1);assert.equal(f.ctx.expressionService.signature,clock);assertSolved(f.workspaces[0]);
 f.run();assert.equal(f.writes,0);assert.equal(f.refreshes,2);assert.equal(f.loadRefreshes,2);assert.equal(f.resets,2,'old clock remains stale so ordinary reevaluation is retained');assertSolved(f.workspaces[1]);
});
test('legacy writer persists real solved geometry and injected serialization metadata with boundary provenance',()=>{
 for(const options of [{width:120},{decorateSerialized:s=>{s.objects[0].metadata={authored:'retain me'};}}]){
  const f=legacySetup(options);f.run();assert.equal(f.writes,1);const saved=JSON.parse(f.source),prior=JSON.parse(f.first.storedSource);assert.deepEqual(saved.boundary,prior.boundary);assert.deepEqual(saved.metadata.boundaryFrame,prior.metadata.boundaryFrame);assert.equal(saved.metadata.expressionsSignature,f.ctx.expressionService.signature);assert.notDeepEqual(saved,prior);assert.equal(f.refreshes,1);assert.equal(f.loadRefreshes,1,'actual native IO also refreshes once during load');assert.equal(f.resets,1);assertSolved(f.workspaces[0],options.width??100);
  if(options.width){assert.ok(f.resolved.includes('W'));assert.equal(saved.stages[0].constraints.find(c=>c.typeId==='SegmentLength'&&c.objects[0]==='rect-0').constants.length,'W');}
  else assert.deepEqual(saved.objects[0].metadata,{authored:'retain me'},'deliberately injected real-serializer output must not be classified as clock-only');
 }
});
