// Build choice only; no geometry or implicit conversion is exercised.
import test from 'node:test';
import assert from 'node:assert/strict';
import {OCC_SELECTED_PROFILE_BUILD,OCC_POLYGON_PROFILE_BUILD,OCC_MECHANICAL_PROFILE_BUILD,OCC_BOOLEAN_HISTORY_BUILD,CAD_ENGINES} from '../../modules/engine/mount/engineCatalog.mjs';
import {selectedProfileVersion,selectSelectedProfileHistoryBuild} from '../../modules/engine/mount/selectedProfileBuildSelection.mjs';
const row=build=>({type:'WORKER_SELECTED_PROFILE_EXTRUDE_V2',params:{engine:build.id,engineRevision:build.revision}});
test('blank selected-profile project uses the qualified Boolean-history candidate',()=>{
 assert.equal(selectSelectedProfileHistoryBuild([]),OCC_BOOLEAN_HISTORY_BUILD);
 assert.equal(selectedProfileVersion(OCC_BOOLEAN_HISTORY_BUILD),3);
});
test('every existing explicit part history retains its exact registered build',()=>{
 for(const build of [OCC_SELECTED_PROFILE_BUILD,OCC_POLYGON_PROFILE_BUILD,OCC_MECHANICAL_PROFILE_BUILD,OCC_BOOLEAN_HISTORY_BUILD]){
  const h=[row(build)],before=JSON.stringify(h);assert.equal(selectSelectedProfileHistoryBuild(h),build);assert.equal(JSON.stringify(h),before);
 }
});
test('mixed builds and unsupported profile backends refuse without substitution',()=>{
 assert.throws(()=>selectSelectedProfileHistoryBuild([row(OCC_MECHANICAL_PROFILE_BUILD),row(OCC_BOOLEAN_HISTORY_BUILD)]),{code:'ENGINE_REVISION_MISMATCH'});
 assert.throws(()=>selectSelectedProfileHistoryBuild([row(CAD_ENGINES.manifold)]),{code:'UNSUPPORTED_PROFILE_BUILD'});
});
