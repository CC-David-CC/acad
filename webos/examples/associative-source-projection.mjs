// Public recipe only. Start a normal New document; no raw source/model setters.
export function createAssociativeSourceProjectionExample(agent){
 const call=(command,args={})=>agent.execute(command,args),one=(rows,what)=>{if(rows.length!==1)throw Error('Expected one '+what);return rows[0];};
 async function source(faceId){const list=await call('inspect-closed-sketches');return call('inspect-closed-sketch',{revision:list.revision,faceId});}
 async function append(faceId,kind,data){const i=await source(faceId),r=await call('append-sketch-primitive',{revision:i.revision,faceId,kind,role:null,stage:i.stageCount-1,data});return r.primitive.id;}
 async function projection(featureId){const list=await call('inspect-source-projections');if(!list.ready)throw Error(list.reason);return{list,row:one(list.projections.filter(r=>r.featureId===featureId),'current projection producer')};}
 async function frame(featureId){const list=await call('inspect-source-frames');if(!list.ready)throw Error(list.reason);return{list,row:one(list.features.filter(r=>r.featureId===featureId),'current source frame')};}
 const basis=(z=5)=>({origin:[0,0,z],x:[1,0,0],y:[0,1,0],z:[0,0,1]});
 return Object.freeze({source,projection,
  async build(){const start=await call('inspect-source-frames');if(!start.ready||start.features.length)throw Error(start.reason||'Use a normal New document.');const parent=await call('create-source-frame',{revision:start.revision,unit:'millimeter',parent:null,placement:{kind:'basis',frame:basis()}});
   const segmentId=await append(parent.faceId,'Segment',{a:{x:0,y:0},b:{x:10,y:0}}),circleId=await append(parent.faceId,'Circle',{c:{x:20,y:20},r:5}),alternativeId=await append(parent.faceId,'Segment',{a:{x:2,y:5},b:{x:12,y:5}}),pointId=await append(parent.faceId,'Point',{x:7,y:9}),i=await source(parent.faceId),endpoint=one(i.points.filter(p=>p.parentId===segmentId&&p.x===10&&p.y===0),'actual selected endpoint');
   const list=await call('inspect-source-projections'),roots=await call('inspect-source-projection-roots',{revision:list.revision,featureId:parent.featureId,faceId:parent.faceId});for(const id of [segmentId,circleId,alternativeId])if(!one(roots.objects.filter(r=>r.id===id),'actual source root').canProject)throw Error('Source root is not eligible.');
   const current=await call('inspect-source-projections'),created=await call('create-source-projection',{revision:current.revision,sourceFeatureId:parent.featureId,sourceFaceId:parent.faceId,objectIds:[segmentId,circleId]});return{parent,segmentId,circleId,alternativeId,pointId,endpointId:endpoint.id,projection:created,referenceId:one(created.outputs.filter(r=>r.sourceObjectId===segmentId),'allocated Segment reference').referenceId};},
  async read(binding){const{list,row}=await projection(binding.projection.featureId);return call('read-source-projection',{revision:list.revision,index:row.index,featureId:row.featureId,faceId:row.faceId});},
  async place(binding,{depth=5,angleDegrees=0,translation=[0,0,0]}={}){const{list,row}=await frame(binding.parent.featureId);return call('edit-source-frame',{revision:list.revision,index:row.index,featureId:row.featureId,faceId:row.faceId,placement:{kind:'rigid',frame:basis(depth),axis:[0,0,1],angleDegrees,pivot:[0,0,0],translation}});},
  async endpoint(binding,x,y){const i=await source(binding.parent.faceId);return call('edit-closed-sketch-point',{revision:i.revision,faceId:binding.parent.faceId,id:binding.endpointId,x,y});},
  async radius(binding,radius){const i=await source(binding.parent.faceId);return call('apply-closed-sketch-radius',{revision:i.revision,faceId:binding.parent.faceId,id:binding.circleId,radius});},
  async repair(binding){const{list,row}=await projection(binding.projection.featureId);return call('repair-source-projection',{revision:list.revision,index:row.index,featureId:row.featureId,faceId:row.faceId,referenceId:binding.referenceId,sourceObjectId:binding.alternativeId});},
  async remove(binding){const{list,row}=await projection(binding.projection.featureId);return call('remove-source-projection',{revision:list.revision,index:row.index,featureId:row.featureId,faceId:row.faceId});}
 });
}
