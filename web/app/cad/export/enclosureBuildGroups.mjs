// Validates authored grouping/placement only. Native interface evidence is a
// separate required check; matching transforms do not establish contact.
export function validateEnclosureBuildGroups(metadata,assigned) {
 const bindings=new Map(metadata.bindings.map(b=>[b.id,b]));
 for(const object of assigned){
  const bound=object.regions.map(r=>bindings.get(r.bodyId));
  if(bound.some(b=>b?.operationType==='WORKER_ENCLOSURE_V2'&&b.outputRole!=='BODY')){
   if(bound.length!==2||bound.some(b=>!b||b.operationType!=='WORKER_ENCLOSURE_V2'||b.featureId!==bound[0].featureId)||bound.map(b=>b.outputRole).sort().join(',')!=='LABEL,LID'||object.regions[0].transform.some((v,i)=>v!==object.regions[1].transform[i]))throw Error('Inset label and lid must retain the same placement in one printable object');
  }else if(bound.length!==1)throw Error('Unsupported grouped manufacturing regions');
 }
}
