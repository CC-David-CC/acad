import {validateManufacturingMetadata, resolveManufacturingAssignments} from './manufacturingMetadata.mjs';

// A small bounded transaction builder. It never interprets a mesh or chooses an
// output by order: the existing resolver checks the actual authored pair.
export function assignEnclosureMaterials({metadata, revision, featureId, history, bodies, roles}) {
  const operations=Array.isArray(history)?history.filter(op=>Number(op?.params?.featureId)===featureId):[];
  const operationType=operations.length===1?operations[0].type:null;
  const expected=operationType==='WORKER_ENCLOSURE_V2'?['BODY','LID','LABEL']:['BODY','LID'];
  if(!['WORKER_ENCLOSURE_V1','WORKER_ENCLOSURE_V2'].includes(operationType))throw new Error('Missing or ambiguous enclosure operation');
  if (typeof revision !== 'string' || !Number.isSafeInteger(featureId) || featureId <= 0 ||
      !roles || Object.keys(roles).sort().join(',') !== [...expected].sort().join(',')) throw new Error('Invalid enclosure assignment');
  const current = metadata ? validateManufacturingMetadata(metadata) : {
    version:1, unit:'millimeter', revision, materials:[], appearances:[], bindings:[], objects:[]
  };
  if (current.revision !== revision) throw new Error('Model changed; review material assignments');
  const next = structuredClone(current);
  for (const role of expected) {
    const value = roles[role];
    if (!value || Object.keys(value).sort().join(',') !== 'appearance,material' ||
        !value.material || Object.keys(value.material).sort().join(',') !== 'id,name' ||
        !(value.appearance === null || (value.appearance && Object.keys(value.appearance).sort().join(',') === 'color,id,name'))) {
      throw new Error('Invalid material or appearance');
    }
    const bindingId = `enclosure-${featureId}-${role}`, objectId = `enclosure-object-${featureId}-${role==='LABEL'?'LID':role}`;
    const existing = next.bindings.find(binding => binding.id === bindingId);
    if (existing && (existing.featureId !== featureId || existing.operationType !== operationType || existing.outputRole !== role)) throw new Error('Assignment ID is already in use');
    const oldObject = next.objects.find(object => object.id === objectId);
    const allowed=(operationType==='WORKER_ENCLOSURE_V2'&&role!=='BODY'?['LID','LABEL']:[role]).map(r=>`enclosure-${featureId}-${r}`);
    if(oldObject && (oldObject.regions.some(r=>!allowed.includes(r.bodyId))||new Set(oldObject.regions.map(r=>r.bodyId)).size!==oldObject.regions.length))throw new Error('Printable object ID is already in use');
    for (const [list, item] of [[next.materials,value.material],[next.appearances,value.appearance]]) {
      if (!item) continue;
      const found = list.find(entry => entry.id === item.id);
      if (found && (found.name !== item.name || ('color' in item && found.color !== item.color))) throw new Error('Material or appearance ID is already in use');
      if (!found) list.push({...item});
    }
    if (!existing) next.bindings.push({id:bindingId,featureId,operationType,outputRole:role});
    const previous=oldObject?.regions.find(r=>r.bodyId===bindingId);
    const region=previous?{...previous,materialId:value.material.id,appearanceId:value.appearance?.id||null}:{id:`region-${role}`,bodyId:bindingId,materialId:value.material.id,appearanceId:value.appearance?.id||null,transform:[1,0,0,0,1,0,0,0,1,0,0,0]};
    const object=oldObject?{...oldObject,regions:previous?oldObject.regions.map(r=>r===previous?region:r):[...oldObject.regions,region]}:{id:objectId,name:role==='BODY'?'Enclosure body':'Enclosure lid',regions:[region]};
    if (oldObject) next.objects[next.objects.indexOf(oldObject)] = object; else next.objects.push(object);
  }
  const checked = validateManufacturingMetadata(next);
  resolveManufacturingAssignments(checked,history,bodies,revision);
  return checked;
}
