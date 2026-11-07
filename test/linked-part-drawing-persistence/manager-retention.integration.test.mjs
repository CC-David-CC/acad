// Intentionally RED on codec-only branch: an integration gate, NOT permission
// to expose v3 in a runnable app. Structural empty-project/metadata fixtures;
// actual manager/validation/hash Workers, no successful Native geometry claim.
import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from '../display-units/manager-fixture.mjs';
import {definition} from '../linked-part-drawing-definition/fixture.mjs';
import {encodeProjectEnvelope} from '../../web/app/cad/projectManager/projectEnvelope.mjs';
import {geometryRevision} from '../../web/app/cad/projectManager/manufacturingMetadata.mjs';
const project=()=>({model:{history:[],expressions:'',assembly:[],counters:{featureId:0}},sketches:[]});
for(const material of [false,true])test(`INTEGRATION BLOCKER: actual manager Open then Save must retain drawing (${material?'manufacturing reconstruction':'ordinary'})`,async()=>{
 const f=fixture();try{
  const p=project(),metadata=material?{version:1,unit:'millimeter',revision:await geometryRevision(p),materials:[],appearances:[],bindings:[],objects:[]}:null;
  const incoming=encodeProjectEnvelope(p,metadata,{version:1,lengthUnit:'inch'},definition());
  await f.manager.restoreSnapshotBytesInEmptyWorkspace(new Blob([JSON.stringify(incoming)]));
  const saved=(await f.manager.prepareHostSave()).envelope;
  assert.equal(saved.version,3,'manager must not silently downgrade/discard drawing');
  assert.deepEqual(JSON.parse(JSON.stringify(saved.drawings)),JSON.parse(JSON.stringify(incoming.drawings)));
 }finally{await f.close();}
});
