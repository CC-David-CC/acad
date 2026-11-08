// Public registry only; inspect actual native IDs, never parse their grammar.
export function createWholeEntityFixExample(agent){
 const call=(id,args={})=>agent.execute(id,args),one=(a,label)=>{if(a.length!==1)throw Error('Expected one '+label);return a[0];};
 async function inspect(faceId){const l=await call('inspect-closed-sketches');return call('inspect-closed-sketch',{revision:l.revision,faceId});}
 async function append(faceId,kind,data){const i=await inspect(faceId);return call('append-sketch-primitive',{revision:i.revision,faceId,kind,role:null,stage:i.stageCount-1,data});}
 async function signed(b,axis,ids,distance){const i=await inspect(b.faceId);return call('apply-closed-sketch-signed-distance',{revision:i.revision,faceId:b.faceId,axis,ids,distance});}
 async function dimension(b,id,type,value,remove=false){const i=await inspect(b.faceId),d=one(i.dimensionTargets.filter(d=>d.typeId===type&&d.objects.length===1&&d.objects[0]===id&&d.canEdit),'actual dimension');return call(remove?'remove-closed-sketch-dimension':'edit-closed-sketch-dimension',{revision:i.revision,faceId:b.faceId,constraintId:d.constraintId,...(!remove?{value}:{})});}
 return Object.freeze({inspect,dimension,
  async build(){const ready=await call('inspect-rectangle-creation');if(!ready.ready)throw Error(ready.reason);const rectangle=await call('create-rectangle-sketch',{revision:ready.revision,unit:'millimeter',origin:[100,100],width:10,height:10,depth:0}),faceId=rectangle.faceId,original=await inspect(faceId),lock=one(original.constraints.filter(c=>c.typeId==='LockPoint'&&Number(c.constants.x)===100&&Number(c.constants.y)===100),'actual datum LockPoint'),datum=one(original.points.filter(p=>p.id===lock.objects[0]),'actual datum');
   const specs={segment:['Segment',{a:{x:-3,y:4},b:{x:2,y:16}}],circle:['Circle',{c:{x:20,y:30},r:5}],quarter:['Arc',{a:{x:50,y:20},b:{x:40,y:30},c:{x:40,y:20}}],major:['Arc',{a:{x:70,y:30},b:{x:80,y:20},c:{x:70,y:20}}]},entities={};
   for(const [name,[kind,data]]of Object.entries(specs)){const r=await append(faceId,kind,data);entities[name]={id:r.primitive.id,kind};}
   const free=await append(faceId,'Point',{x:7,y:9}),i=await inspect(faceId),b={faceId,rectangle,rectangleIds:original.objects.map(o=>o.id),datumId:datum.id,entities,unrelatedId:free.primitive.id},point=(name,x,y)=>one(i.points.filter(p=>p.parentId===entities[name].id&&p.x===x&&p.y===y),'actual '+name+' point').id;
   Object.assign(entities.segment,{aId:point('segment',-3,4),bId:point('segment',2,16)});entities.circle.cId=point('circle',20,30);Object.assign(entities.quarter,{aId:point('quarter',50,20),bId:point('quarter',40,30),cId:point('quarter',40,20)});Object.assign(entities.major,{aId:point('major',70,30),bId:point('major',80,20),cId:point('major',70,20)});
   for(const [name,x,y]of [['circle',20,30],['quarter',40,20],['major',70,20]])for(const [axis,distance]of [['x',x-100],['y',y-100]])await signed(b,axis,[b.datumId,entities[name].cId],distance);
   await signed(b,'y',[entities.quarter.cId,entities.quarter.aId],0);await signed(b,'x',[entities.quarter.cId,entities.quarter.bId],0);await signed(b,'x',[entities.major.cId,entities.major.aId],0);await signed(b,'y',[entities.major.cId,entities.major.bId],0);
   const now=await inspect(faceId);await call('apply-closed-sketch-diameter',{revision:now.revision,faceId,id:entities.circle.id,diameter:10});return b;
  },
  async fix(b,name){const i=await inspect(b.faceId),e=b.entities[name],t=one(i.fixedEntities.targets.filter(t=>t.id===e.id),'actual Fix target');if(!t.canFix)throw Error(t.reason);return call('apply-closed-sketch-fix-entity',{revision:i.revision,faceId:b.faceId,id:e.id});},
  async unfix(b,name){const i=await inspect(b.faceId),t=one(i.fixedEntities.rows.filter(t=>t.id===b.entities[name].id&&t.canRemove),'actual Fix row');return call('remove-closed-sketch-fix-entity',{revision:i.revision,faceId:b.faceId,constraintId:t.constraintId});},
  async move(b,id,x,y){const i=await inspect(b.faceId);return call('edit-closed-sketch-point',{revision:i.revision,faceId:b.faceId,id,x,y});},
  async segment(b,a,end){const i=await inspect(b.faceId),e=b.entities.segment;return call('edit-closed-sketch-points',{revision:i.revision,faceId:b.faceId,points:[{id:e.aId,x:a[0],y:a[1]},{id:e.bId,x:end[0],y:end[1]}]});},
  async radius(b,name,value){const i=await inspect(b.faceId);return call('apply-closed-sketch-radius',{revision:i.revision,faceId:b.faceId,id:b.entities[name].id,radius:value});},
  async diameter(b,value){const i=await inspect(b.faceId);return call('apply-closed-sketch-diameter',{revision:i.revision,faceId:b.faceId,id:b.entities.circle.id,diameter:value});},
  async definitions(definitions){const i=await call('inspect-physical-parameters');return call('apply-physical-bindings',{revision:i.revision,changes:[],definitions});}
 });
}
