import {test} from 'node:test';
import assert from 'node:assert/strict';
import {decodeManufacturingProject, encodeManufacturingProject, resolveManufacturingAssignments, proposeManufacturingRebind, geometryRevision, manufacturingSnapshotDigest, prepareManufacturingSnapshot} from '../../web/app/cad/projectManager/manufacturingMetadata.mjs';

const project = {model: {history: [], expressions: ''}, sketches: []};
const metadata = {version: 1, unit: 'millimeter', revision: 'revision-1', materials: [{id: 'pla', name: 'PLA'}], appearances: [{id: 'red', name: 'Red', color: '#ff0000'}], bindings: [{id: 'authored-body-1', featureId: 1, operationType: 'BOX'}], objects: [{id: 'print-object-1', name: 'Part', regions: [{id: 'region-1', bodyId: 'authored-body-1', materialId: 'pla', appearanceId: 'red', transform: [1,0,0,0,1,0,0,0,1,0,0,0]}]}]};
function enclosureFixture(){
 const data=structuredClone(metadata),region=data.objects[0].regions[0];
 data.materials.push({id:'petg',name:'PETG'});
 data.bindings=['BODY','LID'].map(outputRole=>({id:outputRole,featureId:7,operationType:'WORKER_ENCLOSURE_V1',outputRole}));
 data.objects=['BODY','LID'].map(role=>({id:role,name:role,regions:[{...region,id:role,bodyId:role,materialId:role==='BODY'?'pla':'petg'}]}));
 const history=[{type:'WORKER_ENCLOSURE_V1',params:{featureId:7,width:100}}];
 const bodies=['BODY','LID'].map(outputRole=>({id:'worker-enclosure:1:'+JSON.stringify([7,outputRole]),featureId:7,outputRole,originatingOperation:0}));
 return {data,history,bodies};
}
test('enclosure material bindings survive reordered outputs and native envelope roundtrip',()=>{
 const {data,history,bodies}=enclosureFixture();
 const saved=decodeManufacturingProject(JSON.parse(JSON.stringify(encodeManufacturingProject(project,data)))).manufacturing;
 const resolved=resolveManufacturingAssignments(saved,history,[...bodies].reverse(),data.revision);
 assert.equal(resolved[0].regions[0].body,bodies[0]);assert.equal(resolved[1].regions[0].body,bodies[1]);
 assert.equal(resolved[0].regions[0].materialId,'pla');assert.equal(resolved[1].regions[0].materialId,'petg');
 history[0].params.width=150;
 const regenerated=bodies.map(body=>({...body}));
 const proposal=proposeManufacturingRebind(saved,history,regenerated.reverse(),'revision-2');
 assert.equal(proposal.objects[0].regions[0].body.outputRole,'BODY');
 assert.equal(proposal.objects[1].regions[0].body.outputRole,'LID');
 assert.equal(saved.revision,'revision-1');
});
test('enclosure refuses missing, duplicate, foreign and relabeled outputs',()=>{
 const {data,history,bodies}=enclosureFixture();
 for(const invalid of [[bodies[0]],[bodies[0],bodies[0]],[...bodies,bodies[1]],
   [bodies[0],{...bodies[1],featureId:8}],[bodies[0],{...bodies[1],id:bodies[0].id}],
   [bodies[0],{...bodies[1],outputRole:'LABEL'}],[bodies[0],{...bodies[1],originatingOperation:1}]]){
   assert.throws(()=>resolveManufacturingAssignments(data,history,invalid,data.revision),/Missing or ambiguous/);
 }
});
test('only declared enclosure roles are accepted, with no implicit first output',async()=>{
 const {data}=enclosureFixture();
 for(const change of [binding=>delete binding.outputRole,binding=>{binding.outputRole='LABEL'},binding=>{binding.operationType='BOX'}]){
   const bad=structuredClone(data);change(bad.bindings[0]);assert.throws(()=>encodeManufacturingProject(project,bad),/binding/);
 }
 const changed=structuredClone(data);changed.bindings[0].outputRole='LID';
 assert.notEqual(await manufacturingSnapshotDigest(project,data),await manufacturingSnapshotDigest(project,changed));
});
test('legacy remains unchanged, no invented metadata or identity', () => {
  assert.deepEqual(decodeManufacturingProject(project), {project, manufacturing: null});
});
test('versioned metadata roundtrips and separates unit, material and appearance', () => {
  const encoded = encodeManufacturingProject(project, metadata);
  assert.equal('model' in encoded, false);
  assert.deepEqual(decodeManufacturingProject(JSON.parse(JSON.stringify(encoded))), {project, manufacturing: metadata});
});
test('unknown versions and invalid references fail before caller mutates state', () => {
  for (const change of [e => { e.version = 2; }, e => { e.manufacturing.version = 2; }, e => { e.manufacturing.objects[0].regions[0].materialId = 'missing'; }, e => { e.manufacturing.unit = 'furlong'; }]) {
    const encoded = encodeManufacturingProject(project, metadata); change(encoded);
    let mutation = false;
    assert.throws(() => { decodeManufacturingProject(encoded); mutation = true; });
    assert.equal(mutation, false);
  }
});
test('body resolution refuses absent and ambiguous identities', () => {
  const history = [{type: 'BOX', params: {featureId: 1}}];
  for (const bodies of [[], [{originatingOperation: 0}, {originatingOperation: 0}]]) assert.throws(() => resolveManufacturingAssignments(metadata, history, bodies, 'revision-1'), /Missing or ambiguous/);
  const body = {originatingOperation: 0}; assert.equal(resolveManufacturingAssignments(metadata, history, [body], 'revision-1')[0].regions[0].body, body);
  assert.throws(() => resolveManufacturingAssignments(metadata, history, [body], 'different-revision'), /revision changed/);
  assert.throws(() => resolveManufacturingAssignments(metadata, [...history, ...history], [body], 'revision-1'), /Missing or ambiguous/);
});
test('object grouping and transforms roundtrip explicitly rather than by color', () => {
  const m = structuredClone(metadata), region = m.objects[0].regions[0];
  m.bindings.push({id: 'body-2', featureId: 2, operationType: 'BOX'}, {id: 'body-3', featureId: 3, operationType: 'BOX'});
  m.objects[0].regions.push({...region, id: 'region-2', bodyId: 'body-2'});
  m.objects.push({id: 'other-part', name: 'Other', regions: [{...region, id: 'region-3', bodyId: 'body-3', transform: [1,0,0,0,1,0,0,0,1,12,0,0]}]});
  const decoded = decodeManufacturingProject(encodeManufacturingProject(project, m)).manufacturing;
  assert.deepEqual(decoded, m);
  assert.equal(decoded.objects[0].regions.length, 2);
  assert.equal(decoded.objects[1].regions[0].transform[9], 12);
  assert.equal(decoded.revision, 'revision-1');
});
test('changed revision produces a review proposal only for unique compatible producer', () => {
  const history = [{type: 'BOX', params: {featureId: 1}}], body = {originatingOperation: 0};
  const proposal = proposeManufacturingRebind(metadata, history, [body], 'revision-2');
  assert.equal(proposal.fromRevision, 'revision-1');
  assert.equal(proposal.toRevision, 'revision-2');
  assert.equal(metadata.revision, 'revision-1');
  assert.throws(() => proposeManufacturingRebind(metadata, [{type: 'SPHERE', params: {featureId: 1}}], [body], 'revision-2'), /Missing or ambiguous/);
  assert.throws(() => proposeManufacturingRebind(metadata, history, [body, {...body}], 'revision-2'), /Missing or ambiguous/);
});
test('separate canonical hashes detect geometry or material changes without formatting changes', async () => {
  const reordered = JSON.parse('{"sketches": [], "model": {"expressions":"", "history":[]}}');
  const geom = await geometryRevision(project), full = await manufacturingSnapshotDigest(project, metadata);
  assert.equal(await geometryRevision(reordered), geom);
  assert.equal(await manufacturingSnapshotDigest(reordered, metadata), full);
  const modified = structuredClone(project); modified.model.history.push({type:'BOX', params:{width:15}});
  assert.notEqual(await geometryRevision(modified), geom);
  assert.notEqual(await manufacturingSnapshotDigest(modified, metadata), full);
  const changedMaterial = structuredClone(metadata); changedMaterial.appearances[0].color = '#00ff00';
  assert.equal(await geometryRevision(project), geom);
  assert.notEqual(await manufacturingSnapshotDigest(project, changedMaterial), full);
  const changedTransform = structuredClone(metadata); changedTransform.objects[0].regions[0].transform[9] = 12;
  assert.equal(await geometryRevision(project), geom);
  assert.notEqual(await manufacturingSnapshotDigest(project, changedTransform), full);
  const changedGrouping = structuredClone(metadata); changedGrouping.objects[0].name = 'Different grouping';
  assert.notEqual(await manufacturingSnapshotDigest(project, changedGrouping), full);
  await assert.rejects(geometryRevision({model:{history:[undefined]},sketches:[]}));
});
test('preparation recomputes revisions and rejects stale or concurrently edited data', async () => {
  const m = structuredClone(metadata); m.revision = await geometryRevision(project);
  const state = {project: structuredClone(project), manufacturing:m};
  const prepared = await prepareManufacturingSnapshot(() => state, () => true);
  assert.equal(prepared.geometryRevision, m.revision);
  assert.equal(prepared.snapshotDigest, await manufacturingSnapshotDigest(project, m));
  const changed = structuredClone(state); changed.manufacturing.revision = 'caller-claim';
  await assert.rejects(prepareManufacturingSnapshot(() => changed, () => true), /review material assignments/);
  const concurrent = structuredClone(state);
  const pending = prepareManufacturingSnapshot(() => concurrent, () => true);
  concurrent.manufacturing.appearances[0].name = 'Changed while hashing';
  await assert.rejects(pending, /changed while preparing/);
  await assert.rejects(prepareManufacturingSnapshot(() => state, () => false), /unavailable/);
  const tooLarge = structuredClone(state); tooLarge.project.model.expressions = 'x'.repeat(8 * 1024 * 1024);
  await assert.rejects(prepareManufacturingSnapshot(() => tooLarge, () => true), /8 MiB/);
});
