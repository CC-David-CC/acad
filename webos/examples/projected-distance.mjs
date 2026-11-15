// Public registry operations only. Importing this recipe never authors anything.
// Use one current document-bound createCadAgent, or the signed driver's equivalent.
export function createProjectedDistanceExample(agent){
 const call=(id,args={})=>agent.execute(id,args),one=(rows,label)=>{if(rows.length!==1)throw Error('Expected one '+label);return rows[0];};
 async function inspect(faceId){const l=await call('inspect-closed-sketches');return call('inspect-closed-sketch',{revision:l.revision,faceId});}
 async function append(faceId,kind,data){const i=await inspect(faceId);return call('append-sketch-primitive',{revision:i.revision,faceId,kind,role:null,stage:i.stageCount-1,data});}
 async function signed(b,axis,ids,distance){const i=await inspect(b.faceId);return call('apply-closed-sketch-signed-distance',{revision:i.revision,faceId:b.faceId,axis,ids,distance});}
 async function dimension(b,type,objects,value,remove=false){const i=await inspect(b.faceId),d=one(i.dimensionTargets.filter(d=>d.typeId===type&&d.canEdit&&JSON.stringify(d.objects)===JSON.stringify(objects)),'actual discovered '+type);return call(remove?'remove-closed-sketch-dimension':'edit-closed-sketch-dimension',{revision:i.revision,faceId:b.faceId,constraintId:d.constraintId,...(!remove?{value}:{})});}
 return Object.freeze({inspect,signed,dimension,
  async build(){const ready=await call('inspect-rectangle-creation');if(!ready.ready)throw Error(ready.reason);const rectangle=await call('create-rectangle-sketch',{revision:ready.revision,unit:'millimeter',origin:[0,0],width:10,height:10,depth:0}),faceId=rectangle.faceId,i=await inspect(faceId),lock=one(i.constraints.filter(c=>c.typeId==='LockPoint'&&c.objects.length===1&&Number(c.constants.x)===0&&Number(c.constants.y)===0),'actual authored datum LockPoint'),datum=one(i.points.filter(p=>p.id===lock.objects[0]),'actual locked datum');
   const point=await append(faceId,'Point',{x:-3,y:4}),direction=await append(faceId,'Segment',{a:{x:10,y:10},b:{x:20,y:10}}),unrelated=await append(faceId,'Point',{x:77,y:99}),now=await inspect(faceId),b={faceId,rectangle,rectangleIds:i.objects.map(o=>o.id),datumId:datum.id,pointId:one(now.points.filter(p=>p.parentId===point.primitive.id),'actual standalone Point').id,pointRoot:point.primitive.id,directionId:direction.primitive.id,startId:one(now.points.filter(p=>p.parentId===direction.primitive.id&&p.x===10&&p.y===10),'actual Segment start').id,endId:one(now.points.filter(p=>p.parentId===direction.primitive.id&&p.x===20&&p.y===10),'actual Segment end').id,unrelatedId:unrelated.primitive.id};
   for(const [id,x,y]of [[b.startId,10,10],[b.endId,20,10]])for(const [axis,distance]of [['x',x],['y',y]])await signed(b,axis,[b.datumId,id],distance);
   return b;
  },
  async euclidean(b,distance=5){const i=await inspect(b.faceId);return call('apply-closed-sketch-point-distance',{revision:i.revision,faceId:b.faceId,ids:[b.datumId,b.pointId],distance});},
  projected:(b,distance)=>signed(b,'projected',[b.datumId,b.pointId,b.directionId],distance),
  edit:(b,value)=>dimension(b,'ProjectedDistance',[b.datumId,b.pointId,b.directionId],value),
  remove:b=>dimension(b,'ProjectedDistance',[b.datumId,b.pointId,b.directionId],null,true),
  direction:(b,axis,value)=>dimension(b,axis==='x'?'SignedDistanceX':'SignedDistanceY',[b.datumId,b.endId],value),
  async move(b,x,y){const i=await inspect(b.faceId);return call('edit-closed-sketch-point',{revision:i.revision,faceId:b.faceId,id:b.pointId,x,y});},
  async definitions(definitions){const i=await call('inspect-physical-parameters');return call('apply-physical-bindings',{revision:i.revision,changes:[],definitions});}
 });
}
