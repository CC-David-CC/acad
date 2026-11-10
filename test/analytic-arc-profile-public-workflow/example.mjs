// Genuine shared public commands only; IDs come from actual replies/inspection.
const one=(xs,label)=>{if(!Array.isArray(xs)||xs.length!==1)throw Error('One '+label+' required');return xs[0];};
export const IDENTITY_FRAME=Object.freeze({origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]});
export function createAnalyticProfileExample(agent,{engineRevision}={}){
 if(typeof agent?.execute!=='function'||!/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/.test(engineRevision))throw Error('Use the actual advertised analytic revision/public executor.');
 const call=(command,args={})=>agent.execute(command,args);
 async function inspect(faceId){const i=await call('inspect-closed-sketches');return call('inspect-closed-sketch',{revision:i.revision,faceId});}
 async function append(faceId,kind,data,role=null){const i=await inspect(faceId);return call('append-sketch-primitive',{revision:i.revision,faceId,stage:i.stageCount-1,role,kind,data});}
 async function plane(frame=IDENTITY_FRAME){const i=await call('inspect-source-frames');return call('create-source-frame',{revision:i.revision,unit:'millimeter',parent:null,placement:{kind:'basis',frame}});}
 async function source(kind,options={}){
  const frame=structuredClone(options.frame||IDENTITY_FRAME),created=await plane(frame),faceId=created.faceId,curves=[];
  const add=async(type,data,role=null)=>{const r=await append(faceId,type,data,role);curves.push({id:r.primitive.id,type,data:structuredClone(data),role});return r;};
  let slot=null;const radius=options.radius??5;
  if(kind==='slot'){const i=await inspect(faceId);slot=await call('create-closed-sketch-slot',{revision:i.revision,faceId,a:{x:0,y:0},b:{x:20,y:0},radius:3});const now=await inspect(faceId);for(const id of slot.slot.members){const row=one(now.objects.filter(o=>o.id===id),'genuine Slot member');curves.push({id,type:row.type,role:row.role});}}
  else if(kind==='notch'){for(const[a,b]of [[[0,0],[10,0]],[[10,0],[10,10]],[[10,10],[7,10]],[[3,10],[0,10]],[[0,10],[0,0]]])await add('Segment',{a:{x:a[0],y:a[1]},b:{x:b[0],y:b[1]}});await add('Arc',{a:{x:3,y:10},b:{x:7,y:10},c:{x:5,y:10},branch:'proper-ccw'});}
  else if(kind==='full')await add('Arc',{a:{x:radius,y:0},b:{x:radius,y:0},c:{x:0,y:0},branch:'full-ccw'});
  else{
   const a=options.a||{x:radius,y:0},b=options.b||(options.major?{x:0,y:-radius}:{x:-radius,y:0}),c=options.c||{x:0,y:0};
   await add('Arc',{a,b,c,branch:'proper-ccw'});await add('Segment',{a,b:options.open?{x:b.x+1,y:b.y}:b});
  }
  const control=await plane({...structuredClone(IDENTITY_FRAME),origin:[100,100,0]}),point=await append(control.faceId,'Point',{x:7,y:9});
  return{kind,source:created,faceId,curves,slot,control:{source:control,faceId:control.faceId,pointId:point.primitive.id},frame};
 }
 async function discovery(b,depth){const i=await call('inspect-selected-profiles',{engineRevision});if(!i.ready||i.analyticProfileVersion!==1)throw Error(i.reason||'Actual analytic cohort is unavailable');return call('inspect-selected-regions',{revision:i.revision,faceId:b.faceId,depth,engineRevision});}
 async function create(b,depth){
  const i=await discovery(b,depth),active=b.curves.filter(c=>c.role!=='construction').map(c=>c.id),region=one(i.regions.filter(r=>r.support==='supported'&&r.descriptor.holeCurveIds.length===0&&r.descriptor.outerCurveIds.length===active.length&&r.descriptor.outerCurveIds.every(id=>active.includes(id))),'complete actual analytic boundary');
  const profile=await call('create-selected-extrusion',{revision:i.revision,faceId:b.faceId,regionId:region.regionId,unit:'millimeter',engine:'occ',engineRevision,depth,bodyPolicy:'separate'});
  return{...b,regionId:region.regionId,profile,depth};
 }
 async function radius(b,radius){
  if(b.kind!=='semicircle')throw Error('This endpoint operation is only the explicit original semicircle.');
  const i=await inspect(b.faceId),arc=one(b.curves.filter(c=>c.type==='Arc'),'actual Arc'),line=one(b.curves.filter(c=>c.type==='Segment'),'actual chord');
  const owned=id=>i.points.filter(p=>p.parentId===id),ap=owned(arc.id),lp=owned(line.id);if(ap.length!==3||lp.length!==2)throw Error('Actual endpoint ownership changed');
  const right=ps=>one(ps.filter(p=>p.x>5e-8&&Math.abs(p.y)<=5e-8),'actual positive endpoint'),left=ps=>one(ps.filter(p=>p.x< -5e-8&&Math.abs(p.y)<=5e-8),'actual negative endpoint'),center=one(ap.filter(p=>Math.hypot(p.x,p.y)<=5e-8),'actual center');
  const selected=[right(ap),left(ap),right(lp),left(lp)];
  return call('edit-closed-sketch-points',{revision:i.revision,faceId:b.faceId,points:[...selected.map((p,k)=>({id:p.id,x:k%2?-radius:radius,y:0})),{id:center.id,x:0,y:0}]});
 }

 async function editSlot(b,intent){const i=await inspect(b.faceId);return call('edit-closed-sketch-slot',{revision:i.revision,faceId:b.faceId,slotId:b.slot.slot.slotId,...intent});}
 async function move(b,origin){const i=await call('inspect-source-frames'),row=one(i.features.filter(f=>f.featureId===b.source.featureId&&f.faceId===b.faceId),'actual original source frame');const frame={...structuredClone(IDENTITY_FRAME),origin};return call('edit-source-frame',{revision:i.revision,index:row.index,featureId:row.featureId,faceId:row.faceId,placement:{kind:'basis',frame}});}
 return Object.freeze({source,plane,append,inspect,discovery,create,radius,editSlot,move,call,
 travel:async direction=>{const i=await call('inspect-authored-edits');return call('travel-authored-edit',{revision:i.revision,direction});}});
}
