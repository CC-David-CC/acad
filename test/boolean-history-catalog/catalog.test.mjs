// Pure catalog/descriptor controls. Stubs never execute or represent geometry.
import test from 'node:test';
import assert from 'node:assert/strict';
import {CAD_ENGINES,DEFAULT_CAD_ENGINE,OCC_SELECTED_PROFILE_BUILD,OCC_POLYGON_PROFILE_BUILD,OCC_MECHANICAL_PROFILE_BUILD,OCC_BOOLEAN_HISTORY_BUILD as build,requireCadEngine,requireCadEngineBuild,validateEngineMount} from '../../modules/engine/mount/engineCatalog.mjs';
const booleans=['common','union','subtract'].map(k=>'solid.boolean.'+k);
const stub=spec=>({ready:Promise.resolve(),execute(){throw Error('Not geometry');},close(){},readSolidMesh(){throw Error('Not geometry');},assertSolidBinding(){throw Error('Not geometry');},descriptor:{contractVersion:1,engine:spec.mountEngine,representation:spec.representation,unit:'millimeter',runtimeAssets:{...spec.runtimeAssets},operations:[
 ...['solid.box.create',...booleans,'solid.mesh.read','solid.dispose'].map(id=>({id,version:1,...(booleans.includes(id)?{input:spec===build?'oci-boolean-history-mm-v1':'oci-boolean-mm-v1'}:{})})),
 ...(spec===OCC_SELECTED_PROFILE_BUILD?[{id:'solid.profile.extrude',version:2}]:[]),
 ...([OCC_POLYGON_PROFILE_BUILD,OCC_MECHANICAL_PROFILE_BUILD,build].includes(spec)?[{id:'solid.profile.extrude',version:3}]:[]),
 ...([OCC_MECHANICAL_PROFILE_BUILD,build].includes(spec)?[{id:'solid.edge.treat',version:1}]:[]),
 ...(spec===build?[{id:'solid.holes.pattern.linear',version:1},{id:'solid.holes.through',version:1,kinds:['centered-through','four-corner-through'],source:'selected-rectangle',termination:'through-all',nativeResultCost:{'centered-through':2,'four-corner-through':8}},{id:'solid.selections.read',version:1,selectionPlanVersion:2}]:[])
 ]}});
test('new build is explicit, frozen and pinned; defaults and historical identities persist',()=>{
 assert.equal(build.mountEngine,'occ-boolean-history-v1-component');assert.equal(build.selectedProfileVersion,3);assert.equal(build.edgeTreatmentVersion,1);assert.equal(build.booleanHistoryVersion,1);assert.equal(build.selectionPlanVersion,2);
 assert.equal(build.runtimeAssets.jsSha256,'dd666902fe926d69cc3c8843f5568c2a3e569f38ff49291baa2f248165b5ea99');assert.equal(build.runtimeAssets.wasmSha256,'8d5e537e0d7f9e12b8ae0eaf239c0be1080934ed12a24bf6e7f849c9135ed5a2');assert(Object.isFrozen(build)&&Object.isFrozen(build.runtimeAssets));
 assert.equal(DEFAULT_CAD_ENGINE,'occ');assert.equal(requireCadEngine('occ'),CAD_ENGINES.occ);assert.equal(requireCadEngineBuild('occ'),CAD_ENGINES.occ);assert.equal(CAD_ENGINES.occ.runtimeAssets.wasmSha256,'07d763a05f35cd257501d339d9087df63c65bcaeb51a4f4f80832e333892e12e');
 for(const spec of [...Object.values(CAD_ENGINES),OCC_SELECTED_PROFILE_BUILD,OCC_POLYGON_PROFILE_BUILD,OCC_MECHANICAL_PROFILE_BUILD])assert.equal(requireCadEngineBuild(spec.id,spec.revision),spec);
 assert.equal(requireCadEngineBuild('occ',build.revision),build);
 for(const engine of ['manifold','smlib'])assert.throws(()=>requireCadEngineBuild(engine,build.revision),{code:'ENGINE_REVISION_MISMATCH'});
});
test('exact new metadata binding passes without executing anything',()=>{const m=stub(build);assert.equal(validateEngineMount('occ',m,build.revision),m);});
test('new build requires profile v3, edge v1 and common selection v1/plan v2',()=>{
 for(const id of ['solid.profile.extrude','solid.edge.treat','solid.selections.read']){
  const missing=stub(build);missing.descriptor.operations=missing.descriptor.operations.filter(x=>x.id!==id);assert.throws(()=>validateEngineMount('occ',missing,build.revision),{code:'UNBOUND_OPERATION'});
  const wrong=stub(build);wrong.descriptor.operations.find(x=>x.id===id).version=99;assert.throws(()=>validateEngineMount('occ',wrong,build.revision),{code:'UNBOUND_OPERATION'});
 }
 for(const plan of [undefined,1,'2']){const m=stub(build);m.descriptor.operations.find(x=>x.id==='solid.selections.read').selectionPlanVersion=plan;assert.throws(()=>validateEngineMount('occ',m,build.revision),{code:'UNBOUND_OPERATION'});}
 const prismOnly=stub(build);prismOnly.descriptor.operations.find(x=>x.id==='solid.selections.read').id='solid.prism.selections.read';assert.throws(()=>validateEngineMount('occ',prismOnly,build.revision),{code:'UNBOUND_OPERATION'});
});
test('all three modern Boolean operations require their exact history input label',()=>{
 for(const id of booleans)for(const input of [undefined,'oci-boolean-mm-v1','manifold-boolean-mm-v1','oci-boolean-history-mm-v2']){const m=stub(build);m.descriptor.operations.find(x=>x.id===id).input=input;assert.throws(()=>validateEngineMount('occ',m,build.revision),{code:'UNBOUND_OPERATION'});}
});
test('old mount contracts do not acquire common-read/history requirements',()=>{
 for(const spec of [...Object.values(CAD_ENGINES),OCC_SELECTED_PROFILE_BUILD,OCC_POLYGON_PROFILE_BUILD,OCC_MECHANICAL_PROFILE_BUILD]){const m=stub(spec);assert.equal(validateEngineMount(spec.id,m,spec.revision),m);}
});
test('runtime and engine mismatches cannot implicitly substitute old or new builds',()=>{
 for(const spec of [CAD_ENGINES.occ,OCC_SELECTED_PROFILE_BUILD,OCC_POLYGON_PROFILE_BUILD,OCC_MECHANICAL_PROFILE_BUILD])assert.throws(()=>validateEngineMount('occ',stub(build),spec.revision),{code:'ENGINE_BINDING_MISMATCH'});
 const swapped=stub(build);swapped.descriptor.runtimeAssets={...OCC_MECHANICAL_PROFILE_BUILD.runtimeAssets};assert.throws(()=>validateEngineMount('occ',swapped,build.revision),{code:'ENGINE_REVISION_MISMATCH'});
 assert.throws(()=>requireCadEngineBuild('occ',build.revision+'\n'),{code:'ENGINE_REVISION_MISMATCH'});
});
