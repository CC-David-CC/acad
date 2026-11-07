import test from 'node:test';import assert from 'node:assert/strict';
import {selectSolidContinuationBuild} from '../../modules/engine/solid/solidOperandRuntime.mjs';
import {CAD_ENGINES,OCC_SELECTED_PROFILE_BUILD} from '../../modules/engine/mount/engineCatalog.mjs';
const row=(id,build)=>({outputId:id,engine:build.id,metrics:{runtime:{mountEngine:build.mountEngine,representation:build.representation,...build.runtimeAssets}}});
test('empty workspace retains defaults; current output retains its exact registered build',()=>{
 for(const build of Object.values(CAD_ENGINES)){assert.equal(selectSolidContinuationBuild([],build.id,build.revision),build);assert.equal(selectSolidContinuationBuild([row('a',build)],build.id,build.revision),build);}
 const selected=OCC_SELECTED_PROFILE_BUILD;assert.equal(selectSolidContinuationBuild([row('a',selected),row('b',selected)],'occ',CAD_ENGINES.occ.revision),selected);
});
test('native-empty output preserves its build rather than selecting the default',()=>{const selected=OCC_SELECTED_PROFILE_BUILD,empty={...row('empty',selected),resultKind:'empty',bodyId:null};assert.equal(selectSolidContinuationBuild([empty],'occ',CAD_ENGINES.occ.revision),selected);});
test('mixed builds, wrong engine, duplicate IDs and unavailable revisions refuse',()=>{
 assert.throws(()=>selectSolidContinuationBuild([row('a',CAD_ENGINES.occ),row('b',OCC_SELECTED_PROFILE_BUILD)],'occ',CAD_ENGINES.occ.revision),{code:'ENGINE_REVISION_MISMATCH'});
 assert.throws(()=>selectSolidContinuationBuild([row('a',CAD_ENGINES.manifold)],'occ',CAD_ENGINES.occ.revision),{code:'INVALID_OPERAND'});
 assert.throws(()=>selectSolidContinuationBuild([row('a',CAD_ENGINES.occ),row('a',CAD_ENGINES.occ)],'occ',CAD_ENGINES.occ.revision),{code:'INVALID_OPERAND'});
 const bad=row('a',CAD_ENGINES.occ);bad.metrics.runtime.jsSha256='f'.repeat(64);assert.throws(()=>selectSolidContinuationBuild([bad],'occ',CAD_ENGINES.occ.revision),{code:'ENGINE_REVISION_MISMATCH'});
});
test('continuation reads no accessors and does not mutate inspected evidence',()=>{
 for(const key of ['jsSha256','wasmSha256','mountEngine','representation']){const bad=row('a',CAD_ENGINES.occ);let reads=0;Object.defineProperty(bad.metrics.runtime,key,{enumerable:true,get(){reads++;return ''}});assert.throws(()=>selectSolidContinuationBuild([bad],'occ',CAD_ENGINES.occ.revision));assert.equal(reads,0);}
 const rows=[row('a',OCC_SELECTED_PROFILE_BUILD)],before=JSON.stringify(rows);selectSolidContinuationBuild(rows,'occ',CAD_ENGINES.occ.revision);assert.equal(JSON.stringify(rows),before);
 const sparse=[];sparse.length=1;assert.throws(()=>selectSolidContinuationBuild(sparse,'occ',CAD_ENGINES.occ.revision));
});
