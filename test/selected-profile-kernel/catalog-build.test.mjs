// Catalog/protocol binding controls only; no native geometry from this stub.
import test from 'node:test';import assert from 'node:assert/strict';
import {CAD_ENGINES,OCC_SELECTED_PROFILE_BUILD,requireCadEngine,requireCadEngineBuild,validateEngineMount} from '../../modules/engine/mount/engineCatalog.mjs';
const stub=spec=>({ready:Promise.resolve(),execute(){},close(){},readSolidMesh(){},assertSolidBinding(){},descriptor:{contractVersion:1,engine:spec.mountEngine,representation:spec.representation,unit:'millimeter',runtimeAssets:spec.runtimeAssets,operations:[...['solid.box.create','solid.boolean.common','solid.boolean.union','solid.boolean.subtract','solid.mesh.read','solid.dispose'].map(id=>({id,version:1})),...(spec===OCC_SELECTED_PROFILE_BUILD?[{id:'solid.profile.extrude',version:2}]:[])]}});
test('experimental OCC build is explicit and leaves default engine identities unchanged',()=>{
 assert.equal(requireCadEngine('occ'),CAD_ENGINES.occ);assert.equal(requireCadEngineBuild('occ'),CAD_ENGINES.occ);
 assert.equal(requireCadEngineBuild('occ',CAD_ENGINES.occ.revision),CAD_ENGINES.occ);
 assert.equal(requireCadEngineBuild('occ',OCC_SELECTED_PROFILE_BUILD.revision),OCC_SELECTED_PROFILE_BUILD);
 assert.throws(()=>requireCadEngineBuild('manifold',OCC_SELECTED_PROFILE_BUILD.revision),{code:'ENGINE_REVISION_MISMATCH'});
 assert.throws(()=>requireCadEngineBuild('occ','unknown'),{code:'ENGINE_REVISION_MISMATCH'});
});
test('same engine with a different runtime cannot silently satisfy a mount binding',()=>{
 const standard=stub(CAD_ENGINES.occ),selected=stub(OCC_SELECTED_PROFILE_BUILD);
 assert.equal(validateEngineMount('occ',standard),standard);
 assert.equal(validateEngineMount('occ',selected,OCC_SELECTED_PROFILE_BUILD.revision),selected);
 assert.throws(()=>validateEngineMount('occ',selected),{code:'ENGINE_BINDING_MISMATCH'});
 assert.throws(()=>validateEngineMount('occ',standard,OCC_SELECTED_PROFILE_BUILD.revision),{code:'ENGINE_BINDING_MISMATCH'});
 selected.descriptor.operations.pop();assert.throws(()=>validateEngineMount('occ',selected,OCC_SELECTED_PROFILE_BUILD.revision),{code:'UNBOUND_OPERATION'});
});
