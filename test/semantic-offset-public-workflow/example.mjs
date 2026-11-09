// Whole public source recipe; no source/model setters, schema executor or auto run.
export function createSemanticOffsetExample(agent){
 const call=(id,args={})=>agent.execute(id,args),one=(rows,label)=>{if(rows.length!==1)throw Error('One '+label+' required');return rows[0];};
 async function inspect(faceId){const i=await call('inspect-closed-sketches');return call('inspect-closed-sketch',{revision:i.revision,faceId});}
 async function inventory(faceId){const i=await call('inspect-closed-sketches');return call('inspect-sketch-offsets',{revision:i.revision,faceId});}
 async function plane(){const i=await call('inspect-sketch-creation');return call('create-empty-sketch-plane',{revision:i.revision,unit:'millimeter',plane:'XY',depth:0});}
 async function append(faceId,kind,data){const i=await call('inspect-closed-sketches');return call('append-sketch-primitive',{revision:i.revision,faceId,kind,role:null,stage:0,data});}
 async function build(){const control=await plane(),controlPoint=await append(control.faceId,'Point',{x:250,y:250}),p=await plane(),faceId=p.faceId,line=await append(faceId,'Segment',{a:{x:0,y:0},b:{x:10,y:0}}),circle=await append(faceId,'Circle',{c:{x:20,y:20},r:5}),q=await append(faceId,'Point',{x:77,y:99}),i=await inspect(faceId),points=i.points.filter(p=>p.parentId===line.primitive.id);return{faceId,controlFaceId:control.faceId,foreignRoot:controlPoint.primitive.id,lineId:line.primitive.id,aId:one(points.filter(p=>p.x===0&&p.y===0),'actual Segment start').id,bId:one(points.filter(p=>p.x===10&&p.y===0),'actual Segment end').id,circleId:circle.primitive.id,centerId:one(i.points.filter(p=>p.parentId===circle.primitive.id),'actual Circle center').id,unrelatedId:q.primitive.id};}
 async function create(b,sourceId,distance,side){const i=await inventory(b.faceId);return call('create-sketch-offset',{revision:i.revision,faceId:b.faceId,sourceId,distance,side});}
 async function edit(b,outputId,distance,side){const i=await inventory(b.faceId);return call('edit-sketch-offset',{revision:i.revision,faceId:b.faceId,outputId,distance,side});}
 async function remove(b,outputId){const i=await inventory(b.faceId);return call('remove-sketch-offset',{revision:i.revision,faceId:b.faceId,outputId});}
 async function move(b,points){const i=await inspect(b.faceId);return call('edit-closed-sketch-points',{revision:i.revision,faceId:b.faceId,points});}
 async function radius(b,radius){const i=await inspect(b.faceId);return call('apply-closed-sketch-radius',{revision:i.revision,faceId:b.faceId,id:b.circleId,radius});}
 async function physical(definitions){const i=await call('inspect-physical-parameters');return call('apply-physical-bindings',{revision:i.revision,changes:[],definitions});}
 async function units(lengthUnit){const i=await call('inspect-display-units');return call('set-display-units',{revision:i.revision,lengthUnit});}
 return Object.freeze({build,inspect,inventory,create,edit,remove,move,radius,physical,units});
}
