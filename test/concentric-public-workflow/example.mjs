// Public commands only. Supply the real createCadAgent for one explicit window.
// Importing this module does not mutate a project or create a second model.
export function createConcentricExample(agent){
 if(!agent||!['execute','inspect','discover','travel','save','open'].every(k=>typeof agent[k]==='function'))throw Error('Supply the current public CAD agent helper.');
 const one=(rows,label)=>{if(!Array.isArray(rows)||rows.length!==1)throw Error('Expected one '+label);return rows[0];},near=(a,b)=>Math.abs(a-b)<=1e-6;
 const call=(id,args={})=>agent.execute(id,args);let busy=false;
 const serial=async work=>{if(busy)throw Error('Wait for the current example operation.');busy=true;try{return await work();}finally{busy=false;}};
 async function inspect(faceId){const list=await call('inspect-closed-sketches');if(!list.ready||!list.candidates.some(x=>x.faceId===faceId))throw Error('The source sketch is unavailable.');return call('inspect-closed-sketch',{revision:list.revision,faceId});}
 async function append(faceId,kind,data){const i=await inspect(faceId),r=await call('append-sketch-primitive',{revision:i.revision,faceId,kind,role:null,stage:i.stageCount-1,data});const after=await inspect(faceId);return one(after.objects.filter(o=>o.id===r.primitive.id&&o.type===kind),'actual appended '+kind);}
 async function dimension(binding,type,objects,value,remove=false){const i=await inspect(binding.faceId),row=one(i.dimensionTargets.filter(r=>r.typeId===type&&r.canEdit&&JSON.stringify(r.objects)===JSON.stringify(objects)),'current discovered '+type);if(remove&&!row.canRemove)throw Error('The discovered dimension is not removable.');return call(remove?'remove-closed-sketch-dimension':'edit-closed-sketch-dimension',{revision:i.revision,faceId:binding.faceId,constraintId:row.constraintId,...(!remove?{value}:{})});}
 return Object.freeze({
  discover:()=>agent.discover(),
  build:()=>serial(async()=>{
   const doc=await agent.inspect();if(doc.path||doc.dirty||doc.operationCount||doc.sketchCount)throw Error('Use a new empty unsaved CAD document.');
   const ready=await call('inspect-rectangle-creation'),rectangle=await call('create-rectangle-sketch',{revision:ready.revision,unit:'millimeter',origin:[0,0],width:10,height:10,depth:0}),faceId=rectangle.faceId,i=await inspect(faceId);
   const bottom=one(i.objects.filter(o=>o.type==='Segment').filter(o=>{const ps=i.points.filter(p=>p.parentId===o.id);return ps.length===2&&ps.every(p=>near(p.y,0))&&ps.some(p=>near(p.x,0))&&ps.some(p=>near(p.x,10));}),'actual datum rectangle bottom'),datum=one(i.points.filter(p=>p.parentId===bottom.id&&near(p.x,0)&&near(p.y,0)),'actual anchored datum point');
   const a=await append(faceId,'Circle',{c:{x:40,y:20},r:5}),b=await append(faceId,'Circle',{c:{x:45,y:25},r:3}),free=await append(faceId,'Point',{x:7,y:9}),now=await inspect(faceId);
   const centerA=one(now.points.filter(p=>p.parentId===a.id),'actual Circle A center'),centerB=one(now.points.filter(p=>p.parentId===b.id),'actual Circle B center'),unrelated=one(now.points.filter(p=>p.parentId===free.id),'actual unrelated Point');
   const binding={faceId,rectangle,bottomId:bottom.id,rectangleIds:i.objects.filter(o=>o.type==='Segment').map(o=>o.id),datumId:datum.id,aId:a.id,bId:b.id,aCenterId:centerA.id,bCenterId:centerB.id,unrelatedId:free.id,unrelatedPointId:unrelated.id};
   for(const [axis,distance]of [['x',40],['y',20]]){const q=await inspect(faceId);await call('apply-closed-sketch-signed-distance',{revision:q.revision,faceId,axis,ids:[datum.id,centerA.id],distance});}
   for(const [id,diameter]of [[a.id,10],[b.id,6]]){const q=await inspect(faceId);await call('apply-closed-sketch-diameter',{revision:q.revision,faceId,id,diameter});}
   const beforeConcentric=await inspect(faceId),created=await call('apply-closed-sketch-concentric',{revision:beforeConcentric.revision,faceId,ids:[a.id,b.id]});
   return Object.freeze({...binding,beforeConcentric,created});
  }),
  inspect:binding=>serial(()=>inspect(binding.faceId)),
  editX:(binding,value)=>serial(()=>dimension(binding,'SignedDistanceX',[binding.datumId,binding.aCenterId],value)),
  editY:(binding,value)=>serial(()=>dimension(binding,'SignedDistanceY',[binding.datumId,binding.aCenterId],value)),
  editB:(binding,value)=>serial(()=>dimension(binding,'DiameterLength',[binding.bId],value)),
  editRectangleWidth:(binding,value)=>serial(()=>dimension(binding,'SegmentLength',[binding.bottomId],value)),
  removeX:binding=>serial(()=>dimension(binding,'SignedDistanceX',[binding.datumId,binding.aCenterId],null,true)),
  incompatibleB:(binding,x,y)=>serial(async()=>{const i=await inspect(binding.faceId);return call('edit-closed-sketch-point',{revision:i.revision,faceId:binding.faceId,id:binding.bCenterId,x,y});}),
  definitions:definitions=>serial(async()=>{const i=await call('inspect-physical-parameters');return call('apply-physical-configurations',{revision:i.revision,definitions,configurations:[],activeId:null});}),
  parameters:()=>serial(()=>call('inspect-physical-parameters')),
  travel:direction=>serial(()=>agent.travel(direction)),save:path=>serial(()=>agent.save(path)),open:path=>serial(()=>agent.open(path))
 });
}

