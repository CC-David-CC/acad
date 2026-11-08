// Complete public example; inject the real document-bound createCadAgent.
export function createOrientationExample(agent){
 if(!agent||!['execute','inspect','travel'].every(k=>typeof agent[k]==='function'))throw Error('Supply a current public CAD agent helper.');
 const call=(id,args={})=>agent.execute(id,args),one=(rows,label)=>{if(rows.length!==1)throw Error('Expected one '+label);return rows[0];},near=(a,b)=>Math.abs(a-b)<=1e-6;
 async function inspect(faceId){const list=await call('inspect-closed-sketches');if(!list.ready||!list.candidates.some(c=>c.faceId===faceId))throw Error('The source face is unavailable.');return call('inspect-closed-sketch',{revision:list.revision,faceId});}
 async function append(binding,kind,data){const i=await inspect(binding.faceId),r=await call('append-sketch-primitive',{revision:i.revision,faceId:binding.faceId,kind,role:null,stage:i.stageCount-1,data}),after=await inspect(binding.faceId);return one(after.objects.filter(o=>o.id===r.primitive.id&&o.type===kind),'actual appended '+kind);}
 async function lock(binding,id,x,y){for(const [axis,distance]of[['x',x],['y',y]]){const i=await inspect(binding.faceId);await call('apply-closed-sketch-signed-distance',{revision:i.revision,faceId:binding.faceId,axis,ids:[binding.datumId,id],distance});}}
 let busy=false;const serial=async work=>{if(busy)throw Error('Wait for the current orientation example operation.');busy=true;try{return await work();}finally{busy=false;}};
 const methods={
  begin:async()=>{const d=await agent.inspect();if(d.path||d.dirty||d.operationCount||d.sketchCount)throw Error('Use a new empty project.');const ready=await call('inspect-rectangle-creation'),r=await call('create-rectangle-sketch',{revision:ready.revision,unit:'millimeter',origin:[0,0],width:10,height:10,depth:0}),i=await inspect(r.faceId),bottom=one(i.objects.filter(o=>o.type==='Segment').filter(o=>{const p=i.points.filter(p=>p.parentId===o.id);return p.length===2&&p.every(p=>near(p.y,0))&&p.some(p=>near(p.x,0))&&p.some(p=>near(p.x,10));}),'datum bottom');
   const datum=one(i.points.filter(p=>p.parentId===bottom.id&&near(p.x,0)&&near(p.y,0)),'actual datum point'),binding={faceId:r.faceId,rectangleIds:i.objects.filter(o=>o.type==='Segment').map(o=>o.id),bottomId:bottom.id,datumId:datum.id};const free=await append(binding,'Point',{x:7,y:9}),j=await inspect(binding.faceId);return Object.freeze({...binding,unrelatedId:free.id,unrelatedPointId:one(j.points.filter(p=>p.parentId===free.id),'unrelated Point').id});},
  inspect:binding=>inspect(binding.faceId),
  segment:async(binding,{a,b,locked=false})=>{const o=await append(binding,'Segment',{a:{x:a[0],y:a[1]},b:{x:b[0],y:b[1]}}),i=await inspect(binding.faceId),ps=i.points.filter(p=>p.parentId===o.id),pa=one(ps.filter(p=>near(p.x,a[0])&&near(p.y,a[1])),'authored Segment start'),pb=one(ps.filter(p=>near(p.x,b[0])&&near(p.y,b[1])),'authored Segment end');if(pa.id===pb.id)throw Error('Distinct endpoints are required.');await lock(binding,pa.id,a[0],a[1]);if(locked)await lock(binding,pb.id,b[0],b[1]);else{const j=await inspect(binding.faceId);await call('apply-closed-sketch-length-relation',{revision:j.revision,faceId:binding.faceId,ids:[o.id,binding.bottomId],factor:0,offset:Math.hypot(b[0]-a[0],b[1]-a[1])});}return Object.freeze({id:o.id,aId:pa.id,bId:pb.id,a:[...a],b:[...b],length:Math.hypot(b[0]-a[0],b[1]-a[1]),locked});},
  orientation:async(binding,kind,ids)=>{const i=await inspect(binding.faceId);return call('apply-closed-sketch-orientation',{revision:i.revision,faceId:binding.faceId,kind,ids});},
  orientationAt:(binding,revision,kind,ids)=>call('apply-closed-sketch-orientation',{revision,faceId:binding.faceId,kind,ids}),
  end:async(binding,segment,x,y)=>{const i=await inspect(binding.faceId);return call('edit-closed-sketch-points',{revision:i.revision,faceId:binding.faceId,points:[{id:segment.bId,x,y}]});},
  lockEndX:async(binding,segment,x)=>{const i=await inspect(binding.faceId);return call('apply-closed-sketch-signed-distance',{revision:i.revision,faceId:binding.faceId,axis:'x',ids:[binding.datumId,segment.bId],distance:x});},
  zero:binding=>append(binding,'Segment',{a:{x:600,y:0},b:{x:600,y:0}}),
  travel:direction=>agent.travel(direction)
 };
 return Object.freeze(Object.fromEntries(Object.entries(methods).map(([name,work])=>[name,(...args)=>serial(()=>work(...args))])));
}
