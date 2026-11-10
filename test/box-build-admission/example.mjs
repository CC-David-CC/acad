// Existing registered commands only. No source setter, inferred output ID or handle.
export function createOccBooleanExample({execute,engineRevision}){
 const inspect=()=>execute('inspect-worker-solids',{});
 async function box(d){const i=await inspect();return execute('create-worker-solid-box',{revision:i.revision,version:1,unit:'millimeter',engine:'occ',engineRevision,origin:d.origin.slice(),dimensions:d.dimensions.slice()});}
 async function boolean(d,bindings){const i=await inspect();return execute('create-worker-solid-boolean',{revision:i.revision,version:1,unit:'millimeter',engine:'occ',kind:d.kind,a:bindings[d.a].outputId,b:bindings[d.b].outputId});}
 async function editRequest(binding,fields){const i=await execute('inspect-worker-solid-history',{}),rows=i.features.filter(row=>row.featureId===binding.featureId);if(rows.length!==1)throw Error('Actual box producer unavailable.');const {index,featureId,engine,x,y,z,width,depth,height}=rows[0];return{revision:i.revision,index,featureId,engine,x,y,z,width,depth,height,...fields};}
 const edit=async(binding,fields)=>execute('edit-worker-solid-box',await editRequest(binding,fields));
 return Object.freeze({inspect,box,boolean,editRequest,edit});
}
