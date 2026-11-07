// Independent helper-boundary review controls; these are synthetic inspections,
// not actual public authoring, Worker execution, or native-empty qualification.
import test from 'node:test';
import assert from 'node:assert/strict';
import {selectSolidOperandBuild} from '../../modules/engine/solid/solidOperandRuntime.mjs';
import {CAD_ENGINES,OCC_SELECTED_PROFILE_BUILD} from '../../modules/engine/mount/engineCatalog.mjs';
const output=(id,build)=>({outputId:id,engine:build.id,metrics:{runtime:{mountEngine:build.mountEngine,representation:build.representation,...build.runtimeAssets}}});
test('selected identity, engine and measurement containers reject accessors without executing them',()=>{
 for(const path of[['outputId'],['engine'],['metrics'],['metrics','runtime']]){
  let reads=0;const a=output('a',CAD_ENGINES.occ),b=output('b',CAD_ENGINES.occ);let target=a;
  for(const key of path.slice(0,-1))target=target[key];
  Object.defineProperty(target,path.at(-1),{enumerable:true,get(){reads++;return {};}});
  assert.throws(()=>selectSolidOperandBuild([a,b],'occ','a','b'),{code:'INVALID_OPERAND'});assert.equal(reads,0);
 }
});
test('hidden or inherited-only target fields cannot establish a live operand build',()=>{
 for(const field of['outputId','engine','metrics']){
  const a=output('a',CAD_ENGINES.occ),value=a[field];delete a[field];Object.setPrototypeOf(a,{[field]:value});
  assert.throws(()=>selectSolidOperandBuild([a,output('b',CAD_ENGINES.occ)],'occ','a','b'),{code:'INVALID_OPERAND'});
  const hidden=output('a',CAD_ENGINES.occ);Object.defineProperty(hidden,field,{value:hidden[field],enumerable:false});
  assert.throws(()=>selectSolidOperandBuild([hidden,output('b',CAD_ENGINES.occ)],'occ','a','b'),{code:'INVALID_OPERAND'});
 }
});
test('selected-profile native-empty inspection retains the same explicit build',()=>{
 const build=OCC_SELECTED_PROFILE_BUILD,a=output('a',build),b={...output('b',build),bodyId:null,resultKind:'empty'},rows=[a,b],before=JSON.stringify(rows);
 Object.freeze(a.metrics.runtime);Object.freeze(a.metrics);Object.freeze(a);Object.freeze(b.metrics.runtime);Object.freeze(b.metrics);Object.freeze(b);Object.freeze(rows);
 assert.equal(selectSolidOperandBuild(rows,'occ','a','b'),build);assert.equal(JSON.stringify(rows),before);
});
test('unselected output runtime is neither a fallback nor an unnecessary accessor read',()=>{
 let reads=0;const unrelated={outputId:'other'};Object.defineProperty(unrelated,'metrics',{enumerable:true,get(){reads++;throw Error('must not read');}});
 const build=OCC_SELECTED_PROFILE_BUILD;assert.equal(selectSolidOperandBuild([unrelated,output('a',build),output('b',build)],'occ','a','b'),build);assert.equal(reads,0);
});
test('hash prefix/suffix or mixed-case changes cannot select an unregistered runtime',()=>{
 const build=OCC_SELECTED_PROFILE_BUILD;
 for(const change of[value=>value+'\n',value=>' '+value,value=>value.toUpperCase()]){
  const a=output('a',build),b=output('b',build);a.metrics.runtime.jsSha256=change(a.metrics.runtime.jsSha256);
  assert.throws(()=>selectSolidOperandBuild([a,b],'occ','a','b'),{code:'ENGINE_REVISION_MISMATCH'});
 }
});
