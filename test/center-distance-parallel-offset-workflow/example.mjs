// User-invoked public-registry recipe; no private model/schema/source executor.
export const definitions=(spacing=5,offset=2)=>[
 {name:'centerSpacing',dimension:'length',expression:`mm(${spacing})`},
 {name:'lineOffset',dimension:'length',expression:`mm(${offset})`},
 {name:'spare',dimension:'length',expression:'mm(7)'}
];
export function createCenterOffsetExample(agent){
 const call=(id,args={})=>agent.execute(id,args),one=(xs,label)=>{if(xs.length!==1)throw Error('One '+label+' required');return xs[0];};
 async function inspect(faceId){const i=await call('inspect-closed-sketches');return call('inspect-closed-sketch',{revision:i.revision,faceId});}
 async function append(faceId,kind,data){const i=await call('inspect-closed-sketches');return call('append-sketch-primitive',{revision:i.revision,faceId,kind,role:null,stage:0,data});}
 async function plane(){const i=await call('inspect-sketch-creation');return call('create-empty-sketch-plane',{revision:i.revision,unit:'millimeter',plane:'XY',depth:0});}
 async function signed(b,axis,id,value){const i=await inspect(b.faceId);return call('apply-closed-sketch-signed-distance',{revision:i.revision,faceId:b.faceId,axis,ids:[b.datumId,id],distance:value-100});}
 async function orientation(b,kind,ids){const i=await inspect(b.faceId);return call('apply-closed-sketch-orientation',{revision:i.revision,faceId:b.faceId,kind,ids});}
 async function coincide(b,ids){const i=await inspect(b.faceId);return call('apply-closed-sketch-coincidence',{revision:i.revision,faceId:b.faceId,ids});}
 const refs=(b,type)=>type==='DistancePP'?b.centers:type==='DistancePL'?[b.l1.a,b.l0.root]:null;
 async function target(b,type,objects=refs(b,type)){const i=await inspect(b.faceId),row=one(i.dimensionTargets.filter(row=>row.typeId===type&&row.canEdit&&row.canRemove&&JSON.stringify(row.objects)===JSON.stringify(objects)),'current '+type+' target');return {i,row};}
 async function edit(b,type,value,objects){const {i,row}=await target(b,type,objects);return call('edit-closed-sketch-dimension',{revision:i.revision,faceId:b.faceId,constraintId:row.constraintId,value});}
 async function remove(b,type,objects){const {i,row}=await target(b,type,objects);return call('remove-closed-sketch-dimension',{revision:i.revision,faceId:b.faceId,constraintId:row.constraintId});}
 async function distance(b,value=5){const i=await inspect(b.faceId);return call('apply-closed-sketch-point-distance',{revision:i.revision,faceId:b.faceId,ids:b.centers,distance:value});}
 async function offset(b,value=2){const i=await inspect(b.faceId);return call('apply-closed-sketch-point-line-distance',{revision:i.revision,faceId:b.faceId,pointId:b.l1.a,lineId:b.l0.root,distance:value,inverted:false});}
 async function physical(value){const i=await call('inspect-physical-parameters');return call('apply-physical-bindings',{revision:i.revision,changes:[],definitions:value});}
 async function units(lengthUnit){const i=await call('inspect-display-units');return call('set-display-units',{revision:i.revision,lengthUnit});}
 async function build(){
  const control=await plane(),controlPoint=await append(control.faceId,'Point',{x:250,y:250}),ci=await inspect(control.faceId),foreignPoint=one(ci.points.filter(p=>p.parentId===controlPoint.primitive.id),'actual other-source Point');
  const ready=await call('inspect-rectangle-creation');if(!ready.ready)throw Error(ready.reason);
  const made=await call('create-rectangle-sketch',{revision:ready.revision,unit:'millimeter',origin:[100,100],width:10,height:10,depth:0}),faceId=made.faceId,rectangle=await inspect(faceId),lock=one(rectangle.constraints.filter(c=>c.typeId==='LockPoint'&&Number(c.constants.x)===100&&Number(c.constants.y)===100),'actual rectangle datum lock'),datum=one(rectangle.points.filter(p=>p.id===lock.objects[0]),'actual locked datum');
  const b={faceId,datumId:datum.id,rectangleIds:rectangle.objects.map(o=>o.id),controlFaceId:control.faceId,controlPointId:controlPoint.primitive.id,foreignPointId:foreignPoint.id,circleIds:[],centers:[]};
  for(const [c,r]of [[{x:0,y:0},1],[{x:3,y:4},2]]){const made=await append(faceId,'Circle',{c,r}),i=await inspect(faceId),p=one(i.points.filter(p=>p.parentId===made.primitive.id),'actual Circle center child');b.circleIds.push(made.primitive.id);b.centers.push(p.id);}
  async function segment(a,z){const made=await append(faceId,'Segment',{a:{x:a[0],y:a[1]},b:{x:z[0],y:z[1]}}),i=await inspect(faceId),ps=i.points.filter(p=>p.parentId===made.primitive.id);return {root:made.primitive.id,a:one(ps.filter(p=>p.x===a[0]&&p.y===a[1]),'actual owned start').id,b:one(ps.filter(p=>p.x===z[0]&&p.y===z[1]),'actual owned end').id};}
  b.reference=await segment([0,10],[3,14]);b.connector=await segment([0,0],[3,4]);b.l0=await segment([0,0],[10,0]);b.l1=await segment([0,2],[10,2]);b.unrelated=(await append(faceId,'Point',{x:70,y:70})).primitive.id;
  for(const [id,x,y]of [[b.centers[0],0,0],[b.reference.a,0,10],[b.reference.b,3,14]])for(const [axis,value]of [['x',x],['y',y]])await signed(b,axis,id,value);
  await coincide(b,[b.centers[0],b.connector.a]);await coincide(b,[b.centers[1],b.connector.b]);await orientation(b,'parallel',[b.reference.root,b.connector.root]);
  await signed(b,'x',b.l0.a,0);await signed(b,'y',b.l0.a,0);await signed(b,'x',b.l0.b,10);await orientation(b,'horizontal',[b.l0.root]);
  await signed(b,'x',b.l1.a,0);await signed(b,'x',b.l1.b,10);await orientation(b,'parallel',[b.l0.root,b.l1.root]);
  return b;
 }
 return Object.freeze({build,inspect,target,edit,remove,distance,offset,signed,physical,units});
}
