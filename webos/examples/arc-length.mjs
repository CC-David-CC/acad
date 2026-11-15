// Source-only public recipe; do not treat this file as runtime qualification.
export function createArcLengthExample(agent){
 const call=(command,args={})=>agent.execute(command,args);
 async function inspect(faceId){const i=await call('inspect-closed-sketches');return call('inspect-closed-sketch-arc-measurements',{revision:i.revision,faceId});}
 const one=(rows,label)=>{if(rows.length!==1)throw Error('Expected one '+label);return rows[0];};
 return Object.freeze({inspect,
  async create(faceId,arcId){const i=await inspect(faceId),row=one(i.measurements.filter(r=>r.arcId===arcId&&r.canCreate),'current authored Arc');return call('create-closed-sketch-arc-length-measurement',{revision:i.revision,faceId,arcId:row.arcId});},
  async promote(faceId,arcId){const i=await inspect(faceId),row=one(i.measurements.filter(r=>r.arcId===arcId&&r.role==='reference'&&r.canConvert&&r.measurementId),'native Arc ruler');return call('convert-closed-sketch-arc-length-role',{revision:i.revision,faceId,target:{measurementId:row.measurementId},role:'driving',value:row.canonicalValue});},
  async demote(faceId,arcId){const i=await inspect(faceId),row=one(i.measurements.filter(r=>r.arcId===arcId&&r.role==='driving'&&r.canConvert&&r.constraintId),'current Arc driver');return call('convert-closed-sketch-arc-length-role',{revision:i.revision,faceId,target:{constraintId:row.constraintId},role:'reference'});},
  async remove(faceId,arcId){const i=await inspect(faceId),row=one(i.measurements.filter(r=>r.arcId===arcId&&r.role==='reference'&&r.measurementId),'native reference Arc ruler');return call('remove-closed-sketch-arc-length-measurement',{revision:i.revision,faceId,measurementId:row.measurementId});},
  async edit(faceId,arcId,value){const i=await call('inspect-closed-sketches'),s=await call('inspect-closed-sketch',{revision:i.revision,faceId}),row=one(s.dimensionTargets.filter(r=>r.typeId==='ArcLength'&&r.objects.length===1&&r.objects[0]===arcId&&r.canEdit),'current ArcLength dimension');return call('edit-closed-sketch-dimension',{revision:i.revision,faceId,constraintId:row.constraintId,value});}
 });
}
