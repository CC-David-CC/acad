import test from 'node:test';import assert from 'node:assert/strict';
import {selectSolidOperandBuild} from '../../modules/engine/solid/solidOperandRuntime.mjs';
import {CAD_ENGINES,OCC_SELECTED_PROFILE_BUILD} from '../../modules/engine/mount/engineCatalog.mjs';
const output=(id,spec)=>({outputId:id,engine:spec.id,metrics:{runtime:{mountEngine:spec.mountEngine,representation:spec.representation,...spec.runtimeAssets}}});
test('retained defaults and explicit selected-profile build preserve exact runtime',()=>{
 for(const build of [...Object.values(CAD_ENGINES),OCC_SELECTED_PROFILE_BUILD])assert.equal(selectSolidOperandBuild([output('a',build),output('b',build)],build.id,'a','b'),build);
});
test('mixed registered OCC revisions refuse instead of selecting a default or converting',()=>{
 assert.throws(()=>selectSolidOperandBuild([output('a',CAD_ENGINES.occ),output('b',OCC_SELECTED_PROFILE_BUILD)],'occ','a','b'),{code:'ENGINE_REVISION_MISMATCH'});
});
test('missing, duplicate, wrong-engine and repeated operands refuse',()=>{
 const a=output('a',CAD_ENGINES.occ),b=output('b',CAD_ENGINES.occ);
 for(const [rows,engine,left,right]of[[[a],'occ','a','b'],[[a,a,b],'occ','a','b'],[[a,b],'manifold','a','b'],[[a,b],'occ','a','a'],[[a,b],'occ',{},'b']])assert.throws(()=>selectSolidOperandBuild(rows,engine,left,right),{code:'INVALID_OPERAND'});
});
test('unregistered or malformed runtime hashes cannot become authored revisions',()=>{
 for(const value of ['a'.repeat(64),'wrong',null]){const a=output('a',CAD_ENGINES.occ),b=output('b',CAD_ENGINES.occ);a.metrics.runtime.jsSha256=value;assert.throws(()=>selectSolidOperandBuild([a,b],'occ','a','b'),{code:'ENGINE_REVISION_MISMATCH'});}
});
test('wrong native representation or mount identity refuses',()=>{
 for(const key of['representation','mountEngine']){const a=output('a',CAD_ENGINES.occ),b=output('b',CAD_ENGINES.occ);a.metrics.runtime[key]='wrong';assert.throws(()=>selectSolidOperandBuild([a,b],'occ','a','b'),{code:'ENGINE_BINDING_MISMATCH'});}
});
test('runtime and array accessors reject without reads; sparse inspections refuse',()=>{
 for(const field of['jsSha256','wasmSha256','representation','mountEngine']){let reads=0;const a=output('a',CAD_ENGINES.occ),b=output('b',CAD_ENGINES.occ);Object.defineProperty(a.metrics.runtime,field,{enumerable:true,get(){reads++;return 1;}});assert.throws(()=>selectSolidOperandBuild([a,b],'occ','a','b'));assert.equal(reads,0);}
 let reads=0;const rows=[output('a',CAD_ENGINES.occ),output('b',CAD_ENGINES.occ)];Object.defineProperty(rows,'0',{enumerable:true,get(){reads++;return {};}});assert.throws(()=>selectSolidOperandBuild(rows,'occ','a','b'));assert.equal(reads,0);
 assert.throws(()=>selectSolidOperandBuild([,output('b',CAD_ENGINES.occ)],'occ','a','b'));
});
test('empty native outputs keep their runtime and input inspection is unchanged',()=>{
 const build=CAD_ENGINES.occ,rows=[{...output('a',build),bodyId:null,resultKind:'empty'},output('b',build)],before=JSON.stringify(rows);
 assert.equal(selectSolidOperandBuild(rows,'occ','a','b'),build);assert.equal(JSON.stringify(rows),before);
});
