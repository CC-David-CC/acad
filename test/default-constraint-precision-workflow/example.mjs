// Public authoring/edit helpers only. Human default creation is deliberately
// absent: the existing real Circle -> Diameter -> APPLY action must perform it.
export const FIXTURE=Object.freeze({center:Object.freeze({x:40.125,y:20.375}),radius:4.123456789,editedDiameter:12.345678901,reeditedDiameter:9.876543219,unrelated:Object.freeze({x:7.25,y:9.625})});
export function createDefaultConstraintPrecisionExample(agent){
 if(!agent||typeof agent.execute!=='function'||typeof agent.inspect!=='function')throw Error('Supply the real window-bound public CAD agent.');
 const call=(id,args={})=>agent.execute(id,args),one=(rows,label)=>{if(!Array.isArray(rows)||rows.length!==1)throw Error('Expected one '+label);return rows[0];};let busy=false;
 const serial=async work=>{if(busy)throw Error('Wait for the current public operation.');busy=true;try{return await work();}finally{busy=false;}};
 async function inspect(faceId){const a=await call('inspect-closed-sketches');if(!a.ready||!a.candidates.some(c=>c.faceId===faceId))throw Error('Current source is unavailable.');return call('inspect-closed-sketch',{revision:a.revision,faceId});}
 async function append(faceId,kind,data){const a=await inspect(faceId),receipt=await call('append-sketch-primitive',{revision:a.revision,faceId,kind,role:null,stage:a.stageCount-1,data}),after=await inspect(faceId);one(after.objects.filter(o=>o.id===receipt.primitive.id&&o.type===kind),'actual appended '+kind);return receipt;}
 return Object.freeze({
  begin:()=>serial(async()=>{
   const doc=await agent.inspect();if(doc.path||doc.dirty||doc.operationCount||doc.sketchCount)throw Error('Use a genuinely new empty unsaved document.');
   const ready=await call('inspect-rectangle-creation'),rectangle=await call('create-rectangle-sketch',{revision:ready.revision,unit:'millimeter',origin:[0,0],width:10,height:10,depth:0}),faceId=rectangle.faceId,initial=await inspect(faceId),rectangleIds=initial.objects.filter(o=>o.type==='Segment').map(o=>o.id);
   if(rectangleIds.length!==4)throw Error('Expected the actual four datum segments.');
   const bottom=one(initial.objects.filter(o=>rectangleIds.includes(o.id)&&initial.points.filter(p=>p.parentId===o.id).length===2&&initial.points.filter(p=>p.parentId===o.id).every(p=>p.y===0)),'actual bottom segment'),datum=one(initial.points.filter(p=>p.parentId===bottom.id&&p.x===0&&p.y===0),'actual anchored datum point');
   const circle=await append(faceId,'Circle',{c:{...FIXTURE.center},r:FIXTURE.radius}),unrelated=await append(faceId,'Point',{...FIXTURE.unrelated}),now=await inspect(faceId),center=one(now.points.filter(p=>p.parentId===circle.primitive.id),'actual center');
   for(const [axis,distance]of[['x',FIXTURE.center.x],['y',FIXTURE.center.y]]){const a=await inspect(faceId);await call('apply-closed-sketch-signed-distance',{revision:a.revision,faceId,axis,ids:[datum.id,center.id],distance});}
   return Object.freeze({faceId,rectangleIds:Object.freeze(rectangleIds),datumId:datum.id,circleId:circle.primitive.id,centerId:center.id,unrelatedId:unrelated.primitive.id,authorReceipts:Object.freeze({rectangle,circle,unrelated})});
  }),
  inspect:binding=>inspect(binding.faceId),
  edit:(binding,value)=>serial(async()=>{const a=await inspect(binding.faceId),row=one(a.dimensionTargets.filter(r=>r.typeId==='DiameterLength'&&r.canEdit&&r.objects.length===1&&r.objects[0]===binding.circleId),'current actual driving diameter');return call('edit-closed-sketch-dimension',{revision:a.revision,faceId:binding.faceId,constraintId:row.constraintId,value});}),
  authoredEdits:()=>call('inspect-authored-edits')
 });
}
