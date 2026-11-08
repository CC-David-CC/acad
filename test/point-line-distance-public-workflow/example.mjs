// Registered commands only; no source setter, inferred ID grammar or native slot.
export function createPointLineDistanceExample(agent){
 const call=(id,args={})=>agent.execute(id,args),one=(rows,label)=>{if(rows.length!==1)throw Error('Expected one '+label);return rows[0];};
 async function inspect(faceId){const l=await call('inspect-closed-sketches');return call('inspect-closed-sketch',{revision:l.revision,faceId});}
 async function append(faceId,kind,data){const i=await inspect(faceId);return call('append-sketch-primitive',{revision:i.revision,faceId,kind,role:null,stage:i.stageCount-1,data});}
 async function signed(b,axis,id,value){const i=await inspect(b.faceId);return call('apply-closed-sketch-signed-distance',{revision:i.revision,faceId:b.faceId,axis,ids:[b.datumId,id],distance:value-100});}
 async function dimension(b,type,refs,value,remove=false){const i=await inspect(b.faceId),d=one(i.dimensionTargets.filter(r=>r.typeId===type&&r.canEdit&&JSON.stringify(r.objects)===JSON.stringify(refs)),'discovered '+type);return call(remove?'remove-closed-sketch-dimension':'edit-closed-sketch-dimension',{revision:i.revision,faceId:b.faceId,constraintId:d.constraintId,...(!remove?{value}:{})});}
 async function create(b,distance,inverted=false,pointId=b.pointId){const i=await inspect(b.faceId);return call('apply-closed-sketch-point-line-distance',{revision:i.revision,faceId:b.faceId,pointId,lineId:b.lineId,distance,inverted});}
 return Object.freeze({inspect,signed,dimension,create,append,
  async build(){const ready=await call('inspect-rectangle-creation');if(!ready.ready)throw Error(ready.reason);const rectangle=await call('create-rectangle-sketch',{revision:ready.revision,unit:'millimeter',origin:[100,100],width:10,height:10,depth:0}),faceId=rectangle.faceId,i=await inspect(faceId),lock=one(i.constraints.filter(c=>c.typeId==='LockPoint'&&Number(c.constants.x)===100&&Number(c.constants.y)===100),'genuine datum LockPoint'),datum=one(i.points.filter(p=>p.id===lock.objects[0]),'actual datum');
   const line=await append(faceId,'Segment',{a:{x:0,y:0},b:{x:10,y:0}}),point=await append(faceId,'Point',{x:20,y:2}),q=await append(faceId,'Point',{x:7,y:9}),now=await inspect(faceId),lineId=line.primitive.id,b={faceId,rectangle,rectangleIds:i.objects.map(o=>o.id),datumId:datum.id,lineId,aId:one(now.points.filter(p=>p.parentId===lineId&&p.x===0&&p.y===0),'actual line A').id,bId:one(now.points.filter(p=>p.parentId===lineId&&p.x===10&&p.y===0),'actual line B').id,pointId:one(now.points.filter(p=>p.parentId===point.primitive.id),'actual Point').id,pointRoot:point.primitive.id,qRoot:q.primitive.id};
   for(const [id,x,y]of [[b.aId,0,0],[b.bId,10,0]])for(const [axis,value]of [['x',x],['y',y]])await signed(b,axis,id,value);
   return b;
  },
  edit:(b,value)=>dimension(b,'DistancePL',[b.pointId,b.lineId],value),
  remove:b=>dimension(b,'DistancePL',[b.pointId,b.lineId],null,true),
  unlock:(b,axis,id)=>dimension(b,axis==='x'?'SignedDistanceX':'SignedDistanceY',[b.datumId,id],null,true),
  async move(b,id,x,y){const i=await inspect(b.faceId);return call('edit-closed-sketch-point',{revision:i.revision,faceId:b.faceId,id,x,y});},
  async definitions(definitions){const i=await call('inspect-physical-parameters');return call('apply-physical-bindings',{revision:i.revision,changes:[],definitions});},
  async extrude(b,engineRevision){const i=await call('inspect-selected-profiles',{engineRevision});if(!i.ready)throw Error(i.reason);const choices=await call('inspect-selected-regions',{revision:i.revision,faceId:b.faceId,depth:20,engineRevision}),region=one(choices.regions.filter(r=>r.support==='supported'&&r.descriptor.outerCurveIds?.length===4&&r.descriptor.outerCurveIds.every(id=>b.rectangleIds.includes(id))),'actual original rectangle region'),body=await call('create-selected-extrusion',{revision:choices.revision,faceId:b.faceId,regionId:region.regionId,unit:'millimeter',engine:'occ',engineRevision,depth:20,bodyPolicy:'separate'});return{...b,body,regionId:region.regionId};}
 });
}
