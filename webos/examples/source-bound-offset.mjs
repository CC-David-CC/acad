// User-invoked example. Caller supplies genuine current source face/root IDs.
// No auto execution, source injection, generator-ID grammar or AI provider.
export function createSourceBoundOffsetExample(agent){
 const call=(id,args={})=>agent.execute(id,args);
 async function inspect(faceId){const i=await call('inspect-closed-sketches');return call('inspect-sketch-offsets',{revision:i.revision,faceId});}
 async function create(faceId,sourceId,distance,side){const i=await inspect(faceId),root=i.sources.find(r=>r.id===sourceId);if(!root?.canOffset)throw Error(root?.reason||'Choose an actual eligible source root.');return call('create-sketch-offset',{revision:i.revision,faceId,sourceId,distance,side});}
 async function edit(faceId,outputId,distance,side){const i=await inspect(faceId),r=i.offsets.find(r=>r.outputId===outputId);if(!r?.canEdit)throw Error('Choose a current actual Offset output.');return call('edit-sketch-offset',{revision:i.revision,faceId,outputId,distance,side});}
 async function remove(faceId,outputId){const i=await inspect(faceId),r=i.offsets.find(r=>r.outputId===outputId);if(!r?.canRemove)throw Error('The current Offset has retained dependents or is unavailable.');return call('remove-sketch-offset',{revision:i.revision,faceId,outputId});}
 return Object.freeze({inspect,create,edit,remove});
}
